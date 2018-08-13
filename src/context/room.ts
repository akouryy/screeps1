import { defaultRoomPreferences, roomPreferencesMap } from 'context/room.preferences';
import * as C from 'consts';
import _ from 'lodash';
import * as Charas from 'wrap.chara';
import * as LG from 'wrap.log';
import { SourceBalance, SourceLike, SpawnLike, WithdrawTarget, WorkBalance, RoomPreferences } from 'context/types';
import { isCharaNormal, CharaNormal, CharaDropper, isCharaDropper } from 'chara/born';

export interface RoomContext {
  attacked: boolean;
  attackers: Array<Creep>;
  constructionSites: Array<ConstructionSite>;
  charasDropper: Array<CharaDropper>;
  charasNormal: Array<CharaNormal>;
  charas: Array<Charas.Chara>;
  preferences: RoomPreferences;
  room: Room;
  sources: Array<Source>;
  sourcesBalance: SourceBalance;
  sourceLikes: Array<SourceLike>;
  spawnsUnfilled: Array<SpawnLike>;
  withdrawTargets: Array<WithdrawTarget>;
  workBalance: WorkBalance;
}

export function calcRoomContext(room: Room): RoomContext {
  const creeps = room.find(FIND_MY_CREEPS);
  const charas = creeps.filter(Charas.isChara);
  const charasNormal = charas.filter(isCharaNormal);
  const charasDropper = charas.filter(isCharaDropper);

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
        !['5b6aad6573dec0420e2071e8', '5b6a9728f4feee16c8710c41', '5b6a8b2311faf97bdec3a8db',
          '5b674e0154450e3f59dfd6c3', '5b673099c82c6a10bcacdabf', '5b673e4c5982db10ac6759a3',
          '5b67b8a7af5ac16dd37b6af3'].includes(structure.id) &&
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

  const preferences: RoomPreferences = Object.assign({}, defaultRoomPreferences, roomPreferencesMap[room.name]);

  return {
    attacked,
    attackers,
    charas,
    charasDropper,
    charasNormal,
    constructionSites: cSites,
    preferences,
    room,
    sources,
    sourcesBalance,
    sourceLikes,
    spawnsUnfilled,
    withdrawTargets,
    workBalance,
  };
}
