import { describe, it, expect } from "vitest";
import {
  foreshadowingService,
  type CreateForeshadowingInput,
} from "./foreshadowingService";

describe("foreshadowingService", () => {
  describe("getAll", () => {
    it("should fetch all foreshadowing for a project", async () => {
      const result = await foreshadowingService.getAll("project-1");

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should fetch with status filter", async () => {
      const result = await foreshadowingService.getAll("project-1", {
        status: "pending",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("should fetch with importance filter", async () => {
      const result = await foreshadowingService.getAll("project-1", {
        importance: "major",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("getUnresolved", () => {
    it("should fetch unresolved foreshadowing", async () => {
      const result = await foreshadowingService.getUnresolved("project-1");

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe("getById", () => {
    it("should fetch a single foreshadowing", async () => {
      const result = await foreshadowingService.getById("foreshadow-1");

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe("foreshadow-1");
    });

    it("should return foreshadowing with all fields", async () => {
      const result = await foreshadowingService.getById("foreshadow-1");

      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data).toHaveProperty("tag");
        expect(result.data).toHaveProperty("status");
        expect(result.data).toHaveProperty("appearances");
        expect(result.data).toHaveProperty("createdAt");
        expect(result.data).toHaveProperty("updatedAt");
      }
    });
  });

  describe("create", () => {
    it("should create a new foreshadowing", async () => {
      const payload: CreateForeshadowingInput = {
        tag: "새_복선",
      };

      const result = await foreshadowingService.create("project-1", payload);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("should create foreshadowing with description and importance", async () => {
      const payload: CreateForeshadowingInput = {
        tag: "중요_복선",
        description: "This is an important foreshadowing",
        importance: "major",
      };

      const result = await foreshadowingService.create("project-1", payload);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update foreshadowing tag", async () => {
      const result = await foreshadowingService.update("foreshadow-1", {
        tag: "Updated Tag",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("should update status", async () => {
      const result = await foreshadowingService.update("foreshadow-1", {
        status: "recovered",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("should update multiple fields", async () => {
      const result = await foreshadowingService.update("foreshadow-1", {
        tag: "Updated Tag",
        description: "Updated description",
        importance: "minor",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("delete", () => {
    it("should delete a foreshadowing", async () => {
      const result = await foreshadowingService.delete("foreshadow-1");

      expect(result).toBeDefined();
    });
  });

  describe("addAppearance", () => {
    it("should add appearance to foreshadowing", async () => {
      const appearance = {
        chapterId: "chapter-1",
        chapterTitle: "Chapter 1",
        line: 42,
        context: "Test context",
      };

      const result = await foreshadowingService.addAppearance(
        "foreshadow-1",
        appearance,
      );

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("recover", () => {
    it("should mark foreshadowing as recovered", async () => {
      const recoveryInfo = {
        chapterId: "chapter-5",
        chapterTitle: "Chapter 5",
        line: 100,
        context: "Recovery context",
      };

      const result = await foreshadowingService.recover(
        "foreshadow-1",
        recoveryInfo,
      );

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data.status).toBe("recovered");
      }
    });
  });
});
