import { describe, it, expect, beforeEach } from "vitest";
import { useSceneStore } from "./useSceneStore";

describe("useSceneStore", () => {
  beforeEach(() => {
    useSceneStore.setState({ scenes: {} });
  });

  describe("createScene", () => {
    it("should create a new scene", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Opening Scene",
      });

      expect(scene).toBeDefined();
      expect(scene.id).toContain("scene-");
      expect(scene.title).toBe("Opening Scene");
      expect(scene.chapterId).toBe("chapter-1");
      expect(scene.projectId).toBe("project-1");
      expect(scene.content).toBe("");
      expect(scene.order).toBe(0);
      expect(scene.characterIds).toEqual([]);
      expect(scene.foreshadowingIds).toEqual([]);
    });

    it("should create with optional fields", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test Scene",
        synopsis: "A test synopsis",
        targetWordCount: 3000,
        characterIds: ["char-1", "char-2"],
      });

      expect(scene.metadata.synopsis).toBe("A test synopsis");
      expect(scene.metadata.targetWordCount).toBe(3000);
      expect(scene.characterIds).toEqual(["char-1", "char-2"]);
    });

    it("should auto-increment order for scenes in same chapter", () => {
      useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 1",
      });

      const scene2 = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 2",
      });

      expect(scene2.order).toBe(1);
    });

    it("should add scene to store", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test",
      });

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id]).toBeDefined();
      expect(state[scene.id].title).toBe("Test");
    });
  });

  describe("updateScene", () => {
    it("should update scene title", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Original Title",
      });

      useSceneStore.getState().updateScene(scene.id, {
        title: "Updated Title",
      });

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id].title).toBe("Updated Title");
    });

    it("should update content and wordCount", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test",
      });

      const newContent = "This is new content with some words";
      useSceneStore.getState().updateScene(scene.id, {
        content: newContent,
      });

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id].content).toBe(newContent);
      expect(state[scene.id].metadata.wordCount).toBe(newContent.length);
    });

    it("should update metadata", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test",
      });

      useSceneStore.getState().updateScene(scene.id, {
        metadata: {
          status: "final",
          keywords: ["action", "climax"],
        },
      });

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id].metadata.status).toBe("final");
      expect(state[scene.id].metadata.keywords).toEqual(["action", "climax"]);
    });

    it("should update characterIds", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test",
      });

      useSceneStore.getState().updateScene(scene.id, {
        characterIds: ["char-1", "char-2"],
      });

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id].characterIds).toEqual(["char-1", "char-2"]);
    });

    it("should do nothing if scene does not exist", () => {
      useSceneStore.getState().updateScene("non-existent", {
        title: "Updated",
      });

      const state = useSceneStore.getState().scenes;
      expect(state["non-existent"]).toBeUndefined();
    });
  });

  describe("deleteScene", () => {
    it("should delete a scene", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "To Delete",
      });

      useSceneStore.getState().deleteScene(scene.id);

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id]).toBeUndefined();
    });
  });

  describe("getScenesByChapter", () => {
    it("should return scenes for a chapter sorted by order", () => {
      useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 1",
      });

      useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 2",
      });

      useSceneStore.getState().createScene({
        chapterId: "chapter-2",
        projectId: "project-1",
        title: "Scene 3",
      });

      const scenes = useSceneStore.getState().getScenesByChapter("chapter-1");

      expect(scenes).toHaveLength(2);
      expect(scenes[0].title).toBe("Scene 1");
      expect(scenes[1].title).toBe("Scene 2");
    });

    it("should return empty array if no scenes found", () => {
      const scenes = useSceneStore
        .getState()
        .getScenesByChapter("non-existent");

      expect(scenes).toEqual([]);
    });
  });

  describe("getScenesByProject", () => {
    it("should return all scenes for a project", () => {
      useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 1",
      });

      useSceneStore.getState().createScene({
        chapterId: "chapter-2",
        projectId: "project-1",
        title: "Scene 2",
      });

      useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-2",
        title: "Scene 3",
      });

      const scenes = useSceneStore.getState().getScenesByProject("project-1");

      expect(scenes).toHaveLength(2);
    });
  });

  describe("addCharacterToScene", () => {
    it("should add character to scene", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test",
      });

      useSceneStore.getState().addCharacterToScene(scene.id, "char-1");

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id].characterIds).toContain("char-1");
    });

    it("should not add duplicate characters", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test",
      });

      useSceneStore.getState().addCharacterToScene(scene.id, "char-1");
      useSceneStore.getState().addCharacterToScene(scene.id, "char-1");

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id].characterIds).toEqual(["char-1"]);
    });

    it("should do nothing if scene does not exist", () => {
      useSceneStore.getState().addCharacterToScene("non-existent", "char-1");

      const state = useSceneStore.getState().scenes;
      expect(state["non-existent"]).toBeUndefined();
    });
  });

  describe("removeCharacterFromScene", () => {
    it("should remove character from scene", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test",
        characterIds: ["char-1", "char-2"],
      });

      useSceneStore.getState().removeCharacterFromScene(scene.id, "char-1");

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id].characterIds).toEqual(["char-2"]);
    });
  });

  describe("getScenesWithCharacter", () => {
    it("should return scenes containing character", () => {
      useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 1",
        characterIds: ["char-1"],
      });

      useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 2",
        characterIds: ["char-2"],
      });

      useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 3",
        characterIds: ["char-1", "char-2"],
      });

      const scenes = useSceneStore.getState().getScenesWithCharacter("char-1");

      expect(scenes).toHaveLength(2);
      expect(scenes[0].title).toBe("Scene 1");
      expect(scenes[1].title).toBe("Scene 3");
    });
  });

  describe("addForeshadowingToScene", () => {
    it("should add foreshadowing to scene", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test",
      });

      useSceneStore
        .getState()
        .addForeshadowingToScene(scene.id, "foreshadow-1");

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id].foreshadowingIds).toContain("foreshadow-1");
    });

    it("should not add duplicate foreshadowing", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test",
      });

      useSceneStore
        .getState()
        .addForeshadowingToScene(scene.id, "foreshadow-1");
      useSceneStore
        .getState()
        .addForeshadowingToScene(scene.id, "foreshadow-1");

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id].foreshadowingIds).toEqual(["foreshadow-1"]);
    });
  });

  describe("removeForeshadowingFromScene", () => {
    it("should remove foreshadowing from scene", () => {
      const scene = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Test",
      });

      useSceneStore
        .getState()
        .addForeshadowingToScene(scene.id, "foreshadow-1");
      useSceneStore
        .getState()
        .addForeshadowingToScene(scene.id, "foreshadow-2");

      useSceneStore
        .getState()
        .removeForeshadowingFromScene(scene.id, "foreshadow-1");

      const state = useSceneStore.getState().scenes;
      expect(state[scene.id].foreshadowingIds).toEqual(["foreshadow-2"]);
    });
  });

  describe("reorderScenes", () => {
    it("should reorder scenes in a chapter", () => {
      const scene1 = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 1",
      });

      const scene2 = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 2",
      });

      const scene3 = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 3",
      });

      // Reverse order
      useSceneStore
        .getState()
        .reorderScenes("chapter-1", [scene3.id, scene2.id, scene1.id]);

      const state = useSceneStore.getState().scenes;
      expect(state[scene3.id].order).toBe(0);
      expect(state[scene2.id].order).toBe(1);
      expect(state[scene1.id].order).toBe(2);
    });

    it("should only reorder scenes in the specified chapter", () => {
      const scene1 = useSceneStore.getState().createScene({
        chapterId: "chapter-1",
        projectId: "project-1",
        title: "Scene 1",
      });

      const scene2 = useSceneStore.getState().createScene({
        chapterId: "chapter-2",
        projectId: "project-1",
        title: "Scene 2",
      });

      useSceneStore
        .getState()
        .reorderScenes("chapter-1", [scene2.id, scene1.id]);

      const state = useSceneStore.getState().scenes;
      // scene2 should not be reordered because it's not in chapter-1
      expect(state[scene2.id].order).toBe(0);
      expect(state[scene1.id].order).toBe(1);
    });
  });
});
