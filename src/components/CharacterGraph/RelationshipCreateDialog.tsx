/**
 * RelationshipCreateDialog - 새 관계 생성 다이얼로그
 * 두 캐릭터 사이에 새로운 관계를 추가하는 모달
 */

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@stolink/ui";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRelationship } from "@/hooks/useRelationships";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import { Link2, Plus, Loader2 } from "lucide-react";
import type { RelationType } from "@/types/character";

// 관계 타입 옵션
const RELATION_TYPE_OPTIONS: {
  value: RelationType;
  label: string;
  color: string;
}[] = [
  { value: "ALLY", label: "동맹", color: "bg-green-500" },
  { value: "RIVAL", label: "라이벌", color: "bg-amber-500" },
  { value: "NEUTRAL", label: "중립", color: "bg-gray-400" },
  { value: "ROMANTIC", label: "연인", color: "bg-pink-500" },
  { value: "ENEMY", label: "적대", color: "bg-red-500" },
  { value: "MENTOR", label: "멘토", color: "bg-blue-500" },
  { value: "FAMILY", label: "가족", color: "bg-purple-500" },
  { value: "MASTER_SERVANT", label: "주종", color: "bg-indigo-500" },
  { value: "COWORKER", label: "동료", color: "bg-teal-500" },
  { value: "COMPLEX", label: "복합", color: "bg-slate-600" },
];

// 강도 옵션
const STRENGTH_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}`,
}));

export interface RelationshipCreateData {
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
}

interface RelationshipCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: RelationshipCreateData | null;
  projectId: string;
  onSuccess?: () => void;
}

export function RelationshipCreateDialog({
  isOpen,
  onClose,
  data,
  projectId,
  onSuccess,
}: RelationshipCreateDialogProps) {
  const { toast } = useToast();
  const createRelationship = useCreateRelationship(projectId);

  // Form state
  const [selectedType, setSelectedType] = useState<RelationType>("NEUTRAL");
  const [strength, setStrength] = useState<number>(5);
  const [description, setDescription] = useState<string>("");
  const [bidirectional, setBidirectional] = useState<boolean>(true);

  // Reset form when dialog opens with new data
  const resetForm = useCallback(() => {
    setSelectedType("NEUTRAL");
    setStrength(5);
    setDescription("");
    setBidirectional(true);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!data) return;

    try {
      await createRelationship.mutateAsync({
        sourceId: data.sourceId,
        targetId: data.targetId,
        types: [selectedType],
        strength,
        description: description.trim() || undefined,
        bidirectional,
      });

      toast({
        variant: "success",
        title: "관계 생성 완료",
        description: `${data.sourceName}와 ${data.targetName} 사이에 새로운 연결이 추가되었습니다.`,
      });

      resetForm();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to create relationship:", error);
      toast({
        variant: "destructive",
        title: "생성 실패",
        description: "새 관계를 생성하는 중 오류가 발생했습니다.",
      });
    }
  }, [
    data,
    selectedType,
    strength,
    description,
    bidirectional,
    createRelationship,
    toast,
    resetForm,
    onSuccess,
    onClose,
  ]);

  if (!data) return null;

  const selectedOption = RELATION_TYPE_OPTIONS.find(
    (opt) => opt.value === selectedType,
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-paper border-cloud-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-espresso-900 flex items-center gap-2">
            <Link2 className="h-5 w-5 text-green-500" />새 관계 생성
          </DialogTitle>
          <DialogDescription className="text-espresso-600">
            두 캐릭터 사이에 새로운 연결을 추가합니다.
          </DialogDescription>
        </DialogHeader>

        {/* Character Names */}
        <div className="flex items-center justify-center gap-4 py-4 px-2 bg-green-50 rounded-xl border border-green-100">
          <div className="text-center">
            <p className="font-semibold text-espresso-900 text-lg">
              {data.sourceName}
            </p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
            <Link2 className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-espresso-900 text-lg">
              {data.targetName}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5 py-2">
          {/* Relation Type */}
          <div className="space-y-2">
            <Label className="text-espresso-700 font-medium">관계 유형</Label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as RelationType)}
            >
              <SelectTrigger className="bg-white border-cloud-200 hover:border-green-300 transition-colors">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        selectedOption?.color || "bg-gray-400",
                      )}
                    />
                    {selectedOption?.label || "선택"}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="z-[200]">
                {RELATION_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("w-2.5 h-2.5 rounded-full", option.color)}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Strength */}
          <div className="space-y-2">
            <Label className="text-espresso-700 font-medium">
              관계 강도{" "}
              <span className="text-green-600 font-bold">({strength}/10)</span>
            </Label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="flex-1 h-2 bg-cloud-100 rounded-lg appearance-none cursor-pointer accent-green-500"
              />
              <Select
                value={String(strength)}
                onValueChange={(value) => setStrength(Number(value))}
              >
                <SelectTrigger className="w-16 bg-white border-cloud-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[200]">
                  {STRENGTH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bidirectional Toggle */}
          <div className="flex items-center justify-between py-2 px-3 bg-cloud-50 rounded-lg border border-cloud-100">
            <div>
              <Label className="text-espresso-700 font-medium">
                양방향 관계
              </Label>
              <p className="text-xs text-espresso-500 mt-0.5">
                활성화 시 두 캐릭터 모두에게 동일한 관계가 적용됩니다
              </p>
            </div>
            <Switch checked={bidirectional} onChange={setBidirectional} />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-espresso-700 font-medium">설명 (선택)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="두 캐릭터 간의 관계에 대한 추가 설명..."
              className="min-h-[80px] bg-white border-cloud-200 focus:border-green-400 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            intent="ghost"
            onClick={onClose}
            disabled={createRelationship.isPending}
            className="text-espresso-600"
          >
            취소
          </Button>
          <Button
            intent="primary"
            onClick={handleCreate}
            disabled={createRelationship.isPending}
            className="bg-green-500 hover:bg-green-600"
          >
            {createRelationship.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                연결 생성
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RelationshipCreateDialog;
