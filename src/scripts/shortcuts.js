const keyHandler = ({ ctrlKey, key, repeat }) => {
  if (!(document.querySelector(':focus') === null)) return;

  if (['j', 'k'].includes(key)) { // post scrolling
    const posts = Array.from(document.querySelectorAll('.renderIfVisible:has([data-postid])'));
    if (posts.length === 0) return;
    let scrollTarget;
    if (key === 'k') scrollTarget = posts.find(post => Math.floor(post.getBoundingClientRect().y) > 80);
    else scrollTarget = posts.reverse().find(post => Math.ceil(post.getBoundingClientRect().y) < 80);
    if (typeof scrollTarget === 'undefined') {
      if (key === 'j') window.scroll(0, 0);
      else return;
    }
    else scrollTarget.scrollIntoView();
  } else if (['ArrowLeft', 'ArrowRight'].includes(key) && ctrlKey) { // pagination
    const scrollButtons = document.querySelectorAll('.renderIfVisible ~ .mb-12 a:has(svg), .renderIfVisible ~ div .mb-12 a:has(svg)');
    if (scrollButtons.length === 0) return;
    console.log(scrollButtons);
    if (key === 'ArrowRight') {
      if (/\?page=[\d]+#*/.test(scrollButtons[0].href)) {
        if ((scrollButtons.length === 1 && window.location.search === '?page=0')
          || scrollButtons.length === 2) window.location = window.location.href.replace(/\?page=(\d)+#*/, (_,a) => `?page=${+a + 1}`);
      } else {
        if (scrollButtons.length === 1 && /skipPosts=0|skipPosts=20|'page=1#'/.test(scrollButtons[0].href)) window.location = scrollButtons[0].href;
        else if (scrollButtons.length === 2) window.location = scrollButtons[1];
      }
    } else {
      if (/\?page=[\d]+#*/.test(scrollButtons[0].href)) {
        if ((scrollButtons.length === 1 && window.location.search !== '?page=0')
          || scrollButtons.length === 2) window.location = window.location.href.replace(/\?page=(\d)+#*/, (_,a) => `?page=${+a - 1}`);
      } else {
        if (scrollButtons.length === 1 && !/skipPosts=0|skipPosts=20|'page=1#'/.test(scrollButtons[0].href)) window.location =  scrollButtons[0];
        else if (scrollButtons.length === 2) window.location = scrollButtons[0];
      }
    }
  } else if (['l'].includes(key) && !repeat) { // like, rechost
    const posts = Array.from(document.querySelectorAll('.renderIfVisible:has([data-postid])'));
    if (posts.length === 0) return;
    const targetPost = posts.find(post => {
      const { y, height } = post.getBoundingClientRect();
      return y + height - 96 > 0 ? true : false;
    });
    if (typeof targetPost === 'undefined') return;
    if (key === 'l') targetPost.querySelector('footer button[title*="like"]').click();
  }
}

export const main = async () => document.addEventListener('keydown', keyHandler);
export const clean = async () => document.removeEventListener('keydown', keyHandler);