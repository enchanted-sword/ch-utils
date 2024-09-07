'use strict';

{
  const { getURL } = browser.runtime;
  const isAppLoaded = () => !!document.getElementById('app');
  const readyState = () => document.querySelector('#app>.flex-col>.flex-col') && !Array.from(document.querySelector('#app>.flex-col>.flex-col').childNodes).filter(node => node.nodeType === 8).length;
  const waitForLoad = () => new Promise(resolve => {
    window.requestAnimationFrame(() => (isAppLoaded() && readyState()) ? resolve() : waitForLoad().then(resolve));
  });
  const runContextScript = () => {
    const script = document.createElement('script');
    script.src = getURL('control/pageContext.js');
    (document.head || document.documentElement).append(script);
    script.onload = () => script.remove();
  };

  runContextScript();

  waitForLoad().then(() => {

    import(browser.runtime.getURL('/scripts/utils/jsTools.js')).then(({ deepEquals, importFeatures, featureify }) => { // browser.runtime.getURL is only a valid escape when written in full
      let installedFeatures = {};
      let enabledFeatures = [];
      let preferences = {};
      const preferenceListeners = {};

      const executeFeature = async name => {
        const feature = installedFeatures[name];

        try {
          if ('css' in feature) {
            const link = Object.assign(document.createElement('link'), {
              rel: 'stylesheet',
              href: getURL(`/scripts/${name}.css`)
            });
      
            document.documentElement.appendChild(link);
          }
          if ('js' in feature) {
            const { main, clean, update } = await import(browser.runtime.getURL(`/scripts/${name}.js`)); // browser.runtime.getURL is only a valid escape when written in full
      
            window.requestAnimationFrame(() => main().catch(console.error));
      
            preferenceListeners[name] = (changes, areaName) => {
              const { preferences } = changes;
              if (areaName !== 'local' || typeof preferences === 'undefined') return;
              const newPref = preferences.newValue[name];
              const oldPref = preferences.oldValue[name];
        
              const changed = Object.keys(preferences.newValue).filter(key => !deepEquals(preferences?.newValue[key], preferences?.oldValue[key]));
              if ((changed.includes(name) && newPref.enabled === true) 
                || feature.recieveUpdates?.some(key => changed.includes(key))) {
                if (update instanceof Function && 'options' in newPref) {
                  const diff = Object.entries(newPref.options).filter(([key, val]) => val !== oldPref.options[key]);
                  update(newPref.options, Object.fromEntries(diff));
                }
                else clean().then(main);
              }
            };

            browser.storage.onChanged.addListener(preferenceListeners[name]);
          }
        } catch (e) { console.error(`failed to execute feature ${name}`, e); }
      };
      const destroyFeature = async name => {
        const feature = installedFeatures[name];

        try {
          if (feature.css) document.querySelector(`link[href='${getURL(`/scripts/${name}.css`)}']`).remove();
          if (feature.js) {
            const { clean } = await import(browser.runtime.getURL(`/scripts/${name}.js`)); // browser.runtime.getURL is only a valid escape when written in full

            window.requestAnimationFrame(() => clean().catch(console.error));

            if (browser.storage.onChanged.hasListener(preferenceListeners[name])) browser.storage.onChanged.removeListener(preferenceListeners[name]);
            delete preferenceListeners[name];
          }

          enabledFeatures = enabledFeatures.filter(val => val !== name);
        } catch (e) { console.error(`failed to destroy feature ${name}`, e); }
      };

      const onStorageChanged = async (changes, areaName) => {
        const { preferences } = changes;
        if (areaName !== 'local' || typeof preferences === 'undefined') return;
  
        const { oldValue = {}, newValue = {} } = preferences;

        console.log(preferences);
  
        const newlyEnabled = Object.keys(newValue).filter(feature => !oldValue[feature]?.enabled && newValue[feature]?.enabled);
        const newlyDisabled = Object.keys(oldValue).filter(feature => oldValue[feature]?.enabled && !newValue[feature]?.enabled);
  
        newlyEnabled.forEach(executeFeature);
        enabledFeatures.push(newlyEnabled);
        newlyDisabled.forEach(destroyFeature);
      };

      const initFeatures = async () => {
        installedFeatures = await importFeatures();
  
        ({ preferences } = await browser.storage.local.get('preferences'));
  
        preferences = featureify(installedFeatures, preferences);
        enabledFeatures = Object.keys(preferences).filter(key => preferences[key].enabled);
        browser.storage.local.set({ preferences });
        if (enabledFeatures.length) enabledFeatures.forEach(executeFeature);
        browser.storage.onChanged.addListener(onStorageChanged);
      };
  
      initFeatures();
    });
  });
}