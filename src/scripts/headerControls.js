import { getOptions } from './utils/jsTools.js';
import { noact } from './utils/noact.js';
import { headerIconContainer } from './utils/elements.js';
import { threadFunction } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { activeProject } from './utils/user.js';
import { apiFetch } from './utils/apiFetch.js';

let like, share;

const customClass = 'ch-utils-headerControls';
const customAttribute = 'data-header-controls';
const { projectId, handle } = activeProject;

const likeIcon = (toPostId, isLiked) => noact({
  className: `${customClass} w-6 h-6 pointer relative`,
  onclick: function() {
    if (this.dataset.state) {
      apiFetch('/v1/trpc/relationships.unlike', {
        method: 'POST',
        queryParams: { batch: 1 },
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 0: { fromProjectId: projectId, toPostId } })
      }).then(this.dataset.state = '');
    } else {
      apiFetch('/v1/trpc/relationships.like?batch=1', {
        method: 'POST',
        queryParams: { batch: 1, },
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 0: { fromProjectId: projectId, toPostId } })
      }).then(this.dataset.state = 'liked');
    }
  },
  title: `like this post as ${handle}`,
  style: 'order:1',
  dataset: { state: isLiked ? 'liked' : '' },
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
      d: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z'
    }]
  }]
});
const shareIcon = shareOfPostId => noact({
  href: `/${handle}/post/compose?shareOfPostId=${shareOfPostId}`,
  title: `share this post as ${handle}`,
  target: '_blank',
  style: 'order:2',
  children: [{
    viewBox: '0 0 24 24',
    className: 'h-6 w-6 co-action-button',
    fill: 'none',
    'stroke-width': 1.5,
    stroke: 'currentColor',
    'aria-hidden': 'true',
    children: [{
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
    }]
  }]
});

const addControls = posts => posts.map(async post => {
  post.setAttribute(customAttribute, '');
  const { shareTree } = await getViewModel(post);
  const tree = shareTree.filter(share => !share.transparentShareOfPostId);
  const headers = Array.from(post.querySelectorAll('.co-post-header'));
  headers.pop();

  headers.map((header, i) => {
    try {
      let container = header.querySelector('.ch-utils-headerIconContainer');
      container ?? (container = headerIconContainer(), header.append(container));
      const t = tree[i];
      like && container.append(likeIcon(t.postId, t.isLiked ));
      share && t.canShare && container.append(shareIcon(t.postId));
    } catch (e) { console.error(tree, i, e); }
    
  });
});

export const main = async () => {
  ({ like, share } = await getOptions('headerControls'));
  if (!like && !share) return;

  threadFunction.start(addControls, `:not([${customAttribute}])`);
};
export const clean = async () => {};