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
    import(browser.runtime.getURL('/scripts/utils/jsTools.js')).then(({ importFeatures, featureify }) => {
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