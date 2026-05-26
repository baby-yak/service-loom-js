import { describe, it, expect } from "vitest";
import { hello } from "../index.js";

describe("service-loom-js", () => {
  it("exports hello", () => {
    expect(hello).toBeTypeOf("string");
  });
});
