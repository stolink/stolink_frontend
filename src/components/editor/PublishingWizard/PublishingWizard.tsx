/**
 * PublishingWizard - 커뮤니티 배포 마법사
 * 3단계로 다중 섹션을 Storead에 배포하는 기능 제공
 *
 * Step 1 (Selection): 섹션 다중 선택
 * Step 2 (Configuration): 배포 방식 설정, 순서 변경
 * Step 3 (Confirmation): 최종 확인 및 배포
 */

import { useState, useMemo } from "react";
import { X, ArrowLeft, ArrowRight, Send, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@stolink/ui";
import { motion, AnimatePresence } from "framer-motion";
import { Stepper } from "./Stepper";
import { SelectionStep } from "./SelectionStep";
import { ConfigurationStep, type DeployMode } from "./ConfigurationStep";
import { ConfirmationStep } from "./ConfirmationStep";
import type { DocumentItem } from "./SortableDocumentItem";
import { draftService } from "@/services/draftService";
import { useToast } from "@/hooks/useToast";
import { useProjectEvents } from "@/hooks/useEvents";
import type { Character } from "@/types/character";
import { COMMUNITY_URL } from "@/config";
// 심층 분석 데이터 생성 함수 및 타입 import
import { generateAnalysisData } from "@/components/CharacterGraph/RelationshipDeepAnalysis/utils/analysisCalculations";
import type { RelationshipDeepAnalysisData } from "@/types/relationshipAnalysis";

interface PublishingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void; // 게이트웨이로 돌아가기
  documents: Array<{
    id: string;
    title: string;
    content?: string;
    type?: string;
    wordCount?: number;
    isPublished?: boolean;
  }>;
  projectId: string;
  projectTitle?: string;
  projectDescription?: string;
  projectGenre?: string;
  projectCoverImage?: string;
  characters?: Character[];
  links?: Array<{
    source: string;
    target: string;
    id: string | number;
    type: string;
    strength: number;
  }>;
}

