import { apiFetch } from './utils/apiFetch.js';

const limit = 90000;
const chunkSize = 10000;
const threads = 1000;
const precision = 2;

let posts, projects, remaining;

const get = async postId => {
  if (postId in posts) return;
  return apiFetch(`/v1/project_post/${postId}`).then(response => {
    if (response?.status === 404) return;
    try {
      const [{ href }] = response._links;
      apiFetch(`/v1/trpc/posts.singlePost?input={"handle":"${href.split('/')[4]}","postId":${postId}}`).then(sortPost, () => { return; });
    } catch (e) {
      console.warn(postId, response, e);
      return;
    }
  }, () => { return; });
}

const sortPost = ({ comments, post }) => {
  try {
    post.shareTree.forEach((share, i) => {
      post.shareTree[i] = share.postId;
    });
  
    delete post.relatedProjects;
    const { postingProject } = post;
    if (!(postingProject.projectId in projects)) projects[postingProject.projectId] = postingProject;
    post.postingProject = postingProject.projectId;
  
    if (post.blocks.length && post.postId in comments && comments[post.postId].length) post.comments = comments[post.postId];
    else post.comments = [];
  
    posts[post.postId] = post;
  } catch (e) {
    posts[post.id] = post;
    console.warn(e, { comments, post });
  }

  return Promise.resolve();
};

const getChunk = async (start, size) => new Promise(async resolve => {
  const arr = Array.from(Array(size), (_, i) => start + i);
  while (arr.length) await Promise.all(arr.splice(0, threads).map(get));
  resolve();
});
const chunkManager = async init => {
  const densities = [];
  let avgDensity = 0;
  const totalChunks = Math.ceil(limit / chunkSize);
  remaining = limit;

  const startTime = Date.now();

  for (let chunk = 1; chunk <= totalChunks; ++chunk) {
    const size = Math.min(chunkSize, remaining);
    posts = {};
    projects = {};

    console.log(`starting chunk ${chunk} of ${totalChunks}`);
    const chunkStartTime = Date.now();

    for (let i = 1; i <= precision; ++i) {
      console.log(`starting pass ${i} of ${precision}`);
      const passStartTime = Date.now();

      await getChunk(init, size);

      const passElapsed = Date.now() - passStartTime;
      console.log(`pass ${i} finished in ${passElapsed}ms`);
    }

    const chunkElapsed = Date.now() - chunkStartTime;
    const postEntries = Object.keys(posts).length;
    const projectEntries = Object.keys(projects).length;
    const postEntriesInChunk = Object.keys(posts).filter(id => id >= init && id <= (init + limit - 1)).length;
    const postDensity = postEntriesInChunk / size;
    densities.push(postDensity);

    console.log(`chunk ${chunk} finished in ${chunkElapsed}ms with ${postEntries} posts (density ${postDensity}) and ${projectEntries} projects`);

    posts = Object.assign(posts, {
      type: 'posts',
      start: init,
      end: init + chunkSize - 1,
      entries: postEntries,
      entriesInChunk: postEntriesInChunk,
      density: postDensity,
      elapsed: chunkElapsed
    });
    projects = Object.assign(projects, {
      type: 'projects',
      start: init,
      end: init + chunkSize - 1,
      entries: projectEntries
    })
    downloadChunk([posts, projects]);

    init += chunkSize;
    remaining -= chunkSize;
  }

  const elapsed = Date.now() - startTime;
  densities.forEach(r => avgDensity += r);
  avgDensity = avgDensity / densities.length;
  console.log(`${totalChunks} chunks processed in ${elapsed}ms with average density ${avgDensity}`);
};

const downloadChunk = entities => {
  entities.forEach(entity => {
    const json = new Blob([JSON.stringify(entity, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(json);
    const exportLink = document.createElement('a');

    exportLink.href = url;
    exportLink.download = `${entity.type} - [${entity.start} - ${entity.end}] (${entity.entries})`;

    document.documentElement.append(exportLink);
    exportLink.click();
    exportLink.remove();
    URL.revokeObjectURL(url);
  });
}

export const main = async () => {
  const init = Number(prompt('init pos', '1'));

  chunkManager(init);
};
export const clean = async () => {};