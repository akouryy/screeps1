import W51S52 from 'context/room.preferences/W51S52';
import { RoomPreferences } from 'context/types';

export const defaultRoomPreferences: Readonly<RoomPreferences> = Object.freeze({
  dropperEneBalance: {},
});

export const roomPreferencesMap: {
  [name in string]?: RoomPreferences;
} = {
  W51S52,
};
