/**
 * 문서 스냅샷 저장소
 *
 * 각 문서의 특정 시점 상태를 저장하고 복원하는 기능 제공
 * IndexedDB에 persist하여 새로고침 후에도 유지
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

// 스냅샷 타입 정의
export interface Snapshot {
  id: string;
  documentId: string;
  title: string;
  content: string;
  createdAt: string;
  description?: string;
}

interface SnapshotStore {
  // 문서ID -> 스냅샷 배열
  snapshots: Record<string, Snapshot[]>;

  // 최대 스냅샷 수 (문서당)
  maxSnapshotsPerDocument: number;

  // Actions
  createSnapshot: (
    documentId: string,
    title: string,
    content: string,
    description?: string
  ) => Snapshot;
  deleteSnapshot: (documentId: string, snapshotId: string) => void;
  getSnapshots: (documentId: string) => Snapshot[];
  restoreSnapshot: (snapshotId: string) => Snapshot | null;
  clearDocumentSnapshots: (documentId: string) => void;
}

// IndexedDB 기반 스토리지
const snapshotStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

// ID 생성
const generateId = () =>
  `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useSnapshotStore = create<SnapshotStore>()(
  persist(
    immer((set, get) => ({
      snapshots: {},
      maxSnapshotsPerDocument: 10,

      createSnapshot: (documentId, title, content, description) => {
        const snapshot: Snapshot = {
          id: generateId(),
          documentId,
          title,
          content,
          createdAt: new Date().toISOString(),
          description,
        };

        set((state) => {
          if (!state.snapshots[documentId]) {
            state.snapshots[documentId] = [];
          }

          // 최대 개수 제한
          if (
            state.snapshots[documentId].length >= state.maxSnapshotsPerDocument
          ) {
            // 가장 오래된 스냅샷 제거
            state.snapshots[documentId].shift();
          }

          state.snapshots[documentId].push(snapshot);
        });

        return snapshot;
      },

      deleteSnapshot: (documentId, snapshotId) => {
        set((state) => {
          if (state.snapshots[documentId]) {
            state.snapshots[documentId] = state.snapshots[documentId].filter(
              (s) => s.id !== snapshotId
            );
          }
        });
      },

      getSnapshots: (documentId) => {
        return get().snapshots[documentId] || [];
      },

      restoreSnapshot: (snapshotId) => {
        const state = get();
        for (const documentId in state.snapshots) {
          const snapshot = state.snapshots[documentId].find(
            (s) => s.id === snapshotId
          );
          if (snapshot) {
            return snapshot;
          }
        }
        return null;
      },

      clearDocumentSnapshots: (documentId) => {
        set((state) => {
          delete state.snapshots[documentId];
        });
      },
    })),
    {
      name: "sto-link-snapshots",
      storage: createJSONStorage(() => snapshotStorage),
    }
  )
);

// 편의 훅
export function useDocumentSnapshots(documentId: string | null) {
  const { createSnapshot, deleteSnapshot, getSnapshots, restoreSnapshot } =
    useSnapshotStore();

  const snapshots = documentId ? getSnapshots(documentId) : [];

  return {
    snapshots,
    createSnapshot: (title: string, content: string, description?: string) => {
      if (!documentId) return null;
      return createSnapshot(documentId, title, content, description);
    },
    deleteSnapshot: (snapshotId: string) => {
      if (!documentId) return;
      deleteSnapshot(documentId, snapshotId);
    },
    restoreSnapshot,
  };
}
