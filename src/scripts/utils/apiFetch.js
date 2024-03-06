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
  .then(response => response.json()).catch(() => {
    console.error('apiFetch error: failed to fetch resource', `request url: https://cohost.org/api${path}${stringifyParams(body?.queryParams)}`, `request body: ${removeParams(body)}`);
    return null;
  });

export const followState = async projectHandle => {
  const arr = await apiFetch('/v1/trpc/projects.followingState', { method: 'GET', queryParams: { batch: 1, input: { 0: { projectHandle } } } });
  return arr[0].result.data.readerToProject;
};

export const activeProjectId = async () => {
  const arr = await apiFetch('/v1/trpc/login.loggedIn', { method: 'GET', queryParams: { batch: 1, input: {} } });
  return arr[0].result.data.projectId;
}