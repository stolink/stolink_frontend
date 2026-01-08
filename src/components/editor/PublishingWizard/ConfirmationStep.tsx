/**
 * ConfirmationStep - Step 3: 최종 확인
 * 배포 전 요약 정보 표시 및 최종 확인
 */

import { Info, Users, Network } from "lucide-react";
import { Switch } from "@/components/ui/switch";

import type { DocumentItem } from "./SortableDocumentItem";
import type { DeployMode } from "./ConfigurationStep";

interface ConfirmationStepProps {
  selectedDocuments: DocumentItem[];
  deployMode: DeployMode;
  mergedTitle: string;
  includeCharacters: boolean;
  onIncludeCharactersChange: (value: boolean) => void;
  includeGraph: boolean;
  onIncludeGraphChange: (value: boolean) => void;
  charactersCount: number;
}

export function ConfirmationStep({
  selectedDocuments,
  deployMode,
  mergedTitle,
  includeCharacters,
  onIncludeCharactersChange,
  includeGraph,
  onIncludeGraphChange,
  charactersCount,
}: ConfirmationStepProps) {
  // 총 글자수 계산
  const totalWordCount = selectedDocuments.reduce(
    (sum, doc) => sum + doc.wordCount,
    0,
  );

  // 섹션 제목 목록 (최대 3개까지 표시)
  const sectionTitles = selectedDocuments
    .slice(0, 3)
    .map((d) => d.title || "제목 없음")
    .join(", ");
  const hasMore = selectedDocuments.length > 3;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* 배포 요약 카드 */}
      <div className="bg-white rounded-2xl border border-cloud-200 shadow-paper overflow-hidden">
        <div className="px-5 py-4 border-b border-cloud-100">
          <h3 className="font-bold text-espresso-900">배포 요약</h3>
        </div>

        <div className="p-5 space-y-4">
          {/* 배포 방식 */}
          <div className="flex justify-between">
            <span className="text-espresso-500">배포 방식</span>
            <span className="font-semibold text-espresso-900">
              {deployMode === "merge" ? "하나로 병합" : "개별 배포"}
            </span>
          </div>

          {/* 에피소드 제목 (병합 모드) */}
          {deployMode === "merge" && (
            <div className="flex justify-between">
              <span className="text-espresso-500">에피소드 제목</span>
              <span className="font-semibold text-espresso-900 max-w-[200px] truncate">
                {mergedTitle || "제목 없음"}
              </span>
            </div>
          )}

          {/* 포함 섹션 */}
          <div className="flex justify-between">
            <span className="text-espresso-500">포함 섹션</span>
            <span className="font-semibold text-espresso-900 max-w-[200px] truncate">
              {selectedDocuments.length}개 ({sectionTitles}
              {hasMore && " ..."})
            </span>
          </div>

          {/* 총 글자수 */}
          <div className="flex justify-between">
            <span className="text-espresso-500">총 글자수</span>
            <span className="font-semibold text-espresso-900">
              {totalWordCount.toLocaleString()}자
            </span>
          </div>
        </div>

        {/* 함께 배포되는 데이터 */}
        <div className="px-5 py-4 border-t border-cloud-100 bg-cloud-50/50">
          <h4 className="text-sm font-bold text-espresso-500 uppercase tracking-wide mb-3">
            함께 배포되는 데이터
          </h4>

          <div className="space-y-3">
            {/* 캐릭터 프로필 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-espresso-900">
                    캐릭터 프로필
                  </div>
                  <div className="text-xs text-espresso-400">
                    {charactersCount}명의 캐릭터 정보
                  </div>
                </div>
              </div>
              <Switch
                checked={includeCharacters}
                onChange={onIncludeCharactersChange}
              />
            </div>

            {/* 인물 관계도 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Network className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-espresso-900">
                    인물 관계도
                  </div>
                  <div className="text-xs text-espresso-400">
                    인터랙티브 그래프
                  </div>
                </div>
              </div>
              <Switch checked={includeGraph} onChange={onIncludeGraphChange} />
            </div>
          </div>
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="flex items-start gap-3 p-4 bg-mocha-50 rounded-2xl border border-mocha-200">
        <Info className="w-5 h-5 text-mocha-600 shrink-0 mt-0.5" />
        <div className="text-sm text-mocha-700">
          <p className="font-medium">
            확인 버튼 클릭 시 Storead의 편집 페이지로 이동합니다.
          </p>
          <p className="text-mocha-600 mt-1">
            Storead에서 최종 게시를 완료해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationStep;
