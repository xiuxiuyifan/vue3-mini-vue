import { ref } from "../ref";
import { effect } from "../effect";

describe("ref", () => {
  it("should create a ref", () => {
    const foo = ref(1);
    expect(foo.value).toBe(1);
  });

  it("ref can effect", () => {
    const foo = ref(1);

    let dummy = 0;

    effect(() => {
      dummy = foo.value;
    });

    expect(dummy).toBe(1);
    foo.value = 2;
    expect(dummy).toBe(2);

    foo.value = 2;

    expect(dummy).toBe(2);
  });

  it("should support properties reactive", () => {
    const foo = ref({
      bar: 1,
    });

    let dummy = 0;

    effect(() => {
      dummy = foo.value.bar;
    });

    expect(dummy).toBe(1);
    foo.value.bar = 2;
    expect(dummy).toBe(2);

    foo.value.bar = 2;

    expect(dummy).toBe(2);
  });
});
