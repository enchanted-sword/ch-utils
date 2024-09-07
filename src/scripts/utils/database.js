const { openDB, wrap } = idb;

const DB_VERSION = 1; // database version
const EXPIRY_TIME = 86400000; // period after which data is considered expired

const conditionalCreateStore = (tx, storeName, options) => {
  const { db } = tx;
  let store;
  if (!db.objectStoreNames.contains(storeName)) {
    store = db.createObjectStore(storeName, options);
    store = wrap(store);
  } else store = wrap(tx.objectStore(storeName));
  return store;
};
const conditionalCreateIndex = (store, indexName, keyPath, options) => {
  if (!store.indexNames.contains(indexName)) {
    store.createIndex(indexName, keyPath, options);
  }
};

const db = await openDB('ch-utils', DB_VERSION, {
  upgrade: (db, oldVersion, newVersion, transaction) => {
    console.info(`database upgraded from v${oldVersion} to v${newVersion}`);
    
    const postStore = conditionalCreateStore(transaction, 'postStore', { keyPath: 'postId' });
    conditionalCreateIndex(postStore, 'postId', 'postId', { unique: true });
    conditionalCreateIndex(postStore, 'publishedAt', 'publishedAt', { unique: false });
    conditionalCreateIndex(postStore, 'storedAt', 'storedAt', { unique: false });

    const projectStore = conditionalCreateStore(transaction, 'projectStore', { keyPath: 'handle' }); // project store
    conditionalCreateIndex(projectStore, 'handle', 'handle', { unique: true });
    conditionalCreateIndex(projectStore, 'displayName', 'displayName', { unique: false });
    conditionalCreateIndex(projectStore, 'storedAt', 'storedAt', { unique: false });
    conditionalCreateIndex(projectStore, 'projectId', 'projectId', { unique: true });

    const bookmarkStore = conditionalCreateStore(transaction, 'bookmarkStore', { keyPath: 'bookmarkId', autoIncrement: true });
    conditionalCreateIndex(bookmarkStore, 'postId', 'postId', { unique: true });
    conditionalCreateIndex(bookmarkStore, 'publishedAt', 'publishedAt', { unique: false });
    conditionalCreateIndex(bookmarkStore, 'storedAt', 'storedAt', { unique: false });
  }
});

const updateNeeded = date => (Date.now() - date) > EXPIRY_TIME;
const smartGetData = async (store, data) => {
  let val
  const key = data[store.keyPath];
  if (!key) {
    const indices = Array.from(store.indexNames).filter(index => index in data);
    if (indices.length) {
      const targetIndex = indices.find(index => store.index(index).unique) || indices[0]; // prioritise unique indices
      val = await store.index(targetIndex).get(data[targetIndex])
    } else return void 0;
  } else {
    val = await store.get(key);
  }
  return val;
};

/** caches data into stores, overwriting any existing data tied to those keys (if not an autoincremented store)
 * @param {object} data - object containing key-value pairs of object stores and data to enter into those stores
 * @returns {void}
 */
export const cacheData = dataObj => {
  const dataStores = Object.keys(dataObj);
  const tx = db.transaction(dataStores, 'readwrite');
  dataStores.map(dataStore => {
    const store = tx.objectStore(dataStore);
    [dataObj[dataStore]].flat().map(data => store.put(data));
  });
};

/** updates cached data in stores. stores data by default if it dones't already exist
 * @param {object} data - object containing key-value pairs of object stores and data to update those stores with
 * @param {object} [options] - object containing key-value pairs of object stores and options objects to use for those stores;
 * @param {string} [options.STORE_NAME.index] - the index to use when updating data
 * @param {boolean} [options.STORE_NAME.updateStrict] - if true, data is only updated if the key is already present in the store
 * @returns {void}
 */
export const updateData = (dataObj, options = null) => {
  const dataStores = Object.keys(dataObj);
  const tx = db.transaction(dataStores, 'readwrite');
  dataStores.map(dataStore => {
    let storeOptions;
    options && (storeOptions = options[dataStore]);
    const store = tx.objectStore(dataStore);
    [dataObj[dataStore]].flat().map(async data => {
      let updateData;
      const existingData = await smartGetData(store, data);
      if (storeOptions?.updateStrict && typeof existingData === 'undefined') return;
      else if (typeof existingData === 'object') updateData = Object.assign(structuredClone(existingData), data);
      else updateData = data;
      store.put(updateData);
    });
  });
};

/**
 * @param {object} data - object containing key-value pairs of object stores and keys to retrieve from those stores
 * @param {object} [options] - object containing key-value pairs of object stores and options objects to use for those stores;
 * @param {string} [options.STORE_NAME.index] - the index to use when retrieving data
 * @returns {Promise <object>}
 */
export const getData = async (dataObj, options = null) => {
  const dataStores = Object.keys(dataObj);
  const tx = db.transaction(dataStores, 'readwrite');
  const returnObj = {};

  dataStores.map(async dataStore => {
    let storeOptions, index;
    options && (storeOptions = options[dataStore]);
    const store = tx.objectStore(dataStore);
    storeOptions?.index && (index = store.index(storeOptions.index));
    const storeData = await Promise.all([dataObj[dataStore]].flat().map(async key => {
      if (!key) {
        console.warn('getData: key is undefined');
        return void 0;
      }
      if (index) return index.get(key);
      else return store.get(key);
    }));
    returnObj[dataStore] = storeData.map(data => structuredClone(data));
  });

  await tx.done;
  return returnObj;
};

/**
 * opens an IDBCursor on an object store and returns its contents as an array
 * @param {string} storeName - object store to open a cursor on
 * @param {string|IDBKeyRange} [query] - an index or IDBKeyRange to be queried
 * @returns {Promise <object[]>}
 */
export const getCursor = async (storeName, query = null) => {
  const tx = db.transaction(storeName);
  const returnData = [];
  let cursor = await tx.store.openCursor(query);
  while (cursor) {
    returnData.push(structuredClone(cursor.value));
    cursor = await cursor.continue();
  }
  await tx.done;
  return returnData;
};

/** deletes data from stores
 * @param {object} data - object containing key-value pairs of object stores and keys to delete from those stores
 * @param {object} [options] - object containing key-value pairs of object stores and options objects to use for those stores;
 * @param {string} [options.STORE_NAME.index] - the index to use when deleting data
 * @returns {void}
 */
export const clearData = (dataObj, options = null) => {
  const dataStores = Object.keys(dataObj);
  const tx = db.transaction(dataStores, 'readwrite');

  dataStores.map(async dataStore => {
    let storeOptions, index;
    options && (storeOptions = options[dataStore]);
    const store = tx.objectStore(dataStore);
    'index' in storeOptions && (index = store.index(storeOptions.index));
    [dataObj[dataStore]].flat().map(async key => {
      if (!key) {
        console.warn('clearData: key is undefined');
        return;
      }
      if (index) {
        const cursor = await index.openCursor(IDBKeyRange.only(key));
        console.log(cursor);
        cursor.delete();
      }
      else store.delete(key);
    });
  });
};

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
};

/**
 * @param {Number|Number[]} keys - single postId or array of postIds to fetch from the database
 * @returns {object|object[]} post(s) - type of return matches type of input
 */
export const getIndexedPosts = keys => getIndexedResources('postStore', keys);

/**
 * @param {Number|Number[]} keys - single key (handle or projectId) or array of indices to fetch from the database
 * @returns {Promise <object|object[]>} project(s) - type of return matches type of input
 */
export const getIndexedProjects = keys => getIndexedResources('projectStore', keys);