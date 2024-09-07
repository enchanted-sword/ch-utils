import { getOptions } from './utils/jsTools.js';
import { style } from './utils/style.js';
import { noact } from './utils/noact.js';
import { activeProject, hasActiveSubscription } from './utils/user.js';
import { batchTrpc } from './utils/apiFetch.js';

const navSelector = 'header > .container > nav';
const menuSelector = 'ul[role="menu"]:not([class~="lg\:hidden"])';
const buttonSelector = '#live-dashboard .flex-col > button.w-full';
const linkSelector = 'ul[role="menu"] [href="#"]';
const observerTargetSelector = '#live-dashboard > .flex-col';
const textSelector = '#live-dashboard .flex-col > button.w-full svg text'
const customClass = 'ch-utils-horizontal';

const projectHandle = activeProject.handle;
const [bookmarkedTags, notifications, followRequests, unreadAsks] = await batchTrpc(['bookmarks.tags.list', 'notifications.count', 'relationships.countFollowRequests', 'asks.unreadCount'], { 1: { projectHandle }, 2: { projectHandle }, 3: { projectHandle } });

const pathMap = {
  home: 'M 11.990234,2.625 2.25,12.107422 l 3.5,0.0039 V 21.25 H 9.6992188 V 14.699219 H 14.300781 V 21.25 H 18.25 v -9.128906 l 3.5,0.0039 z',
  notifications: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
  tagged: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z',
  'liked-posts': 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z',
  'artist-alley': 'M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42',
  search: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z',
  profile: 'M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z',
  inbox: 'M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z',
  unpublished: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  following: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  followers: 'M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z',
  settings: 'M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864l-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495',
  help: 'M16.712 4.33a9.027 9.027 0 011.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 00-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 010 9.424m-4.138-5.976a3.736 3.736 0 00-.88-1.388 3.737 3.737 0 00-1.388-.88m2.268 2.268a3.765 3.765 0 010 2.528m-2.268-4.796a3.765 3.765 0 00-2.528 0m4.796 4.796c-.181.506-.475.982-.88 1.388a3.736 3.736 0 01-1.388.88m2.268-2.268l4.138 3.448m0 0a9.027 9.027 0 01-1.306 1.652c-.51.51-1.064.944-1.652 1.306m0 0l-3.448-4.138m3.448 4.138a9.014 9.014 0 01-9.424 0m5.976-4.138a3.765 3.765 0 01-2.528 0m0 0a3.736 3.736 0 01-1.388-.88 3.737 3.737 0 01-.88-1.388m2.268 2.268L7.288 19.67m0 0a9.024 9.024 0 01-1.652-1.306 9.027 9.027 0 01-1.306-1.652m0 0l4.138-3.448M4.33 16.712a9.014 9.014 0 010-9.424m4.138 5.976a3.765 3.765 0 010-2.528m0 0c.181-.506.475-.982.88-1.388a3.736 3.736 0 011.388-.88m-2.268 2.268L4.33 7.288m6.406 1.18L7.288 4.33m0 0a9.024 9.024 0 00-1.652 1.306A9.025 9.025 0 004.33 7.288',
  plus: 'M11.3119 5.42651 6.14576 1.57637l1.85085 7.14697L1 10.8444l6.40678 1.9135L1.38644 25l9.15256-7.3545 3.2542 6.8473.1424-8.9222 8.7864 5.5331-6.9762-8.438L25 7.317 13.4678 8.40058 15.1356 1l-3.8237 4.42651Z'
};

