interface CreepMemory {
  normalCharaState?: number;
  normalCharaSourceID?: string;
  normalCharaWorkEnergyWaiting?: number;
  normalCharaWorkBuildTargetID?: string;
  normalCharaWorkSpawnSpawnExID?: string;
  taste: number;
  spawnedRoomName: string;
  spawnID: string;
}

interface RoomMemory {
  attackedLog: { [UserName in string]: number };
}

interface Memory {
}
