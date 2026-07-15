import { describe, expect, it } from "vitest";
import { normaliseSourceCode, parseSourceExclusions, sourceIsEnabled } from "./source-selection";

describe("global source book selection", () => {
  it("normalises source codes consistently", () => {
    expect(normaliseSourceCode(" crb ")).toBe("CRB");
    expect(normaliseSourceCode("")).toBe("CRB");
  });

  it("recovers a unique exclusion list from persistent browser state", () => {
    expect(parseSourceExclusions('["crb", " CRB ", "run-faster"]')).toEqual(["CRB", "RUN-FASTER"]);
    expect(parseSourceExclusions("not-json")).toEqual([]);
    expect(parseSourceExclusions('{"CRB":true}')).toEqual([]);
  });

  it("filters only explicitly excluded sources", () => {
    expect(sourceIsEnabled("CRB", ["RUN-FASTER"])).toBe(true);
    expect(sourceIsEnabled("crb", ["CRB"])).toBe(false);
    expect(sourceIsEnabled("new-source", [])).toBe(true);
  });
});
