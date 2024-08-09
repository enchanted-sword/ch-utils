import { getOptions } from './utils/jsTools.js';
import { postFunction } from './utils/mutation.js';

const customAttribute = 'ch-utils-yinglation';
let reverseMode
let phoneme = 'zh';
let regex = /(\w*(?:zh)\w*)/gi;
let map = {
  'zhe': 'the',
  'zhat': 'that',
  'zhis': 'this',
  'wizh': 'with',
  'ozher': 'other',
  'zhey': 'they',
  'zheir': 'their',
  'zhere': 'there',
  'zhese': 'these',
  'zhan': 'than',
  'healzh': 'health',
  'zhem': 'them',
  'zhen': 'then',
  'zhrough': 'through',
  'zhose': 'those',
  'wizhin': 'within',
  'souzh': 'south',
  'bozh': 'both',
  'zhree': 'three',
  'wizhout': 'without',
  'zhink': 'think',
  'norzh': 'north',
  'anozher': 'another',
  'auzhor': 'author',
  'zhread': 'thread',
  'zhings': 'things',
  'somezhing': 'something',
  'monzh': 'month',
  'ozhers': 'others',
  'monzhs': 'months',
  'furzher': 'further',
  'whezher': 'whether',
  'weazher': 'weather',
  'eizher': 'either',
  'zhing': 'thing',
  'zhird': 'third',
  'togezher': 'together',
  'zhough': 'though',
  'zhanks': 'thanks',
  'everyzhing': 'everything',
  'mezhods': 'methods',
  'mezhod': 'method',
  'deazh': 'death',
  'zhought': 'thought',
  'growzh': 'growth',
  'alzhough': 'although',
  'anyzhing': 'anything',
  'razher': 'rather',
  'nozhing': 'nothing',
  'clozhing': 'clothing',
  'lengzh': 'length',
  'zhursday': 'thursday',
  'zhomas': 'thomas',
  'smizh': 'smith',
  'zhank': 'thank',
  'zherefore': 'therefore',
  'zhu': 'thu',
  'earzh': 'earth',
  'zhus': 'thus',
  'mozher': 'mother',
  'auzhority': 'authority',
  'norzhern': 'northern',
  'ozherwise': 'otherwise',
  'auzhors': 'authors',
  'souzhern': 'southern',
  'youzh': 'youth',
  'zhroughout': 'throughout',
  'zheory': 'theory',
  'fazher': 'father',
  'worzh': 'worth',
  'zhemselves': 'themselves',
  'zh': 'th',
  'monzhly': 'monthly',
  'pazh': 'path',
  'leazher': 'leather',
  'zhinking': 'thinking',
  'zhousands': 'thousands',
  'zherapy': 'therapy',
  'zhoughts': 'thoughts',
  'zheme': 'theme',
  'birzh': 'birth',
  'faizh': 'faith',
  'truzh': 'truth',
  'brozher': 'brother',
  'zheatre': 'theatre',
  'depzh': 'depth',
  'nezherlands': 'netherlands',
  'bazh': 'bath',
  'zheater': 'theater',
  'healzhy': 'healthy',
  'birzhday': 'birthday',
  'mazh': 'math',
  'healzhcare': 'healthcare',
  'strengzh': 'strength',
  'clozhes': 'clothes',
  'fourzh': 'fourth',
  'widzh': 'width',
  'elizabezh': 'elizabeth',
  'mazhematics': 'mathematics',
  'zhailand': 'thailand',
  'bluetoozh': 'bluetooth',
  'auzhorities': 'authorities',
  'auzhorized': 'authorized',
  'mouzh': 'mouth',
  'neizher': 'neither',
  'zhreads': 'threads',
  'brozhers': 'brothers',
  'cazholic': 'catholic',
  'norzhwest': 'northwest',
  'forzh': 'forth',
  'zhemes': 'themes',
  'smoozh': 'smooth',
  'zhreat': 'threat',
  'bazhroom': 'bathroom',
  'zhousand': 'thousand',
  'pyzhon': 'python',
  'ezhics': 'ethics',
  'matzhew': 'matthew',
  'anzhony': 'anthony',
  'zhongs': 'thongs',
  'algorizhm': 'algorithm',
  'ezhnic': 'ethnic',
  'fifzh': 'fifth',
  'zhin': 'thin',
  'ezhernet': 'ethernet',
  'zhrow': 'throw',
  'zhompson': 'thompson',
  'arzhur': 'arthur',
  'souzhwest': 'southwest',
  'keizh': 'keith',
  'zhroat': 'throat',
  'wealzh': 'wealth',
  'zhumbnail': 'thumbnail',
  'jonazhan': 'jonathan',
  'azhletic': 'athletic',
  'zhermal': 'thermal',
  'zhick': 'thick',
  'zhai': 'thai',
  'auzhentication': 'authentication',
  'bandwidzh': 'bandwidth',
  'zheft': 'theft',
  'azhletics': 'athletics',
  'souzheast': 'southeast',
  'zhirty': 'thirty',
  'zhou': 'thou',
  'furzhermore': 'furthermore',
  'deazhs': 'deaths',
  'commonwealzh': 'commonwealth',
  'zhumbs': 'thumbs',
  'mezhodology': 'methodology',
  'gazhering': 'gathering',
  'mazhematical': 'mathematical',
  'azhens': 'athens',
  'norzheast': 'northeast',
  'zhreshold': 'threshold',
  'ezhical': 'ethical',
  'zhesis': 'thesis',
  'zhru': 'thru',
  'zheoretical': 'theoretical',
  'zhereof': 'thereof',
  'auzhentic': 'authentic',
  'breazh': 'breath',
  'auzhorization': 'authorization',
  'algorizhms': 'algorithms',
  'zhinks': 'thinks',
  'zhats': 'thats',
  'zhy': 'thy',
  'sixzh': 'sixth',
  'zhreats': 'threats',
  'teezh': 'teeth',
  'clozh': 'cloth',
  'kennezh': 'kenneth',
  'cazherine': 'catherine',
  'zheaters': 'theaters',
  'zhreaded': 'threaded',
  'mozhers': 'mothers',
  'synzhesis': 'synthesis',
  'zhomson': 'thomson',
  'heazher': 'heather',
  'zhumbnails': 'thumbnails',
  'zherapeutic': 'therapeutic',
  'zheories': 'theories',
  'pazhs': 'paths',
  'lizhuania': 'lithuania',
  'gazhered': 'gathered',
  'arzhritis': 'arthritis',
  'neverzheless': 'nevertheless',
  'zheorem': 'theorem',
  'zhee': 'thee',
  'ruzh': 'ruth',
  'plymouzh': 'plymouth',
  'marzha': 'martha',
  'zhereby': 'thereby',
  'pazhology': 'pathology',
  'zhreesome': 'threesome',
  'wizhdrawal': 'withdrawal',
  'timozhy': 'timothy',
  'zhumbzilla': 'thumbzilla',
  'zhehun': 'thehun',
  'perzh': 'perth',
  'aszhma': 'asthma',
  'zhong': 'thong',
  'boozh': 'booth',
  'gazher': 'gather',
  'bazhrooms': 'bathrooms',
  'zhrows': 'throws',
  'beneazh': 'beneath',
  'strengzhen': 'strengthen',
  'sevenzh': 'seventh',
  'zhumb': 'thumb',
  'ezhiopia': 'ethiopia',
  'azhletes': 'athletes',
  'synzhetic': 'synthetic',
  'strengzhs': 'strengths',
  'zhreatened': 'threatened',
  'zhesaurus': 'thesaurus',
  'rhyzhm': 'rhythm',
  'worzhy': 'worthy',
  'breazhing': 'breathing',
  'zhickness': 'thickness',
  'zhanksgiving': 'thanksgiving',
  'gozhic': 'gothic',
  'kazhy': 'kathy',
  'bezh': 'beth',
  'zhoroughly': 'thoroughly',
  'zhunder': 'thunder',
  'nazhan': 'nathan',
  'earzhquake': 'earthquake',
  'zheology': 'theology',
  'luzher': 'luther',
  'hypozhesis': 'hypothesis',
  'marazhon': 'marathon',
  'zhrown': 'thrown',
  'heazh': 'heath',
  'myzh': 'myth',
  'unauzhorized': 'unauthorized',
  'mozherboard': 'motherboard',
  'fazhers': 'fathers',
  'zhinkpad': 'thinkpad',
  'bazhs': 'baths',
  'cazhedral': 'cathedral',
  'anzhropology': 'anthropology',
  'toozh': 'tooth',
  'hypozhetical': 'hypothetical',
  'smizhsonian': 'smithsonian',
  'zhriller': 'thriller',
  'zherapist': 'therapist',
  'zhereafter': 'thereafter',
  'souzhampton': 'southampton',
  'portsmouzh': 'portsmouth',
  'zhrowing': 'throwing',
  'zhorough': 'thorough',
  'sympazhy': 'sympathy',
  'zhreatening': 'threatening',
  'bozher': 'bother',
  'strengzhening': 'strengthening',
  'zheta': 'theta',
  'zhunderstorm': 'thunderstorm',
  'zhunderstorms': 'thunderstorms',
  'pazhway' : 'pathway',
  'pazhways' : 'pathways',
};
let zMap = {
    'ze': 'the',
    'zat': 'that',
    'zis': 'this',
    'wiz': 'with',
    'ozer': 'other',
    'zey': 'they',
    'zeir': 'their',
    'zere': 'there',
    'zese': 'these',
    'zan': 'than',
    'healz': 'health',
    'zem': 'them',
    'zrough': 'through',
    'zose': 'those',
    'wizin': 'within',
    'boz': 'both',
    'zree': 'three',
    'wizout': 'without',
    'zink': 'think',
    'norz': 'north',
    'anozer': 'another',
    'auzor': 'author',
    'zread': 'thread',
    'zings': 'things',
    'somezing': 'something',
    'ozers': 'others',
    'monzs': 'months',
    'furzer': 'further',
    'whezer': 'whether',
    'weazer': 'weather',
    'eizer': 'either',
    'zing': 'thing',
    'zird': 'third',
    'togezer': 'together',
    'zough': 'though',
    'zanks': 'thanks',
    'everyzing': 'everything',
    'mezods': 'methods',
    'mezod': 'method',
    'deaz': 'death',
    'zought': 'thought',
    'growz': 'growth',
    'alzough': 'although',
    'anyzing': 'anything',
    'razer': 'rather',
    'nozing': 'nothing',
    'clozing': 'clothing',
    'lengz': 'length',
    'zursday': 'thursday',
    'zomas': 'thomas',
    'smiz': 'smith',
    'zank': 'thank',
    'zerefore': 'therefore',
    'zu': 'thu',
    'earz': 'earth',
    'zus': 'thus',
    'mozer': 'mother',
    'auzority': 'authority',
    'norzern': 'northern',
    'ozerwise': 'otherwise',
    'auzors': 'authors',
    'souzern': 'southern',
    'youz': 'youth',
    'zroughout': 'throughout',
    'zeory': 'theory',
    'fazer': 'father',
    'worz': 'worth',
    'zemselves': 'themselves',
    'z': 'th',
    'monzly': 'monthly',
    'paz': 'path',
    'leazer': 'leather',
    'zinking': 'thinking',
    'zousands': 'thousands',
    'zerapy': 'therapy',
    'zoughts': 'thoughts',
    'zeme': 'theme',
    'birz': 'birth',
    'faiz': 'faith',
    'truz': 'truth',
    'brozer': 'brother',
    'zeatre': 'theatre',
    'depz': 'depth',
    'nezerlands': 'netherlands',
    'baz': 'bath',
    'zeater': 'theater',
    'healzy': 'healthy',
    'birzday': 'birthday',
    'maz': 'math',
    'healzcare': 'healthcare',
    'strengz': 'strength',
    'clozes': 'clothes',
    'fourz': 'fourth',
    'widz': 'width',
    'elizabez': 'elizabeth',
    'mazematics': 'mathematics',
    'zailand': 'thailand',
    'bluetooz': 'bluetooth',
    'auzorities': 'authorities',
    'auzorized': 'authorized',
    'mouz': 'mouth',
    'neizer': 'neither',
    'zreads': 'threads',
    'brozers': 'brothers',
    'cazolic': 'catholic',
    'norzwest': 'northwest',
    'forz': 'forth',
    'zemes': 'themes',
    'smooz': 'smooth',
    'zreat': 'threat',
    'bazroom': 'bathroom',
    'zousand': 'thousand',
    'pyzon': 'python',
    'ezics': 'ethics',
    'matzew': 'matthew',
    'anzony': 'anthony',
    'zongs': 'thongs',
    'algorizm': 'algorithm',
    'eznic': 'ethnic',
    'fifz': 'fifth',
    'zin': 'thin',
    'ezernet': 'ethernet',
    'zrow': 'throw',
    'zompson': 'thompson',
    'arzur': 'arthur',
    'souzwest': 'southwest',
    'keiz': 'keith',
    'zroat': 'throat',
    'wealz': 'wealth',
    'zumbnail': 'thumbnail',
    'jonazan': 'jonathan',
    'azletic': 'athletic',
    'zermal': 'thermal',
    'zick': 'thick',
    'auzentication': 'authentication',
    'bandwidz': 'bandwidth',
    'zeft': 'theft',
    'azletics': 'athletics',
    'souzeast': 'southeast',
    'zirty': 'thirty',
    'zou': 'thou',
    'furzermore': 'furthermore',
    'deazs': 'deaths',
    'commonwealz': 'commonwealth',
    'zumbs': 'thumbs',
    'mezodology': 'methodology',
    'gazering': 'gathering',
    'mazematical': 'mathematical',
    'azens': 'athens',
    'norzeast': 'northeast',
    'zreshold': 'threshold',
    'ezical': 'ethical',
    'zesis': 'thesis',
    'zru': 'thru',
    'zeoretical': 'theoretical',
    'zereof': 'thereof',
    'auzentic': 'authentic',
    'breaz': 'breath',
    'auzorization': 'authorization',
    'algorizms': 'algorithms',
    'zinks': 'thinks',
    'zats': 'thats',
    'zy': 'thy',
    'sixz': 'sixth',
    'zreats': 'threats',
    'teez': 'teeth',
    'cloz': 'cloth',
    'kennez': 'kenneth',
    'cazerine': 'catherine',
    'zeaters': 'theaters',
    'zreaded': 'threaded',
    'mozers': 'mothers',
    'synzesis': 'synthesis',
    'heazer': 'heather',
    'zumbnails': 'thumbnails',
    'zerapeutic': 'therapeutic',
    'zeories': 'theories',
    'pazs': 'paths',
    'lizuania': 'lithuania',
    'gazered': 'gathered',
    'arzritis': 'arthritis',
    'neverzeless': 'nevertheless',
    'zeorem': 'theorem',
    'zee': 'thee',
    'ruz': 'ruth',
    'plymouz': 'plymouth',
    'marza': 'martha',
    'zereby': 'thereby',
    'pazology': 'pathology',
    'zreesome': 'threesome',
    'wizdrawal': 'withdrawal',
    'timozy': 'timothy',
    'zumbzilla': 'thumbzilla',
    'zehun': 'thehun',
    'perz': 'perth',
    'aszma': 'asthma',
    'zong': 'thong',
    'booz': 'booth',
    'gazer': 'gather',
    'bazrooms': 'bathrooms',
    'zrows': 'throws',
    'beneaz': 'beneath',
    'strengzen': 'strengthen',
    'sevenz': 'seventh',
    'zumb': 'thumb',
    'eziopia': 'ethiopia',
    'azletes': 'athletes',
    'synzetic': 'synthetic',
    'strengzs': 'strengths',
    'zreatened': 'threatened',
    'zesaurus': 'thesaurus',
    'rhyzm': 'rhythm',
    'worzy': 'worthy',
    'breazing': 'breathing',
    'zickness': 'thickness',
    'zanksgiving': 'thanksgiving',
    'gozic': 'gothic',
    'kazy': 'kathy',
    'bez': 'beth',
    'zoroughly': 'thoroughly',
    'zunder': 'thunder',
    'nazan': 'nathan',
    'earzquake': 'earthquake',
    'zeology': 'theology',
    'luzer': 'luther',
    'hypozesis': 'hypothesis',
    'marazon': 'marathon',
    'zrown': 'thrown',
    'heaz': 'heath',
    'myz': 'myth',
    'unauzorized': 'unauthorized',
    'mozerboard': 'motherboard',
    'fazers': 'fathers',
    'zinkpad': 'thinkpad',
    'bazs': 'baths',
    'cazedral': 'cathedral',
    'anzropology': 'anthropology',
    'tooz': 'tooth',
    'hypozetical': 'hypothetical',
    'smizsonian': 'smithsonian',
    'zriller': 'thriller',
    'zerapist': 'therapist',
    'zereafter': 'thereafter',
    'souzampton': 'southampton',
    'portsmouz': 'portsmouth',
    'zrowing': 'throwing',
    'zorough': 'thorough',
    'sympazy': 'sympathy',
    'zreatening': 'threatening',
    'bozer': 'bother',
    'strengzening': 'strengthening',
    'zunderstorm': 'thunderstorm',
    'zunderstorms': 'thunderstorms',
    'pazway': 'pathway',
    'pazways': 'pathways',
}

