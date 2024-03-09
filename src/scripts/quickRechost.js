import { apiFetch, batchTrpc } from './utils/apiFetch.js';
import { getViewModel } from './utils/react.js';
import { postFunction } from './utils/mutation.js';
import { noact } from './utils/noact.js';

const customClass = 'ch-utils-quickRechost';
const customAttribute = 'data-quick-rechost';
const linkSelector = '[href*="compose?"]';

const hideMenuDelay = 500;
const descriptors = [
  { descriptor: 'reshare', weight: 8 },
  { descriptor: 'rechost', weight: 7 },
  { descriptor: 'rebug', weight: 6.6 },
  { descriptor: 'reblog', weight: 4 },
  { descriptor: 'repost', weight: 3.1 },
  { descriptor: 'clone', weight: 1 },
  { descriptor: 'propagate', weight: .5 },
  { descriptor: 'assimilate', weight: .2 },
];
const randomDescriptor = () => {
  let i;
  const weights = [descriptors[0].weight];
  for (i = 1; i < descriptors.length; i++) weights[i] = descriptors[i].weight + weights[i - 1];
  const random = Math.random() * weights[weights.length - 1];
  for (i = 0; i < weights.length; i++) if (weights[i] > random) break;
  return descriptors[i].descriptor;
}

const rechost = async (shareOfPostId, projectHandle, tags = []) => apiFetch('/v1/trpc/posts.create', { 
  method: 'POST',
  queryParams: { batch: 1, },
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    0: {
      projectHandle,
      content: {
        postState: 1,
        headline: '',
        adultContent: false,
        blocks: [],
        cws: [],
        tags,
        shareOfPostId: Number(shareOfPostId),
      }
    }
  })
});

const selectableProject = (project, index, activeProjectId, postId) => {
  const { projectId, handle, avatarURL } = project;
  const selected = projectId === activeProjectId ? true : false;

  return {
    tag: 'li',
    className: 'flex h-10 cursor-pointer flex-row items-center gap-3 px-2 py-1 hover:bg-foreground-100 hover:text-foreground-800 lg:first-of-type:rounded-t-lg lg:last-of-type:rounded-b-lg',
    selectorId: `qrc-selector-${index}`,
    role: 'option',
    tabindex: -1,
    'aria-selected': selected,
    dataset: { headlessuiSelected: selected },
    onclick: () => {
      const selector = document.getElementById(`qrc-selector-${postId}`);
      const avatar = selector.querySelector('img');
      selector.activeProject = project;
      avatar.src = `${avatarURL}?dpr=2&amp;width=80&amp;height=80&amp;fit=cover&amp;auto=webp`;
      avatar.alt = `@${handle}`;
      document.getElementById(`qrc-${postId}`).title = `share this post as ${handle}`;
    },
    children: [
      {
        className: 'flex-0 mask relative aspect-square h-8 w-8',
        children: [{
          className: 'mask mask-roundrect h-full w-full object-cover',
          src: `${project.avatarURL}?dpr=2&amp;width=80&amp;height=80&amp;fit=cover&amp;auto=webp`,
          alt: project.handle
        }]
      },
      {
        tag: 'span',
        children: [`@${project.handle}`]
      }
    ]
  }
};
const newMenu = async postId => {
  const [
    { projectId },
    { projects },
    { defaultPostBoxTheme },
  ] = await batchTrpc(['login.loggedIn', 'projects.listEditedProjects', 'users.displayPrefs']);
  const activeProject = projects.find(project => project.projectId === projectId);
  return noact({
    className: `${customClass} co-themed-box co-comment-box cohost-shadow-light dark:cohost-shadow-dark w-15 rounded-lg p-2 lg:max-w-prose`,
    id: `qrc-menu-${postId}`,
    dataset: { theme: defaultPostBoxTheme },
    onmouseleave: menuSelfHide,
    children: [{
      className: 'flex flex-col gap-2',
      children: [
        {
          className: 'relative grid w-full overflow-auto',
          children: [
            {
              className: 'invisible col-start-1 col-end-2 row-start-1 row-end-2 h-min overflow-auto whitespace-pre-wrap break-words',
              style: 'font-size: 16px; font-family: Atkinson Hyperlegible, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;; font-weight: 400; font-style: normal; letter-spacing: normal; text-transform: none; padding: 8px 12px; line-height: 24px; min-height: 48px;'
            },
            {
              tag: 'input',
              type: 'text',
              id: `qrc-input-${postId}`,
              className: 'co-composer-text-box w-full row-start-1 row-end-2 col-start-1 col-end-2 min-h-0',
              style: 'resize: none; overflow: hidden;',
              placeholder: 'tags (comma-separated)',
            }
          ]
        },
        {
          className: 'flex flex-row relative items-center justify-between gap-4',
          children: [
            {
              className: 'group flex flex-row items-center gap-1',
              id: `qrc-selector-${postId}`,
              'aria-haspopup': 'listbox',
              'aria-expanded': false,
              dataset: { headlessuiState: '' },
              activeProject,
              onclick: toggleState,
              children: [
                {
                  className: 'flex-row items-center gap-3 rounded-l-lg px-2 py-1 group-hover:bg-foreground-600 ui-open:bg-foreground-700 lg:flex',
                  children: [{
                    className: 'flex-0 mask relative aspect-square h-8 w-8',
                    children: [{
                      className: 'mask mask-roundrect h-full w-full object-cover',
                      src: `${activeProject.avatarURL}?dpr=2&amp;width=80&amp;height=80&amp;fit=cover&amp;auto=webp`,
                      alt: activeProject.handle
                    }]
                  }]
                },
                {
                  className: 'rounded-r-lg p-2 group-hover:bg-foreground-600 ui-open:bg-foreground-700 lg:block',
                  children: [{
                    className: 'ch-utils-quickRechost-caret h-6 w-6 transition-transform ui-open:rotate-180',
                    viewBox: '0 0 24 24',
                    'aria-hidden': true,
                    fill: 'currentColor',
                    children: [{
                      'fill-rule': 'evenodd',
                      'clip-rule': 'evenodd',
                      d: 'M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z'
                    }]
                  }]
                }
              ]
            },
            {
              tag: 'ul',
              className: 'ch-utils-quickRechost-list lg:cohost-shadow-light dark:lg:cohost-shadow-dark fixed left-0 top-8 max-w-xs divide-y divide-foreground-500 !overflow-y-auto truncate bg-foreground !outline-none lg:absolute lg:max-h-[calc(100vh_-_100px)] lg:divide-none lg:rounded-lg lg:bg-notWhite lg:text-notBlack',
              'aria-orientation': 'vertical',
              role: 'listbox',
              onmouseleave: () => {
                const selector = document.getElementById(`qrc-selector-${postId}`);
                window.setTimeout(() => selector.dataset.headlessuiState = '', hideMenuDelay);
              },
              tabindex: 0,
              children: projects.map((project, index) => selectableProject(project, index, projectId, postId))
            },
            {
              className: 'co-filled-button flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold',
              title: `share this post as ${activeProject.handle}`,
              id: `qrc-${postId}`,
              onclick: quickRechost,
              children: [randomDescriptor()]
            }
          ]
        }
      ]
    }]
  });
};

