import { batchTrpc } from './apiFetch.js';

export const [{ projectId, userId }, { projects }] = await batchTrpc(['login.loggedIn', 'projects.listEditedProjects']);

export const activeProject = projects.find(project => project.projectId === projectId);