import { apiFetch, followState, activeProjectId } from './utils/apiFetch.js';
import { noact } from './utils/noact.js';
import { getOptions } from './utils/jsTools.js';

const boxSelector = '.co-themed-box';
const headerSelector = '.co-themed-box > h1';
const customClass = 'ch-utils-followers';

const activeProject = await activeProjectId();
const states = [
  'follow',
  'cancel follow request',
  'unfollow'
];
const followCancelOrUnfollow = [
  'createFollowRequest',
  'declineOrCancelFollowRequest',
  'unfollow'
]
const followCancelOrUnfollowRequest = async (state, toProjectId) => apiFetch(`/v1/trpc/relationships.${followCancelOrUnfollow[state]}`, {
  method: 'POST',
  queryParams: { batch: 1 },
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    0: { fromProjectId: activeProject, toProjectId } 
  })
});

const limit = 500;

const countElement = $('<span>', { class: `follow-count ${customClass}` });
const loader = $(`<span class='counter-loading ${customClass}'>(counting<span class='loader'></span>)</span>`);
const loaderButtonPlaceholder = $(`
  <button class="${customClass} load-all flex h-12 max-w-xs items-center justify-center rounded-lg bg-foreground px-6 text-lg text-text hover:bg-foreground-600 active:bg-foreground-700 disabled:bg-foreground-200">
    <span class="spinner"></span>
  </button>
`);
const loaderButton = followers => noact({
  className: `${customClass} load-all flex h-12 max-w-xs items-center justify-center rounded-lg bg-foreground px-6 text-lg text-text hover:bg-foreground-600 active:bg-foreground-700 disabled:bg-foreground-200`,
  onclick: async ({ target }) => {
    target.innerHTML = '<span class="spinner"></span>';
    await Promise.all(followers.map(async (project, index) => {
      if ($(`.co-project-handle[href='https://cohost.org/${project.handle}']`).length) return;
      project.followState = await followState(project.handle);
      $('.co-themed-box .mt-6').append(followCard(project));
    }));
    $('.max-w-xs').css('display', 'none');
  },
  children: ['load all']
});
const lockIcon = () => { 
  return {
    viewBox: '0 0 25 18',
    style: 'fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 2;',
    className: 'cohost-shadow-light dark:cohost-shadow-dark absolute -bottom-1 -right-1 h-5 fill-foreground-500 text-notWhite',
    children: [
      {
        d: 'M14.923 17.087c-2.254.666-4.388.967-6.402.905-2.014-.062-3.742-.532-5.183-1.409-1.442-.877-2.436-2.217-2.982-4.022-.549-1.814-.463-3.476.257-4.985.719-1.51 1.905-2.832 3.557-3.965C5.823 2.478 7.776 1.578 10.03.913c2.243-.663 4.369-.965 6.376-.906 2.007.059 3.733.523 5.178 1.394 1.446.87 2.441 2.207 2.987 4.011.546 1.804.457 3.464-.266 4.981-.724 1.516-1.908 2.845-3.551 3.987-1.644 1.143-3.588 2.045-5.831 2.707Z',
        style: 'fill-rule: nonzero;'
      },
      {
        tag: 'g',
        'transform-origin': 'center center',
        transform: 'scale(0.6 0.6) rotate(0)',
        children: [{
          viewBox: '0 0 24 24',
          fill: 'currentColor',
          'aria-hidden': 'true',
          children: [{
            'fill-rule': 'evenodd',
            d: 'M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z',
            'clip-rule': 'evenodd'
          }]
        }]
      }
    ]
  };
};
const followCard = project => noact({ className: `${customClass} flex flex-row items-center gap-1`, children: [
  {
    href: `https://cohost.org/${project.handle}`,
    className: 'flex-0 mask relative aspect-square h-16 w-16 hidden lg:block cohost-shadow-light dark:cohost-shadow-dark',
    title: `@${project.handle}`,
    children: [
      {
        src: project.avatarURL,
        className: `mask mask-${project.avatarShape} h-full w-full object-cover`,
        alt: project.handle
      }, 
      project.privacy === 'private' ? lockIcon() : ''
    ]
  },
  {
    className: 'min-w-0 flex-shrink justify-center gap-0 lg:flex-row',
    children: [
      {
        className: 'items-left flex flex-shrink flex-row gap-1 lg:flex-col',
        children: [
          {
            rel: 'author',
            href: `https://cohost.org/${project.handle}`,
            className: 'co-project-display-name max-w-full flex-shrink truncate font-atkinson font-bold hover:underline',
            title: project.displayName,
            children: [project.displayName]
          },
          {
            href: `https://cohost.org/${project.handle}`,
            className: 'co-project-handle font-atkinson font-normal hover:underline',
            title: `@${project.handle}`,
            children: [`@${project.handle}`]
          }
        ]
      },
      {
        children: [project.dek]
      }
    ]
  },
  {
    className: 'flex-grow'
  },
  {
    className: 'leading-none align-middle py-2 px-4 no-select font-atkinson font-bold rounded-full border-2 border-cherry hover:bg-cherry text-cherry active:bg-cherry-600 active:border-cherry-600 disabled:text-cherry-300 disabled:border-cherry-300 focus:outline-cherry focus:ring-cherry bg-notWhite hover:text-notWhite',
    onclick: async ({ target }) => {
      const state = await followState(project.handle);
      
      followCancelOrUnfollowRequest(state, project.projectId).then(([followingState]) => {
        if (followingState === 2) {
          target.innerText = 'unfollow';
        } else if (followingState === 1) {
          target.innerText = 'cancel follow request';
        } else if (project.privacy === 'private') {
          target.innerText = 'send follow request';
        } else target.innerText = 'follow';
      });
    },
  
    children: [project.followState === 0 ? (project.privacy === 'private' ? 'send follow request' : 'follow') : states[project.followState]]

  }
]});

const countFollowers = async () => {
  let offset = 0;
  let projects = [];
  let total = [];

  ({ projects } = await apiFetch('/v1/projects/followers', { method: 'GET', queryParams: { offset, limit } }));
  total.push(...projects);
  while (projects.length === limit) {
    offset += projects.length;
    ({ projects } = await apiFetch('/v1/projects/followers', { method: 'GET', queryParams: { offset, limit } }));
    total.push(...projects);
  }
  return total;
};

export const main = async () => {
  const { count, loadAll } = await getOptions('followers');
  if (location.pathname !== '/rc/project/followers' || (!count && !loadAll)) return;

  if (count) {
    $(headerSelector).prepend(countElement);
    $(headerSelector).append(loader);
  }
  if (loadAll) $(boxSelector).append(loaderButtonPlaceholder);

  const followers = await countFollowers();

  if (count) {
    countElement.text(followers.length);
    loader.remove();
  }
  if (loadAll) loaderButtonPlaceholder.replaceWith(loaderButton(followers));
};

export const clean = async () => $(`.${customClass}`).remove();