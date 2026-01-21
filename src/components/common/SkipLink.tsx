/**
 * 스킵 링크 컴포넌트
 * 키보드 사용자가 반복적인 네비게이션을 건너뛰고 본문으로 바로 이동할 수 있게 함
 * KWCAG 2.2 - 2.4.1 블록 건너뛰기
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-md focus:bg-mocha-500 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-mocha-300"
    >
      본문 바로가기
    </a>
  );
}
