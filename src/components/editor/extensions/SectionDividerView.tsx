import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export default function SectionDividerView({ node }: NodeViewProps) {
  const { title, level = 0 } = node.attrs;

  return (
    <NodeViewWrapper className="section-divider select-none group my-8">
      {/* 상단 구분선 */}
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-sage-200 to-transparent" />
        <div
          className="relative bg-paper px-4 flex items-center gap-2 whitespace-nowrap shadow-md border-2 border-sage-300 rounded-lg py-2"
          style={{ marginLeft: `${level * 12}px` }}
        >
          {/* 계층 표시 점 */}
          {level > 0 && (
            <div className="flex items-center gap-0.5 mr-1">
              {Array.from({ length: level }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 h-1 rounded-full bg-sage-400"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}
          <span className="text-xs font-bold text-sage-600 uppercase tracking-wider">
            {level === 0 ? "섹션" : `${level}차 하위`}
          </span>
          <span className="text-sm font-semibold text-stone-700">
            {title}
          </span>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
