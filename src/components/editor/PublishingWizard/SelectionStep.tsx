/**
 * SelectionStep - Step 1: 섹션 선택
 * 다중 선택, 필터링, 검색 기능 제공
 */

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Switch } from "@/components/ui/switch";

import { StatusBadge } from "./StatusBadge";
import type { DocumentItem } from "./SortableDocumentItem";
import { cn } from "@/lib/utils";

interface SelectionStepProps {
  documents: DocumentItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function SelectionStep({
  documents,
  selectedIds,
  onSelectionChange,
}: SelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnpublishedOnly, setShowUnpublishedOnly] = useState(false);

  // 필터링된 문서 목록
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 검색어 필터
      const matchesSearch = doc.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // 미배포만 보기 필터
      const matchesPublishFilter = showUnpublishedOnly
        ? !doc.isPublished
        : true;

      return matchesSearch && matchesPublishFilter;
    });
  }, [documents, searchQuery, showUnpublishedOnly]);

  // 선택된 문서 목록
  const selectedDocuments = useMemo(() => {
    return documents.filter((doc) => selectedIds.includes(doc.id));
  }, [documents, selectedIds]);

  // 선택 가능한 문서 목록 (배포되지 않은 문서만)
  const selectableDocuments = useMemo(() => {
    return filteredDocuments.filter((doc) => !doc.isPublished);
  }, [filteredDocuments]);

  // 체크박스 토글
  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // 전체 선택/해제 (배포된 문서 제외)
  const toggleSelectAll = () => {
    if (selectedIds.length === selectableDocuments.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(selectableDocuments.map((d) => d.id));
    }
  };

  // 선택 항목 제거
  const removeFromSelection = (id: string) => {
    onSelectionChange(selectedIds.filter((sid) => sid !== id));
  };

  // 총 글자수 계산
  const totalWordCount = selectedDocuments.reduce(
    (sum, doc) => sum + doc.wordCount,
    0,
  );

  return (
    <div className="flex gap-4 h-[500px]">
      {/* 왼쪽: 섹션 목록 */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-espresso-500 uppercase tracking-wide">
            섹션 목록
          </h3>
          <button
            onClick={toggleSelectAll}
            className="text-xs text-mocha-600 hover:text-mocha-700 font-medium"
          >
            {selectedIds.length === filteredDocuments.length
              ? "전체 해제"
              : "전체 선택"}
          </button>
        </div>

        {/* 검색창 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-espresso-400" />
          <input
            type="text"
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-cloud-50 border border-cloud-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-400"
          />
        </div>

        {/* 미배포만 보기 토글 */}
        <div className="flex items-center gap-2 mb-3">
          <Switch
            checked={showUnpublishedOnly}
            onChange={setShowUnpublishedOnly}
          />
          <span className="text-sm text-espresso-600">미배포만 보기</span>
        </div>

        {/* 문서 목록 */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredDocuments.map((doc, index) => (
            <label
              key={`${doc.id}-${index}`}
              className={cn(
                "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                doc.isPublished
                  ? "opacity-60 cursor-not-allowed bg-cloud-50 border-cloud-200" // 배포됨: 비활성화 스타일
                  : selectedIds.includes(doc.id)
                    ? "border-mocha-400 bg-mocha-50/50 cursor-pointer"
                    : "border-cloud-200 hover:border-mocha-300 bg-white cursor-pointer",
              )}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(doc.id)}
                onChange={() => !doc.isPublished && toggleSelection(doc.id)}
                disabled={doc.isPublished}
                className={cn(
                  "w-4 h-4 rounded border-cloud-300 text-mocha-500 focus:ring-mocha-400",
                  doc.isPublished && "cursor-not-allowed opacity-50",
                )}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-espresso-900 truncate">
                    {doc.title || "제목 없음"}
                  </span>
                  <StatusBadge isPublished={doc.isPublished} />
                </div>
                <span className="text-xs text-espresso-400">
                  {doc.wordCount.toLocaleString()}자
                </span>
              </div>
            </label>
          ))}

          {filteredDocuments.length === 0 && (
            <div className="text-center py-8 text-espresso-400">
              <p>표시할 섹션이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽: 배포 대기열 (Staging Area) */}
      <div className="w-72 flex flex-col bg-cloud-50 rounded-2xl p-4 border border-cloud-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-espresso-500 uppercase tracking-wide">
            배포 대기열
          </h3>
          {selectedDocuments.length > 0 && (
            <button
              onClick={() => onSelectionChange([])}
              className="text-xs text-status-error hover:underline"
            >
              전체 해제
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {selectedDocuments.length === 0 ? (
            <div className="text-center py-8 text-espresso-400 text-sm">
              <p>선택된 섹션이</p>
              <p>여기에 표시됩니다</p>
            </div>
          ) : (
            selectedDocuments.map((doc, index) => (
              <div
                key={`${doc.id}-${index}`}
                className="flex items-center gap-2 p-2 bg-white rounded-xl border border-cloud-200"
              >
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-mocha-100 text-mocha-700 text-xs font-bold">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm text-espresso-900 truncate">
                  {doc.title || "제목 없음"}
                </span>
                <button
                  onClick={() => removeFromSelection(doc.id)}
                  className="text-espresso-400 hover:text-status-error"
                >
                  <span className="text-lg leading-none">&times;</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* 요약 */}
        <div className="mt-3 pt-3 border-t border-cloud-200">
          <div className="flex justify-between text-sm">
            <span className="text-espresso-500">선택된 섹션</span>
            <span className="font-bold text-mocha-700">
              {selectedDocuments.length}개
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-espresso-500">총 글자수</span>
            <span className="font-bold text-mocha-700">
              {totalWordCount.toLocaleString()}자
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SelectionStep;