const toggleState = event => {
  const target = event.target.closest('[data-headlessui-state]');
  const state = target.dataset.headlessuiState;

  if (state === 'open') {
    target.dataset.headlessuiState = '';
    target['aria-expanded'] = '';
  } else {
    target.dataset.headlessuiState = 'open';
    target['aria-expanded'] = true;
  }
};
const quickRechost = event => {
  const target = event.target.closest('button');
  const id = target.id.split('-')[1];
  const tagsInput = document.getElementById(`qrc-input-${id}`);
  const pageSelector = document.getElementById(`qrc-selector-${id}`);
  const { handle } = pageSelector.activeProject;
  let tags = []

  if (tagsInput.value) tags = tagsInput.value.replace(/#/g, '').split(',').map(tag => tag.trim());

  target.style = 'color: rgb(var(--color-notWhite)); background-color: rgb(49 157 53);'
  
  rechost(id, handle, tags)
    .then(() => addStatusMessage(true, handle))
    .catch(e => addStatusMessage(false, handle))
    .finally(() => {
    document.getElementById(`qrc-menu-${id}`).style = null;
    target.style = null;
    document.getElementById(`qrc-selector-${id}`).dataset.headlessuiState = '';
  });
};
const addStatusMessage = (success, handle) => {
  const message = noact({
    tag: 'button',
    className: 'ch-utils-quickRechost-status tracking-wider whitespace-nowrap flex h-10 items-center justify-center self-center rounded-lg py-2 px-3',
    style: `background-color: rgb(${success ? '49 157 53' : '229 107 111'});`,
    children: [success ? `posted to ${handle}!` : 'an error occurred while processing the post']
  });

  document.body.append(message);
  window.setTimeout(() => message.remove(), 5000);
}

const showMenu = event => {
  const { pageX, pageY } = event;
  const target = event.target.closest(linkSelector);
  const id = target.href.split('shareOfPostId=')[1];

  document.getElementById(`qrc-menu-${id}`).style = `top: ${pageY + 16}px; left: ${pageX - 120}px; display: block;`;
};
const hideMenu = event => {
  const target = event.target.closest(linkSelector);
  window.setTimeout(() => {
    const id = target.href.split('shareOfPostId=')[1];
    const menu =  document.getElementById(`qrc-menu-${id}`)
    if (menu && !menu.matches(':hover')) menu.style = null;
  }, hideMenuDelay);
}
const menuSelfHide = event => {
  event.stopPropagation();
  const menu = event.target.closest('.co-themed-box');
  if (!menu.matches(':hover')) {
    window.setTimeout(() => { if (menu && !menu.matches(':hover')) menu.style = null; }, hideMenuDelay);
  }
}
const addMenus = async posts => {
  for (const post of posts) {
    if (post.matches(`[${customAttribute}]`)) return;
    post.setAttribute(customAttribute, '');

    const { postId, canShare } = await getViewModel(post);
    if (!canShare) return;

    const shareButton = post.querySelector(linkSelector);
    $(shareButton).on('mouseenter', showMenu);
    $(shareButton).on('mouseleave', hideMenu);

    document.body.append(await newMenu(postId));
  }
};

export const main = async () => {
  postFunction.start(addMenus, ':not([data-quick-rechost="true"])');
};

export const clean = async () => {
  postFunction.stop(addMenus);

  $(linkSelector).off('mouseenter', showMenu);
  $(`.${customClass}`).remove();
  $(`[${customAttribute}]`).removeAttr(customAttribute);
};