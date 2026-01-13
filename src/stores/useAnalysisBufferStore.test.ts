/**
 * useAnalysisBufferStore 테스트
 *
 * IndexedDB 버퍼 스토어의 핵심 기능을 검증합니다.
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

describe("useAnalysisBufferStore", () => {
  beforeEach(() => {
    // 각 테스트 전 스토어 초기화
    useAnalysisBufferStore.getState().clearBuffer();
    useAnalysisBufferStore.getState().setProjectId("test-project");
  });

  describe("addToBuffer", () => {
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

  describe("프로젝트 변경 시 버퍼 초기화", () => {
    it("다른 프로젝트로 변경하면 버퍼가 초기화되어야 함", () => {
      useAnalysisBufferStore.getState().addToBuffer("doc-1", "Content");

      expect(useAnalysisBufferStore.getState().bufferCharCount).toBe(7);

      useAnalysisBufferStore.getState().setProjectId("other-project");

      expect(useAnalysisBufferStore.getState().bufferCharCount).toBe(0);
      expect(useAnalysisBufferStore.getState().buffer.length).toBe(0);
    });
  });
});
