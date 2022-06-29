import { reactive } from "../reactive";
import { effect } from "../effect";
describe("effect", () => {
  it("should observed basic properties", () => {
    let dummy: any;
    const counter = reactive({ num: 0 });

    // init setup
    effect(() => {
      dummy = counter.num;
    });
    expect(dummy).toBe(0);

    // update
    counter.num = 10;
    expect(dummy).toBe(10);
  });

  it("effect has return runner function", () => {
    let foo = 10;
    const runner = effect(() => {
      foo++;
      return "foo";
    });

    // 第一次执行
    expect(foo).toBe(11);

    // 验证 runner
    const r = runner();
    expect(foo).toBe(12);
    expect(r).toBe("foo");
  });
});
