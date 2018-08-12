import _ from 'lodash';
import * as C from 'consts';
import { Context } from 'context_calc';
import * as R from 'rab';
import { ErrorMapper } from 'utils/ErrorMapper';

let msg = Array<string>();

export function tickEnd(cx: Context) {
  if(cx.flags.debug) {
    console.log(bg('#000', color('#fff',
      `[${
        color('#6f0', Game.time )
      }=${
        color('#9f6', '0b' + Game.time.toString(2) )
      }] cpu=${
        Game.cpu.getUsed()
      }${
        ' '.repeat(300)
      }\n` +
      msg.join('')
    )));
    msg = [];
  }
}

export function print(...m: Array<any>) {
  msg.push(...m);
}

export function println(...m: Array<any>) {
  msg.push(...m, '\n');
}

export function p(...m: Array<any>) {
  msg.push(m.map(n => stringify(n)).join('\n'), '\n');
}

export function stringify(m: any): string {
  try {
    return JSON.stringify(m);
  } catch(_e) {
    return String(m);
  }
}

export function color(c: string, m: any): string {
  return `<span style="color:${c}">${m}</span>`;
}

export function bg(c: string, m: any): string {
  return `<span style="background-color:${c}">${m}</span>`;
}

export function bold(m: any): string {
  return `<b>${m}</b>`;
}

export function safely<T>(f: () => T): T | undefined {
  try {
    return f(); //ErrorMapper.wrap(f)();
  } catch(err) {
    console.log(color('red', `${err}\n${err.stack}`));
    return;
  }
}
