const validTags = ['a','abbr','abbr','address','embed','object','area','article',
  'aside','audio','b','base','bdi','bdo','blockquote','body','br','button','canvas','caption','cite',
  'code','col','colgroup','data','datalist','dd','del','details','dfn','dialog','ul','div','dl','dt','em','embed','fieldset',
  'figcaption','figure','footer','form','h1','h2','h3','h4','h5','h6','head','header','hr','html','i','iframe','img',
  'input','ins','kbd','label','legend','li','link','main','map','mark','meta','meter','nav','noscript','object','ol',
  'optgroup','option','output','p','param','picture','pre','progress','q','rp','rt','ruby','s','samp','script','section','select',
  'small','source','span','del','s','strong','style','sub','summary','sup','svg','table','tbody','td','template','textarea',
  'tfoot','th','thead','time','title','tr','track','u','ul','var','video','wbr'
];

const htmlFromString = str => {
  const tempWrapper = document.createElement('div');
  tempWrapper.innerHTML = str;
  return tempWrapper.children[0];
};

export const noact = obj => {
  let el, tag;

  try {
    if ('tag' in obj && validTags.includes(obj.tag))tag = obj.tag;
    else {
      if ('href' in obj) tag = 'a';
      else if ('src' in obj) tag = 'img';
      else if ('onclick' in obj) tag = 'button'
      else if ('children' in obj && obj.children.constructor.name === 'Array' && !obj?.children.filter(child => typeof child === 'object').length) tag = 'p';
      else tag = 'div';
    }
  
    el = document.createElement(tag);
    if ('children' in obj) {
      obj.children.forEach(child => {
        if (typeof child === 'object') {
          if (child?.html) {
            el.append(htmlFromString(child.html));
          } else el.append(noact(child));
        }
        else el.append(document.createTextNode(child));
      });
    }
    
    Object.keys(obj).filter(key => !['tag','children'].includes(key))
      .forEach(key => el[key] = obj[key]);
  } catch (e) {console.error('noact:', e)}

  return el;
};