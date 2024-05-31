'use strict';
{(
  async function () {
    const { debounce, importFeatures } = await import('../scripts/utils/jsTools.js');
    const { noact } = await import('../scripts/utils/noact.js');

    const onToggleFeature = async function () {
      const name = this.getAttribute('name');
      const checked = this.checked ? true : false;
      let { preferences } = await browser.storage.local.get('preferences');

      if (checked) preferences[name].enabled = true;
      else preferences[name].enabled = false;
      browser.storage.local.set({ preferences });

      const secondaryContent = this.closest('li').querySelector('.ui-secondaryContent');
      if (secondaryContent) {
        const state = secondaryContent.getAttribute('active') === 'true' ? true : false;
        if (!state && checked || state && !checked) this.closest('.ui-primaryContent').querySelector('.ui-featureTitle').click();
      }
    };
    const onTextInput = async function ({ target }) {
      const value = target.value;
      const [ name, key ] = target.name.split('-');
      let { preferences } = await browser.storage.local.get('preferences');
      preferences[name].options[key] = value;

      browser.storage.local.set({ preferences });
    };

    const title = featureTitle => {
      return {
        className: 'ui-featureTitle',
        onclick: function () {
          this.closest('li').dataset.new = false;
          const secondaryContent = this.closest('li').querySelector('.ui-secondaryContent');
          const caret = this.querySelector('svg');
          if (secondaryContent.getAttribute('active') === 'true') {
            secondaryContent.setAttribute('active', 'false');
            caret.style.transform = 'rotate(180deg)';
          } else {
            secondaryContent.setAttribute('active', 'true');
            caret.style.transform = 'rotate(360deg)';
          }
        },
        children: [
          {
            tag: 'h2',
            children: [featureTitle]
          },
          {
            className: 'ui-caretWrapper',
            children: [{
              tag: 'svg',
              width: 24,
              height: 24,
              style: 'transform: rotate(180deg);',
              children: [{
                tag: 'use',
                href: '#icons-caret'
              }]
            }]
          }
        ]
      }
    };

    const newFeatureItem = (name, feature = {}, preference = {}) => {
      let featureItem;

      try {
        featureItem = noact({
          tag: 'li',
          dataset: {
            searchable: JSON.stringify(feature),
            new: preference.new ? true : false
          },
          children: [
            {
              className: 'ui-primaryContent',
              children: [
                title(feature.title),
                {
                  className: 'ui-toggleWrapper',
                  children: [
                    {
                      tag: 'input',
                      type: 'checkbox',
                      className: 'ui-toggle',
                      id: `ui-feature-${name}`,
                      name: feature.name,
                      onchange: onToggleFeature
                    }
                  ]
                }
              ]
            },
            {
              className: 'ui-secondaryContent',
              children: [
                'description' in feature ? { children: [feature.description] } : '',
                'links' in feature ? {
                  tag: 'p', 
                  children: [
                    'see: ',
                    feature.links.map((link, i) => {return [
                      {
                        href: link.url,
                        children: [link.text]
                      },
                      i === feature.links.length - 1 ? '' : ', '
                    ]})
                  ]
                } : ''
              ]
            }
          ]
        });
        featureItem.querySelector('.ui-toggleWrapper').append($(`<label for="ui-feature-${name}">toggle ${feature.name}</label`)[0]); // for some reason, vanilla js is incapable of setting the for attribute on labels, so jquery is used

        if (preference.enabled) featureItem.querySelector('input').setAttribute('checked', '');

        if ('options' in preference) {
          const optionsWrapper = $('<div class="ui-options"><h2>options</h2></div>');

          Object.keys(feature.preferences.options).forEach(key => {
            const option = feature.preferences.options[key];
            const tooltip = $(`<div class="ui-tooltip">${option.tooltip}</div>`);

            switch (option.type) {
              case 'toggle': {
                const toggleWrapper = $(`<div class="ui-inputWrapper ui-checkboxWrapper"></div>`);
                const input = $('<input>', { class: 'ui-checkbox', type: 'checkbox', id: `ui-feature-${name}-${key}`, name: `${name}-${key}` });
                const label = $(`<label for="ui-feature-${name}-${key}" name="${name}-${key}">${option.name}</label>`);

                toggleWrapper.append(label);
                toggleWrapper.append(input);
                toggleWrapper.append(tooltip);
                optionsWrapper.append(toggleWrapper);

                if (preference.options[key]) input.attr('checked', '');

                input.on('change', async function () {
                  const checked = this.checked ? true : false;
                  let { preferences } = await browser.storage.local.get('preferences');

                  if (checked) preferences[name].options[key] = true;
                  else preferences[name].options[key] = false;

                  browser.storage.local.set({ preferences });
                });
                break;
              } case 'select': {
                const selectInputWrapper = $(`<div class="ui-inputWrapper "><label for="ui-feature-${name}-${key}">${option.name}</label></div>`);
                const selectInput = $(`<select class="ui-select" id="ui-feature-${name}-${key}" name="${name}-${key}"></select>`);

                Object.keys(option.options).forEach(subKey => {
                  const subOption = option.options[subKey];
                  const value = $(`<option value="${subOption.value}">${subOption.name}</option>`);
      
                  selectInput.append(value);
      
                  if (preference.options[key] === subOption.value) value.attr('selected', '');
                });

                selectInputWrapper.append(selectInput);
                selectInputWrapper.append(tooltip);
                optionsWrapper.append(selectInputWrapper);

                selectInput.on('change', async function () {
                  const { value } = this;
                  let { preferences } = await browser.storage.local.get('preferences');
        
                  preferences[name].options[key] = value;
    
                  browser.storage.local.set({ preferences });
                });
                break;
              } case 'number': {
                const numInputWrapper = $(`<div class="ui-inputWrapper ui-numInputWrapper"></div>`);
                const label = $(`<label for="ui-feature-${name}-${key}" name="${name}-${key}">${option.name}</label>`);
                const numInput = $('<input>', {
                  type: 'number',
                  class: 'ui-numInput',
                  placeholder: option.value,
                  min: option.min,
                  max: option.max,
                  step: option.step,
                  style: `width: ${String(option.max).length}em;`,
                  value: preference.options[key],
                  id: `ui-feature-${name}-${key}`,
                  name: `${name}-${key}`
                });

                numInputWrapper.append(label);
                numInputWrapper.append(numInput);
                numInputWrapper.append(tooltip);
                optionsWrapper.append(numInputWrapper);

                numInput.on('change', async function () {
                  const value = this.value;
                  let { preferences } = await browser.storage.local.get('preferences');
                  preferences[name].options[key] = Number(value);
                  browser.storage.local.set({ preferences });
                });
                break;
              } case 'text': {
                const textInputWrapper = $(`<div class="ui-inputWrapper"></div>`);
                const label = $(`<label for="ui-feature-${name}-${key}" name="${name}-${key}" list="${name}-${key}-list">${option.name}</label>`);
                const textInput = $('<input>', {
                  class: 'ui-textInput',
                  autocorrect: 'off',
                  spellcheck: 'false',
                  placeholder: option.placeholder,
                  id: `ui-feature-${name}-${key}`,
                  name: `${name}-${key}`,
                  value: preference.options[key]
                });
                if ('list' in option) {
                  const list = $(`<datalist id="${name}-${key}-list">${option.list.map(item => `<option value="${item}"></option>`).join('')}</datalist>`);
                  textInputWrapper.append(list);
                }

                textInputWrapper.append(label);
                textInputWrapper.append(textInput);
                textInputWrapper.append(tooltip);
                optionsWrapper.append(textInputWrapper);

                textInput.on('input', debounce(onTextInput));
                break;
              }
            }
          });

          featureItem.querySelector('.ui-secondaryContent').append(optionsWrapper[0]); // jquery to html conversion
        }
      } catch (e) {
        console.error(`error creating feature item '${name}':`, e);
      }

      return featureItem;
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

    const setupButtons = className => {
      document.querySelectorAll(`.${className}`).forEach(btn => btn.addEventListener('click', function () {
        [...this.closest(`#${className}s`).querySelectorAll(`:scope .${className}`)].filter(elem => elem.matches(`.${className}`)).forEach(btn => btn.setAttribute('active', 'false'));
        this.setAttribute('active', 'true');
        let target = `ui-${this.getAttribute('target')}`;
        target = document.getElementById(target);
        const classes = target.classList;
        [...target.parentElement.children].filter(elem => elem.matches(`.${[...classes].join('.')}`)).forEach(elem => elem.setAttribute('active', 'false'));
        target.setAttribute('active', 'true');
      }));
    };
    const createFeatures = (installedFeatures, preferences) => {
      $('[data-searchable]').remove();

      Object.keys(installedFeatures).forEach(key => {
        const feature = installedFeatures[key];
        const preference = preferences[key];

        if (feature && preference) {
          const featureItem = newFeatureItem(key, feature, preference, preferences);
          $(`#ui-featureContainer`).append(featureItem);
        }
      });
    };

    const onSearch = ({ target }) => {
      const query = target.value.replace(/[^\w]/g, '');
      if (query) {  
        document.getElementById('ui-searchFilter').innerText = `
          #ui-featureContainer > li:not([data-searchable*="${query}" i]) { display: none; }
        `;
      }
      else document.getElementById('ui-searchFilter').innerText = '';
    };

    const init = async () => {
      browser.browserAction.setBadgeText({ text: '' });

      const installedFeatures = await importFeatures(); // "await has no effect on this type of expression"- it does, actually!
      const { preferences } = await browser.storage.local.get('preferences');

      createFeatures(installedFeatures, preferences);

      setupButtons('ui-tab');
      setupButtons('ui-featureTab');
      document.getElementById('ui-preferenceText').value = JSON.stringify(preferences, null, 2);

      document.getElementById('ui-export').addEventListener('click', async () => {
        const { preferences } = await browser.storage.local.get('preferences');
        const preferenceExport = new Blob([JSON.stringify(preferences, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(preferenceExport);
        const exportLink = document.createElement('a');
        const date = new Date();
        const yy = date.getFullYear().toString();
        const mm = (date.getMonth()).toString();
        const dd = date.getDate().toString();
        exportLink.href = url;
        exportLink.download = `chutils preference export ${mm}-${dd}-${yy}`;

        document.documentElement.append(exportLink);
        exportLink.click();
        exportLink.remove();
        URL.revokeObjectURL(url);
      });
      document.getElementById('ui-import').addEventListener('click', () => {
        let preferences;
        const input = document.getElementById('ui-preferenceText');
        if (!input.value) return;

        preferences = JSON.parse(input.value);
        try {
          if (typeof preferences === 'object') {
            browser.storage.local.set({ preferences });
            console.log('successfully imported preferences from file!');
          } else throw 'invalid data type';
        } catch (e) {
          console.error('failed to import preferences from file!', e);
          $('#ui-import').text('import failed!').css('background-color', 'rgb(var(--red))');
          setTimeout(() => {
            $('#ui-import').text('import preferences').css('background-color', 'rgb(var(--white))');
          }, 2000);
        }

        createFeatures(installedFeatures, preferences);
      });
      document.getElementById('ui-reset').addEventListener('click', () => {
        const preferences = {};
        Object.keys(installedFeatures).map(feature => preferences[feature] = transformPreferences(installedFeatures[feature].preferences));

        browser.storage.local.set({ preferences });
        createFeatures(installedFeatures, preferences);
      });
      document.getElementById('ui-featureSearch').addEventListener('input', debounce(onSearch));

      const version = browser.runtime.getManifest().version;
      document.getElementById('version').innerText = `version: v${version}`;

      Object.keys(preferences).forEach(key => {if (preferences[key].new) delete preferences[key].new; });
      browser.storage.local.set({ preferences });
    };
    
    init();
  }()
)}