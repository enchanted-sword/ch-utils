import { mutationManager } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { getComments } from './utils/apiFetch.js';

const customAttribute = 'data-fix-comments';
const linkSelector = `.co-thread-footer > .flex [href$="#comments"]:not([${customAttribute}])`;

const countComments = (sourceId, commentObj) => {
  if (!commentObj) return [0, null];
  
  const obj = {};
  let source = 0, shared = [0];

  Object.entries(commentObj).map(([key, value]) => {
    const arr = recursiveFlattenComments(value);
    if (Number(key) === sourceId) source = arr.length;
    else shared.push(arr.length);
  });

  return [source, shared.reduce((a, c) => a + c)];
};
const recursiveFlattenComments = commentArray => commentArray.map(c => [c.comment, recursiveFlattenComments(c.comment.children)]).flat(Infinity);

const fixNumbers = async links => {
  for (const link of links) {
    if (link.matches(`[${customAttribute}]`)) return;
    link.setAttribute(customAttribute, '');
  
    const post = link.closest('article.co-post-box:not(.co-post-composer)');
    const { postId, postingProject, transparentShareOfPostId } = await getViewModel(post);
    const { handle } = postingProject;
    const postComments = await getComments(handle, postId);
    const sourceId = transparentShareOfPostId ? transparentShareOfPostId : postId;
    const [source, shared] = countComments(sourceId, postComments);
  
    link.textContent = `${source} ${source === 1 ? 'comment' : 'comments'}${shared ? ` + ${shared} on shared posts` : ''}`;
  }
}

export const main = async () => {
  mutationManager.start(linkSelector, fixNumbers);
};
export const clean = async () => {
  mutationManager.stop(fixNumbers);
}