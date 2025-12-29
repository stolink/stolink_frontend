import { useEditorSettingStore } from "@/stores/useEditorSettingStore";
import type {
  FontFamily,
  Theme,
  EditorWidth,
  TypewriterMode,
  BehaviorSettings,
} from "@/stores/types/editorSettings";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Type,
  Palette,
  Settings2,
  RotateCcw,
  AlignLeft,
  Minus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FONT_OPTIONS: Array<{
  value: FontFamily;
  label: string;
  category: string;
}> = [
  { value: "system", label: "시스템 기본", category: "시스템" },
  { value: "pretendard", label: "Pretendard", category: "고딕" },
  { value: "noto-sans-kr", label: "Noto Sans KR", category: "고딕" },
  { value: "spoqa-han-sans", label: "스포카 한 산스", category: "고딕" },
  { value: "ridi-batang", label: "리디바탕", category: "명조" },
  { value: "nanum-myeongjo", label: "나눔명조", category: "명조" },
  { value: "kopub-batang", label: "KoPub 바탕", category: "명조" },
  { value: "source-han-serif", label: "본명조", category: "명조" },
  { value: "d2coding", label: "D2Coding", category: "고정폭" },
  { value: "jetbrains-mono", label: "JetBrains Mono", category: "고정폭" },
];

const THEME_OPTIONS: Array<{
  value: Theme;
  label: string;
  description: string;
}> = [
  { value: "light", label: "라이트", description: "밝은 테마" },
  { value: "dark", label: "다크", description: "어두운 테마" },
  { value: "sepia", label: "세피아", description: "따뜻한 톤" },
  { value: "eye-care", label: "눈 보호", description: "미색 배경" },
  { value: "true-black", label: "트루블랙", description: "OLED 최적화" },
];

const WIDTH_OPTIONS: Array<{
  value: EditorWidth;
  label: string;
  pixels: string;
}> = [
  { value: "narrow", label: "좁게", pixels: "640px" },
  { value: "standard", label: "표준", pixels: "720px" },
  { value: "wide", label: "넓게", pixels: "960px" },
  { value: "full", label: "전체", pixels: "100%" },
];

const TYPEWRITER_OPTIONS: Array<{ value: TypewriterMode; label: string }> = [
  { value: "off", label: "끄기" },
  { value: "center", label: "중앙" },
  { value: "top", label: "상단" },
  { value: "bottom", label: "하단" },
];

const LINGUISTIC_OPTIONS: Array<{
  value: BehaviorSettings["linguisticMode"];
  label: string;
  description: string;
}> = [
  { value: "off", label: "끄기", description: "" },
  { value: "dialogue", label: "대화문 강조", description: "대화만 보이게" },
  {
    value: "adverb-adjective",
    label: "부사/형용사",
    description: "과다 사용 감지",
  },
  { value: "paragraph-length", label: "문단 길이", description: "호흡 분석" },
];

// Default values for safety
const DEFAULT_TYPOGRAPHY = {
  fontFamily: "pretendard" as const,
  fontSize: 16,
  lineHeight: 1.8,
  letterSpacing: 0,
  paragraphSpacing: 0.5,
  indent: 0,
};

const DEFAULT_VISUAL = {
  theme: "light" as const,
  width: "standard" as const,
  showLineNumbers: false,
  highlightCurrentLine: true,
  caretStyle: { width: 2, blink: "blink" as const },
};

const DEFAULT_BEHAVIOR = {
  typewriterMode: "off" as const,
  typewriterSmoothScroll: true,
  focusMode: false,
  zenMode: false,
  smartQuotes: true,
  smartDashes: true,
  smartEllipsis: true,
  linguisticMode: "off" as const,
};

interface EditorSettingsPanelProps {
  className?: string;
}

