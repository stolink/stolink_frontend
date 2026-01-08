/**
 * 인물 일대기 시각화 상수
 */
import {
  Baby,
  Skull,
  Activity, // action (was Zap)
  MessageSquareQuote, // dialogue (was MessageCircle)
  Compass, // discovery (was Lightbulb)
  Swords, // conflict
  Flag, // resolution (was CheckCircle)
  Footprints, // transition (was GitBranch)
  Key, // revelation (was Eye)
  GitBranch, // decision (was Scale)
  Handshake, // encounter (was Users)
  DoorOpen, // departure (was LogOut)
  MapPin, // arrival
  Sparkles, // transformation
  Circle,
  Mic, // confession
  type LucideIcon,
} from "lucide-react";
import type { EventTypeConfig } from "@/types/biography";

/** 사건 유형별 아이콘 */
export const EVENT_TYPE_ICONS: Record<string, LucideIcon> = {
  action: Activity,
  dialogue: MessageSquareQuote,
  discovery: Compass,
  conflict: Swords,
  resolution: Flag,
  transition: Footprints,
  revelation: Key,
  decision: GitBranch,
  encounter: Handshake,
  departure: DoorOpen,
  arrival: MapPin,
  transformation: Sparkles,
  birth: Baby,
  death: Skull,
  confession: Mic,
  other: Circle,
};

/** 사건 유형별 설정 (라벨, 색상) */
export const EVENT_TYPE_CONFIG: Record<string, EventTypeConfig> = {
  action: {
    label: "행동",
    color: "#A47764", // Mocha 500
    accentColor: "#BD9B8D",
  },
  dialogue: {
    label: "대화",
    color: "#5F7D5F", // Sage 500
    accentColor: "#7A9878",
  },
  discovery: {
    label: "발견",
    color: "#B8860B", // Status Warning
    accentColor: "#D4A01C",
  },
  conflict: {
    label: "갈등",
    color: "#9C4A3F", // Relation Hostile
    accentColor: "#B85A4F",
  },
  resolution: {
    label: "해결",
    color: "#5B7B4B", // Status Success
    accentColor: "#7A9878",
  },
  transition: {
    label: "전환",
    color: "#7D5A4B", // Mocha 700
    accentColor: "#A47764",
  },
  revelation: {
    label: "깨달음",
    color: "#6B4C9A", // Purple
    accentColor: "#8B6CBB",
  },
  decision: {
    label: "결정",
    color: "#4F5861", // Steel
    accentColor: "#6B7580",
  },
  encounter: {
    label: "조우",
    color: "#7A8C6F", // Relation Friendly
    accentColor: "#8FA084",
  },
  departure: {
    label: "이별",
    color: "#4F5861", // Relation Family
    accentColor: "#6B7580",
  },
  arrival: {
    label: "도착",
    color: "#2D7D9A", // Teal
    accentColor: "#4A9DB8",
  },
  transformation: {
    label: "변화",
    color: "#A47764", // Mocha 500
    accentColor: "#BD9B8D",
  },
  birth: {
    label: "탄생",
    color: "#A47764",
    accentColor: "#BD9B8D",
  },
  death: {
    label: "사망",
    color: "#3D302A", // Espresso 900
    accentColor: "#7D5A4B",
  },
  confession: {
    label: "고백",
    color: "#0D9488", // Teal 600
    accentColor: "#2DD4BF", // Teal 400
  },
  other: {
    label: "기타",
    color: "#8D8B88", // Neutral
    accentColor: "#A09D9A",
  },
};

/** 사건 유형 가져오기 (fallback 포함) */
export function getEventTypeConfig(eventType: string): EventTypeConfig {
  return EVENT_TYPE_CONFIG[eventType] ?? EVENT_TYPE_CONFIG.other;
}

/** 사건 유형 아이콘 가져오기 (fallback 포함) */
export function getEventTypeIcon(eventType: string): LucideIcon {
  return EVENT_TYPE_ICONS[eventType] ?? EVENT_TYPE_ICONS.other;
}

/** 기본 나무 설정 */
export const DEFAULT_TREE_CONFIG: {
  containerWidth: number;
  containerHeight: number;
  trunkStartX: number;
  branchMinLength: number;
  branchMaxLength: number;
  nodeRadius: number;
  nodeSpacing: number;
} = {
  containerWidth: 1400,
  containerHeight: 600,
  trunkStartX: 100,
  branchMinLength: 100,
  branchMaxLength: 200,
  nodeRadius: 36,
  nodeSpacing: 80,
};

/** 수묵화 색상 */
export const INK_COLORS = {
  dark: "#3D302A", // 농묵
  medium: "#5C4940", // 중묵
  light: "#7D5A4B", // 담묵
  faint: "#A09080", // 연묵
} as const;
