import { noact } from './noact.js';
import { activeProject } from './user.js';
import { apiFetch, batchTrpc, followState } from './apiFetch.js';
import { parseMd, parseMdEmbed } from './markdown.js';
import { displayPrefs, postBoxTheme } from './apiFetch.js';
import { updateData } from './database.js';

// eslint-disable-next-line no-undef
const { DateTime } = luxon;

export const avatar8 = (project, lgHidden = false) => noact({
  className: `flex-0 mask relative aspect-square h-8 w-8 inline-block ${lgHidden ? 'lg:hidden' : ''}`,
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
const followCardLockIcon = () => { 
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
      project.privacy === 'private' ? followCardLockIcon() : ''
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
    onclick: async function({ target }) {
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
  return state;
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
        onclick: async function({ target }) {
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
const volumeIcon = id => noact({
  id,
  className: 'h-6 w-6 volume-icon',
  viewBox: '0 0 24 24',
  fill: 'none',
  'stroke-width': 1.5,
  stroke: 'currentColor',
  dataset: { muted: '', volume: 3 },
  children: [
    {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'm 8.01296,8.89281 c 0,0 -1.21949,2.90009 0,6.21439 M 12.1382,4.74989 8.01558,8.89281 H 4.2434 c -0.55164,0 -0.9934,0.4345 -0.9934,0.9737 v 4.26699 c 0,0.5392 0.44176,0.9737 0.9934,0.9737 h 3.77218 l 4.12262,4.1429 z'
    },
    {
      className: 'volume-1',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'm 14.096542,10.165673 c 0.826195,0.221388 1.400713,0.970094 1.400665,1.825377 3.4e-5,0.855341 -0.57447,1.604011 -1.400642,1.825384'
    },
    {
      className: 'volume-2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'm 15.350183,8.3377038 c 1.652392,0.4427716 2.801345,1.9401262 2.801331,3.6507512 -1.8e-5,1.710632 -1.148936,3.208015 -2.80128,3.65076'
    },
    {
      className: 'volume-3',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'm 16.739362,6.5123739 c 2.478504,0.6641052 4.201889,2.9101157 4.20191,5.4760801 2e-5,2.565964 -1.723406,4.812026 -4.201923,5.476143'
    },
    {
      className: 'volume-mute',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M 20.2627,9.25394 C 14.1744,15.3422 14.2036,15.313 14.2036,15.313 m 0,-6.05906 c 6.0883,6.08826 6.0591,6.05906 6.0591,6.05906'
    },
  ]
});
export const audioPlayer = (src, preloadDuration = false, track = '', artist = 'unknown artist') => {
  let playstate;
  let frameId;

  const identifier = src.split('/').pop();
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
  const togglePlayState = function() {
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
  const seekInput = function({ target: { value } }) {
    document.getElementById(`${identifier}-start`).innerText = formatDuration(Math.floor(value));
    !audio.paused && (cancelAnimationFrame(frameId));
  };
  const seekChange = function({ target: { value } }) {
    audio.currentTime = value;
    !audio.paused && (requestAnimationFrame(playback));
  };
  const playback = () => {
    document.getElementById(`${identifier}-start`).innerText = formatDuration(Math.floor(audio.currentTime));
    document.getElementById(`${identifier}-range`).value = audio.currentTime;
    if (audio.ended) {
      togglePlayState();
      return;
    } else frameId = requestAnimationFrame(playback);
  };

  if (!preloadDuration) {
    if (audio.readyState > 0) showDuration();
    else audio.addEventListener('loadedmetadata', showDuration);
  }

  return noact({
    tag: 'figure',
    className: 'group relative w-full flex-initial',
    children: [
      {
        id: `${identifier}-caption`,
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
                className: 'flex flex-row gap-4',
                children: [
                  {
                    id: `${identifier}-track`,
                    className: 'flex-1',
                    children: [track]
                  },
                  {
                    className: 'relative',
                    children: [
                      {
                        id: `${identifier}-volState`,
                        className: 'volume-state cursor-pointer',
                        dataset: { state: '' },
                        onclick: function() {
                          this.dataset.state ? this.dataset.state = '' : this.dataset.state = 'open';
                        },
                        children: volumeIcon(`${identifier}-volDisplay`)
                      },
                      {
                        className: 'volume-controls absolute top-0 bg-cherry rounded-lg right-0 h-10 w-52 p-1 justify-between items-center',
                        onmouseout: function() {
                          setTimeout(() => {
                            !(this.matches(':hover')) && (document.getElementById(`${identifier}-volState`).dataset.state = "");
                          }, 150)
                        },
                        children: [
                          {
                            className: 'cursor-pointer',
                            onclick: function() {
                              if (audio.muted) {
                                document.getElementById(`${identifier}-volDisplay`).dataset.muted = '';
                                document.getElementById(`${identifier}-volControl`).dataset.muted = '';
                                audio.muted = false;
                              } else {
                                document.getElementById(`${identifier}-volDisplay`).dataset.muted = 'muted';
                                document.getElementById(`${identifier}-volControl`).dataset.muted = 'muted';
                                audio.muted = true;
                              }
                            },
                            children: volumeIcon(`${identifier}-volControl`),
                          },
                          {
                            id: `${identifier}-volInput`,
                            className: 'audio-controls mx-1 flex-1 accent-mango w-36',
                            tag: 'input',
                            type: 'range',
                            min: 0,
                            max: 1,
                            step: 'any',
                            value: audio.volume,
                            oninput: function({ target: { value } }) {
                              audio.volume = value;
                              document.getElementById(`${identifier}-volOutput`).innerText = String(Math.floor(value * 100)).padStart(2, '0');
                              const level = Math.min(Math.floor(value * 4), 3);
                              document.getElementById(`${identifier}-volDisplay`).dataset.volume = level;
                              document.getElementById(`${identifier}-volControl`).dataset.volume = level;
                            }
                          },
                          {
                            id: `${identifier}-volOutput`,
                            className: 'text-xs tabular-nums w-6',
                            style: 'text-align:end',
                            tag: 'output',
                            children: String(Math.floor(audio.volume * 100)).padStart(2, '0')
                          }
                        ]
                      }
                    ]
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
                id: `${identifier}-artist`,
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
                    max: preloadDuration ? preloadDuration : 1,
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
                    children: [preloadDuration ? formatDuration(Math.floor(preloadDuration)) : '00:00']
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  });
};

export const headerIconContainer = () => noact({
  className: 'ch-utils-headerIconContainer flex-1 flex items-center justify-end gap-3'
});

export const likeIcon = post => noact({
  className: 'ch-utils-likeIcon w-6 h-6 pointer relative',
  onclick: function() {
    const fromProjectId = activeProject.projectId;
    const toPostId = post.postId;
    if (this.dataset.state) {
      post.isLiked = false;
      apiFetch('/v1/trpc/relationships.unlike', {
        method: 'POST',
        queryParams: { batch: 1 },
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 0: { fromProjectId, toPostId } })
      }).then(() => {
        this.dataset.state = '';
      });
    } else {
      post.isLiked = true;
      apiFetch('/v1/trpc/relationships.like?batch=1', {
        method: 'POST',
        queryParams: { batch: 1, },
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ 0: { fromProjectId, toPostId } })
      }).then(() => {
        this.dataset.state = 'liked';
      });
    }
    updateData({ postStore: post, bookmarkStore: post }, { bookmarkStore: { index: 'postId' }});
  },
  title: `like this post as ${activeProject.handle}`,
  style: 'order:2',
  dataset: { state: post.isLiked ? 'liked' : '' },
  children: [{
    className: 'w-6 h-6 pointer absolute top-0 left-0 co-action-button',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'aria-hidden': true,
    'stroke-width': 1.5,
    children: [{
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z'
    }]
  }]
});
export const shareIcon = shareOfPostId => noact({
  className: 'ch-utils-shareIcon',
  href: `/${activeProject.handle}/post/compose?shareOfPostId=${shareOfPostId}`,
  title: `share this post as ${activeProject.handle}`,
  target: '_blank',
  style: 'order:1',
  children: [{
    viewBox: '0 0 24 24',
    className: 'h-6 w-6 co-action-button',
    fill: 'none',
    'stroke-width': 1.5,
    stroke: 'currentColor',
    'aria-hidden': 'true',
    children: [{
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
    }]
  }]
});

const infoBox = (type, text) => noact({
  className: 'flex flex-col items-center m-3 gap-3',
  children: [{
    className: `co-info-box co-${type} box-border border-[1px] flex flex-row items-center gap-3 self-stretch rounded-lg p-3`,
    children: [
      {
        className: 'h-6 w-6 flex-none',
        fill: 'none',
        'stroke-width': 1.5,
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
        'aria-hidden': true,
        children: [{
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          d: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
        }]
      },
      { children: text }
    ]
  }]
});
const adultToggle = () => noact({
  className: 'ch-utils-18-plus flex flex-col items-center m-3 gap-3',
  children: [
    {
      className: `ch-utils-18-plus-info co-info-box co-18-plus box-border border-[1px] flex flex-row items-center gap-3 self-stretch rounded-lg p-3`,
      children: [
        {
          className: 'h-6 w-6 flex-none',
          fill: 'none',
          'stroke-width': 1.5,
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          'aria-hidden': true,
          children: [{
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            d: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
          }]
        },
        {
          children: [
            'This post contains 18+ content.',
            displayPrefs.explicitlyCollapseAdultContent	? ' We\'re hiding it according to your content preferences.' : null
          ]
        }
      ]
    },
    {
      className: 'ch-utils-18-plus-toggle flex flex-row items-center gap-3',
      children: [
        {
          href: 'https://help.antisoftware.club/a/solutions/articles/62000225024',
          className: 'co-info-box co-18-plus border-[1px] hover-underline flex h-10 items-center justify-center self-center rounded-lg bg-foreground py-2 px-3 leading-none hidden',
          target: '_blank',
          rel: 'noreferrer',
          children: '18+'
        },
        {
          className: 'ch-utils-18-plus-button co-filled-button tracking-wider whitespace-nowrap flex h-10 items-center justify-center self-center rounded-lg bg-foreground py-2 px-3 leading-none',
          onclick: function() {
            if (this.dataset.state) {
              this.dataset.state = '';
              this.textContent = 'show post';
            }
            else {
              this.dataset.state = 'open';
              this.textContent = 'hide post';
            }
          },
          dataset: { state: displayPrefs.explicitlyCollapseAdultContent ? '' : 'open' },
          children: displayPrefs.explicitlyCollapseAdultContent ? 'show post' : 'hide post'
        }
      ]
    }
  ]
});
const cwToggle = (adult, cws) => noact({
  className: 'ch-utils-18-plus ch-utils-cw flex flex-col items-center m-3 gap-3',
  children: [
    adult ? {
      className: `ch-utils-18-plus-info co-info-box co-18-plus box-border border-[1px] flex flex-row items-center gap-3 self-stretch rounded-lg p-3`,
      children: [
        {
          className: 'h-6 w-6 flex-none',
          fill: 'none',
          'stroke-width': 1.5,
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          'aria-hidden': true,
          children: [{
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            d: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z'
          }]
        },
        {
          children: [
            'This post contains 18+ content.',
            displayPrefs.explicitlyCollapseAdultContent	? ' We\'re hiding it according to your content preferences.' : null
          ]
        }
      ]
    } : null,
    {
      className: `ch-utils-cw-info co-info-box co-warning box-border border-[1px] flex flex-row items-center gap-3 self-stretch rounded-lg p-3`,
      children: [
        {
          className: 'h-6 w-6 flex-none',
          fill: 'none',
          'stroke-width': 1.5,
          stroke: 'currentColor',
          viewBox: '0 0 24 24',
          'aria-hidden': true,
          children: [{
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
            d: 'M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z'
          }]
        },
        {
          children: [
            {
              className: 'ch-utils-cw-infoLine',
              children: [
                'This post has content warnings for:',
                ...cws.map(cw => ({ tag: 'span', className: 'font-bold', children: ` ${cw}` })),
                { tag: 'span', className: 'font-bold', children: '.' }
              ]
            },
            {
              className: 'ch-utils-cw-openLine hidden',
              children: [
                adult ? [
                  'This post contains ',
                  {
                    href: 'https://help.antisoftware.club/a/solutions/articles/62000225024',
                    className: 'underline',
                    target: '_blank',
                    rel: 'noreferrer',
                    children: '18+ content'
                  },
                  '.',
                  { tag: 'br' },
                ] : null,
                'CWs:',
                ...cws.map(cw => ({ tag: 'span', className: 'font-bold', children: ` ${cw}` })),
                { tag: 'span', className: 'font-bold', children: '.' }
              ]
            }
          ]
        }
      ]
    },
    {
      className: 'ch-utils-18-plus-button co-filled-button tracking-wider whitespace-nowrap flex h-10 items-center justify-center self-center rounded-lg bg-foreground py-2 px-3 leading-none',
      onclick: function() {
        if (this.dataset.state) {
          this.dataset.state = '';
          this.textContent = 'show post';
        }
        else {
          this.dataset.state = 'open';
          this.textContent = 'hide post';
        }
      },
      dataset: { state: displayPrefs.explicitlyCollapseAdultContent ? '' : 'open' },
      children: displayPrefs.explicitlyCollapseAdultContent ? 'show post' : 'hide post'
    }
  ]
});

const meatballMenuButton = postId => noact({
  id: `mb-${postId}`,
  style: 'order: 2',
  onclick: function() {
    function closeMenu(event) {
      event.stopPropagation();
      if (!event.target.closest('[id*="mb"]') && !event.target.closest('.ch-utils-mb')) {
        document.querySelectorAll('[id*="mb"][data-headlessui-state="open"]').forEach(button => button.click());
      }
    }
    if (this.dataset.headlessuiState) {
      this.dataset.headlessuiState = '',
      this.setAttribute('aria-expanded', false);
      document.documentElement.removeEventListener('click', closeMenu);
    } else {
      this.dataset.headlessuiState = 'open',
      this.setAttribute('aria-expanded', true);
      document.documentElement.addEventListener('click', closeMenu);
    }
  },
  type: 'button',
  'aria-haspopup': 'menu',
  'aria-expanded': false,
  dataset: { headlessuiState: '' },
  children: [{
    className: 'co-action-button h-6 w-6 transition-transform ui-open:rotate-90',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 1.5,
    'aria-hidden': true,
    children: [{
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z'
    }]
  }]
});
const meatballMenu = post => noact({
  style: 'top: 2.75rem; right: .75rem',
  className: 'hidden ch-utils-mb absolute cohost-shadow-dark z-30 flex min-w-max flex-col gap-3 rounded-lg bg-notWhite p-3 text-notBlack focus:!outline-none',
  'aria-labelledBy': `mb-${post.postId}`,
  role: 'menu',
  tabindex: 0,
  children: [
    {
      onclick: function() { navigator.share({ url: post.singlePostPageUrl }) },
      className: 'flex flex-row gap-2 hover:underline',
      role: 'menuitem',
      tabindex: -1,
      children: [
        {
          viewBox: '0 0 24 24',
          className: 'h-6',
          children: [{
            d: 'M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z'
          }]
        },
        'share post'
      ]
    },
    {
      onclick: function() {
        const post = this.closest('article');
        let theme = post.dataset.theme;

        if (theme === 'light' || (theme === 'both' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)) {
          theme = 'dark';
        } else theme = 'light';

        post.dataset.theme = theme;
      },
      className: 'flex flex-row gap-2 hover:underline',
      role: 'menuitem',
      tabindex: -1,
      children: [
        {
          viewBox: '0 0 24 24',
          className: 'h-6',
          children: [{
            d: 'M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18'
          }]
        },
        'invert colors'
      ]
    }
  ]
});

const displayName = project => noact({
  className: 'co-project-display-name max-w-full flex-shrink truncate font-atkinson font-bold hover:underline',
  rel: 'author',
  href: `/${project.handle}`,
  title: project.displayName,
  children: project.displayName
});
const postHandle = project => noact({
  className: 'co-project-handle font-atkinson font-normal hover:underline',
  href: `/${project.handle}`,
  children: `@${project.handle}`
});
const timestamp = post => noact({
  className: 'block flex-none text-xs tabular-nums text-gray-500',
  dateTime: post.publishedAt,
  title: DateTime.fromISO(post.publishedAt).toLocaleString(DateTime.DATETIME_MED),
  children: [{
    href: post.singlePostPageUrl,
    className: 'hover:underline',
    children: [DateTime.fromISO(post.publishedAt).toRelative()]
  }]
});
const headerProjectLine = post => [
  post.postingProject.displayName ? displayName(post.postingProject) : null,
  post.postingProject.privacy === 'private' ? {
    className: 'co-project-display-name inline-block h-5 w-5',
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    'aria-hidden': true,
    children: [{
      'fill-rule': 'evenodd',
      'clip-rule': 'evenodd',
      d: 'M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5zs'
    }]
  } : null,
  postHandle(post.postingProject),
  post.responseToAskId ? {
    viewBox: '0 0 24 24',
    className: 'h-6 w-6 co-action-button',
    fill: 'none',
    'stroke-width': 1.5,
    stroke: 'currentColor',
    'aria-hidden': 'true',
    children: [{
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      d: 'M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z'
    }]
  } : null,
  timestamp(post)
];
const threadHeader = (post, prevShare) => noact({
  tag: 'header',
  className: 'co-thread-header relative',
  children: [
    {
      className: 'flex min-w-0 flex-1 flex-row flex-wrap items-center gap-2 leading-none',
      children: [
        avatar8(post.postingProject, true),
        headerProjectLine(post),
        prevShare ? [
          {
            viewBox: '0 0 24 24',
            className: 'h-6 w-6 co-action-button',
            fill: 'none',
            'stroke-width': 1.5,
            stroke: 'currentColor',
            'aria-hidden': 'true',
            children: [{
              'stroke-linecap': 'round',
              'stroke-linejoin': 'round',
              d: 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99'
            }]
          },
          avatar8(prevShare.postingProject, true),
          headerProjectLine(prevShare)
        ] : null,
      ]
    },
    meatballMenuButton(post.postId),
    meatballMenu(post)
  ]
});
const threadPreFooter = post => noact({
  className: 'flex w-full max-w-full flex-col',
  children: [
    {
      tag: 'hr',
      className: 'co-hairline mb-3'
    },
    {
      className: 'co-ui-text px-3',
      children: [{
        tag: 'span',
        className: 'min-w-0 truncate',
        children: [
          {
            href: `/${post.postingProject.handle}`,
            className: 'font-bold hover:underline',
            children: `@${post.postingProject.handle}`
          },
          {
            tag: 'span',
            children: ' shared with:'
          }
        ]
      }]
    },
    formatTags(post)
  ]
})
const threadFooter = post => noact({
  tag: 'footer',
  className: 'co-thread-footer w-full max-w-full rounded-b-lg p-3',
  children: [{
    className: 'flex justify-between align-middle',
    children: [
      {
        className: 'w-max flex-none',
        children: [{
          className: 'text-sm hover:underline',
          href: `${post.singlePostPageUrl}#comments`,
          children: [`${post.numComments} ${post.numComments === 1 ? 'comment' : 'comments'}`, post.numSharedComments ? ` + ${post.numSharedComments} on shared posts` : '']
        }]
      },
      {
        className: 'flex items-center justify-end gap-3',
        children: post.state? [
          likeIcon(post),
          shareIcon(post.postId)
        ] : []
      }
    ]
  }]
});
const postHeader = post => noact({
  className: 'co-post-header flex flex-row flex-wrap items-center gap-2 px-3 py-2',
  children: [
    avatar8(post.postingProject),
    headerProjectLine(post)
  ]
});
const postHeadline = post => noact({
  className: 'ch-utils-headline flex w-full flex-row p-3',
  children: [{
    className: 'co-prose prose flex-grow self-center break-words hover:underline',
    href: post.singlePostPageUrl,
    children: [{
      tag: 'h3',
      children: post.headline
    }]
  }]
});

const formatMarkdown = markdown => noact({
  className: 'co-prose prose my-4 overflow-hidden break-words px-3',
  innerHTML: displayPrefs.disableEmbeds ? parseMd(markdown) : parseMdEmbed(markdown)
});
const formatImage = attachment => noact({
  tag: 'button',
  className: 'group relative w-full flex-initial',
  tabindex: 0,
  children: [{
    src: attachment.fileURL,
    className: 'h-full w-full object-cover',
    alt: attachment.altText,
    dataset: { attachmentId: attachment.attachmentId }
  }]
});
const formatTags = post => noact({
  className: 'w-full max-w-full p-3',
  children: [{
    className: 'co-tags relative w-full overflow-y-hidden break-words leading-none ',
    children: [{
      children: post.tags.map(tag => ({ href: `/rc/tagged/${encodeURIComponent(tag)}`, className: 'mr-2 inline-block text-sm', children: ['#', tag] }))
    }]
  }]
});

const mapBlocks = blocks => {
  let sortedBlockIndex = 0;
  const sortedBlocks = [];
  blocks.map((block, index) => {
    if (block.attachment?.kind === 'image') {
      sortedBlocks[sortedBlockIndex] ?? sortedBlocks.push([]);
      sortedBlocks[sortedBlockIndex].push(block);
      if (blocks[index + 1]?.attachment?.kind !== 'image') ++sortedBlockIndex;
    } else sortedBlocks.push(block);
  });
  return sortedBlocks.map(block => {
    if (Array.isArray(block)) {
      const rows = [];
      block.map((img, i) => {
        if (block.length === 3 && i === 2) rows[0].children.push(formatImage(img.attachment));
        else if (i % 2 === 0) rows[i / 2] = {
          className: 'flex w-full flex-nowrap content-start justify-between',
          dataset: { testid: `row-${i / 2}` },
          children: [formatImage(img.attachment)]
        }; else rows[(i - 1) / 2].children.push(formatImage(img.attachment))
      });
      return rows;
    } else if (block.type === 'markdown') return formatMarkdown(block.markdown.content);
    else if (block.attachment?.kind === 'audio') return audioPlayer(block.attachment.fileURL, false, block.attachment.title, block.attachment.artist || 'unknown artist');
    else if (block.type === 'ask') return embeddedAsk(block.ask);
    else return '';
  });
};

const formatPosts = (parentPost, tree) => {
  return tree.map((post, index) => noact({
    children: [
      {
        id: `post-${post.postId}`,
        className: 'relative -top-20',
        dataset: { testid: `post-${post.postId}` }
      },
      parentPost.shareOfPostId ? postHeader(post) : null,
      {
        children: [{
          children:[
            post.state === 0 ? infoBox('info', 'This post is a draft.  It\'s not publicly visible, but you can send people links to it.') : null,
            post.state === 2 ? infoBox('tombstone', 'Sorry!  This post has been deleted by its original author.') : null,
            (post.state !== 2 && post.cws.length === 0 && post.effectiveAdultContent) ? adultToggle() : null,
            post.cws.length ? cwToggle(post.effectiveAdultContent, post.cws) : null,
            post.headline? postHeadline(post) : null,
            {
              className: 'relative overflow-hidden supports-[overflow:clip]:overflow-clip isolate co-contain-paint',
              dataset: { testid: 'post-body', postBody: true },
              children: mapBlocks(post.blocks)
            }
          ]
        }]
      },
      post.tags.length ? formatTags(post) : null, 
      index < tree.length - 1 ? { tag: 'hr', className: 'co-hairline' } : null,
    ]
  }));
};

export const renderPost = post => {
  const prevShare = post.shareTree.find(share => share.postId === post.shareOfPostId);
  const tree = post.shareTree.filter(post => !post.transparentShareOfPostId);
  if (!post.transparentShareOfPostId) tree.push(post);

  const thread = noact({
    className: 'ch-utils-customPost renderIfVisible',
    children: [{
      className: 'grid  w-full gap-x-6 gap-y-2',
      dataset: { testid: `post-${post.postId} `, postid: post.postId },
      children: [
        {
          tag: 'article',
          className: 'co-themed-box co-post-box',
          dataset: { theme: postBoxTheme },
          children: [
            threadHeader(post, prevShare),
            { tag: 'hr', className: 'co-hairline' },
            formatPosts(post, tree),
            post.tags.length && post.transparentShareOfPostId ? threadPreFooter(post) : null,
            { tag: 'hr', className: 'co-hairline' },
            threadFooter(post)
          ]
        }
      ]
    }]
  });
  return thread;
};