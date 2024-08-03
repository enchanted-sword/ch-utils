import { mutationManager } from './utils/mutation.js';
import { getOptions } from './utils/jsTools.js';
const labelId = '-cohost-remove-shares--label'
const spacerId = '-cohost-remove-shares--spacer'
const checkboxId = '-cohost-remove-shares--checkbox-toggle'
const isShareClass = '-cohost-remove-shares--is-share'
const hideSharesClass = '-cohost-remove-shares--hide-shares'
const handleSelector = 'header a.co-project-handle'

const parentSelector = 'main section > div:nth-child(1)'
const threadSelector = '[data-view="post-preview"]'
const $parent = () => $(parentSelector).first()
const $feed = () => $('.renderIfVisible:not(.co-embed)').first().parent()

function markShare(thread) {
  const $thread = $(thread)
  // console.log('marking share on', thread, $thread, $thread.find(handleSelector));
  const handles = $.map($thread.find(handleSelector), x => x.href)
  if (handles.length > 1 && handles[0] !== handles[1]) {
    $thread.parent().addClass(isShareClass)
  }
}

function markShares() {
  const feed = $feed()
  // console.log('feed', feed);
  // console.log('posts?', feed.find(threadSelector));
  for (const post of feed.find(threadSelector)) {
    markShare(post)
  }
}

function validLocation(href) {
  return (
    href === 'https://cohost.org/'
    || href.startsWith('https://cohost.org/rc/dashboard')
  )
}

export async function main () {

  if (!validLocation(location.href)) return

  const spacer = $(`<div class="flex-1" id=${spacerId}>&nbsp;</div>`)

  const label = $(`
    <label class="font-bold pl-4 text-sidebarText" id="${labelId}">
      <span class="pr-2">hide shares</span>
      <input class="h-6 w-6 rounded-lg border-2 border-foreground bg-notWhite text-foreground focus:ring-foreground pl-4" type="checkbox" id="${checkboxId}">
    </label>
  `)

  const parent = $parent()
  parent.append(spacer)
  parent.append(label)
  parent.attr('class', 'mb-2 flex flex-col items-center lg:flex-row')

  $('#'+checkboxId).on("change", () => {
    console.log('TOGGLE HIDING SHARES NOW', $feed());
    $feed().toggleClass(hideSharesClass)
  })

  markShares()

  // ensure the checkbox is always present
  mutationManager.start(parentSelector, () => {
    const parent = $parent()
    if (!parent.children('label')[0]) {
      parent.append(label)
    }
  })

  // as new posts are added to the page, ensure they shares are marked
  mutationManager.start(threadSelector, mutations => {
    markShares()
  })
};

export async function clean () {
  mutationManager.stop(parentSelector)
  mutationManager.stop(threadSelector)
  $(spacerId).remove()
  $(labelId).remove()
  $feed().removeClass(hideSharesClass)
  $(isShareClass).removeClass(isShareClass)
};