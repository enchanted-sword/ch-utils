'use strict';

{
  const { getURL } = browser.runtime;
  const isAppLoaded = () => !!document.getElementById('app');
  const readyState = () => !Array.from(document.querySelector('#app>.flex-col>.flex-col').childNodes).filter(node => node.nodeType === 8).length;
  const waitForLoad = () => new Promise(resolve => {
    window.requestAnimationFrame(() => (isAppLoaded() && readyState()) ? resolve() : waitForLoad().then(resolve));
  });

  waitForLoad().then(() => {
    const app = document.getElementById('app');
    app.dataset.display = 'horizontal';

    import(getURL('/scripts/utils/jsTools.js')).then(({ deepEquals, importFeatures }) => {
      let installedFeatures = {};
      let enabledFeatures = [];
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
            const scriptPath = getURL(`/scripts/${name}.js`);
            const { main, clean, update } = await import(scriptPath);
      
            window.requestAnimationFrame(() => main().catch(console.error));
      
            preferenceListeners[name] = (changes, areaName) => {
              const { preferences } = changes;
              if (areaName !== 'local' || typeof preferences === 'undefined') return;
        
              const changed = Object.keys(preferences.newValue).filter(key => !deepEquals(preferences?.newValue[key], preferences?.oldValue[key]));
              if ((changed.includes(name) && preferences?.newValue[name].enabled === true) 
                || feature.recieveUpdates?.some(key => changed.includes(key))) {
                if (update instanceof Function) update(preferences.newValue[name]);
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
            const scriptPath = getURL(`/scripts/${name}.js`);
            const { clean } = await import(scriptPath);

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

      const initFeatures = async () => {
        installedFeatures = await importFeatures();
  
        let { preferences } = await browser.storage.local.get('preferences');
  
        if (typeof preferences !== 'undefined') {
          await Promise.all(Object.keys(installedFeatures).map(async feature => {
            if (!preferences[feature]) preferences[feature] = installedFeatures[feature].preferences;
          }));
          Object.keys(preferences).forEach(key => { if (!(key in installedFeatures)) delete preferences[key]; });
        } else {
          preferences = {};
          Object.keys(installedFeatures).map(feature => preferences[feature] = transformPreferences(installedFeatures[feature].preferences));
        }
  
        enabledFeatures = Object.keys(preferences).filter(key => preferences[key].enabled);
  
        browser.storage.local.set({ preferences });
        if (enabledFeatures.length) enabledFeatures.forEach(executeFeature);
        browser.storage.onChanged.addListener(onStorageChanged);
      };
  
      initFeatures();
    });
  });
}