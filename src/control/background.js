browser.runtime.onInstalled.addListener(async () => {
  browser.tabs.create({
    url: '../ui/permissions.html'
  });
});