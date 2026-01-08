# Adsterra Ad Integration Refactor

## Summary

Complete refactor of Adsterra ad integration to a centralized, reliable system with proper script management, route handling, and debug capabilities.

## Files Changed

### New Files Created:
1. **`src/ads/adsterra.ts`** - Core utilities for script loading, slot management, and debug mode
2. **`src/ads/AdsterraProvider.tsx`** - Centralized provider for route change handling
3. **`src/ads/AdSlot.tsx`** - Unified ad component for all ad types
4. **`src/ads/AdSlot.css`** - Dedicated CSS for ad slots (prevents cropping, ensures visibility)

### Modified Files:
1. **`src/App.tsx`** - Wrapped with AdsterraProvider, replaced old ad components with AdSlot
2. **`index.html`** - Removed native ad script (now handled by AdSlot)
3. **All page files** (`HomePage.tsx`, `InstagramHubPage.tsx`, `ProfileAnalyzerPage.tsx`, etc.) - Replaced `AdBanner*` components with `<AdSlot type="..." />`

### Old Files (No Longer Used):
- `src/components/AdBanner160x600.tsx`
- `src/components/AdBanner728x90.tsx`
- `src/components/AdBanner468x60.tsx`
- `src/components/AdSidebar.tsx`

These are kept for reference but are no longer imported anywhere.

## Key Improvements

### 1. Centralized Script Loading
- **Before**: Each component loaded its own script independently, causing duplicates
- **After**: Single `loadScriptOnce()` function prevents duplicate script injection
- Scripts are tracked globally and loaded only once per ad key

### 2. Route Change Handling
- **Before**: Ads would disappear on SPA navigation
- **After**: `AdsterraProvider` listens to route changes and refreshes slots automatically
- 500ms delay after route change ensures DOM is settled before refresh

### 3. Unified Ad Component
- **Before**: Separate components for each ad type with inconsistent logic
- **After**: Single `<AdSlot>` component handles all ad types:
  - `banner-160x600` (left sidebar)
  - `banner-728x90` (between sections)
  - `banner-468x60` (between sections)
  - `native` (right sidebar)

### 4. Visibility & Cropping Fixes
- **Before**: Ads could be cropped by parent containers, inconsistent visibility
- **After**: 
  - `overflow: visible` on all ad containers
  - Exact dimensions enforced (no shrinking)
  - `flex-shrink: 0` prevents flex containers from compressing ads
  - Position-specific styles for sidebars

### 5. Debug Mode
- **Before**: No way to diagnose ad loading issues
- **After**: Add `?adsDebug=1` to URL to see:
  - Script loading status
  - Slot request status
  - Iframe detection
  - Retry counts
  - Error messages
  - Visual badges on each slot

### 6. Retry Logic
- **Before**: Single attempt, no retries
- **After**: Bounded retries (2 attempts) with 1s delay
- Uses `retrySlot()` utility for consistent retry behavior

### 7. Intersection Observer
- **Before**: All ads loaded immediately
- **After**: Optional lazy loading for below-the-fold ads
- Uses native IntersectionObserver (no dependencies)

## Ad Placements

### Left Sidebar (Desktop Only)
```tsx
<AdSlot type="banner-160x600" position="left" />
```
- Fixed position: left 20px, top 100px
- Dimensions: 160x600px
- Hidden on mobile/tablet (≤1024px)

### Right Sidebar (Desktop Only)
```tsx
<AdSlot type="native" position="right" />
```
- Fixed position: right 20px, top 100px
- Dimensions: 200x200px (square ads)
- Max 2 ads, scrollable container
- Hidden on mobile/tablet (≤1024px)

### Between Sections
```tsx
<AdSlot type="banner-728x90" />
<AdSlot type="banner-468x60" />
```
- Centered, full-width containers
- Responsive on mobile (scales to 100% width)
- Appears between content sections (not in header/footer)

## Testing Steps

### Local Development
```bash
npm install
npm run dev
```

1. Open `http://localhost:5173`
2. Check browser console for ad loading logs (if `?adsDebug=1`)
3. Navigate between pages (SPA navigation)
4. Verify ads appear in correct positions
5. Check for no cropping (especially 160x600 sidebar)

### Production Build
```bash
npm run build
npm run preview
```

1. Test with production build
2. Verify script loads only once (check Network tab)
3. Test on different screen sizes:
   - Desktop (>1024px): Sidebars visible
   - Tablet (768-1024px): Sidebars hidden
   - Mobile (<768px): Only between-section ads visible

### Chrome DevTools Verification
1. Open DevTools → Network tab
2. Filter by "topcreativeformat" or "effectivegatecpm"
3. Verify each script loads only once
4. Check for no 404s or failed requests

### Safari Testing
1. Test on Safari (macOS/iOS)
2. Verify ads render correctly
3. Check for no console errors

### Debug Mode Testing
1. Add `?adsDebug=1` to URL
2. Check console for detailed logs
3. Visual badges should appear on each ad slot showing:
   - Status (idle/loading/loaded/failed)
   - Retry count
   - Iframe detection
   - Errors (if any)

## Verification Checklist

- [ ] Scripts load only once (check Network tab)
- [ ] Ads appear in correct positions:
  - [ ] 160x600 in left sidebar (desktop)
  - [ ] Native ads in right sidebar (desktop)
  - [ ] 728x90 between sections
  - [ ] 468x60 between sections
- [ ] No cropping:
  - [ ] 160x600 fully visible (not cut off)
  - [ ] Banners display at full size
  - [ ] Native ads show complete images
- [ ] SPA navigation works:
  - [ ] Navigate between pages
  - [ ] Ads refresh/reload correctly
  - [ ] No blank placeholders
- [ ] Mobile responsive:
  - [ ] Sidebars hidden on mobile
  - [ ] Banners scale to 100% width
  - [ ] No layout breaks
- [ ] Debug mode works:
  - [ ] `?adsDebug=1` shows badges
  - [ ] Console logs appear
  - [ ] Status information accurate

## If Still Failing, Check These 3 Things

1. **Script Loading**
   - Open DevTools → Network tab
   - Filter by "topcreativeformat" or "effectivegatecpm"
   - Verify scripts load (status 200)
   - Check for CORS errors or blocked requests
   - Try disabling ad blockers temporarily

2. **Container Visibility**
   - Add `?adsDebug=1` to URL
   - Check visual badges on slots
   - Look for "failed" status or error messages
   - Verify containers exist in DOM (Elements tab)
   - Check for CSS conflicts (overflow: hidden, display: none)

3. **Adsterra Account**
   - Verify ads are approved in Adsterra dashboard
   - Check ad keys match exactly (case-sensitive)
   - Ensure ad units are active
   - Test with different ad keys if available

## Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Build
npm run build

# Preview production build
npm run preview

# Type check
tsc -b

# Lint
npm run lint
```

## Architecture

```
src/ads/
├── adsterra.ts          # Core utilities (script loading, configs, helpers)
├── AdsterraProvider.tsx # Route change handler, SPA navigation
├── AdSlot.tsx           # Unified ad component
└── AdSlot.css           # Ad-specific styles (no cropping, visibility)

src/App.tsx              # Wraps app with AdsterraProvider
src/pages/*.tsx          # Use <AdSlot type="..." /> instead of old components
```

## Migration Notes

- Old components (`AdBanner*`, `AdSidebar`) are no longer used but kept for reference
- All ad placements now use `<AdSlot>` component
- Native ad script moved from `index.html` to `AdSlot` component
- CSS consolidated into `AdSlot.css` for better maintainability

