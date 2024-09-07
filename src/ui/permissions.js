'use strict';

{
  const permissions = {
    origins: ['*://*.cohost.org/*'],
  };

  const button = document.getElementById('grantPermissions');
  button.onclick = async function () {
    const granted = await browser.permissions.request(permissions);
    if (granted) {
      if (document.getElementById('reloadTabs').checked) {
        await browser.tabs.query({ url: '*://*.cohost.org/*' }).then(async tabs => {
          tabs.forEach(tab => browser.tabs.reload(tab.id));
        });
      }
      browser.tabs.create({ url: 'menu.html' });
      window.close();
    }
  };
}