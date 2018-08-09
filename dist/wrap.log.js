let msg = [];
const C = require('consts');
const RColor = require('rab.color');

const LG = module.exports = {
  tickEnd(cx) {
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
  },
  print(...m) {
    msg.push(...m);
  },
  println(...m) {
    msg.push(...m, '\n');
  },
  p(...m) {
    msg.push(m.map(n => LG.stringify(n)).join('\n'), '\n');
  },
  stringify(m) {
    try {
      return JSON.stringify(m);
    } catch(_e) {
      return String(m);
    }
  },
  chara(c) {
    return LG.bg(C.charaBGs[c.name] || 'inherit',
      LG.color(C.charaColors[c.name] || 'inherit', c.name));
  },
  color(c, m) {
    return `<span style="color:${c}">${m}</span>`;
  },
  bg(c, m) {
    return `<span style="background-color:${c}">${m}</span>`;
  },
  bold(m) {
    return `<b>${m}</b>`;
  },
};
