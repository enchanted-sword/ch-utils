import { noact } from './noact.js';
import { activeProject } from './user.js';
import { apiFetch, batchTrpc, followState } from './apiFetch.js';
import { parseMd } from './markdown.js';

export const avatar8 = project => noact({
  className: 'flex-0 mask relative aspect-square h-8 w-8 inline-block',
  children: [{
    src: project.avatarURL,
    className: `mask mask-${project.avatarShape} h-full w-full object-cover`,
    alt: project.handle
  }]
});

const followStates = [
  'follow',
  'cancel follow request',
  'unfollow'
];
const followCancelOrUnfollow = [
  'createFollowRequest',
  'declineOrCancelFollowRequest',
  'unfollow'
];
const followCancelOrUnfollowRequest = async (state, toProjectId) => apiFetch(`/v1/trpc/relationships.${followCancelOrUnfollow[state]}`, {
  method: 'POST',
  queryParams: { batch: 1 },
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    0: { fromProjectId: activeProject.projectId, toProjectId } 
  })
});
const lockIcon = () => { 
  return {
    viewBox: '0 0 25 18',
    style: 'fill-rule: evenodd; clip-rule: evenodd; stroke-linejoin: round; stroke-miterlimit: 2;',
    className: 'cohost-shadow-light dark:cohost-shadow-dark absolute -bottom-1 -right-1 h-5 fill-foreground-500 text-notWhite',
    children: [
      {
        d: 'M14.923 17.087c-2.254.666-4.388.967-6.402.905-2.014-.062-3.742-.532-5.183-1.409-1.442-.877-2.436-2.217-2.982-4.022-.549-1.814-.463-3.476.257-4.985.719-1.51 1.905-2.832 3.557-3.965C5.823 2.478 7.776 1.578 10.03.913c2.243-.663 4.369-.965 6.376-.906 2.007.059 3.733.523 5.178 1.394 1.446.87 2.441 2.207 2.987 4.011.546 1.804.457 3.464-.266 4.981-.724 1.516-1.908 2.845-3.551 3.987-1.644 1.143-3.588 2.045-5.831 2.707Z',
        style: 'fill-rule: nonzero;'
      },
      {
        tag: 'g',
        'transform-origin': 'center center',
        transform: 'scale(0.6 0.6) rotate(0)',
        children: [{
          viewBox: '0 0 24 24',
          fill: 'currentColor',
          'aria-hidden': 'true',
          children: [{
            'fill-rule': 'evenodd',
            d: 'M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z',
            'clip-rule': 'evenodd'
          }]
        }]
      }
    ]
  };
};
export const followCard = async (customClass, project) => {
  project.followState = await followState(project.handle);
  return noact({ className: `${customClass} flex flex-row items-center gap-1`, children: [
  {
    href: `https://cohost.org/${project.handle}`,
    className: 'flex-0 mask relative aspect-square h-16 w-16 hidden lg:block cohost-shadow-light dark:cohost-shadow-dark',
    title: `@${project.handle}`,
    children: [
      {
        src: project.avatarURL,
        className: `mask mask-${project.avatarShape} h-full w-full object-cover`,
        alt: project.handle
      }, 
      project.privacy === 'private' ? lockIcon() : ''
    ]
  },
  {
    className: 'min-w-0 flex-shrink justify-center gap-0 lg:flex-row',
    children: [
      {
        className: 'items-left flex flex-shrink flex-row gap-1 lg:flex-col',
        children: [
          {
            className: 'flex-0 mask relative aspect-square h-8 w-8 lg:hidden inline-block',
            children: [{
              src: project.avatarURL,
              className: `mask mask-${project.avatarShape} h-full w-full object-cover`,
              alt: project.handle
            }]
          },
          {
            rel: 'author',
            href: `https://cohost.org/${project.handle}`,
            className: 'co-project-display-name max-w-full flex-shrink truncate font-atkinson font-bold hover:underline',
            title: project.displayName,
            children: [project.displayName]
          },
          {
            href: `https://cohost.org/${project.handle}`,
            className: 'co-project-handle font-atkinson font-normal hover:underline',
            title: `@${project.handle}`,
            children: [`@${project.handle}`]
          }
        ]
      },
      {
        children: [project.dek]
      }
    ]
  },
  {
    className: 'flex-grow'
  },
  {
    className: 'leading-none align-middle py-2 px-4 no-select font-atkinson font-bold rounded-full border-2 border-cherry hover:bg-cherry text-cherry active:bg-cherry-600 active:border-cherry-600 disabled:text-cherry-300 disabled:border-cherry-300 focus:outline-cherry focus:ring-cherry bg-notWhite hover:text-notWhite',
    onclick: async ({ target }) => {
      const state = await followState(project.handle);
      
      followCancelOrUnfollowRequest(state, project.projectId).then(([{ followingState }]) => {
        if (followingState === 2) {
          target.innerText = 'unfollow';
        } else if (followingState === 1) {
          target.innerText = 'cancel follow request';
        } else if (project.privacy === 'private') {
          target.innerText = 'send follow request';
        } else target.innerText = 'follow';
      });
    },
    children: [project.followState === 0 ? (project.privacy === 'private' ? 'send follow request' : 'follow') : followStates[project.followState]]

  }
]});
};

