import { inject } from './inject.js';

const viewModelCache = new WeakMap();

/**
 * @param {Element} post - post element to fetch viewModel from
 * @returns {any} viewModel property
 */
export const getViewModel = async post => {
  if (!viewModelCache.has(post)) {
    viewModelCache.set(post, inject('getReactProp', ['viewModel'], post));
  }

  return viewModelCache.get(post);
};