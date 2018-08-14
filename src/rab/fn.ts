export function constFn<T>(v: T) {
  return (..._: Array<any>) => v;
}
