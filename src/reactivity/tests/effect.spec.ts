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
});
