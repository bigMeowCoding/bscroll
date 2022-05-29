import EventEmitter from "../eventEmitter";

describe("eventEmitter", () => {
  it("基本用法", () => {
    const mockFn = jest.fn((a, b) => {
      return a + b;
    });
    const em = new EventEmitter();
    em.on("scroll", mockFn);
    em.trigger("scroll", 1, 2);
    expect(mockFn.mock.calls.length).toBe(1);
    expect(mockFn.mock.calls[0][0]).toBe(1);
    expect(mockFn.mock.calls[0][1]).toBe(2);
    expect(mockFn.mock.results[0].value).toBe(3);
    em.trigger("scroll", 3, 4);
    expect(mockFn.mock.calls.length).toBe(2);
    expect(mockFn.mock.results[1].value).toBe(7);
  });
  it("多个订阅", () => {
    const mockFn1 = jest.fn((a, b) => {
      return a + b;
    });
    const mockFn2 = jest.fn((a, b) => {
      return a * b;
    });
    const em = new EventEmitter();
    em.on("scroll", mockFn1);
    em.on("scroll", mockFn2);
    em.trigger("scroll", 1, 2);
    expect(mockFn1.mock.calls.length).toBe(1);
    expect(mockFn1.mock.calls[0][0]).toBe(1);
    expect(mockFn1.mock.calls[0][1]).toBe(2);
    expect(mockFn1.mock.results[0].value).toBe(3);
    expect(mockFn2.mock.calls.length).toBe(1);
    expect(mockFn2.mock.calls[0][0]).toBe(1);
    expect(mockFn2.mock.calls[0][1]).toBe(2);
    expect(mockFn2.mock.results[0].value).toBe(2);
    em.off("scroll", mockFn1);
    em.trigger("scroll", 3, 4);
    expect(mockFn1.mock.calls.length).toBe(1);
    expect(mockFn2.mock.calls.length).toBe(2);
    expect(mockFn2.mock.results[1].value).toBe(12);
  });
  it("once", () => {
    const mockFn = jest.fn((a, b) => {
      return a + b;
    });
    const em = new EventEmitter();
    em.once("scroll", mockFn);
    em.trigger("scroll", 1, 2);
    expect(mockFn.mock.calls.length).toBe(1);
    expect(mockFn.mock.results[0].value).toBe(3);
    em.trigger("scroll", 1);
    expect(mockFn.mock.calls.length).toBe(1);
  });
});
