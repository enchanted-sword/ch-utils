import { noact } from './utils/noact.js';
import { postBoxTheme, batchTrpc } from './utils/apiFetch.js';
import { activeProject } from './utils/user.js';
import { getOptions } from './utils/jsTools.js';
import { parseMd, parseMdNoBr } from './utils/markdown.js';
import { mutationManager } from './utils/mutation.js';

// eslint-disable-next-line no-undef
const { DateTime } = luxon;
let numFetch, highlightUnread, showTags, wrapAvatars;
const buttonSelector = '[href="https://cohost.org/rc/project/notifications"]';
const smListSelector = 'ul[role="menu"][class~="lg\:hidden"]';
const customClass = 'ch-utils-popoverNotifications';
const app = document.getElementById('app');

const dateFormat = { weekday: 'long', month: 'long', day: 'numeric' };

const getTransformedNotifications = async () => {
  let comments, posts, projects, notifications;
  let count = 0;
  numFetch = Number(numFetch);
  const sortedNotifications = {};

  if (highlightUnread) {
    ([{ count }] = await batchTrpc(['notifications.count'], { 0: { projectHandle: activeProject.handle } }));
    count = Math.min(count, numFetch);
    const remainder = numFetch - count;
    const [unreadNotifications] = await batchTrpc(['notifications.list'], { 0: { limit: count } });

    unreadNotifications.notifications.forEach(function (notification) { notification.unread = true });

    if (remainder > 0) {
      const [readNotifications] = await batchTrpc(['notifications.list'], { 0: { limit: remainder, cursor: unreadNotifications.nextCursor } });
      unreadNotifications.notifications.push(...readNotifications.notifications);
      ['comments', 'posts', 'projects'].forEach(function (key) {
        unreadNotifications[key] = Object.assign(unreadNotifications[key], readNotifications[key]);
      });
    }

    ({ comments, posts, projects, notifications } = unreadNotifications);
  } else ([{ comments, posts, projects, notifications }] = await batchTrpc(['notifications.list'], { 0: { limit: numFetch } }));

  notifications = structuredClone(notifications).map(notification => {
    notification.time = DateTime.fromISO(notification.createdAt).toMillis();
    return notification;
  });

  if (showTags) {
    const newShareNotifications = [];

    notifications.filter(({ type }) => type === 'groupedShare').map(notification => {
      const newShareNotificationIds = [];
      notification.sharePostIds.map(shareId => {
        const post = posts[shareId];

        if (typeof post !== 'undefined' && post.tags.length) {
          const postISO = post.publishedAt;
          const postTime = DateTime.fromISO(postISO).toMillis();
          newShareNotifications.push({
            createdAt: postISO,
            fromProjectId: post.postingProject.projectId,
            toPostId: post.transparentShareOfPostId,
            sharePostId: shareId,
            transparentShare: true,
            type: 'groupedShare',
            time: postTime,
            unread: (notification.unread && postTime >= notification.time) ? true : false
          });
          newShareNotificationIds.push(post.postingProject.projectId);
        }
      });
      if (newShareNotificationIds.length) {
        if ('fromProjectId' in notification) {
          notifications.splice(notifications.indexOf(notification), 1);
        } else {
          newShareNotificationIds.map(id => notifications[notifications.indexOf(notification)].fromProjectIds.splice(notification.fromProjectIds.indexOf(id), 1));
        }
      }
    });

    notifications.push(...newShareNotifications);
    notifications.filter(({ fromProjectIds }) => {
      if (fromProjectIds) return !!fromProjectIds.length;
      else return true;
    }).sort((a, b) => b.time - a.time);
  }

  notifications.forEach(notification => {
    if (!notification) return;

    if (notification.fromProjectIds
      && notification.fromProjectIds.constructor.name === 'Array' 
      && notification.fromProjectIds.length === 1) notification.fromProjectId = notification.fromProjectIds[0];
    if ('fromProjectId' in notification) notification.grouped = false
    else notification.grouped = true;

    notification.targetPost = posts[notification.toPostId];
    notification.sharePost = posts[notification.sharePostId];
    notification.comment = comments[notification.commentId]?.comment;
    notification.replyTo = comments[notification.inReplyTo]?.comment;
    if (typeof notification.replyTo !== 'undefined') notification.replyTo.projectId = comments[notification.inReplyTo].poster.projectId;

    if (notification.sharePostId && typeof notification.sharePost === 'undefined') return null; // the api will serve you notifications from blocked/deleted projects but not posts, so this results in an error
    if (notification.toPostId && typeof notification.targetPost === 'undefined') return null; // cohost doesn't delete notifications attached to deleted posts, so we have to trim them out manually

    if (notification.replyTo) notification.type = 'reply';

    notification.hasBody = ['share', 'comment', 'reply'].includes(notification.type);
    notification.hasTags = (notification.sharePost && notification.sharePost.tags.length) ? true : false;

    if (notification.grouped) notification.notifyingProjects = notification.fromProjectIds.map(projectId => projects[projectId]);
    else notification.notifyingProject = projects[notification.fromProjectId];

    notification.id = `${btoa(notification.createdAt + notification.type)}`;

    let notifier, interaction, preview;

    notifier = notification.grouped ? {
      tag: 'span',
      className: 'hover:underline cursor-pointer',
      dataset: { active: '' },
      onclick: function(event) {
        event.stopImmediatePropagation();
        this.dataset.active ? this.dataset.active = '' : this.dataset.active = 'true';
      },
      children: ['Several pages']
    } : {
      href: `https://cohost.org/${notification.notifyingProject.handle}`,
      className: 'font-bold hover:underline',
      children: [`@${notification.notifyingProject.handle}`]
    };
    interaction = interactionMap(notification);

    switch (notification.type) {
      case 'comment':
        preview = newBodyPreview(notification.targetPost);
        break;
      case 'reply':
        preview = newBodyPreview(notification.targetPost, notification.replyTo);
        break
      case 'groupedFollow':
        preview = undefined;
        break;
      default: 
        preview = newBodyPreview(notification.targetPost);
    }
    notification.preview = preview;

    notification.lineOfAction = [notifier, interaction];

    const time = DateTime.fromISO(notification.createdAt);
    const date = time.toISODate({ format: 'basic' });
    if (!(date in sortedNotifications)) sortedNotifications[date] = [];
    sortedNotifications[date].push(notification);
  });

  return sortedNotifications;
};

