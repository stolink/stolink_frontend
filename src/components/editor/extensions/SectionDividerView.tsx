import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

export default function SectionDividerView({ node }: NodeViewProps) {
  const { title } = node.attrs;

  return (
    <NodeViewWrapper className="section-divider select-none group h-8">
      <div className="divider-label flex justify-center w-full">
        <div className="bg-white px-3 flex items-center gap-2 whitespace-nowrap shadow-sm border border-stone-100 rounded-full py-1">
          <span className="text-[10px] font-bold text-stone-300 uppercase tracking-[0.2em]">
            Section
          </span>
          <span className="text-[11px] font-medium text-stone-400">
            {title}
          </span>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
