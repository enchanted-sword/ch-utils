import { postFunction } from './utils/mutation.js';

const linkSelector = '.co-thread-footer a';

const onLinkClick = event => {
  event.preventDefault();
  event.stopPropagation();
};
const addPopovers = posts => {
  for (const post of posts) {
    post.querySelector(linkSelector).onclick = onLinkClick;
  }
};

export const main = async () => {
  if (['/', '#'].includes(location.pathname)) return;

  postFunction.start(addPopovers);
};

export const clean = async () => {
  postFunction.stop(addPopovers);
}