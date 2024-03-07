import { noact } from './utils/noact.js';
import { apiFetch } from './utils/apiFetch.js';
import { DateTime } from '../lib/luxon.min.js';

const buttonSelector = '[href="https://cohost.org/rc/project/notifications"]';
const customClass = 'ch-utils-popover-notifications';

const dateFormat = { ...DateTime.DATE_MED, weekday: 'long' };

let comments, posts, projects, sortedNotifications;

const getSortedNotifications = async () => {
  const { comments, posts, projects, notifications } = await apiFetch('/v1/notifications/list?limit=40');
  const sortedNotifications = {};

  notifications.forEach(notification => {
    const date = notification.createdAt.split('T')[0];
    if (!(date in sortedNotifications)) sortedNotifications[date] = [];
    sortedNotifications[date].push(notification);
  });

  return { comments, posts, projects, sortedNotifications };
};

const pathMap = {
  groupedLike: {
    d: 'M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z'
  },
  share: {
    'fill-rule': 'evenodd',
    'clip-rule': 'evenodd',
    d: 'M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z'
  },
  groupedShare: {
    'fill-rule': 'evenodd',
    'clip-rule': 'evenodd',
    d: 'M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-3.183a.75.75 0 100 1.5h4.992a.75.75 0 00.75-.75V4.356a.75.75 0 00-1.5 0v3.18l-1.9-1.9A9 9 0 003.306 9.67a.75.75 0 101.45.388zm15.408 3.352a.75.75 0 00-.919.53 7.5 7.5 0 01-12.548 3.364l-1.902-1.903h3.183a.75.75 0 000-1.5H2.984a.75.75 0 00-.75.75v4.992a.75.75 0 001.5 0v-3.18l1.9 1.9a9 9 0 0015.059-4.035.75.75 0 00-.53-.918z'
  },
  follow: {
    d: 'M6.25 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM3.25 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM19.75 7.5a.75.75 0 00-1.5 0v2.25H16a.75.75 0 000 1.5h2.25v2.25a.75.75 0 001.5 0v-2.25H22a.75.75 0 000-1.5h-2.25V7.5z'
  },
  groupedFollow: [
    {
      'fill-rule': 'evenodd',
      'clip-rule': 'evenodd',
      d: 'M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z'
    },
    {
      d: 'M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z'
    }
  ],
  comment: {
    'fill-rule': 'evenodd',
    'clip-rule': 'evenodd',
    d: 'M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z'
  }
};
const interactionMap = {
  groupedLike: ' liked ',
  share: ' shared ',
  groupedShare: ' shared ',
  groupedFollow: ' followed ',
  comment: ' left '
};
const secondaryInteractionMap = (notification) => {
  const post = posts[notification.toPostId];
  const comment = comments[notification.commentId].comment;
  const replyTo = comments[notification.inReplyTo].comment;

  if (notification.type === 'comment' && notification.inReplyTo) {
    return {
      href: `${post.singlePostPageUrl}#comment-${comment.commentId}`,
      className: 'font-bold hover:underline',
      children: ['your comment']
    }
  } else if (notification.type === 'comment') {

  }
}

