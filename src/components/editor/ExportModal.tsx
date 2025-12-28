import { useState } from "react";
import {
  Download,
  FileText,
  Book,
  Settings2,
  Check,
  Copy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
}

// 플랫폼 프리셋 정의
const PRESETS = [
  {
    id: "munpia",
    name: "문피아/조아라",
    description: "줄간격 160%, 본문 들여쓰기, 챕터 구분",
    icon: Book,
    styles: {
      fontFamily: "'Nanum Myeongjo', serif",
      fontSize: "16px",
      lineHeight: "1.6",
      textIndent: "1em",
      paragraphSpacing: "0.5em",
      chapterStyle: "center",
    },
  },
  {
    id: "kakao",
    name: "카카오페이지",
    description: "깔끔한 본문, 적당한 줄간격",
    icon: FileText,
    styles: {
      fontFamily: "'Pretendard', sans-serif",
      fontSize: "15px",
      lineHeight: "1.8",
      textIndent: "0",
      paragraphSpacing: "1em",
      chapterStyle: "left",
    },
  },
  {
    id: "plain",
    name: "일반 텍스트",
    description: "서식 없는 순수 텍스트",
    icon: FileText,
    styles: {
      fontFamily: "inherit",
      fontSize: "14px",
      lineHeight: "1.5",
      textIndent: "0",
      paragraphSpacing: "1em",
      chapterStyle: "left",
    },
  },
];

/**
 * 내보내기 모달 - 플랫폼 프리셋 적용하여 텍스트 내보내기
 */
export default function ExportModal({
  isOpen,
  onClose,
  content,
  title,
}: ExportModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0].id);
  const [copied, setCopied] = useState(false);

  const preset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];

  // HTML 태그 제거 및 텍스트 추출
  const plainText = content.replace(/<[^>]*>/g, "").trim();

  // 프리셋 스타일 적용된 HTML 생성
  const generateStyledHTML = () => {
    const { styles } = preset;

    // <p> 태그에 스타일 적용
    let styledContent = content
      .replace(
        /<p>/g,
        `<p style="text-indent: ${styles.textIndent}; margin-bottom: ${styles.paragraphSpacing};">`
      )
      .replace(
        /<h1>/g,
        `<h1 style="text-align: ${styles.chapterStyle}; font-size: 1.5em; margin: 1em 0;">`
      )
      .replace(
        /<h2>/g,
        `<h2 style="text-align: ${styles.chapterStyle}; font-size: 1.3em; margin: 0.8em 0;">`
      );

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body {
      font-family: ${styles.fontFamily};
      font-size: ${styles.fontSize};
      line-height: ${styles.lineHeight};
      max-width: 700px;
      margin: 2em auto;
      padding: 0 1em;
      color: #333;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${styledContent}
</body>
</html>`;
  };

  const handleCopyText = async () => {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHTML = () => {
    const html = generateStyledHTML();
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTXT = () => {
    const blob = new Blob([plainText], { type: "text/plain; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            내보내기
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* 프리셋 선택 */}
          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">
              플랫폼 프리셋
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPreset(p.id)}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    selectedPreset === p.id
                      ? "border-sage-500 bg-sage-50 ring-1 ring-sage-500"
                      : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                  )}
                >
                  <p.icon
                    className={cn(
                      "w-5 h-5 mb-1",
                      selectedPreset === p.id
                        ? "text-sage-600"
                        : "text-stone-500"
                    )}
                  />
                  <p className="text-sm font-medium text-stone-700">{p.name}</p>
                  <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                    {p.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 미리보기 */}
          <div>
            <label className="text-sm font-medium text-stone-700 mb-2 block">
              미리보기
            </label>
            <div
              className="border border-stone-200 rounded-lg p-4 max-h-48 overflow-y-auto bg-white"
              style={{
                fontFamily: preset.styles.fontFamily,
                fontSize: preset.styles.fontSize,
                lineHeight: preset.styles.lineHeight,
              }}
            >
              <h3
                className="font-bold mb-2"
                style={{
                  textAlign: preset.styles.chapterStyle as "left" | "center",
                }}
              >
                {title || "제목 없음"}
              </h3>
              <p style={{ textIndent: preset.styles.textIndent }}>
                {plainText.slice(0, 300) || "(내용 없음)"}
                {plainText.length > 300 && "..."}
              </p>
            </div>
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-4 text-xs text-stone-500">
            <span>📄 {plainText.length.toLocaleString()}자</span>
            <span>📖 약 {Math.ceil(plainText.length / 500)}분 읽기</span>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCopyText} className="flex-1">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                텍스트 복사
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadTXT}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-1" />
            TXT
          </Button>
          <Button onClick={handleDownloadHTML} className="flex-1">
            <Download className="w-4 h-4 mr-1" />
            HTML
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
