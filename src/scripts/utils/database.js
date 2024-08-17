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

export const cacheData = data => postData({ action: 'cache', data });
export const clearData = data => postData({ action: 'clear', data });
export const getData = data => new Promise(resolve => {
  const uuid = window.crypto.randomUUID();
  postData({ action: 'get', data, uuid });
  dataCallbacks.set(uuid, resolve);
});

const getIndexedResources = async (store, indices) => {
  const isArray = indices.constructor.name === 'Array';
  indices = [indices].flat();
  const indexedResources = await getData(Object.fromEntries([[store, indices]]));
  return isArray ? indexedResources[store] : indexedResources[store][0];
}
export const getIndexedPosts = indices => getIndexedResources('postStore', indices);
export const getIndexedProjects = indices => getIndexedResources('projectStore', indices);