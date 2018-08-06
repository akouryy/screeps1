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
    const containers = rooms.map(r =>
      _.sortBy(r.find(FIND_STRUCTURES, {
        filter: ds =>
          ds.structureType === STRUCTURE_CONTAINER && ds.hits < ds.hitsMax,
      }), ds => ds.hits / ds.hitsMax)
    );

    const roomSpecific = R.a.mapObj(rooms, room => {
      const creeps = room.find(FIND_MY_CREEPS);
      const sources = room.find(FIND_SOURCES);
      const cSites = room.find(FIND_CONSTRUCTION_SITES);

      const workBalance = {
        [C.NormalCharaStates.WORK_SPAWN]: creeps.length > 11 ? 2 : creeps.length > 9 ? 5 : 7,
        [C.NormalCharaStates.WORK_UP]: 4,
        [C.NormalCharaStates.WORK_TOWER]: 1.5,
        [C.NormalCharaStates.WORK_BUILD]: cSites.length > 10 ? 2 : cSites.length > 0 ? 1 : 0,
      };

      const sourcesBalance = {
        [sources[0].id]: sources[0].energy > 0 || sources[0].ticksToRegeneration <= 30 ? 8 : 0.01,
        [sources[1].id]: sources[1].energy > 0 || sources[1].ticksToRegeneration <= 30 ? 4 : 0.01,
      };

      const spawnsUnfilled = room.find(FIND_STRUCTURES, {
        filter: structure =>
          [STRUCTURE_EXTENSION, STRUCTURE_SPAWN].includes(structure.structureType) &&
            structure.energy < structure.energyCapacity,
      });

      return { [room.name]: {
        constructionSites: cSites,
        creeps,
        sources,
        sourcesBalance,
        spawnsUnfilled,
        workBalance,
      } };
    });

    return {
      containers,
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
