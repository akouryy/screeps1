import * as C from 'consts';
import * as RColor from 'rab.color';

let msg = [];

export function tickEnd(cx) {
  if(cx.debug) {
    console.log(LG.bg('#000', LG.color('#fff',
      `[${
        LG.color('#6f0', Game.time )
      }=${
        LG.color('#9f6', '0b' + Game.time.toString(2) )
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

export function print(...m) {
  msg.push(...m);
}

export function println(...m) {
  msg.push(...m, '\n');
}

export function p(...m) {
  msg.push(m.map(n => LG.stringify(n)).join('\n'), '\n');
}

export function stringify(m) {
  try {
    return JSON.stringify(m);
  } catch(_e) {
    return String(m);
  }
}

export function chara(c) {
  return LG.bg(C.charaBGs[c.name] || 'inherit',
    LG.color(C.charaColors[c.name] || 'inherit', c.name));
}

export function color(c, m) {
  return `<span style="color:${c}">${m}</span>`;
}

export function bg(c, m) {
  return `<span style="background-color:${c}">${m}</span>`;
}

export function bold(m) {
  return `<b>${m}</b>`;
}
