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

const transformPreferences = preferences => {
  const returnObj = { enabled: preferences.enabled };
  if ('options' in preferences) {
    returnObj.options = {};
    Object.keys(preferences.options).map(option => {
      returnObj.options[option] = preferences.options[option].value;
    });
  }
  return returnObj;
};
export const featureify = (installedFeatures, preferences) => {
  if (typeof preferences !== 'undefined') {
    Object.keys(installedFeatures).forEach(feature => { // push new features and options to existing preferences
      if (typeof preferences[feature] === 'undefined') {
        preferences[feature] = transformPreferences(installedFeatures[feature].preferences);
        preferences[feature].new = true;
      }
      if ('options' in installedFeatures[feature].preferences) {
        if (typeof preferences[feature].options === 'undefined') {
          preferences[feature].options = {};
          preferences[feature].new = true;
        }
        Object.keys(installedFeatures[feature].preferences.options).forEach(option => {
          if (typeof preferences[feature].options[option] === 'undefined') {
            if ('inherit' in installedFeatures[feature].preferences.options[option]) {
              const [inheritFeature, inheritOption] = installedFeatures[feature].preferences.options[option].inherit.inheritFrom.split('.');
              if (typeof preferences[inheritFeature].options[inheritOption] !== 'undefined') {
                switch (typeof preferences[inheritFeature].options[inheritOption]) {
                  case 'boolean':
                  case 'string':
                    preferences[feature].options[option] = installedFeatures[feature].preferences.options[option].inherit[String(preferences[inheritFeature].options[inheritOption])];
                    break;
                  case 'number':
                    preferences[feature].options[option] = preferences[inheritFeature].options[inheritOption];
                    break;
                }
              }
            } else preferences[feature].options[option] = installedFeatures[feature].preferences.options[option].value;
            preferences[feature].new = true;
          }
        });
      }
    })
    Object.keys(preferences).forEach(feature => { // delete removed features and options from existing preferences
      if (!(feature in installedFeatures)) return delete preferences[feature];
      if ('options' in preferences[feature]) {
        if (!('options' in installedFeatures[feature].preferences)) return delete preferences[feature].options;
        Object.keys(preferences[feature].options).forEach(option => {
          if (!(option in installedFeatures[feature].preferences.options)) delete preferences[feature].options[option];
        });
      }
    });
  } else preferences = Object.fromEntries(Object.entries(installedFeatures).map(([name, feature]) => [name, transformPreferences(feature.preferences)]));

  return preferences;
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
export const debounce = function(func) {
  let timeoutID;
  return function(...args) {
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => func(...args), 500);
  };
};

/**
 * Reduces an array to unqiue entries 
 * @param {Array} array
 * @returns {Array}
 */
export const unique = array => array.filter((val, i, arr) => i === arr.indexOf(val));