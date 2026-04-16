import { describe, it, expect } from "vitest";
import { normalize } from "../../src/lib/normalize.js";

describe("normalize", () => {
  it("remueve acentos", () => {
    expect(normalize("Espadón")).toBe("espadon");
    expect(normalize("Capa Mística")).toBe("capa mistica");
  });
  it("lowercase", () => {
    expect(normalize("CARRYING BAG")).toBe("carrying bag");
  });
  it("trim", () => {
    expect(normalize("  bag  ")).toBe("bag");
  });
  it("maneja ñ y ç", () => {
    expect(normalize("Peñón")).toBe("penon");
    expect(normalize("Façade")).toBe("facade");
  });
  it("string vacío", () => {
    expect(normalize("")).toBe("");
  });
});
