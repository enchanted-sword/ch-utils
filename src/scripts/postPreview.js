import { mutationManager } from './utils/mutation.js';
import { noact } from './utils/noact.js';
import { postBoxTheme } from './utils/apiFetch.js';
import { managedProjects } from './utils/user.js';
import { avatar8 } from './utils/elements.js';
import { parseMd } from './utils/markdown.js';

const customClass = 'ch-utils-postPreview';
const customAttribute = 'data-smartPostPreview';

const editorSelector = `.flex-row:has(.co-post-composer):not([${customAttribute}])`;
const projectButtonSelector = '.co-post-composer > .co-thread-header button[data-headlessui-state]';
const headlineInputSelector = '.co-editable-body[name="headline"]';
const bodySelector = '[data-headlessui-state] > div > .flex-col:has([data-drop-target-for-external])';
const tagInputSelector = '.co-editable-body.text-sm';

const managedHandles = managedProjects.map(({ handle }) => handle);

const previewWindow = (editor, headline, body) => {
  const blocks = Array.from(body.children);
  const tags = Array.from(editor.querySelectorAll('.co-editable-body:has(input[id*="downshift"]) span.block')).map(mapTags);
  const selectedProjectHandle = editor.querySelector(projectButtonSelector).textContent.trim();
  const selectedProject = managedProjects.find(({ handle }) => handle === selectedProjectHandle);
  return noact({
    className: `${customClass} flex flex-1 flex-col gap-4 h-fit`,
    children: [{
      tag: 'article',
      className: 'co-themed-box co-post-box co-post-composer h-fit',
      dataset: { theme: postBoxTheme },
      children: [
        {
          id: 'postPreview-header',
          tag: 'header',
          className: 'co-thread-header',
          children: [formatHeader(selectedProject)]
        },
        {
          tag: 'hr',
          className: 'co-hairline'
        },
        {
          dataset: { postComposerPreview: true },
          children: [
            {
              className: 'w-full p-3',
              children: [{
                id: 'postPreview-headline',
                tag: 'h1',
                className: 'co-prose prose font-atkinson text-xl font-bold',
                children: [headline]
              }]
            },
            {
              tag: 'div',
              id: 'postPreview-body',
              className: 'relative overflow-hidden supports-[overflow:clip]:overflow-clip isolate',
              dataset: { postBody: true, testid: 'post-body' },
              children: blocks.map(mapBlocks)
            },
            {
              className: 'w-full max-w-full p-3',
              children: [{
                tag: 'div',
                id: 'postPreview-tags',
                className: 'co-tags relative w-full overflow-y-hidden break-words leading-none',
                children: formatTags(tags)
              }]
            }
          ]
        },
        {
          tag: 'hr',
          className: 'co-hairline'
        },
        {
          tag: 'footer',
          className: 'co-thread-footer w-full max-w-full rounded-b-lg p-3 h-fit',
          children: [{
            className: 'flex justify-between align-middle',
            children: [
              {
                className: 'text-sm text-gray-600 hover:underline flex-none',
                children: ['0 comments']
              },
              {
                className: 'flex items-center justify-end gap-3',
                children: [
                  {
                    id: 'postPreview-share',
                    className: 'cursor-pointer',
                    title: `share this post as ${selectedProjectHandle}`,
                    children: [{
                      fill: 'none',
                      viewBox: '0 0 24 24',
                      'stroke-width': 1.5,
                      stroke: 'currentColor',
                      'aria-hidden': true,
                      class: 'h-6 w-6 co-action-button',
                      children: [{
                        'stroke-linecap': 'round',
                        'stroke-linecjoin': 'round',
                        d: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
                      }]
                    }]
                  },
                  {
                    id: 'postPreview-like',
                    className: 'cursor-pointer',
                    title: `like this post as ${selectedProjectHandle}`,
                    children: [{
                      fill: 'none',
                      viewBox: '0 0 24 24',
                      'stroke-width': 1.5,
                      stroke: 'currentColor',
                      'aria-hidden': true,
                      class: 'h-6 w-6 co-action-button',
                      children: [{
                        'stroke-linecap': 'round',
                        'stroke-linecjoin': 'round',
                        d: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z'
                      }]
                    }]
                  },
                ]
              }
            ]
          }]
        }
      ]
    }]
  });
};

