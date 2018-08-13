import _ from 'lodash';
import * as C from 'consts';
import { Context } from 'context_calc';
import * as R from 'rab';
import * as Charas from 'wrap.chara';
import * as LG from 'wrap.log';
import { isCharaNormal } from 'chara/born';

const preLog = LG.color('#ccf', ' [cx]       ');

export type WithdrawTarget =  Tombstone | StructureContainer;
export type SourceLike = Source | WithdrawTarget;
export type SpawnLike = StructureSpawn | StructureExtension;
export type SourceBalance = { [SourceID in string]?: number };
export type WorkBalance = { [Work in number]: number };
export type Flags = {
  debug: boolean;
  testThrow: boolean;
  shouldPickup: boolean;
  stopSpawn: boolean;
}

export interface RoomSpecificContext {
  attacked: boolean;
  attackers: Array<Creep>;
  constructionSites: Array<ConstructionSite>;
  creeps: Array<Creep>;
  myCharas: Array<Charas.Chara>;
  room: Room;
  sources: Array<Source>;
  sourcesBalance: SourceBalance;
  sourceLikes: Array<SourceLike>;
  spawnsUnfilled: Array<SpawnLike>;
  withdrawTargets: Array<WithdrawTarget>;
  workBalance: WorkBalance;
}

export interface Context {
  damagedContainers: Array<Array<StructureContainer>>;
  damagedRamparts: Array<Array<StructureRampart>>;
  damagedRoads: Array<Array<StructureRoad>>;
  damagedWalls: Array<Array<StructureWall>>;
  flags: Flags;
  rooms: Array<Room>;
  r: { [RoomName in string]?: RoomSpecificContext };
  towers: Array<Array<StructureTower>>;
};

function flg(n: string): boolean {
  return Game.flags[n] && Game.flags[n].color !== COLOR_WHITE;
}

