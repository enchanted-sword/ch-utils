import { threadFunction, mutationManager } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { activeProject } from './utils/user.js';
import { getStorage, getOptions } from './utils/jsTools.js';
import { noact } from './utils/noact.js';

/* const labelId = '-chutils-remove-shares--label'
const spacerId = '-chutils-remove-shares--spacer'
const checkboxId = '-chutils-remove-shares--checkbox-toggle'
const isShareClass = '-chutils-remove-shares--is-share'
const hideSharesClass = '-chutils-remove-shares--hide-shares'
const parentSelector = 'main section > div:nth-child(1)'
const $parent = () => $(parentSelector).first() */

const customClass = 'ch-utils-filtering';
const generalAttribute = 'data-filtering';
const hiddenAttribute = 'data-filtering-hidden';
const sectionSelector = `main > .container > section:first-of-type > .flex-row:not(.${customClass})`;
let ownPosts, ownPostsToggle, hideShares, hideSharesToggle, duplicatePosts, duplicatePostsToggle, filterText, filterTags, filterCws;
const app = document.getElementById('app');
const postCache = [], postList = {}, strictPostList = {};

const textNodeDescendants = node => [
  ...node.childNodes, ...Array.from(node.childNodes).flatMap(child => textNodeDescendants(child))
].filter(child => child.nodeName === '#text');
const extractText = post => Array.from(post.querySelectorAll('.co-prose'))
  .flatMap(prose => textNodeDescendants(prose).map(node => node.textContent.trim().toLowerCase())).join(' ');

const feedToggleOnClassName = 'rounded-lg bg-cherry-500 py-2 px-2 text-notWhite md:px-3 font-bold text-center';
const feedToggleOffClassName = 'py-2 px-2 text-cherry-700 md:px-3 text-center';
const feedToggleState = async function () {
  const { preferences } = await getStorage(['preferences']);
  const { state, target } = this.dataset;
  const on = this.querySelector(`[class="${feedToggleOnClassName}"]`);
  const off = this.querySelector(`[class="${feedToggleOffClassName}"]`);
  on.className = feedToggleOffClassName;
  off.className = feedToggleOnClassName;

  if (state) {
    this.dataset.state = '';
    app.removeAttribute(`ch-utils-filter-${this.dataset.target}`);
  } else {
    this.dataset.state = 'hidden';
    app.setAttribute(`ch-utils-filter-${this.dataset.target}`, this.dataset.target === 'duplicatePosts' ? duplicatePosts : 'true');
  }

  if (target in preferences.filtering.options) {
    preferences.filtering.options[`${target}Toggle`] = !state; // because we're reading the existing state and updating it
    browser.storage.local.set({ preferences });
  }
};
const feedToggles = () => noact({
  className: `${customClass} flex flex-row mb-2 gap-4 items-center`,
  children: [
    ownPosts ? {
      className: 'inline-flex w-fit items-center rounded-lg bg-cherry-300 text-base leading-none',
      onclick: feedToggleState,
      role: 'switch',
      tabindex: 0,
      'aria-hidden': true,
      dataset: {
        target: 'ownPosts',
        state: ownPostsToggle ? 'hidden' : ''
      },
      children: [
        {
          tag: 'span',
          className: ownPostsToggle ? feedToggleOffClassName : feedToggleOnClassName,
          children: 'show own posts'
        },
        {
          tag: 'span',
          className: ownPostsToggle ? feedToggleOnClassName : feedToggleOffClassName,
          children: 'hide own posts'
        }
      ]
    } : null,
    hideShares ? {
      className: 'inline-flex w-fit items-center rounded-lg bg-cherry-300 text-base leading-none',
      onclick: feedToggleState,
      role: 'switch',
      tabindex: 0,
      'aria-hidden': true,
      dataset: {
        target: 'hideShares',
        state: hideSharesToggle ? 'hidden' : ''
      },
      children: [
        {
          tag: 'span',
          className: hideSharesToggle ? feedToggleOffClassName : feedToggleOnClassName,
          children: 'show shares'
        },
        {
          tag: 'span',
          className: hideSharesToggle ? feedToggleOnClassName : feedToggleOffClassName,
          children: 'hide shares'
        }
      ]
    } : null,
    duplicatePosts !== 'disabled' ? {
      className: 'inline-flex w-fit items-center rounded-lg bg-cherry-300 text-base leading-none',
      onclick: feedToggleState,
      role: 'switch',
      tabindex: 0,
      'aria-hidden': true,
      dataset: {
        target: 'duplicatePosts',
        state: duplicatePostsToggle ? 'hidden' : ''
      },
      children: [
        {
          tag: 'span',
          className: duplicatePostsToggle ? feedToggleOffClassName : feedToggleOnClassName,
          children: 'show duplicates'
        },
        {
          tag: 'span',
          className: duplicatePostsToggle ? feedToggleOnClassName : feedToggleOffClassName,
          children: 'hide duplicates'
        }
      ]
    } : null
  ]
});
const applyFilters = async post => {
  post.setAttribute(generalAttribute, '');
  post.removeAttribute(hiddenAttribute);

  let text, tags, cws;
  const model = await getViewModel(post);
  const transparentId = model.transparentShareOfPostId || model.postId;
  const rootId = model.shareTree[0]?.postId || model.postId;
  const poster = model.postingProject.handle;
  filterText && (text = extractText(post));
  filterTags && (tags = [...model.tags, ...model.shareTree.flatMap(share => share.tags)].map(str => str.trim().toLowerCase()).join(' '));
  filterCws && (cws = [...model.cws, ...model.shareTree.flatMap(share => share.cws)].map(str => str.trim().toLowerCase()).join(' '));

  if (model.postingProject.projectId === activeProject.projectId) post.dataset.filtering += 'ownPosts'
  if (model.shareTree.some(share => share.postingProject.handle !== poster)) post.dataset.filtering += ' hideShares';
  if ((transparentId in postList) && postList[transparentId] !== model.postId && rootId !== model.postId) post.dataset.filtering += ' duplicates';
  if ((rootId in strictPostList) && strictPostList[rootId] !== model.postId && rootId !== model.postId) post.dataset.filtering += ' duplicatesStrict';
  else {
    postList[transparentId] = model.postId;
    strictPostList[rootId] = model.postId;
  } if ((filterText && filterText.some(str => text.includes(str)))
    || (filterTags && filterTags.some(tag => tags.includes(tag)))
    || (filterCws && filterCws.some(cw => cws.includes(cw)))) post.setAttribute(hiddenAttribute, 'hidden');
};

