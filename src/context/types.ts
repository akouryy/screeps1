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
export interface RoomPreferences {
  dropperEneBalance: {
    [id in string]?: number;
  };
}
