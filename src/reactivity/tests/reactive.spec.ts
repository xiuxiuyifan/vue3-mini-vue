import { reactive, readonly } from "../reactive";

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
});
