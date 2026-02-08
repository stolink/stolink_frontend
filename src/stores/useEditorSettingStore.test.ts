import { describe, it, expect, beforeEach } from "vitest";
import { useEditorSettingStore } from "./useEditorSettingStore";
import { getDefaultEditorSettings } from "@/types/editorSettings";

// ─────────────────────────────────────────────
// useEditorSettingStore 테스트
//
// Zustand 스토어 테스트의 핵심:
//   renderHook이 필요 없습니다.
//   Zustand 스토어는 React 밖에서도 동작하는 순수 JS 객체이므로,
//   getState()로 읽고 액션을 직접 호출하면 됩니다.
//
// 이 스토어에서 테스트할 가치가 있는 것:
//   1. 값 범위 제한 (fontSize 14~32 클램핑)
//   2. 토글 순환 (typewriterMode: off → top → center → bottom → off)
//   3. 부분 업데이트 (typography만 바꿔도 visual은 유지)
//   4. 초기화 (resetToDefaults)
// ─────────────────────────────────────────────

describe("useEditorSettingStore", () => {
  beforeEach(() => {
    // 매 테스트 전 기본값으로 리셋
    // setState가 아닌 resetToDefaults를 사용 — 실제 액션 동작도 검증
    useEditorSettingStore.getState().resetToDefaults();
  });

  // ═══════════════════════════════════════════
  // 1. 기본값 확인
  // ═══════════════════════════════════════════
  describe("기본값", () => {
    it("기본 설정이 올바르게 초기화된다", () => {
      const state = useEditorSettingStore.getState();
      const defaults = getDefaultEditorSettings();

      expect(state.typography.fontFamily).toBe(defaults.typography.fontFamily);
      expect(state.typography.fontSize).toBe(16);
      expect(state.visual.theme).toBe("light");
      expect(state.behavior.zenMode).toBe(false);
      expect(state.system.autoSaveInterval).toBe("5s");
    });
  });

  // ═══════════════════════════════════════════
  // 2. 값 범위 제한 (클램핑)
  //
  // setFontSize(100)을 해도 32를 넘지 않음.
  // 이 로직이 없으면 UI가 깨지므로 테스트 가치가 높음.
  // ═══════════════════════════════════════════
  describe("값 범위 제한", () => {
    it("fontSize는 14 미만으로 내려가지 않는다", () => {
      useEditorSettingStore.getState().setFontSize(8);

      expect(useEditorSettingStore.getState().typography.fontSize).toBe(14);
    });

    it("fontSize는 32 초과로 올라가지 않는다", () => {
      useEditorSettingStore.getState().setFontSize(100);

      expect(useEditorSettingStore.getState().typography.fontSize).toBe(32);
    });

    it("fontSize 정상 범위는 그대로 적용된다", () => {
      useEditorSettingStore.getState().setFontSize(20);

      expect(useEditorSettingStore.getState().typography.fontSize).toBe(20);
    });

    it("lineHeight는 1.0~3.0 범위로 제한된다", () => {
      useEditorSettingStore.getState().setLineHeight(0.5);
      expect(useEditorSettingStore.getState().typography.lineHeight).toBe(1.0);

      useEditorSettingStore.getState().setLineHeight(5.0);
      expect(useEditorSettingStore.getState().typography.lineHeight).toBe(3.0);
    });

    it("letterSpacing은 -0.05~0.1 범위로 제한된다", () => {
      useEditorSettingStore.getState().setLetterSpacing(-1);
      expect(useEditorSettingStore.getState().typography.letterSpacing).toBe(
        -0.05,
      );

      useEditorSettingStore.getState().setLetterSpacing(1);
      expect(useEditorSettingStore.getState().typography.letterSpacing).toBe(
        0.1,
      );
    });
  });

  // ═══════════════════════════════════════════
  // 3. 토글 순환
  //
  // toggleTypewriterMode()는 off → top → center → bottom → off로 순환.
  // 배열 인덱스 기반 순환이라 경계값(마지막→처음) 테스트가 중요.
  // ═══════════════════════════════════════════
  describe("토글 동작", () => {
    it("typewriterMode가 off → top → center → bottom → off로 순환한다", () => {
      const { toggleTypewriterMode } = useEditorSettingStore.getState();
      const getMode = () =>
        useEditorSettingStore.getState().behavior.typewriterMode;

      expect(getMode()).toBe("off"); // 초기값

      toggleTypewriterMode();
      expect(getMode()).toBe("top");

      toggleTypewriterMode();
      expect(getMode()).toBe("center");

      toggleTypewriterMode();
      expect(getMode()).toBe("bottom");

      toggleTypewriterMode();
      expect(getMode()).toBe("off"); // 다시 처음으로
    });

    it("focusMode 토글이 동작한다", () => {
      const { toggleFocusMode } = useEditorSettingStore.getState();

      expect(useEditorSettingStore.getState().behavior.focusMode).toBe(false);

      toggleFocusMode();
      expect(useEditorSettingStore.getState().behavior.focusMode).toBe(true);

      toggleFocusMode();
      expect(useEditorSettingStore.getState().behavior.focusMode).toBe(false);
    });
  });

  // ═══════════════════════════════════════════
  // 4. 부분 업데이트 (Bulk Update)
  //
  // updateTypography로 font만 바꿔도 visual, behavior는 유지되는지.
  // immer 미들웨어가 올바르게 동작하는지 간접 검증.
  // ═══════════════════════════════════════════
  describe("부분 업데이트", () => {
    it("typography만 변경해도 다른 카테고리는 유지된다", () => {
      // visual을 먼저 변경
      useEditorSettingStore.getState().setTheme("dark");

      // typography를 bulk update
      useEditorSettingStore
        .getState()
        .updateTypography({ fontSize: 24, lineHeight: 2.0 });

      const state = useEditorSettingStore.getState();
      // typography: 변경됨
      expect(state.typography.fontSize).toBe(24);
      expect(state.typography.lineHeight).toBe(2.0);
      // typography의 다른 필드: 기본값 유지
      expect(state.typography.fontFamily).toBe("pretendard");
      // visual: 아까 바꾼 dark 그대로
      expect(state.visual.theme).toBe("dark");
    });
  });

  // ═══════════════════════════════════════════
  // 5. 초기화
  // ═══════════════════════════════════════════
  describe("resetToDefaults", () => {
    it("모든 설정을 기본값으로 되돌린다", () => {
      // 여러 설정을 변경
      const store = useEditorSettingStore.getState();
      store.setFontSize(24);
      store.setTheme("dark");
      store.setZenMode(true);
      store.setAutoSaveInterval("1m");

      // 초기화
      useEditorSettingStore.getState().resetToDefaults();

      // 모든 값이 기본값으로
      const state = useEditorSettingStore.getState();
      const defaults = getDefaultEditorSettings();
      expect(state.typography).toEqual(defaults.typography);
      expect(state.visual).toEqual(defaults.visual);
      expect(state.behavior).toEqual(defaults.behavior);
      expect(state.system).toEqual(defaults.system);
    });
  });
});
