import { describe, it, expect } from "vitest";
import {
  characterService,
  type CreateCharacterInput,
} from "./characterService";

describe("characterService", () => {
  describe("getAll", () => {
    it("should fetch all characters for a project", async () => {
      const result = await characterService.getAll("project-1");

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it("should return characters with correct structure", async () => {
      const result = await characterService.getAll("project-1");

      expect(result.data).toBeDefined();
      if (result.data && result.data.length > 0) {
        const character = result.data[0];
        expect(character).toHaveProperty("id");
        expect(character).toHaveProperty("name");
        expect(character).toHaveProperty("createdAt");
      }
    });
  });

  describe("getById", () => {
    it("should fetch a single character", async () => {
      const result = await characterService.getById("char-1");

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe("char-1");
    });

    it("should return character with all fields", async () => {
      const result = await characterService.getById("char-1");

      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data).toHaveProperty("name");
        expect(result.data).toHaveProperty("extras");
        expect(result.data).toHaveProperty("createdAt");
        expect(result.data).toHaveProperty("updatedAt");
      }
    });
  });

  describe("create", () => {
    it("should create a new character", async () => {
      const payload: CreateCharacterInput = {
        name: "새캐릭터",
      };

      const result = await characterService.create("project-1", payload);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("should create character with role and extras", async () => {
      const payload: CreateCharacterInput = {
        name: "주인공",
        role: "protagonist",
        extras: {
          age: 25,
          occupation: "탐정",
        },
      };

      const result = await characterService.create("project-1", payload);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("update", () => {
    it("should update character name", async () => {
      const result = await characterService.update("char-1", {
        name: "Updated Name",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it("should update multiple fields", async () => {
      const result = await characterService.update("char-1", {
        name: "Updated Name",
        extras: {
          age: 30,
        },
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });
  });

  describe("delete", () => {
    it("should delete a character", async () => {
      const result = await characterService.delete("char-1");

      expect(result).toBeDefined();
    });
  });

  describe("regenerateImage", () => {
    it("should trigger image regeneration job", async () => {
      const result = await characterService.regenerateImage("char-1");

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      if (result.data) {
        expect(result.data).toHaveProperty("jobId");
      }
    });
  });
});
