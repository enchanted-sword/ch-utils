import { mutationManager } from './utils/mutation.js';
import { noact } from './utils/noact.js';
import { postBoxTheme, displayPrefs } from './utils/apiFetch.js';
import { managedProjects } from './utils/user.js';
import { avatar8, embeddedAsk, audioPlayer } from './utils/elements.js';
import { parseMd, parseMdEmbed } from './utils/markdown.js';
import { getAsk } from './utils/react.js';

const customClass = 'ch-utils-postPreview';
const customAttribute = 'data-smartPostPreview';

const editorSelector = `.flex-row:has(.co-post-composer):not([${customAttribute}])`;
const askSelector = '[data-testid="composer-context"] [data-testid^="ask-"] article';
const projectButtonSelector = '.co-post-composer > .co-thread-header button[data-headlessui-state]';
const headlineInputSelector = '.co-editable-body[name="headline"]';
let bodySelector = '[data-headlessui-state] > div > .flex-col:has([data-drop-target-for-external])';
const tagInputSelector = '.co-editable-body.text-sm';
const tagButtonSelector = '.co-editable-body:has(input[id*="downshift"]) .co-filled-button';

const managedHandles = managedProjects.map(({ handle }) => handle);

let v1 = false;

const previewWindow = (editor, headline, body, ask) => {
  const blocks = body && (Array.from(body.children));
  const tags = Array.from(editor.querySelectorAll(tagButtonSelector)).map(mapTags);
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
            typeof ask !== 'undefined' ? embeddedAsk(ask) : null,
            {
              tag: 'div',
              id: 'postPreview-body',
              className: 'relative overflow-hidden supports-[overflow:clip]:overflow-clip isolate',
              dataset: { postBody: true, testid: 'post-body' },
              children: blocks? blocks.map(mapBlocks) : []
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
  innerHTML: displayPrefs.disableEmbeds ? parseMd(markdown) : parseMdEmbed(markdown)
});
const formatTags = tags => tags.map(({ icon, tag }) => noact({ tag: 'span', className: 'mr-2 inline-block text-sm', children: [icon, tag] }));
const formatAudio = figure => {
  const src = figure.querySelector('audio').src;
  
  return audioPlayer(src);
}

const wrapImg = img => {return { className: 'group relative w-full flex-initial', children: [img] }};
const mapBlocks = block => {
  console.log(block)
  const textarea = block.querySelector('textarea:not([placeholder="headline"])');
  const imgs = Array.from(block.querySelectorAll('img')).map(img => img.cloneNode(true));
  const audio = block.matches('figure:has(audio)') ? formatAudio(block) : null;

  if (textarea) return formatMarkdown(textarea.value);
  else if (imgs.length) {
    if (imgs.length === 1) return noact(wrapImg(imgs[0]));
    else {
      let rows = [];
      imgs.map((img, i) => {
        if (imgs.length === 3 && i === 2) rows[0].children.push(wrapImg(img));
        else if (i % 2 === 0) rows[i / 2] = {
          className: 'flex w-full flex-nowrap content-start justify-between',
          dataset: { testid: `row-${i / 2}` },
          children: [wrapImg(img)]
        }; else rows[(i - 1) / 2].children.push(wrapImg(img))
      });
      return rows.map(noact);
    }
  } else if (audio) return audio;
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
  document.getElementById('postPreview-body').replaceChildren(...blocks.flatMap(mapBlocks).filter(b => b !== null));
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

const addPreview = async editors => {
  for (const editor of editors) {
    if (!editor.querySelector('[data-drop-target-for-external]')) {
      v1 = true;
      bodySelector = '[data-headlessui-state] > div > .flex-col:has(.co-editable-body)';
    }

    let ask;
    const askBox = document.querySelector(askSelector);
    askBox && (ask = await getAsk(askBox));

    editor.setAttribute(customAttribute, '');
    const headlineInput = editor.querySelector(headlineInputSelector);
    let body = editor.querySelector(bodySelector);
    editor.append(previewWindow(editor, headlineInput.value, body, ask));

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