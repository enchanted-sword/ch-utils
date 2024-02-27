/**
 * @param {string} name - Name of file
 * @returns {object|null} data
 */
export const getJsonFile = async name => {
  try {
    const url = browser.runtime.getURL(`/scripts/${name}.json`);
    const file = await fetch(url);
    const json = await file.json();

    return json;
  } catch (e) {
    console.error(name, e);
    return null;
  }
};

/**
 * Fetches the list of installed features
 * @returns {object[]} features
 */
export const importFeatures = async () => {
  const installedFeatures = await getJsonFile('!features');
  const features = {};

  await Promise.all(installedFeatures.map(async name => {
    const featureData = await getJsonFile(name);
    if (featureData) features[name] = featureData;
  }));

  return features;
};

/**
 * Fetches items from the extension's local storage
 * @param {string} keys - Array of strings corresponding to storage keys to fetch
 * @returns {object} Object of key-value pairs ({ version: 'X' })
 */ 
export const getStorage = async (keys = []) => {
  const storage = await browser.storage.local.get();
  const returnObj = {};
  for (const key of keys) {
    returnObj[key] = storage[key];
  }
  return returnObj;
};

/**
 * Fetches feature options
 * @param {string} feature - Feature name
 * @returns {object} options
 */
export const getOptions = async (feature = '') => {
  const { preferences } = await getStorage(['preferences']);

  return preferences[feature]?.options;
};

/**
 * Recursively compares two objects; returns true if they are identical and false otherwise
 * @param {object} x
 * @param {object} y 
 * @returns {boolean}
 */
export const deepEquals = (x, y) => {
  const tx = typeof x, ty = typeof y;
  return x && y && tx === 'object' && tx === ty ? (
    Object.keys(x).length === Object.keys(y).length &&
    Object.keys(x).every(key => deepEquals(x[key], y[key]))
  ) : (x === y);
};

/**
 * Delays inputs for a textarea or text input to reduce the amount of events processed by the event handler
 * @param {Function} func - Event handler to debounce
 */
export const debounce = func => {
  let timeoutID;
  return (...args) => {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => func(...args), 500);
  };
};