import { useState } from "react";
import { Users, Tag, FileText, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Scene, SceneStatus, Character } from "@/types";

interface SceneInspectorProps {
  scene: Scene | null;
  characters?: Character[];
  onUpdateScene?: (sceneId: string, updates: Partial<Scene>) => void;
  onAddCharacter?: (sceneId: string, characterId: string) => void;
  onRemoveCharacter?: (sceneId: string, characterId: string) => void;
  className?: string;
}

const STATUS_OPTIONS: { value: SceneStatus; label: string; color: string }[] = [
  { value: "draft", label: "초고", color: "bg-stone-100 text-stone-600" },
  { value: "revised", label: "수정 중", color: "bg-amber-100 text-amber-700" },
  { value: "final", label: "완료", color: "bg-green-100 text-green-700" },
];

const LABEL_PRESETS = [
  { value: "pov-protagonist", label: "POV: 주인공", color: "#3B82F6" },
  { value: "pov-heroine", label: "POV: 히로인", color: "#EC4899" },
  { value: "timeline-past", label: "과거", color: "#9CA3AF" },
  { value: "timeline-present", label: "현재", color: "#10B981" },
  { value: "timeline-future", label: "미래", color: "#F59E0B" },
];

export default function SceneInspector({
  scene,
  characters = [],
  onUpdateScene,
  onAddCharacter,
  onRemoveCharacter,
  className,
}: SceneInspectorProps) {
  // 로컬 수정 상태 (편집 모드용)
  const [localSynopsis, setLocalSynopsis] = useState("");
  const [localNotes, setLocalNotes] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCharId, setSelectedCharId] = useState("");

  // 편집 모드 시작 시 현재 값으로 초기화
  const startEditing = () => {
    setLocalSynopsis(scene?.metadata?.synopsis || "");
    setLocalNotes(scene?.metadata?.notes || "");
    setIsEditing(true);
  };

  if (!scene) {
    return (
      <div className={cn("p-4 text-center text-muted-foreground", className)}>
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">
          씬을 선택하면
          <br />
          상세 정보가 표시됩니다.
        </p>
      </div>
    );
  }

  const handleSave = () => {
    onUpdateScene?.(scene.id, {
      metadata: {
        ...scene.metadata,
        synopsis: localSynopsis,
        notes: localNotes,
      },
    });
    setIsEditing(false);
  };

  const handleStatusChange = (status: SceneStatus) => {
    onUpdateScene?.(scene.id, {
      metadata: {
        ...scene.metadata,
        status,
      },
    });
  };

  const handleLabelChange = (labelValue: string) => {
    const preset = LABEL_PRESETS.find((p) => p.value === labelValue);
    onUpdateScene?.(scene.id, {
      metadata: {
        ...scene.metadata,
        label: preset?.label,
        labelColor: preset?.color,
      },
    });
  };

  const sceneCharacters = characters.filter((c) =>
    scene.characterIds?.includes(c.id),
  );

  const availableCharacters = characters.filter(
    (c) => !scene.characterIds?.includes(c.id),
  );

  return (
    <div className={cn("flex flex-col gap-4 p-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm text-stone-700">씬 정보</h3>
        {isEditing ? (
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={handleSave}
            >
              <Save className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setIsEditing(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={startEditing}
          >
            편집
          </Button>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="text-xs text-muted-foreground">제목</label>
        <p className="text-sm font-medium">{scene.title}</p>
      </div>

      {/* Status */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">상태</label>
        <Select
          value={scene.metadata?.status || "draft"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span
                  className={cn("px-2 py-0.5 rounded text-xs", option.color)}
                >
                  {option.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Label (POV, Timeline) */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">라벨</label>
        <Select
          value={
            LABEL_PRESETS.find((p) => p.label === scene.metadata?.label)
              ?.value || ""
          }
          onValueChange={handleLabelChange}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="라벨 선택..." />
          </SelectTrigger>
          <SelectContent>
            {LABEL_PRESETS.map((preset) => (
              <SelectItem key={preset.value} value={preset.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: preset.color }}
                  />
                  {preset.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Synopsis */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          시놉시스
        </label>
        {isEditing ? (
          <Textarea
            value={localSynopsis}
            onChange={(e) => setLocalSynopsis(e.target.value)}
            placeholder="이 씬의 간단한 요약..."
            className="text-sm min-h-[80px]"
          />
        ) : (
          <p className="text-sm text-stone-600 bg-stone-50 p-2 rounded min-h-[60px]">
            {scene.metadata?.synopsis || "(시놉시스 없음)"}
          </p>
        )}
      </div>

      {/* Characters */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
          <Users className="w-3 h-3" />
          등장 캐릭터
        </label>
        <div className="flex flex-wrap gap-1 mb-2">
          {sceneCharacters.length > 0 ? (
            sceneCharacters.map((char) => (
              <Badge
                key={char.id}
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-red-100"
                onClick={() => onRemoveCharacter?.(scene.id, char.id)}
              >
                {char.name}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">
              (등장 캐릭터 없음)
            </span>
          )}
        </div>
        {availableCharacters.length > 0 && onAddCharacter && (
          <Select
            value={selectedCharId}
            onValueChange={(charId: string) => {
              onAddCharacter(scene.id, charId);
              setSelectedCharId(""); // 선택 후 초기화
            }}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="캐릭터 추가..." />
            </SelectTrigger>
            <SelectContent>
              {availableCharacters.map((char) => (
                <SelectItem key={char.id} value={char.id}>
                  {char.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Keywords */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
          <Tag className="w-3 h-3" />
          키워드
        </label>
        <div className="flex flex-wrap gap-1">
          {scene.metadata?.keywords?.length > 0 ? (
            scene.metadata.keywords.map((kw, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                #{kw}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">(키워드 없음)</span>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          작가 메모
        </label>
        {isEditing ? (
          <Textarea
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            placeholder="이 씬에 대한 메모..."
            className="text-sm min-h-[60px]"
          />
        ) : (
          <p className="text-sm text-stone-600 bg-stone-50 p-2 rounded min-h-[40px]">
            {scene.metadata?.notes || "(메모 없음)"}
          </p>
        )}
      </div>

      {/* Word Count */}
      <div className="pt-2 border-t text-xs text-muted-foreground">
        <span>
          글자 수: {scene.metadata?.wordCount?.toLocaleString() || 0}자
        </span>
        {scene.metadata?.targetWordCount && (
          <span className="ml-2">
            / 목표: {scene.metadata.targetWordCount.toLocaleString()}자
          </span>
        )}
      </div>
    </div>
  );
}
