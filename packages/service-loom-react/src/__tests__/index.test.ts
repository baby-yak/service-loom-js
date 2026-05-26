import { describe, it, expect } from "vitest";
import { hello } from "../index.js";
import { hello as coreHello } from "@baby-yak/service-loom-js";

describe("service-loom-react", () => {
  it("exports hello", () => {
    expect(hello).toBeTypeOf("string");
  });

  it("can import from service-loom-js", () => {
    expect(coreHello).toBeTypeOf("string");
  });
});
