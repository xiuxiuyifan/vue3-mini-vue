import { computed } from "../computed";
import { reactive } from "../reactive";
describe("computed", () => {
  it("happy path", () => {
    const user = reactive({
      age: 1,
    });

    const age = computed(() => {
      return user.age;
    });

    expect(age.value).toBe(1);
  });

  it("should computed lazily", () => {
    // 在没访问.value 之前， getter函数是不会被调用的

    const user = reactive({
      age: 1,
    });

    const getter = jest.fn(() => {
      return user.age;
    });

    const value = computed(getter);

    // lazy 延迟执行
    expect(getter).not.toHaveBeenCalled();

    // 访问.value属性，触发 getter函数执行
    expect(value.value).toBe(1);
    expect(getter).toBeCalledTimes(1);

    // 重新赋值， getter 函数还是值调用一次
    user.age = 2;
    expect(getter).toBeCalledTimes(1);

    // 访问 .value 属性
    expect(value.value).toBe(2);
    expect(getter).toBeCalledTimes(2);

    // 测试缓存 效果

    value.value;
    expect(getter).toBeCalledTimes(2);
  });
});
