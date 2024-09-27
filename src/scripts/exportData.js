import { getCursor } from './utils/database.js';
import { getStorage } from './utils/jsTools.js';

const exportData = async () => {
  const projects = await getCursor('projectStore');
  const posts = await getCursor('postStore');
  const bookmarks = await getCursor('bookmarkStore');

  return {
    projects: Object.fromEntries(projects.map(project => [project.handle, project])),
    posts: Object.fromEntries(posts.map(post => [post.postId, post])),
    bookmarks: Object.fromEntries(bookmarks.map(bookmark => [bookmark.bookmarkId, bookmark])),
  };
};

export const main = async () => {
  const { preferences } = await getStorage(['preferences']);
  const { prettyPrint } = preferences.exportData.options;

  const data = await exportData();
  const dataExport = new Blob([prettyPrint ? JSON.stringify(data, null, 2) : JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(dataExport);
  const exportLink = document.createElement('a');
  const date = new Date();
  const yy = date.getFullYear().toString();
  const mm = (date.getMonth()).toString();
  const dd = date.getDate().toString();
  exportLink.href = url;
  exportLink.download = `cohost database export ${mm}-${dd}-${yy}.json`;

  document.documentElement.append(exportLink);
  exportLink.click();
  exportLink.remove();
  URL.revokeObjectURL(url);

  preferences.exportData.enabled = false;
  browser.storage.local.set({ preferences });
};

export const clean = async () => void 0;
