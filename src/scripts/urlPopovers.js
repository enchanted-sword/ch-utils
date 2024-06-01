import { apiFetch, followState, getProject } from './utils/apiFetch.js';
import { activeProject } from './utils/user.js';
import { mutationManager, postFunction } from './utils/mutation.js';
import { getViewModel } from './utils/react.js';
import { noact } from './utils/noact.js';
import { parseMd } from './utils/markdown.js';
import { getOptions } from './utils/jsTools.js';

let showDescriptions;

const customClass = 'ch-utils-urlPopovers';
const customAttribute = 'data-url-popovers';
const anchorSelector = `a[href^="https://cohost.org/"]:not([href="https://cohost.org/"],[href^="https://cohost.org/rc"],[href*="/post/"],[href$="/ask"],[href*="/tagged/"],[${customAttribute}])`;

const addPopoverDelay = 100;
const removePopoverDelay = 300;
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
    0: { fromProjectId: activeProject.projectId, toProjectId } 
  })
});

const displayPopover = async event => {
  window.setTimeout(async () => {
    if (!event.target.matches(':hover')) return;

    const { project, href } = event.target.closest('a');
    const { bottom, left, width } = event.target.getBoundingClientRect();
    const xPos = left + width / 2;
    const yPos = bottom + window.scrollY;

    let popover = document.getElementById('urlPopover');
    if (popover) {
      if (popover.targetLink === href) return;
      else popover.remove();
    }
    popover = await urlPopover(project, xPos, yPos, href);
    document.body.append(popover);
  }, addPopoverDelay);
};
const removePopover = () => {
  /* window.setTimeout(() => {
    const popover = document.getElementById('urlPopover');
    if (popover) {
      const projectLinks = Array.from(document.querySelectorAll(`[href='${popover.targetLink}']`));
      if (!popover.matches(':hover') && !projectLinks.some(link => link.matches(':hover'))) {
        popover.style.opacity = 0;
        window.setTimeout(() => { popover.remove() }, 150);
      }
    }
  }, removePopoverDelay); */
};

