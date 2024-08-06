import {getOptions} from './utils/jsTools.js'

const classes = {
  commentInputResize: '-chutils-tweaks--comment-input-resize',
  hideChorner: '-chutils-tweaks--hide-chorner',
  compactTimeline: '-chutils-tweaks--compact-tl',
  betterProfiles: '-chutils-tweaks--better-profiles',
  timestamp: '-chutils-tweaks--timestamp',
  hideNames: '-chutils-tweaks--hide-names',
  hideHandles: '-chutils-tweaks--hide-handles',
  stickySidebar: '-chutils-tweaks--sticky-sb',
  hideHide: '-chutils-tweaks--hide-hide',
  compactComment: '-chutils-tweaks--compact-comment',
  spaceEfficiency: '-chutils-tweaks--space-efficiency',
  lowercaseTags: '-chutils-tweaks--lowercase-tags',
  squareAvatars: '-chutils-tweaks--square-avatars',
  squareCorners: '-chutils-tweaks--square-corners',
}

export async function main() {
  const options = await getOptions("cssTweaks")

  const toAdd = Object.entries(options)
    .filter(([_,b]) => typeof b === 'boolean')
    .filter(([_,b]) => b)
    .map(([x,_]) => classes[x])

  $('#app').addClass(toAdd.join(' '))
  document.body.style.setProperty('--chutils-tweaks--comment-color', options.commentColor)
}

export async function clean() {
  for (let c of Object.values(classes)) {
    $('.' + c).removeClass(c)
  }
}