const unreadOnNavbarStyleElement = style('@media (min-width: 1024px) { #live-dashboard > .flex > button.w-full { display: none; } }');
const homeIcon = noact({
  className: customClass,
  href: '/',
  onclick: function(event) {
    if ($(buttonSelector).length) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.scrollTo({ top: 0, behaviour: 'auto' });
      $(buttonSelector).trigger('click');
    }
  
    this.querySelector('text').textContent = '';
  },
  children: [{
    tag: 'li',
    className: 'flex flex-row items-center gap-2 rounded-lg border border-transparent px-1 py-3 hover:text-accent lg:hover:text-sidebarAccent',
    title: 'home',
    children: [
      {
        className: 'relative',
        children: [{
          className: 'inline-block h-6',
          viewBox: '0 0 24 24',
          fill: 'currentColor',
          'stroke-width': 1.5,
          'stroke-linejoin': 'round',
          stroke: 'currentColor',
          'aria-hidden': true,
          children: [{ d: pathMap.home }]
        }]
      },
      'home',
      {
        className: `${customClass} ml-auto h-6 fill-sidebarAccent text-sidebarBg`,
        viewBox: '0 0 25 18',
        style: 'fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 2;',
        'aria-hidden': true,
        children: [
          {
            d: 'M14.923 17.087c-2.254.666-4.388.967-6.402.905-2.014-.062-3.742-.532-5.183-1.409-1.442-.877-2.436-2.217-2.982-4.022-.549-1.814-.463-3.476.257-4.985.719-1.51 1.905-2.832 3.557-3.965C5.823 2.478 7.776 1.578 10.03.913c2.243-.663 4.369-.965 6.376-.906 2.007.059 3.733.523 5.178 1.394 1.446.87 2.441 2.207 2.987 4.011.546 1.804.457 3.464-.266 4.981-.724 1.516-1.908 2.845-3.551 3.987-1.644 1.143-3.588 2.045-5.831 2.707Zs',
            style: 'fill-rule: nonzero;'
          },
          {
            tag: 'text',
            className: 'cursor-pointer select-none fill-current font-atkinson text-[10px] font-bold leading-none',
            x: '50%',
            y: '50%',
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
          }
        ]
      }
    ]
  }]
});
const customIcon = (name, href, title, count = 0, onclick = false) => noact({
  tag: 'a',
  href,
  onclick,
  children: [{
    tag: 'li',
    className: `${customClass} flex flex-row items-center gap-2 rounded-lg border border-transparent px-1 py-3 hover:border-accent hover:text-accent lg:hover:border-sidebarAccent lg:hover:text-sidebarAccent`,
    title,
    children: [
      {
        className: 'relative',
        children: [{
          className: 'inline-block h-6',
          fill: 'none',
          viewBox: '0 0 24 24',
          stroke: 'currentColor',
          'stroke-width': 1.5,
          'aria-hidden': true,
          children: [{
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            d: pathMap[name]
          }]
        }]
      },
      title,
      count ? {
        className: 'ml-auto h-6 fill-sidebarAccent text-sidebarBg',
        viewBox: '0 0 25 18',
        style: 'fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 2',
        'aria-hidden': true,
        children: [
          {
            style: 'fill-rule:nonzero',
            d: 'M14.923 17.087c-2.254.666-4.388.967-6.402.905-2.014-.062-3.742-.532-5.183-1.409-1.442-.877-2.436-2.217-2.982-4.022-.549-1.814-.463-3.476.257-4.985.719-1.51 1.905-2.832 3.557-3.965C5.823 2.478 7.776 1.578 10.03.913c2.243-.663 4.369-.965 6.376-.906 2.007.059 3.733.523 5.178 1.394 1.446.87 2.441 2.207 2.987 4.011.546 1.804.457 3.464-.266 4.981-.724 1.516-1.908 2.845-3.551 3.987-1.644 1.143-3.588 2.045-5.831 2.707Zs'
          },
          {
            tag: 'text',
            className: 'cursor-pointer select-none fill-current font-atkinson text-[10px] font-bold leading-none',
            x: '50%',
            y: '50%',
            'text-anchor': 'middle',
            'dominant-baseline': 'middle',
            children: count
          }
        ]
      } : null
    ]
  }]
});
const customNavBar = () => noact({
  tag: 'ul',
  role: 'menu',
  className: `${customClass} flex h-fit align-center relative color-notWhite`,
  children: [
    customIcon('home', '/', 'home'),
    customIcon('notifications', 'https://cohost.org/rc/project/notifications', 'notifications', notifications.count), // so popovers get attached
    bookmarkedTags.tags.length ? [
      customIcon('tagged', '#', 'tagged posts', null, onCustomTagButtonClick),
      {
        tag: 'ul',
        className: `${customClass}-tagList absolute p-2 rounded-lg`,
        style: 'z-index: 11; top: 3rem; left: 6rem; background: rgb(var(--color-background)); display: none',
        children: bookmarkedTags.tags.map(tag => { return {
          tag: 'li',
          className: 'hover:text-accent lg:hover:text-sidebarAccent',
          children: [{
            href: `/rc/tagged/${tag}`,
            children: `#${tag}`
          }]
        }; })
      }
    ] : null,
    customIcon('liked-posts', '/rc/liked-posts', 'posts you\'ved liked'),
    customIcon('artist-alley', '/rc/artist-alley', 'artist alley'),
    customIcon('search', 'https://cohost.org/rc/search', 'search'), // so popovers get attached
    customIcon('profile', `/${projectHandle}`, 'profile'),
    customIcon('inbox', '/rc/project/inbox', 'inbox', unreadAsks.count),
    customIcon('unpublished', '/rc/posts/unpublished', 'drafts'),
    customIcon('following', '/rc/project/following', 'following'),
    customIcon('followers', '/rc/project/followers', 'followers', followRequests.count),
    customIcon('settings', '/rc/user/settings', 'settings'),
    customIcon('help', 'https://help.antisoftware.club/support/home', 'help / report a bug'),
    hasActiveSubscription ? null : customIcon('plus', 'rc/user/settings#cohost-plus', 'get cohost plus!'),
  ]
});

