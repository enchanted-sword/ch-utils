browser.runtime.onInstalled.addListener(async () => {
  await browser.tabs.query({ url: '*://*.cohost.org/*' }).then(async tabs => {
    tabs.forEach(tab => browser.tabs.reload(tab.id));
  });
  browser.browserAction.setBadgeText({ text: '+' });
  browser.browserAction.setBadgeTextColor({ color: '#20163d' });
  browser.browserAction.setBadgeBackgroundColor({ color: '#42b0ff' });
});