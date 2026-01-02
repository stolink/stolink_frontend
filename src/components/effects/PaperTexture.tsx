/**
 * PaperTexture (Disabled)
 *
 * 종이 질감 효과가 제거되었습니다.
 * 인터페이스 호환성을 위해 유지됩니다.
 */

interface PaperTextureProps {
  /** 불투명도 (0-1) */
  opacity?: number;
  /** 추가 클래스 */
  className?: string;
  /** 노이즈 강도 (baseFrequency) */
  intensity?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PaperTexture(_props: PaperTextureProps) {
  return null;
}

export default PaperTexture;
