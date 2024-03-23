let connectionPort;
let connected = false

const postData = data => {
  if (!connected) {
    connectionPort = browser.runtime.connect({ name: "dnrPort" });
    connected = true;
    
    connectionPort.onDisconnect.addListener(() => connected = false)
  }
  connectionPort.postMessage({ action: 'dynamicDnr', data });
};

const encodeId = str => {
  let num = 0
  for (const char of str) num += char.charCodeAt(0);
  return num;
}

export const declarativeNetRequest = Object.freeze({
  /**
   * Creates a DNR rule with a unique id
   * @param {*} uniqueIdentifier - Feature name or other unique identifying string
   * @param {*} regexFilter - declarativeNetRequest regexFilter string
   * @param {*} action - declarativeNetRequest action object
   * @returns declarativeNetRequest rule
   */
  newRule: (uniqueIdentifier, condition, action) => {
    return {
      id: encodeId(uniqueIdentifier),
      priority: 6,
      condition,
      action
    };
  },

  /**
   * Updates the extension's dynamic declarativeNetRequest rules
   * @param {Array} newRules - Array of declarativeNetRequest rules created with the declarativeNetRequest.registerRule() method
   */
  updateDynamicRules: (newRules = []) => {
    postData({ removeRuleIds: newRules.map(rule => rule.id), newRules });
  },

  /**
   * Removes DNR rules created with the given unique identifiers
   * @param {string[]} uniqueIdentifiers - Array of unique identifiers used to construct existing declarativeNetRequest rules
   */
  clearDynamicRules: (uniqueIdentifiers = []) => {
    postData({ removeRuleIds: uniqueIdentifiers.map(id => encodeId(id)) });
  }
});

/**
 * Updates the extension's dynamic declarativeNetRequest rules
 * @param {Array} newRules - Array of declarativeNetRequest rules
 * @param {number[]} removeRuleIds - Array of rule ids to remove
 */
