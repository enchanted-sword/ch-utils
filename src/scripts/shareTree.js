import { getJsonFile, getStorage, unique, getOptions } from './utils/jsTools.js';
import { postFunction } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { apiFetch, singlePost } from './utils/apiFetch.js';
import { noact } from './utils/noact.js';
import { parseMd } from './utils/markdown.js';
import { activeProject } from './utils/user.js';

// eslint-disable-next-line no-undef
const { DateTime } = luxon;
const customClass = 'ch-utils-shareTree';
const customAttribute = 'data-shareTree';
let ownPosts, opacity;

const staticTreeMap = await getJsonFile('treeMap');
const treeValues = Object.values(staticTreeMap);
const staticMapLimit = Number(treeValues[treeValues.length - 1]);
let dynamicTreeMap, highestPostIndexed, indexMap;

const growthFactor = 1.76e-7; // linear regression of posts per millisecond with ~5.1m data points, rounded up slightly
const epoch = 1639004243256; // date of first post minus one day since i mapped out the functions in excel first by non-zero indexed day
const projectedIndex = () => Math.ceil(Math.pow(Date.now() - epoch, 2) * (growthFactor / 172800000)); // simple integration to get a rough estimate of highest index as a function of time in ms

const chunkSize = 10000; // slightly arbitrary
const threads = 1000; // efficiency drops off after here
const precision = 2; // it's faster to do several large operations and then a quick cleanup pass to catch any rate-limited requests
const workingPosts = {};
let workingTrees;
let remaining;
let loadState = false;

const setStorage = async obj => browser.storage.local.set(obj);
const treeManager = async (lowIndex, highIndex) => {
  if (!highestPostIndexed) highestPostIndexed = staticMapLimit;
  if (!dynamicTreeMap) dynamicTreeMap = {};
  if (!indexMap) indexMap = [];
  if (lowIndex > staticMapLimit && !Object.entries(dynamicTreeMap).flat(2).includes(lowIndex)) highestPostIndexed = Math.min(lowIndex, highestPostIndexed);
  const limit = highIndex - highestPostIndexed;

  if (limit <= 0) return;

  const newTrees = await chunkManager(highestPostIndexed + 1, limit);
  dynamicTreeMap = mergeInto(dynamicTreeMap, newTrees);
  highestPostIndexed = highIndex;

  await setStorage({ highestPostIndexed, dynamicTreeMap, indexMap });
};
const mergeInto = (a, b) => {
  Object.keys(b).map(key => {
    if (key in a) {
      a[key].push(...b[key]);
      a[key] = unique(a[key]);
    } else a[key] = b[key];
  });
  return a;
};

const get = async postId => {
  if (postId in workingPosts) return;
  return apiFetch(`/v1/project_post/${postId}`).then(response => {
    if (response?.status === 404) return;
    try {
      const [{ href }] = response._links;
      const handle = href.split('/')[4];
      singlePost(handle, postId, true).then(sortPost, () => { return; });
    } catch (e) {
      console.warn(postId, response, e);
      return;
    }
  }, () => { return; });
};
const sortPost = ({ post }) => {
  try {
    post.shareTree.map((share, i) => {
      if (share.postId < staticMapLimit) sortPost({ post: share });
      post.shareTree[i] = share.postId;
    });
  
    delete post.astMap;

    if (post.shareTree.length && workingTrees[post.shareTree[0]]) workingTrees[post.shareTree[0]].push(post.postId);
    else if (post.shareTree.length) workingTrees[post.shareTree[0]] = [post.postId];
    else workingTrees[post.postId] = [];
  } catch (e) {
    console.warn(e, { post });
  } finally {
    indexMap.push(post.postId);
    workingPosts[post.postId] = post;
  }

  return Promise.resolve();
};

