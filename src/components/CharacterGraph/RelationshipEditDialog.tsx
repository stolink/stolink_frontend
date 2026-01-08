import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@stolink/ui";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DetailedRelationship } from "@/types/character";
import type { RelationType } from "@/types/character";
import { useUpdateRelationship } from "@/hooks/useRelationships";
import { Loader2 } from "lucide-react";

interface RelationshipEditDialogProps {
  relationship: DetailedRelationship | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  sourceName?: string;
  targetName?: string;
  projectId: string; // Required for mutation
}

export function RelationshipEditDialog({
  relationship,
  isOpen,
  onClose,
  onSave,
  sourceName,
  targetName,
  projectId,
}: RelationshipEditDialogProps) {
  const [type, setType] = useState<RelationType | string>(
    relationship?.relationType || relationship?.type || "neutral",
  );
  const [strength, setStrength] = useState<number>(relationship?.strength || 5);
  const [description, setDescription] = useState<string>(
    relationship?.description || "",
  );
  const [bidirectional, setBidirectional] = useState<boolean>(
    relationship?.bidirectional || false,
  );

  // Mutation
  const { mutate: updateRelationship, isPending } =
    useUpdateRelationship(projectId);

  if (!relationship) return null;

  const handleSave = () => {
    if (!relationship.id) return;

    updateRelationship(
      {
        id: relationship.id,
        payload: {
          sourceId: relationship.source,
          targetId: relationship.target,
          type: type as RelationType,
          strength,
          // description and bidirectional might need to go into extras or specific fields depending on API
          // Based on CreateRelationshipInput: type, strength, extras.
          // But relationshipService defines Relationship with description, bidirectional.
          // And useUpdateRelationship takes Partial<CreateRelationshipInput>.
          // Let's assume the API handles description/bidirectional at top level if the type supports it,
          // or we put it in extras.
          // relationshipService.ts: Relationship interface has description, bidirectional.
          // CreateRelationshipInput has extras.
          // But backend likely maps fields. I'll put description in body and extras just in case.
          // Actually, let's look at relationshipService.create payload: CreateRelationshipInput.
          // It has extras.
          // I'll try to pass description/bidirectional as part of payload casted or Extras.
          // Ideally the API accepts them.
          // checking relationshipService.ts again...
          // CreateRelationshipInput has sourceId, targetId, type, strength, extras.
          // It does NOT have description/bidirectional explicitly.
          // So these likely go into extras.
          extras: {
            description,
            bidirectional,
          },
        },
      },
      {
        onSuccess: () => {
          onSave?.();
          onClose();
        },
        onError: (error) => {
          console.error("Failed to update relationship", error);
          // Optionally show toast
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>관계 수정</DialogTitle>
          <DialogDescription>
            {sourceName} & {targetName}의 관계를 수정합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label>관계 유형</Label>
            <Select
              value={type}
              onValueChange={(val) => setType(val as RelationType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="관계 유형 선택" />
              </SelectTrigger>
              <SelectContent>
                {/* We need a list of relation types. using Constants or hardcoded */}
                <SelectItem value="friendly">Friendly (우호적)</SelectItem>
                <SelectItem value="hostile">Hostile (적대적)</SelectItem>
                <SelectItem value="romantic">Romantic (로맨틱)</SelectItem>
                <SelectItem value="family">Family (자매/형제/가족)</SelectItem>
                <SelectItem value="neutral">Neutral (중립)</SelectItem>
                <SelectItem value="ally">Ally (동맹)</SelectItem>
                <SelectItem value="rival">Rival (라이벌)</SelectItem>
                <SelectItem value="enemy">Enemy (적)</SelectItem>
                <SelectItem value="mentor">Mentor (멘토)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label>관계 강도: {strength}</Label>
              <span className="text-xs text-muted-foreground">
                1 (약함) - 10 (강함)
              </span>
            </div>
            {/* Slider is not in @stolink/ui imports in my prompt, replacing with Input type range if Slider missing
                Actually, I'll use a standard HTML range input styled or check if Slider is available in basic ui.
                I'll use a wrapper div with input range.
            */}
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className="w-full accent-mocha-500 h-2 bg-cloud-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="grid gap-2">
            <Label>관계 설명</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="관계에 대한 상세 설명을 입력하세요."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="bidirectional"
              checked={bidirectional}
              onCheckedChange={setBidirectional}
            />
            <Label htmlFor="bidirectional">상호 관계 (양방향)</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending}
            className="bg-mocha-500 hover:bg-mocha-600"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
