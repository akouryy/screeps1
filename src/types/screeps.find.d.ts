interface StructureTypes {
  [STRUCTURE_SPAWN]: StructureSpawn,
  [STRUCTURE_EXTENSION]: StructureExtension,
  [STRUCTURE_ROAD]: StructureRoad,
  [STRUCTURE_WALL]: StructureWall,
  [STRUCTURE_RAMPART]: StructureRampart,
  [STRUCTURE_KEEPER_LAIR]: StructureKeeperLair,
  [STRUCTURE_PORTAL]: StructurePortal,
  [STRUCTURE_CONTROLLER]: StructureController,
  [STRUCTURE_LINK]: StructureLink,
  [STRUCTURE_STORAGE]: StructureStorage,
  [STRUCTURE_TOWER]: StructureTower,
  [STRUCTURE_OBSERVER]: StructureObserver,
  [STRUCTURE_POWER_BANK]: StructurePowerBank,
  [STRUCTURE_POWER_SPAWN]: StructurePowerSpawn,
  [STRUCTURE_EXTRACTOR]: StructureExtractor,
  [STRUCTURE_LAB]: StructureLab,
  [STRUCTURE_TERMINAL]: StructureTerminal,
  [STRUCTURE_CONTAINER]: StructureContainer,
  [STRUCTURE_NUKER]: StructureNuker,
}

type FilterStructureFunction<T extends StructureConstant> = (s: StructureTypes[T]) => boolean;
