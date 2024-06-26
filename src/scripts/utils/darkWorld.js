const parser = new DOMParser();
const worlds = new Map();

export const darkWorld = async project => {
  if (!worlds.has(project)) {
    const world = await fetch(`https://cohost.org/${project}`)
      .then(response => 
        response.text().then(docText => {
          const doc = parser.parseFromString(docText, 'text/html');
          if (doc.head.childElementCount) return doc;
          else throw `failed to retrieve page https://cohost.org/${project}`;
      })).catch(e => {
        console.error(`darkWorld error: your machinations are too evil,`, e);
        return Promise.reject();
      });
  
    worlds.set(project, world);
  }

  return worlds.get(project);
};

export const getProjectSlow = async handle => {
  try {
    const doc = await darkWorld(handle);
    const { project } = JSON.parse(doc.getElementById('__COHOST_LOADER_STATE__').innerText)['project-page-view'];
    return project;
  } catch {
    console.warn(`unable to parse handle "${handle}"`);
    return undefined;
  }
};