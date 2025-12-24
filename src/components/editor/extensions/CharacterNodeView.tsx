import { NodeViewWrapper } from "@tiptap/react";
import { User } from "lucide-react";

export default function CharacterNodeView({ node }: any) {
  const { label } = node.attrs;

  return (
    <NodeViewWrapper className="inline-flex items-center align-middle mx-1">
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-sm font-medium border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors select-none">
        <User className="w-3 h-3" />
        {label}
      </span>
    </NodeViewWrapper>
  );
}
