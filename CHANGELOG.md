# 1.4.0.2
### Post previews
- Fixed the editor expanding its height to match the preview
- Fixed an incorrect selector during tag initialisation
- Fixed an incompatibility with the v1 post composer

# 1.4.0
### General
- Fixed overflow and scrolling issues with the extension menu on mobile
- Now opens the config menu on install/update so sophonts don't miss it

### Open notifications in popover view
- Fixed new notifications not being spliced from old ones
- Prevent popup from closing when clicking inside
- Weekly notification preview line and body updates
- Fix headlines being parsed as markdown

### Quick search
- Strip dialetics from search queries
- Clear query on closing popup

### **New feature:** Keyboard shortcuts
- Adds keyboard shortcuts for navigation and interaction

### **New feature:** Post previews
- Displays a live preview of the post you're writing alongside the editor

# v1.3.4
### General
- Fixed newlines harder
- Preference option text inputs now only update when the input loses focus

### Open notifications in popover view
- Added avatar wrapping option
- Fixed single likes being labelled as shares
- Fixed the button still being filled in after feature cleanup
- Fixed uncaught errors when encountering unavailable posts while mapping shares

### Post filtering
- Added new options for duplicate post filtering
- Fixed posts being hidden on your own project page
- Added content, tag, and CW filtering that supports partial matches and checks all posts in a thread

### Follower page tweaks
- Fixed bug where clicking the reshare button would scroll to the top of the page

### Show page info
- New name
- Now works on mobile! Tap and hold on a link to show the popup

# v1.3.3
### **New feature:** Post filtering
- Control what posts you see on your dashboard
- Filter out your own posts or duplicate posts

### General
- Changed the extension icon to use paths instead of glyphs so that it displays correctly regardless of local font availability
- Fixed colour contrast on machines that prefer light mode
- Fixed a markdown parsing issue with newlines and carriage returns

### Open notifications in popover view
- Added a new option to display shares with tags
- Every item in a notification's line of action is now a unique hyperlink where possible

### Popover comments
- Fixed excessive whitespace issue

### Custom timestamps
- Fixed a highly specific bug where notifications for posts containing embedded comments would generate bugged timestamps

### Yinglet translation
- Translations are now applied per-post instead of per-thread

# v1.3.2
### **New feature:** Fix comment counts
- Fixes incorrect comment numbers on posts

### General
- Switched to OpenType fonts to fix compatibility issues

### Open notifications in popover view
- Fixed incorrect timezones on dates

### Popover comments
- Fixed whitespace not being preserved in comments

### Horizontal navigation
- Fixed a bug where clicking on project pages would send you back to the previous page

# v1.3.1
### General
- Fixed module-specific errors from halting mutation callbacks for other modules

### Custom timestamps
- Unset default override
- Added better handling for invalid locales

# v1.3.0
### **New feature:** Mobile quick navigation
- Add up to 6 navigation icons to a footer menu at the bottom of the screen

### **New feature:** Quick search
- Displays a popover search menu when clicking on the search button

### **New feature:** Custom timestamps
- Formats timestamps with a user-supplied luxon.DateTime preset or Intl.DateTimeFormat constructor options

### Open notifications in popover view
- A million minor tweaks to preview line creation
- Link to notification page is now shown on mobile
- Minor style tweaks
- &lt;pre&gt; elements are now sandboxed correctly

### Quick rechost
- Positioning in general is now more accurate
- Added option for showing tag entry
- Added a new content entry field (handles cohost custom emojis too!)

### Show page info on hover
- Now shows a link to the ask page

### Horizontal navigation
- All dashboard pages should now have the same margins

# v1.2.3
### Quick rechost
- Should hopefully no longer occasionally overflow on mobile

### Open notifications in popover view
- Unread highlighting should now be fixed on LIGHT MODE
- Minor style tweaks

### Show page info on hover
- Show now always display the correct page

# v1.2.2
### General
- Now mobile-friendly!
- Minor tweaks to the menu appearance
- Parallel processing should speed up some features
- The extension will now show a badge to indicate that an update has occured, and new or updated features will be highlighted in the menu 

### Quick rechost
- Added touch support; tap and hold the button to bring up the quick rechost menu

### Open notifications in popover view
- Unread notifications now contrast correctly on both forced and inherited dark mode (for real this time)
- Added mobile support
- Interaction dialog is now slightly more accurate

### Show page info on hover
- Will now only run if the device has a mouse active (and thus can actually hover), to save on network requests
- Hover event handlers should now be properly removed when disabling the feature

### Horizontal navigation
- No longer messes with the menu if in sub-1024px mode

### Yinglet translation
- Contents of &lt;code&gt; elements are now preserved and will not be translated

### Display post source code
- Should now correctly work on long threads with the "collapse long threads" cohost setting enabled

# v1.2.1
### General
- Preferences should hopefully now transition seamlessly when adding or removing features or options

### **New feature:** Yinglet translation
- Converts the zh phoneme in yinglet-ified post text to the usual th phoneme
- Also works in reverse

### Open notifications in popover view
- Fixed bug where cohost tries to serve you posts from blocked projects
- Unread notifications now contrast correctly on both forced and inherited dark mode
- Unread notifications are now counted correctly
- Fixed headline-only opaque shares not displaying preview text

### Show comments under posts
- Comments are no longer haunted (ghost comments could previously be left on transparent shares)

# v1.2.0
### General
- Tweaked permission structure to better fit MV2
- Debug logging for apiFetch calls
- Tidied up user methods
- Importing/exporting preferences now works correctly

### **New!** Display post source code
- Adds a toggle to view a post's source markdown, complete with syntax highlighting
- 3 colour themes: abyss, fruit, and reef

### Open notifications in popover view
- Colour contrast is now enforced in preview text
- Added a manual fix for https://bugzilla.mozilla.org/show_bug.cgi?id=1896299
- Implemented the "[no text]" label for non-transparent with no text
- numFetch is now explicitly converted to a number
- Replies to comments on your post are now correctly identified as such

### Follower page tweaks
- Fixed counting methods (the API now only returns a max of 100 projects at a time, the previous bucket size used was 500)

### Show comments under posts
- Comments can now be submitted with ctrl-enter

# v1.1.1
### General
- Added better system for managing updates to feature options
- Added a version display and "reset preferences" button to the manage section of the menu
- chutils is now hosted on AMO! https://addons.mozilla.org/en-US/firefox/addon/chutils/

# v1.1.0
### General
- The extension now uses MV2 instead of MV3

### Show page info on hover
- Now generates info cards for pages in notification popovers
- Optimized methods
- Now shows pronouns and URL, with a toggleable option to show descriptions

### Open notifications in popover view
- Cleaned up methods
- Now shows dedicated preview images for posts with inline images or image attachments

### Show comments under posts
- Posts and comments can now be replied to from the popover view

### Quick rechost
- Added a new verb replacing "repost"
- Minor weighting tweaks

# v1.0.1 - Initial release
