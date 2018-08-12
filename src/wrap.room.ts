import _ from 'lodash';
import * as R from 'rab';

export function safemode(room: Room) {
  if(!room.controller || room.controller.safeMode) return;
  const err = room.controller.activateSafeMode();
  switch(err) {
    case OK:
      return true;
    case ERR_NOT_OWNER:
      console.log('room.safemode: You are not the owner of this controller.');
      break;
    case ERR_BUSY:
      console.log('room.safemode: There is another room in safe mode already.');
      break;
    case ERR_NOT_ENOUGH_RESOURCES:
      console.log('room.safemode: There is no safe mode activations available.');
      break;
    case ERR_TIRED:
      console.log('room.safemode: The previous safe mode is still cooling down, or the controller is upgradeBlocked, or the controller is downgraded for 5000 ticks or more.');
      break;
  }
  return false;
}
