import { noact } from './utils/noact.js';
import { headerIconContainer } from './utils/elements.js';
import { threadFunction } from './utils/mutation.js'; 
import { getViewModel } from './utils/react.js';
import { cacheData, updateData, clearData, getIndexedResources, getCursor } from './utils/database.js';
import { renderPost } from './utils/elements.js';
import { getStorage, getOptions } from './utils/jsTools.js';
import { postBoxTheme } from './utils/apiFetch.js';

let chrono, ascending;

const customClass = 'ch-utils-bookmarks';
const customAttribute = 'data-bookmarks';
const feedToggleOnClassName = 'rounded-lg bg-cherry-500 py-2 px-2 text-notWhite md:px-3 font-bold text-center';
const feedToggleOffClassName = 'py-2 px-2 text-cherry-700 md:px-3 text-center';

const bookmarkPost = post => cacheData({ bookmarkStore: post });
const unbookmarkPost = postId => clearData({ bookmarkStore: postId }, { bookmarkStore: { index: 'postId' } });
const getBookmark = async postId => getIndexedResources('bookmarkStore', postId, { index: 'postId' });
const isPostBookmarked = async postId => typeof await getBookmark(postId) !== 'undefined';

const bookmarkIcon = (post, isBookmarked) => noact({
  className: `${customClass} w-6 h-6 pointer relative`,
  onclick: async function() {
    if (this.dataset.state) {
      unbookmarkPost(post.postId);
      this.dataset.state = '';
    } else {
      bookmarkPost(post);
      this.dataset.state = 'bookmarked';
    }
  },
  title: `bookmark this post`,
  style: 'order:3',
  dataset: { state: isBookmarked ? 'bookmarked' : '', bookmarkId: '' },
  children: [{
    className: 'w-6 h-6 pointer absolute top-0 left-0 co-action-button',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'aria-hidden': true,
    'stroke-width': 1.5,
    children: [{
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M 7.875 2.625 C 6.6285 2.625 5.625 3.6285 5.625 4.875 L 5.625 13.875 L 5.625 19.125 C 5.625 19.2021 5.62922 19.2785 5.63672 19.3535 C 5.6311 19.2972 5.62643 19.241 5.625 19.1836 L 5.625 21.3457 L 6.26953 20.7041 L 12 15 L 17.7305 20.7041 C 17.7556 20.6785 17.7798 20.6518 17.8037 20.625 C 17.78 20.6515 17.7554 20.6788 17.7305 20.7041 L 18.375 21.3457 L 18.375 19.1836 C 18.3736 19.241 18.3689 19.2972 18.3633 19.3535 C 18.3595 19.391 18.3542 19.4279 18.3486 19.4648 C 18.3542 19.428 18.3595 19.391 18.3633 19.3535 C 18.3708 19.2785 18.375 19.2021 18.375 19.125 L 18.375 13.875 L 18.375 4.875 C 18.375 3.6285 17.3715 2.625 16.125 2.625 L 7.875 2.625 Z M 18.3311 19.5762 C 18.3237 19.6125 18.3137 19.646 18.3047 19.6816 C 18.2957 19.7173 18.2861 19.7551 18.2754 19.79 C 18.2647 19.825 18.2526 19.8584 18.2402 19.8926 C 18.2279 19.9268 18.2161 19.9588 18.2021 19.9922 C 18.1743 20.0589 18.1423 20.1252 18.1084 20.1885 C 18.0915 20.2201 18.074 20.2515 18.0557 20.2822 C 18.0373 20.3129 18.0198 20.3433 18 20.373 C 17.9802 20.4028 17.9596 20.4322 17.9385 20.4609 C 17.9597 20.4322 17.9802 20.4029 18 20.373 C 18.0197 20.3435 18.0374 20.3128 18.0557 20.2822 C 18.0741 20.2514 18.0914 20.2203 18.1084 20.1885 C 18.1423 20.1252 18.1743 20.0589 18.2021 19.9922 C 18.2159 19.9591 18.228 19.9265 18.2402 19.8926 C 18.2527 19.8581 18.2646 19.8253 18.2754 19.79 C 18.2863 19.7545 18.2955 19.7179 18.3047 19.6816 C 18.3135 19.6466 18.3239 19.6119 18.3311 19.5762 Z M 5.69531 19.6816 C 5.70446 19.7179 5.71373 19.7545 5.72461 19.79 C 5.7354 19.8253 5.74732 19.8581 5.75977 19.8926 C 5.74744 19.8584 5.73531 19.825 5.72461 19.79 C 5.71391 19.7551 5.70434 19.7173 5.69531 19.6816 Z M 5.79785 19.9922 C 5.82567 20.0589 5.85773 20.1252 5.8916 20.1885 C 5.90862 20.2203 5.92586 20.2514 5.94434 20.2822 C 5.92596 20.2515 5.90854 20.2201 5.8916 20.1885 C 5.85773 20.1252 5.82567 20.0589 5.79785 19.9922 Z'
    }]
  }]
});

const fixTree = (parentPost, treePost) => { // either cohost or react is sloppy with data inside of the tree so it has empty shareTree or numSharedComments properties by default
  if (parentPost === treePost) return parentPost;
  else {
    const fixedTreePost = treePost;
    fixedTreePost.shareTree = parentPost.shareTree.slice(0, parentPost.shareTree.indexOf(treePost));
    fixedTreePost.numSharedComments = fixedTreePost.shareTree.reduce((accumulator, { numComments }) => accumulator + numComments, 0);
    return fixedTreePost;
  }
}