export function PublishingWizard({
  isOpen,
  onClose,
  onBack,
  documents: rawDocuments,
  projectId,
  projectTitle,
  projectDescription,
  projectGenre,
  projectCoverImage,
  characters = [],
  links = [],
}: PublishingWizardProps) {
  const { toast } = useToast();
  const { data: allEvents = [] } = useProjectEvents(projectId);

  // 폴더 제외, 콘텐츠가 있는 문서만 필터링
  const documents: DocumentItem[] = useMemo(() => {
    return rawDocuments
      .filter((d) => d.type !== "folder" && d.content)
      .map((d, index) => ({
        id: d.id,
        title: d.title || "제목 없음",
        content: d.content || "",
        wordCount:
          d.wordCount || d.content?.replace(/<[^>]*>/g, "").length || 0,
        isPublished: d.isPublished || false,
        order: index,
      }));
  }, [rawDocuments]);

  // === 상태 관리 ===
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deployMode, setDeployMode] = useState<DeployMode>("individual");
  const [mergedTitle, setMergedTitle] = useState("");
  const [includeCharacters, setIncludeCharacters] = useState(true);
  const [includeGraph, setIncludeGraph] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);

  // 선택된 문서 목록 (순서 유지)
  const [orderedDocuments, setOrderedDocuments] = useState<DocumentItem[]>([]);

  // 선택 변경 시 ordered documents 업데이트
  const handleSelectionChange = (ids: string[]) => {
    setSelectedIds(ids);
    // 새로 추가된 문서는 끝에 추가
    const newDocs = ids
      .filter((id) => !orderedDocuments.find((d) => d.id === id))
      .map((id) => documents.find((d) => d.id === id)!)
      .filter(Boolean);
    // 제거된 문서는 제외
    const filteredDocs = orderedDocuments.filter((d) => ids.includes(d.id));
    setOrderedDocuments([...filteredDocs, ...newDocs]);
  };

  // 문서 순서 변경
  const handleDocumentsReorder = (newOrder: DocumentItem[]) => {
    setOrderedDocuments(newOrder);
    setSelectedIds(newOrder.map((d) => d.id));
  };

  // 문서 제거
  const handleRemoveDocument = (id: string) => {
    setSelectedIds(selectedIds.filter((sid) => sid !== id));
    setOrderedDocuments(orderedDocuments.filter((d) => d.id !== id));
  };

  // 다음 단계로 이동 가능 여부
  const canProceed = useMemo(() => {
    if (currentStep === 1) return selectedIds.length > 0;
    if (currentStep === 2) {
      if (deployMode === "merge") return mergedTitle.trim().length > 0;
      return true;
    }
    return true;
  }, [currentStep, selectedIds, deployMode, mergedTitle]);

  // === 그래프 스냅샷 생성 ===
  const createGraphSnapshot = () => {
    if (!includeCharacters && !includeGraph) {
      return { nodes: [], links: [], profiles: {}, relationshipAnalysis: {} };
    }

    const nodes = characters.map((c) => ({
      id: c._id,
      name: c.profile?.name || "이름 없음",
      role: c.role,
      group: c.profile?.faction?.name || undefined,
      imageUrl: c.imageUrl || undefined,
      x: c.graphPosition?.x,
      y: c.graphPosition?.y,
      fx: c.graphPosition?.x,
      fy: c.graphPosition?.y,
    }));

    const graphLinks = links.map((l) => {
      const relation = characters
        .find((c) => c._id === l.source)
        ?.relations?.graph?.find((r) => r.target === l.target);
      return {
        ...l,
        id: String(l.id),
        description: relation?.description,
        history: relation?.history || undefined,
      };
    });

    const profiles = Object.fromEntries(
      characters.map((c) => [
        c._id,
        {
          id: c._id,
          name: c.profile?.name,
          age: c.profile?.age || undefined,
          gender: c.profile?.gender,
          role: c.role,
          imageUrl: c.imageUrl || undefined,
          occupation: c.profile?.occupation || undefined,
          birthplace: c.profile?.birthplace || undefined,
          family: c.profile?.family || undefined,
          backstory: c.profile?.backstory || undefined,
          faction: c.profile?.faction?.name || undefined,
          aliases: c.aliases || undefined,
          firstAppearance: c.firstAppearance || undefined,
          personality: c.personality || undefined,
          appearance: c.appearance || undefined,
          motivation: c.motivation || undefined,
          currentMood: c.currentMood || undefined,
          relations: c.relations || undefined,
          meta: c.meta || undefined,
        },
      ]),
    );

    // === 관계별 심층 분석 데이터 생성 (storead 연동용) ===
    // link.id를 기본 키로 사용하여 키 충돌 방지
    // keyMap: source-target 조합으로 link.id를 조회할 수 있는 매핑 테이블
    const relationshipAnalysis: Record<
      string,
      RelationshipDeepAnalysisData & { _linkId: string }
    > = {};
    const keyMap: Record<string, string> = {}; // "source-target" -> linkId 매핑

    if (includeGraph && characters.length > 0) {
      links.forEach((link) => {
        const sourceChar = characters.find((c) => c._id === link.source);
        const targetChar = characters.find((c) => c._id === link.target);

        if (sourceChar && targetChar) {
          const linkId = String(link.id);
          const analysisData = generateAnalysisData(
            linkId,
            sourceChar,
            targetChar,
            [link.type],
            link.strength,
            allEvents, // 로드된 프로젝트 전체 이벤트 주입
            sourceChar.relations?.graph?.find((r) => r.target === link.target)
              ?.description,
          );

          // link.id를 기본 키로 저장 (충돌 방지)
          relationshipAnalysis[linkId] = { ...analysisData, _linkId: linkId };

          // 양방향 조회용 키 매핑 (source-target, target-source 모두 같은 linkId 참조)
          keyMap[`${link.source}-${link.target}`] = linkId;
          keyMap[`${link.target}-${link.source}`] = linkId;
        }
      });
    }

    return {
      nodes: includeGraph ? nodes : [],
      links: includeGraph ? graphLinks : [],
      profiles: includeCharacters ? profiles : {},
      relationshipAnalysis: includeGraph ? relationshipAnalysis : {},
      relationshipKeyMap: includeGraph ? keyMap : {}, // 양방향 조회용 키 매핑
    };
  };

  // === 배포 실행 ===
  const handlePublish = async () => {
    setIsPublishing(true);

    try {
      const graphSnapshot = createGraphSnapshot();

      if (deployMode === "merge") {
        // === 병합 배포: 모든 문서를 하나의 Draft로 합침 ===
        const content = orderedDocuments
          .map((doc) => doc.content || "")
          .join('<hr class="section-divider"/>');

        const { data: draft } = await draftService.createBulk({
          documentIds: orderedDocuments.map((d) => d.id),
          projectId,
          title: mergedTitle || orderedDocuments[0]?.title || "제목 없음",
          content,
          graphSnapshot,
          isMerged: true,
          workTitle: projectTitle || mergedTitle || "제목 없음",
          workSynopsis: projectDescription,
          workGenre: projectGenre,
          workCoverImage: projectCoverImage,
        });

        // Storead로 리다이렉트 (단일 Draft)
        window.open(`${COMMUNITY_URL}/write?draftId=${draft.id}`, "_blank");

        toast({
          title: "배포 준비 완료!",
          description: "새 탭에서 커뮤니티 페이지가 열렸습니다.",
        });
      } else {
        // === 개별 배포: 각 문서별로 별도의 Draft 생성 ===
        const draftIds: string[] = [];

        for (const doc of orderedDocuments) {
          const { data: draft } = await draftService.createBulk({
            documentIds: [doc.id],
            projectId,
            title: doc.title || "제목 없음",
            content: doc.content || "",
            graphSnapshot,
            isMerged: false,
            workTitle: projectTitle || doc.title || "제목 없음",
            workSynopsis: projectDescription,
            workGenre: projectGenre,
            workCoverImage: projectCoverImage,
          });
          draftIds.push(draft.id);
        }

        // Storead로 리다이렉트 (다중 Draft - 일괄 목록 처리)
        window.open(
          `${COMMUNITY_URL}/write?draftIds=${draftIds.join(",")}`,
          "_blank",
        );

        toast({
          title: "배포 준비 완료!",
          description: `${draftIds.length}개의 챕터가 준비되었습니다. 새 탭에서 확인하세요.`,
        });
      }

      onClose();
    } catch (error: unknown) {
      console.error("Draft 생성 실패:", error);

      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ||
        (error as { message?: string })?.message ||
        "알 수 없는 오류가 발생했습니다.";

      toast({
        title: "배포 준비 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // === 네비게이션 ===
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // 병합 제목 기본값 설정 (Step 2 진입 시)
  const handleNextWithDefaults = () => {
    if (currentStep === 1 && orderedDocuments.length > 0 && !mergedTitle) {
      setMergedTitle(orderedDocuments[0].title);
    }
    goToNextStep();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white [&>button]:hidden">
        {/* 헤더 */}
        <div className="relative flex items-center justify-between px-6 py-5 bg-mocha-500">
          <div className="relative flex items-center gap-3">
            <motion.div
              animate={{ rotate: currentStep * 120 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/20"
            >
              <Send className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <DialogTitle className="text-lg font-bold text-white drop-shadow-sm">
                커뮤니티 배포 (Step {currentStep}/3)
              </DialogTitle>
              <p className="text-xs text-white/70 mt-0.5">
                {projectTitle || "작품 제목 없음"}
              </p>
            </div>
          </div>
          <DialogDescription className="sr-only">
            커뮤니티 배포 마법사입니다. 3단계에 걸쳐 작품을 배포할 수 있습니다.
          </DialogDescription>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 스테퍼 */}
        <Stepper currentStep={currentStep} />

        {/* 본문 */}
        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <SelectionStep
                  documents={documents}
                  selectedIds={selectedIds}
                  onSelectionChange={handleSelectionChange}
                />
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <ConfigurationStep
                  selectedDocuments={orderedDocuments}
                  deployMode={deployMode}
                  onDeployModeChange={setDeployMode}
                  mergedTitle={mergedTitle}
                  onMergedTitleChange={setMergedTitle}
                  onDocumentsReorder={handleDocumentsReorder}
                  onRemoveDocument={handleRemoveDocument}
                />
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <ConfirmationStep
                  selectedDocuments={orderedDocuments}
                  deployMode={deployMode}
                  mergedTitle={mergedTitle}
                  includeCharacters={includeCharacters}
                  onIncludeCharactersChange={setIncludeCharacters}
                  includeGraph={includeGraph}
                  onIncludeGraphChange={setIncludeGraph}
                  charactersCount={characters.length}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 border-t border-cloud-100 bg-cloud-50/50">
          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={currentStep === 1 ? onBack || onClose : goToPrevStep}
              className="h-11 px-4 text-espresso-500 hover:text-espresso-700"
            >
              {currentStep === 1 ? (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  이전
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  이전
                </>
              )}
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={handleNextWithDefaults}
                disabled={!canProceed}
                className="h-11 px-6 bg-mocha-500 hover:bg-mocha-600 text-white font-bold"
              >
                다음 단계
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={isPublishing || !canProceed}
                className="h-11 px-6 bg-mocha-500 hover:bg-mocha-600 text-white font-bold"
              >
                {isPublishing ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    준비 중...
                  </>
                ) : (
                  <>
                    확인 및 배포
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PublishingWizard;
