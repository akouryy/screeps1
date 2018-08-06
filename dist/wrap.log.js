let msg = [];
const C = require('consts');
const RColor = require('rab.color');

const LG = module.exports = {
  tickEnd(cx) {
    if(cx.debug) {
      console.log(LG.bg('#000', LG.color('#fff',
        `[${
          LG.color('#6f0', Game.time )
        }=0b${
          Game.time.toString(2)
        }]${
          ' '.repeat(300)
        }\n` +
        msg.join('')
      )));
      msg = [];
    }
  },
  print(...m) {
    msg.push(m.join(''));
  },
  println(...m) {
    m.push('\n');
    msg.push(m.join(''));
  },
  puts(...m) {
    m.push('');
    msg.push(...m);
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
