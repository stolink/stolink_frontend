import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Book,
  Check,
  Copy,
  Globe,
  Users,
  Network,
  X,
  Sparkles,
  ArrowRight,
  FileDown,
  Send,
} from "lucide-react";
import { Button } from "@stolink/ui";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Character } from "@/types/character";
import { draftService } from "@/services/draftService";
import { useToast } from "@/hooks/useToast";
import { motion, AnimatePresence } from "framer-motion";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  currentId?: string;
  initialTab?: "export" | "publish";
  characters?: Character[];
  links?: Array<{
    source: string;
    target: string;
    id: string | number;
    type: string;
    strength: number;
  }>;
  documents?: { id: string; title: string; content?: string; type?: string }[];
  projectId: string;
  projectTitle?: string;
  projectDescription?: string;
  projectGenre?: string;
  projectCoverImage?: string;
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

export default function ExportModal({
  isOpen,
  onClose,
  content,
  title,
  currentId,
  initialTab = "export",
  characters = [],
  links = [],
  documents = [],
  projectId,
  projectTitle,
  projectDescription,
  projectGenre,
  projectCoverImage,
}: ExportModalProps) {
  const [mode, setMode] = useState<"export" | "publish">(initialTab);
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0].id);
  const [copied, setCopied] = useState(false);

  const preset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];

  // 폴더를 제외한 문서만 필터링
  const textDocuments = documents.filter((d) => d.type !== "folder");

  const initialDocId = (() => {
    if (textDocuments.length === 0) return "";
    if (currentId && textDocuments.some((d) => d.id === currentId))
      return currentId;
    const matched =
      textDocuments.find((d) => d.title === title) ||
      textDocuments.find((d) => d.content);
    return matched?.id || textDocuments[0]?.id || "";
  })();

  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId);
  const [includeCharacters, setIncludeCharacters] = useState(true);
  const [includeGraph, setIncludeGraph] = useState(true);

  useEffect(() => {
    if (!selectedDocId && textDocuments.length > 0) {
      setSelectedDocId(textDocuments[0].id);
    }
  }, [textDocuments, selectedDocId]);

  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  const COMMUNITY_URL =
    import.meta.env.VITE_COMMUNITY_URL || "http://localhost:5174";

  const targetDoc = documents.find((d) => d.id === selectedDocId);
  const targetTitle = targetDoc ? targetDoc.title : title;
  const targetContent = targetDoc ? targetDoc.content || "" : content;

  const plainText = targetContent.replace(/<[^>]*>/g, "").trim();
  const wordCount = plainText.length;
  const readTime = Math.ceil(wordCount / 500);

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
    a.download = `${targetTitle || "document"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTXT = () => {
    const blob = new Blob([plainText], { type: "text/plain; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${targetTitle || "document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePublish = async () => {
    if (!selectedDocId || selectedDocId === "") {
      toast({
        title: "배포할 섹션을 선택해주세요",
        description: "문서 목록에서 배포할 항목을 선택해야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (!projectId) {
      toast({
        title: "프로젝트 정보가 없습니다",
        description:
          "프로젝트 ID를 확인할 수 없습니다. 페이지를 새로고침해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    try {
      const graphSnapshot = {
        nodes: characters.map((c) => ({
          id: c._id,
          name: c.profile?.name || "이름 없음",
          role: c.role,
          group: c.profile?.faction?.name || undefined,
          imageUrl: c.imageUrl || undefined,
        })),
        links: links.map((l) => {
          const relation = characters
            .find((c) => c._id === l.source)
            ?.relations?.graph?.find((r) => r.target === l.target);
          return {
            ...l,
            id: String(l.id),
            description: relation?.description,
            history: relation?.history || undefined,
          };
        }),
        profiles: Object.fromEntries(
          characters.map((c) => [
            c._id,
            {
              id: c._id,
              name: c.profile?.name,
              age: c.profile?.age || undefined,
              gender: c.profile?.gender,
              personality: c.personality?.coreTraits,
              backstory: c.profile?.backstory,
              imageUrl: c.imageUrl || undefined,
            },
          ]),
        ),
      };

      const { data: draft } = await draftService.create({
        documentId: selectedDocId,
        projectId,
        title: targetTitle,
        content: targetContent,
        graphSnapshot,
        workTitle: projectTitle,
        workSynopsis: projectDescription,
        workGenre: projectGenre,
        workCoverUrl: projectCoverImage,
      });

      window.location.href = `${COMMUNITY_URL}/write?draftId=${draft.id}`;
    } catch (error: unknown) {
      console.error("Draft 저장 실패:", error);

      // 구체적인 에러 메시지 추출
      const errorMessage =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "알 수 없는 오류가 발생했습니다.";

      toast({
        title: "배포 준비 실패",
        description: `${errorMessage}\n\n백엔드 서버(localhost:8080)가 실행 중인지 확인해주세요.`,
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white [&>button]:hidden">
        {/* 헤더: 프리미엄 퍼플 그라데이션 + 전체 디자인 톤 통일 */}
        <div className="relative flex items-center justify-between px-6 py-5 bg-gradient-to-r from-mocha-500 via-mocha-400 to-mocha-500">
          {/* Decorative blur accent */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="relative flex items-center gap-3">
            <motion.div
              animate={{ rotate: mode === "export" ? 0 : 360 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/20"
            >
              {mode === "export" ? (
                <FileDown className="w-5 h-5 text-white" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </motion.div>
            <div>
              <DialogTitle className="text-lg font-bold text-white font-heading drop-shadow-sm">
                {mode === "export" ? "내보내기" : "커뮤니티 배포"}
              </DialogTitle>
              <p className="text-xs text-white/70 mt-0.5">
                {projectTitle || "작품 제목 없음"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 모드 스위치: 프리미엄 세그먼트 컨트롤 */}
        <div className="px-6 py-4 bg-cloud-50">
          <div className="flex p-1.5 bg-white rounded-xl border border-stone-200/80 shadow-sm">
            <motion.button
              onClick={() => setMode("export")}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === "export"
                  ? "bg-gradient-to-r from-mocha-500 to-mocha-400 text-white shadow-md"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50",
              )}
            >
              <FileDown className="w-4 h-4 inline-block mr-2 -mt-0.5" />
              파일 다운로드
            </motion.button>
            <motion.button
              onClick={() => setMode("publish")}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200",
                mode === "publish"
                  ? "bg-gradient-to-r from-mocha-500 to-mocha-400 text-white shadow-md"
                  : "text-stone-500 hover:text-stone-700 hover:bg-stone-50",
              )}
            >
              <Globe className="w-4 h-4 inline-block mr-2 -mt-0.5" />
              커뮤니티 배포
            </motion.button>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-6 py-5 max-h-[400px] overflow-y-auto">
          <AnimatePresence mode="wait">
            {mode === "export" ? (
              <motion.div
                key="export"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* 섹션 선택 */}
                <div>
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2 block">
                    내보낼 섹션
                  </Label>
                  <select
                    className="w-full px-4 py-3 bg-cloud-50 border border-stone-200 rounded-xl text-sm font-medium text-espresso-900 focus:outline-none focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-400"
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                  >
                    {documents
                      .filter((d) => d.content)
                      .map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.title || "제목 없음"}
                        </option>
                      ))}
                    {documents.filter((d) => d.content).length === 0 && (
                      <option value="">발행할 내용이 없습니다</option>
                    )}
                  </select>
                  <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                    <span>{wordCount.toLocaleString()}자</span>
                    <span>•</span>
                    <span>약 {readTime}분 읽기</span>
                  </div>
                </div>

                {/* 형식 선택: 간결한 라디오 스타일 */}
                <div>
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2 block">
                    출력 형식
                  </Label>
                  <div className="space-y-2">
                    {PRESETS.map((p) => (
                      <motion.label
                        key={p.id}
                        whileHover={{ scale: 1.01, y: -1 }}
                        whileTap={{ scale: 0.99 }}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                          selectedPreset === p.id
                            ? "border-mocha-400 bg-gradient-to-r from-mocha-400/10 to-mocha-500/5 ring-1 ring-mocha-400/30 shadow-sm"
                            : "border-stone-200 hover:border-mocha-400/50 hover:shadow-sm bg-white",
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
                              : "border-stone-300",
                          )}
                        >
                          {selectedPreset === p.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <p.icon className="w-4 h-4 text-stone-400" />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-espresso-900">
                            {p.name}
                          </span>
                          <span className="text-xs text-stone-400 ml-2">
                            {p.description}
                          </span>
                        </div>
                      </motion.label>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="publish"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {/* 배포 대상 섹션 선택 */}
                <div>
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2 block">
                    배포할 섹션
                  </Label>
                  <select
                    className="w-full px-4 py-3 bg-cloud-50 border border-stone-200 rounded-xl text-sm font-medium text-espresso-900 focus:outline-none focus:ring-2 focus:ring-mocha-400/30 focus:border-mocha-400"
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                  >
                    {documents
                      .filter((d) => d.content)
                      .map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.title || "제목 없음"}
                        </option>
                      ))}
                    {documents.filter((d) => d.content).length === 0 && (
                      <option value="">발행할 내용이 없습니다</option>
                    )}
                  </select>
                </div>

                {/* 포함 옵션: 깔끔한 스위치 리스트 */}
                <div>
                  <Label className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3 block">
                    함께 공개할 항목
                  </Label>
                  <div className="space-y-3">
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-cloud-50 to-white rounded-xl border border-stone-100 hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-sm">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-espresso-900">
                            캐릭터 프로필
                          </p>
                          <p className="text-xs text-stone-400">
                            {characters.length}명의 캐릭터 정보
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={includeCharacters}
                        onChange={setIncludeCharacters}
                      />
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-cloud-50 to-white rounded-xl border border-stone-100 hover:border-purple-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center shadow-sm">
                          <Network className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-espresso-900">
                            인물 관계도
                          </p>
                          <p className="text-xs text-stone-400">
                            인터랙티브 그래프
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={includeGraph}
                        onChange={setIncludeGraph}
                      />
                    </motion.div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-mocha-400/10 to-mocha-500/5 rounded-xl border border-mocha-400/20 text-sm text-mocha-700">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-mocha-400/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Globe className="w-4 h-4 text-mocha-600" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">커뮤니티 배포 안내</p>
                      <p className="text-xs text-mocha-500/80 leading-relaxed">
                        StoLink 커뮤니티에서 작품을 공유하고 독자들의 피드백을
                        받아보세요. 배포 후에도 언제든 수정하거나 비공개로
                        전환할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 푸터: 명확한 CTA */}
        <div className="px-6 py-4 border-t border-stone-100 bg-cloud-50/50">
          {mode === "export" ? (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCopyText}
                className="flex-1 h-11 border-stone-200 text-stone-600 hover:bg-stone-50"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-2 text-mocha-600" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copied ? "복사됨" : "복사"}
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadTXT}
                className="flex-1 h-11 border-stone-200 text-stone-600 hover:bg-stone-50"
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
          ) : (
            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1 h-11 text-stone-500 hover:text-stone-700"
              >
                취소
              </Button>
              <Button
                onClick={handlePublish}
                disabled={isPublishing}
                className="flex-[2] h-11 bg-mocha-500 hover:bg-mocha-700 text-white font-bold"
              >
                {isPublishing ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    준비 중...
                  </>
                ) : (
                  <>
                    커뮤니티에 배포
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
