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
  color: string;
  bgColor: string;
  disabled?: boolean;
}

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
  // If no documents found for projectId, fall back to sample project
  let projectDocuments = documents.filter(
    (doc: Document) => doc.projectId === projectId
  );

  // Fallback to sample project if no documents found
  if (projectDocuments.length === 0) {
    projectDocuments = documents.filter(
      (doc: Document) => doc.projectId === SAMPLE_PROJECT_ID
    );
  }

  // Get project title (from first folder or default)
  const projectTitle =
    projectDocuments.find((doc: Document) => doc.type === "folder")?.title ||
    "작품";

  const exportFormats: ExportFormat[] = [
    {
      id: "pdf",
      title: "PDF",
      description: "출력용 PDF 파일",
      icon: FileText,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
    {
      id: "docx",
      title: "Word (DOCX)",
      description: "Microsoft Word 형식",
      icon: FileText,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      id: "txt",
      title: "텍스트 (TXT)",
      description: "순수 텍스트 파일",
      icon: FileText,
      color: "text-muted-foreground",
      bgColor: "bg-cloud-50",
    },
    {
      id: "markdown",
      title: "마크다운 (MD)",
      description: "마크다운 형식",
      icon: FileText,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
    },
    {
      id: "epub",
      title: "EPUB",
      description: "전자책 형식",
      icon: Book,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      id: "json",
      title: "JSON 백업",
      description: "전체 데이터 백업",
      icon: FileJson,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
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
              projectTitle
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

        // Reset after 2 seconds
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
    [projectDocuments, projectTitle, projectId]
  );

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Read file with encoding detection (UTF-8 first, then EUC-KR for Korean files)
  const readFileWithEncoding = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();

    // Try UTF-8 first
    try {
      const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
      const text = utf8Decoder.decode(buffer);
      if (!text.includes("�")) {
        return text;
      }
    } catch {
      // UTF-8 decoding failed
    }

    // Fallback to EUC-KR (common for old Korean files)
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

    // Smart text cleanup: remove hard line breaks within paragraphs
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

    // Convert plain text to HTML paragraphs
    const content = text
      .split("\n\n")
      .filter((p) => p.trim())
      .map((p) => `<p>${p.trim()}</p>`)
      .join("");

    const { _create, documents } = useDocumentStore.getState();
    const now = new Date().toISOString();
    const targetProjectId = projectId || SAMPLE_PROJECT_ID;

    // Find or create "가져온 문서" folder
    let importFolderId = Object.values(documents).find(
      (doc) =>
        doc.projectId === targetProjectId &&
        doc.type === "folder" &&
        doc.title === "가져온 문서"
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

    // Reset file input
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
          // JSON backup restore
          const data = await importFromJson(file);
          if (data.documents && Array.isArray(data.documents)) {
            const { _setAll } = useDocumentStore.getState();
            _setAll(data.documents as Document[]);
            importedCount++;
          }
        } else if (ext === "txt" || ext === "md") {
          // Text file import
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
        error instanceof Error ? error.message : "가져오기에 실패했습니다."
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

  const getButtonIcon = (formatId: string, status: ExportStatus) => {
    const format = exportFormats.find((f) => f.id === formatId);
    if (!format) return null;

    switch (status) {
      case "loading":
        return <Loader2 className={`h-6 w-6 ${format.color} animate-spin`} />;
      case "success":
        return <Check className="h-6 w-6 text-green-500" />;
      case "error":
        return <AlertCircle className="h-6 w-6 text-red-500" />;
      default:
        return <format.icon className={`h-6 w-6 ${format.color}`} />;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-paper p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Download className="h-6 w-6 text-mocha-500" />
            내보내기 / 가져오기
          </h1>
          <p className="text-muted-foreground mt-1">
            작품을 다양한 형식으로 내보내거나 백업 파일을 가져오세요
          </p>
          {projectDocuments.length > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              📄 {projectDocuments.filter((d) => d.type === "text").length}개
              문서 준비됨
            </p>
          )}
        </div>

        {/* Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              내보내기
            </CardTitle>
            <CardDescription>
              원하는 형식을 선택하여 작품을 내보내세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {exportFormats.map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleExport(format.id)}
                  disabled={
                    format.disabled || exportStatus[format.id] === "loading"
                  }
                  className={`p-4 rounded-xl border-2 border-input hover:border-mocha-300
                           hover:shadow-md transition-all text-left group
                           ${format.disabled ? "opacity-50 cursor-not-allowed" : ""}
                           ${exportStatus[format.id] === "success" ? "border-status-success/50 bg-status-success/10" : ""}
                           ${exportStatus[format.id] === "error" ? "border-status-error/50 bg-status-error/10" : ""}`}
                >
                  <div
                    className={`w-12 h-12 ${format.bgColor} rounded-xl flex items-center justify-center mb-3
                                  group-hover:scale-110 transition-transform`}
                  >
                    {getButtonIcon(
                      format.id,
                      exportStatus[format.id] || "idle"
                    )}
                  </div>
                  <h3 className="font-medium">{format.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format.description}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              가져오기
            </CardTitle>
            <CardDescription>
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
            <div
              onClick={handleImportClick}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8
                        text-center transition-colors cursor-pointer
                        ${importStatus === "success" ? "border-status-success/50 bg-status-success/10" : ""}
                        ${importStatus === "error" ? "border-status-error/50 bg-status-error/10" : ""}
                        ${importStatus === "idle" ? "border-muted-foreground/30 hover:border-mocha-400 hover:bg-mocha-400/10" : ""}
                        ${importStatus === "loading" ? "border-mocha-400 bg-mocha-400/10" : ""}`}
            >
              <div className="w-16 h-16 bg-cloud-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  ) : importStatus === "success" ? (
                    <Check className="h-8 w-8 text-status-success" />
                  ) : importStatus === "error" ? (
                    <AlertCircle className="h-8 w-8 text-status-error" />
                  ) : (
                    <Archive className="h-8 w-8 text-muted-foreground" />
                  )}
              </div>

              {importStatus === "success" ? (
                <>
                  <h3 className="font-medium mb-2 text-green-700">
                    가져오기 완료!
                  </h3>
                  <p className="text-sm text-green-600">
                    데이터가 성공적으로 복원되었습니다.
                  </p>
                </>
              ) : importStatus === "error" ? (
                <>
                  <h3 className="font-medium mb-2 text-red-700">
                    가져오기 실패
                  </h3>
                  <p className="text-sm text-red-600">{importError}</p>
                </>
              ) : (
                <>
                  <h3 className="font-medium mb-2">
                    파일을 드래그하거나 클릭하세요
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    지원 형식: TXT, MD, JSON
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    disabled={importStatus === "loading"}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    파일 선택
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">내보내기 팁</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>
                    <strong>TXT/MD</strong>는 다른 편집기에서 열어볼 때
                    유용합니다
                  </li>
                  <li>
                    <strong>DOCX</strong>는 출판사 제출이나 인쇄에 적합합니다
                  </li>
                  <li>
                    <strong>JSON 백업</strong>은 정기적으로 해두세요 - 모든
                    데이터를 복원할 수 있습니다
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