const urlPopover = async (project, xPos, yPos, targetLink) => {
  const projectURL = `/${project.handle}`;
  project.followState = await followState(project.handle);

  return noact({
    className: `${k('baseContainer')} ${customClass}` + ' h-0 w-full absolute top-0',
    id: 'urlPopover',
    targetLink,
    tabindex: 0,
    role: 'group',
    children: [{
      className: k('holder'),
      style: `transform: translate(${xPos - 140}px, ${yPos + 10}px);`,
      children: [{
        className: k('card') + ' cohost-shadow-light cohost-shadow-dark flex flex-col bg-cherry text-notWhite w-full h-full overflow-hidden rounded-lg',
        onmouseleave: removePopover,
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
              activeProject.projectId !== project.projectId ? {
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
            children: [
              activeProject.projectId !== project.projectId ? {
                className: k('ask') + ' absolute leading-none align-middle py-1 px-1 no-select font-atkinson font-bold rounded-full border-2 border-cherry hover:bg-cherry text-cherry active:bg-cherry-600 active:border-cherry-600 disabled:text-cherry-300 disabled:border-cherry-300 focus:outline-cherry focus:ring-cherry bg-notWhite hover:text-notWhite text-sm hover:border-accent',
                href: `${projectURL}/ask`,
                rel: 'author',
                target: '_blank',
                children: [{
                  className: 'h-6 w-6',
                  viewBox: '0 0 24 24',
                  fill: 'none',
                  stroke: 'currentColor',
                  'stroke-width': '1.5',
                  'aria-hidden': true,
                  children: [{
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                    d: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z'
                  }]
                }]
              } : null,
              {
                className: 'lg:block flex-0 mask absolute aspect-square h-16 w-16',
                title: `@${project.handle}`,
                rel: 'author',
                target: '_blank',
                href: projectURL,
                children: [{
                  className: `mask mask-${project.avatarShape} h-full w-full object-cover bg-cherry`,
                  src: project.avatarURL
                }]
              }
            ]
          },
          {
            className: k('description') + ' p-3 text-center',
            children: [
              project.displayName ? {
                className: 'text-lg font-bold',
                children: [project.displayName]
              } : null,
              project.pronouns || project.url ? {
                tag: 'ul',
                className: 'break-word mb-2 mt-2 flex min-w-0 flex-row flex-wrap justify-center gap-x-3 text-sm lg:flex-row',
                children: [
                  project.pronouns ? {
                    tag: 'li',
                    children: [
                      {
                        viewBox: '0 0 24 24',
                        fill: 'currentColor',
                        'aria-hidden': true,
                        className: 'inline-block h-4 text-accent',
                        children: [{
                          'fill-rule': 'evenodd',
                          'clip-rule': 'evenodd',
                          d: 'M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z'
                        }]
                      },
                      project.pronouns
                    ]
                  } : null,
                  project.url ? {
                    tag: 'li',
                    children: [
                      {
                        viewBox: '0 0 24 24',
                        fill: 'currentColor',
                        'aria-hidden': true,
                        className: 'inline-block h-4 text-accent',
                        children: [{
                          'fill-rule': 'evenodd',
                          'clip-rule': 'evenodd',
                          d: 'M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.354-1z'
                        }]
                      },
                      {
                        href: project.url,
                        rel: 'me nofollower noopener',
                        target: '_blank',
                        className: 'break-all text-accent hover:underline',
                        children: [project.url]
                      }
                    ]
                  } : null
                ]
              } : null,
              project.dek ? project.dek : null,
              project.description && showDescriptions ? {
                className: 'prose-invert prose-stone min-w-0 max-w-full overflow-hidden max-h-60 prose-a:text-accent lg:text-center',
                innerHTML: parseMd(project.description)
              } : null
            ]
          }
        ]
      }]
    }]
  });
};

const attachPopover = (anchor, project) => {
  anchor.project = project;
  anchor.setAttribute(customAttribute, '');

  anchor.addEventListener('mouseenter', displayPopover);
  anchor.addEventListener('mouseleave', removePopover);
};

const addPopoversInPosts = async posts => {
  await Promise.all(posts.map(async post => {
    if (post.matches(`[${customAttribute}]`)) return;
    post.setAttribute(customAttribute, '');

    const { postingProject, shareTree } = await getViewModel(post);
    const projects = [postingProject, ...shareTree.map(obj => obj.postingProject)];

    projects.map(project => {
      post.querySelectorAll(`[href*="https://cohost.org/${project.handle}"]:is(.co-project-handle,.co-project-display-name)`).forEach(anchor => attachPopover(anchor, project));
    });
  }));
};
const addPopovers = async anchors => {
  await Promise.all(anchors.map(async anchor => {
    const handle = anchor.href.split('https://cohost.org/')[1];
    if (anchor.matches(`[${customAttribute}]`) || !handle) return;
    
    const project = await getProject(handle);
    attachPopover(anchor, project);
  }));
};

export const main = async () => {
  if (!matchMedia('(pointer:fine)').matches) return; // if the device has no mouse (and thus no ability to hover) we don't want to clog up our web requests

  ({ showDescriptions } = await getOptions('urlPopovers'));
  postFunction.start(addPopoversInPosts);
  mutationManager.start(anchorSelector, addPopovers);
};

export const clean = async () => {
  postFunction.stop(addPopoversInPosts);
  mutationManager.stop(addPopovers);
  document.querySelectorAll(`a[${customAttribute}]`).forEach(anchor => {
    anchor.removeEventListener('mouseenter', displayPopover);
    anchor.removeEventListener('mouseleave', removePopover);
  })

  $(`.${customClass}`).remove();
  $(`[${customAttribute}]`).removeAttr(customAttribute);
};