browser.runtime.onInstalled.addListener(async () => {
  /* browser.tabs.create({
    url: '../ui/permissions.html'
  }); */
  await browser.tabs.query({ url: '*://*.cohost.org/*' }).then(async tabs => {
    tabs.forEach(tab => browser.tabs.reload(tab.id));
  });
});