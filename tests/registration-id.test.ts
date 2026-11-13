import { describe, it, expect } from "vitest";
import { generateRegistrationId } from "@/lib/event-config";

describe("Collision-Resistant Registration ID Generator", () => {
  it("generates ID with CHAD prefix and correct character set", () => {
    const id = generateRegistrationId("CHAD");
    expect(id).toMatch(/^CHAD-[A-Z0-9]{6}$/);
  });

  it("generates unique IDs over a batch", () => {
    const set = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const id = generateRegistrationId("CHAD");
      expect(set.has(id)).toBe(false);
      set.add(id);
    }
    expect(set.size).toBe(500);
  });
});
