import { BornType } from 'chara/born';

export interface Normal {
  born: BornType.normal;
  normalCharaState?: number;
  normalCharaSourceID?: string;
  normalCharaWorkEnergyWaiting?: number;
  normalCharaWorkBuildTargetID?: string;
  normalCharaWorkSpawnSpawnExID?: string;
  taste: number;
  spawnedRoomName: string;
  spawnID: string;
}

export interface Dropper {
  born: BornType.dropper;
  eneID: string;
  working: boolean;
}
