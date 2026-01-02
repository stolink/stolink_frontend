import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ManuscriptJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "PAUSED";

export interface ManuscriptJob {
  jobId: string;
  projectId: string;
  status: ManuscriptJobStatus;
  progress: number;
  message: string;
  totalDocuments?: number;
  startedAt: number; // timestamp
}

interface ManuscriptJobState {
  jobs: Record<string, ManuscriptJob>; // projectId → job
  setJob: (projectId: string, job: Omit<ManuscriptJob, "projectId">) => void;
  updateJobProgress: (
    projectId: string,
    progress: number,
    message: string,
    status?: ManuscriptJobStatus,
    totalDocuments?: number,
  ) => void;
  completeJob: (projectId: string, totalDocuments: number) => void;
  failJob: (projectId: string, message: string) => void;
  pauseJob: (projectId: string) => void;
  removeJob: (projectId: string) => void;
  getJob: (projectId: string) => ManuscriptJob | undefined;
  getActiveJobs: () => ManuscriptJob[];
}

export const useManuscriptJobStore = create<ManuscriptJobState>()(
  persist(
    (set, get) => ({
      jobs: {},

      setJob: (projectId, job) =>
        set((state) => ({
          jobs: {
            ...state.jobs,
            [projectId]: { ...job, projectId },
          },
        })),

      updateJobProgress: (
        projectId,
        progress,
        message,
        status,
        totalDocuments,
      ) =>
        set((state) => {
          const existing = state.jobs[projectId];
          if (!existing) return state;

          return {
            jobs: {
              ...state.jobs,
              [projectId]: {
                ...existing,
                progress,
                message,
                status: status ?? existing.status,
                totalDocuments: totalDocuments ?? existing.totalDocuments,
              },
            },
          };
        }),

      completeJob: (projectId, totalDocuments) =>
        set((state) => {
          const existing = state.jobs[projectId];
          if (!existing) return state;

          return {
            jobs: {
              ...state.jobs,
              [projectId]: {
                ...existing,
                status: "COMPLETED",
                progress: 100,
                totalDocuments,
              },
            },
          };
        }),

      failJob: (projectId, message) =>
        set((state) => {
          const existing = state.jobs[projectId];
          if (!existing) return state;

          return {
            jobs: {
              ...state.jobs,
              [projectId]: {
                ...existing,
                status: "FAILED",
                message,
              },
            },
          };
        }),

      pauseJob: (projectId) =>
        set((state) => {
          const existing = state.jobs[projectId];
          if (!existing) return state;

          return {
            jobs: {
              ...state.jobs,
              [projectId]: {
                ...existing,
                status: "PAUSED",
                message: "일시 중지됨 (서버에서 찾을 수 없음)",
              },
            },
          };
        }),

      removeJob: (projectId) =>
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [projectId]: _, ...rest } = state.jobs;
          return { jobs: rest };
        }),

      getJob: (projectId) => get().jobs[projectId],

      getActiveJobs: () =>
        Object.values(get().jobs).filter(
          (job) => job.status === "PENDING" || job.status === "PROCESSING",
        ),
    }),
    {
      name: "manuscript-job-storage",
      partialize: (state) => ({ jobs: state.jobs }),
    },
  ),
);
