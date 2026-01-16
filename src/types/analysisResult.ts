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

export interface AnalysisBackendRelationship {
  source: string;
  target: string;
  relation_type: string;
  strength: number;
  description: string;
  bidirectional: boolean;
}

export interface BackendConflict {
  severity?: "critical" | "warning" | "medium" | "HIGH" | "MEDIUM" | "LOW";
  category?: string;
  type?: string;
  description: string;
  suggestion?: string;
  resolution?: string;
  suggested_action?: "FLAG_FOR_HUMAN" | "AUTO_RESOLVE" | string;
  location?: {
    chapter?: string;
    line?: number;
    document_id?: string;
  };
  related_events?: string[]; // Potential hidden field in JSON
  event_id?: string; // Single event reference
}

export interface BackendResolutionSummary {
  auto_fixable?: number;
  ready_for_update?: number;
  needs_human_review?: number;
  total_conflicts?: number;
  high_severity_count?: number;
}

export interface BackendConsistencyStats {
  auto_fixable_count?: number;
  high_severity_count?: number;
  medium_severity_count?: number;
}

export interface BackendResolutionSummary {
  auto_fixable?: number;
  ready_for_update?: number;
  needs_human_review?: number;
  total_conflicts?: number;
  high_severity_count?: number;
}

export interface BackendConsistencyStats {
  auto_fixable_count?: number;
  high_severity_count?: number;
  medium_severity_count?: number;
}

export interface BackendConsistencyReport {
  job_id?: string;
  created_at?: string;
  score?: number;
  overall_score?: number; // legacy field
  conflicts?: BackendConflict[];
  conflicts_json?: string | BackendConflict[];
  stats?: BackendConsistencyStats;
  resolution_summary?: BackendResolutionSummary;
  resolution_summary_json?: string | BackendResolutionSummary;
  requires_human_review?: boolean;
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
  id: string; // Stable unique identifier
  severity: "critical" | "warning";
  category: string;
  description: string;
  suggestion?: string;
  suggestedAction?: "FLAG_FOR_HUMAN" | "AUTO_RESOLVE" | string;
  location?: {
    chapter?: string;
    line?: number;
    documentId?: string;
  };
  relatedEventIds?: string[];
}

export interface ConsistencyStats {
  fixable: number;
  critical: number;
  warning: number;
}

export interface ConsistencyStats {
  fixable: number;
  critical: number;
  warning: number;
}

export interface ConsistencyReport {
  jobId?: string;
  analyzedAt?: string;
  score: number; // 0-100
  conflicts: Conflict[];
  stats: ConsistencyStats;
  needsReview: boolean;
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
// Analysis Result Data (Main Wrapper)
// ============================================

export interface AnalysisResultData {
  sections: BackendSection[];
  characters: BackendCharacter[];
  events: BackendEvent[];
  relationships: AnalysisBackendRelationship[];
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
  score?: number,
): Conflict {
  let severity: "critical" | "warning" = "warning";
  const raw = backend.severity;
  if (raw === "critical" || raw === "HIGH") {
    severity = "critical";
  } else if (score !== undefined && score <= 40) {
    severity = "critical";
  }

  const category = backend.type || backend.category || "Unknown";
  const description = backend.description;
  const docId = backend.location?.document_id || "";
  const line = backend.location?.line || 0;

  // Generate a stable ID based on key fields
  const id =
    `conf-${category}-${docId}-${line}-${description.slice(0, 20)}`.replace(
      /\s+/g,
      "_",
    );

  return {
    id,
    severity,
    category,
    description,
    suggestion: backend.suggestion || backend.resolution || undefined,
    suggestedAction: backend.suggested_action,
    location: backend.location
      ? {
          chapter: backend.location.chapter,
          line: backend.location.line,
          documentId: backend.location.document_id,
        }
      : undefined,
    relatedEventIds:
      backend.related_events || (backend.event_id ? [backend.event_id] : []),
  };
}

export function transformConsistencyReport(
  backend: BackendConsistencyReport,
): ConsistencyReport {
  const score = backend.score ?? backend.overall_score ?? 0;

  // Conflicts: Handle both parsed array and JSON string/mixed field
  let rawConflicts: BackendConflict[] = [];
  if (Array.isArray(backend.conflicts)) {
    rawConflicts = backend.conflicts;
  } else if (Array.isArray(backend.conflicts_json)) {
    rawConflicts = backend.conflicts_json;
  } else if (typeof backend.conflicts_json === "string") {
    try {
      rawConflicts = JSON.parse(backend.conflicts_json);
    } catch (e) {
      console.error("Failed to parse conflicts_json", e);
      rawConflicts = [];
    }
  }

  const conflicts = rawConflicts.map((c) => transformConflict(c, score));

  // Stats: Handle resolution_summary or legacy stats or calculation
  let stats: ConsistencyStats = { fixable: 0, critical: 0, warning: 0 };

  let resolutionSummary: BackendResolutionSummary | null = null;
  if (backend.resolution_summary) {
    resolutionSummary = backend.resolution_summary;
  } else if (
    typeof backend.resolution_summary_json === "object" &&
    backend.resolution_summary_json !== null
  ) {
    resolutionSummary =
      backend.resolution_summary_json as BackendResolutionSummary;
  } else if (typeof backend.resolution_summary_json === "string") {
    try {
      resolutionSummary = JSON.parse(backend.resolution_summary_json);
    } catch {
      /* ignore */
    }
  }

  if (resolutionSummary) {
    stats = {
      fixable: resolutionSummary.auto_fixable ?? 0,
      critical: conflicts.filter((c) => c.severity === "critical").length,
      warning: conflicts.filter((c) => c.severity === "warning").length,
    };
  } else if (backend.stats) {
    stats = {
      fixable: backend.stats.auto_fixable_count ?? 0,
      critical: backend.stats.high_severity_count ?? 0,
      warning: backend.stats.medium_severity_count ?? 0,
    };
  } else {
    stats = {
      fixable: 0,
      critical: conflicts.filter((c) => c.severity === "critical").length,
      warning: conflicts.filter((c) => c.severity === "warning").length,
    };
  }

  return {
    jobId: backend.job_id,
    analyzedAt: backend.created_at,
    score,
    conflicts,
    stats,
    needsReview: backend.requires_human_review ?? false,
  };
}

export function transformForeshadowingItem(
  backend: BackendForeshadowingItem,
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
  backend: BackendValidation,
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
