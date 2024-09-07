import { batchTrpc } from './apiFetch.js';

const [{ projectId }, { projects }] = await batchTrpc(['login.loggedIn', 'projects.listEditedProjects']);

export const activeProject = projects.find(project => project.projectId === projectId);

export const managedProjects = projects;

export const [hasActiveSubscription] = await batchTrpc(['subscriptions.hasActiveSubscription']);