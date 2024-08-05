import { threadFunction, mutationManager } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { activeProject } from './utils/user.js';
import { getOptions } from './utils/jsTools.js';

const labelId = '-chutils-remove-shares--label'
const spacerId = '-chutils-remove-shares--spacer'
const checkboxId = '-chutils-remove-shares--checkbox-toggle'
const isShareClass = '-chutils-remove-shares--is-share'
const hideSharesClass = '-chutils-remove-shares--hide-shares'
const parentSelector = 'main section > div:nth-child(1)'
const $parent = () => $(parentSelector).first()

const customAttribute = 'data-filtering';
let ownPosts, hideShares, doHideShares, duplicatePosts, filterText, filterTags, filterCws, postList = {};

function validHideSharesLocation(href) {
  return (
    href === 'https://cohost.org/'
    || href.startsWith('https://cohost.org/rc/dashboard')
  )
}

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

    if (doHideShares) {
      const poster = model.postingProject.handle
      const sharedFrom = model?.shareTree[model?.shareTree.length - 1]?.postingProject?.handle
      if (!!sharedFrom && poster !== sharedFrom) {
        $(post).parent().parent().addClass(isShareClass)
      }
    }

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
  ({ ownPosts, hideShares, duplicatePosts, filterText, filterTags, filterCws } = await getOptions('filtering'));
  [filterText, filterTags, filterCws] = [filterText, filterTags, filterCws].map(list => list.trim() === '' ? false : list.split(',').map(str => str.trim().toLowerCase()));
  if (!ownPosts && duplicatePosts === 'disabled' && !filterText && !filterTags && !filterCws) return;
  if (window.location.pathname === `/${activeProject.handle}`) {
    ownPosts = false;
    duplicatePosts = false;
  }

  doHideShares = hideShares && validHideSharesLocation(location.href)
  if (doHideShares) {

    const spacer = $(`<div class="flex-1" id=${spacerId}>&nbsp;</div>`)

    const label = $(`
    <label class="font-bold pl-4 text-sidebarText" id="${labelId}">
      <span class="pr-2">hide shares</span>
      <input class="h-6 w-6 rounded-lg border-2 border-foreground bg-notWhite text-foreground focus:ring-foreground pl-4" type="checkbox" id="${checkboxId}">
    </label>
  `)

    const parent = $parent()
    parent.append(spacer)
    parent.append(label)
    parent.attr('class', 'mb-2 flex flex-col items-center lg:flex-row')

    $('#' + checkboxId).on("change", () => {
      $('main').toggleClass(hideSharesClass)
    })
  }

  mutationManager.start(parentSelector, () => {
    const parent = $parent()
    if (!parent.children('label')[0]) {
      parent.append(label)
    }
  })

  threadFunction.start(filterPosts, `:not([${customAttribute}])`);
};

export const clean = async () => {
  threadFunction.stop(filterPosts);
  mutationManager.stop(parentSelector)
  $(`[${customAttribute}]`).removeAttr(customAttribute);
  $(spacerId).remove()
  $(labelId).remove()
  $('main').removeClass(hideSharesClass)
  $(isShareClass).removeClass(isShareClass)
};