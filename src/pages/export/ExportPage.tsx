import { useState, useRef, useCallback, useEffect } from "react";
import {
  Download,
  Upload,
  FileText,
  FileJson,
  Book,
  Archive,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParams } from "react-router-dom";
import {
  exportToTxt,
  exportToMarkdown,
  exportToDocx,
  exportToJson,
  importFromJson,
  exportToEpub,
  exportToPdf,
} from "@/services/exportService";
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
import type { Document } from "@/types/document";
import {
  initializeSampleDocuments,
  SAMPLE_PROJECT_ID,
} from "@/data/sampleDocuments";

type ExportStatus = "idle" | "loading" | "success" | "error";

interface ExportFormat {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  accentColor: string; // Left bar accent color
  iconColor: string;
  bgColor: string;
  disabled?: boolean;
}

// Animation variants matching StatsPage
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export default function ExportPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [exportStatus, setExportStatus] = useState<
    Record<string, ExportStatus>
  >({});
  const [importStatus, setImportStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get documents from store
  const documentsMap = useDocumentStore((state) => state.documents);
  const documents = Object.values(documentsMap);

  // Initialize sample documents on first load
  useEffect(() => {
    initializeSampleDocuments();
  }, []);

  // Filter documents for current project
  let projectDocuments = documents.filter(
    (doc: Document) => doc.projectId === projectId,
  );

  // Fallback to sample project if no documents found
  if (projectDocuments.length === 0) {
    projectDocuments = documents.filter(
      (doc: Document) => doc.projectId === SAMPLE_PROJECT_ID,
    );
  }

  // Get project title
  const projectTitle =
    projectDocuments.find((doc: Document) => doc.type === "folder")?.title ||
    "작품";

  // Export formats with Mocha/Cloud design system colors
  const exportFormats: ExportFormat[] = [
    {
      id: "pdf",
      title: "PDF",
      description: "출력용 PDF 파일",
      icon: FileText,
      accentColor: "#A33A3A", // Error red (document-like)
      iconColor: "text-[#A33A3A]",
      bgColor: "bg-red-50/50",
    },
    {
      id: "docx",
      title: "Word (DOCX)",
      description: "Microsoft Word 형식",
      icon: FileText,
      accentColor: "#5B7B9C", // Muted blue
      iconColor: "text-[#5B7B9C]",
      bgColor: "bg-blue-50/50",
    },
    {
      id: "txt",
      title: "텍스트 (TXT)",
      description: "순수 텍스트 파일",
      icon: FileText,
      accentColor: "#8D8B88", // Cloud gray
      iconColor: "text-[#8D8B88]",
      bgColor: "bg-[#F1F0EC]",
    },
    {
      id: "markdown",
      title: "마크다운 (MD)",
      description: "마크다운 형식",
      icon: FileText,
      accentColor: "#8B7A8C", // Muted lavender
      iconColor: "text-[#8B7A8C]",
      bgColor: "bg-purple-50/50",
    },
    {
      id: "epub",
      title: "EPUB",
      description: "전자책 형식",
      icon: Book,
      accentColor: "#5B7B4B", // Success green
      iconColor: "text-[#5B7B4B]",
      bgColor: "bg-green-50/50",
    },
    {
      id: "json",
      title: "JSON 백업",
      description: "전체 데이터 백업",
      icon: FileJson,
      accentColor: "#A47764", // Mocha primary
      iconColor: "text-[#A47764]",
      bgColor: "bg-[#F1F0EC]",
    },
  ];

  const handleExport = useCallback(
    async (formatId: string) => {
      if (projectDocuments.length === 0) {
        alert("내보낼 문서가 없습니다.");
        return;
      }

      setExportStatus((prev) => ({ ...prev, [formatId]: "loading" }));

      try {
        switch (formatId) {
          case "txt":
            exportToTxt(projectDocuments, projectTitle);
            break;
          case "markdown":
            exportToMarkdown(projectDocuments, projectTitle);
            break;
          case "docx":
            await exportToDocx(projectDocuments, projectTitle);
            break;
          case "json":
            exportToJson(
              {
                version: "1.0",
                exportedAt: new Date().toISOString(),
                projectId,
                documents: projectDocuments,
              },
              projectTitle,
            );
            break;
          case "epub":
            await exportToEpub(projectDocuments, projectTitle);
            break;
          case "pdf":
            await exportToPdf(projectDocuments, projectTitle);
            break;
          default:
            alert(`${formatId.toUpperCase()} 형식은 아직 지원되지 않습니다.`);
            setExportStatus((prev) => ({ ...prev, [formatId]: "idle" }));
            return;
        }

        setExportStatus((prev) => ({ ...prev, [formatId]: "success" }));
        setTimeout(() => {
          setExportStatus((prev) => ({ ...prev, [formatId]: "idle" }));
        }, 2000);
      } catch (error) {
        console.error("Export error:", error);
        setExportStatus((prev) => ({ ...prev, [formatId]: "error" }));
        setTimeout(() => {
          setExportStatus((prev) => ({ ...prev, [formatId]: "idle" }));
        }, 3000);
      }
    },
    [projectDocuments, projectTitle, projectId],
  );

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Read file with encoding detection
  const readFileWithEncoding = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();

    try {
      const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
      const text = utf8Decoder.decode(buffer);
      if (!text.includes("�")) {
        return text;
      }
    } catch {
      // UTF-8 decoding failed
    }

    try {
      const eucKrDecoder = new TextDecoder("euc-kr");
      return eucKrDecoder.decode(buffer);
    } catch {
      const fallbackDecoder = new TextDecoder("utf-8", { fatal: false });
      return fallbackDecoder.decode(buffer);
    }
  };

  // Import a text file as a new document
  const importTextFile = async (file: File): Promise<void> => {
    const rawText = await readFileWithEncoding(file);
    const title = file.name.replace(/\.(txt|md)$/i, "");

    const cleanText = (text: string): string => {
      let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      cleaned = cleaned
        .replace(/\n{2,}/g, "<<<PARA>>>")
        .replace(/([.!?。！？])\n(?=[^\s])/g, "$1<<<PARA>>>")
        .replace(/\n/g, " ")
        .replace(/<<<PARA>>>/g, "\n\n")
        .replace(/  +/g, " ")
        .trim();
      return cleaned;
    };

    const text = cleanText(rawText);
    const content = text
      .split("\n\n")
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join("");

    const { _create, documents } = useDocumentStore.getState();
    const now = new Date().toISOString();
    const targetProjectId = projectId || SAMPLE_PROJECT_ID;

    let importFolderId = Object.values(documents).find(
      (doc) =>
        doc.projectId === targetProjectId &&
        doc.type === "folder" &&
        doc.title === "가져온 문서",
    )?.id;

    if (!importFolderId) {
      importFolderId = `folder-import-${Date.now()}`;
      _create({
        id: importFolderId,
        projectId: targetProjectId,
        type: "folder",
        title: "가져온 문서",
        content: "",
        synopsis: "외부에서 가져온 문서들",
        order: 999,
        metadata: {
          status: "draft",
          wordCount: 0,
          includeInCompile: true,
          keywords: [],
          notes: "",
        },
        characterIds: [],
        foreshadowingIds: [],
        createdAt: now,
        updatedAt: now,
      });
    }

    const docId = `doc-import-${Date.now()}`;
    _create({
      id: docId,
      projectId: targetProjectId,
      parentId: importFolderId,
      type: "text",
      title,
      content,
      synopsis: "",
      order: projectDocuments.length,
      metadata: {
        status: "draft",
        wordCount: text.length,
        includeInCompile: true,
        keywords: [],
        notes: "",
      },
      characterIds: [],
      foreshadowingIds: [],
      createdAt: now,
      updatedAt: now,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await handleFiles(Array.from(files));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFiles = async (files: File[]) => {
    setImportStatus("loading");
    setImportError(null);

    try {
      let importedCount = 0;

      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase();

        if (ext === "json") {
          const data = await importFromJson(file);
          if (data.documents && Array.isArray(data.documents)) {
            const { _setAll } = useDocumentStore.getState();
            _setAll(data.documents as Document[]);
            importedCount++;
          }
        } else if (ext === "txt" || ext === "md") {
          await importTextFile(file);
          importedCount++;
        }
      }

      if (importedCount > 0) {
        setImportStatus("success");
        setTimeout(() => setImportStatus("idle"), 2000);
      } else {
        throw new Error("지원되지 않는 파일 형식입니다.");
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus("error");
      setImportError(
        error instanceof Error ? error.message : "가져오기에 실패했습니다.",
      );
      setTimeout(() => {
        setImportStatus("idle");
        setImportError(null);
      }, 3000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFiles(files);
    }
  };

  const getButtonIcon = (format: ExportFormat, status: ExportStatus) => {
    switch (status) {
      case "loading":
        return (
          <Loader2 className={`h-6 w-6 ${format.iconColor} animate-spin`} />
        );
      case "success":
        return <Check className="h-6 w-6 text-[#5B7B4B]" />;
      case "error":
        return <AlertCircle className="h-6 w-6 text-[#A33A3A]" />;
      default:
        return <format.icon className={`h-6 w-6 ${format.iconColor}`} />;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-[#f8f7f5] p-6 lg:p-8 font-sans text-[#3D302A]">
      <motion.div
        className="max-w-4xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header with animation */}
        <motion.div className="flex flex-col gap-2" variants={fadeInVariants}>
          <h1 className="text-3xl font-serif font-bold text-[#3D302A] flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <Download className="w-8 h-8 text-[#A47764]" />
            </motion.div>
            내보내기 / 가져오기
          </h1>
          <p className="text-[#8D8B88] font-medium">
            작품을 다양한 형식으로 내보내거나 백업 파일을 가져오세요
          </p>
          {projectDocuments.length > 0 && (
            <motion.p
              className="text-sm text-[#A47764] font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              📄 {projectDocuments.filter((d) => d.type === "text").length}개
              문서 준비됨
            </motion.p>
          )}
        </motion.div>

        {/* Export Section */}
        <motion.div variants={cardVariants}>
          <Card className="border-none shadow-sm bg-white relative overflow-hidden hover:shadow-paper-hover transition-all duration-300">
            <div className="absolute left-0 top-0 w-1.5 h-full bg-[#A47764]" />

            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-serif font-bold text-[#3D302A] flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Download className="w-5 h-5 text-[#A47764]" />
                </motion.div>
                내보내기
              </CardTitle>
              <CardDescription className="text-[#8D8B88]">
                원하는 형식을 선택하여 작품을 내보내세요
              </CardDescription>
            </CardHeader>

            <CardContent>
              <motion.div
                className="grid grid-cols-2 md:grid-cols-3 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {exportFormats.map((format) => (
                  <motion.button
                    key={format.id}
                    variants={cardVariants}
                    onClick={() => handleExport(format.id)}
                    disabled={
                      format.disabled || exportStatus[format.id] === "loading"
                    }
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-4 rounded-xl border border-[#E6E4E0] text-left group
                      transition-all duration-300 overflow-hidden
                      hover:border-[#BD9B8D] hover:shadow-md
                      ${format.disabled ? "opacity-50 cursor-not-allowed" : ""}
                      ${exportStatus[format.id] === "success" ? "border-[#5B7B4B]/50 bg-[#5B7B4B]/5" : ""}
                      ${exportStatus[format.id] === "error" ? "border-[#A33A3A]/50 bg-[#A33A3A]/5" : ""}`}
                  >
                    {/* Accent bar */}
                    <div
                      className="absolute left-0 top-0 w-1 h-full transition-all duration-300 group-hover:w-1.5"
                      style={{ backgroundColor: format.accentColor }}
                    />

                    <div
                      className={`w-12 h-12 ${format.bgColor} rounded-xl flex items-center justify-center mb-3
                        group-hover:scale-110 transition-transform duration-300`}
                    >
                      {getButtonIcon(format, exportStatus[format.id] || "idle")}
                    </div>
                    <h3 className="font-semibold text-[#3D302A]">
                      {format.title}
                    </h3>
                    <p className="text-xs text-[#8D8B88] mt-1">
                      {format.description}
                    </p>
                  </motion.button>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Import Section */}
        <motion.div variants={cardVariants}>
          <Card className="border-none shadow-sm bg-white relative overflow-hidden hover:shadow-paper-hover transition-all duration-300">
            <div className="absolute left-0 top-0 w-1.5 h-full bg-[#7A8C6F]" />

            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-serif font-bold text-[#3D302A] flex items-center gap-2">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Upload className="w-5 h-5 text-[#7A8C6F]" />
                </motion.div>
                가져오기
              </CardTitle>
              <CardDescription className="text-[#8D8B88]">
                TXT, MD 파일을 새 문서로 추가하거나 JSON 백업을 복원하세요
              </CardDescription>
            </CardHeader>

            <CardContent>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json,.txt,.md"
                multiple
                className="hidden"
              />
              <motion.div
                onClick={handleImportClick}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`border-2 border-dashed rounded-xl p-8
                  text-center transition-all cursor-pointer
                  ${importStatus === "success" ? "border-[#5B7B4B]/50 bg-[#5B7B4B]/5" : ""}
                  ${importStatus === "error" ? "border-[#A33A3A]/50 bg-[#A33A3A]/5" : ""}
                  ${importStatus === "idle" ? "border-[#BD9B8D]/40 hover:border-[#A47764] hover:bg-[#A47764]/5" : ""}
                  ${importStatus === "loading" ? "border-[#A47764] bg-[#A47764]/10" : ""}`}
              >
                <motion.div
                  className="w-16 h-16 bg-[#F1F0EC] rounded-2xl flex items-center justify-center mx-auto mb-4"
                  animate={
                    importStatus === "loading"
                      ? { rotate: 360 }
                      : importStatus === "success"
                        ? { scale: [1, 1.1, 1] }
                        : {}
                  }
                  transition={
                    importStatus === "loading"
                      ? { repeat: Infinity, duration: 2, ease: "linear" }
                      : { duration: 0.3 }
                  }
                >
                  {importStatus === "loading" ? (
                    <Loader2 className="h-8 w-8 text-[#A47764] animate-spin" />
                  ) : importStatus === "success" ? (
                    <Check className="h-8 w-8 text-[#5B7B4B]" />
                  ) : importStatus === "error" ? (
                    <AlertCircle className="h-8 w-8 text-[#A33A3A]" />
                  ) : (
                    <Archive className="h-8 w-8 text-[#8D8B88]" />
                  )}
                </motion.div>

                {importStatus === "success" ? (
                  <>
                    <h3 className="font-semibold mb-2 text-[#5B7B4B]">
                      가져오기 완료!
                    </h3>
                    <p className="text-sm text-[#5B7B4B]/80">
                      데이터가 성공적으로 복원되었습니다.
                    </p>
                  </>
                ) : importStatus === "error" ? (
                  <>
                    <h3 className="font-semibold mb-2 text-[#A33A3A]">
                      가져오기 실패
                    </h3>
                    <p className="text-sm text-[#A33A3A]/80">{importError}</p>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold mb-2 text-[#3D302A]">
                      파일을 드래그하거나 클릭하세요
                    </h3>
                    <p className="text-sm text-[#8D8B88]">
                      지원 형식: TXT, MD, JSON
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 border-[#BD9B8D] text-[#A47764] hover:bg-[#A47764]/10"
                      disabled={importStatus === "loading"}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      파일 선택
                    </Button>
                  </>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Section */}
        <motion.div variants={cardVariants}>
          <Card className="border-none shadow-sm bg-gradient-to-br from-[#F1F0EC] to-white relative overflow-hidden">
            <div className="absolute left-0 top-0 w-1.5 h-full bg-[#B8860B]" />

            <CardContent className="pt-6">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-[#B8860B]/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-[#B8860B]" />
                </div>
                <div className="text-sm text-[#3D302A]">
                  <p className="font-semibold mb-2 text-[#7D5A4B]">
                    내보내기 팁
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[#8D8B88]">
                    <li>
                      <strong className="text-[#3D302A]">TXT/MD</strong>는 다른
                      편집기에서 열어볼 때 유용합니다
                    </li>
                    <li>
                      <strong className="text-[#3D302A]">DOCX</strong>는 출판사
                      제출이나 인쇄에 적합합니다
                    </li>
                    <li>
                      <strong className="text-[#3D302A]">JSON 백업</strong>은
                      정기적으로 해두세요 - 모든 데이터를 복원할 수 있습니다
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
