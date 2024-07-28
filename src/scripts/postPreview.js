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
const tagSelector = '.group.cursor-pointer.select-none > .co-filled-button > span.block';

const previewWindow = (editor, headline, body) => {
  const tags = Array.from(editor.querySelectorAll('.co-editable-body:has(input[id*="downshift"]) span.block')).map(e => e.textContent);
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
              children: [formatMarkdown(body)]
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
const formatTags = tags => tags.map(tag => noact({ tag: 'span', className: 'mr-2 inline-block text-sm', children: [`#${tag}`] }));

const updateHeadline = ({ target }) => document.getElementById('postPreview-headline').innerText = target.value;
const updateBody = ({ target }) => document.getElementById('postPreview-body').replaceChildren(formatMarkdown(target.value));
const updateTags = () => document.getElementById('postPreview-tags').replaceChildren(...formatTags(Array.from(document.querySelectorAll('.co-editable-body:has(input[id*="downshift"]) span.block')).map(e => e.textContent)));
const updateProject = () => {
  const selectedProjectHandle = document.querySelector(projectButtonSelector).textContent.trim();
  const selectedProject = managedProjects.find(({ handle }) => handle === selectedProjectHandle);
  document.getElementById('postPreview-header').replaceChildren(formatHeader(selectedProject));
};

const addPreview = editors => {
  for (const editor of editors) {
    editor.setAttribute(customAttribute, '');
    const headlineInput = editor.querySelector('.co-editable-body[name="headline"]');
    const bodyInput = editor.querySelector('[data-drop-target-for-external] .co-editable-body');
    editor.append(previewWindow(editor, headlineInput.value, bodyInput.value));
    headlineInput.addEventListener('input', updateHeadline);
    bodyInput.addEventListener('input', updateBody);
    mutationManager.start(tagSelector, updateTags);
    mutationManager.start('ul[data-headlessui-state]', updateProject);
  }
};

export const main = async () => {
  if (window.matchMedia('(min-width:1520px)').matches === false) return;
  mutationManager.start(editorSelector, addPreview);
};

export const clean = async () => {
  mutationManager.stop(addPreview);
  $(`[${customAttribute}]`).removeAttr(customAttribute);
  $(`.${customClass}`).remove();
};