export function calc(): Context {
  const spawningCreepNames = Game.spawns.pyon.spawning ? [Game.spawns.pyon.spawning.name] : [];

  const rooms = Object.values(Game.rooms);

  const towers = rooms.map(r => r.find(FIND_MY_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_TOWER
  }) as Array<StructureTower>);
  const damagedWalls = rooms.map(r =>
    _.sortBy(r.find(FIND_STRUCTURES, {
      filter: ds =>
        ds.structureType === STRUCTURE_WALL && ds.hits < ds.hitsMax,
    }) as Array<StructureWall>, ds => ds.hits / ds.hitsMax)
  );
  const damagedRamparts = rooms.map(r =>
    _.sortBy(r.find(FIND_STRUCTURES, {
      filter: ds =>
        ds.structureType === STRUCTURE_RAMPART && ds.hits < ds.hitsMax,
    }) as Array<StructureRampart>, ds => ds.hits / ds.hitsMax)
  );
  const damagedRoads = rooms.map(r =>
    _.sortBy(r.find(FIND_STRUCTURES, {
      filter: ds =>
        ds.structureType === STRUCTURE_ROAD && ds.hits < ds.hitsMax,
    }) as Array<StructureRoad>, ds => ds.hits / ds.hitsMax)
  );
  const damagedContainers = rooms.map(r =>
    _.sortBy(r.find(FIND_STRUCTURES, {
      filter: ds =>
        ds.structureType === STRUCTURE_CONTAINER && ds.hits < ds.hitsMax,
    }) as Array<StructureContainer>, ds => ds.hits / ds.hitsMax)
  );

  const roomSpecific = R.a.mapObj(rooms, (room: Room): { [RN in string]?: RoomSpecificContext } => {
    const creeps: Array<Creep> = room.find(FIND_MY_CREEPS);
    const myCharas: Array<Charas.Chara> = creeps.filter(Charas.isChara, Charas);

    const attackers = room.find(FIND_HOSTILE_CREEPS, {
      filter: c =>
        c.getActiveBodyparts(ATTACK) + c.getActiveBodyparts(RANGED_ATTACK) > 0
    });
    const attacked = attackers.length > 0;
    LG.safely(() => {
      if(attacked) {
        room.memory.attackedLog = room.memory.attackedLog || {};
        attackers.forEach(a => {
          room.memory.attackedLog[a.owner.username] =
            (room.memory.attackedLog[a.owner.username] || 0) + 1;
        });
      }
    });

    const sources = room.find(FIND_SOURCES) as Array<Source>;
    const withdrawTargets = _.shuffle(Array<WithdrawTarget>().concat(
      room.find(FIND_TOMBSTONES, { filter: s =>
        s.store[RESOURCE_ENERGY] > 20
      }) as Array<Tombstone>,
      room.find(FIND_STRUCTURES, { filter: s =>
        s.structureType === STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0
      }) as Array<StructureContainer>,
    ));
    const sourceLikes = _.shuffle(Array<SourceLike>().concat(withdrawTargets, sources));
    const cSites = room.find(FIND_CONSTRUCTION_SITES);

    const spawnsUnfilled = room.find(FIND_STRUCTURES, {
      filter: (structure: Structure) =>
        [STRUCTURE_EXTENSION as StructureConstant, STRUCTURE_SPAWN].includes(structure.structureType) &&
          (structure as SpawnLike).energy < (structure as SpawnLike).energyCapacity,
    }) as Array<SpawnLike>;

    const workBalance: WorkBalance = {
      [C.NormalCharaStates.WORK_SPAWN]:
        spawnsUnfilled.length === 0 ? 0 :
        creeps.length > 11 ? 0 : creeps.length > 7 ? 2 : 5,
      [C.NormalCharaStates.WORK_UP]: attacked ? 3 : 4,
      [C.NormalCharaStates.WORK_TOWER]: attacked ? 5 : 4,
      [C.NormalCharaStates.WORK_BUILD]:
        cSites.length > 10 && !attacked ? 2 :
        creeps.length > 5 && cSites.length > 0 && !attacked ? 1 :
        0,
    };

    const sourcesBalance: SourceBalance =
      sources.length >= 2 ?
      {
        [sources[0].id]: sources[0].energy > 0 || sources[0].ticksToRegeneration <= 30 ? 8 : 0.01,
        [sources[1].id]: sources[1].energy > 0 || sources[1].ticksToRegeneration <= 30 ? 4 : 0.01,
      } :
      sources.length >= 1 ?
      {
        [sources[0].id]: sources[0].energy > 0 || sources[0].ticksToRegeneration <= 30 ? 8 : 0.01,
      } :
      {};

    return { [room.name]: {
      attacked,
      attackers,
      constructionSites: cSites,
      creeps,
      myCharas,
      room,
      sources,
      sourcesBalance,
      sourceLikes,
      spawnsUnfilled,
      withdrawTargets,
      workBalance,
    } };
  });

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
      `${room.name}.charas[${cxr.myCharas.length}/${cxr.creeps.length}]: `,
      cxr.myCharas.map((c: Charas.Chara) => {
        if(isCharaNormal(c)) {
          const state = c.memory.normalCharaState;
          return `${
            Charas.logFormat(c)
          }${
            state && C.NormalCharaStateToShortName[state]
          }${
            state === C.NormalCharaStates.GAIN_SRC ?
              c.memory.normalCharaSourceID && c.memory.normalCharaSourceID.substr(-3) :
            state === C.NormalCharaStates.WORK_BUILD ?
              c.memory.normalCharaWorkBuildTargetID && c.memory.normalCharaWorkBuildTargetID.substr(-3):
            state === C.NormalCharaStates.WORK_SPAWN ?
              c.memory.normalCharaWorkSpawnSpawnExID && c.memory.normalCharaWorkSpawnSpawnExID.substr(-3):
              null
          }`;
        } else {
          return `${
            Charas.logFormat(c)
          }[${
            c.memory.born
          }]`;
        }
      }).join('; ')
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
        cxr.creeps.map(c =>
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