export function EditorSettingsPanel({ className }: EditorSettingsPanelProps) {
  const {
    typography: rawTypography,
    visual: rawVisual,
    behavior: rawBehavior,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setIndent,
    setTheme,
    setEditorWidth,
    setHighlightCurrentLine,
    setTypewriterMode,
    toggleFocusMode,
    setSmartQuotes,
    setSmartDashes,
    setSmartEllipsis,
    setLinguisticMode,
    resetToDefaults,
  } = useEditorSettingStore();

  // Merge with defaults to prevent undefined errors
  const typography = { ...DEFAULT_TYPOGRAPHY, ...rawTypography };
  const visual = { ...DEFAULT_VISUAL, ...rawVisual };
  const behavior = { ...DEFAULT_BEHAVIOR, ...rawBehavior };

  return (
    <div className={cn("w-full", className)}>
      <Tabs defaultValue="typography" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="typography" className="text-sm gap-1">
            <Type className="w-3.5 h-3.5" />
            글꼴
          </TabsTrigger>
          <TabsTrigger value="visual" className="text-sm gap-1">
            <Palette className="w-3.5 h-3.5" />
            시각
          </TabsTrigger>
          <TabsTrigger value="behavior" className="text-sm gap-1">
            <Settings2 className="w-3.5 h-3.5" />
            동작
          </TabsTrigger>
        </TabsList>

        {/* Typography Tab */}
        <TabsContent value="typography" className="mt-0 space-y-5">
          {/* Font Family */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">글꼴</Label>
            <Select
              value={typography.fontFamily}
              onValueChange={(value) => setFontFamily(value as FontFamily)}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        [{font.category}]
                      </span>
                      {font.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              글자 크기: {typography.fontSize}px
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setFontSize(typography.fontSize - 1)}
                disabled={typography.fontSize <= 14}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <input
                type="range"
                min={14}
                max={32}
                value={typography.fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="flex-1 h-2 accent-mocha-500"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setFontSize(typography.fontSize + 1)}
                disabled={typography.fontSize >= 32}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Line Height */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              줄 간격: {typography.lineHeight.toFixed(1)}
            </Label>
            <input
              type="range"
              min={1.0}
              max={3.0}
              step={0.1}
              value={typography.lineHeight}
              onChange={(e) => setLineHeight(parseFloat(e.target.value))}
              className="w-full h-2 accent-mocha-500"
            />
          </div>

          {/* First Line Indent */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1">
              <AlignLeft className="w-3.5 h-3.5" />첫 줄 들여쓰기:{" "}
              {typography.indent === 0 ? "없음" : `${typography.indent}글자`}
            </Label>
            <input
              type="range"
              min={0}
              max={3}
              step={0.5}
              value={typography.indent}
              onChange={(e) => setIndent(parseFloat(e.target.value))}
              className="w-full h-2 accent-mocha-500"
            />
          </div>
        </TabsContent>

        {/* Visual Tab */}
        <TabsContent value="visual" className="mt-0 space-y-5">
          {/* Theme */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">테마</Label>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((theme) => (
                <Toggle
                  key={theme.value}
                  pressed={visual.theme === theme.value}
                  onPressedChange={() => setTheme(theme.value)}
                  size="sm"
                  className="flex flex-col items-center gap-0.5 h-auto py-2 data-[state=on]:bg-mocha-100 data-[state=on]:text-mocha-700"
                >
                  <span className="text-sm font-medium">{theme.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {theme.description}
                  </span>
                </Toggle>
              ))}
            </div>
          </div>

          {/* Editor Width */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              편집 폭
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {WIDTH_OPTIONS.map((width) => (
                <Toggle
                  key={width.value}
                  pressed={visual.width === width.value}
                  onPressedChange={() => setEditorWidth(width.value)}
                  size="sm"
                  className="flex flex-col items-center gap-0.5 h-auto py-2 text-sm data-[state=on]:bg-mocha-100 data-[state=on]:text-mocha-700"
                >
                  <span className="font-medium">{width.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {width.pixels}
                  </span>
                </Toggle>
              ))}
            </div>
          </div>

          {/* Highlight Current Line */}
          <div className="flex items-center justify-between py-2">
            <Label className="text-sm font-medium text-foreground">
              현재 줄 강조
            </Label>
            <Toggle
              pressed={visual.highlightCurrentLine}
              onPressedChange={setHighlightCurrentLine}
              size="sm"
              className="data-[state=on]:bg-mocha-100 data-[state=on]:text-mocha-700"
            >
              {visual.highlightCurrentLine ? "켜짐" : "꺼짐"}
            </Toggle>
          </div>
        </TabsContent>
        {/* Behavior Tab */}
        <TabsContent value="behavior" className="mt-0 space-y-5">
          {/* Smart Punctuation */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              스마트 문장부호
            </Label>

            <div className="space-y-2">
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">
                  둥근 따옴표 (" → ")
                </span>
                <Toggle
                  pressed={behavior.smartQuotes}
                  onPressedChange={setSmartQuotes}
                  size="sm"
                  className="data-[state=on]:bg-mocha-100 data-[state=on]:text-mocha-700"
                >
                  {behavior.smartQuotes ? "켜짐" : "꺼짐"}
                </Toggle>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">
                  엠대시 (-- → —)
                </span>
                <Toggle
                  pressed={behavior.smartDashes}
                  onPressedChange={setSmartDashes}
                  size="sm"
                  className="data-[state=on]:bg-mocha-100 data-[state=on]:text-mocha-700"
                >
                  {behavior.smartDashes ? "켜짐" : "꺼짐"}
                </Toggle>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">
                  말줄임표 (... → …)
                </span>
                <Toggle
                  pressed={behavior.smartEllipsis}
                  onPressedChange={setSmartEllipsis}
                  size="sm"
                  className="data-[state=on]:bg-mocha-100 data-[state=on]:text-mocha-700"
                >
                  {behavior.smartEllipsis ? "켜짐" : "꺼짐"}
                </Toggle>
              </div>
            </div>
          </div>

          <Separator />

          {/* Linguistic Focus */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">
              언어 분석 모드
            </Label>
            <Select
              value={behavior.linguisticMode}
              onValueChange={(value) =>
                setLinguisticMode(value as BehaviorSettings["linguisticMode"])
              }
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LINGUISTIC_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="flex items-center gap-2">
                      {option.label}
                      {option.description && (
                        <span className="text-sm text-muted-foreground">
                          - {option.description}
                        </span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-4" />

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={resetToDefaults}
        className="w-full text-sm gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        기본값으로 초기화
      </Button>
    </div>
  );
}
