import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Book,
  Check,
  Copy,
  Share2,
  Globe,
  Users,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Character } from "@/types/character";
import { draftService } from "@/services/draftService";
import { useToast } from "@/hooks/useToast";

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
  projectId?: string; // Add projectId to props
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
 * 내보내기 모달 - 플랫폼 프리셋 적용하여 텍스트 내보내기 및 커뮤니티 배포
 */
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
  projectId, // Destructure projectId
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0].id);
  const [copied, setCopied] = useState(false);

  const preset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];

  // Initialize selected document
  // Compute initial doc ID without setState in effect
  // 폴더(type: 'folder')를 제외하고 문서(type: 'text')만 필터링
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

  // documents가 로드된 후 selectedDocId가 비어있으면 첫 번째 문서로 설정
  useEffect(() => {
    if (!selectedDocId && textDocuments.length > 0) {
      setSelectedDocId(textDocuments[0].id);
    }
  }, [textDocuments, selectedDocId]);

  // 커뮤니티 배포 관련 상태
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  // 커뮤니티 URL (환경 변수 또는 기본값)
  const COMMUNITY_URL =
    import.meta.env.VITE_COMMUNITY_URL || "http://localhost:5174";

  // Derived content based on selection
  const targetDoc = documents.find((d) => d.id === selectedDocId);
  const targetTitle = targetDoc ? targetDoc.title : title;
  const targetContent = targetDoc ? targetDoc.content || "" : content;

  // HTML 태그 제거 및 텍스트 추출
  const plainText = targetContent.replace(/<[^>]*>/g, "").trim();
  const wordCount = plainText.length;
  const readTime = Math.ceil(wordCount / 500);

  // 프리셋 스타일 적용된 HTML 생성
  const generateStyledHTML = () => {
    const { styles } = preset;

    // <p> 태그에 스타일 적용
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

  // 커뮤니티 배포 핸들러 (Draft 생성 및 리다이렉트)
  const handlePublish = async () => {
    if (!selectedDocId || selectedDocId === "") {
      toast({
        title: "배포할 섹션을 선택해주세요",
        description: "문서 목록에서 배포할 항목을 선택해야 합니다.",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);

    try {
      // 1. 스냅샷 데이터 생성
      const graphSnapshot = {
        // 노드: D3 렌더링용 최소 데이터
        nodes: characters.map((c) => ({
          id: c._id,
          name: c.profile?.name || "이름 없음",
          role: c.role,
          group: c.profile?.faction?.name || undefined,
          imageUrl: c.imageUrl || undefined,
        })),

        // 링크: 관계 정보 + 히스토리
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

        // 프로필: 노드 클릭 시 상세 정보
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

      // 2. Draft API 호출
      await draftService.create({
        documentId: selectedDocId,
        projectId, // 선택 사항
        title: targetTitle,
        content: targetContent,
        graphSnapshot,
      });

      // 3. 커뮤니티로 리다이렉트 (메인으로 이동, 파라미터 없음)
      window.location.href = COMMUNITY_URL;
    } catch (error) {
      console.error("Draft 저장 실패:", error);
      toast({
        title: "배포 준비 실패",
        description: "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl h-[560px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {activeTab === "export" ? (
              <Download className="w-5 h-5" />
            ) : (
              <Share2 className="w-5 h-5" />
            )}
            {activeTab === "export" ? "파일 내보내기" : "커뮤니티 배포"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-2 border-b bg-muted/10 shrink-0">
          <Label className="text-xs font-semibold text-muted-foreground mb-1.5 block">
            대상 챕터
          </Label>
          <select
            className="w-full p-2 h-9 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "export" | "publish")}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="px-6 pt-2 shrink-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">파일 다운로드</TabsTrigger>
              <TabsTrigger value="publish">커뮤니티 배포</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <TabsContent value="export" className="m-0 p-6 space-y-6 h-full">
              {/* 프리셋 선택 */}
              <div>
                <Label className="mb-3 block">플랫폼 프리셋</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPreset(p.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all h-full flex flex-col",
                        selectedPreset === p.id
                          ? "border-sage-500 bg-sage-50 ring-1 ring-sage-500"
                          : "border-border hover:border-stone-300 hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <p.icon
                          className={cn(
                            "w-4 h-4",
                            selectedPreset === p.id
                              ? "text-sage-600"
                              : "text-muted-foreground",
                          )}
                        />
                        <span className="font-medium text-sm">{p.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 미리보기 */}
              <div className="flex-1 flex flex-col min-h-0">
                <Label className="mb-2 block">미리보기</Label>
                <div
                  className="border border-border rounded-lg p-4 bg-card overflow-y-auto flex-1 h-[180px]"
                  style={{
                    fontFamily: preset.styles.fontFamily,
                    fontSize: preset.styles.fontSize,
                    lineHeight: preset.styles.lineHeight,
                  }}
                >
                  <h3
                    className="font-bold mb-4"
                    style={{
                      textAlign: preset.styles.chapterStyle as
                        | "left"
                        | "center",
                    }}
                  >
                    {targetTitle || "제목 없음"}
                  </h3>
                  <div dangerouslySetInnerHTML={{ __html: targetContent }} />
                </div>
              </div>

              {/* 통계 */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground py-1 bg-muted/30 px-3 rounded-md border border-border/50">
                <span>📄 {wordCount.toLocaleString()}자</span>
                <span>⏱️ 약 {readTime}분 읽기</span>
              </div>
            </TabsContent>

            <TabsContent value="publish" className="m-0 p-6 space-y-6 h-full">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-5 text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-emerald-900 mb-1">
                  작품을 세상에 공개하세요
                </h3>
                <p className="text-sm text-emerald-700/80">
                  커뮤니티 독자들에게 내 작품을 공유하고 피드백을 받아보세요.
                  <br />
                  캐릭터 설정과 관계도까지 함께 보여줄 수 있습니다.
                </p>
              </div>

              <div className="space-y-4">
                <Label>공개 옵션 설정</Label>

                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-md">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        캐릭터 프로필 포함
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        작품에 등장하는 인물들의 프로필 정보를 함께 공개합니다.
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={includeCharacters}
                    onChange={setIncludeCharacters}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-md">
                      <Network className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        인물 관계도 포함
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        독자들이 인터랙티브한 관계도를 탐색할 수 있게 합니다.
                      </p>
                    </div>
                  </div>
                  <Switch checked={includeGraph} onChange={setIncludeGraph} />
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center bg-muted/50 p-3 rounded-lg">
                ℹ️ 현재는 <strong>베타 버전</strong>으로, 실제 서버 업로드 대신
                <br />
                스냅샷 데이터가 포함된 패키지 파일이 다운로드됩니다.
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20 shrink-0">
          {activeTab === "export" ? (
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                onClick={handleCopyText}
                className="flex-1"
              >
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
              <Button
                onClick={handleDownloadHTML}
                className="flex-1 bg-stone-800 hover:bg-stone-900"
              >
                <Download className="w-4 h-4 mr-1" />
                HTML
              </Button>
            </div>
          ) : (
            <div className="flex w-full gap-2">
              <Button variant="ghost" onClick={onClose} className="flex-1">
                취소
              </Button>
              <Button
                onClick={handlePublish}
                className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={isPublishing}
              >
                {isPublishing ? "패키징 중..." : "커뮤니티에 배포하기"}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
