"use strict";
class CreepMemory {
  constructor(creep) {
    this.creep = creep;
  }

  get ncState() {
    return this.creep.memory.normalCharaState;
  }
  set ncState(val) {
    this.creep.memory.normalCharaState = val;
  }

  get ncSrcID() {
    return this.creep.memory.normalCharaSourceID;
  }
  set ncSrcID(val) {
    this.creep.memory.normalCharaSourceID = val;
  }

  get taste_() {
    return this.creep.memory.taste;
  }
  set taste_(val) {
    this.creep.memory.taste = val;
  }
}

module.exports = function getMemoryManager(obj) {
  if(obj instanceof Creep) {
    return new CreepMemory(obj);
  } else {
    throw new Error(`unknown object: ${obj}`);
  }
};
