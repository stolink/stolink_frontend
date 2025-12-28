import { describe, it, expect, beforeEach } from "vitest";
import { useChapterStore } from "./useChapterStore";

describe("useChapterStore", () => {
  beforeEach(() => {
    useChapterStore.setState({ chapters: {} });
  });

  describe("createChapter", () => {
    it("should create a new chapter", () => {
      const id = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 1",
        type: "chapter",
      });

      const state = useChapterStore.getState().chapters;
      expect(state[id]).toBeDefined();
      expect(state[id].title).toBe("Chapter 1");
      expect(state[id].projectId).toBe("project-1");
      expect(state[id].content).toBe("");
      expect(state[id].order).toBe(0);
    });

    it("should auto-increment order for chapters in same project", () => {
      useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 1",
        type: "chapter",
      });

      const id2 = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 2",
        type: "chapter",
      });

      const state = useChapterStore.getState().chapters;
      expect(state[id2].order).toBe(1);
    });

    it("should create with parentId", () => {
      const id = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Sub Chapter",
        type: "chapter",
        parentId: "parent-chapter-1",
      });

      const state = useChapterStore.getState().chapters;
      expect(state[id].parentId).toBe("parent-chapter-1");
    });

    it("should create with extras", () => {
      const id = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter with Extras",
        type: "chapter",
        extras: {
          color: "blue",
          icon: "star",
        },
      });

      const state = useChapterStore.getState().chapters;
      expect(state[id].extras).toEqual({
        color: "blue",
        icon: "star",
      });
    });
  });

  describe("updateChapter", () => {
    it("should update chapter title", () => {
      const id = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Original Title",
        type: "chapter",
      });

      useChapterStore.getState().updateChapter(id, {
        title: "Updated Title",
      });

      const state = useChapterStore.getState().chapters;
      expect(state[id].title).toBe("Updated Title");
    });

    it("should update content", () => {
      const id = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter",
        type: "chapter",
      });

      useChapterStore.getState().updateChapter(id, {
        content: "New content",
      });

      const state = useChapterStore.getState().chapters;
      expect(state[id].content).toBe("New content");
    });

    it("should update multiple fields", () => {
      const id = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter",
        type: "chapter",
      });

      useChapterStore.getState().updateChapter(id, {
        title: "Updated Title",
        content: "Updated content",
        isPlot: true,
      });

      const state = useChapterStore.getState().chapters;
      expect(state[id].title).toBe("Updated Title");
      expect(state[id].content).toBe("Updated content");
      expect(state[id].isPlot).toBe(true);
    });

    it("should do nothing if chapter does not exist", () => {
      useChapterStore.getState().updateChapter("non-existent", {
        title: "Updated",
      });

      const state = useChapterStore.getState().chapters;
      expect(state["non-existent"]).toBeUndefined();
    });
  });

  describe("deleteChapter", () => {
    it("should delete a chapter", () => {
      const id = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "To Delete",
        type: "chapter",
      });

      useChapterStore.getState().deleteChapter(id);

      const state = useChapterStore.getState().chapters;
      expect(state[id]).toBeUndefined();
    });
  });

  describe("reorderChapters", () => {
    it("should reorder chapters", () => {
      const id1 = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 1",
        type: "chapter",
      });

      const id2 = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 2",
        type: "chapter",
      });

      const id3 = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 3",
        type: "chapter",
      });

      // Reverse order
      useChapterStore.getState().reorderChapters("project-1", [id3, id2, id1]);

      const state = useChapterStore.getState().chapters;
      expect(state[id3].order).toBe(0);
      expect(state[id2].order).toBe(1);
      expect(state[id1].order).toBe(2);
    });

    it("should only reorder chapters that exist", () => {
      const id1 = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 1",
        type: "chapter",
      });

      useChapterStore
        .getState()
        .reorderChapters("project-1", ["non-existent", id1]);

      const state = useChapterStore.getState().chapters;
      // id1 should be at index 1 in the array, so order should be 1
      expect(state[id1].order).toBe(1);
    });
  });

  describe("getChaptersByProject", () => {
    it("should return chapters for a project sorted by order", () => {
      useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 1",
        type: "chapter",
      });

      useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 2",
        type: "chapter",
      });

      useChapterStore.getState().createChapter({
        projectId: "project-2",
        title: "Chapter 3",
        type: "chapter",
      });

      const chapters = useChapterStore
        .getState()
        .getChaptersByProject("project-1");

      expect(chapters).toHaveLength(2);
      expect(chapters[0].title).toBe("Chapter 1");
      expect(chapters[1].title).toBe("Chapter 2");
    });

    it("should return empty array if no chapters found", () => {
      const chapters = useChapterStore
        .getState()
        .getChaptersByProject("non-existent");

      expect(chapters).toEqual([]);
    });

    it("should return chapters sorted by order", () => {
      const id1 = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 1",
        type: "chapter",
      });

      const id2 = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 2",
        type: "chapter",
      });

      const id3 = useChapterStore.getState().createChapter({
        projectId: "project-1",
        title: "Chapter 3",
        type: "chapter",
      });

      // Manually set orders out of sequence
      useChapterStore.getState().updateChapter(id1, { order: 2 });
      useChapterStore.getState().updateChapter(id2, { order: 0 });
      useChapterStore.getState().updateChapter(id3, { order: 1 });

      const chapters = useChapterStore
        .getState()
        .getChaptersByProject("project-1");

      expect(chapters[0].title).toBe("Chapter 2");
      expect(chapters[1].title).toBe("Chapter 3");
      expect(chapters[2].title).toBe("Chapter 1");
    });
  });
});
