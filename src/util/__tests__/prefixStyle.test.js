import { prefixStyle } from "../dom";

describe("prefixStyle", () => {
  it("base", () => {
    expect(prefixStyle("transitionEnd")).toBe("webkitTransitionEnd");
  });
});