const bookmarkState = async tagName => {
  let state;
  try { [state] = await batchTrpc(['bookmarks.tags.isBookmarked'], { 0: { tagName }}); }
  catch { state = false; }
  finally { return state; }
};
const bookmarkOrUnbookmark = state => state ? 'delete' : 'create';
const bookmarkOrUnbookmarkRequest = async (state, tagName) => apiFetch(`/v1/trpc/bookmarks.tags.${bookmarkOrUnbookmark(state)}`, {
  method: 'POST',
  queryParams: { batch: 1 },
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    0 : { tagName }
  })
});
export const tagCard = async (customClass, tag) => {
  const bookmarked = await bookmarkState(tag);
  return noact({
    className: `${customClass} flex flex-row justify-between gap-3`,
    children: [
      {
        className: "underline before:content-['#']",
        href: `https://cohost.org/rc/tagged/${encodeURIComponent(tag)}`,
        children: [tag]
      },
      {
        className: 'leading-none align-middle py-2 px-4 no-select body-2 rounded-lg bg-secondary text-notWhite dark:text-notBlack hover:bg-secondary-600',
        onclick: async ({ target }) => {
          const state = await bookmarkState(tag);
          
          bookmarkOrUnbookmarkRequest(state, tag).then(() => {
            if (state) {
              target.innerText = 'bookmark this tag';
            } else target.innerText = 'unbookmark this tag';
          });
        },
        children: [`${bookmarked ? 'un' : ''}bookmark this tag`]
      }
    ]
  });
};

export const embeddedAsk = ask => noact({
  className: 'co-embedded-ask m-3 grid grid-cols-[2rem_1fr] grid-rows-[2rem_1fr] gap-x-3 gap-y-2 rounded-lg border p-3',
  dataset: { askid: ask.askId },
  children: [
    avatar8(ask.askingProject),
    {
      tag: 'span',
      className: 'co-attribution col-start-2 row-start-1 align-middle leading-8',
      children: [
        {
          className: 'font-bold hover:underline',
          href: `/${ask.askingProject.handle}`,
          tabindex: 0,
          target: '_blank',
          children: [`@${ask.askingProject.handle} asked: `]
        }
      ]
    },
    {
      className: 'co-prose prose col-start-2 row-start-2',
      innerHTML: parseMd(ask.content)
    }
  ]
});