const getChunk = async (start, size) => new Promise(async resolve => {
  const arr = Array.from(Array(size), (_, i) => start + i).filter(index => !indexMap.includes(index));
  while (arr.length) await Promise.all(arr.splice(0, threads).map(get));
  resolve();
});
const chunkManager = async (initPos, limit) => {
  const totalChunks = Math.ceil(limit / chunkSize);
  workingTrees = {};
  remaining = limit;

  console.log(`mapping ${limit} indices [${initPos} - ${initPos + limit}]`);
  const startTime = Date.now();

  for (let chunk = 1; chunk <= totalChunks; ++chunk) {
    const size = Math.min(chunkSize, remaining);

    console.log(`starting chunk ${chunk} of ${totalChunks}`);
    const chunkStartTime = Date.now();

    for (let i = 1; i <= precision; ++i) {
      console.log(`starting pass ${i} of ${precision}`);
      const passStartTime = Date.now();

      await getChunk(initPos, size);

      const passElapsed = Date.now() - passStartTime;
      console.log(`pass ${i} finished in ${passElapsed / 1000}s`);
    }

    const chunkElapsed = Date.now() - chunkStartTime;

    console.log(`chunk ${chunk} finished in ${chunkElapsed / 1000}s [${size / (chunkElapsed / 1000)} posts/s]`);

    initPos += size;
    remaining -= size;
  }

  const treeEntries = Object.entries(workingTrees);
  treeEntries.sort(([_A, valueA], [_B, valueB]) => valueB.length - valueA.length);
  const cIndex = treeEntries.map(([_, value]) => value.length).indexOf(0);
  treeEntries.splice(cIndex, Infinity);

  const elapsed = Date.now() - startTime;
  console.log(`${totalChunks} chunks processed in ${elapsed / 1000}s [${limit / (elapsed / 1000)} posts/s]`);
  return Object.fromEntries(treeEntries.sort());
};

const onButtonClick = event => {
  event.preventDefault();
  
  const target = event.target.closest(`.${customClass}-button`);
  const { dataset } = target;
  if (dataset.headlessuiState === 'open') dataset.headlessuiState = '';
  else dataset.headlessuiState = 'open';
};

const newSharesButton = postId => noact({
  id: `headlessui-comments-button-:${postId}:`,
  className: `${customClass}-button flex flex-row items-center gap-2 order-2 text-sm border-l-2 pl-2`,
  dataset: { headlessuiState: '' },
  onclick: onButtonClick,
  children: [
    'shares',
    {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      'aria-hidden': true,
      className: 'h-6 w-6 transition-transform ui-open:rotate-180',
      children: [{
        'fill-rule': 'evenodd',
        'clip-rule': 'evenodd',
        d: 'M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z'
      }]
    }
  ]
});
const shareList = postId => noact({
  className: `${customClass} rounded-md overflow-clip mt-3`,
  children: [{
    tag: 'ul',
    id: `shareList-${postId}`,
    children: [{
      className: 'flex flex-row w-full justify-center gap-2 items-center p-3',
      children: [
        'loading shares',
        {
          tag: 'span',
          className: 'spinner'
        }
      ]
    }]
  }]
});
const shareListEntry = (post, index, posts) => {
  if ((opacity === 'opaque' && !post.blocks.length)
    || (opacity === 'tags' && !post.tags.length && !post.blocks.length)) return null;
  try {
    let prevPost;
    if (post.shareOfPostId) prevPost = posts.find(({ postId }) => postId === post.shareOfPostId);
    return noact({
      tag: 'li',
      className: 'flex flex-col gap-2 p-3',
      children: [
        {
          className: 'flex flex-row flex-wrap items-center gap-2 leading-none justify-between',
          children: [
            {
              className: 'flex flex-row flex-wrap items-center gap-2 leading-none',
              children: [
                post.shareOfPostId ? null : {
                  className: 'font-atkinson font-bold co-project-handle',
                  children: ['posted by']
                },
                {
                  className: 'flex-0 mask relative aspect-square h-8 w-8 inline-block',
                  children: [{
                    src: post.postingProject.avatarURL,
                    className: `mask mask-${post.postingProject.avatarShape} h-full w-full object-cover`,
                    alt: post.postingProject.handle
                  }]
                },
                {
                  className: 'co-project-handle font-atkinson font-normal hover:underline',
                  href: post.singlePostPageUrl,
                  rel: 'author',
                  target: '_blank',
                  children: [`@${post.postingProject.handle}`]
                },
                post.shareOfPostId ? [
                  {
                    viewBox: '0 0 24 24',
                    className: 'co-project-display-name h-5 w-5',
                    fill: 'currentColor',
                    'aria-hidden': true,
                    children: [{
                      'fill-rule': 'evenodd',
                      'clip-rule': 'evenodd',
                      d: 'M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z'
                    }]
                  },
                  {
                    className: 'flex-0 mask relative aspect-square h-8 w-8 inline-block',
                    children: [{
                      src: prevPost.postingProject.avatarURL,
                      className: `mask mask-${prevPost.postingProject.avatarShape} h-full w-full object-cover`,
                      alt: prevPost.postingProject.handle
                    }]
                  },
                  {
                    className: 'co-project-handle font-atkinson font-normal hover:underline',
                    href: prevPost.singlePostPageUrl,
                    rel: 'author',
                    target: '_blank',
                    children: [`@${prevPost.postingProject.handle}`]
                  }
                ] : null
              ]
            },
            {
              tag: 'time',
              className: 'block flex-none text-xs tabular-nums text-gray-500',
              datetime: post.publishedAt,
              title: DateTime.fromISO(post.publishedAt).toLocaleString(DateTime.DATETIME_MED),
              children: [{
                href: post.singlePostPageUrl,
                className: 'hover:underline',
                children: [DateTime.fromISO(post.publishedAt).toRelative()]
              }]
            }
          ]
        },
        {
          className: 'border-l-2 pl-2 flex flex-col gap-2',
          children: [
            post.headline ? {
              className: 'font-bold',
              children: [post.headline]
            } : null,
            post.plainTextBody ? {
              className: 'co-block-quote block-children break-words italic',
              innerHTML: parseMd(post.plainTextBody)
            } : null,
            post.tags.length ? {
              className: 'co-tags relative w-full overflow-y-hidden break-words leading-none',
              children: post.tags.map(tag => {return {
                className: 'mr-2 inline-block text-sm hover:underline',
                href: `https://cohost.org/rc/tagged/${tag}`,
                children: [`#${tag}`]
              }})
            } : null
          ]
        }
      ]
    });
  } catch (e) { return null; }
};

