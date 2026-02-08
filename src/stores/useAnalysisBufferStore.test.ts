/**
 * useAnalysisBufferStore 테스트
 *
 * 📚 학습 포인트:
 *
 * 1. 이 스토어의 역할:
 *    - 사용자가 문서를 저장할 때마다 변경분을 버퍼링
 *    - AI 분석 요청 시 버퍼를 flush하여 백엔드로 전송
 *    - 분석 작업(Job) 상태 추적 및 관리
 *    - 콘텐츠 해시로 중복 분석 방지
 *
 * 2. 핵심 패턴:
 *    - activeJobs: 모든 작업 (분석 + 이미지 생성)
 *    - activeAnalysisJobs: 분석 작업만 (SSE 구독용)
 *    - lastAnalyzedHashes: 이미 분석된 콘텐츠 해시 저장
 *    - pendingDocuments: 분석 중인 문서 추적 (중복 요청 방지)
 *
 * 3. 미들웨어:
 *    - persist: IndexedDB에 상태 저장 (새로고침 후에도 유지)
 *    - immer: 불변성 관리
 *
 * @vitest-environment node
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  useAnalysisBufferStore,
  ANALYSIS_BUFFER_CONFIG,
} from "./useAnalysisBufferStore";

// IndexedDB Mock
vi.mock("idb-keyval", () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

// calculateContentHash Mock
vi.mock("@/utils/hashUtils", () => ({
  calculateContentHash: vi.fn((content: string) => `hash-${content.length}`),
}));

describe("useAnalysisBufferStore", () => {
  /**
   * 🔑 전체 상태 초기화
   *
   * 이 스토어는 매우 복잡하므로 모든 상태를 명시적으로 초기화합니다.
   * setState를 사용하여 완전한 초기 상태로 리셋합니다.
   */
  beforeEach(() => {
    useAnalysisBufferStore.setState({
      projectId: null,
      buffer: [],
      bufferCharCount: 0,
      lastFlushAt: Date.now(),
      isAnalyzing: false,
      progress: 0,
      currentJobId: null,
      currentJobType: null,
      currentJobTargetId: null,
      activeJobs: {},
      activeAnalysisJobs: {},
      lastAnalyzedHashes: {},
      pendingDocuments: {},
      lastConsistencyReport: null,
      processedConflicts: {},
      pendingAnalysisResults: {},
      analysisSnapshots: {},
      acknowledgedJobIds: [],
    });
    // 프로젝트 설정
    useAnalysisBufferStore.getState().setProjectId("test-project");
  });

  // ═══════════════════════════════════════════
  // 버퍼 관리 테스트
  // ═══════════════════════════════════════════

  describe("addToBuffer", () => {
    /**
     * 💡 버퍼링 전략:
     *
     * 사용자가 문서를 저장할 때마다 addToBuffer가 호출됩니다.
     * 같은 문서의 이전 버전은 덮어써서 최신 상태만 유지합니다.
     * 이렇게 하면 빈번한 저장에도 버퍼 크기가 폭발하지 않습니다.
     */
    it("버퍼에 콘텐츠를 추가해야 함", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Hello World");

      const state = useAnalysisBufferStore.getState();
      expect(state.buffer.length).toBe(1);
      expect(state.buffer[0].documentId).toBe("doc-1");
      expect(state.buffer[0].content).toBe("Hello World");
      expect(state.bufferCharCount).toBe(11);
    });

    it("같은 문서의 콘텐츠는 덮어써야 함 (중복 방지)", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "First");
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Second Content");

      const state = useAnalysisBufferStore.getState();
      expect(state.buffer.length).toBe(1);
      expect(state.buffer[0].content).toBe("Second Content");
      expect(state.bufferCharCount).toBe(14); // "Second Content".length
    });

    it("다른 문서의 콘텐츠는 별도로 추가해야 함", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Content A");
      useAnalysisBufferStore.getState().addToBuffer("doc-2", "Content B");

      const state = useAnalysisBufferStore.getState();
      expect(state.buffer.length).toBe(2);
      expect(state.bufferCharCount).toBe(18); // 9 + 9
    });

    it("timestamp가 올바르게 기록되어야 함", () => {
      const before = Date.now();
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Test");
      const after = Date.now();

      const timestamp = useAnalysisBufferStore.getState().buffer[0].timestamp;
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe("removeFromBuffer", () => {
    /**
     * 💡 문서 삭제 시 버퍼에서도 제거:
     *
     * 문서가 삭제되면 해당 문서의 버퍼도 제거해야 합니다.
     * 그렇지 않으면 삭제된 문서가 분석에 포함될 수 있습니다.
     */
    it("지정한 문서를 버퍼에서 제거해야 함", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Content A");
      useAnalysisBufferStore.getState().addToBuffer("doc-2", "Content B");

      useAnalysisBufferStore.getState().removeFromBuffer("doc-1");

      const state = useAnalysisBufferStore.getState();
      expect(state.buffer.length).toBe(1);
      expect(state.buffer[0].documentId).toBe("doc-2");
      expect(state.bufferCharCount).toBe(9);
    });

    it("존재하지 않는 문서 제거 시 안전하게 처리", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Content");

      // 존재하지 않는 문서 제거 시도
      useAnalysisBufferStore.getState().removeFromBuffer("non-existent");

      const state = useAnalysisBufferStore.getState();
      expect(state.buffer.length).toBe(1);
      expect(state.bufferCharCount).toBe(7);
    });
  });

  describe("flush", () => {
    it("버퍼 내용을 반환하고 초기화해야 함", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Test Content");

      const flushedContent = useAnalysisBufferStore.getState().flush();

      expect(flushedContent.length).toBe(1);
      expect(flushedContent[0].documentId).toBe("doc-1");

      const state = useAnalysisBufferStore.getState();
      expect(state.buffer.length).toBe(0);
      expect(state.bufferCharCount).toBe(0);
    });

    it("lastFlushAt 타임스탬프가 업데이트되어야 함", () => {
      const beforeFlush = Date.now();

      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Test");
      useAnalysisBufferStore.getState().flush();

      const afterFlush = useAnalysisBufferStore.getState().lastFlushAt;
      expect(afterFlush).toBeGreaterThanOrEqual(beforeFlush);
    });
  });

  describe("clearBuffer", () => {
    it("버퍼를 완전히 비워야 함", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Content A");
      useAnalysisBufferStore.getState().addToBuffer("doc-2", "Content B");

      useAnalysisBufferStore.getState().clearBuffer();

      const state = useAnalysisBufferStore.getState();
      expect(state.buffer).toEqual([]);
      expect(state.bufferCharCount).toBe(0);
    });
  });

  describe("shouldAutoFlush", () => {
    it("버퍼가 임계치 미만이면 false 반환", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Short");

      expect(useAnalysisBufferStore.getState().shouldAutoFlush()).toBe(false);
    });

    it("auto-flush가 비활성화되어 조건과 관계없이 항상 false 반환", () => {
      const longContent = "A".repeat(ANALYSIS_BUFFER_CONFIG.MIN_CHARS + 1);

      // lastFlushAt을 31분 전으로 설정
      useAnalysisBufferStore.setState({
        lastFlushAt:
          Date.now() - ANALYSIS_BUFFER_CONFIG.MIN_INTERVAL_MS - 60000,
      });
      useAnalysisBufferStore.getState().addToBuffer("doc-1", longContent);

      // auto-flush is disabled, so should always return false
      expect(useAnalysisBufferStore.getState().shouldAutoFlush()).toBe(false);
    });

    it("분석 중이면 false 반환", () => {
      const longContent = "A".repeat(ANALYSIS_BUFFER_CONFIG.MIN_CHARS + 1);

      useAnalysisBufferStore.setState({
        lastFlushAt:
          Date.now() - ANALYSIS_BUFFER_CONFIG.MIN_INTERVAL_MS - 60000,
        isAnalyzing: true,
      });
      useAnalysisBufferStore.getState().addToBuffer("doc-1", longContent);

      expect(useAnalysisBufferStore.getState().shouldAutoFlush()).toBe(false);
    });
  });

  describe("getBufferSummary", () => {
    it("버퍼 요약 정보를 반환해야 함", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Hello");
      useAnalysisBufferStore.getState().addToBuffer("doc-2", "World");

      const summary = useAnalysisBufferStore.getState().getBufferSummary();
      expect(summary.charCount).toBe(10);
      expect(summary.documentCount).toBe(2);
    });
  });

  // ═══════════════════════════════════════════
  // 프로젝트 관리 테스트
  // ═══════════════════════════════════════════

  describe("setProjectId", () => {
    /**
     * 💡 프로젝트 전환 시 상태 관리:
     *
     * 다른 프로젝트로 전환하면:
     * - 버퍼 초기화 (다른 프로젝트 문서 분석 방지)
     * - lastConsistencyReport 초기화
     * - 단, processedConflicts는 유지 (ID가 고유하므로)
     */
    it("다른 프로젝트로 변경하면 버퍼가 초기화되어야 함", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Content");

      expect(useAnalysisBufferStore.getState().bufferCharCount).toBe(7);

      useAnalysisBufferStore.getState().setProjectId("other-project");

      expect(useAnalysisBufferStore.getState().bufferCharCount).toBe(0);
      expect(useAnalysisBufferStore.getState().buffer.length).toBe(0);
    });

    it("같은 프로젝트로 설정하면 버퍼가 유지되어야 함", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Content");

      useAnalysisBufferStore.getState().setProjectId("test-project");

      expect(useAnalysisBufferStore.getState().bufferCharCount).toBe(7);
    });

    it("프로젝트 변경 시 lastConsistencyReport가 초기화되어야 함", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockReport = { issues: [] } as any;
      useAnalysisBufferStore.setState({ lastConsistencyReport: mockReport });

      useAnalysisBufferStore.getState().setProjectId("other-project");

      expect(
        useAnalysisBufferStore.getState().lastConsistencyReport,
      ).toBeNull();
    });

    it("프로젝트 변경 시 processedConflicts는 유지되어야 함", () => {
      useAnalysisBufferStore
        .getState()
        .markConflictStatus("issue-1", "resolved");

      useAnalysisBufferStore.getState().setProjectId("other-project");

      expect(
        useAnalysisBufferStore.getState().processedConflicts["issue-1"],
      ).toBe("resolved");
    });
  });

  // ═══════════════════════════════════════════
  // Job 관리 테스트
  // ═══════════════════════════════════════════

  describe("Job 관리", () => {
    /**
     * 💡 Job 관리 구조:
     *
     * - activeJobs: 모든 작업 (분석 + 이미지 생성 등)
     * - activeAnalysisJobs: 분석 작업만 (SSE 구독 시 사용)
     * - currentJobId: 현재 표시 중인 작업
     *
     * 왜 분리했나?
     * - 이미지 생성과 분석은 별도로 추적해야 함
     * - SSE는 분석 작업만 구독
     * - UI에서는 현재 작업 정보 표시
     */
    describe("addJobId", () => {
      it("분석 작업을 추가하면 activeJobs와 activeAnalysisJobs 모두에 추가", () => {
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-1", "analysis");

        const state = useAnalysisBufferStore.getState();
        expect(state.activeJobs["test-project"]).toContain("job-1");
        expect(state.activeAnalysisJobs["test-project"]).toContain("job-1");
        expect(state.currentJobId).toBe("job-1");
        expect(state.currentJobType).toBe("analysis");
        expect(state.isAnalyzing).toBe(true);
      });

      it("이미지 작업을 추가하면 activeJobs에만 추가", () => {
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-1", "image", "char-1");

        const state = useAnalysisBufferStore.getState();
        expect(state.activeJobs["test-project"]).toContain("job-1");
        expect(state.activeAnalysisJobs["test-project"]).toBeUndefined();
        expect(state.currentJobType).toBe("image");
        expect(state.currentJobTargetId).toBe("char-1");
      });

      it("중복 Job ID는 추가되지 않아야 함", () => {
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-1", "analysis");
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-1", "analysis");

        const state = useAnalysisBufferStore.getState();
        expect(state.activeJobs["test-project"].length).toBe(1);
      });
    });

    describe("removeJobId", () => {
      it("작업을 제거하면 activeJobs와 activeAnalysisJobs에서 모두 제거", () => {
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-1", "analysis");
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-2", "analysis");

        useAnalysisBufferStore.getState().removeJobId("test-project", "job-1");

        const state = useAnalysisBufferStore.getState();
        expect(state.activeJobs["test-project"]).not.toContain("job-1");
        expect(state.activeJobs["test-project"]).toContain("job-2");
      });

      it("마지막 작업 제거 시 currentJobId가 null이 됨", () => {
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-1", "analysis");

        useAnalysisBufferStore.getState().removeJobId("test-project", "job-1");

        const state = useAnalysisBufferStore.getState();
        expect(state.currentJobId).toBeNull();
        expect(state.activeJobs["test-project"]).toBeUndefined();
      });

      it("현재 작업 제거 시 마지막 작업으로 currentJobId 업데이트", () => {
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-1", "analysis");
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-2", "analysis");

        // job-2가 current, job-2 제거
        useAnalysisBufferStore.getState().removeJobId("test-project", "job-2");

        expect(useAnalysisBufferStore.getState().currentJobId).toBe("job-1");
      });
    });

    describe("clearJobs", () => {
      it("프로젝트의 모든 작업을 제거", () => {
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-1", "analysis");
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-2", "image");

        useAnalysisBufferStore.getState().clearJobs("test-project");

        const state = useAnalysisBufferStore.getState();
        expect(state.activeJobs["test-project"]).toBeUndefined();
        expect(state.activeAnalysisJobs["test-project"]).toBeUndefined();
        expect(state.currentJobId).toBeNull();
        expect(state.isAnalyzing).toBe(false);
      });
    });

    describe("clearAnalysisJobs", () => {
      it("분석 작업만 제거하고 이미지 작업은 유지", () => {
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-1", "analysis");
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-2", "image");

        useAnalysisBufferStore.getState().clearAnalysisJobs("test-project");

        const state = useAnalysisBufferStore.getState();
        expect(state.activeAnalysisJobs["test-project"]).toBeUndefined();
        expect(state.activeJobs["test-project"]).toContain("job-2"); // 이미지 작업 유지
      });
    });
  });

  // ═══════════════════════════════════════════
  // 해시 비교 및 중복 분석 방지 테스트
  // ═══════════════════════════════════════════

  describe("해시 비교 (getChangedDocuments, hasUnanalyzedChanges)", () => {
    /**
     * 💡 콘텐츠 해시로 중복 분석 방지:
     *
     * 문제: 사용자가 저장을 많이 하면 불필요한 분석 요청 발생
     * 해결: 이전 분석 시점의 해시와 비교하여 실제로 변경된 문서만 분석
     *
     * lastAnalyzedHashes: documentId → contentHash (마지막 분석 시점)
     * pendingDocuments: documentId → contentHash (분석 중인 문서)
     */
    it("변경된 문서만 getChangedDocuments로 추출", () => {
      // 이전에 분석한 해시 설정 (content "Test"는 길이 4 → hash-4)
      useAnalysisBufferStore.setState({
        lastAnalyzedHashes: { "doc-1": "hash-4" },
      });

      // 같은 내용 추가 (변경 없음)
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Test");
      // 새로운 문서 추가 (변경됨)
      useAnalysisBufferStore.getState().addToBuffer("doc-2", "New Content");

      const changed = useAnalysisBufferStore.getState().getChangedDocuments();

      expect(changed.length).toBe(1);
      expect(changed[0].documentId).toBe("doc-2");
    });

    it("pendingDocuments에 있는 문서는 변경 목록에서 제외", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Content");
      useAnalysisBufferStore.getState().addToBuffer("doc-2", "Another");

      // doc-1은 이미 분석 요청 중
      useAnalysisBufferStore.setState({
        pendingDocuments: { "doc-1": "hash-7" },
      });

      const changed = useAnalysisBufferStore.getState().getChangedDocuments();

      expect(changed.length).toBe(1);
      expect(changed[0].documentId).toBe("doc-2");
    });

    it("hasUnanalyzedChanges가 올바르게 판단", () => {
      // 아무 것도 없으면 false
      expect(useAnalysisBufferStore.getState().hasUnanalyzedChanges()).toBe(
        false,
      );

      // 새 문서 추가 → true
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Content");
      expect(useAnalysisBufferStore.getState().hasUnanalyzedChanges()).toBe(
        true,
      );

      // 해시 등록 (분석 완료) → false
      useAnalysisBufferStore.setState({
        lastAnalyzedHashes: { "doc-1": "hash-7" },
      });
      expect(useAnalysisBufferStore.getState().hasUnanalyzedChanges()).toBe(
        false,
      );
    });
  });

  describe("setLastAnalyzedHashes", () => {
    it("기존 해시에 새 해시를 병합", () => {
      useAnalysisBufferStore.setState({
        lastAnalyzedHashes: { "doc-1": "hash-1" },
      });

      useAnalysisBufferStore
        .getState()
        .setLastAnalyzedHashes({ "doc-2": "hash-2" });

      const hashes = useAnalysisBufferStore.getState().lastAnalyzedHashes;
      expect(hashes["doc-1"]).toBe("hash-1");
      expect(hashes["doc-2"]).toBe("hash-2");
    });
  });

  // ═══════════════════════════════════════════
  // Conflict 상태 관리 테스트
  // ═══════════════════════════════════════════

  describe("Conflict 상태 관리", () => {
    /**
     * 💡 일관성 이슈 상태 추적:
     *
     * AI 분석 결과 일관성 이슈(Conflict)가 발견되면
     * 사용자가 "해결", "무시", "삭제" 중 선택할 수 있습니다.
     *
     * 이 상태를 저장하여:
     * - 이미 처리한 이슈는 다시 표시하지 않음
     * - 프로젝트 변경 시에도 유지 (ID가 고유하므로)
     */
    describe("markConflictStatus", () => {
      it("이슈 상태를 resolved로 표시", () => {
        useAnalysisBufferStore
          .getState()
          .markConflictStatus("issue-1", "resolved");

        expect(
          useAnalysisBufferStore.getState().processedConflicts["issue-1"],
        ).toBe("resolved");
      });

      it("이슈 상태를 ignored로 표시", () => {
        useAnalysisBufferStore
          .getState()
          .markConflictStatus("issue-2", "ignored");

        expect(
          useAnalysisBufferStore.getState().processedConflicts["issue-2"],
        ).toBe("ignored");
      });

      it("이슈 상태를 deleted로 표시", () => {
        useAnalysisBufferStore
          .getState()
          .markConflictStatus("issue-3", "deleted");

        expect(
          useAnalysisBufferStore.getState().processedConflicts["issue-3"],
        ).toBe("deleted");
      });
    });

    describe("clearProcessedConflicts", () => {
      it("모든 처리된 이슈 상태를 초기화", () => {
        useAnalysisBufferStore
          .getState()
          .markConflictStatus("issue-1", "resolved");
        useAnalysisBufferStore
          .getState()
          .markConflictStatus("issue-2", "ignored");

        useAnalysisBufferStore.getState().clearProcessedConflicts();

        expect(useAnalysisBufferStore.getState().processedConflicts).toEqual(
          {},
        );
      });
    });
  });

  // ═══════════════════════════════════════════
  // 분석 결과 및 스냅샷 테스트
  // ═══════════════════════════════════════════

  describe("분석 결과 관리", () => {
    describe("setPendingAnalysisResult / getPendingAnalysisResult", () => {
      /**
       * 💡 Pending Analysis Result:
       *
       * 분석 완료 후 결과를 저장하고,
       * 사용자가 결과를 확인할 때까지 유지합니다.
       */
      it("프로젝트별 pending result 설정 및 조회", () => {
        useAnalysisBufferStore
          .getState()
          .setPendingAnalysisResult("proj-1", "job-123");

        expect(
          useAnalysisBufferStore.getState().getPendingAnalysisResult("proj-1"),
        ).toBe("job-123");
        expect(
          useAnalysisBufferStore.getState().getPendingAnalysisResult("proj-2"),
        ).toBeNull();
      });

      it("null로 설정하면 해당 프로젝트의 pending result 제거", () => {
        useAnalysisBufferStore
          .getState()
          .setPendingAnalysisResult("proj-1", "job-123");
        useAnalysisBufferStore
          .getState()
          .setPendingAnalysisResult("proj-1", null);

        expect(
          useAnalysisBufferStore.getState().getPendingAnalysisResult("proj-1"),
        ).toBeNull();
      });
    });

    describe("setAnalysisSnapshot / clearAnalysisSnapshot", () => {
      /**
       * 💡 Analysis Snapshot:
       *
       * 분석 시점의 캐릭터/관계 데이터를 저장합니다.
       * 분석 결과와 함께 이전 상태를 비교하는 데 사용됩니다.
       */
      it("프로젝트별 스냅샷 저장", () => {
        const snapshot = {
          characters: [{ id: "char-1", name: "주인공" }],
          links: [{ source: "char-1", target: "char-2" }],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        useAnalysisBufferStore
          .getState()
          .setAnalysisSnapshot("proj-1", snapshot);

        expect(
          useAnalysisBufferStore.getState().analysisSnapshots["proj-1"],
        ).toEqual(snapshot);
      });

      it("스냅샷 삭제", () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const snapshot = { characters: [], links: [] } as any;
        useAnalysisBufferStore
          .getState()
          .setAnalysisSnapshot("proj-1", snapshot);

        useAnalysisBufferStore.getState().clearAnalysisSnapshot("proj-1");

        expect(
          useAnalysisBufferStore.getState().analysisSnapshots["proj-1"],
        ).toBeUndefined();
      });
    });
  });

  // ═══════════════════════════════════════════
  // Job Acknowledgement 테스트
  // ═══════════════════════════════════════════

  describe("Job Acknowledgement", () => {
    /**
     * 💡 Job 확인 처리:
     *
     * 분석 완료 알림을 사용자가 확인했는지 추적합니다.
     * 이미 확인한 작업은 다시 알림하지 않습니다.
     */
    it("Job을 acknowledged로 표시", () => {
      useAnalysisBufferStore.getState().acknowledgeJob("job-123");

      expect(
        useAnalysisBufferStore.getState().isJobAcknowledged("job-123"),
      ).toBe(true);
      expect(
        useAnalysisBufferStore.getState().isJobAcknowledged("job-456"),
      ).toBe(false);
    });

    it("중복 acknowledge는 무시", () => {
      useAnalysisBufferStore.getState().acknowledgeJob("job-123");
      useAnalysisBufferStore.getState().acknowledgeJob("job-123");

      expect(useAnalysisBufferStore.getState().acknowledgedJobIds.length).toBe(
        1,
      );
    });
  });

  // ═══════════════════════════════════════════
  // 분석 상태 테스트
  // ═══════════════════════════════════════════

  describe("분석 상태 관리", () => {
    describe("setAnalyzing / setProgress", () => {
      it("분석 상태와 진행률 설정", () => {
        useAnalysisBufferStore.getState().setAnalyzing(true);
        useAnalysisBufferStore.getState().setProgress(50);

        const state = useAnalysisBufferStore.getState();
        expect(state.isAnalyzing).toBe(true);
        expect(state.progress).toBe(50);
      });
    });

    describe("resetAnalysis", () => {
      /**
       * 💡 분석 상태 강제 초기화:
       *
       * SSE 연결 실패, 오류 발생 등으로 분석이 멈춘 경우
       * 사용자가 수동으로 상태를 리셋할 수 있습니다.
       */
      it("분석 관련 상태를 모두 초기화", () => {
        useAnalysisBufferStore.setState({
          projectId: "test-project",
          currentJobId: "job-123",
          currentJobType: "analysis",
          isAnalyzing: true,
          progress: 75,
          pendingDocuments: { "doc-1": "hash-1" },
        });
        useAnalysisBufferStore
          .getState()
          .setPendingAnalysisResult("test-project", "job-123");
        useAnalysisBufferStore
          .getState()
          .addJobId("test-project", "job-123", "analysis");

        useAnalysisBufferStore.getState().resetAnalysis();

        const state = useAnalysisBufferStore.getState();
        expect(state.currentJobId).toBeNull();
        expect(state.isAnalyzing).toBe(false);
        expect(state.progress).toBe(0);
        expect(state.pendingDocuments).toEqual({});
        expect(state.activeJobs["test-project"]).toBeUndefined();
      });
    });
  });

  // ═══════════════════════════════════════════
  // 통합 시나리오 테스트
  // ═══════════════════════════════════════════

  describe("통합 시나리오", () => {
    it("문서 편집 → 분석 요청 → 완료 → 결과 확인 전체 흐름", () => {
      // 1. 문서 편집 (버퍼에 추가)
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Chapter 1"); // 9자
      useAnalysisBufferStore.getState().addToBuffer("doc-2", "Chapter 2"); // 9자

      expect(useAnalysisBufferStore.getState().bufferCharCount).toBe(18);
      expect(useAnalysisBufferStore.getState().hasUnanalyzedChanges()).toBe(
        true,
      );

      // 2. 분석 요청 (버퍼 flush)
      const documents = useAnalysisBufferStore.getState().flush();
      expect(documents.length).toBe(2);
      expect(useAnalysisBufferStore.getState().buffer.length).toBe(0);

      // 3. 분석 작업 추가
      useAnalysisBufferStore
        .getState()
        .addJobId("test-project", "job-123", "analysis");
      expect(useAnalysisBufferStore.getState().isAnalyzing).toBe(true);

      // 4. 진행률 업데이트
      useAnalysisBufferStore.getState().setProgress(50);
      expect(useAnalysisBufferStore.getState().progress).toBe(50);

      // 5. 분석 완료
      useAnalysisBufferStore.getState().setLastAnalyzedHashes({
        "doc-1": "hash-9",
        "doc-2": "hash-9",
      });
      useAnalysisBufferStore.getState().removeJobId("test-project", "job-123");

      // 6. 결과 확인
      useAnalysisBufferStore.getState().acknowledgeJob("job-123");
      expect(
        useAnalysisBufferStore.getState().isJobAcknowledged("job-123"),
      ).toBe(true);

      // 7. 같은 내용으로 다시 저장해도 변경 없음
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "123456789"); // 길이 9 → hash-9
      expect(useAnalysisBufferStore.getState().hasUnanalyzedChanges()).toBe(
        false,
      );
    });
  });
});
