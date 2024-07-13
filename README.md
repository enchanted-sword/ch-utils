# chutils - utilities for cohost!

https://addons.mozilla.org/en-US/firefox/addon/chutils/

### **IMPORTANT NOTICE**: This extension is currently being developed exclusively for Firefox (>= v121.0) and its development builds
chutils is a web extension for cohost that adds custom informative, cosmetic, and quality-of-life features to improve the site's default layout and user experience.

# Features

### Horizontal navigation
Pins the navigation controls to the top of the window for ease of access; no more scrolling to the top of the page to access your inbox!

### Follower page tweaks
See your follower count or load your entire list of followers at once.

### Fix comment counts
Fixes incorrect comment numbers on posts.

### Show comments under posts
Displays an expandable comment section under posts on the timeline; no need to click off the page to read or reply to comments!

### Collapse comments
Adds a button to collapse comment trees.

### Open notifications in popover view
Changes the default behaviour of the notification page button to instead show a notification feed popup without navigating to the notification page.

### Quick rechost
Reshare posts in a single click, with the ability to add tags and content or share as a page other than the one you're currently active as. Simply hover over the reshare button on a device with mouse input, or tap and hold it on a device with touch input.

### Show page info
Hovering over or long pressing on a handle or display name will display a popup showing that page's avatar, header image, title, pronouns, url, and optionally, its description.

### Scrolling avatars
Makes the floating avatars scroll alongside the posts they're attached to.

### Display post source code
View the source markdown for posts, complete with tokenized syntax highlighting and multiple colour scheme options

### Yinglet translation
Converts the zh phoneme in yinglet-ified text to the usual th phoneme. Can optionally run in reverse.

### Mobile quick navigation
Adds a horizontal footer menu with up to 6 navigation icons.

### Quick search
Displays a popover search menu when clicking the navigation search button.

### Custom timestamps
Formats timestamps with a user-supplied luxon.DateTime preset (e.g. DATETIME_MED) or Intl.DateTimeFormat constructor options. See the [luxon documentation](https://moment.github.io/luxon/api-docs/index.html#datetimetolocalestring) and [Intl.DateTimeFormat documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat#using_options) for more info.

### Post filtering
Control what posts you see on your dashboard. You can filter out your own post, duplicate posts, or posts containing any user-suppied keywords, tags, or CWs.

# Building the extension locally
- Download and install [Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- Install the project dependancies using ```npm install```

The extension can then be built with ```npm run build``` and installed using the "install add-on from file" option on the [about:addons](about:addons) page.


