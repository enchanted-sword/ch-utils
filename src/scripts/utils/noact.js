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
]

export const noact = obj => {
  if (!obj) return ''; 
  let el, tag;

  try {
    if ('tag' in obj && (validTags.includes(obj.tag) || svgNs.includes(obj.tag))) tag = obj.tag;
    else {
      if ('href' in obj) tag = 'a';
      else if ('src' in obj) tag = 'img';
      else if ('viewBox' in obj) tag = 'svg';
      else if ('d' in obj) tag = 'path'
      else if ('onclick' in obj) tag = 'button'
      else if ('children' in obj && obj.children.constructor.name === 'Array' && !obj?.children.filter(child => typeof child === 'object').length) tag = 'p';
      else tag = 'div';
    }
  
    if (svgNs.includes(tag)) {
      el = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.keys(obj).filter(key => !['tag','children'].includes(key))
        .forEach(key => el.setAttribute(key === 'className' ? 'class' : key, obj[key]));
    } else {
      el = document.createElement(tag);
      Object.keys(obj).filter(key => !['tag', 'dataset', 'children'].includes(key))
        .forEach(key => el[key] = obj[key]);
    }

    if ('dataset' in obj) Object.keys(obj.dataset).forEach(key => el.dataset[key] = obj.dataset[key]);
    if ('children' in obj && obj.children.constructor.name === 'Array') {
      obj.children.forEach(child => {
        if (child.constructor.name.includes('Element')) el.append(child);
        else if (typeof child === 'object') el.append(noact(child));
        else el.append(document.createTextNode(child));
      });
    }
  } catch (e) {console.error('noact:', e)}

  return el;
};