import { apiFetch, postBoxTheme } from './utils/apiFetch.js';
import { activeProject, managedProjects } from './utils/user.js';
import { getViewModel } from './utils/react.js';
import { postFunction } from './utils/mutation.js';
import { noact } from './utils/noact.js';
import { getOptions } from './utils/jsTools.js';
import { parseMd } from './utils/markdown.js';  // new record for most imports in a module?

const customClass = 'ch-utils-quickRechost';
const customAttribute = 'data-quick-rechost';
const linkSelector = '[href*="compose?"]';

let addTags, addContent;

const hideMenuDelay = 500;
const longPressDelay = 500;
const descriptors = [
  { descriptor: 'reshare', weight: 8 },
  { descriptor: 'rechost', weight: 7 },
  { descriptor: 'rebug', weight: 6.6 },
  { descriptor: 'reblog', weight: 4 },
  { descriptor: 'rechlog', weight: 3.2 }, // shoutout to tooie dragongirlslime
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

export const onLongPress = (elem, func) => {
  let timeoutId;

  elem.addEventListener('touchstart', e => {
    timeoutId = setTimeout(() => {
      timeoutId = null;
      e.stopPropagation();
      func(e);
    }, longPressDelay);
  });
  elem.addEventListener('contextmenu', e => e.preventDefault());
  elem.addEventListener('touchend', () =>  timeoutId && clearTimeout(timeoutId));
  elem.addEventListener('touchmove', () => timeoutId && clearTimeout(timeoutId));
};

const rechost = async (shareOfPostId, projectHandle, tags = [], content = '') => apiFetch('/v1/trpc/posts.create', { 
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
        blocks: content ? [
          {
            type: 'markdown',
            markdown: { content }
          }
        ] : [],
        cws: [],
        tags,
        shareOfPostId: Number(shareOfPostId),
      }
    }
  })
});

const textInput = (type, postId, placeholder) => {return {
  className: 'relative grid w-full overflow-auto w-14',
  children: [
    {
      className: 'invisible col-start-1 col-end-2 row-start-1 row-end-2 h-min overflow-auto whitespace-pre-wrap break-words',
      style: 'font-size: 16px; font-family: Atkinson Hyperlegible, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;; font-weight: 400; font-style: normal; letter-spacing: normal; text-transform: none; padding: 8px 12px; line-height: 24px; min-height: 48px;'
    },
    {
      tag: 'input',
      type: 'text',
      id: `qrc-${type}-${postId}`,
      onkeydown: ctrlEnter,
      className: 'co-composer-text-box w-full row-start-1 row-end-2 col-start-1 col-end-2 min-h-0',
      style: 'resize: none; overflow: hidden;',
      placeholder,
    }
  ]
}};
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
      selector.click();
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
  return noact({
    className: `${customClass} co-themed-box co-comment-box cohost-shadow-light dark:cohost-shadow-dark rounded-lg p-2 lg:max-w-prose`,
    id: `qrc-menu-${postId}`,
    dataset: { theme: postBoxTheme },
    onmouseleave: menuSelfHide,
    children: [{
      className: 'flex flex-col gap-2',
      children: [
        addContent ? textInput('content', postId, 'content (markdown)') : '',
        addTags ? textInput('tags', postId, 'tags (comma-separated)') : '',
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
              className: 'ch-utils-quickRechost-list lg:cohost-shadow-light dark:lg:cohost-shadow-dark left-0 top-8 !overflow-y-auto truncate bg-foreground !outline-none absolute lg:max-h-[calc(100vh_-_100px)] lg:divide-none rounded-lg bg-notWhite text-notBlack',
              'aria-orientation': 'vertical',
              role: 'listbox',
              onmouseleave: () => {
                const selector = document.getElementById(`qrc-selector-${postId}`);
                window.setTimeout(() => selector.dataset.headlessuiState = '', hideMenuDelay);
              },
              tabindex: 0,
              children: managedProjects.map((project, index) => selectableProject(project, index, activeProject.projectId, postId))
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
  const contentInput = document.getElementById(`qrc-content-${id}`);
  const tagsInput = document.getElementById(`qrc-tags-${id}`);
  const pageSelector = document.getElementById(`qrc-selector-${id}`);
  const { handle } = pageSelector.activeProject;
  let tags = [], content = '';

  if (addContent && contentInput.value) content = parseMd(contentInput.value);
  if (addTags && tagsInput.value) tags = tagsInput.value.replace(/#/g, '').split(',').map(tag => tag.trim());

  target.style = 'color: rgb(var(--color-notWhite)); background-color: rgb(49 157 53);'
  
  rechost(id, handle, tags, content)
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
    className: `ch-utils-quickRechost-status flex justify-between gap-3 !bg-${success ? 'green' : 'red'}-200 !text-${success ? 'green' : 'red'}-800 cohost-shadow-light dark:cohost-shadow-dark rounded-lg px-3 py-2 font-bold`,
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
        children: [success ? `posted to ${handle}!` : 'an error occurred while processing the post']
      }
    ]
  });

  document.body.append(message);
  window.setTimeout(() => message.remove(), 5000);
};
const ctrlEnter = event => {
  if (event.ctrlKey && event.key === 'Enter') {
    document.getElementById(`qrc-${event.target.id.split('-')[2]}`).click();
  }
};

const showMenu = event => {
  const target = event.target.closest(linkSelector);
  const id = target.href.split('shareOfPostId=')[1];
  const yPos = (event.pageY || event.changedTouches[0].pageY) + 16;
  let xPos = event.pageX || event.changedTouches[0].pageX;
  if (xPos + 128 > visualViewport.width) xPos = visualViewport.width - 248;
  else xPos -= 120;

  document.getElementById(`qrc-menu-${id}`).style = `top: ${yPos}px; left: ${xPos}px; display: block;`; 
};
const hideMenu = event => {
  const target = event.target.closest(linkSelector);
  window.setTimeout(() => {
    const id = target.href.split('shareOfPostId=')[1];
    const menu =  document.getElementById(`qrc-menu-${id}`)
    if (menu && !menu.matches(':hover')) menu.style = null;
  }, hideMenuDelay);
};
const hideMenuOnTouch = event => {
  try {
    if (!event.originalTarget.matches(`.${customClass},.${customClass} *,${linkSelector},${linkSelector} svg`)) document.querySelectorAll(`.${customClass}`).forEach(function (menu) { menu.style = null });
  } catch {null} // can't check .matches() on some inputs so this keeps the console free of extra errors
};
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
    onLongPress(shareButton, showMenu);

    document.getElementById('app').append(await newMenu(postId));
  }
};

export const main = async () => {
  ({ addTags, addContent } = await getOptions('quickRechost'));

  postFunction.start(addMenus, ':not([data-quick-rechost="true"])');
  document.addEventListener('touchstart', hideMenuOnTouch);
};

export const clean = async () => {
  postFunction.stop(addMenus);

  $(linkSelector).off('mouseenter', showMenu);
  $(`.${customClass}`).remove();
  $(`[${customAttribute}]`).removeAttr(customAttribute);
  document.removeEventListener('touchstart', hideMenuOnTouch);
};