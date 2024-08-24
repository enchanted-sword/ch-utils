import { inject } from './inject.js';
import { cacheData, getIndexedPosts } from './database.js';

const viewModelCache = new WeakMap();
const askCache = new WeakMap();

/**
 * @param {Element} post - post element to fetch viewModel from
 * @returns {any} viewModel property
 */
export const getViewModel = async post => {
  if (!viewModelCache.has(post)) {
    let model = await inject('getReactProp', ['viewModel'], post);
    if (model) {cacheData({ postStore: model });}
    else model = getIndexedPosts(+post.closest('[data-postid]').getAttribute('data-postid'));
    viewModelCache.set(post, model);
  }

  return viewModelCache.get(post);
};

export const getAsk = async article => {
  if (!askCache.has(article)) {
    askCache.set(article, inject('getReactProp', ['ask'], article));
  }

  return askCache.get(article);
};