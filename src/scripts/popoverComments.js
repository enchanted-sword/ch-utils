import { threadFunction } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { apiFetch, getComments } from './utils/apiFetch.js';
import { noact } from './utils/noact.js';
import { parseMd } from './utils/markdown.js';

// eslint-disable-next-line no-undef
const { DateTime } = luxon;
const wrapperSelector = '.co-thread-footer .flex-none';
const linkSelector = '.co-thread-footer a';

const customClass = 'ch-utils-popoverComments';
const customAttribute = 'data-popover-comments';

const submitComment = obj => apiFetch('/v1/comments', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(obj)
});
const ctrlEnter = event => {
  if (event.ctrlKey && event.key === 'Enter') {
    document.getElementById(`${event.target.id}-button`).click();
  }
};

const newCommentButton = (postId, link) => noact({
  id: `headlessui-comments-button-:${postId}:`,
  className: customClass,
  dataset: { headlessuiState: '' },
  onclick: onButtonClick,
  children: [
    {
      href: link.href,
      target: '_blank',
      dataset: link.dataset,
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
  dataset: { shareId },
  children: [
    {
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
    }
  ]
});
const newCommentBox = (comment, poster, canInteract, extLink) => noact({
  className: 'co-themed-box co-comment-box cohost-shadow-light dark:cohost-shadow-dark flex w-full min-w-0 max-w-full flex-col gap-4 rounded-lg p-3 lg:max-w-prose overflow-clip overflow-x-auto',
  children: [newComment(comment, poster, canInteract, extLink)]
});
const hiddenButton = () => { return {
  className: 'co-info-box co-info text-sm mx-auto flex w-full flex-row gap-4 rounded-lg p-3 mb-4 max-w-full',
  children: [
    {
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'aria-hidden': true,
      className: 'w-6 self-start',
      children: [{
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round',
        d: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
      }]
    },
    {
      className: 'flex-1 self-center',
      children: [
        {
          tag: 'span',
          className: 'ch-utils-popoverComments-hiddenInfo',
          children: ['A comment has been hidden by the page which made this post. ']
        },
        {
          className: `${customClass} co-link-button underline`,
          onclick: onHiddenButtonClick,
          dataset: { headlessuiState: '' },
          children: ['(view it anyway)']
        }
      ]
    }
  ]
}};
const newComment = (comment, poster, canInteract, extLink) => { return {
  className: 'flex flex-col gap-4',
  children: [
    {
      tag: 'article',
      className: 'relative flex flex-row gap-4',
      dataset: { commentId: comment.commentId },
      children: [
        {
          id: `comment-${comment.commentId}`,
          className: 'flex min-w-0 flex-1 flex-col',
          children: [
            comment.hidden ? hiddenButton() : '',
            {
              className: 'flex flex-row gap-4',
              dataset: { popoverCommentsHidden: comment.hidden },
              children: [
                comment.deleted ? '' : {
                  href: `https://cohost.org/${poster.handle}`,
                  className: 'flex-0 mask relative aspect-square cohost-shadow-light dark:cohost-shadow-dark h-12 w-12 lg:block',
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
                        comment.deleted ? {
                          tag: 'span',
                          children: ['[deleted]']
                        } : [
                          poster.displayName ? {
                            rel: 'author',
                            href: `https://cohost.org/${poster.handle}`,
                            title: poster.displayName,
                            className: 'co-project-display-name max-w-full flex-shrink truncate font-atkinson font-bold hover:underline',
                            children: [poster.displayName]
                          } : '',
                          {
                            href: `https://cohost.org/${poster.handle}`,
                            className: 'co-project-handle font-atkinson font-normal hover:underline',
                            children: [`@${poster.handle}`]
                          }
                        ],
                        {
                          className: 'block flex-none text-xs tabular-nums text-gray-500',
                          dateTime: comment.postedAtISO,
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
                      style: 'white-space: preserve',
                      innerHTML: parseMd(comment.body)
                    },
                    {
                      className: 'flex flex-row items-center gap-2',
                      children: [ canInteract && !comment.deleted ? {
                        className: 'co-link-button flex cursor-pointer flex-row items-center gap-1 text-sm font-bold hover:underline',
                        dataset: { replyBox: false },
                        onclick: function () {
                          const { shareId } = this.closest('[data-share-id]').dataset;
                          if (this.dataset.replyBox === 'true') {
                            $(`#ch-utils-replyBox-${shareId}${comment.commentId ? `-${comment.commentId}` : ''}`).remove();
                            this.dataset.replyBox = false;
                          }
                          else {
                            this.closest('.justify-start').append(noact(newReplyBox(shareId, comment.commentId)));
                            this.dataset.replyBox = true;
                          }
                        },
                        children: [
                          {
                            viewBox: '0 0 24 24',
                            className: 'h-4 w-4',
                            fill: 'currentColor',
                            'aria-hidden': true,
                            children: [{
                              'fill-rule': 'evenodd',
                              'clip-rule': 'evenodd',
                              d: 'M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z'
                            }]
                          },
                          'reply'
                        ]
                      } : comment.deleted ? {
                        tag: 'span',
                        className: 'co-link-button-disabled flex cursor-not-allowed flex-row items-center gap-1 text-sm font-bold text-gray-400',
                        children: [
                          {
                            viewBox: '0 0 24 24',
                            fill: 'currentColor',
                            'aria-hidden': true,
                            className: 'h-4 w-4',
                            children: [{
                              'fill-rule': 'evenodd',
                              'clip-rule': 'evenodd',
                              d: 'M9.53 2.47a.75.75 0 010 1.06L4.81 8.25H15a6.75 6.75 0 010 13.5h-3a.75.75 0 010-1.5h3a5.25 5.25 0 100-10.5H4.81l4.72 4.72a.75.75 0 11-1.06 1.06l-6-6a.75.75 0 010-1.06l6-6a.75.75 0 011.06 0z'
                            }]
                          },
                          'replies locked'
                        ]
                      } : ''] 
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    ...comment.children.map(({ comment, poster, canInteract }) => {return {
      className: 'co-hairline ml-0 flex flex-col gap-4 border-l pl-6 lg:ml-6 lg:pl-4',
      children: [newComment(comment, poster, canInteract, extLink)]
    }})
  ]
}};

const newReplyBox = (id, inReplyToCommentId = false) => { 
  const postId = Number(id);

  return {
    id: `ch-utils-replyBox-${postId}${inReplyToCommentId ? `-${inReplyToCommentId}` : ''}`,
    className: 'flex flex-col gap-4',
    children: [
      {
        className: 'ch-utils-replyBox relative grid w-full overflow-auto',
        children: [
          {
            tag: 'textarea',
            name: 'body',
            id: `ch-utils-commentArea-${postId}${inReplyToCommentId ? `-${inReplyToCommentId}` : ''}`,
            rows: 1,
            placeholder: 'leave a comment...',
            oninput: function () {
              this.style.height = "";
              this.style.height = `${Math.min(this.scrollHeight, 320)}px`;
              if (this.value) $(`#ch-utils-replyBox-${postId}${inReplyToCommentId ? `-${inReplyToCommentId}` : ''} button`).removeAttr('disabled');
              else $(`#ch-utils-replyBox-${postId}${inReplyToCommentId ? `-${inReplyToCommentId}` : ''} button`).attr('disabled', '');
            },
            onkeydown: ctrlEnter,
            className: 'co-composer-text-box w-full row-start-1 row-end-2 col-start-1 col-end-2 min-h-0',
            style: 'resize: none; overflow: hidden;'
          }
        ]
      },
      {
        className: 'flex flex-row items-center justify-end gap-4',
        children: [
          {
            className: 'co-outline-button flex items-center justify-center rounded-lg border-2 px-[14px] py-[6px] text-sm font-bold',
            onclick: () => {
              $(`#ch-utils-commentArea-${postId}${inReplyToCommentId ? `-${inReplyToCommentId}` : ''}`).val('');
              $(`#ch-utils-replyBox-${postId}${inReplyToCommentId ? `-${inReplyToCommentId}` : ''} button`).attr('disabled', '');
            },
            disabled: true,
            children: ['discard']
          },
          {
            id: `ch-utils-commentArea-${postId}${inReplyToCommentId ? `-${inReplyToCommentId}` : ''}-button`,
            className: 'co-filled-button flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold',
            onclick: async () => {
              const textarea = $(`#ch-utils-commentArea-${postId}${inReplyToCommentId ? `-${inReplyToCommentId}` : ''}`);
              const value = textarea.val();
              if (!value.length) return;

              const body = DOMPurify.sanitize(value);
              const commentObj = { body, postId };
              if (inReplyToCommentId) commentObj.inReplyToCommentId = inReplyToCommentId;

              submitComment(commentObj)
                .then(() => {
                  addStatusMessage(true);
                  $(`#ch-utils-commentArea-${postId}${inReplyToCommentId ? `-${inReplyToCommentId}` : ''}`).val('');
                  $(`#ch-utils-replyBox-${postId}${inReplyToCommentId ? `-${inReplyToCommentId}` : ''} button`).attr('disabled', '');
                })
                .catch(e => addStatusMessage(false))
            },
            disabled: true,
            children: ['submit']
          },
        ]
      }
    ]
  }
};
const addStatusMessage = success => {
  const message = noact({
    className: `ch-utils-popoverComments-status flex justify-between gap-3 !bg-${success ? 'green' : 'red'}-200 !text-${success ? 'green' : 'red'}-800 cohost-shadow-light dark:cohost-shadow-dark rounded-lg px-3 py-2 font-bold`,
    style: `left: calc(50% - ${success ? 130 : 194.8335 }px);`,
    children: [
      {
        className: `h-6 flex-none text-${success ? 'green' : 'red'}-800`,
        viewBox: '0 0 24 24',
        fill: 'none',
        'stroke-width': 1.5,
        stroke: 'currentColor',
        'aria-hidden': true,
        children: [{
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          d: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        }]
      },
      {
        role: 'status',
        'aria-live': 'polite',
        children: [success ? `comment submitted` : 'an error occurred while submitting the comment']
      }
    ]
  });

  document.body.append(message);
  window.setTimeout(() => message.remove(), 5000);
};
const onButtonClick = event => {
  event.preventDefault();
  
  const target = event.target.closest(`button.${customClass}`);
  const { dataset } = target;
  if (dataset.headlessuiState === 'open') dataset.headlessuiState = '';
  else dataset.headlessuiState = 'open';
};
const onHiddenButtonClick = ({ target }) => {
  const info = target.parentElement.querySelector('.ch-utils-popoverComments-hiddenInfo');
  const comment = target.closest('.min-w-0').querySelector('[data-popover-comments-hidden]');
  const { dataset } = target;
  if (dataset.headlessuiState === 'open') {
    dataset.headlessuiState = '';
    target.innerText = '(view it anyway)';
    info.innerText = 'A comment has been hidden by the page which made this post. ';
    comment.dataset.popoverCommentsHidden = true;
  }
  else {
    dataset.headlessuiState = 'open';
    target.innerText = '(hide it again)';
    info.innerText = 'The below comment was hidden by the page which made this post. ';
    comment.dataset.popoverCommentsHidden = false;
  }
};

const addPopovers = async posts => {
  for (const post of posts) {
    if (post.matches(`[${customAttribute}]`)) return;
    post.setAttribute(customAttribute, '');

    let handleMap = {};
    const { postingProject, postId, shareTree, singlePostPageUrl, commentsLocked, transparentShareOfPostId } = await getViewModel(post);
    const { handle } = postingProject;
    shareTree.map(treeItem => handleMap[treeItem.postId] = treeItem.postingProject.handle);
    const postComments = await getComments(handle, postId);

    if (post.querySelector(linkSelector)) {
      const link = post.querySelector(linkSelector);
      const commentButton = newCommentButton(postId, link);
      const footer = post.querySelector('.co-thread-footer');
      const footerStartWrapper = post.querySelector(wrapperSelector);
      const defaultReply = noact({
        className: `${customClass} my-3 flex min-w-0 flex-col gap-2`,
        dataset: { postId },
        children: [{
          className: 'co-themed-box co-comment-box cohost-shadow-light dark:cohost-shadow-dark flex w-full min-w-0 max-w-full flex-col gap-4 rounded-lg p-3 lg:max-w-prose',
          children: [
            commentsLocked ? {
              className: 'co-info-box co-info text-sm mx-auto flex w-full flex-row gap-4 rounded-lg p-3',
              children: [
                {
                  className: 'w-6 self-start',
                  fill: 'none',
                  viewBox: '0 0 24 24',
                  'stroke-width': 1.5,
                  stroke: 'currentColor',
                  'aria-hidden': true,
                  children: [{
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                    d: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
                  }]
                },
                {
                  tag: 'div',
                  className: 'flex-1 self-center',
                  children: ['Comments on this post are locked.']
                }
              ]
            } : newReplyBox(transparentShareOfPostId || postId)
          ]
        }]
      });

      footerStartWrapper.append(commentButton);
      footer.append(defaultReply);

      if (postComments !== null) {
        Object.keys(postComments).forEach(shareId => {
          const commentCollection = postComments[shareId];
          const irt = String(postId) === shareId ? handle : handleMap[shareId];
          const commentWrapper = newCommentWrapper(irt, shareId);
    
          footer.append(commentWrapper);
          commentCollection.forEach(({ comment, poster, canInteract } )=> {
            commentWrapper.append(newCommentBox(comment, poster, canInteract, singlePostPageUrl));
          });
        });
      }
    }
  }
};

export const main = async () => {
  if (location.pathname.includes('/post/')) return;

  threadFunction.start(addPopovers, ':not([data-popover-comments="true"])');
};

export const clean = async () => {
  threadFunction.stop(addPopovers);
  $(`.${customClass}`).remove();
  $(`[${customAttribute}]`).removeAttr(customAttribute);
}