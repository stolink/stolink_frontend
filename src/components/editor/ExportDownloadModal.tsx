/**
 * ExportDownloadModal - 파일 다운로드 전용 모달
 * ExportModal에서 분리된 파일 다운로드 기능 (HTML/TXT/복사)
 */

import { useState, useMemo } from "react";
import {
  Download,
  FileText,
  Book,
  Check,
  Copy,
  X,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@stolink/ui";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ExportDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void; // 게이트웨이로 돌아가기
  documents: Array<{
    id: string;
    title: string;
    content?: string;
  }>;
  currentId?: string;
  projectTitle?: string;
}

// 플랫폼 프리셋 정의
const PRESETS = [
  {
    id: "munpia",
    name: "문피아/조아라",
    description: "웹소설 표준 포맷",
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
    description: "모바일 최적화",
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
    description: "서식 없음",
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

export function ExportDownloadModal({
  isOpen,
  onClose,
  onBack,
  documents,
  currentId,
  projectTitle,
}: ExportDownloadModalProps) {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0].id);
  const [copied, setCopied] = useState(false);

  // 텍스트 문서만 필터링 (폴더 제외)
  const textDocuments = useMemo(
    () => documents.filter((d) => d.content),
    [documents],
  );

  // 초기 선택 문서 ID
  const initialDocId = useMemo(() => {
    if (textDocuments.length === 0) return "";
    if (currentId && textDocuments.some((d) => d.id === currentId))
      return currentId;
    return textDocuments[0]?.id || "";
  }, [textDocuments, currentId]);

  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId);

  const preset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];

  // 선택된 문서 정보
  const targetDoc = textDocuments.find((d) => d.id === selectedDocId);
  const targetTitle = targetDoc?.title || "제목 없음";
  const targetContent = targetDoc?.content || "";

  // 순수 텍스트 및 통계
  const plainText = targetContent.replace(/<[^>]*>/g, "").trim();
  const wordCount = plainText.length;
  const readTime = Math.ceil(wordCount / 500);

  // 스타일 적용된 HTML 생성
  const generateStyledHTML = () => {
    const { styles } = preset;
    const styledContent = targetContent
      .replace(
        /<p>/g,
        `<p style="text-indent: ${styles.textIndent}; margin-bottom: ${styles.paragraphSpacing};">`,
      )
      .replace(
        /<h1>/g,
        `<h1 style="text-align: ${styles.chapterStyle}; font-size: 1.5em; margin: 1em 0;">`,
      )
      .replace(
        /<h2>/g,
        `<h2 style="text-align: ${styles.chapterStyle}; font-size: 1.3em; margin: 0.8em 0;">`,
      );

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${targetTitle}</title>
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
  <h1>${targetTitle}</h1>
  ${styledContent}
</body>
</html>`;
  };

  // 텍스트 복사
  const handleCopyText = async () => {
    await navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // HTML 다운로드
  const handleDownloadHTML = () => {
    const html = generateStyledHTML();
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetTitle || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // TXT 다운로드
  const handleDownloadTXT = () => {
    const blob = new Blob([plainText], { type: "text/plain; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetTitle || "document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white [&>button]:hidden">
        {/* 헤더 */}
        <div className="relative flex items-center justify-between px-6 py-5 bg-mocha-500">
          <div className="relative flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/20">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white drop-shadow-sm">
                파일 다운로드
              </DialogTitle>
              <p className="text-xs text-white/70 mt-0.5">
                {projectTitle || "작품 제목 없음"}
              </p>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {projectTitle}의 파일 다운로드 옵션을 선택하세요.
          </DialogDescription>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 max-h-[400px] overflow-y-auto space-y-5">
          {/* 섹션 선택 */}
          <div>
            <Label className="text-xs font-bold text-espresso-500 uppercase tracking-wide mb-2 block">
              내보낼 섹션
            </Label>
            <select
              className="w-full px-4 py-3 bg-cloud-50 border border-cloud-200 rounded-2xl text-sm font-medium text-espresso-900 focus:outline-none focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-400"
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
            >
              {textDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title || "제목 없음"}
                </option>
              ))}
              {textDocuments.length === 0 && (
                <option value="">내보낼 내용이 없습니다</option>
              )}
            </select>
            <div className="flex items-center gap-3 mt-2 text-xs text-espresso-400">
              <span>{wordCount.toLocaleString()}자</span>
              <span>•</span>
              <span>약 {readTime}분 읽기</span>
            </div>
          </div>

          {/* 형식 선택 */}
          <div>
            <Label className="text-xs font-bold text-espresso-500 uppercase tracking-wide mb-2 block">
              출력 형식
            </Label>
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <motion.label
                  key={p.id}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-200",
                    selectedPreset === p.id
                      ? "border-mocha-400 bg-gradient-to-r from-mocha-400/10 to-mocha-500/5 ring-1 ring-mocha-400/30 shadow-sm"
                      : "border-cloud-200 hover:border-mocha-400/50 hover:shadow-sm bg-white",
                  )}
                >
                  <input
                    type="radio"
                    name="preset"
                    value={p.id}
                    checked={selectedPreset === p.id}
                    onChange={() => setSelectedPreset(p.id)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                      selectedPreset === p.id
                        ? "border-mocha-500 bg-mocha-500"
                        : "border-cloud-300",
                    )}
                  >
                    {selectedPreset === p.id && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <p.icon className="w-4 h-4 text-espresso-400" />
                  <div className="flex-1">
                    <span className="text-sm font-semibold text-espresso-900">
                      {p.name}
                    </span>
                    <span className="text-xs text-espresso-400 ml-2">
                      {p.description}
                    </span>
                  </div>
                </motion.label>
              ))}
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-cloud-100 bg-cloud-50/50">
          <div className="flex gap-3">
            {onBack && (
              <Button
                intent="ghost"
                onClick={onBack}
                className="h-11 px-4 text-espresso-500 hover:text-espresso-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                이전
              </Button>
            )}
            <Button
              intent="outline"
              onClick={handleCopyText}
              className="flex-1 h-11 border-cloud-200 text-espresso-600 hover:bg-cloud-50"
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2 text-mocha-600" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "복사됨" : "복사"}
            </Button>
            <Button
              intent="outline"
              onClick={handleDownloadTXT}
              className="flex-1 h-11 border-cloud-200 text-espresso-600 hover:bg-cloud-50"
            >
              <Download className="w-4 h-4 mr-2" />
              TXT
            </Button>
            <Button
              onClick={handleDownloadHTML}
              className="flex-[1.5] h-11 bg-mocha-500 hover:bg-mocha-700 text-white font-bold"
            >
              <Download className="w-4 h-4 mr-2" />
              HTML
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExportDownloadModal;
