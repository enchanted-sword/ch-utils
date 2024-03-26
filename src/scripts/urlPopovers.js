import { activeProjectId, apiFetch, followState } from './utils/apiFetch.js';
import { postFunction } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { noact } from './utils/noact.js';
import { getProject } from './utils/darkWorld.js';

const anchorSelector = 'a[href^="https://cohost.org/"]:not([href="https://cohost.org/"],[href^="https://cohost.org/rc"],[href*="/post/"],[data-url-popovers])';
const customClass = 'ch-utils-urlPopovers';
const customAttribute = 'data-url-popovers';

const activeProject = await activeProjectId();
const removePopoverDelay = 300;
const discriminator = () => Math.round(Math.random() * 100000);
const k = str => str.split(' ').map(key => `urlPopover-${key}`).join(' ');
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

const displayPopover = async event => {
  const { project, targetId } = event.target.closest('a');
  const { bottom, left, width } = event.target.getBoundingClientRect();
  const xPos = left + width / 2;
  const yPos = bottom + window.scrollY;
  const popover = await urlPopover(project, targetId, xPos, yPos);
  document.body.append(popover);
};
const removePopover = event => {
  window.setTimeout(() => {
    const { targetId } = event.target.closest('a');
    const popover = document.getElementById(targetId);
    if (popover && !popover.matches(':hover')) {
      popover.style.opacity = 0;
      window.setTimeout(() => { popover.remove() }, 150);
    }
  }, removePopoverDelay);
};
const popoverSelfRemove = event => {
  event.stopPropagation();
  const popover = event.target.closest('.urlPopover-baseContainer');
  window.setTimeout(() => {
    if (!popover.matches(':hover')) {
      popover.style.opacity = 0;
      window.setTimeout(() => { popover.remove() }, 150);
    }
  }, removePopoverDelay);
};

const urlPopover = async (project, targetId, xPos, yPos) => {
  if (document.getElementById(targetId)) return;

  const projectURL = `/${project.handle}`;
  project.followState = await followState(project.handle);

  return noact({
    className: `${k('baseContainer')} ${customClass}` + ' w-full absolute top-0',
    id: targetId,
    tabindex: 0,
    role: 'group',
    children: [{
      className: k('holder'),
      style: `transform: translate(${xPos - 140}px, ${yPos + 10}px);`,
      children: [{
        className: k('card') + ' cohost-shadow-light cohost-shadow-dark flex flex-col bg-cherry text-notWhite w-full h-full overflow-hidden rounded-lg',
        onmouseleave: popoverSelfRemove,
        children: [
          {
            tag: 'header',
            className: 'flex flex-row justify-between items-center p-3',
            children: [
              {
                className: 'co-project-display-name text-notWhite w-full flex-shrink truncate font-atkinson font-bold hover:underline',
                rel: 'author',
                target: '_blank',
                title: `@${project.handle}`,
                href: projectURL,
                children: [`@${project.handle}`]
              },
              activeProject !== project.projectId ? {
                className: 'leading-none align-middle py-2 px-4 no-select font-atkinson font-bold rounded-full border-2 border-cherry hover:bg-cherry text-cherry active:bg-cherry-600 active:border-cherry-600 disabled:text-cherry-300 disabled:border-cherry-300 focus:outline-cherry focus:ring-cherry bg-notWhite hover:text-notWhite text-sm hover:border-accent',
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
              } : null
            ]
          },
          project.headerURL ? {
            className: k('header'),
            rel: 'author',
            target: '_blank',
            title: `@${project.handle}`,
            href: projectURL,
            children: [{
              src: project.headerURL
            }]
          } : null,
          {
            className: k('avatar') + ' flex justify-center items-center w-full h-0 relative',
            children: [{
              className: 'lg:block flex-0 mask absolute aspect-square h-16 w-16',
              title: `@${project.handle}`,
              rel: 'author',
              target: '_blank',
              href: projectURL,
              children: [{
                className: `mask mask-${project.avatarShape} h-full w-full object-cover bg-cherry`,
                src: project.avatarURL
              }]
            }]
          },
          {
            className: k('description') + ' p-3 text-center',
            children: [
              project.displayName ? {
                className: 'text-lg font-bold',
                children: [project.displayName]
              } : null,
              project.dek ? project.dek : null
            ]
          }
        ]
      }]
    }]
  });
};

const attachPopover = (anchor, project) => {
  const uuid = `urlPopover-${project.projectId}-${discriminator()}`;
  anchor.project = project;
  anchor.targetId = uuid;
  anchor.dataset.urlPopovers = '';

  anchor.addEventListener('mouseenter', displayPopover);
  anchor.addEventListener('mouseleave', removePopover);
};

const addPopoversInPosts = async posts => {
  for (const post of posts) {
    if (post.matches(`[${customAttribute}]`)) return;
    post.setAttribute(customAttribute, '');

    const { postingProject, shareTree } = await getViewModel(post);
    const projects = [postingProject, ...shareTree.map(obj => obj.postingProject)];

    projects.map(project => {
      post.querySelectorAll(`[href*="https://cohost.org/${project.handle}"]:is(.co-project-handle,.co-project-display-name)`).forEach(anchor => attachPopover(anchor, project));
    });
  }
};

export const main = async () => {
  postFunction.start(addPopoversInPosts);

  const anchors = document.querySelectorAll(anchorSelector);

  for (const anchor of anchors) {
    const handle = anchor.href.split('https://cohost.org/')[1];
    if (!handle) continue;
    
    const { project } = await getProject(handle);
    attachPopover(anchor, project);
  }
};

export const clean = async () => {
  postFunction.stop(addPopoversInPosts);

  $(`.${customClass}`).remove();
  $(`[${customAttribute}]`).removeAttr(customAttribute);
}