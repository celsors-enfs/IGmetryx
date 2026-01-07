# Feed Analyzer QA Checklist

## Pre-Testing Setup
- [ ] Server running: `npm run dev:api`
- [ ] Frontend running: `npm run dev`
- [ ] DEEPSEEK_API_KEY configured in `.env.local` (optional, will use fallback if not set)

## Core Functionality

### Image Upload
- [ ] Upload 9 images → accepts and shows previews
- [ ] Upload 12 images → accepts and shows previews
- [ ] Upload 15 images → accepts and shows previews
- [ ] Upload < 9 images → shows error message
- [ ] Upload > 15 images → shows error message
- [ ] Drag and drop works
- [ ] Click to upload works
- [ ] Remove individual images works
- [ ] Image previews display correctly

### Analysis Flow
- [ ] Click "Analyze Feed" → shows progress bar
- [ ] Progress bar updates (0% → 100%)
- [ ] Status messages update (uploading → processing → finalizing)
- [ ] Cancel button appears during analysis
- [ ] Cancel button stops analysis
- [ ] Results appear when complete
- [ ] Page scrolls to top when results appear

### Results Display
- [ ] Feed score displays (0-100)
- [ ] Score label displays (Excellent/Good/Fair/Needs Improvement)
- [ ] All 5 breakdown items show (with scores 0-10)
- [ ] Breakdown explanations display
- [ ] 3-5 insights display
- [ ] Exactly 3 recommendations display (no duplicates)
- [ ] Next post guidance displays
- [ ] Disclaimer displays at bottom
- [ ] "Analyze Another Feed" button works
- [ ] "Analyze Another Feed" scrolls to top

## Error Handling

### Network Errors
- [ ] Server not running → shows network error message
- [ ] Internet disconnected → shows network error message
- [ ] Error message is localized (test all languages)

### Timeout Errors
- [ ] Analysis takes too long → shows timeout message
- [ ] Timeout message is localized

### Rate Limit Errors
- [ ] Rate limit hit → shows rate limit message
- [ ] Message suggests retry

### Service Errors
- [ ] Service unavailable → shows unavailable message
- [ ] Fallback analysis works if provider fails

### Large Images
- [ ] Very large images → compressed automatically
- [ ] Compression doesn't break analysis
- [ ] Shows "too large" error if compression fails

## Internationalization

### English (EN)
- [ ] All UI text in English
- [ ] All error messages in English
- [ ] No other languages visible

### Spanish (ES)
- [ ] Switch to ES → all text in Spanish
- [ ] Error messages in Spanish
- [ ] Results in Spanish

### Portuguese (PT-BR)
- [ ] Switch to PT-BR → all text in Portuguese
- [ ] Error messages in Portuguese
- [ ] Results in Portuguese

### French (FR)
- [ ] Switch to FR → all text in French
- [ ] Error messages in French
- [ ] Results in French

## Edge Cases

### Image Count Variations
- [ ] 9 images → analysis completes
- [ ] 12 images → analysis completes
- [ ] 15 images → analysis completes (analyzes first 12 internally)
- [ ] Mixed image sizes → handles correctly
- [ ] Very small images → handles correctly
- [ ] Very large images → compresses correctly

### Content Type & Vibe
- [ ] Select content type → included in analysis
- [ ] Select desired vibe → included in analysis
- [ ] Leave both empty → analysis still works
- [ ] Change selections → updates correctly

### Multiple Analyses
- [ ] Analyze feed A → get results
- [ ] Click "Analyze Another Feed" → resets form
- [ ] Upload new images → works correctly
- [ ] Analyze feed B → get different results

## Performance

### Speed
- [ ] 9 images → completes in reasonable time (< 60s)
- [ ] 12 images → completes in reasonable time (< 90s)
- [ ] 15 images → completes in reasonable time (< 120s)
- [ ] Progress updates smoothly

### Resource Usage
- [ ] Large images compressed before upload
- [ ] Server doesn't crash with many images
- [ ] Memory usage reasonable

## UI/UX

### Visual Design
- [ ] Progress bar visible and updates
- [ ] Status messages clear and readable
- [ ] Error messages prominent but not alarming
- [ ] Results well-formatted
- [ ] Mobile responsive

### Interactions
- [ ] Hover states work on buttons
- [ ] Cursor changes to pointer on clickable elements
- [ ] Loading states clear
- [ ] Transitions smooth

## Regression Tests

### Legacy Endpoint
- [ ] Old endpoint `/api/feed/analyze` still works (if needed)
- [ ] New endpoint `/api/feed-analyzer/start` works

### Other Features
- [ ] Profile Analyzer still works
- [ ] Caption Generator still works
- [ ] Bio Generator still works
- [ ] Reel Cover Generator still works
- [ ] Navigation still works
- [ ] Language switching still works

## Browser Compatibility
- [ ] Chrome/Edge → all features work
- [ ] Firefox → all features work
- [ ] Safari → all features work
- [ ] Mobile Safari → all features work
- [ ] Mobile Chrome → all features work

## Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible (basic)
- [ ] Color contrast sufficient
- [ ] Error messages accessible

## Final Checks
- [ ] No console errors
- [ ] No network errors (except intentional tests)
- [ ] No broken images
- [ ] All translations complete
- [ ] No English leaking in non-English modes
- [ ] No mentions of "AI", "model", "prompt", or provider names in UI


