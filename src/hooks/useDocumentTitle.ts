import { useEffect } from "react";

/**
 * 페이지 제목(document.title)을 동적으로 관리하는 훅
 * SPA에서 라우트 변경 시 스크린 리더에 페이지 변경을 알림
 * KWCAG 2.2 - 2.4.2 페이지 제목 제공
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | StoLink` : "StoLink";

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