const filterPosts = posts => {
  for (const post of posts) {
    if (post.matches(`[${generalAttribute}]`)) return;
    postCache.push(post);
    applyFilters(post);
  }
};
const addFeedControls = row => {
  $(`.${customClass}`).remove();
  row.map(r => r.insertAdjacentElement('afterend', feedToggles()));
}


const transformList = list => list.trim() === '' ? false : list.split(',').map(str => str.trim().toLowerCase());
const syncToggles = () => {
  ownPosts && (ownPostsToggle = false);
  !hideShares && (hideSharesToggle = false);
  duplicatePosts === 'disabled' && (duplicatePostsToggle = false);
  app.setAttribute('ch-utils-filter-ownPosts', ownPostsToggle);
  app.setAttribute('ch-utils-filter-hideShares', hideSharesToggle);
  app.setAttribute(`ch-utils-filter-duplicatePosts`, duplicatePosts);
};

export const main = async () => {
  ({ ownPosts, ownPostsToggle, hideShares, hideSharesToggle, duplicatePosts, duplicatePostsToggle, filterText, filterTags, filterCws } = await getOptions('filtering'));
  [filterText, filterTags, filterCws] = [filterText, filterTags, filterCws].map(transformList);
  if (!ownPosts && !hideShares && duplicatePosts === 'disabled' && !filterText && !filterTags && !filterCws) return;
  if (location.pathname.includes(`/${activeProject.handle}`)) {
    ownPosts = ownPostsToggle = duplicatePosts = duplicatePostsToggle = false;
  }
  if (location.href !== 'https://cohost.org/' && !(location.href.startsWith('https://cohost.org/rc/dashboard'))) hideShares = hideSharesToggle = false;
  syncToggles();
  if (ownPosts || hideShares || duplicatePosts !== 'disabled') mutationManager.start(sectionSelector, addFeedControls);

  threadFunction.start(filterPosts, `:not([${generalAttribute}])`);
};

export const clean = async () => {
  threadFunction.stop(filterPosts);
  $(`[${generalAttribute}]`).removeAttr(generalAttribute);
  $(`.${customClass}`).remove();
  mutationManager.stop(addFeedControls)
};

export const update = async (options, diff) => {
  ({ ownPosts, ownPostsToggle, hideShares, hideSharesToggle, duplicatePosts, duplicatePostsToggle, filterText, filterTags, filterCws } = options);
  [filterText, filterTags, filterCws] = [filterText, filterTags, filterCws].map(transformList);

  if (['filterText', 'filterTags', 'filterCws'].some(key => key in diff)) postCache.map(applyFilters);
  if (['ownPosts', 'hideShares', 'duplicatePosts'].some(key => key in diff)) {
    $(`.${customClass}`).remove();
    syncToggles();
    if (ownPosts || hideShares || duplicatePosts !== 'disabled') mutationManager.listeners.has(addFeedControls) ? mutationManager.trigger(addFeedControls) : mutationManager.start(sectionSelector, addFeedControls);
    else mutationManager.stop(addFeedControls);
  } 
};