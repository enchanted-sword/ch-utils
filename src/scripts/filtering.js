import { threadFunction } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { activeProject } from './utils/user.js';
import { getOptions } from './utils/jsTools.js';

const customAttribute = 'data-filtering';
let ownPosts, duplicates, postList = {};

const filterPosts = async posts => {
  for (const post of posts) {
    if (post.matches(`[${customAttribute}]`)) return;
    post.setAttribute(customAttribute, '');
    const model = await getViewModel(post);

    if ((ownPosts && model.postingProject.projectId === activeProject.projectId)
      || (duplicates && (model.transparentShareOfPostId in postList) && postList[model.transparentShareOfPostId] !== model.postId)) post.setAttribute(customAttribute, 'hidden');
    else postList[model.transparentShareOfPostId || model.postId] = model.postId;
  }
};

export const main = async () => {
  ({ ownPosts, duplicates } = await getOptions('filtering'));
  threadFunction.start(filterPosts, `:not([${customAttribute}])`);
};

export const clean = async () => {
  threadFunction.stop(filterPosts);
  $(`[${customAttribute}]`).removeAttr(customAttribute);
};