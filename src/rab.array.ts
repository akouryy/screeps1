import _ from 'lodash';

export function sample<T>(arr: Array<T>): T {
  if(arr.length === 0) throw new Error('empty array');

  return arr[0 | Math.random() * arr.length];
}

export function sampleFixed<T>(arr: Array<T>, str: string): T {
  if(arr.length === 0) throw new Error('empty array');

  let hash = 0;
  for(let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return arr[hash % arr.length];
}

export function cycleGet<T>(arr: Array<T>, idx: number): T {
  if(arr.length === 0) throw new Error('empty array');

  return arr[idx % arr.length];
}

export function balance(
  expected: Array<string | number | undefined> | { [Kx in string]?: number },
  actual: Array<string | number | undefined> | { [Ka in string]?: number }
): string {
  const x = Array.isArray(expected) ?
    _.countBy(expected) :
    expected;
  const a = Array.isArray(actual) ?
    _.countBy(actual) :
    actual;
  return _.min(_.shuffle(Object.keys(x)), k => {
    const xk = x[k];
    return xk ? (a[k] || 0) / xk : 1e30;
  });
}

export function balanceNum(
  expected: Array<number | undefined> | { [Kx in number]?: number },
  actual: Array<number | undefined> | { [Ka in number]?: number }
) {
  return Number(balance(expected, actual));
}

export function mapObj<T, U>(arr: Array<T>, fn: (t: T) => U): U {
  return Object.assign({}, ...arr.map(el => fn(el)));
}
