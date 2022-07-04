import { isReactive, reactive, readonly, isReadonly } from "../reactive";

describe("reactive", () => {
  it("Object", () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    expect(observed).not.toBe(original);

    // get
    expect(observed.foo).toBe(1);

    // has
    expect("foo" in observed).toBe(true);

    // ownKeys
    expect(Object.keys(observed)).toEqual(["foo"]);
  });

  it("readonly", () => {
    let original = { foo: 1 };
    console.warn = jest.fn();
    const obj = readonly(original);

    expect(obj).not.toBe(original);
    expect(obj.foo).toBe(1);

    // set
    obj.foo = 2;
    expect(console.warn).toBeCalled();
  });

  it("test isReactive", () => {
    const original = { foo: 1 };
    const obj = reactive(original);

    expect(original).not.toBe(obj);
    expect(obj.foo).toBe(1);
    expect(isReactive(original)).toBe(false);
    expect(isReactive(obj)).toBe(true);
  });

  it("test isReadonly", () => {
    const original = { foo: 1 };
    const obj = readonly(original);

    expect(original).not.toBe(obj);
    expect(obj.foo).toBe(1);
    expect(isReadonly(obj)).toBe(true);
    expect(isReadonly(original)).toBe(false);
  });

  it("deep reactive", () => {
    const original = {
      foo: {
        bar: 1,
      },
      array: [{ bar: 2 }],
    };
    const obj = reactive(original);

    // 检测里面的 对象是不是一个 reactive对象
    expect(isReactive(obj.foo)).toBe(true);

    expect(isReactive(obj.array)).toBe(true);

    expect(isReactive(obj.array[0])).toBe(true);
  });

  it("deep readonly", () => {
    const original = {
      foo: {
        bar: 1,
      },
      array: [
        {
          var: 10,
        },
      ],
    };

    let obj = readonly(original);

    expect(isReadonly(obj.foo)).toBe(true);

    expect(isReadonly(obj.array)).toBe(true);

    expect(isReadonly(obj.array[0])).toBe(true);
  });
});
