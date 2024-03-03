import { postFunction } from './utils/mutation.js';

const addPopovers = posts => {
  for (const post of posts) {

  }
}

export const main = async () => {
  postFunction.start(addPopovers);
};

export const clean = async () => {
  postFunction.stop(addPopovers);
}