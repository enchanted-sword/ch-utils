browser.runtime.onInstalled.addListener(async details => {
  await browser.tabs.query({ url: '*://*.cohost.org/*' }).then(async tabs => {
    tabs.forEach(tab => browser.tabs.reload(tab.id));
  });
  if (details.reason === 'update') {
    browser.action.setBadgeText({ text: '+' });
    browser.action.setBadgeTextColor({ color: '#20163d' });
    browser.action.setBadgeBackgroundColor({ color: '#42b0ff' });
    await browser.tabs.query({ url: '*://*.cohost.org/*' }).then(async tabs => {
      tabs.forEach(tab => browser.tabs.reload(tab.id));
    });
  }
  if (details.reason === 'install') {
    browser.tabs.create({ url: '/ui/permissions.html' })
    import(browser.runtime.getURL('/scripts/utils/jsTools.js')).then(({ importFeatures, featureify }) => {
      let installedFeatures, preferences;

      const setupFeatures = async () => {
        installedFeatures = await importFeatures();
        preferences = featureify(installedFeatures, preferences);
        browser.storage.local.set({ preferences });
        console.log(preferences);
      };

      setupFeatures().then(() => console.log('all set up!'));
    });    
  }
});