const addButtons = posts => posts.map(async post => {
  post.setAttribute(customAttribute, '');
  const model = await getViewModel(post);
  const tree = model.shareTree.filter(share => !share.transparentShareOfPostId);
  const headers = Array.from(post.querySelectorAll('.co-post-header'));
  headers.push(post.querySelector('.co-thread-header'));
  if (!model.transparentShareOfPostId) tree.push(model);
  tree.push(model);

  getBookmark(post.postId);

  headers.map(async (header, i) => {
    try {
      let container = header.querySelector('.ch-utils-headerIconContainer');
      container ?? (container = headerIconContainer(), header.append(container));
      const t = fixTree(model, tree[i]);
      const isBookmarked = await  isPostBookmarked(t.postId);
      container.append(bookmarkIcon(t, isBookmarked));
    } catch (e) { console.error(tree, i, e); }
  });
});

const BOOKMARKS_PER_PAGE = 40;
let renderPosts;

async function toggleState () {
  const { preferences } = await getStorage(['preferences']);
  const { state, target } = this.dataset;
  state === state ? true : false;
  const on = this.querySelector(`[class="${feedToggleOnClassName}"]`);
  const off = this.querySelector(`[class="${feedToggleOffClassName}"]`);
  on.className = feedToggleOffClassName;
  off.className = feedToggleOnClassName;

  if (state) {
    this.dataset.state = '';
  } else {
    this.dataset.state = target;
  }

  if (target in preferences.bookmarks.options) {
    target === 'chrono' && (state ? chrono = false : chrono = true);
    target === 'ascending' && (state ? ascending = false : ascending = true);
    preferences.bookmarks.options[target] = !state; // because we're reading the existing state and updating it
    browser.storage.local.set({ preferences });
    renderPosts();
  }
};
const feedControls = noact({
  className: 'ch-utils-bookmarks-toggleContainer mt-4 flex flex-row justify-between gap-4 max-w-prose items-center',
  children: [
    {
      className: 'ch-utils-bookmarks-toggle flex flex-row gap-4 items-center rounded-lg pl-3 h-fit',
      dataset: { theme: postBoxTheme },
      children: [
        {
          tag: 'span',
          className: 'font-bold',
          children: ['sort by:']
        },
        {
          className: 'inline-flex w-fit items-center rounded-lg bg-cherry-300 text-base leading-none',
          onclick: toggleState,
          role: 'switch',
          tabindex: 0,
          'aria-hidden': true,
          dataset: {
            target: 'chrono',
            state: chrono ? 'chrono' : ''
          },
          children: [
            {
              tag: 'span',
              className: chrono ? feedToggleOffClassName : feedToggleOnClassName,
              children: 'date bookmarked'
            },
            {
              tag: 'span',
              className: chrono ? feedToggleOnClassName : feedToggleOffClassName,
              children: 'date posted'
            }
          ]
        }
      ]
    },
    {
      className: 'ch-utils-bookmarks-toggle flex flex-row gap-4 items-center rounded-lg pl-3 h-fit',
      dataset: { theme: postBoxTheme },
      children: [
        {
          tag: 'span',
          className: 'font-bold',
          children: ['order:']
        },
        {
          className: 'inline-flex w-fit items-center rounded-lg bg-cherry-300 text-base leading-none',
          onclick: toggleState,
          role: 'switch',
          tabindex: 0,
          'aria-hidden': true,
          dataset: {
            target: 'ascending',
            state: ascending ? 'ascending' : ''
          },
          children: [
            {
              tag: 'span',
              className: ascending ? feedToggleOffClassName : feedToggleOnClassName,
              children: 'descending'
            },
            {
              tag: 'span',
              className: ascending ? feedToggleOnClassName : feedToggleOffClassName,
              children: 'ascending'
            }
          ]
        }
      ]
    }
  ]
});

const renderPage = async () => {
  const container = document.querySelector('.mt-4.flex.w-fit.flex-col.gap-4');
  const pageButtons = container.querySelector('.max-w-prose');
  document.title = 'cohost! - posts you\'ve bookmarked';
  container.previousElementSibling.style.display = 'none';

  container.parentElement.insertBefore(feedControls, container.previousElementSibling);

  let bookmarks = await getCursor('bookmarkStore');

  updateData({ postStore: bookmarks });
  renderPosts = () => window.requestAnimationFrame(() =>{
    let bookmarkClones = structuredClone(bookmarks);
    $('.ch-utils-customPost').remove();
    const page = +/\d+/.exec(window.location.search);
    const lower = page * BOOKMARKS_PER_PAGE;
    const upper = (page + 1) * BOOKMARKS_PER_PAGE;

    if (chrono) bookmarkClones.sort((a, b) => a.publishedAt - b.publishedAt);
    else bookmarkClones.sort((a, b) => a.storedAt - b.storedAt);
    if (!ascending) bookmarkClones.reverse();

    bookmarkClones.slice(lower, upper).map(bookmark => {
      console.log(bookmark);
      container.insertBefore(renderPost(bookmark), pageButtons);
    });
  });

  renderPosts();
  window.addEventListener('popstate', renderPosts);
};

export const main = async () => {
  ({ chrono, ascending: ascending } = await getOptions('bookmarks'))
  threadFunction.start(addButtons, `:not([${customAttribute}])`);

  if (window.location.pathname === '/bookmarked') renderPage();
};

export const clean = async () => {
  threadFunction.stop(addButtons);
  window.removeEventListener('popstate', renderPosts);
  $(`.${customClass}`).remove();
  $('.ch-utils-customPost').remove();
  $(`[${customAttribute}]`).removeAttr(customAttribute);
};

export const update = async () => void 0;