import { apiFetch, displayPrefs } from './utils/apiFetch.js';
import { noact } from './utils/noact.js';
import { DateTime } from '../lib/luxon.min.js';

const numFetch = 600;
const customClass = 'ch-utils-notifMetrics';
const boxSelector = '.co-notification-group.co-filter-controls:not([data-headlessui-state])';
const { defaultPostBoxTheme } = await displayPrefs();
const dateFormat = { weekday: 'long', month: 'long', day: 'numeric' };

const interactionMap = {
  'groupedLike': 'likes',
  'share': 'shares',
  'groupedShare': 'shares',
  'groupedFollow': 'follows',
  'comment': 'comments',
  'reply': 'replies'
};
const getMappedNotifications = async () => {
  const { notifications, posts } = await apiFetch(`/v1/notifications/list?limit=${numFetch}`);
  const map = {};
  const dateMap = {};

  notifications.map(notification => {
    const id = notification.toPostId;
    const date = notification.createdAt.split('T')[0];

    if (!(id in map)) {
      map[id] = {
        count: 0,
        post: posts[id] || null,
        notifications: {
          likes: [],
          shares: [],
          replies: [],
          comments: [],
          follows: []
        }
      };
    }
    if ('fromProjectIds' in notification) map[id].notifications[interactionMap[notification.type]].push(...notification.fromProjectIds);
    else map[id].notifications[interactionMap[notification.type]].push(notification.fromProjectId);

    if (!(date in dateMap)) {
      dateMap[date] = {
        count: 0,
        notifications: {
          likes: [],
          shares: [],
          replies: [],
          comments: [],
          follows: []
        }
      };
    }
    if ('fromProjectIds' in notification) dateMap[date].notifications[interactionMap[notification.type]].push(...notification.fromProjectIds);
    else dateMap[date].notifications[interactionMap[notification.type]].push(notification.fromProjectId);
  });

  Object.keys(map).map(id => {
    Object.keys(map[id].notifications).map(function (type) {map[id].count += map[id].notifications[type].length});
  });

  Object.keys(dateMap).map(date => {
    Object.keys(dateMap[date].notifications).map(function(type) {dateMap[date].count += dateMap[date].notifications[type].length});
  });

  console.log(map,dateMap);
  return([map, dateMap]);
};

const newDayPanel = (date, day, index, theme) => noact({
  className: 'co-themed-box co-notification-group co-filter-controls cohost-shadow-light dark:cohost-shadow-dark col-span-1 flex h-fit max-h-max min-h-0 flex-col divide-y rounded-lg hidden lg:block',
  dataset: { theme },
  children: [
    {
      tag: 'header',
      className: 'flex flex-row items-center justify-end rounded-t-lg p-3',
      children: [{
        tag: 'span',
        className: 'font-league text-xs uppercase',
        children: [index ? DateTime.fromISO(date).toLocaleString(dateFormat) : 'today']
      }]
    },
    {
      tag: 'ul',
      className: 'flex-col divide-y',
      children: Object.keys(day.notifications).map(type => {return {
        tag: 'li',
        children: [{
          'tag': 'span',
          className: 'flex items-center justify-between gap-3 px-3 py-2 font-bold',
          children: [
            type,
            {
              tag: 'span',
              children: [day.notifications[type].length ? day.notifications[type].length : '-']
            }
          ]
        }]
      }})
    }
  ]
});

export const main = async () => {
  if (location.pathname !== '/rc/project/notifications') return;

  $(boxSelector).wrap($('<div>', { class: `${customClass} notifMetrics-wrapper flex flex-col gap-y-8` }));
  const [map, dayMap] = await getMappedNotifications();
  await Promise.all(Object.keys(dayMap).map((day, index) => {
    $(`.${customClass}.notifMetrics-wrapper`).append($(newDayPanel(day, dayMap[day], index, defaultPostBoxTheme)));
  }));
};

export const clean = async () => {
  $(`.${customClass}.notifMetrics-wrapper`).replaceWith($(boxSelector));
  $(`.${customClass}`).remove();
};