const pathMap = {
  like: {
    d: 'M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z'
  },
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
  },
  reply: {
    'fill-rule': 'evenodd',
    'clip-rule': 'evenodd',
    d: 'M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z'
  }
};
const interactionMap = notification => { // VERBS
  let reshare = false;
  let replyToOwnComment = false;
  let yourPost = notification.targetPost;
  if (notification.targetPost && !notification.targetPost.isEditor) {
    reshare = true;
    yourPost = notification.targetPost.shareTree.findLast(share => share.postingProject.projectId === activeProject.projectId);
  }
  if (notification.replyTo && (notification.replyTo.projectId === activeProject.projectId)) replyToOwnComment = true;

  const targetUrl = notification?.targetPost?.singlePostPageUrl || '';
  const yourUrl = yourPost?.singlePostPageUrl || '';
  const shareUrl = notification?.sharePost?.singlePostPageUrl || '';

  try {
    switch (notification.type) {
      case 'groupedLike':
      case 'groupedShare':
        return [
          {
            tag: 'span',
            children: [notification.type === 'groupedLike' ? 'liked ' : 'shared ']
          },
          reshare ? [
            {
              href: targetUrl,
              className: 'font-bold hover:underline',
              children: ['a share']
            },
            ['of']
          ] : null,
          {
            href: yourUrl,
            className: 'font-bold hover:underline',
            children: ['your post']
          }
        ];
      case 'share':
        return [
          {
            tag: 'span',
            children: [' shared ']
          },
          reshare ? [
            {
              href: targetUrl,
              className: 'font-bold hover:underline',
              children: ['a share']
            },
            ['of']
          ] : null,
          {
            href: yourUrl,
            className: 'font-bold hover:underline',
            children: ['your post']
          },
          {
            href: shareUrl,
            className: 'font-bold hover:underline',
            children: ['and added']
          },
        ];
      case 'groupedFollow':
        return {
          tag: 'span',
          children: ['followed you']
        };
      case 'comment':
        return [
          {
            tag: 'span',
            children: ['left']
          },
          {
            href: notification.targetPost ? `${targetUrl}#comment-${notification.comment.commentId}` : '',
            className: 'font-bold hover:underline',
            children: ['a comment']
          },
          'on',
          {
            href: yourUrl,
            className: 'font-bold hover:underline',
            children: ['your post']
          }
        ];
      case 'reply':
        return [
          {
            href: notification.targetPost ? `${targetUrl}#comment-${notification.comment.commentId}` : '',
            className: 'font-bold hover:underline',
            children: ['replied']
          },
          'to',
          replyToOwnComment ? {
            href: notification.targetPost ? `${targetUrl}#comment-${notification.replyTo.commentId}` : '',
            className: 'font-bold hover:underline',
            children: ['your comment']
          } : [
            {
              href: notification.targetPost ? `${targetUrl}#comment-${notification.replyTo.commentId}` : '',
              className: 'font-bold hover:underline',
              children: ['a comment']
            },
            'on',
            {
              href: notification.targetPost ? `${targetUrl}#comment-${notification.replyTo.commentId}` : '',
              className: 'font-bold hover:underline',
              children: ['your post']
            }
          ],
        ];
    }
  }
  catch (e) {console.error(e, notification)}
};

