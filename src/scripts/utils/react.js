import { inject } from './inject.js';
import { cacheData } from './database.js';

const viewModelCache = new WeakMap();
const askCache = new WeakMap();

/**
 * @param {Element} post - post element to fetch viewModel from
 * @returns {any} viewModel property
 */
export const getViewModel = async post => {
  if (!viewModelCache.has(post)) {
    const model = inject('getReactProp', ['viewModel'], post)
    viewModelCache.set(post, model);
    cacheData({ postStore: await model });
  }

  return viewModelCache.get(post);
};

export const getAsk = async article => {
  if (!askCache.has(article)) {
    askCache.set(article, inject('getReactProp', ['ask'], article));
  }

  return askCache.get(article);
};