const newIcon = type => {return {
  viewBox: '0 0 24 24',
  className: 'h-6 w-6 flex-none',
  fill: 'currentColor',
  'aria-hidden': true,
  children: [pathMap[type]]
}};
const newAvatar = project => {return {
  className: 'flex-0 mask relative aspect-square h-8 w-8',
  href: `https://cohost.org/${project.handle}`,
  title: `@${project.handle}`,
  children: [{
    className: `mask mask-${project.avatarShape} h-full w-full object-cover`,
    alt: project.handle,
    src: `${project.avatarURL}?dpr=2&amp;width=80&amp;height=80&amp;fit=cover&amp;auto=webp`
  }]
}};
const newBodyPreview = (post, comment = null) => {return {
  tag: 'span',
  className: "co-inline-quote flex-1 truncate before:content-['“'] after:content-['”']",
  children: [{
    href: `${post.singlePostPageUrl}${comment ? `#comment${comment.commentId}` : ''}`,
    className: 'hover:underline',
    children: [`${post.plainTextBody.slice(0, 40)}${post.plainTextBody.length > 40 ? '...' : ''}`]
  }]
}};
const newNotification = notification => {
  const post = posts[notification.toPostId];
  const sharePost = posts[notification.sharePostId];
  const comment = comments[notification.commentId]?.comment;
  const replyTo = comments[notification.inReplyTo]?.comment;

  switch (notification.type) {
    case 'groupedLike':
    case 'groupedShare':
    case 'groupedFollow': {
      if (notification.fromProjectIds.length === 1) {
        const projectId = notification.fromProjectIds[0];
        const notifyingProject = projects[projectId];
        return {
          className: 'flex w-full flex-row flex-nowrap items-center gap-3',
          children: [
            newIcon(notification.type),
            newAvatar(notifyingProject),
            {
              className: 'ch-utils-postSummary flex w-full flex-1 flex-row flex-wrap gap-2',
              children: [
                {
                  tag: 'span',
                  className: 'flex-wrap',
                  children: [
                    {
                      href: `https://cohost.org/${notifyingProject.handle}`,
                      className: 'font-bold hover:underline',
                      children: [`@${notifyingProject.handle}`]
                    },
                    interactionMap[notification.type],
                    notification.type === 'groupedFollow' ? {
                        tag: 'span',
                        children: ['you']
                      } : {
                        href: post.singlePostPageUrl,
                        className: 'font-bold hover:underline',
                        children: ['your post']
                      }
                  ]
                },
                // notification.type === 'groupedFollow' ? '' : newBodyPreview(post)
              ]
            }
          ]
        };
      } else {
        const notifyingProjects = notification.fromProjectIds.map(projectId => projects[projectId]);
        return [
          {
            className: 'flex w-full flex-row flex-nowrap items-center gap-3',
            children: [
              newIcon(notification.type),
              {
                className: 'flex w-full flex-1 flex-row flex-wrap gap-3 overflow-auto lg:flex-nowrap',
                children: [
                  {
                    tag: 'span',
                    className: 'flex-wrap',
                    children: [
                      `Several pages${interactionMap[notification.type]}`,
                      notification.type === 'groupedFollow' ? {
                          tag: 'span',
                          children: ['you']
                        } : {
                          href: post.singlePostPageUrl,
                          className: 'font-bold hover:underline',
                          children: ['your post']
                        }
                    ]
                  },
                  // notification.type === 'groupedFollow' ? '' : newBodyPreview(post)
                ]
              }
            ]
          },
          {
            className: 'flex flex-col gap-4',
            children: [{
              className: 'mt-2 flex flex-row flex-nowrap items-center gap-3 overflow-hidden',
              children: [{
                className: 'flex flex-row flex-nowrap items-center gap-2 overflow-hidden',
                children: notifyingProjects.map(project => newAvatar(project))
              }]
            }]
          }
        ]
      }
    };
    case 'comment':
    case 'share': {
      const projectId = notification.fromProjectId;
      const notifyingProject = projects[projectId];
      return [
        {
          className: 'flex w-full flex-row flex-nowrap items-center gap-3',
          children: [
            newIcon(notification.type),
            newAvatar(notifyingProject),
            {
              className: 'ch-utils-postSummary flex w-full flex-1 flex-row flex-wrap gap-2',
              children: [
                {
                  tag: 'span',
                  className: 'flex-wrap',
                  children: [
                    {
                      href: `https://cohost.org/${notifyingProject.handle}`,
                      className: 'font-bold hover:underline',
                      children: [`@${notifyingProject.handle}`]
                    },
                    replyTo ? ' replied to ' : interactionMap[notification.type],
                    notification.type === 'comment' ? {
                      href: `${post.singlePostPageUrl}#comment-${comment.commentId}`,
                      className: 'font-bold hover:underline',
                      children: [replyTo ? 'your comment' : 'a comment']
                    } : {
                      href: sharePost.singlePostPageUrl,
                      className: 'font-bold hover:underline',
                      children: ['your post and added']
                    }
                  ]
                },
                // sharePost ? newBodyPreview(sharePost) : newBodyPreview(post, comment)
              ]
            }
          ]
        },
        {
          className: 'co-block-quote ml-20 whitespace-pre-line break-words border-l-2 pl-2 italic',
          children: [sharePost ? sharePost.plainTextBody : comment.body]
        }
      ]
    };
    default: return 'strange alien notification';
  }
}
const newNotificationCard = notification => {return {
  className: 'co-notification-card flex flex-col p-3 last:rounded-b-lg',
  children: [newNotification(notification)] // this can conditionally return an array, however noact will automatically flatten the array to a single level to prevent issues
}};
const newNotificationPage = (date, notifications) => {return {
  className: 'co-themed-box co-notification-group cohost-shadow-light dark:cohost-shadow-dark flex flex-col divide-y rounded-lg',
  children: [
    {
      tag: 'header',
      className: 'flex flex-row items-center justify-end rounded-t-lg p-3',
      children: [{
        className: 'font-league text-xs uppercase',
        datetime: date,
        children: [DateTime.fromISO(date).toLocaleString(dateFormat)]
      }]
    },
    ...notifications.map(notification => newNotificationCard(notification))
  ]
}};
const newNotificationPopover = (clientX, clientY) => {
  const popover = noact({
    className: `${customClass} ch-utils-popover`,
    style: `top: ${clientY + 16}px; left: ${clientX}px;`,
    children: [{
      className: 'co-themed-box co-notification-group cohost-shadow-light dark:cohost-shadow-dark flex flex-col divide-y rounded-lg',
      children: [{
        tag: 'header',
        className: 'flex flex-row items-center justify-end rounded-t-lg p-3',
        style: 'border-radius: .5rem;',
        children: [{
          tag: 'span',
          className: 'loader'
        }]
      }]
  }]
  });

  return popover;
};

const closePopover = () => {
  if ($(`${buttonSelector}:hover, ${buttonSelector} + .${customClass}:hover`).length === 0) {
    document.querySelector(buttonSelector).click();
    document.removeEventListener('click', closePopover);
  }
};
const onNotificationButtonClick = async event => {
  event.preventDefault();
  event.stopImmediatePropagation();

  const { target, clientX, clientY } = event;
  const button = target.closest(buttonSelector);
  const { dataset } = button;
  const state = dataset.notificationPopoverState;

  if (state !== 'open') {
    dataset.notificationPopoverState = 'open';
    window.setTimeout(() => document.addEventListener('click', closePopover), 200);

    const popover = newNotificationPopover(clientX, clientY);
    button.insertAdjacentElement('afterend', popover);

    ({ comments, posts, projects, sortedNotifications } = await getSortedNotifications());
    popover.replaceChildren(noact({
      tag: 'section',
      className: 'col-span-1 flex flex-col gap-8 lg:col-span-2',
      children: Object.keys(sortedNotifications).map(date => newNotificationPage(date, sortedNotifications[date]))
    }));
  } else {
    dataset.notificationPopoverState = '';
    document.removeEventListener('click', closePopover);
    $(`.${customClass}`).remove();
  }
};

export const main = async () => document.querySelector(buttonSelector).addEventListener('click', onNotificationButtonClick);

export const clean = async () => {
  document.querySelector(buttonSelector).removeEventListener('click', onNotificationButtonClick);
  $(`.${customClass}`).remove();
};