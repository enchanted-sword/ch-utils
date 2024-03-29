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
 * @returns {Promise <object>} the destructured result if successful
 */
export const apiFetch = async (path, body = {}) => fetch(`https://cohost.org/api${path}${stringifyParams(body?.queryParams)}`, removeParams(body))
  .then(response => response.json().then(response => {
    if (response.constructor.name === 'Array') return response.map(({ result, error }) => {
      if (result && result.data) return result.data;
      else if (error) throw error;
    });
    else if ('result' in response) return response.result.data;
    else if ('error' in response) throw response.error;
    else return response;
  })).catch(e => {
    console.error(`apiFetch error: failed to fetch resource at url https://cohost.org/api${path}${stringifyParams(body?.queryParams)}`, e);
    return Promise.reject();
  });

/**
 * @param {string[]} routes - array of routes to fetch
 * @param {object} input - array-like object of parameters for the routes 
 * @returns {Promise <object[]>} the destructured result if successful
 */
export const batchTrpc = async (routes, input = {}) => await apiFetch(`/v1/trpc/${routes.join(',')}`, { method: 'GET', queryParams: { batch: 1, input }});

/**
 * follow relationship between the user and a given project
 * @param {string} projectHandle - handle of project
 * @returns {Promise <Number>} relationship state: either 0 (not following), 1 (request sent), or 2 (following)
 */
export const followState = async projectHandle => {
  const { readerToProject } = await apiFetch('/v1/trpc/projects.followingState', { method: 'GET', queryParams: { input: { projectHandle } } });
  return readerToProject;
};

/**
 * @returns {Promise <Number>} the id of the user's active project
 */
export const activeProjectId = async () => {
  const { projectId } = await apiFetch('/v1/trpc/login.loggedIn');
  return projectId;
}

/**
 * fetches data for a single post
 * @param {string} handle - handle of post author
 * @param {Number} postId - id of post
 * @returns {Promise <object>} post data
 */
export const singlePost = async (handle, postId) => await apiFetch('/v1/trpc/posts.singlePost', { method: 'GET', queryParams: { input: { handle, postId } } });

/**
 * @returns {Promise <object>} user display preferences
 */
export const displayPrefs = async () => await apiFetch('/v1/trpc/users.displayPrefs');

/**
 * @returns {Promise <object[]>} list of projects the user has edit access to
 */
export const listEditedProjects = async () => await apiFetch('/v1/trpc/projects.listEditedProjects');