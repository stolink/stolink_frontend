import { FileText } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-stone-400 p-8">
      <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <FileText className="h-8 w-8 text-stone-300" />
      </div>
      <h3 className="text-lg font-medium text-stone-600 mb-2">
        문서가 없습니다
      </h3>
      <p className="text-sm text-center max-w-sm mb-6">
        사이드바에서 새 문서를 만들어
        <br />
        세계관 구축과 집필을 시작해보세요.
      </p>
    </div>
  );
}
