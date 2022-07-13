import { isRef, proxyRefs, ref, unRef } from "../ref";
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

  it("isRef", () => {
    const foo = ref(1);
    expect(isRef(20)).toBe(false);
    expect(isRef(foo)).toBe(true);
  });

  it("unRef", () => {
    const foo = ref(1);
    expect(unRef(foo)).toBe(1);
    expect(unRef(1)).toBe(1);
  });

  it("proxyRefs", () => {
    const user = {
      age: ref(10),
      name: "张三",
    };

    const proxyUser = proxyRefs(user);

    expect(user.age.value).toBe(10);
    // 如果是 ref 则会自动的返回 ref 的 value
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe("张三");

    // 设置值，也分两种情况

    // 设置的值不是 ref

    proxyUser.age = 20;

    expect(proxyUser.age).toBe(20);
    expect(user.age.value).toBe(20);
    // 设置的是 ref

    proxyUser.age = ref(30);
    expect(proxyUser.age).toBe(30);
    expect(user.age.value).toBe(30);
  });
});
