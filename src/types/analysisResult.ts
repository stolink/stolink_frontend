import type { BackendEvent } from "./event";
import type { BackendSection } from "./section";

// ============================================
// Backend Response Types (snake_case)
// ============================================

/** Backend character format from analysis API response */
export interface BackendCharacter {
  name: string;
  role?: "protagonist" | "antagonist" | "supporting" | "mentor" | string;
  age?: number;
  gender?: string;
  race?: string;
  backstory?: string;
  personality?: {
    core_traits?: string[];
    flaws?: string[];
    values?: string[];
  };
  appearance?: {
    physique?: string;
    hair_color?: string;
    hair_style?: string;
    eyes?: string;
    attire?: string[];
    expression?: string;
  };
  faction?: {
    name?: string;
    social?: {
      rank?: string;
      influence?: number;
    };
  };
}

export interface BackendRelationship {
  source: string;
  target: string;
  relation_type: string;
  strength: number;
  description: string;
  bidirectional: boolean;
}

export interface BackendConflict {
  severity?: "critical" | "warning" | "medium";
  category: string;
  description: string;
  location?: {
    chapter?: string;
    line?: number;
    document_id?: string;
  };
}

export interface BackendConsistencyReport {
  score?: number;
  overall_score?: number; // legacy field
  conflicts: BackendConflict[];
}

export interface BackendForeshadowingItem {
  element: string;
  planted_in: string;
  resolved_in?: string;
  status: string;
}

export interface BackendPlotData {
  summary: string;
  foreshadowing: BackendForeshadowingItem[];
  narrative_beats?: unknown[];
  tension_curve?: unknown[];
}

export interface BackendValidation {
  is_valid: boolean;
  quality_score: number;
}

export interface BackendMetadata {
  processing_time_ms: number;
  trace_id?: string;
}

// ============================================
// Frontend Types (camelCase)
// ============================================

export interface Conflict {
  severity: "critical" | "warning";
  category: string;
  description: string;
  location?: {
    chapter?: string;
    line?: number;
    documentId?: string;
  };
}

export interface ConsistencyReport {
  score: number; // 0-100
  conflicts: Conflict[];
}

export interface ForeshadowingItem {
  element: string;
  plantedIn: string;
  resolvedIn?: string;
  status: string;
}

export interface PlotData {
  summary: string;
  foreshadowing: ForeshadowingItem[];
  narrativeBeats?: unknown[];
  tensionCurve?: unknown[];
}

export interface ValidationResult {
  isValid: boolean;
  qualityScore: number;
}

export interface AnalysisMetadata {
  processingTimeMs: number;
  traceId?: string;
}

// ============================================
// Analysis Result Data
// ============================================

export interface AnalysisResultData {
  sections: BackendSection[];
  characters: BackendCharacter[];
  events: BackendEvent[];
  relationships: BackendRelationship[];
  consistencyReport?: ConsistencyReport;
  plot?: PlotData;
  validation?: ValidationResult;
  metadata?: AnalysisMetadata;
}

// ============================================
// Transform Functions
// ============================================

export function transformConflict(
  backend: BackendConflict,
  score?: number
): Conflict {
  // severity 결정: 명시적 severity가 있으면 사용, 없으면 score 기준
  // "medium" severity는 프론트엔드에서 "warning"으로 매핑
  let severity: "critical" | "warning" = "warning";
  if (backend.severity) {
    // medium -> warning 매핑 (프론트엔드는 critical/warning만 표시)
    severity = backend.severity === "critical" ? "critical" : "warning";
  } else if (score !== undefined) {
    // score 40 이하면 critical로 간주
    severity = score <= 40 ? "critical" : "warning";
  }

  return {
    severity,
    category: backend.category,
    description: backend.description,
    location: backend.location
      ? {
          chapter: backend.location.chapter,
          line: backend.location.line,
          documentId: backend.location.document_id,
        }
      : undefined,
  };
}

export function transformConsistencyReport(
  backend: BackendConsistencyReport
): ConsistencyReport {
  const score = backend.score ?? backend.overall_score ?? 0;
  return {
    score,
    conflicts: backend.conflicts.map((c) => transformConflict(c, score)),
  };
}

export function transformForeshadowingItem(
  backend: BackendForeshadowingItem
): ForeshadowingItem {
  return {
    element: backend.element,
    plantedIn: backend.planted_in,
    resolvedIn: backend.resolved_in,
    status: backend.status,
  };
}

export function transformPlotData(backend: BackendPlotData): PlotData {
  return {
    summary: backend.summary,
    foreshadowing: backend.foreshadowing.map(transformForeshadowingItem),
    narrativeBeats: backend.narrative_beats,
    tensionCurve: backend.tension_curve,
  };
}

export function transformValidation(
  backend: BackendValidation
): ValidationResult {
  return {
    isValid: backend.is_valid,
    qualityScore: backend.quality_score,
  };
}

export function transformMetadata(backend: BackendMetadata): AnalysisMetadata {
  return {
    processingTimeMs: backend.processing_time_ms,
    traceId: backend.trace_id,
  };
}
