import { threadFunction } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { activeProject } from './utils/user.js';
import { getOptions } from './utils/jsTools.js';

const customAttribute = 'data-filtering';
let ownPosts, duplicatePosts, filterText, filterTags, filterCws, postList = {};

const textNodeDescendants = node => [
  ...node.childNodes, ...Array.from(node.childNodes).flatMap(child => textNodeDescendants(child))
].filter(child => child.nodeName === '#text');
const extractText = post => Array.from(post.querySelectorAll('.co-prose'))
  .flatMap(prose => textNodeDescendants(prose).map(node => node.textContent.trim().toLowerCase())).join(' ');

const filterPosts = async posts => {
  for (const post of posts) {
    if (post.matches(`[${customAttribute}]`)) return;
    post.setAttribute(customAttribute, '');

    let text, tags, cws;
    const model = await getViewModel(post);
    const transparentId = model.transparentShareOfPostId || model.postId;
    const rootId = model.shareTree[0]?.postId || model.postId;
    filterText && (text = extractText(post));
    filterTags && (tags = [...model.tags, ...model.shareTree.flatMap(share => share.tags)].map(str => str.trim().toLowerCase()).join(' '));
    filterCws && (cws = [...model.cws, ...model.shareTree.flatMap(share => share.cws)].map(str => str.trim().toLowerCase()).join(' '));

    if (ownPosts && model.postingProject.projectId === activeProject.projectId) post.setAttribute(customAttribute, 'hidden');
    else if (duplicatePosts === 'normal' && (transparentId in postList) && postList[transparentId] !== model.postId) post.setAttribute(customAttribute, 'hidden');
    else if (duplicatePosts === 'strict' && (rootId in postList) && postList[rootId] !== model.postId) post.setAttribute(customAttribute, 'hidden');
    else if ((filterText && filterText.some(str => text.includes(str)))
      || (filterTags && filterTags.some(tag => tags.includes(tag)))
      || (filterCws && filterCws.some(cw => cws.includes(cw)))) post.setAttribute(customAttribute, 'hidden');
    else if (duplicatePosts === 'normal') postList[transparentId] = model.postId;
    else if (duplicatePosts === 'strict') postList[rootId] = model.postId;
  }
};

export const main = async () => {
  ({ ownPosts, duplicatePosts, filterText, filterTags, filterCws } = await getOptions('filtering'));
  [filterText, filterTags, filterCws] = [filterText, filterTags, filterCws].map(list => list.trim() === '' ? false : list.split(',').map(str => str.trim().toLowerCase()));
  if (!ownPosts && duplicatePosts === 'disabled' && !filterText && !filterTags && !filterCws) return;
  if (window.location.pathname === `/${activeProject.handle}`) ownPosts = false;
  threadFunction.start(filterPosts, `:not([${customAttribute}])`);
};

export const clean = async () => {
  threadFunction.stop(filterPosts);
  $(`[${customAttribute}]`).removeAttr(customAttribute);
};