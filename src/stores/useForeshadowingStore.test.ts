import { describe, it, expect, beforeEach } from "vitest";
import { useForeshadowingStore } from "./useForeshadowingStore";

describe("useForeshadowingStore", () => {
  beforeEach(() => {
    useForeshadowingStore.setState({ foreshadowings: {} });
  });

  describe("createForeshadowing", () => {
    it("should create a new foreshadowing", () => {
      const fs = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "보물의_비밀",
      });

      expect(fs).toBeDefined();
      expect(fs.id).toContain("fs-");
      expect(fs.tag).toBe("보물의_비밀");
      expect(fs.status).toBe("pending");
      expect(fs.importance).toBe("minor");
    });

    it("should create with optional fields", () => {
      const fs = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "중요_복선",
        description: "Very important",
        importance: "major",
        relatedCharacterIds: ["char-1", "char-2"],
      });

      expect(fs.description).toBe("Very important");
      expect(fs.importance).toBe("major");
      expect(fs.relatedCharacterIds).toEqual(["char-1", "char-2"]);
    });
  });

  describe("updateForeshadowing", () => {
    it("should update foreshadowing fields", () => {
      const fs = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "원래_태그",
      });

      useForeshadowingStore.getState().updateForeshadowing(fs.id, {
        tag: "수정된_태그",
        description: "새로운 설명",
      });

      const state = useForeshadowingStore.getState().foreshadowings;
      expect(state[fs.id].tag).toBe("수정된_태그");
      expect(state[fs.id].description).toBe("새로운 설명");
    });

    it("should do nothing if foreshadowing does not exist", () => {
      useForeshadowingStore.getState().updateForeshadowing("non-existent", {
        tag: "Updated",
      });

      const state = useForeshadowingStore.getState().foreshadowings;
      expect(state["non-existent"]).toBeUndefined();
    });
  });

  describe("deleteForeshadowing", () => {
    it("should delete a foreshadowing", () => {
      const fs = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "삭제할_복선",
      });

      useForeshadowingStore.getState().deleteForeshadowing(fs.id);

      const state = useForeshadowingStore.getState().foreshadowings;
      expect(state[fs.id]).toBeUndefined();
    });
  });

  describe("getByProject", () => {
    it("should return all foreshadowings for a project", () => {
      useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선1",
      });

      useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선2",
      });

      useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-2",
        tag: "복선3",
      });

      const result = useForeshadowingStore.getState().getByProject("project-1");
      expect(result).toHaveLength(2);
    });
  });

  describe("getByStatus", () => {
    it("should return foreshadowings filtered by status", () => {
      const fs1 = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선1",
      });

      const fs2 = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선2",
      });

      useForeshadowingStore.getState().markAsRecovered(fs1.id, {
        sectionTitle: "Section 1",
        documentId: "doc-1",
      });

      const pending = useForeshadowingStore
        .getState()
        .getByStatus("project-1", "pending");
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(fs2.id);

      const recovered = useForeshadowingStore
        .getState()
        .getByStatus("project-1", "recovered");
      expect(recovered).toHaveLength(1);
      expect(recovered[0].id).toBe(fs1.id);
    });
  });

  describe("getByCharacter", () => {
    it("should return foreshadowings related to a character", () => {
      const fs1 = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선1",
        relatedCharacterIds: ["char-1", "char-2"],
      });

      useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선2",
        relatedCharacterIds: ["char-3"],
      });

      const result = useForeshadowingStore.getState().getByCharacter("char-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(fs1.id);
    });
  });

  describe("getUnresolved", () => {
    it("should return only pending foreshadowings", () => {
      const fs1 = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선1",
      });

      const fs2 = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선2",
      });

      useForeshadowingStore.getState().markAsRecovered(fs1.id, {
        sectionTitle: "Section 1",
        documentId: "doc-1",
      });

      const result = useForeshadowingStore
        .getState()
        .getUnresolved("project-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(fs2.id);
    });
  });

  describe("markAsRecovered", () => {
    it("should mark foreshadowing as recovered", () => {
      const fs = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선",
      });

      useForeshadowingStore.getState().markAsRecovered(fs.id, {
        sectionTitle: "Section 1",
        documentId: "doc-1",
      });

      const state = useForeshadowingStore.getState().foreshadowings;
      expect(state[fs.id].status).toBe("recovered");
    });

    it("should mark appearance as recovery", () => {
      const fs = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선",
      });

      useForeshadowingStore.getState().addAppearance(fs.id, {
        documentId: "doc-1",
        sectionTitle: "Section 1",
      });

      useForeshadowingStore.getState().markAsRecovered(fs.id, {
        sectionTitle: "Recovered Scene",
        documentId: "doc-1",
      });

      const state = useForeshadowingStore.getState().foreshadowings;
      const lastAppearance =
        state[fs.id].appearances[state[fs.id].appearances.length - 1];
      expect(lastAppearance.isRecovery).toBe(true);
    });
  });

  describe("markAsIgnored", () => {
    it("should mark foreshadowing as ignored", () => {
      const fs = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선",
      });

      useForeshadowingStore.getState().markAsIgnored(fs.id);

      const state = useForeshadowingStore.getState().foreshadowings;
      expect(state[fs.id].status).toBe("ignored");
    });
  });

  describe("addAppearance", () => {
    it("should add appearance to foreshadowing", () => {
      const fs = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선",
      });

      useForeshadowingStore.getState().addAppearance(fs.id, {
        documentId: "doc-1",
        sectionTitle: "Section 1",
      });

      const state = useForeshadowingStore.getState().foreshadowings;
      expect(state[fs.id].appearances).toHaveLength(1);
      expect(state[fs.id].appearances[0].documentId).toBe("doc-1");
      expect(state[fs.id].appearances[0].sectionTitle).toBe("Section 1");
    });

    it("should set isRecovery to false by default", () => {
      const fs = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선",
      });

      useForeshadowingStore.getState().addAppearance(fs.id, {
        documentId: "doc-1",
        sectionTitle: "Section 1",
      });

      const state = useForeshadowingStore.getState().foreshadowings;
      expect(state[fs.id].appearances[0].isRecovery).toBe(false);
    });
  });

  describe("removeAppearance", () => {
    it("should remove appearance from foreshadowing", () => {
      const fs = useForeshadowingStore.getState().createForeshadowing({
        projectId: "project-1",
        tag: "복선",
      });

      useForeshadowingStore.getState().addAppearance(fs.id, {
        documentId: "doc-1",
        sectionTitle: "Section 1",
      });

      useForeshadowingStore.getState().addAppearance(fs.id, {
        documentId: "doc-2",
        sectionTitle: "Section 2",
      });

      useForeshadowingStore.getState().removeAppearance(fs.id, "doc-1");

      const state = useForeshadowingStore.getState().foreshadowings;
      expect(state[fs.id].appearances).toHaveLength(1);
      expect(state[fs.id].appearances[0].documentId).toBe("doc-2");
    });
  });
});
