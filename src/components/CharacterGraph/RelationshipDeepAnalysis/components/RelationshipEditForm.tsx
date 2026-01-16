// =====================================================
// 관계 편집 폼 컴포넌트
// Phase 1 컴포넌트들을 조합하여 편집 UI 제공
// =====================================================

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { Button } from "@stolink/ui";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toUIRelationType } from "@/components/CharacterGraph/constants";
import type { UIRelationType } from "@/components/CharacterGraph/constants";
import { RelationshipTypeSelector } from "./RelationshipTypeSelector";
import { StrengthSlider } from "./StrengthSlider";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

export interface RelationshipEditData {
  types: UIRelationType[];
  strength: number;
  bidirectional: boolean;
  description: string;
}

interface RelationshipEditFormProps {
  initialData: RelationshipEditData;
  sourceName: string;
  targetName: string;
  onSave: (data: RelationshipEditData) => void;
  onCancel: () => void;
  onDelete: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
}

export function RelationshipEditForm({
  initialData,
  sourceName,
  targetName,
  onSave,
  onCancel,
  onDelete,
  isSaving = false,
  isDeleting = false,
}: RelationshipEditFormProps) {
  const [types, setTypes] = useState<UIRelationType[]>(
    initialData.types.map((t) => toUIRelationType(t)),
  );
  const [strength, setStrength] = useState(initialData.strength);
  const [bidirectional, setBidirectional] = useState(initialData.bidirectional);
  const [description, setDescription] = useState(initialData.description);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const isValid = types.length > 0;

  const handleSave = useCallback(() => {
    if (!isValid) return;
    onSave({ types, strength, bidirectional, description });
  }, [types, strength, bidirectional, description, isValid, onSave]);

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(false);
    onDelete();
  }, [onDelete]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-xl space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-espresso-100 pb-6">
          <div>
            <h3 className="text-lg font-bold text-espresso-900">관계 수정</h3>
            <p className="text-sm text-espresso-500 mt-1">
              <span className="font-medium">{sourceName}</span>
              {" ↔ "}
              <span className="font-medium">{targetName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            className={cn(
              "p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-rose-300",
            )}
            title="관계 삭제"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-8">
          {/* 1. 관계 유형 선택 */}
          <RelationshipTypeSelector
            selectedTypes={types}
            onChange={setTypes}
            disabled={isSaving}
          />

          {/* 2. 관계 강도 */}
          <StrengthSlider
            value={strength}
            onChange={setStrength}
            disabled={isSaving}
          />

          {/* 3. 양방향 여부 */}
          <div className="flex items-center justify-between p-4 bg-cloud-50 rounded-2xl">
            <div>
              <label className="text-sm font-bold text-espresso-700">
                양방향 관계
              </label>
              <p className="text-xs text-espresso-400 mt-0.5">
                두 캐릭터가 서로 동일한 관계를 가집니다
              </p>
            </div>
            <Switch
              checked={bidirectional}
              onChange={setBidirectional}
              disabled={isSaving}
            />
          </div>

          {/* 4. 설명 */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-espresso-700">설명</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="이 관계에 대한 설명을 입력하세요..."
              className="min-h-[100px] resize-none bg-cloud-50 border-cloud-200 focus:border-mocha-400 rounded-xl"
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-espresso-100">
          <Button
            intent="ghost"
            onClick={onCancel}
            disabled={isSaving || isDeleting}
          >
            취소
          </Button>
          <Button
            intent="primary"
            onClick={handleSave}
            disabled={!isValid || isSaving || isDeleting}
            isLoading={isSaving}
            loadingText="저장 중..."
            className="bg-mocha-500 hover:bg-mocha-600"
          >
            저장
          </Button>
        </div>
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        sourceName={sourceName}
        targetName={targetName}
        isDeleting={isDeleting}
      />
    </>
  );
}
