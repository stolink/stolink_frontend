/**
 * analysisResult Transform Functions 테스트
 *
 * 목적:
 * 1. AI 응답의 다양한 severity 표현 정규화 검증
 * 2. conflicts_json이 string/array인 경우 모두 처리
 * 3. resolution_summary 다양한 형태 처리
 * 4. snake_case → camelCase 변환 검증
 * 5. 기본값 및 누락 필드 처리
 */
import { describe, it, expect } from "vitest";
import {
  transformConflict,
  transformConsistencyReport,
  transformForeshadowingItem,
  transformPlotData,
  transformValidation,
  transformMetadata,
  type BackendConflict,
  type BackendConsistencyReport,
  type BackendForeshadowingItem,
  type BackendPlotData,
  type BackendValidation,
  type BackendMetadata,
} from "./analysisResult";

describe("analysisResult transforms", () => {
  // ============================================
  // 1. transformConflict 테스트
  // AI가 다양한 형태로 severity를 보내는 경우
  // ============================================
  describe("transformConflict", () => {
    describe("severity 정규화", () => {
      it("'critical' → 'critical'", () => {
        const input: BackendConflict = {
          severity: "critical",
          description: "Test conflict",
        };
        const result = transformConflict(input);
        expect(result.severity).toBe("critical");
      });

      it("'HIGH' → 'critical'", () => {
        const input: BackendConflict = {
          severity: "HIGH",
          description: "High severity conflict",
        };
        const result = transformConflict(input);
        expect(result.severity).toBe("critical");
      });

      it("'warning' → 'warning'", () => {
        const input: BackendConflict = {
          severity: "warning",
          description: "Warning conflict",
        };
        const result = transformConflict(input);
        expect(result.severity).toBe("warning");
      });

      it("'medium' → 'warning'", () => {
        const input: BackendConflict = {
          severity: "medium",
          description: "Medium conflict",
        };
        const result = transformConflict(input);
        expect(result.severity).toBe("warning");
      });

      it("'MEDIUM' → 'warning'", () => {
        const input: BackendConflict = {
          severity: "MEDIUM",
          description: "Medium uppercase",
        };
        const result = transformConflict(input);
        expect(result.severity).toBe("warning");
      });

      it("'LOW' → 'warning'", () => {
        const input: BackendConflict = {
          severity: "LOW",
          description: "Low severity",
        };
        const result = transformConflict(input);
        expect(result.severity).toBe("warning");
      });

      it("score <= 40 이면 critical로 업그레이드", () => {
        const input: BackendConflict = {
          severity: "warning",
          description: "Should be critical due to low score",
        };
        const result = transformConflict(input, 35);
        expect(result.severity).toBe("critical");
      });

      it("score > 40 이면 기존 severity 유지", () => {
        const input: BackendConflict = {
          severity: "warning",
          description: "Should stay warning",
        };
        const result = transformConflict(input, 50);
        expect(result.severity).toBe("warning");
      });
    });

    describe("category/type 필드 통합", () => {
      it("type 필드 우선", () => {
        const input: BackendConflict = {
          type: "character_inconsistency",
          category: "plot_hole",
          description: "Test",
        };
        const result = transformConflict(input);
        expect(result.category).toBe("character_inconsistency");
      });

      it("type 없으면 category 사용", () => {
        const input: BackendConflict = {
          category: "timeline_error",
          description: "Test",
        };
        const result = transformConflict(input);
        expect(result.category).toBe("timeline_error");
      });

      it("둘 다 없으면 'Unknown'", () => {
        const input: BackendConflict = {
          description: "No category",
        };
        const result = transformConflict(input);
        expect(result.category).toBe("Unknown");
      });
    });

    describe("location 정규화", () => {
      it("location.document_id → location.documentId", () => {
        const input: BackendConflict = {
          description: "Test",
          location: {
            document_id: "doc-123",
            chapter: "Chapter 1",
            line: 42,
          },
        };
        const result = transformConflict(input);
        expect(result.location?.documentId).toBe("doc-123");
        expect(result.location?.chapter).toBe("Chapter 1");
        expect(result.location?.line).toBe(42);
      });
    });

    describe("evidence 필드 (existing, new_value)", () => {
      it("existing 필드 전달", () => {
        const input: BackendConflict = {
          description: "Age changed",
          existing: "25 years old",
          new_value: "30 years old",
        };
        const result = transformConflict(input);
        expect(result.existing).toBe("25 years old");
        expect(result.newValue).toBe("30 years old");
      });

      it("newValue (camelCase) 필드도 처리", () => {
        const input: BackendConflict = {
          description: "Name changed",
          existing: "John",
          newValue: "Jonathan",
        };
        const result = transformConflict(input);
        expect(result.newValue).toBe("Jonathan");
      });
    });

    describe("suggestion 필드 통합", () => {
      it("suggestion 필드 우선", () => {
        const input: BackendConflict = {
          description: "Test",
          suggestion: "Fix this",
          resolution: "Resolve that",
        };
        const result = transformConflict(input);
        expect(result.suggestion).toBe("Fix this");
      });

      it("suggestion 없으면 resolution 사용", () => {
        const input: BackendConflict = {
          description: "Test",
          resolution: "Resolve that",
        };
        const result = transformConflict(input);
        expect(result.suggestion).toBe("Resolve that");
      });
    });

    describe("related events 필드", () => {
      it("related_events 배열 전달", () => {
        const input: BackendConflict = {
          description: "Test",
          related_events: ["event-1", "event-2"],
        };
        const result = transformConflict(input);
        expect(result.relatedEventIds).toEqual(["event-1", "event-2"]);
      });

      it("event_id 단일 값 → 배열로 변환", () => {
        const input: BackendConflict = {
          description: "Test",
          event_id: "single-event",
        };
        const result = transformConflict(input);
        expect(result.relatedEventIds).toEqual(["single-event"]);
      });
    });

    describe("고유 ID 생성", () => {
      it("description, category, location 기반 stable ID 생성", () => {
        const input: BackendConflict = {
          type: "character",
          description: "Age inconsistency found",
          location: { document_id: "doc-1", line: 10 },
        };
        const result = transformConflict(input);
        expect(result.id).toContain("conf-character-doc-1-10-Age");
      });

      it("공백은 언더스코어로 치환", () => {
        const input: BackendConflict = {
          type: "plot",
          description: "Some error here",
        };
        const result = transformConflict(input);
        expect(result.id).not.toContain(" ");
        expect(result.id).toContain("_");
      });
    });
  });

  // ============================================
  // 2. transformConsistencyReport 테스트
  // AI가 다양한 형태로 report를 보내는 경우
  // ============================================
  describe("transformConsistencyReport", () => {
    describe("score 필드 통합", () => {
      it("score 필드 우선", () => {
        const input: BackendConsistencyReport = {
          score: 85,
          overall_score: 70,
        };
        const result = transformConsistencyReport(input);
        expect(result.score).toBe(85);
      });

      it("score 없으면 overall_score 사용 (legacy)", () => {
        const input: BackendConsistencyReport = {
          overall_score: 70,
        };
        const result = transformConsistencyReport(input);
        expect(result.score).toBe(70);
      });

      it("둘 다 없으면 0", () => {
        const input: BackendConsistencyReport = {};
        const result = transformConsistencyReport(input);
        expect(result.score).toBe(0);
      });
    });

    describe("conflicts 필드 처리", () => {
      it("conflicts 배열 직접 처리", () => {
        const input: BackendConsistencyReport = {
          conflicts: [
            { description: "Conflict 1", severity: "warning" },
            { description: "Conflict 2", severity: "critical" },
          ],
        };
        const result = transformConsistencyReport(input);
        expect(result.conflicts).toHaveLength(2);
      });

      it("conflicts_json이 배열인 경우", () => {
        const input: BackendConsistencyReport = {
          conflicts_json: [{ description: "JSON Conflict", severity: "HIGH" }],
        };
        const result = transformConsistencyReport(input);
        expect(result.conflicts).toHaveLength(1);
        expect(result.conflicts[0].severity).toBe("critical");
      });

      it("conflicts_json이 JSON 문자열인 경우", () => {
        const input: BackendConsistencyReport = {
          conflicts_json: JSON.stringify([
            { description: "Stringified conflict", severity: "warning" },
          ]),
        };
        const result = transformConsistencyReport(input);
        expect(result.conflicts).toHaveLength(1);
      });

      it("conflicts_json이 잘못된 JSON 문자열이면 빈 배열", () => {
        const input: BackendConsistencyReport = {
          conflicts_json: "{ invalid json ]",
        };
        const result = transformConsistencyReport(input);
        expect(result.conflicts).toEqual([]);
      });
    });

    describe("stats 계산", () => {
      it("resolution_summary에서 stats 추출", () => {
        const input: BackendConsistencyReport = {
          score: 75, // score > 40이면 severity 유지
          conflicts: [
            { description: "C1", severity: "critical" },
            { description: "C2", severity: "warning" },
            { description: "C3", severity: "warning" },
          ],
          resolution_summary: {
            auto_fixable: 2,
          },
        };
        const result = transformConsistencyReport(input);
        expect(result.stats.fixable).toBe(2);
        expect(result.stats.critical).toBe(1);
        expect(result.stats.warning).toBe(2);
      });

      it("resolution_summary_json이 객체인 경우", () => {
        const input: BackendConsistencyReport = {
          conflicts: [{ description: "C1", severity: "critical" }],
          resolution_summary_json: {
            auto_fixable: 1,
          },
        };
        const result = transformConsistencyReport(input);
        expect(result.stats.fixable).toBe(1);
      });

      it("resolution_summary_json이 문자열인 경우", () => {
        const input: BackendConsistencyReport = {
          conflicts: [],
          resolution_summary_json: JSON.stringify({ auto_fixable: 3 }),
        };
        const result = transformConsistencyReport(input);
        expect(result.stats.fixable).toBe(3);
      });

      it("legacy stats 필드 사용", () => {
        const input: BackendConsistencyReport = {
          conflicts: [],
          stats: {
            auto_fixable_count: 5,
            high_severity_count: 2,
            medium_severity_count: 3,
          },
        };
        const result = transformConsistencyReport(input);
        expect(result.stats.fixable).toBe(5);
        expect(result.stats.critical).toBe(2);
        expect(result.stats.warning).toBe(3);
      });

      it("모든 stats 소스 없으면 conflicts에서 계산", () => {
        const input: BackendConsistencyReport = {
          score: 75, // score > 40이면 severity 유지
          conflicts: [
            { description: "C1", severity: "HIGH" },
            { description: "C2", severity: "warning" },
          ],
        };
        const result = transformConsistencyReport(input);
        expect(result.stats.fixable).toBe(0);
        expect(result.stats.critical).toBe(1); // HIGH -> critical
        expect(result.stats.warning).toBe(1);
      });
    });

    describe("메타 필드", () => {
      it("job_id → jobId", () => {
        const input: BackendConsistencyReport = {
          job_id: "job-123",
        };
        const result = transformConsistencyReport(input);
        expect(result.jobId).toBe("job-123");
      });

      it("created_at → analyzedAt", () => {
        const input: BackendConsistencyReport = {
          created_at: "2024-01-01T00:00:00Z",
        };
        const result = transformConsistencyReport(input);
        expect(result.analyzedAt).toBe("2024-01-01T00:00:00Z");
      });

      it("requires_human_review → needsReview", () => {
        const input: BackendConsistencyReport = {
          requires_human_review: true,
        };
        const result = transformConsistencyReport(input);
        expect(result.needsReview).toBe(true);
      });

      it("requires_human_review 없으면 false", () => {
        const input: BackendConsistencyReport = {};
        const result = transformConsistencyReport(input);
        expect(result.needsReview).toBe(false);
      });
    });
  });

  // ============================================
  // 3. transformForeshadowingItem 테스트
  // ============================================
  describe("transformForeshadowingItem", () => {
    it("planted_in → plantedIn", () => {
      const input: BackendForeshadowingItem = {
        element: "The mysterious key",
        planted_in: "Chapter 1",
        status: "planted",
      };
      const result = transformForeshadowingItem(input);
      expect(result.plantedIn).toBe("Chapter 1");
    });

    it("resolved_in → resolvedIn", () => {
      const input: BackendForeshadowingItem = {
        element: "The prophecy",
        planted_in: "Chapter 2",
        resolved_in: "Chapter 15",
        status: "resolved",
      };
      const result = transformForeshadowingItem(input);
      expect(result.resolvedIn).toBe("Chapter 15");
    });

    it("resolved_in 없으면 undefined", () => {
      const input: BackendForeshadowingItem = {
        element: "Unresolved hint",
        planted_in: "Prologue",
        status: "pending",
      };
      const result = transformForeshadowingItem(input);
      expect(result.resolvedIn).toBeUndefined();
    });
  });

  // ============================================
  // 4. transformPlotData 테스트
  // ============================================
  describe("transformPlotData", () => {
    it("전체 필드 변환", () => {
      const input: BackendPlotData = {
        summary: "A hero's journey",
        foreshadowing: [
          {
            element: "The sword",
            planted_in: "Ch 1",
            resolved_in: "Ch 10",
            status: "resolved",
          },
        ],
        narrative_beats: [{ beat: 1 }],
        tension_curve: [0, 50, 100],
      };
      const result = transformPlotData(input);
      expect(result.summary).toBe("A hero's journey");
      expect(result.foreshadowing[0].plantedIn).toBe("Ch 1");
      expect(result.narrativeBeats).toEqual([{ beat: 1 }]);
      expect(result.tensionCurve).toEqual([0, 50, 100]);
    });

    it("빈 foreshadowing 배열 처리", () => {
      const input: BackendPlotData = {
        summary: "Empty",
        foreshadowing: [],
      };
      const result = transformPlotData(input);
      expect(result.foreshadowing).toEqual([]);
    });
  });

  // ============================================
  // 5. transformValidation 테스트
  // ============================================
  describe("transformValidation", () => {
    it("is_valid → isValid", () => {
      const input: BackendValidation = {
        is_valid: true,
        quality_score: 95,
      };
      const result = transformValidation(input);
      expect(result.isValid).toBe(true);
    });

    it("quality_score → qualityScore", () => {
      const input: BackendValidation = {
        is_valid: false,
        quality_score: 45,
      };
      const result = transformValidation(input);
      expect(result.qualityScore).toBe(45);
    });
  });

  // ============================================
  // 6. transformMetadata 테스트
  // ============================================
  describe("transformMetadata", () => {
    it("processing_time_ms → processingTimeMs", () => {
      const input: BackendMetadata = {
        processing_time_ms: 1500,
      };
      const result = transformMetadata(input);
      expect(result.processingTimeMs).toBe(1500);
    });

    it("trace_id → traceId", () => {
      const input: BackendMetadata = {
        processing_time_ms: 500,
        trace_id: "trace-abc-123",
      };
      const result = transformMetadata(input);
      expect(result.traceId).toBe("trace-abc-123");
    });
  });

  // ============================================
  // 7. 복합 시나리오: 실제 AI 응답 패턴
  // ============================================
  describe("실제 AI 응답 복합 시나리오", () => {
    it("완전한 ConsistencyReport 변환", () => {
      const backendReport: BackendConsistencyReport = {
        job_id: "analysis-001",
        created_at: "2024-06-15T10:30:00Z",
        score: 72,
        conflicts: [
          {
            severity: "HIGH",
            type: "character_age",
            description: "Character age changed from 25 to 30",
            existing: "25",
            new_value: "30",
            suggestion: "Update age in chapter 3",
            suggested_action: "AUTO_RESOLVE",
            location: {
              document_id: "doc-123",
              chapter: "Chapter 5",
              line: 42,
            },
            related_events: ["event-birthday"],
          },
          {
            severity: "warning",
            category: "timeline",
            description: "Event order inconsistency",
            resolution: "Review chapter sequence",
          },
        ],
        resolution_summary: {
          auto_fixable: 1,
          needs_human_review: 1,
          total_conflicts: 2,
        },
        requires_human_review: true,
      };

      const result = transformConsistencyReport(backendReport);

      // 메타 필드
      expect(result.jobId).toBe("analysis-001");
      expect(result.analyzedAt).toBe("2024-06-15T10:30:00Z");
      expect(result.score).toBe(72);
      expect(result.needsReview).toBe(true);

      // Conflicts
      expect(result.conflicts).toHaveLength(2);

      // First conflict (HIGH → critical)
      const c1 = result.conflicts[0];
      expect(c1.severity).toBe("critical");
      expect(c1.category).toBe("character_age");
      expect(c1.existing).toBe("25");
      expect(c1.newValue).toBe("30");
      expect(c1.suggestedAction).toBe("AUTO_RESOLVE");
      expect(c1.location?.documentId).toBe("doc-123");
      expect(c1.relatedEventIds).toContain("event-birthday");

      // Second conflict
      const c2 = result.conflicts[1];
      expect(c2.severity).toBe("warning");
      expect(c2.category).toBe("timeline");
      expect(c2.suggestion).toBe("Review chapter sequence");

      // Stats
      expect(result.stats.fixable).toBe(1);
      expect(result.stats.critical).toBe(1);
      expect(result.stats.warning).toBe(1);
    });
  });
});
