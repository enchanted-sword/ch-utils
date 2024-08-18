const { getURL } = browser.runtime;

browser.runtime.onInstalled.addListener(async details => {
  await browser.tabs.query({ url: '*://*.cohost.org/*' }).then(async tabs => {
    tabs.forEach(tab => browser.tabs.reload(tab.id));
  });
  if (details.reason === 'update') {
    browser.browserAction.setBadgeText({ text: '+' });
    browser.browserAction.setBadgeTextColor({ color: '#20163d' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#42b0ff' });
  }
  if (details.reason === 'install') {
    import(getURL('/scripts/utils/jsTools.js')).then(({ importFeatures, featureify }) => {
      let installedFeatures, preferences;

      const setupFeatures = async () => {
        installedFeatures = await importFeatures();
        preferences = featureify(installedFeatures, preferences);
        browser.storage.local.set({ preferences });
        console.log(preferences);
      };

      setupFeatures().then(() => browser.tabs.create({ url: 'ui/menu.html' }));
    });    
  }
});

const DB_VERSION = 1; // database version
const EXPIRY_TIME = 86400000;
let db;

const request = window.indexedDB.open('ch-utils', DB_VERSION);
request.onerror = event => console.error('error opening database: ', event);
request.onupgradeneeded = event => { // initialise database
  let db = event.target.result;
  db.onerror = event => console.error('database error: ', event.target.errorCode);

  const postStore = db.createObjectStore('postStore', { keyPath: 'postId' }); // post store
  postStore.createIndex('publishedAt', 'publishedAt', { unique: false });
  postStore.createIndex('storedAt', 'storedAt', { unique: false });

  const projectStore = db.createObjectStore('projectStore', { keyPath: 'handle' }); // project store
  projectStore.createIndex('displayName', 'displayName', { unique: false });
  projectStore.createIndex('storedAt', 'storedAt', { unique: false });
  projectStore.createIndex('projectId', 'projectId', { unique: true });
};
request.onsuccess = event => db = event.target.result;

const updateNeeded = date => (Date.now() - date) > EXPIRY_TIME;

const cacheData = dataObj => { // store data in database
  const stores = Object.keys(dataObj);
  const transaction = db.transaction(stores, 'readwrite');
  stores.map(key => {
    const objectStore = transaction.objectStore(key);
    [dataObj[key]].flat().map(data => {
      data.storedAt = Date.now();
      objectStore.put(data);
      console.log(`sucessfully stored ${data[objectStore.keyPath]} to ${key}`);
    });
  });
};
const clearData = dataObj => { // delete data from database
  const stores = Object.keys(dataObj);
  const transaction = db.transaction(stores, 'readwrite');
  stores.map(key => {
    const objectStore = transaction.objectStore(key);
    [dataObj[key]].flat().map(index => {
      objectStore.delete(index);
    });
  });
};

const requestMap = new Map();

const getData = dataObj => new Promise(async resolve => { // get data from database
  const stores = Object.keys(dataObj);
  const transaction = db.transaction(stores, 'readonly');
  transaction.onabort = event => console.error(event.target);
  const returnData = {};

  // we have to await Promise.all() each query we make so that getData doesn't resolve until we know returnData is fully populated
  await Promise.all(stores.map(key => new Promise(async resolve => {
    const objectStore = transaction.objectStore(key);
    await Promise.all([dataObj[key]].flat().map(index => new Promise(async resolve => {
      const dataRequest = objectStore.get(index);
      dataRequest.onsuccess = () => {
        returnData[key] ??= []; // FINALLY! a use for the nullish coalescing assignment operator
        try {
          const { result } = dataRequest;
          result.expired = updateNeeded(result);
          console.log(`successfully retrieved ${index}`);
          returnData[key].push(result);
        } catch {
          console.log(`index ${index} not found in ${key}`);
          returnData[key].push(undefined);
        } finally {
          resolve();
        }
      }
    })));
    resolve();
  })));
  resolve(returnData);
});

let connectionPort;

const connected = port => {
  connectionPort = port;
  connectionPort.onMessage.addListener(async ({ action, data, uuid }) => {
    if (action === 'cache') cacheData(data);
    else if (action === 'clear') clearData(data);
    else if (action === 'get') {
      if (!requestMap.has(data)) requestMap.set(data, getData(data));
      const result = await requestMap.get(data);
      connectionPort.postMessage({ action: 'response', uuid, data: result }); // sending the result back to database.js
    }
  });
}

browser.runtime.onConnect.addListener(connected);

browser.runtime.onSuspend.addListener(() => { console.log('suspending'); });