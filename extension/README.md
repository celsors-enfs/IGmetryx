# IGmetryx Feed Snapshot Chrome Extension

A Chrome Extension (Manifest V3) that automatically captures full-page screenshots of Instagram feeds by scrolling and stitching multiple screenshots together.

## Features

- ✅ Automatic scrolling and capture (no manual scrolling required)
- ✅ Intelligent overlap detection for seamless stitching
- ✅ Works with public Instagram profiles only
- ✅ All processing happens locally (no server uploads)
- ✅ Respects user privacy and Instagram terms

## Installation

### Option 1: Load Unpacked (Development)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `/extension` folder
6. The extension should now appear in your extensions list

### Option 2: Install from Chrome Web Store (When Available)

1. Visit the Chrome Web Store listing
2. Click "Add to Chrome"
3. Grant the required permissions when prompted

## Usage

1. **Install the extension** (see above)
2. **Navigate to the web app**: Go to `/instagram/feed-snapshot` in the IGmetryx web app
3. **Open Instagram**: In a new tab, navigate to the Instagram profile feed you want to capture (must be public)
4. **Start capture**: Click "Capture Snapshot" in the web app
5. **Wait for completion**: The extension will automatically:
   - Scroll through the page
   - Capture multiple screenshots
   - Stitch them together
6. **Download**: Once complete, download the final PNG image

## Permissions

The extension requires the following permissions:

- **`activeTab`**: To capture screenshots of the current tab
- **`scripting`**: To inject content scripts and control scrolling
- **`offscreen`**: To process images using OffscreenCanvas API
- **Host permission for `https://www.instagram.com/*`**: To work on Instagram pages

All permissions are only used when you actively start a capture. The extension does not run in the background or capture anything without user initiation.

## Architecture

### Files

- **`manifest.json`**: Extension manifest (MV3)
- **`service-worker.js`**: Background service worker that orchestrates capture
- **`content-script.js`**: Runs on Instagram pages to control scrolling and detect page state
- **`offscreen.html` + `offscreen.js`**: Offscreen document for image stitching
- **`README.md`**: This file

### Communication Flow

1. **Web App → Extension**: User clicks "Capture Snapshot" → Web app sends `IGMETRYX_START_CAPTURE` message
2. **Extension → Content Script**: Service worker injects content script and sends scroll commands
3. **Extension → Tab API**: Service worker captures screenshots via `chrome.tabs.captureVisibleTab`
4. **Extension → Offscreen**: Frames are sent to offscreen document for stitching
5. **Extension → Web App**: Final PNG data URL is sent back via `IGMETRYX_CAPTURE_PROGRESS` messages

### Capture Process

1. Verify tab is Instagram and profile is public
2. Scroll to top of page
3. Loop:
   - Wait for images to load
   - Capture screenshot
   - Check for duplicates (end detection)
   - Scroll down by viewport height minus overlap
   - Repeat until bottom reached or duplicate frames detected
4. Stitch all frames together with overlap detection
5. Return final PNG to web app

## Development

### Testing

1. Load the extension as unpacked (see Installation)
2. Open the web app in a browser tab
3. Open an Instagram profile feed in another tab
4. Use the web app to trigger capture
5. Check browser console for any errors

### Building for Production

Currently, the extension is JavaScript-based and ready to use. For production distribution:

1. Ensure all code is minified (optional but recommended)
2. Create extension icons (16px, 48px, 128px) - see `manifest.json`
3. Package the extension folder as a ZIP
4. Submit to Chrome Web Store (if distributing publicly)

## Limitations

- **Public profiles only**: Cannot capture private Instagram profiles
- **Desktop browsers only**: Mobile browsers don't support required APIs
- **Chrome/Chromium only**: Firefox and Safari have different extension APIs
- **Large feeds may take time**: Very long feeds may take several minutes to capture
- **Memory limits**: Extremely long feeds (500+ frames) may exceed browser memory limits

## Privacy & Security

- ✅ No data is sent to remote servers
- ✅ All processing happens locally in your browser
- ✅ Extension only runs when you actively start a capture
- ✅ No login credentials or personal data is collected
- ✅ Compliant with Instagram Terms of Service (client-side only, public profiles)

## Troubleshooting

### Extension not detected

- Ensure extension is installed and enabled
- Check that you're using Chrome or Chromium-based browser
- Refresh the web app page after installing extension
- Check browser console for error messages

### Capture fails

- Ensure you're on an Instagram profile page (not post detail)
- Verify the profile is public (private profiles cannot be captured)
- Check browser console for error messages
- Try refreshing the Instagram page and retrying

### Stitching errors

- Very long feeds may exceed memory limits
- Try capturing a smaller section of the feed
- Check browser console for memory errors

## License

See main repository LICENSE file.

## Support

For issues or questions, please open an issue in the main repository.



