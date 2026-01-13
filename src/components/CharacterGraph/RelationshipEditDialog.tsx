/**
 * RelationshipEditDialog - 관계 편집/삭제 다이얼로그
 * 캐릭터 간 관계의 타입, 강도, 설명을 수정하거나 관계를 삭제할 수 있는 모달
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@stolink/ui";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUpdateRelationship,
  useDeleteRelationship,
} from "@/hooks/useRelationships";
import { useToast } from "@/hooks/useToast";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  Save,
  Loader2,
  Trash2,
  AlertTriangle,
} from "lucide-react";
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

export interface RelationshipEditData {
  id: string;
  sourceId: string;
  targetId: string;
  sourceName: string;
  targetName: string;
  types: RelationType[];
  strength: number;
  description?: string;
}

interface RelationshipEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  relationship: RelationshipEditData | null;
  projectId: string;
  onSuccess?: () => void;
  onDelete?: () => void;
}

export function RelationshipEditDialog({
  isOpen,
  onClose,
  relationship,
  projectId,
  onSuccess,
  onDelete,
}: RelationshipEditDialogProps) {
  const { toast } = useToast();
  const updateRelationship = useUpdateRelationship(projectId);
  const deleteRelationship = useDeleteRelationship(projectId);

  // Local form state
  const [selectedType, setSelectedType] = useState<RelationType>("NEUTRAL");
  const [strength, setStrength] = useState<number>(5);
  const [description, setDescription] = useState<string>("");

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync form state when relationship changes
  useEffect(() => {
    if (relationship) {
      // eslint-disable-next-line
      setSelectedType(relationship.types[0] || "NEUTRAL");
      setStrength(relationship.strength);
      setDescription(relationship.description || "");
    }
  }, [relationship]);

  const handleSave = useCallback(async () => {
    if (!relationship) return;

    try {
      await updateRelationship.mutateAsync({
        id: relationship.id,
        payload: {
          types: [selectedType],
          strength,
          description: description.trim() || undefined,
        },
      });

      toast({
        variant: "success",
        title: "관계 수정 완료",
        description: `${relationship.sourceName}와 ${relationship.targetName}의 관계가 업데이트되었습니다.`,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to update relationship:", error);
      toast({
        variant: "destructive",
        title: "수정 실패",
        description: "관계 정보를 저장하는 중 오류가 발생했습니다.",
      });
    }
  }, [
    relationship,
    selectedType,
    strength,
    description,
    updateRelationship,
    toast,
    onSuccess,
    onClose,
  ]);

  const handleDelete = useCallback(async () => {
    if (!relationship) return;

    try {
      await deleteRelationship.mutateAsync(relationship.id);

      toast({
        variant: "success",
        title: "관계 삭제 완료",
        description: `${relationship.sourceName}와 ${relationship.targetName} 사이의 연결이 삭제되었습니다.`,
      });

      setShowDeleteConfirm(false);
      onDelete?.();
      onClose();
    } catch (error) {
      console.error("Failed to delete relationship:", error);
      toast({
        variant: "destructive",
        title: "삭제 실패",
        description: "관계를 삭제하는 중 오류가 발생했습니다.",
      });
    }
  }, [relationship, deleteRelationship, toast, onDelete, onClose]);

  if (!relationship) return null;

  const selectedOption = RELATION_TYPE_OPTIONS.find(
    (opt) => opt.value === selectedType,
  );

  const isPending =
    updateRelationship.isPending || deleteRelationship.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md bg-paper border-cloud-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-espresso-900 flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-mocha-500" />
              관계 편집
            </DialogTitle>
            <DialogDescription className="text-espresso-600">
              두 캐릭터 간의 관계를 수정하거나 삭제합니다.
            </DialogDescription>
          </DialogHeader>

          {/* Character Names */}
          <div className="flex items-center justify-center gap-4 py-4 px-2 bg-cloud-50 rounded-xl border border-cloud-100">
            <div className="text-center">
              <p className="font-semibold text-espresso-900 text-lg">
                {relationship.sourceName}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-mocha-100">
              <ArrowLeftRight className="h-4 w-4 text-mocha-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-espresso-900 text-lg">
                {relationship.targetName}
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
                onValueChange={(value) =>
                  setSelectedType(value as RelationType)
                }
              >
                <SelectTrigger className="bg-white border-cloud-200 hover:border-mocha-300 transition-colors">
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
                          className={cn(
                            "w-2.5 h-2.5 rounded-full",
                            option.color,
                          )}
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
                <span className="text-mocha-500 font-bold">
                  ({strength}/10)
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={strength}
                  onChange={(e) => setStrength(Number(e.target.value))}
                  className="flex-1 h-2 bg-cloud-100 rounded-lg appearance-none cursor-pointer accent-mocha-500"
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

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-espresso-700 font-medium">
                설명 (선택)
              </Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="두 캐릭터 간의 관계에 대한 추가 설명..."
                className="min-h-[80px] bg-white border-cloud-200 focus:border-mocha-400 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            {/* Delete Button - Left aligned */}
            <Button
              intent="ghost"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              연결 삭제
            </Button>

            {/* Cancel/Save - Right aligned */}
            <div className="flex gap-2">
              <Button
                intent="ghost"
                onClick={onClose}
                disabled={isPending}
                className="text-espresso-600"
              >
                취소
              </Button>
              <Button
                intent="primary"
                onClick={handleSave}
                disabled={isPending}
                className="bg-mocha-500 hover:bg-mocha-600"
              >
                {updateRelationship.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-paper border-cloud-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              관계 삭제 확인
            </AlertDialogTitle>
            <AlertDialogDescription className="text-espresso-600">
              <strong>{relationship.sourceName}</strong>와{" "}
              <strong>{relationship.targetName}</strong> 사이의 연결을
              삭제하시겠습니까?
              <br />
              <span className="text-red-500 text-sm mt-2 block">
                이 작업은 되돌릴 수 없습니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleteRelationship.isPending}
              className="border-cloud-200"
            >
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteRelationship.isPending}
              variant="destructive"
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteRelationship.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  삭제 중...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default RelationshipEditDialog;
