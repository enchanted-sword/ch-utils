const parser = new DOMParser();

export const darkWorld = async project => fetch(`https://cohost.org/${project}`)
  .then(response => 
    response.text().then(docText => {
      const doc = parser.parseFromString(docText, 'text/html');
      console.log(doc)
      if (doc.head.childElementCount) return doc;
      else throw `failed to retrieve page https://cohost.org/${project}`;
  })).catch(e => {
    console.error(`darkWorld error: your machinations are too evil,`, e);
    return Promise.reject();
  });

export const getProject = async project => {
  const doc = await darkWorld(project);
  const ppv = JSON.parse(doc.getElementById('__COHOST_LOADER_STATE__').innerText)['project-page-view'];

  return ppv || undefined;
};