import { describe, it, expect } from "vitest";
import { authService } from "./authService";

describe("authService", () => {
  describe("login", () => {
    it("should return user data on successful login", async () => {
      const result = await authService.login({
        email: "test@example.com",
        password: "password",
      });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.user.email).toBe("test@example.com");
      expect(result.data.user.nickname).toBe("Test User");
    });

    it("should throw error on invalid credentials", async () => {
      await expect(
        authService.login({ email: "wrong@example.com", password: "wrong" }),
      ).rejects.toThrow();
    });
  });

  describe("getMe", () => {
    it("should return current user", async () => {
      const result = await authService.getMe();

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe("test-user-id");
      expect(result.data.email).toBe("test@example.com");
      expect(result.data.nickname).toBe("Test User");
    });
  });
});