const playIcon = () => noact({
  fill: 'none',
  viewBox: '0 0 24 24',
  'stroke-width': 1.5,
  stroke: 'currentColor',
  'aria-hidden': true,
  className: 'm-auto h-9 w-9',
  children: [
    {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z'
    }
  ]
});
const pauseIcon = () => noact({
  fill: 'none',
  viewBox: '0 0 24 24',
  'stroke-width': 1.5,
  stroke: 'currentColor',
  'aria-hidden': true,
  className: 'm-auto h-9 w-9',
  children: [
    {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M14.25 9v6m-4.5 0V9M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  ]
});
export const audioPlayer = (src, track = '', artist = 'unknown artist') => {
  let playstate;
  let frameId;

  const identifier = src.split('/').pop()
  !track && (track = identifier);
  const audio = noact({
    tag: 'audio',
    src,
    preload: 'metadata',
    className: 'w-full p-2',
    dataset: { testid: 'audio' },
    tabindex: -1,
    children: [{
      href: src,
      tabindex: -1,
      children: ['download audio']
    }],
  });
  const formatDuration = duration => {
    const ss = String(duration % 60).padStart(2, '0');
    const mm = String(Math.floor(duration / 60)).padStart(2, '0');
    const hh = duration >= 3600 ? String(Math.floor(duration / 3600)).padStart(2, '0') : null;
    return [hh, mm, ss].filter(t => t !== null).join(':');
  };
  const showDuration = () => {
    const { duration } = audio;
    const durationString = formatDuration(Math.floor(duration));
  
    document.getElementById(`${identifier}-range`).max = duration;
    document.getElementById(`${identifier}-end`).innerText = durationString;
  };
  const togglePlayState = () => {
    if (playstate) {
      audio.pause();
      playstate = 0;
      document.getElementById(`${identifier}-playbutton`).replaceChildren(playIcon());
      cancelAnimationFrame(frameId);
    } else {
      audio.play();
      playstate = 1;
      document.getElementById(`${identifier}-playbutton`).replaceChildren(pauseIcon());
      frameId = requestAnimationFrame(playback);
    }
  };
  const seekInput = ({ target: { value } }) => {
    document.getElementById(`${identifier}-start`).innerText = formatDuration(Math.floor(value));
    !audio.paused && (cancelAnimationFrame(frameId));
  };
  const seekChange = ({ target: { value } }) => {
    audio.currentTime = value;
    !audio.paused && (requestAnimationFrame(playback));
  };
  const playback = () => {
    document.getElementById(`${identifier}-start`).innerText = formatDuration(Math.floor(audio.currentTime));
    document.getElementById(`${identifier}-range`).value = audio.currentTime;
    if ((audio.duration - audio.currentTime) === 0) {
      togglePlayState();
      return;
    } else frameId = requestAnimationFrame(playback);
  }

  if (audio.readyState > 0) showDuration();
  else audio.addEventListener('loadedmetadata', showDuration);

  return noact({
    tag: 'figure',
    className: 'group relative w-full flex-initial',
    children: [
      {
        tag: 'figcaption',
        className: 'sr-only',
        children: [`${artist} - ${track}`]
      },
      audio,
      {
        className: 'flex flex-row',
        children: [
          {
            id: `${identifier}-playbutton`,
            type: 'button',
            onclick: togglePlayState,
            className: 'w-[76px] bg-cherry flex-shrink-0 flex-grow',
            title: 'play',
            tabindex: 0,
            children: [playIcon()]
          },
          {
            className: 'flex w-full flex-col bg-notBlack p-2',
            children: [
              {
                className: 'flex flex-row',
                children: [
                  {
                    className: 'flex-1',
                    children: [track]
                  },
                  {
                    href: src,
                    download: '',
                    title: 'download',
                    tabindex: 0,
                    children: [{
                      fill: 'none',
                      viewBox: '0 0 24 24',
                      'stroke-width': 1.5,
                      stroke: 'currentColor',
                      'aria-hidden': true,
                      className: 'm-auto h-6 w-6',
                      children: [
                        {
                          'stroke-linecap': 'round',
                          'stroke-linejoin': 'round',
                          d: 'M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z'
                        }
                      ]
                    }]
                  }
                ]
              },
              {
                className: 'text-xs',
                children: [artist]
              },
              {
                className: 'flex flex-row items-center',
                children: [
                  {
                    tag: 'div',
                    id: `${identifier}-start`,
                    className: 'text-xs tabular-nums',
                    children: ['00:00']
                  },
                  {
                    id: `${identifier}-range`,
                    tag: 'input',
                    type: 'range',
                    className: 'audio-controls mx-1 flex-1 accent-mango',
                    min: 0,
                    max: 1,
                    step: 'any',
                    value: 0,
                    oninput: seekInput,
                    onchange: seekChange,
                    tabindex: 0
                  },
                  {
                    tag: 'div',
                    id: `${identifier}-end`,
                    className: 'text-xs tabular-nums',
                    children: ['00:00']
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  });
}