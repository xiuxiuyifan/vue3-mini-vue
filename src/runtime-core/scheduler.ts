// 接受一个个任务，将其加入到队列里面
const queue: any[] = [];

const p = Promise.resolve();

let isFlushPending = false;

// 在 promise 的 then 里面添加要刷新的任务。
export function nextTick(fn) {
  return fn ? p.then(fn) : p;
}

export function queueJobs(job) {
  // 同步产生的 任务回一直往 队列里面加
  if (!queue.includes(job)) {
    queue.push(job);
  }

  // 然后刷新任务队列
  queueFlush();
}

function queueFlush() {
  // 让刷新的代码值执行一次。
  if (isFlushPending) return;
  isFlushPending = true;

  nextTick(flushJobs);
}

function flushJobs() {
  // 真正异步刷新的时候，再将 标示位置 为 true
  isFlushPending = false;
  let job;
  while ((job = queue.shift())) {
    job && job();
  }
}
