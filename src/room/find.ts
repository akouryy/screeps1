import { constFn } from 'rab/fn';
import { cast } from 'rab.util';

export function findStructure<SC extends StructureConstant>(
  room: Room,
  scs: Array<SC>,
  filterFn: FilterStructureFunction<SC> = constFn(true),
): Array<StructureTypes[SC]> {
  return room.find(FIND_STRUCTURES, {
    filter: s =>
      cast<Array<StructureConstant>>(scs).includes(s.structureType)
      && filterFn(s)
  }) as Array<StructureTypes[SC]>;
}
