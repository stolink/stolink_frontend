import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { useUpdateProject, projectKeys } from "./useProjects";
import { projectService } from "@/services/projectService";
import type { Project } from "@/types";

// ─────────────────────────────────────────────
// useUpdateProject 낙관적 업데이트 테스트
//
// 이전 테스트들과의 핵심 차이점:
// 1. test/utils.tsx의 renderHook을 쓰지 않음
//    → 우리가 직접 QueryClient를 만들어서 캐시 상태를 검사해야 하기 때문
// 2. vi.spyOn으로 서비스 호출을 가로챔
//    → MSW 대신 서비스 레벨 mock을 씀 (응답 시점을 제어하기 위해)
// 3. 테스트 전에 캐시를 미리 채워놓음
//    → onMutate가 "이전 값"을 스냅샷하려면 캐시에 데이터가 있어야 함
// ─────────────────────────────────────────────

// 테스트용 프로젝트 데이터
const MOCK_PROJECT: Project = {
  id: "project-1",
  title: "원래 제목",
  description: "테스트 설명",
  genre: "fantasy",
  status: "writing",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z",
  order: 0,
};

// ─────────────────────────────────────────────
// 왜 QueryClient를 직접 만드는가?
//
// test/utils.tsx의 renderHook은 내부에서 QueryClient를 생성하므로
// 외부에서 접근할 수 없습니다.
// 하지만 낙관적 업데이트 테스트에서는:
//   1. 캐시에 초기 데이터를 넣고 (setQueryData)
//   2. mutation 후 캐시가 바뀌었는지 확인해야 함 (getQueryData)
// 그래서 QueryClient를 밖에서 만들어 테스트와 컴포넌트가 공유합니다.
// ─────────────────────────────────────────────

let queryClient: QueryClient;

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

describe("useUpdateProject", () => {
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // 캐시에 초기 데이터를 미리 채워놓음
    // → onMutate의 getQueryData가 이 데이터를 스냅샷함
    queryClient.setQueryData(projectKeys.detail("project-1"), MOCK_PROJECT);
    queryClient.setQueryData(projectKeys.list(), {
      projects: [MOCK_PROJECT],
    });
  });

  // ═══════════════════════════════════════════
  // 1. 낙관적 업데이트: 서버 응답 전에 UI가 먼저 바뀌는가?
  //
  // 핵심: mutationFn이 아직 resolve되지 않은 상태에서
  // 캐시가 이미 업데이트되어야 합니다.
  // 이를 위해 resolve를 수동 제어하는 "deferred" 패턴을 씁니다.
  // ═══════════════════════════════════════════
  it("mutate 호출 즉시 캐시가 업데이트된다 (낙관적 업데이트)", async () => {
    // Arrange: resolve를 수동 제어하는 Promise 생성
    // → 우리가 resolveUpdate()를 호출하기 전까지 서버 응답이 오지 않음
    let resolveUpdate!: (value: { data: Project }) => void;
    vi.spyOn(projectService, "update").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: createWrapper(),
    });

    // Act: mutation 실행 (서버 응답은 아직 안 옴)
    result.current.mutate({
      id: "project-1",
      payload: { title: "새 제목" },
    });

    // Assert: 서버 응답 전인데도 캐시가 바뀌어야 함 (= 낙관적 업데이트)
    await waitFor(() => {
      const cachedDetail = queryClient.getQueryData<Project>(
        projectKeys.detail("project-1"),
      );
      expect(cachedDetail?.title).toBe("새 제목");
    });

    // 목록 캐시도 동시에 업데이트되었는지 확인
    const cachedList = queryClient.getQueryData<{ projects: Project[] }>(
      projectKeys.list(),
    );
    expect(cachedList?.projects[0].title).toBe("새 제목");

    // Cleanup: Promise를 resolve해서 mutation 완료
    resolveUpdate({ data: { ...MOCK_PROJECT, title: "새 제목" } });
  });

  // ═══════════════════════════════════════════
  // 2. 에러 롤백: 서버가 실패하면 이전 상태로 돌아가는가?
  //
  // 흐름:
  //   onMutate → 캐시를 "새 제목"으로 낙관적 업데이트
  //   mutationFn → 에러 발생!
  //   onError → 스냅샷을 사용해 "원래 제목"으로 롤백
  // ═══════════════════════════════════════════
  it("서버 에러 시 캐시를 이전 상태로 롤백한다", async () => {
    // Arrange: 서비스가 에러를 던지도록 설정
    vi.spyOn(projectService, "update").mockRejectedValue(
      new Error("서버 에러"),
    );

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: createWrapper(),
    });

    // Act: mutation 실행 (실패할 것)
    result.current.mutate({
      id: "project-1",
      payload: { title: "새 제목" },
    });

    // Assert: 에러 상태가 되었는지 확인
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // 낙관적으로 "새 제목"이 되었다가, 에러 후 "원래 제목"으로 롤백
    const cachedDetail = queryClient.getQueryData<Project>(
      projectKeys.detail("project-1"),
    );
    expect(cachedDetail?.title).toBe("원래 제목");

    // 목록도 롤백
    const cachedList = queryClient.getQueryData<{ projects: Project[] }>(
      projectKeys.list(),
    );
    expect(cachedList?.projects[0].title).toBe("원래 제목");
  });

  // ═══════════════════════════════════════════
  // 3. Partial 업데이트: 대상 필드만 변경하고 나머지는 유지
  // ═══════════════════════════════════════════
  it("업데이트 대상 필드만 변경하고 나머지는 유지한다", async () => {
    let resolveUpdate!: (value: { data: Project }) => void;
    vi.spyOn(projectService, "update").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        }),
    );

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: createWrapper(),
    });

    // title만 변경
    result.current.mutate({
      id: "project-1",
      payload: { title: "새 제목" },
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Project>(
        projectKeys.detail("project-1"),
      );
      // 변경된 필드
      expect(cached?.title).toBe("새 제목");
      // 변경하지 않은 필드들은 그대로
      expect(cached?.genre).toBe("fantasy");
      expect(cached?.description).toBe("테스트 설명");
    });

    resolveUpdate({ data: { ...MOCK_PROJECT, title: "새 제목" } });
  });
});
