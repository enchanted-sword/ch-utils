import { postFunction } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { apiFetch } from './utils/apiFetch.js';
import { noact } from './utils/noact.js';
import { DateTime } from '../lib/luxon.min.js';

const wrapperSelector = '.co-thread-footer .flex-none';
const linkSelector = '.co-thread-footer a';

const customClass = 'ch-utils-popoverComments';

const newCommentButton = (postId, link) => noact({
  id: `headlessui-comments-button-:${postId}:`,
  className: customClass,
  dataset: { headlessuiState: '' },
  onclick: onButtonClick,
  children: [
    {
      href: link.href,
      target: '_blank',
      className: 'text-sm',
      children: [link.innerText]
    },
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

const newCommentWrapper = (irt, shareId) => noact({
  className: `${customClass} my-3 flex min-w-0 flex-col gap-2`,
  children: [{
    tag: 'h4',
    className: 'px-3 text-bgText lg:px-0',
    children: [
      'in reply to ',
      {
        href: `#post-${shareId}`,
        className: 'font-bold text-secondary hover:underline',
        children: [`@${irt}'s post`]
      }
    ] 
  }]
});
const newCommentBox = (comment, poster, extLink) => noact({
  className: 'co-themed-box co-comment-box cohost-shadow-light dark:cohost-shadow-dark flex w-full min-w-0 max-w-full flex-col gap-4 rounded-lg p-3 lg:max-w-prose',
  children: [newComment(comment, poster, extLink)]
});
const newComment = (comment, poster, extLink) => { return {
  className: 'flex flex-col gap-4',
  children: [
    {
      tag: 'article',
      className: 'relative flex flex-row gap-4',
      dataset: { commentId: comment.commentId },
      children: [
        {
          id: `comment-${comment.commentId}`,
          className: 'absolute -top-16'
        },
        {
          className: 'flex min-w-0 flex-1 flex-col',
          children: [{
            className: 'flex flex-row gap-4',
            children: [
              {
                href: `https://cohost.org/${poster.handle}`,
                className: 'flex-0 mask relative aspect-square cohost-shadow-light dark:cohost-shadow-dark hidden h-12 w-12 lg:block',
                title: `@${poster.handle}`,
                children: [{
                  src: `${poster.avatarURL}?dpr=2&amp;width=80&amp;height=80&amp;fit=cover&amp;auto=webp`,
                  className: `mask mask-${poster.avatarShape} h-full w-full object-cover`,
                  alt: poster.handle
                }]
              },
              {
                className: 'flex min-w-0 flex-1 flex-col justify-start gap-2',
                children: [
                  {
                    className: 'flex flex-row flex-wrap items-center gap-2',
                    children: [
                      {
                        href: `https://cohost.org/${poster.handle}`,
                        className: 'co-project-handle font-atkinson font-normal hover:underline',
                        children: [`@${poster.handle}`]
                      },
                      {
                        tag: 'time',
                        className: 'block flex-none text-xs tabular-nums text-gray-500',
                        datetime: comment.postedAtISO,
                        title: DateTime.fromISO(comment.postedAtISO).toLocaleString(DateTime.DATETIME_MED),
                        children: [{
                          href: `${extLink}#comment-${comment.commentId}`,
                          className: 'hover:underline',
                          children: [DateTime.fromISO(comment.postedAtISO).toRelative()]
                        }]
                      }
                    ]
                  },
                  {
                    className: 'co-prose prose overflow-hidden break-words',
                    children: comment.body.split('\n\n')
                  }
                ]
              }
            ]
          }]
        }
      ]
    },
    ...comment.children.map(({ comment, poster }) => {return {
      className: 'co-hairline ml-0 flex flex-col gap-4 border-l pl-6 lg:ml-6 lg:pl-4',
      children: [newComment(comment, poster, extLink)]
    }})
  ]
}};


const removeEmptyArrays = obj => {
  const returnObj = {};
  Object.keys(obj).filter(key => obj[key].length > 0).map(key => returnObj[key] = obj[key]);
  return Object.keys(returnObj).length ? returnObj : null;
};
const getComments = async (handle, postId) => {
  const arr = await apiFetch('/v1/trpc/posts.singlePost', { method: 'GET', queryParams: { batch: 1, input: { 0: { handle, postId } } } });
  return removeEmptyArrays(arr[0].result.data.comments);
};
const onButtonClick = event => {
  event.preventDefault();
  
  const target = event.target.closest(`.${customClass}`);
  const { dataset } = target;
  if (dataset.headlessuiState === 'open') dataset.headlessuiState = '';
  else dataset.headlessuiState = 'open';
};

const addPopovers = async posts => {
  for (const post of posts) {
    post.dataset.popoverComments = true;

    let handleMap = {};
    const { postingProject, postId, shareTree, singlePostPageUrl } = await getViewModel(post);
    const { handle } = postingProject;
    shareTree.map(treeItem => handleMap[treeItem.postId] = treeItem.postingProject.handle);
    const postComments = await getComments(handle, postId);
    console.log(postComments);

    const commentButton = newCommentButton(postId, post.querySelector(linkSelector));
    const footer = post.querySelector('.co-thread-footer');
    const footerStartWrapper = post.querySelector(wrapperSelector);

    footerStartWrapper.append(commentButton);

    if (postComments !== null) {
      Object.keys(postComments).forEach(shareId => {
        const commentCollection = postComments[shareId];
        const irt = String(postId) === shareId ? handle : handleMap[shareId];
        const commentWrapper = newCommentWrapper(irt, shareId);
  
        footer.append(commentWrapper);
        commentCollection.forEach(({ comment, poster } )=> {
          commentWrapper.append(newCommentBox(comment, poster, singlePostPageUrl));
        });
      });
    }
  }
};

export const main = async () => {
  if (!['/', '/rc/dashboard', '/rc/project/following', '#'].includes(location.pathname)) return;

  postFunction.start(addPopovers);
};

export const clean = async () => {
  postFunction.stop(addPopovers);
}