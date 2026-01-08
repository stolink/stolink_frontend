/**
 * ExportGatewayModal - 내보내기/배포 선택 게이트웨이
 * 파일 다운로드 또는 커뮤니티 배포 중 선택하는 진입점 모달
 */

import { useState } from "react";
import { FileDown, Send, X, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExportDownloadModal } from "./ExportDownloadModal";
import { PublishingWizard } from "./PublishingWizard/PublishingWizard";
import type { Character } from "@/types/character";

interface ExportGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  currentId?: string;
  characters?: Character[];
  links?: Array<{
    source: string;
    target: string;
    id: string | number;
    type: string;
    strength: number;
  }>;
}

type GatewaySelection = "none" | "download" | "publish";

export function ExportGatewayModal({
  isOpen,
  onClose,
  documents,
  projectId,
  projectTitle,
  projectDescription,
  projectGenre,
  projectCoverImage,
  currentId,
  characters = [],
  links = [],
}: ExportGatewayModalProps) {
  const [selection, setSelection] = useState<GatewaySelection>("none");

  // 게이트웨이 모달 닫기 (하위 모달 닫힐 때도 함께 닫기)
  const handleClose = () => {
    setSelection("none");
    onClose();
  };

  // 하위 모달만 닫기 (게이트웨이로 돌아옴)
  const handleSubModalClose = () => {
    setSelection("none");
  };

  // 게이트웨이 선택 UI
  if (selection === "none") {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden rounded-3xl border-0 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white [&>button]:hidden">
          {/* 헤더 */}
          <div className="relative flex items-center justify-between px-6 py-5 bg-gradient-to-r from-mocha-500 via-mocha-400 to-mocha-500">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/20">
                <FileDown className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white font-heading drop-shadow-sm">
                  내보내기
                </DialogTitle>
                <p className="text-xs text-white/70 mt-0.5">
                  {projectTitle || "작품 제목 없음"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 선택 카드 */}
          <div className="p-6 space-y-4">
            {/* 파일 다운로드 카드 */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelection("download")}
              className={cn(
                "w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200",
                "border-cloud-200 hover:border-mocha-400 hover:shadow-paper bg-white",
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center shadow-sm">
                <FileDown className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-espresso-900 mb-1">
                  파일 다운로드
                </div>
                <p className="text-sm text-espresso-500">
                  HTML, TXT 형식으로 원고를 내보냅니다
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-espresso-400" />
            </motion.button>

            {/* 커뮤니티 배포 카드 */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelection("publish")}
              className={cn(
                "w-full flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all duration-200",
                "border-cloud-200 hover:border-mocha-400 hover:shadow-paper bg-white",
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mocha-100 to-mocha-50 flex items-center justify-center shadow-sm">
                <Send className="w-6 h-6 text-mocha-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-espresso-900 mb-1">
                  커뮤니티 배포
                </div>
                <p className="text-sm text-espresso-500">
                  Storead에 다중 섹션을 한 번에 배포합니다
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-espresso-400" />
            </motion.button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // 파일 다운로드 모달
  if (selection === "download") {
    return (
      <ExportDownloadModal
        isOpen={true}
        onClose={handleClose}
        onBack={handleSubModalClose}
        documents={documents}
        currentId={currentId}
        projectTitle={projectTitle}
      />
    );
  }

  // 커뮤니티 배포 위저드
  if (selection === "publish") {
    return (
      <PublishingWizard
        isOpen={true}
        onClose={handleClose}
        onBack={handleSubModalClose}
        documents={documents}
        projectId={projectId}
        projectTitle={projectTitle}
        projectDescription={projectDescription}
        projectGenre={projectGenre}
        projectCoverImage={projectCoverImage}
        characters={characters}
        links={links}
      />
    );
  }

  return null;
}

export default ExportGatewayModal;
