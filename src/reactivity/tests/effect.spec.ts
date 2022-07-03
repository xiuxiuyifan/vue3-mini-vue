import { reactive } from "../reactive";
import { effect, stop } from "../effect";
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

  it("scheduler", () => {
    // 功能的描述

    // 1. 通过 effect 的第二个对象参数，传入一个 scheduler 函数
    // 2. effect 第一次执行的时候 还是会执行 fn 函数
    // 3. 当响应式对象 set 的时候不会 执行 fn 而是执行 scheduler 函数
    // 4. 在执行 scheduler 函数的时候，我们记录一下 runner , 并调用 runner 函数，那么 fn 函数会再次执行的。

    let dummy: any;
    let run: any;
    const scheduler = jest.fn(() => {
      run = runner;
    });

    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        scheduler,
      }
    );

    // 第一次执行 fn 的时候 scheduler 不会执行
    expect(scheduler).not.toHaveBeenCalled();
    // 第一次调用的时候 fn 会执行
    expect(dummy).toBe(1);

    // 当调用 set 的时候， 触发的是 scheduler 函数的执行
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);

    expect(dummy).toBe(1);

    // manually run
    run();
    expect(dummy).toBe(2);

    // 如何实现呢？

    // 首先给 effect 添加第二个参数
    // 其次 当响应式数据 set 的时候，检测如果有scheduler 则执行 scheduler 函数， 不再触发更新
  });

  it("stop", () => {
    let dummy: any;

    const obj = reactive({ foo: 1 });

    const runner = effect(() => {
      dummy = obj.foo;
    });
    obj.foo = 2;

    expect(dummy).toBe(2);

    stop(runner);

    obj.foo = 3;
    expect(dummy).toBe(2);
  });

  // 调用stop 之后的回调函数
  it("onStop", () => {
    const obj = reactive({ foo: 1 });
    const onStop = jest.fn();

    let dummy: any;
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      {
        onStop,
      }
    );

    stop(runner);

    // 判断 onStop 是否被调用？

    expect(onStop).toBeCalledTimes(1);
  });

  it("enhanced stop", () => {
    let dummy: any;
    const obj = reactive({ foo: 1 });
    const runner = effect(() => {
      dummy = obj.foo;
    });

    stop(runner);
    obj.foo++;
    expect(dummy).toBe(1);
  });
});
