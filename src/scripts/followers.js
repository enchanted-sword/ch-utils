import { apiFetch } from './utils/apiFetch.js';
import { followCard } from './utils/elements.js';
import { noact } from './utils/noact.js';
import { getOptions, getStorage } from './utils/jsTools.js';

const headerSelector = '.co-themed-box > h1';
const customClass = 'ch-utils-followers';

const limit = 100; // API no longer returns more than 100

const countElement = $('<span>', { class: `follow-count ${customClass}` });
const loader = $(`<span class='counter-loading ${customClass}'>(counting<span class='loader'></span>)</span>`);
const loaderButtonPlaceholder = $(`
  <button class="${customClass} load-all ml-auto flex h-12 max-w-xs items-center justify-center rounded-lg bg-foreground px-6 text-lg text-text hover:bg-foreground-600 active:bg-foreground-700 disabled:bg-foreground-200">
    <span class="spinner"></span>
  </button>
`);
const loaderButton = followers => noact({
  className: `${customClass} load-all ml-auto flex h-12 max-w-xs items-center justify-center rounded-lg bg-foreground px-6 text-lg text-text hover:bg-foreground-600 active:bg-foreground-700 disabled:bg-foreground-200`,
  onclick: async function ({ target }) {
    target.innerHTML = '<span class="spinner"></span>';
    await Promise.all(followers.map(async project => {
      const card = await followCard(customClass, project);
      if ($(`.co-project-handle[href='https://cohost.org/${project.handle}']`).length) return;
      $('.co-themed-box .mt-6').append($(card));
    }));
    $('.max-w-xs').css('display', 'none');
  },
  children: ['load all']
});

const countFollowers = async download => {
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

  if (download) {
    const { preferences } = await getStorage(['preferences']);
    const { prettyPrint } = preferences.exportData.options;

    const dataExport = new Blob([prettyPrint ? JSON.stringify(total, null, 2) : JSON.stringify(total)], { type: 'application/json' });
    const url = URL.createObjectURL(dataExport);
    const exportLink = document.createElement('a');
    const date = new Date();
    const yy = date.getFullYear().toString();
    const mm = (date.getMonth()).toString();
    const dd = date.getDate().toString();
    exportLink.href = url;
    exportLink.download = `cohost followers export ${mm}-${dd}-${yy}.json`;

    document.documentElement.append(exportLink);
    exportLink.click();
    exportLink.remove();
    URL.revokeObjectURL(url);
  }

  return total;
};

export const main = async () => {
  const { count, loadAll, download } = await getOptions('followers');
  if (location.pathname !== '/rc/project/followers' || (!count && !loadAll)) return;

  $(headerSelector).addClass('flex items-start');
  if (count) {
    $(headerSelector).prepend(countElement);
    $(headerSelector).append(loader);
  }
  if (loadAll) $(headerSelector).append(loaderButtonPlaceholder);

  const followers = await countFollowers(download);

  if (count) {
    countElement.text(followers.length);
    loader.remove();
  }
  if (loadAll) loaderButtonPlaceholder.replaceWith(loaderButton(followers));
};

export const clean = async () => {
  $(`.${customClass}`).remove();
  $(headerSelector).removeClass('flex items-start');
};