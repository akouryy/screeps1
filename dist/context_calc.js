"use strict";
const C = require('consts');
const M = require('wrap.memory');
const R = require('rab');
const LG = require('wrap.log');

const preLog = LG.color('#ccf', ' [cx]       ');

const exp = module.exports = {
  calc() {
    const flg = n => Game.flags[n] && Game.flags[n].color !== COLOR_WHITE;

    const debug = flg('_DEBUG');
    const stopSpawn = flg('_STOPSPAWN');
    const shouldPickup = flg('_PICKUP');

    const spawningCreepNames = Game.spawns.pyon.spawning ? [Game.spawns.pyon.spawning.name] : [];

    const rooms = _.values(Game.rooms);

    const towers = rooms.map(r => r.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}}));
    const damagedWalls = rooms.map(r =>
      _.sortBy(r.find(FIND_STRUCTURES, {
        filter: ds =>
          ds.structureType === STRUCTURE_WALL && ds.hits < ds.hitsMax,
      }), ds => ds.hits / ds.hitsMax)
    );
    const damagedRamparts = rooms.map(r =>
      _.sortBy(r.find(FIND_STRUCTURES, {
        filter: ds =>
          ds.structureType === STRUCTURE_RAMPART && ds.hits < ds.hitsMax,
      }), ds => ds.hits / ds.hitsMax)
    );
    const damagedRoads = rooms.map(r =>
      _.sortBy(r.find(FIND_STRUCTURES, {
        filter: ds =>
          ds.structureType === STRUCTURE_ROAD && ds.hits < ds.hitsMax,
      }), ds => ds.hits / ds.hitsMax)
    );
    const damagedContainers = rooms.map(r =>
      _.sortBy(r.find(FIND_STRUCTURES, {
        filter: ds =>
          ds.structureType === STRUCTURE_CONTAINER && ds.hits < ds.hitsMax,
      }), ds => ds.hits / ds.hitsMax)
    );

    const roomSpecific = R.a.mapObj(rooms, room => {
      const creeps = room.find(FIND_MY_CREEPS);
      const attackers = room.find(FIND_HOSTILE_CREEPS, {
        filter: c =>
          c.getActiveBodyparts(ATTACK) + c.getActiveBodyparts(RANGED_ATTACK) > 0
      });
      const attacked = attackers.length > 0;
      R.u.safely(() => {
        if(attacked) {
          room.memory.attackedLog = room.memory.attackedLog || {};
          attackers.forEach(a => {
            room.memory.attackedLog[a.owner.username] =
              (room.memory.attackedLog[a.owner.username] || 0) + 1;
          });
        }
      });

      const sources = room.find(FIND_SOURCES);
      const withdrawTargets =
        room.find(FIND_TOMBSTONES).concat(
          room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_CONTAINER }),
        );
      const sourceLikes = _.shuffle(withdrawTargets.concat(sources));
      const cSites = room.find(FIND_CONSTRUCTION_SITES);

      const spawnsUnfilled = room.find(FIND_STRUCTURES, {
        filter: structure =>
          [STRUCTURE_EXTENSION, STRUCTURE_SPAWN].includes(structure.structureType) &&
            structure.energy < structure.energyCapacity,
      });

      const workBalance = {
        [C.NormalCharaStates.WORK_SPAWN]:
          spawnsUnfilled.length === 0 ? 0 :
          creeps.length > 11 ? 0 : creeps.length > 7 ? 2 : 5,
        [C.NormalCharaStates.WORK_UP]: attacked ? 3 : 4,
        [C.NormalCharaStates.WORK_TOWER]: attacked ? 5 : 2.5,
        [C.NormalCharaStates.WORK_BUILD]:
          cSites.length > 10 && !attacked ? 2 :
          creeps.length > 5 && cSites.length > 0 && !attacked ? 1 :
          0,
      };

      const sourcesBalance = {
        [sources[0].id]: sources[0].energy > 0 || sources[0].ticksToRegeneration <= 30 ? 8 : 0.01,
        [sources[1].id]: sources[1].energy > 0 || sources[1].ticksToRegeneration <= 30 ? 4 : 0.01,
      };

      return { [room.name]: {
        attacked,
        attackers,
        constructionSites: cSites,
        creeps,
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
      debug,
      rooms,
      r: roomSpecific,
      shouldPickup,
      stopSpawn,
      towers,
    };
  },

  log(cx) {
    for(const room of cx.rooms) {
      const cxr = cx.r[room.name];

      LG.println(
        preLog,
        `${room.name}.creeps[${cxr.creeps.length}]: `,
        cxr.creeps.map(c => {
          const mem = M(c);
          return `${
            LG.chara(c)
          }${
            C.NormalCharaStateToShortName[mem.ncState]
          }${
            mem.ncState === C.NormalCharaStates.GAIN_SRC ?
              mem.ncSrcID && mem.ncSrcID.substr(-3) :
            mem.ncState === C.NormalCharaStates.WORK_BUILD ?
              mem.ncWbTgtID && mem.ncWbTgtID.substr(-3):
            mem.ncState === C.NormalCharaStates.WORK_SPAWN ?
              mem.ncWsSpnID && mem.ncWsSpnID.substr(-3):
              null
          }`;
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
        ['debug', 'stopSpawn', 'shouldPickup'].map(f => `${f}=${cx[f]}`).join(', ')
      );
    }
  },
};