const formatHeader = project => noact({
  className: 'flex min-w-0 flex-1 flex-row flex-wrap items-center gap-2 leading-none',
  children: [
    avatar8(project),
    project.displayName ? {
      rel: 'author',
      href: `/${project.handle}`,
      className: 'co-project-display-name max-w-full flex-shrink truncate font-atkinson font-bold hover:underline',
      title: project.displayName,
      children: [project.displayName]
    } : null,
    {
      href: `/${project.handle}`,
      className: 'co-project-handle font-atkinson font-normal hover:underline',
      children: [`@${project.handle}`]
    },
    {
      className: 'block flex-none text-xs tabular-nums text-gray-500 hover:underline',
      title: 'now',
      children: ['now']
    }
  ]
});
const formatMarkdown = markdown => noact({
  className: 'co-prose prose my-4 overflow-hidden break-words px-3',
  innerHTML: parseMd(markdown)
});
const formatTags = tags => tags.map(({ icon, tag }) => noact({ tag: 'span', className: 'mr-2 inline-block text-sm', children: [icon, tag] }));

const mapBlocks = block => {
  const textarea = block.querySelector('textarea');
  const img = block.querySelector('img');

  if (textarea) return formatMarkdown(textarea.value);
  else if (img) return img.cloneNode(true);
  else return null;
};
const mapTags = b => {
  const icon = b.querySelector('svg.group-hover\\:hidden').cloneNode(true);
  const tag = b.querySelector('span.block').textContent;
  return { icon, tag };
};

const updateProject = selectedProjectHandle => {
  const selectedProject = managedProjects.find(({ handle }) => handle === selectedProjectHandle);
  document.getElementById('postPreview-header').replaceChildren(formatHeader(selectedProject));
  document.getElementById('postPreview-share').title = `share this post as ${selectedProjectHandle}`;
  document.getElementById('postPreview-like').title = `like this post as ${selectedProjectHandle}`;
};
const updateHeadline = ({ target }) => document.getElementById('postPreview-headline').innerText = target.value;
const updateBody = body => {
  const blocks = Array.from(body.children);
  document.getElementById('postPreview-body').replaceChildren(...blocks.map(mapBlocks));
}
const updateTags = () => document.getElementById('postPreview-tags').replaceChildren(...formatTags(Array.from(document.querySelectorAll('.co-editable-body:has(input[id*="downshift"]) .co-filled-button')).map(mapTags)));

const updateHandler = new MutationObserver(mutations => {
  const projectMutation = mutations.find(({ type, target }) => type === 'characterData' && target.parentNode.matches(projectButtonSelector) && managedHandles.includes(target.textContent.trim()));
  const headlineMutation = mutations.find(({ type, target }) => type === 'childList' && target.matches(headlineInputSelector));
  const bodyMutation = mutations.find(({ type, target }) => type === 'childList' && target.closest(bodySelector));
  const tagMutation = mutations.find(({ type, target }) => type === 'childList' && target.matches(tagInputSelector));

  projectMutation && (updateProject(projectMutation.target.textContent.trim()));
  headlineMutation && (updateHeadline(headlineMutation));
  bodyMutation && (updateBody(bodyMutation.target.closest(bodySelector)));
  tagMutation && (updateTags());
});

const addPreview = editors => {
  for (const editor of editors) {
    editor.setAttribute(customAttribute, '');
    const headlineInput = editor.querySelector(headlineInputSelector);
    const body = editor.querySelector(bodySelector);
    editor.append(previewWindow(editor, headlineInput.value, body));

    updateHandler.observe(editor.querySelector('article'), { childList: true, subtree: true, characterData: true });
  }
};

export const main = async () => {
  if (window.matchMedia('(min-width:1520px)').matches === false) return;
  mutationManager.start(editorSelector, addPreview);
};

export const clean = async () => {
  updateHandler.disconnect();
  mutationManager.stop(addPreview);
  $(`[${customAttribute}]`).removeAttr(customAttribute);
  $(`.${customClass}`).remove();
};