const imageRegex = /<img\s[^>]+>/g;

const newIcon = type => {return {
  viewBox: '0 0 24 24',
  className: 'h-6 w-6 flex-none',
  fill: 'currentColor',
  'aria-hidden': true,
  children: [pathMap[type]]
}};
const newAvatar = project => {
  if (project) return { // we need to check for deleted or otherwise missing projects, their ids are still present in fromProjectIds but the actual project is undefined
    className: `${customClass}-avatar flex flex-row gap-2`,
    children: [
      {
        className: 'flex-0 mask relative aspect-square h-8 w-8',
        href: `https://cohost.org/${project.handle}`,
        title: `@${project.handle}`,
        children: [{
          className: `mask mask-${project.avatarShape} h-full w-full object-cover`,
          alt: project.handle,
          src: `${project.avatarURL}?dpr=2&amp;width=80&amp;height=80&amp;fit=cover&amp;auto=webp`
        }]
      },
      {
        className: `${customClass}-handle font-bold hover:underline`,
        href: `https://cohost.org/${project.handle}`,
        children: [`@${project.handle}`]
      }
    ]
  };
};
const newBodyPreview = (post, replyTo = null) => { // PREVIEW LINE
  let body, htmlBody, previewImage, previewLine;
  let { headline, plainTextBody } = post;
  headline && (headline = headline.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));

  if (post.blocks.some(block => block?.attachment?.kind === 'image')) { // generate preview image from attachment
    const { attachment } = post.blocks.find(block => block?.attachment?.kind === 'image');
    previewImage = {
      className: 'cohost-shadow-light aspect-square h-8 w-8 rounded-lg object-cover',
      src: attachment.previewURL,
      alt: attachment.altText,
      filename: attachment.previewURL.split('/').pop()
    };
  }
  if (replyTo) ({ body } = replyTo);
  else {
    if (!previewImage && plainTextBody) {
      const extractedString = imageRegex.exec(parseMdNoBr(plainTextBody));
      if (extractedString && extractedString.length) { // generate preview image from markdown
        const extractedImage = $(extractedString[0])[0];
        previewImage = {
          className: 'cohost-shadow-light aspect-square h-8 w-8 rounded-lg object-cover',
          src: extractedImage.src,
          alt: extractedImage.alt,
          filename: extractedImage.src.split('/').pop()
        };
        plainTextBody = parseMdNoBr(plainTextBody).replaceAll(imageRegex, '');
      }
    }
    
    body = plainTextBody;
  }
  htmlBody = headline || parseMdNoBr(body);

  previewLine = noact({
    className: "co-inline-quote max-h-60 flex-1 truncate before:content-['“'] after:content-['”']",
    children: [{
      className: 'inline-children hover:underline',
      href: `${post.singlePostPageUrl}${replyTo ? `#comment-${replyTo.commentId}` : ''}`,
      innerHTML: htmlBody
    }]
  });
  if (!previewLine.querySelector('.inline-children').textContent) {
    if (previewImage) previewLine.querySelector('.inline-children').textContent = `[image: ${previewImage.alt || previewImage.filename}]`;
    else previewLine.querySelector('.inline-children').textContent = '[no text]';
  }

  return { previewImage, previewLine };
};

