import { noact } from './noact.js';

/**
 * @param {string} css - string of CSS rules 
 * @returns {Element} an HTML <style> element containing the given rules
 */
export const style = (css = '') => noact({
  tag: 'style',
  className: 'ch-utils-style',
  children: [css]
});