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
 * @returns the destructured result if successful and null otherwise
 */
export const apiFetch = async (path = '', body = {}) => fetch(`https://cohost.org/api${path}${stringifyParams(body?.queryParams)}`, removeParams(body))
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
    return null;
  });

export const batchTrpc = async (routes = [], input = {}) => await apiFetch(`/v1/trpc/${routes.join(',')}`, { method: 'GET', queryParams: { batch: 1, input }});

export const followState = async projectHandle => {
  const { readerToProject } = await apiFetch('/v1/trpc/projects.followingState', { method: 'GET', queryParams: { input: { projectHandle } } });
  return readerToProject;
};

export const activeProjectId = async () => {
  const { projectId } = await apiFetch('/v1/trpc/login.loggedIn');
  return projectId;
}

export const singlePost = async (handle, postId) => await apiFetch('/v1/trpc/posts.singlePost', { method: 'GET', queryParams: { input: { handle, postId } } });

export const displayPrefs = async () => await apiFetch('/v1/trpc/users.displayPrefs');

export const listEditedProjects = async () => await apiFetch('/v1/trpc/projects.listEditedProjects');