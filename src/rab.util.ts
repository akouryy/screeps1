import * as LG from 'wrap.log';

export function safely(f) {
  try {
    return f();
  } catch(err) {
    console.log(LG.color('red', `${err}\n${err.stack}`));
    return error(err);
  }
}

export function error(error) {
  return {
    isError: true,
    error,
  };
}