const addShareTrees = async posts => {
  if (!posts.length) return;

  let viewModels = await Promise.all(posts.map(async post => {
    post.setAttribute(customAttribute, '');

    const model = await getViewModel(post);
    const rootPost = model.shareTree[0] || model;
    model.rootIndex = rootPost.postId;

    if ((ownPosts === 'own' && rootPost.postingProject.projectId !== activeProject.projectId)
      || (ownPosts === 'others' && rootPost.postingProject.projectId === activeProject.projectId)) return null;

    post.querySelector('footer').append(shareList(model.postId));
    post.querySelector('footer .w-max.flex-none').append(newSharesButton(model.postId));
    return model;
  }));
  viewModels = viewModels.filter(model => model !== null);

  if (loadState === false || viewModels.some(({ postId }) => postId > highestPostIndexed)) {
    const lowIndex = viewModels.map(({ rootIndex }) => rootIndex).sort((a, b) => b - a)[0];
    const highIndex = Math.max(viewModels[0].postId, projectedIndex());

    await treeManager(lowIndex, highIndex).then(() => loadState = true);
  }

  await Promise.all(viewModels.map(async post => {
    const list = document.getElementById(`shareList-${post.postId}`);
    const { rootIndex } = post;
    let postTree = [rootIndex];

    if (rootIndex in staticTreeMap) postTree.push(...staticTreeMap[rootIndex]);
    if (rootIndex in dynamicTreeMap) postTree.push(...dynamicTreeMap[rootIndex]);

    postTree = unique(postTree);

    postTree = await Promise.all(postTree.map(async index => {
      if (index in workingPosts) return workingPosts[index];
      else {
        const response = await apiFetch(`/v1/project_post/${index}`);
        if (response?.status === 404) return null;
        const [{ href }] = response._links;
        return singlePost(href.split('/')[4], index, true).catch(() => null);
      }
    }));
    postTree = postTree.filter(post => post !== null)
    .map(post => 'post' in post ? post.post : post)
    .sort((a, b) => a.postId - b.postId);
    
    list.replaceChildren(...postTree.map(shareListEntry).filter(listEntry => listEntry !== null));
  }));
};

export const main = async () => {
  if (!document.querySelector('[data-postid]')) return;
  ({ ownPosts, opacity } = await getOptions('shareTree'));
  ({ highestPostIndexed, dynamicTreeMap } = await getStorage(['highestPostIndexed', 'dynamicTreeMap']));

  postFunction.start(addShareTrees, `:not([${customAttribute}])`);
};

export const clean = async () => {
  postFunction.stop(addShareTrees);

  $(`.${customClass}`).remove();
  $(`[${customAttribute}]`).removeAttr(customAttribute);
};