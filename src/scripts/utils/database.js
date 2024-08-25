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
const postData = msg => {
  if (!connected) {
    connectionPort = browser.runtime.connect({ name: "databasePort" });
    connected = true;
    
    connectionPort.onDisconnect.addListener(() => connected = false);
    connectionPort.onMessage.addListener(recieveData);
  }
  connectionPort.postMessage(msg);
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
 * @param {object} data - object containing key-value pairs of object stores and keys to delete from those stores
 * @param {object} [options] - object containing key-value pairs of object stores and options objects to use for those stores;
 * @param {string} [options.STORE_NAME.index] - the index to use when deleting data
 * @returns {void}
 */
export const clearData = (data, options = null) => postData({ action: 'clear', data, options });

/**
 * @param {object} data - object containing key-value pairs of object stores and keys to retrieve from those stores
 * @param {object} [options] - object containing key-value pairs of object stores and options objects to use for those stores;
 * @param {string} [options.STORE_NAME.index] - the index to use when retrieving data
 * @returns {Promise <object>}
 */
export const getData = (data, options = null) => new Promise(resolve => {
  const uuid = window.crypto.randomUUID();
  dataCallbacks.set(uuid, resolve);
  postData({ action: 'get', data, options, uuid });
});

export const getCursor = (store, range) => new Promise(resolve =>{
  const uuid = window.crypto.randomUUID();
  dataCallbacks.set(uuid, resolve);
  postData({ action: 'cursor', data: { store, range }, uuid });
});

/**
 * @param {string} store - single object store to access 
 * @param {Number|string|Array} keys - keys to retrieve from that store
 * @param {object} [options] - options to  use when retrieving keys
 * @param {string} [options.index] - the index to use when retrieving data
 * @returns {Promise <object>}
 */
export const getIndexedResources = async (store, keys, options = null) => {
  const isArray = Array.isArray(keys);
  keys = [keys].flat();
  const indexedResources = await getData(Object.fromEntries([[store, keys]]), Object.fromEntries([[store, options]]));
  return isArray ? indexedResources[store] : indexedResources[store][0];
}

/**
 * @param {Number|Number[]} keys - single postId or array of postIds to fetch from the database
 * @returns {<object|object[]>} post(s) - type of return matches type of input
 */
export const getIndexedPosts = keys => getIndexedResources('postStore', keys);

/**
 * @param {Number|Number[]} keys - single key (handle or projectId) or array of indices to fetch from the database
 * @returns {Promise <object|object[]>} project(s) - type of return matches type of input
 */
export const getIndexedProjects = keys => getIndexedResources('projectStore', keys);