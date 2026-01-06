import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Loader2, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject, useUpdateProject } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Project, Genre } from "@/types/project";

interface ProjectInfoCardProps {
  projectId: string;
}

const GENRE_OPTIONS: { value: Genre; label: string }[] = [
  { value: "fantasy", label: "판타지" },
  { value: "romance", label: "로맨스" },
  { value: "sf", label: "SF" },
  { value: "mystery", label: "미스터리" },
  { value: "other", label: "기타" },
];

export function ProjectInfoCard({ projectId }: ProjectInfoCardProps) {
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject();

  if (isLoading || !project) {
    return <ProjectInfoSkeleton />;
  }

  return (
    <ProjectInfoForm
      project={project}
      projectId={projectId}
      updateProject={updateProject}
    />
  );
}

function ProjectInfoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-24 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

interface ProjectInfoFormProps {
  project: Project;
  projectId: string;
  updateProject: ReturnType<typeof useUpdateProject>;
}

function ProjectInfoForm({
  project,
  projectId,
  updateProject,
}: ProjectInfoFormProps) {
  const [title, setTitle] = useState(project.title || "");
  const [genre, setGenre] = useState<Genre>(project.genre || "fantasy");
  const [description, setDescription] = useState(project.description || "");
  const [isDirty, setIsDirty] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // No useEffect needed for sync as we mount a fresh component when data loads

  const handleSave = async () => {
    if (!isDirty) return;

    try {
      await updateProject.mutateAsync({
        id: projectId,
        payload: { title, genre, description },
      });
      setIsDirty(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const handleChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setIsDirty(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="transition-all duration-300 hover:shadow-paper border-mocha-100 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl text-espresso-900">
            <BookOpen className="h-5 w-5 text-mocha-500" />
            작품 정보
          </CardTitle>
          <CardDescription className="text-muted-foreground font-serif">
            작품의 기본 정보를 수정합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-espresso-900 font-medium">
              제목
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleChange(setTitle, e.target.value)}
              placeholder="작품 제목"
              className="border-mocha-200 focus-visible:ring-mocha-400 bg-white/80"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="genre" className="text-espresso-900 font-medium">
              장르
            </Label>
            <Select
              value={genre}
              onValueChange={(value) => {
                setGenre(value as Genre);
                setIsDirty(true);
              }}
            >
              <SelectTrigger className="border-mocha-200 focus:ring-mocha-400 bg-white/80">
                <SelectValue placeholder="장르 선택" />
              </SelectTrigger>
              <SelectContent>
                {GENRE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="text-espresso-900 font-medium"
            >
              시놉시스
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => handleChange(setDescription, e.target.value)}
              placeholder="작품 소개를 입력하세요"
              rows={4}
              className="border-mocha-200 focus-visible:ring-mocha-400 bg-white/80 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {showSaved && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-sm text-success font-medium"
              >
                <Check className="h-4 w-4" />
                저장됨
              </motion.span>
            )}
            <Button
              onClick={handleSave}
              disabled={!isDirty || updateProject.isPending}
              className="bg-mocha-500 hover:bg-mocha-600 text-white shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              {updateProject.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "저장"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
