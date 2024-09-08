import { getProjectSlow } from './darkWorld.js';
import { updateData, getIndexedProjects } from './database.js';

const stringifyParams = obj => {
  if (typeof obj === 'undefined') return '';
  let string = [];
  Object.keys(obj).forEach((key, index) => string[index] = `${key}=${JSON.stringify(obj[key])}`);
  if (string.length === 0) return;
  else return `?${string.join('&')}`;
}
const removeParams = obj => {
  delete obj?.queryParams;
  return obj;
};

/**
 * fetches data via the cohost api
 * @param {string} path - request path (e.g. /v1/trpc/users.displayPrefs)
 * @param {object} body - request body
 * @param {boolean} silent - don't log errors
 * @returns {Promise <object>} the destructured result if successful
 */
export const apiFetch = async (path, body = {}, silent = false) => fetch(`https://cohost.org/api${path}${stringifyParams(body?.queryParams)}`, removeParams(body))
  .then(response => {
    console.debug(response);

    if (response.headers.get('content-type')) {
      return response.json().then(response => {
        console.debug(response);
        if (response.constructor.name === 'Array') return response.map(({ result, error }) => {
          if (result && 'data' in result) return result.data;
          else if (error) throw error;
        });
        else if ('result' in response) return response.result.data;
        else if ('error' in response) throw response.error;
        else return response;
      });
    } else return;
  }).catch(e => {
    if (!silent) console.error(`apiFetch error: failed to fetch resource at url https://cohost.org/api${path}${stringifyParams(body?.queryParams)}`,removeParams(body), e);
    return Promise.reject(e);
  });

/**
 * @param {string[]} routes - array of routes to fetch
 * @param {object} input - array-like object of parameters for the routes 
 * @returns {Promise <object[]>} the destructured result if successful
 */
export const batchTrpc = async (routes, input = {}) => await apiFetch(`/v1/trpc/${routes.join(',')}`, { method: 'GET', queryParams: { batch: 1, input }});

/**
 * follow relationship between the user and a given project
 * @param {string} handle - handle of project
 * @returns {Promise <Number>} relationship state: either 0 (not following), 1 (request sent), or 2 (following)
 */
export const followState = async handle => {
  const { readerToProject } = await apiFetch(`/v1/project/${handle}/following`);
  return readerToProject;
};

/**
 * fetches data for a single post
 * @param {string} handle - handle of post author
 * @param {Number} postId - id of post
 * @param {boolean} silent - don't log errors
 * @returns {Promise <object>} post data
 */
export const singlePost = async (handle, postId, silent = false) => await apiFetch('/v1/trpc/posts.singlePost', { method: 'GET', queryParams: { input: { handle, postId } } }, silent);

const projectMap = new Map();
const pendingProjectMap = new Map();

const apiFetchProject = async handle => {
  const [{ projects }] = await batchTrpc(['projects.searchByHandle'], { 0: { query: handle, skipMinimum: false } }); // the search function is currently the fastest way to get info from a handle. it's stupid, i know
  updateData({ projectStore: projects });
  const project = projects.find(p => p.handle === handle);
  if (typeof project === 'object') projectMap.set(handle, project);
  else {
    console.warn(`search method failed { handle: ${handle} }, attempting slow method`);
    projectMap.set(handle, await getProjectSlow(handle));
  }
  return project;
};

/**
 * fetches info for a project
 * @param {string} handle 
 * @returns {Promise <object>} project info for the given handle 
 */
export const getProject = async handle => {
  let project;

  if (projectMap.has(handle)) project = projectMap.get(handle);
  else {
    if (pendingProjectMap.has(handle)) project = await pendingProjectMap.get(handle);
    else {
      pendingProjectMap.set(handle, getIndexedProjects(handle));
      project = await pendingProjectMap.get(handle);
    }
    if (typeof project === 'object' && !project.expired) projectMap.set(handle, project);
    else project = await apiFetchProject(handle);
  }

  return project;
};

/**
 * @returns {Promise <object>} user display preferences
 */
export const displayPrefs = await apiFetch('/v1/trpc/users.displayPrefs');

const themeMap = {
  light: 'light',
  dark: 'dark',
  'prefers-color-scheme': 'both'
};
const { defaultPostBoxTheme } = displayPrefs;

export const postBoxTheme = themeMap[defaultPostBoxTheme];

const removeEmptyArrays = obj => {
  const returnObj = {};
  Object.keys(obj).filter(key => obj[key].length > 0).map(key => returnObj[key] = obj[key]);
  return Object.keys(returnObj).length ? returnObj : null;
};

/**
 * get comments for a post
 * @param {string} handle 
 * @param {Number} postId 
 * @returns {Promise <object>} comments
 */
export const getComments = async (handle, postId, post = null) => {
  const { comments } = await singlePost(handle, postId).catch(e => {
    console.warn(`unable to fetch post { handle: ${handle},  postId: ${postId} }\nmost likely unauthorized`, e);
    return { comments: void 0 };
  });
  if (!comments) return [];
  post && (post.comments = comments, updateData({ postStore: post, bookmarkStore: post }, { bookmarkStore: { updateStrict: true } }));
  return removeEmptyArrays(comments);
};