# v1.2.0
### General
- Tweaked permission structure to better fit MV2
- Debug logging for apiFetch calls
- Tidied up user methods

### **New!** Display post source code
- Adds a toggle to view a post's source markdown, complete with syntax highlighting
- 3 colour themes: abyss, fruit, and reef

### Open notifications in popover view
- Colour contrast is now enforced in preview text
- Added a manual fix for https://bugzilla.mozilla.org/show_bug.cgi?id=1896299
- Implemented the "[no text]" label for non-transparent with no text
- numFetch is now explicitly converted to a number

### Follower page tweaks
- Fixed counting methods (the API now only returns a max of 100 projects at a time, the previous bucket size used was 500)

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