import { getOptions } from './utils/jsTools.js';
import { noact } from './utils/noact.js';
import { activeProject } from './utils/user.js';

let icon1, icon2, icon3, icon4, icon5, icon6;

const customClass = 'ch-utils-appNav';
const { handle } = activeProject;

const map = {
  home: {
    path: 'M 11.990234,2.625 2.25,12.107422 l 3.5,0.0039 V 21.25 H 9.6992188 V 14.699219 H 14.300781 V 21.25 H 18.25 v -9.128906 l 3.5,0.0039 z',
    title: 'home',
    url: 'https://cohost.org/',
    func: null
  },
  notifications: {
    path: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
    title: 'notifications',
    url: 'https://cohost.org/rc/project/notifications?a',
    func: null
  },
  tagged: {
    path: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z',
    title: 'bookmarked tags',
    url: 'https://cohost.org/#',
    func: null
  },
  'liked-posts': {
    path: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
    title: 'posts you\'ve liked',
    url: 'https://cohost.org/rc/liked-posts',
    func: null
  },
  'artist-alley': {
    path: 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
    title: 'artist alley',
    url: 'https://cohost.org/rc/artist-alley',
    func: null
  },
  search: {
    path: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
    title: 'search',
    url: 'https://cohost.org/rc/search',
    func: null
  },
  profile: {
    path: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z',
    title: 'profile',
    url: `https://cohost.org/${handle}`,
    func: null
  },
  inbox: {
    path: 'M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z',
    title: 'inbox',
    url: 'https://cohost.org/rc/project/inbox',
    func: null
  },
  unpublished: {
    path: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
    title: 'drafts',
    url: 'https://cohost.org/rc/posts/unpublished',
    func: null
  },
  following: {
    path: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    title: 'following',
    url: 'https://cohost.org/rc/project/following',
    func: null
  },
  followers: {
    path: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
    title: 'followers',
    url: 'https://cohost.org/rc/project/followers',
    func: null
  },
  settings: {
    path: 'M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495',
    title: 'settings',
    url: 'https://cohost.org/rc/user/settings',
    func: null
  },
  compose: {
    path: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125',
    title: 'new post',
    url: `https://cohost.org/${handle}/post/compose?a`,
    func: function(event) {
      event.preventDefault();
      document.querySelector(`[href='https://cohost.org/${handle}/post/compose']`).click();
    }
  }
};

const newIcon = icon => {
  if (icon === 'none') return '';
  else {
    icon = map[icon];
    return {
      tag: 'a',
      className: 'p-2 hover:text-accent',
      href: icon.url,
      title: icon.title,
      onclick: icon.func,
      children: [{
        className: 'inline-block h-6 w-6',
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.5',
        'aria-hidden': true,
        children: [{
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          d: icon.path
        }]
      }]
    }
  }
};

export const main = async () => {
  if (visualViewport.width < 1024) {
    ({ icon1, icon2, icon3, icon4, icon5, icon6 } = await getOptions('appNav'));

    const menu = noact({
      className: `${customClass} bg-foreground fixed z-30 bottom-0 left-0 h-12 w-full px-2 flex justify-between items-center`,
      children: [icon1, icon2, icon3, icon4, icon5, icon6].map(newIcon)
    });
    document.querySelector('#app > .flex-col').append(menu);
  }
};
export const clean = async () => $(`.${customClass}`).remove();