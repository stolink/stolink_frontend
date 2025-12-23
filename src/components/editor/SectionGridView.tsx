import { FileText, GripVertical, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string;
  content: string;
  characterCount: number;
  type: 'section';
}

interface SectionGridViewProps {
  sections: Section[];
  selectedSectionId?: string;
  onSelectSection: (sectionId: string) => void;
}

// HTML 태그 제거하고 텍스트만 추출
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// 텍스트 미리보기 생성 (첫 100자)
function getPreview(content: string): string {
  const text = stripHtml(content);
  if (text.length <= 100) return text;
  return text.substring(0, 100) + '...';
}

export default function SectionGridView({
  sections,
  selectedSectionId,
  onSelectSection,
}: SectionGridViewProps) {
  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <BookOpen className="h-12 w-12 mb-4 opacity-50" />
        <p>작성된 섹션이 없습니다</p>
        <p className="text-sm">챕터 목록에서 새 섹션을 추가하세요</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">카드뷰</h2>
          <p className="text-sm text-muted-foreground">
            총 {sections.length}개 섹션 • 클릭하여 편집
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sections.map((section, index) => (
          <div
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={cn(
              'group relative p-4 rounded-xl border-2 cursor-pointer transition-all',
              'hover:shadow-lg hover:border-sage-300 hover:-translate-y-1',
              selectedSectionId === section.id
                ? 'border-sage-500 bg-sage-50 shadow-md'
                : 'border-stone-200 bg-white'
            )}
          >
            {/* Drag handle */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-50 cursor-grab">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Section number */}
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold',
                selectedSectionId === section.id
                  ? 'bg-sage-500 text-white'
                  : 'bg-stone-100 text-stone-600'
              )}>
                {index + 1}
              </div>
              <span className="text-xs text-muted-foreground">
                {section.characterCount.toLocaleString()}자
              </span>
            </div>

            {/* Title */}
            <h3 className="font-medium text-sm mb-2 line-clamp-2">
              {section.title}
            </h3>

            {/* Preview */}
            <p className="text-xs text-muted-foreground line-clamp-3">
              {getPreview(section.content) || '(내용 없음)'}
            </p>

            {/* Status indicator */}
            <div className="mt-3 flex items-center gap-2">
              <FileText className="h-3 w-3 text-stone-400" />
              <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sage-400 rounded-full"
                  style={{ width: `${Math.min(100, (section.characterCount / 500) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        {/* Add new section card */}
        <div
          className="p-4 rounded-xl border-2 border-dashed border-stone-200
                     flex flex-col items-center justify-center gap-2
                     text-muted-foreground hover:border-sage-300 hover:text-sage-600
                     cursor-pointer transition-colors min-h-[140px]"
        >
          <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
            <span className="text-xl">+</span>
          </div>
          <span className="text-sm">새 섹션 추가</span>
        </div>
      </div>
    </div>
  );
}
