import _ from 'lodash';
import * as C from 'consts';
import * as R from 'rab';
import * as LG from 'wrap.log';
import { Context, RoomSpecificContext } from 'context_calc';
import { Chara, isChara } from 'wrap.chara';

const dx: {
  [d in DirectionConstant]: -1 | 0 | 1;
} = {
  [TOP_LEFT]: -1,
  [LEFT]: -1,
  [BOTTOM_LEFT]: -1,
  [TOP]: 0,
  [BOTTOM]: 0,
  [TOP_RIGHT]: 1,
  [RIGHT]: 1,
  [BOTTOM_RIGHT]: 1,
};
const dy: {
  [d in DirectionConstant]: -1 | 0 | 1;
} = {
  [TOP_LEFT]: -1,
  [TOP]: -1,
  [TOP_RIGHT]: -1,
  [LEFT]: 0,
  [RIGHT]: 0,
  [BOTTOM_LEFT]: 1,
  [BOTTOM]: 1,
  [BOTTOM_RIGHT]: 1,
};
const reversedDir: {
  [d in DirectionConstant]: DirectionConstant;
} = {
  [TOP]: BOTTOM,
  [TOP_RIGHT]: BOTTOM_LEFT,
  [RIGHT]: LEFT,
  [BOTTOM_RIGHT]: TOP_LEFT,
  [BOTTOM]: TOP,
  [BOTTOM_LEFT]: TOP_RIGHT,
  [LEFT]: RIGHT,
  [TOP_LEFT]: BOTTOM_RIGHT,
};

export function addDir(rpos: RoomPosition, dir: DirectionConstant) {
  return new RoomPosition(rpos.x + dx[dir], rpos.y + dy[dir], rpos.roomName);
}

let posToCName: { [s in string]: C.CharaName } = {};
let charaMoves: { [s in C.CharaName]?: DirectionConstant } = {};
let shouldStayBlocking: { [s in C.CharaName]?: boolean } = {};

export function tickBegin(cx: Context) {
  posToCName = {};
  charaMoves = {};
  shouldStayBlocking = {};

  _.forEach(cx.r, (cxr: RoomSpecificContext | undefined, roomName: string) => {
    if(!cxr) return;
    LG.safely(() => {
      _.forEach(cxr.myCharas, (cr: Chara) => {
        posToCName[cr.pos.toString()] = cr.name;
      });
    });
  });
}

export function tickEnd(cx: Context) {
  _.forEach(_.cloneDeep(charaMoves), ((dir, charaName) => {
    LG.safely(() => {
      const chara = Game.creeps[charaName];
      if(!chara || !dir) return;
      const nextPos = addDir(chara.pos, dir);
      const blockingCharaName = posToCName[nextPos.toString()];
      if(!blockingCharaName) return;
      const blockingChara = Game.creeps[blockingCharaName];
      if(!blockingChara || !isChara(blockingChara)) return;
      if(charaMoves[blockingCharaName] || shouldStayBlocking[blockingCharaName]) return;

      registerMove(cx, blockingChara, reversedDir[dir]);
    });
  }));

  _.forEach(charaMoves, (dir, charaName) => {
    LG.safely(() => {
      if(!dir) return;
      Game.creeps[charaName].move(dir);
    });
  });
}

export function blockOthersMove(cx: Context, chara: Chara) {
  shouldStayBlocking[chara.name] = true;
}

export function registerMove(cx: Context, chara: Chara, dir: DirectionConstant, _visualizedPath?: Array<RoomPosition>) {
  LG.safely(() => {
    charaMoves[chara.name] = dir;

    const visualizedPath = _visualizedPath || [chara.pos, addDir(chara.pos, dir)];
    chara.room.visual.poly(visualizedPath,
      { stroke: C.charaColors[chara.name], opacity: 1 }
    );
  });
}

export function registerMoveTo(cx: Context, chara: Chara, target: RoomPosition | _HasRoomPosition,
  moveToOptions: FindPathOpts = {}
) {
  if(moveToOptions.ignoreCreeps === undefined) moveToOptions.ignoreCreeps = true;

  const path = chara.pos.findPathTo(target, moveToOptions);
  const nextMove = path[0];
  if(!nextMove) return;
  registerMove(cx, chara, nextMove.direction, path.map(a => new RoomPosition(a.x, a.y, chara.room.name)));
}
