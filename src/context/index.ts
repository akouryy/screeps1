import _ from 'lodash';
import * as C from 'consts';
import * as R from 'rab';
import * as Charas from 'wrap.chara';
import * as LG from 'wrap.log';
import { isCharaNormal, isCharaDropper } from 'chara/born';
import { RoomContext, calcRoomContext } from 'context/room';
import { WithdrawTarget, SourceLike, SpawnLike, WorkBalance, SourceBalance, Flags } from 'context/types';
import * as Rooms from 'room/find';

export { RoomContext } from 'context/room';
export * from 'context/types';

const preLog = LG.color('#ccf', ' [cx]       ');

export interface Context {
  damagedContainers: Array<Array<StructureContainer>>;
  damagedRamparts: Array<Array<StructureRampart>>;
  damagedRoads: Array<Array<StructureRoad>>;
  damagedWalls: Array<Array<StructureWall>>;
  flags: Flags;
  rooms: Array<Room>;
  r: { [RoomName in string]?: RoomContext };
  towers: Array<Array<StructureTower>>;
};

function flg(n: string): boolean {
  return Game.flags[n] && Game.flags[n].color !== COLOR_WHITE;
}

export function calc(): Context {
  const spawningCreepNames = Game.spawns.pyon.spawning ? [Game.spawns.pyon.spawning.name] : [];

  const rooms = Object.values(Game.rooms);

  const towers = rooms.map(r => Rooms.findStructure(r, [STRUCTURE_TOWER]));
  const damagedWalls = rooms.map(r => _.sortBy(
    Rooms.findStructure(r, [STRUCTURE_WALL], w => w.hits <= w.hitsMax - TOWER_POWER_REPAIR),
    w => w.hits / w.hitsMax
  ));
  const damagedRamparts = rooms.map(r => _.sortBy(
    Rooms.findStructure(r, [STRUCTURE_RAMPART], r => r.hits <= r.hitsMax - TOWER_POWER_REPAIR),
    r => r.hits / r.hitsMax)
  );
  const damagedRoads = rooms.map(r => _.sortBy(
    Rooms.findStructure(r, [STRUCTURE_ROAD], r => r.hits <= r.hitsMax - TOWER_POWER_REPAIR),
    r => r.hits / r.hitsMax)
  );
  const damagedContainers = rooms.map(r => _.sortBy(
    Rooms.findStructure(r, [STRUCTURE_CONTAINER], c => c.hits <= c.hitsMax - TOWER_POWER_REPAIR),
    c => c.hits / c.hitsMax)
  );

  const roomSpecific = R.a.mapObj(rooms, (room: Room): { [RN in string]?: RoomContext } => ({
    [room.name]: calcRoomContext(room),
  }));

  return {
    damagedContainers,
    damagedRamparts,
    damagedRoads,
    damagedWalls,
    flags: {
      debug: flg('_DEBUG'),
      testThrow: flg('_TEST_THROW'),
      shouldPickup: flg('_STOPSPAWN'),
      stopSpawn: flg('_PICKUP'),
    },
    rooms,
    r: roomSpecific,
    towers,
  };
}

export function log(cx: Context) {
  for(const room of cx.rooms) {
    const cxr = cx.r[room.name];
    if(cxr === undefined) continue;

    LG.println(
      preLog,
      `${room.name}.charas[${cxr.charas.length}/${_.keys(Game.creeps).length}]: `,
      cxr.charas.map((c: Charas.Chara) =>
        LG.safely(() => {
          const commonStr = `${
            Charas.logFormat(c)
          }.${
            c.memory.born
          }`;

          if(isCharaNormal(c)) {
            const state = c.memory.normalCharaState;
            return `${commonStr}.${state}.${
              state === C.NormalCharaStates.GAIN_SRC ?
                c.memory.normalCharaSourceID && c.memory.normalCharaSourceID.substr(-3) :
              state === C.NormalCharaStates.WORK_BUILD ?
                c.memory.normalCharaWorkBuildTargetID && c.memory.normalCharaWorkBuildTargetID.substr(-3):
              state === C.NormalCharaStates.WORK_SPAWN ?
                c.memory.normalCharaWorkSpawnSpawnExID && c.memory.normalCharaWorkSpawnSpawnExID.substr(-3):
                null
            }`;
          } else if(isCharaDropper(c)) {
            return `${commonStr}.${c.memory.eneID.substr(-3)}`;
          } else {
            return commonStr;
          }
        })
      ).join('; ')
    );
    if(cxr.attacked) {
      LG.println(
        preLog,
        '!!! UNDER ATTACK !!!',
      );
    }
    if((Game.time & 15) === 1) {
      LG.println(
        preLog,
        `${room.name}.creeps[].part: `,
        cxr.charas.map(c =>
          `${
            c.name
          }:${
            c.body.map(p => p.type[0]).join('')
          }`
        ).join(', '),
      );
    }
    if((Game.time & 7) === 2) {
      LG.println(
        preLog,
        `${room.name}.workBalance: `,
        _.map(cxr.workBalance, (v, k) => `${k}: ${v}`).join(', '),
      );
    }
  }
  if((Game.time & 15) === 3) {
    LG.println(
      preLog,
      'flags: ',
      Array<keyof Flags>('debug', 'stopSpawn', 'shouldPickup')
        .map(f => `${f}=${cx.flags[f]}`).join(', '),
    );
  }
  if(cx.flags.testThrow) throw new Error('TEST');
}
