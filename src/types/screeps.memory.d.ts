import * as CharaMemory from 'chara/memory';

declare global {
  type CreepMemory = CharaMemory.Normal | CharaMemory.Dropper;

  interface RoomMemory {
    attackedLog: { [UserName in string]: number };
  }

  interface Memory {
  }

  interface FlagMemory {}
  interface RoomMemory {}
  interface SpawnMemory {}
}
