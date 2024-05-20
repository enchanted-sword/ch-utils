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
    const onTextInput = async function () {
      const value = this.value;
      const [ name, key ] = this.name.split('-');
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
      console.log(preference);

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
                  className: 'ui-inputWrapper',
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
              children: [{ children: ['description' in feature ? feature.description : ''] }]
            }
          ]
        });
        featureItem.querySelector('.ui-inputWrapper').append($(`<label for="ui-feature-${name}">toggle ${feature.name}</label`)[0]); // for some reason, vanilla js is incapable of setting the for attribute on labels, so jquery is used

        if (preference.enabled) featureItem.querySelector('input').setAttribute('checked', '');

        if ('options' in preference) {
          const optionsWrapper = $('<div>', { class: 'ui-inputWrapper ui-options', type: 'multiSelect' });

          Object.keys(feature.preferences.options).forEach(key => {
            const option = feature.preferences.options[key];
            const tooltip = $(`<div class="ui-tooltip">${option.tooltip}</div>`);

            switch (option.type) {
              case 'toggle':
                const toggleWrapper = $(`<div class="ui-multiSelectWrapper"></div>`);
                const input = $('<input>', { class: 'ui-multiSelect', type: 'checkbox', id: `ui-feature-${name}-${key}`, name: `${name}-${key}` });
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
              case 'multiSelect':
                const multiSelectInputWrapper = $(`<div class="ui-extendedSelectWrapper "><h3>${option.name}</h3></div>`);
                optionsWrapper.append(multiSelectInputWrapper);

                Object.keys(option.options).forEach(subKey => {
                  const subOption = option.options[subKey];
                  const multiSelectWrapper = $(`<div class="ui-multiSelectWrapper ui-extendedSelect"><h2>${subOption.name}</h2></div>`);
                  const input = $('<input>', { class: 'ui-multiSelect', type: 'checkbox', id: `ui-feature-${name}-${key}-${subKey}`, name: `${name}-${key}` });
                  const label = $(`<label for="ui-feature-${name}-${key}-${subKey}" name="${name}-${key}">select ${subOption.name}</label>`);
      
                  multiSelectWrapper.append(input);
                  multiSelectWrapper.append(label);
                  multiSelectInputWrapper.append(multiSelectWrapper);
      
                  if (preference.options[key][subKey]) input.attr('checked', '');
      
                  input.on('change', async function () {
                    const checked = this.checked ? true : false;
                    let { preferences } = await browser.storage.local.get('preferences');
          
                    if (checked) preferences[name].options[key].push(subKey);
                    else preferences[name].options[key] = preferences[name].options[key].filter(item => item !== subKey);

                    preferences[name].options[key] = [...new Set(preferences[name].options[key])];
      
                    browser.storage.local.set({ preferences });
                  });
                });
                break;
              case 'select':
                const selectInputWrapper = $(`<div class="ui-extendedSelectWrapper "><label for="ui-feature-${name}-${key}">${option.name}</label></div>`);
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
              case 'textarea':
                const textInputWrapper = $(`<div class="ui-extendedSelectWrapper"><h3>${option.name}</h3></div>`);
                const textInput = $('<textarea>', {
                  class: 'ui-textInput',
                  autocomplete: 'off',
                  autofill: 'off',
                  spellcheck: 'false',
                  placeholder: option.placeholder,
                  id: `ui-feature-${name}-${key}`,
                  name: `${name}-${key}`
                });
                textInput.text(preference.options[key]);

                textInputWrapper.append(textInput);
                optionsWrapper.append(textInputWrapper);

                textInput.on('input', debounce(onTextInput));
                break;
              case 'number': {
                const numInputWrapper = $(`<div class="ui-extendedSelectWrapper align-end"></div>`);
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
                  preferences[name].options[key] = value;
                  browser.storage.local.set({ preferences });
                });
                break;
              } case 'listSelect': {
                const listSelectInputWrapper = $(`<div class="ui-extendedSelectWrapper"><h3>${option.name}</h3></div>`);
                const listSelectWrapper = $(`<div class="ui-listSelectWrapper"></div>`);

                optionsWrapper.append(listSelectInputWrapper);
                listSelectInputWrapper.append(listSelectWrapper);

                option.listOptions.forEach(listItem => {
                  const normalizedString = listItem.replace(/\s/g, '');
                  const input = $('<input>', { class: 'ui-listSelect', type: 'checkbox', id: `ui-feature-${name}-${key}-${normalizedString}`, name: `${name}-${key}` });
                  const label = $(`<label for="ui-feature-${name}-${key}-${normalizedString}" name="${name}-${key}">${listItem}</label>`);
      
                  listSelectWrapper.append(input);
                  listSelectWrapper.append(label);
      
                  if (preference.options[key].includes(listItem)) input.attr('checked', '');
      
                  input.on('change', async function (event) {
                    const checked = event.target.checked ? true : false;
                    let { preferences } = await browser.storage.local.get('preferences');
          
                    if (checked) preferences[name].options[key].push(listItem);
                    else preferences[name].options[key] = preferences[name].preferences[key].list.filter(item => item !== listItem);

                    preferences[name].options[key] = [...new Set(preferences[name].options[key])];

                    browser.storage.local.set({ preferences });
                  });
                });
                break;
              } case 'slider': {
                const sliderInputWrapper = $('<div>', { class: 'ui-selectWrapper' });
                const label = $(`<label for="ui-feature-${name}-${key}" name="${name}-${key}">${option.name}</label>`);
                const sliderInput = $('<input>', {
                  class: 'ui-slider',
                  type: 'range',
                  id: `ui-feature-${name}-${key}`,
                  list: `ui-feature-${name}-${key}-list`,
                  name: `${name}-${key}`,
                  min: option.min,
                  max: option.max,
                  step: option.step,
                  value: preference.options[key],
                  default: option.default
                });
                const datalist = $('<datalist>', { id: `ui-feature-${name}-${key}-list` });
                for (const listOption of option.datalist) {
                  const option = $('<option>', { value: listOption.value, label: listOption.label });
                  datalist.append(option);
                }

                sliderInputWrapper.append(label);
                sliderInputWrapper.append(sliderInput);
                sliderInputWrapper.append(datalist);
                optionsWrapper.append(sliderInputWrapper);

                sliderInput.on('change', async function (event) {
                  const value = event.target.value;
                  let { preferences } = await browser.storage.local.get('preferences');
                  preferences[name].options[key] = value;
                  browser.storage.local.set({ preferences });
                });
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

    const onColorChange = async (color, input) => {
      let { preferences } = await browser.storage.local.get('preferences');
      $(input.nextElementSibling).css('background', color);
      const [name, key, optionsKey] = input.getAttribute('name').split('-');
      preferences[name].preferences[key][optionsKey] = color;
      browser.storage.local.set({ preferences });
    };
    
    init();
  }()
)}