import { getOptions } from './utils/jsTools.js';
import { headerIconContainer } from './utils/elements.js';
import { threadFunction } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { likeIcon, shareIcon } from './utils/elements.js';

let like, share;

const customAttribute = 'data-header-controls';

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
export const clean = async () => {
  threadFunction.stop(addControls);
  $(':is(.ch-utils-likeIcon,.ch-utils-shareIcon)').remove();
  $(`[${customAttribute}]`).removeAttr(customAttribute);
};