const textNodeDescendants = node => [
    ...node.childNodes, ...Array.from(node.childNodes).filter(child => child.nodeName !== 'CODE')
    .flatMap(child => textNodeDescendants(child))
  ].filter(child => child.nodeName === '#text');
const caseMatch = (str0, str1) => {
  const cases = [...str0].map(char => char === char.toUpperCase());
  return [...str1].map((char, i) => cases[i] ? char.toUpperCase() : char.toLowerCase()).join('');
};
const replacer = word => {
  if (word.toLowerCase() in map) return caseMatch(word, map[word.toLowerCase()]);
  else if (word.toLowerCase() in zMap) return caseMatch(wordm zMap[word.toLowerCase()]);
  else return word;
};

const translatePosts = posts => {
  for (const post of posts) {
    post.setAttribute(customAttribute, '');
    if (!post.textContent.toLowerCase().includes(phoneme)) continue;
    const translatableNodes = textNodeDescendants(post).filter(({ textContent }) => textContent.toLowerCase().includes(phoneme));
    translatableNodes.forEach(function(node) { node.textContent = node.textContent.replace(regex, replacer); });
  }
};

export const main = async () => {
  ({ reverseMode } = await getOptions('yinglation'));

  if (reverseMode) {
    Object.entries(map).forEach(([key, value]) => map[value] = key);
    phoneme = 'th'
    regex = /(\w*(?:th)\w*)/gi;
  }
  postFunction.start(translatePosts, `:not([${customAttribute}])`);
}
export const clean = async () => {
  $(`[${customAttribute}]`).removeAttr(customAttribute);
  postFunction.stop(translatePosts);
}
