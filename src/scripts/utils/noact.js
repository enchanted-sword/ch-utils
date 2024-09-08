const validTags = [
  'a','abbr','abbr','address','embed','object','area','article','aside','audio','b','base','bdi','bdo',
  'blockquote','body','br','button','canvas','caption','cite','code','col','colgroup','data','datalist',
  'dd','del','details','dfn','dialog','ul','div','dl','dt','em','embed','fieldset','figcaption','figure',
  'footer','form','h1','h2','h3','h4','h5','h6','head','header','hr','html','i','iframe','img','input',
  'ins','kbd','label','legend','li','link','main','map','mark','meta','meter','nav','noscript','object',
  'ol','optgroup','option','output','p','param','picture','pre','progress','q','rp','rt','ruby','s','samp',
  'script','section','select','small','source','span','del','s','strong','style','sub','summary','sup',
  'table','tbody','td','template','textarea','tfoot','th','thead','time','title','tr','track','u','ul',
  'var','video','wbr'
];
const svgNs = [
  'circle','clipPath','defs','ellipse','g','line','linearGradient','marker','mask','mpath','path','pattern',
  'polygon','polyline','radialGradient','rect','set','stop','svg','symbol','text','textPath','use','view'
];

const isArrow = fn => !fn.toString().replace('async', '').trim().startsWith('function');

/**
 * simultaneously the best and worst replacement for react, jquery, innerHTML, you name it
 * @param {object} obj - element-like object. all properties except `tag` and `children` are set as properties on the element.
 * @property tag - any valid html or svg tag, intuitively assigned if not provided
 * @property children - can be any combination of existing elements, strings (converted to text nodes), or other valid noact objects (recursively processed)
 * @returns {Element} element
 */
export const noact = obj => {
  if (!obj) return ''; 
  let el, tag;

  try {
    if ('tag' in obj && (validTags.includes(obj.tag) || svgNs.includes(obj.tag))) tag = obj.tag;
    else {
      if ('href' in obj) tag = 'a';
      else if ('src' in obj) tag = 'img';
      else if ('viewBox' in obj) tag = 'svg';
      else if ('d' in obj) tag = 'path';
      else if ('onclick' in obj) tag = 'button';
      else if ('dateTime' in obj) tag = 'time';
      else if ('children' in obj && obj.children.constructor.name === 'Array' && !obj?.children.filter(child => typeof child === 'object').length) tag = 'p';
      else tag = 'div';
    }
  
    if (svgNs.includes(tag)) {
      el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      if (tag === 'svg' && !('style' in obj)) {
        !('fill' in obj) && el.setAttribute('fill', 'none');
        !('stroke' in obj) && el.setAttribute('stroke', 'currentColor');
        !('stroke-width' in obj) && el.setAttribute('stroke-width', 1.5);
        !('aria-hidden' in obj) && el.setAttribute('aria-hidden', true);
      } else if (tag === 'path' && !('style' in obj)) {
        !('stroke-linejoin' in obj) && el.setAttribute('stroke-linejoin', 'round');
        !('stroke-linecap' in obj) && el.setAttribute('stroke-linecap', 'round');
      }
      Object.keys(obj).filter(key => !['tag', 'dataset', 'children'].includes(key))
        .forEach(key => el.setAttribute(key === 'className' ? 'class' : key, obj[key]));
    } else {
      el = document.createElement(tag);
      Object.keys(obj).filter(key => !['tag', 'dataset', 'children'].includes(key))
        .forEach(key => {
          const prop = obj[key];
          if (typeof prop === 'function' && isArrow(prop)) {
            console.error(`noact: illegal arrow function on property ${key}`, el, prop);
            return;
          } else el[key] = prop;
        });
    }

    if ('dataset' in obj) Object.keys(obj.dataset).forEach(key => el.dataset[key] = obj.dataset[key]);
    if ('children' in obj && obj.children !== null) {
      [obj.children].flat(Infinity).forEach(child => { // make all children arrays. additionally, some implementations of the function use nesting arrays as children, so they need to be flattened anyways
        if (!child) return;
        if (typeof child === 'object' && 'nodeType' in child) el.append(child);
        else if (typeof child === 'object') el.append(noact(child));
        else el.append(document.createTextNode(child));
      });
    }
  } catch (e) {console.error('noact:', e, obj)}

  return el;
};