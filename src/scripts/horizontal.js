import { getOptions } from './utils/jsTools.js';
import { style } from './utils/style.js';

const navSelector = 'header > .container > nav';
const menuSelector = 'ul[role="menu"]:not([class~="lg\:hidden"])';
const buttonSelector = '#live-dashboard .flex-col > button.w-full';
const linkSelector = '[href="#"]';
const observerTargetSelector = '#live-dashboard > .flex-col';
const textSelector = '#live-dashboard .flex-col > button.w-full svg text'
const customClass = 'ch-utils-horizontal';

const unreadOnNavbarStyleElement = style('@media (min-width: 1024px) { #live-dashboard > .flex > button.w-full { display: none; } }');
const homeIcon = $(`
  <a class="${customClass}" href="/">
    <li class="flex flex-row items-center gap-2 rounded-lg border border-transparent px-1 py-3 hover:text-accent lg:hover:text-sidebarAccent" title="home">
      <div class="relative">
        <svg xmlns="http://www.w3.org/2000/svg" fill="${ location.pathname === '/' ? 'currentColor' : 'none' }" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="inline-block h-6">
          <path d="M 11.990234,2.625 2.25,12.107422 l 3.5,0.0039 V 21.25 H 9.6992188 V 14.699219 H 14.300781 V 21.25 H 18.25 v -9.128906 l 3.5,0.0039 z" style="display:inline;stroke-width:1.50047;stroke-linejoin:round" id="path9"></path>
        </svg>
      </div>
      unread posts
      <svg viewBox="0 0 25 18" xmlns="http://www.w3.org/2000/svg" style="fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 2;" class="${customClass} ml-auto h-6 fill-sidebarAccent text-sidebarBg">
        <path d="M14.923 17.087c-2.254.666-4.388.967-6.402.905-2.014-.062-3.742-.532-5.183-1.409-1.442-.877-2.436-2.217-2.982-4.022-.549-1.814-.463-3.476.257-4.985.719-1.51 1.905-2.832 3.557-3.965C5.823 2.478 7.776 1.578 10.03.913c2.243-.663 4.369-.965 6.376-.906 2.007.059 3.733.523 5.178 1.394 1.446.87 2.441 2.207 2.987 4.011.546 1.804.457 3.464-.266 4.981-.724 1.516-1.908 2.845-3.551 3.987-1.644 1.143-3.588 2.045-5.831 2.707Z" style="fill-rule: nonzero;"></path>
          <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="cursor-pointer select-none fill-current font-atkinson text-[10px] font-bold leading-none"></text>
        </svg>
    </li>
  </a>
`);

homeIcon.on('click', event => {
  if ($(buttonSelector).length) {
    event.preventDefault();
    event.stopImmediatePropagation();
    window.scrollTo({ top: 0, behaviour: 'auto' });
    $(buttonSelector).trigger('click');
  }

  homeIcon.find('text').text('');
});

const closeTagMenu = () => {
  if ($('[href="#"]:hover, [href="#"] + .my-1:hover').length === 0) {
    $(linkSelector)[0].click();
    document.removeEventListener('click', closeTagMenu);
  }
};
const onTagButtonClick = event => {
  const link = event.target.closest(linkSelector);
  const state = link.matches('[href="#"]:has(svg.rotate-180)');
  if (!state) window.setTimeout(() => document.addEventListener('click', closeTagMenu), 200);
  else document.removeEventListener('click', closeTagMenu);
};

const unreadObserver = new MutationObserver(mutations => {
  const text = mutations.filter(({ target }) => target.parentElement.matches(textSelector)).pop();
  if (!text) return;

  $(`svg.${customClass} text`).text(text.target.parentElement.textContent);
});

export const main = async () => {
  const { unreadOnNavbar } = await getOptions('horizontal');
  const menu = $(menuSelector);

  if (window.location.href === 'https://cohost.org/rc/artist-alley') $('.styled-scrollbars-light[class~="\[height\:calc\(100vh-4rem\)\]"]').prepend($('<div>', { class: 'ch-utils-horizontal' }));
  else $('[class~="lg\:grid-cols-4"]:has(ul[role="menu"])').prepend($('<div>', { class: 'ch-utils-horizontal' }));
  $(navSelector).prepend(menu);
  menu.prepend(homeIcon);
  $(linkSelector).on('click', onTagButtonClick);

  if (unreadOnNavbar) {
    const target = document.querySelector(observerTargetSelector);
    if (target){
      document.documentElement.append(unreadOnNavbarStyleElement);
      unreadObserver.observe(target, { subtree: true, characterData: true });
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