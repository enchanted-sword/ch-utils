let connectionPort;
let connected = false;

const dataCallbacks = new Map();

const recieveData = msg => {
  if (msg.action === 'response') {
    const callback = dataCallbacks.get(msg.uuid);
    dataCallbacks.delete(msg.uuid);
    callback(msg.data);
  }
};
const postData = ({ action, data, uuid = 0 }) => {
  if (!connected) {
    connectionPort = browser.runtime.connect({ name: "databasePort" });
    connected = true;
    
    connectionPort.onDisconnect.addListener(() => connected = false);
    connectionPort.onMessage.addListener(recieveData);
  }
  connectionPort.postMessage({ action, data, uuid });
};

/**
 * @param {object} data - object containing key-value pairs of object stores and data to enter into those stores
 * @returns {void}
 */
export const cacheData = data => postData({ action: 'cache', data });

/**
 * @param {object} data - object containing key-value pairs of object stores and data to update those stores with
 * @returns {void}
 */
export const updateData = data => postData({ action: 'update', data });

/**
 * @param {object} data - object containing key-value pairs of object stores and indices to delete from those stores
 * @returns {void}
 */
export const clearData = data => postData({ action: 'clear', data });

/**
 * @param {object} data - object containing key-value pairs of object stores and indices to retrieve from those stores
 * @returns {Promise <object>}
 */
export const getData = data => new Promise(resolve => {
  const uuid = window.crypto.randomUUID();
  dataCallbacks.set(uuid, resolve);
  postData({ action: 'get', data, uuid });
});

const getIndexedResources = async (store, indices) => {
  const isArray = Array.isArray(indices);
  indices = [indices].flat();
  const indexedResources = await getData(Object.fromEntries([[store, indices]]));
  return isArray ? indexedResources[store] : indexedResources[store][0];
}

/**
 * @param {Number|Number[]} indices - single postId or array of postIds to fetch from the database
 * @returns {<object|object[]>} post(s) - type of return matches type of input
 */
export const getIndexedPosts = indices => getIndexedResources('postStore', indices);

/**
 * @param {Number|Number[]} indices - single index (handle or projectId) or array of indices to fetch from the database
 * @returns {Promise <object|object[]>} project(s) - type of return matches type of input
 */
export const getIndexedProjects = indices => getIndexedResources('projectStore', indices);