const closeTagMenu = () => {
  if ($('ul[role="menu"] [href="#"]:hover, ul[role="menu"] [href="#"] + .my-1:hover').length === 0) {
    $(linkSelector)[0].click();
    document.removeEventListener('click', closeTagMenu);
  }
};
const onTagButtonClick = function(event) {
  const link = event.target.closest(linkSelector);
  const state = link.matches('[href="#"]:has(svg.rotate-180)');
  if (!state) window.setTimeout(() => document.addEventListener('click', closeTagMenu), 200);
  else document.removeEventListener('click', closeTagMenu);
};
const onCustomTagButtonClick = function(event) {
  const state = this.dataset.state;
  if (state) this.dataset.state = '';
  else this.dataset.state = 'open';
};

const unreadObserver = new MutationObserver(mutations => {
  const text = mutations.filter(({ target }) => target.parentElement.matches(textSelector)).pop();
  if (!text) return;

  $(`svg.${customClass} text`).text(text.target.parentElement.textContent);
});

export const main = async () => {
  const { unreadOnNavbar } = await getOptions('horizontal');
  const menu = document.querySelector(menuSelector);

  if (window.location.pathname !== '/' && window.location.pathname.split('/').length === 2) {
    document.querySelector(navSelector).prepend(customNavBar());
  } else {
    if (window.location.pathname === '/rc/artist-alley') $('.styled-scrollbars-light[class~="\[height\:calc\(100vh-4rem\)\]"]').prepend($('<div>', { class: 'ch-utils-horizontal' }));
    else $('[class~="lg\:grid-cols-4"]:has(ul[role="menu"])').prepend($('<div>', { class: 'ch-utils-horizontal' }));
    document.querySelector(navSelector).prepend(menu);
    menu.prepend(homeIcon);
    $(linkSelector).on('click', onTagButtonClick);

    if (unreadOnNavbar) {
      const target = document.querySelector(observerTargetSelector);
      if (target) {
        document.documentElement.append(unreadOnNavbarStyleElement);
        unreadObserver.observe(target, { subtree: true, characterData: true });
      } 
    }
  }
};

export const clean = async () => {
  document.removeEventListener('click', closeTagMenu);
  $(linkSelector).off('click', onTagButtonClick);
  unreadOnNavbarStyleElement.remove();

  $(menuSelector).insertAfter(`div.${customClass}`);
  $(`.${customClass}`).remove();
  unreadObserver.disconnect();
}