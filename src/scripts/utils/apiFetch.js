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

export const apiFetch = async (path, body = {}) => fetch(`https://cohost.org/api${path}${stringifyParams(body?.queryParams)}`, removeParams(body))
  .then(response => response.json().then(response => {
    if (response.constructor.name === 'Array') return response.map(({ result }) => result.data);
    else if ('result' in response) return response.result.data;
    else return response;
  })).catch(() => {
    console.error('apiFetch error: failed to fetch resource', `request url: https://cohost.org/api${path}${stringifyParams(body?.queryParams)}`, `request body: ${removeParams(body)}`);
    return null;
  });

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