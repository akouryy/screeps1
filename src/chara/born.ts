import { Chara } from 'wrap.chara';
import * as CharaMemory from 'chara/memory';

export enum BornType {
  normal,
  dropper,
};

export function isBornType(b: number): b is BornType {
  return BornType.hasOwnProperty(b);
}

export type CharaNormal = Chara & { memory: CharaMemory.Normal };
export function isCharaNormal(c: Chara): c is CharaNormal {
  return c.memory.born === BornType.normal;
}

export type CharaDropper = Chara & { memory: CharaMemory.Dropper };
export function isCharaDropper(c: Chara): c is CharaNormal {
  return c.memory.born === BornType.dropper;
}
