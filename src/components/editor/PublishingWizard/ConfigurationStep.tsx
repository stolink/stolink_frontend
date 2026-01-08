/**
 * ConfigurationStep - Step 2: 구성 및 병합
 * 배포 방식 선택 (개별/병합), 섹션 순서 변경
 */

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  SortableDocumentItem,
  type DocumentItem,
} from "./SortableDocumentItem";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type DeployMode = "individual" | "merge";

interface ConfigurationStepProps {
  selectedDocuments: DocumentItem[];
  deployMode: DeployMode;
  onDeployModeChange: (mode: DeployMode) => void;
  mergedTitle: string;
  onMergedTitleChange: (title: string) => void;
  onDocumentsReorder: (documents: DocumentItem[]) => void;
  onRemoveDocument: (id: string) => void;
}

export function ConfigurationStep({
  selectedDocuments,
  deployMode,
  onDeployModeChange,
  mergedTitle,
  onMergedTitleChange,
  onDocumentsReorder,
  onRemoveDocument,
}: ConfigurationStepProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 드래그 앤 드롭 핸들러
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedDocuments.findIndex((d) => d.id === active.id);
      const newIndex = selectedDocuments.findIndex((d) => d.id === over.id);
      const newOrder = arrayMove(selectedDocuments, oldIndex, newIndex);
      onDocumentsReorder(newOrder);
    }
  };

  // 총 글자수 계산
  const totalWordCount = selectedDocuments.reduce(
    (sum, doc) => sum + doc.wordCount,
    0,
  );

  return (
    <div className="flex gap-4 h-[500px]">
      {/* 왼쪽: 배포 방식 선택 */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3">
          배포 방식
        </h3>

        <div className="space-y-3">
          {/* 개별 배포 옵션 */}
          <label
            className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
              deployMode === "individual"
                ? "border-mocha-400 bg-mocha-50/50 ring-1 ring-mocha-400/30"
                : "border-stone-200 hover:border-mocha-300 bg-white",
            )}
          >
            <input
              type="radio"
              name="deployMode"
              value="individual"
              checked={deployMode === "individual"}
              onChange={() => onDeployModeChange("individual")}
              className="mt-1 w-4 h-4 text-mocha-500 border-stone-300 focus:ring-mocha-400"
            />
            <div>
              <div className="font-semibold text-espresso-900">개별 배포</div>
              <p className="text-sm text-stone-500 mt-1">
                각 섹션을 별도의 에피소드로 게시합니다.
              </p>
            </div>
          </label>

          {/* 병합 배포 옵션 */}
          <label
            className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
              deployMode === "merge"
                ? "border-mocha-400 bg-mocha-50/50 ring-1 ring-mocha-400/30"
                : "border-stone-200 hover:border-mocha-300 bg-white",
            )}
          >
            <input
              type="radio"
              name="deployMode"
              value="merge"
              checked={deployMode === "merge"}
              onChange={() => onDeployModeChange("merge")}
              className="mt-1 w-4 h-4 text-mocha-500 border-stone-300 focus:ring-mocha-400"
            />
            <div>
              <div className="font-semibold text-espresso-900">하나로 병합</div>
              <p className="text-sm text-stone-500 mt-1">
                모든 섹션을 하나의 에피소드로 합쳐서 게시합니다.
              </p>
            </div>
          </label>
        </div>

        {/* 병합 시 제목 입력 */}
        {deployMode === "merge" && (
          <div className="mt-4">
            <Label
              htmlFor="merged-title"
              className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2 block"
            >
              병합 에피소드 제목
            </Label>
            <input
              id="merged-title"
              type="text"
              value={mergedTitle}
              onChange={(e) => onMergedTitleChange(e.target.value)}
              placeholder="병합된 에피소드의 제목을 입력하세요"
              className="w-full px-4 py-3 bg-cloud-50 border border-stone-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-400"
            />
          </div>
        )}
      </div>

      {/* 오른쪽: 선택된 섹션 (순서 변경 가능) */}
      <div className="w-80 flex flex-col bg-cloud-50 rounded-2xl p-4 border border-stone-200">
        <h3 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3">
          선택된 섹션 ({selectedDocuments.length}개)
        </h3>

        <div className="flex-1 overflow-y-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={selectedDocuments.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {selectedDocuments.map((doc, index) => (
                  <SortableDocumentItem
                    key={`${doc.id}-${index}`}
                    item={doc}
                    index={index}
                    onRemove={onRemoveDocument}
                    showDragHandle={true}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* 안내 문구 */}
        <p className="text-xs text-stone-400 text-center mt-3">
          드래그하여 순서 변경
        </p>

        {/* 요약 */}
        <div className="mt-3 pt-3 border-t border-stone-200">
          <div className="flex justify-between text-sm">
            <span className="text-stone-500">총 글자수</span>
            <span className="font-bold text-mocha-700">
              {totalWordCount.toLocaleString()}자
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfigurationStep;
