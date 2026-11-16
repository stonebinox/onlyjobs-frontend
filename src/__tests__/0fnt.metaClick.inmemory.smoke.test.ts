/** Smoke test - onlyjobs-0fnt G2: metaClick in-memory fallback when localStorage and cookies throw. */
it("returns the captured click when both localStorage and cookies throw", () => {
  let m!: typeof import("../utils/metaClick");
  jest.isolateModules(() => {
    m = require("../utils/metaClick");
  });
  window.history.pushState({}, "", "/?fbclid=MemClick1");
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  jest.spyOn(document, "cookie", "get").mockImplementation(() => {
    throw new Error("blocked");
  });
  jest.spyOn(document, "cookie", "set").mockImplementation(() => {
    throw new Error("blocked");
  });
  m.captureMetaClick();
  window.history.pushState({}, "", "/");
  expect(m.getMetaClickPayload()?.fbclid).toBe("MemClick1");
  jest.restoreAllMocks();
});
