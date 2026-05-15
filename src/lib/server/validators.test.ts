import { describe, expect, it } from "vitest";
import {
  loginSchema,
  parseBodyOrThrow,
  registerSchema,
  saveUserContactSchema,
} from "@/lib/server/validators";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({ username: "user1", password: "secret" });
    expect(result.success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = loginSchema.safeParse({ username: "", password: "secret" });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      username: "user1",
      email: "user1@example.com",
      password: "password1",
      confirmPassword: "password2",
    });
    expect(result.success).toBe(false);
  });
});

describe("saveUserContactSchema", () => {
  it("requires fullName for personal owner contact", () => {
    const result = saveUserContactSchema.safeParse({
      contactType: "owner",
      contactMode: "personal",
    });
    expect(result.success).toBe(false);
  });

  it("requires company fields for company owner contact", () => {
    const result = saveUserContactSchema.safeParse({
      contactType: "owner",
      contactMode: "company",
      fullName: "ACME",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid personal owner contact", () => {
    const result = saveUserContactSchema.safeParse({
      contactType: "owner",
      contactMode: "personal",
      fullName: "Nguyen Van A",
    });
    expect(result.success).toBe(true);
  });
});

describe("parseBodyOrThrow", () => {
  it("throws readable error for invalid payload", () => {
    expect(() => parseBodyOrThrow(loginSchema, { username: "", password: "" })).toThrow();
  });
});
