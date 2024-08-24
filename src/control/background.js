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
  postStore.createIndex('postId', 'postId', { unique: true });
  postStore.createIndex('publishedAt', 'publishedAt', { unique: false });
  postStore.createIndex('storedAt', 'storedAt', { unique: false });

  const projectStore = db.createObjectStore('projectStore', { keyPath: 'handle' }); // project store
  projectStore.createIndex('handle', 'handle', { unique: true });
  projectStore.createIndex('displayName', 'displayName', { unique: false });
  projectStore.createIndex('storedAt', 'storedAt', { unique: false });
  projectStore.createIndex('projectId', 'projectId', { unique: true });

  const bookmarkStore = db.createObjectStore('bookmarkStore', { autoIncrement: true });
  bookmarkStore.createIndex('postId', 'postId', { unique: true });
  bookmarkStore.createIndex('publishedAt', 'publishedAt', { unique: false });
  bookmarkStore.createIndex('storedAt', 'storedAt', { unique: false });
};
request.onsuccess = event => db = event.target.result;

const updateNeeded = date => (Date.now() - date) > EXPIRY_TIME;

const cacheData = dataObj => { // store data in database
  const stores = Object.keys(dataObj);
  const transaction = db.transaction(stores, 'readwrite');
  stores.map(store => {
    const objectStore = transaction.objectStore(store);
    [dataObj[store]].flat().map(data => {
      data.storedAt = Date.now();
      objectStore.put(data);
      console.log(`sucessfully stored ${objectStore.keyPath? data[objectStore.keyPath] : 'data'} to ${store}`);
    });
  });
};
const updateData = dataObj => { // merge data into database
  const stores = Object.keys(dataObj);
  const transaction = db.transaction(stores, 'readwrite');
  stores.map(store => {
    const objectStore = transaction.objectStore(store);
    const keyPath = objectStore.keyPath;
    [dataObj[store]].flat().map(data => {
      const key = data[keyPath];
      const dataRequest = objectStore.get(key);
      dataRequest.onsuccess = () => {
        const result = dataRequest.result;
        data.storedAt = Date.now();
        if (typeof result === 'object') {
          objectStore.put(Object.assign(result, data));
          console.log(`sucessfully updated ${data[objectStore.keyPath]} in ${store}`);
        } else {
          objectStore.put(data);
          console.log(`sucessfully stored ${data[objectStore.keyPath]} to ${store}`);
        }
      };
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

const getData = async (dataObj, options) => { // get data from database
  const stores = Object.keys(dataObj);
  const transaction = db.transaction(stores, 'readonly');
  transaction.onabort = event => console.error(event.target);
  const returnData = {};

  // we have to await Promise.all() each query we make so that getData doesn't resolve until we know returnData is fully populated
  await Promise.all(stores.map(store => {
    let storeOptions;
    if (store in options); storeOptions = options[store];
    const objectStore = transaction.objectStore(store);
    return Promise.all([dataObj[store]].flat().map(key => new Promise(resolve => {
      let dataRequest;
      if (storeOptions && 'index' in storeOptions) {
        const index = objectStore.index(storeOptions.index);
        dataRequest = index.get(key);
        console.log(storeOptions.index);
      }
      else dataRequest = objectStore.get(key);
      dataRequest.onsuccess = () => {
        const result = dataRequest.result;
        returnData[store] ??= []; // FINALLY! a use for the nullish coalescing assignment operator
        
        if (typeof result !== 'undefined') {
          result.expired = updateNeeded(result);
          console.log(`successfully retrieved ${key}`);
        } else if (!objectStore.keyPath) {
          console.warn(`key ${key} not found in ${store}. this store uses a key generator, did you mean to use an index instead of a keyPath?`);
        } else console.log(`key ${key} not found in ${store}`);

        returnData[store].push(result);
        resolve();
      };
    })));
  }));

  return returnData;
};

const getCursor = async ({ store, range }) => {
  const transaction = db.transaction([store], 'readonly');
  transaction.onabort = event => console.error(event.target);
  const objectStore = transaction.objectStore(store);
  objectStore.openCursor().onsuccess = event => {
    const cursor = event.target.result;
    if (cursor) {
      console.info(cursor.value);
      cursor.continue();
    }
    else console.info('end');
  }
};

let connectionPort;

const connected = port => {
  connectionPort = port;
  connectionPort.onMessage.addListener(async ({ action, data, options, uuid }) => {
    if (action === 'cache') cacheData(data);
    else if (action === 'update') updateData(data);
    else if (action === 'clear') clearData(data);
    else if (action === 'get') {
      if (!requestMap.has(data)) requestMap.set(data, getData(data, options));
      const result = await requestMap.get(data);

      connectionPort.postMessage({ action: 'response', uuid, data: result }); // sending the result back to database.js
    } else if (action === 'cursor') getCursor(data);
  });
}

browser.runtime.onConnect.addListener(connected);

browser.runtime.onSuspend.addListener(() => { console.log('suspending'); });