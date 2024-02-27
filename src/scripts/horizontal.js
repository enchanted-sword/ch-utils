const buttonSelector = '#live-dashboard .flex.gap-12 > button.w-full';
const homeIcon = $(`
  <a href="/">
    <li class="ch-utils flex flex-row items-center gap-2 rounded-lg border border-transparent px-1 py-3 hover:text-accent lg:hover:text-sidebarAccent" title="home">
      <div class="relative">
        <svg xmlns="http://www.w3.org/2000/svg" fill="${ location.pathname === '/' ? 'currentColor' : 'none' }" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true" class="inline-block h-6">
          <path d="M 11.990234,2.625 2.25,12.107422 l 3.5,0.0039 V 21.25 H 9.6992188 V 14.699219 H 14.300781 V 21.25 H 18.25 v -9.128906 l 3.5,0.0039 z" style="display:inline;stroke-width:1.50047;stroke-linejoin:round" id="path9"></path>
        </svg>
      </div>
      unread posts
    </li>
  </a>
`);

homeIcon.on('click', event => {
  if ($(buttonSelector).length) {
    event.preventDefault();
    event.stopImmediatePropagation();
    $(buttonSelector).trigger('click');
  }

  homeIcon.find('text').text('');
});

export const main = async () => {
  $('ul[role="menu"]').prepend(homeIcon);
  $('[class~="lg:grid-cols-4"]:has(ul[role="menu"])').prepend($('<div>', { class: 'ch-utils' }));
};

export const clean = async () => $('.ch-utils').remove();