const newNotification = notification => {
  let body, headline, plainTextBody;
  if (notification.hasBody) {
    notification.sharePost && ({ headline, plainTextBody } = notification.sharePost);
    if (notification.sharePost && (headline || plainTextBody)) {
      if (headline && plainTextBody) body = `${headline}\n\n${plainTextBody}`;
      else if (headline) body = headline;
      else body = plainTextBody;
    } else if (notification.comment) body = notification.comment.body
    else body = '[no text]';
  }
  return [
    {
      className: `${customClass}-notifier flex w-full flex-row flex-nowrap align-center items-center gap-3`,
      children: [
        newIcon(notification.type),
        notification.grouped ? '' : newAvatar(notification.notifyingProject),
        {
          className: 'flex w-full max-23 flex-col',
          children: [{
            className: 'flex w-full flex-1 flex-row flex-wrap overflow-auto gap-space',
            children: notification.lineOfAction
          }]
        },
        notification.preview && notification.preview.previewImage ? notification.preview.previewImage : ''
      ]
    },
    notification.preview ? notification.preview.previewLine : '',
    notification.grouped ? {
      className: `${customClass}-groupAvatars flex flex-col gap-4`,
      children: [{
        className: `mt-2 flex flex-row flex-nowrap items-center gap-3 overflow-hidden`,
        children: [{
          className: `${customClass}-groupAvatarsInner flex flex-row ${wrapAvatars ? 'flex-wrap' : 'flex-nowrap'} gap-2 overflow-hidden`,
          children: notification.notifyingProjects.map(project => newAvatar(project))
        }]
      }]
    } : [
      notification.hasBody ? {
        className: 'co-block-quote block-children ml-20 break-words border-l-2 pl-2 italic',
        innerHTML: parseMd(body)
      } : '',
      notification.hasTags ? {
        className: 'relative w-full overflow-y-hidden break-words leading-none co-inline-quote',
        children: [{
          children: notification.sharePost.tags.map(tag => {return {
            href: `/rc/tagged/${tag}`,
            className: 'mr-2 inline-block text-sm hover:underline',
            children: [`#${tag}`]
          };})
        }]
      } : ''
    ]
]};
const newNotificationCard = notification => {return {
  className: 'co-notification-card flex flex-col p-3',
  dataset: { unread: notification.unread ? true : false }, // sneakily converting undefined to false for aesthetics purposes
  children: [newNotification(notification)] // this can conditionally return an array, however noact will automatically flatten the array to a single level to prevent issues
}};
const newNotificationPage = (date, notifications, theme) => {return {
  className: 'co-themed-box co-notification-group flex flex-col divide-y',
  dataset: { theme },
  children: [
    {
      tag: 'header',
      className: 'flex flex-row items-center justify-end p-3 header-sticky',
      children: [{
        className: 'font-league text-xs uppercase',
        dateTime: date,
        children: [DateTime.fromISO(date).toLocaleString(dateFormat)]
      }]
    },
    ...notifications.map(notification => notification ? newNotificationCard(notification) : null)
  ]
}};
const newNotificationPopover = (clientX, clientY, theme) => {
  const popover = noact({
    className: `${customClass} ch-utils-popover`,
    style: `top: ${clientY + 16}px; left: ${clientX}px;`,
    children: [
      {
        tag: 'header',
        dataset: { theme },
        children: [{
          href: '/rc/project/notifications',
          className: 'font-bold hover:underline',
          children: ['notifications']
        }]
      },
      {
        tag: 'span',
        className: 'loader'
      }
    ]
  });

  return popover;
};

const closePopover = () => {
  if ($(`${buttonSelector}:hover, .${customClass}:hover`).length === 0) {
    document.querySelector(buttonSelector).click();
    document.removeEventListener('click', closePopover);
  }
};
const onNotificationButtonClick = async function(event) {
  event.preventDefault();
  event.stopImmediatePropagation();

  const { target, clientX, clientY } = event;
  const button = target.closest(buttonSelector);
  const smList = document.querySelector(smListSelector);
  const { dataset } = button;
  const state = dataset.notificationPopoverState;

  if (state !== 'open' && button.scrollHeight) {
    dataset.notificationPopoverState = 'open';
    window.setTimeout(() => document.addEventListener('click', closePopover), 200);

    const popover = newNotificationPopover(clientX, clientY, postBoxTheme);

    if (smList) {
      const beforeItem = document.querySelector(`${buttonSelector} + a`);
      smList.insertBefore(popover, beforeItem);
    } else app.append(popover);

    const notifications = await getTransformedNotifications();
    popover.querySelector('.loader').replaceWith(noact({
      tag: 'section',
      className: 'flex flex-col',
      children: Object.keys(notifications).sort((a, b) => Number(b) - Number(a)).map(date => newNotificationPage(date, notifications[date], postBoxTheme)) // otherwise it will always be backwards because of how entries are ordered
    }));
  } else {
    dataset.notificationPopoverState = '';
    document.removeEventListener('click', closePopover);
    $(`.${customClass}`).remove();
  }
};

const addPopovers = buttons => {
  for (const button of buttons) {
    button.addEventListener('click', onNotificationButtonClick);
  }
}

export const main = async () => {
  ({ numFetch, highlightUnread, showTags, wrapAvatars } = await getOptions('popoverNotifications'));

  mutationManager.start(buttonSelector, addPopovers);
};

export const clean = async () => {
  mutationManager.stop(addPopovers);
  $(`.${customClass}`).remove();

  const button = document.querySelector(buttonSelector);
  button.removeEventListener('click', onNotificationButtonClick);
  button.dataset.notificationPopoverState = '';
  document.removeEventListener('click', closePopover);
};