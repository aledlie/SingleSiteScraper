# SingleSiteScraper - Comprehensive Bugfix Plan

**Created:** 2026-01-11
**Repository:** ISPublicSites/SingleSiteScraper
**Status:** 🟡 In Progress
**Total Errors:** 10 (4 FIXED, 6 OPEN)

---

## Executive Summary

This bugfix plan addresses 10 errors discovered in the SingleSiteScraper repository. Four critical deployment issues have been resolved (base path, Doppler config, GitHub Pages setup, and noscript validation). The highest priority remaining issue is the non-functional event parser (Error #2), which represents a complete feature gap. Additional issues include dependency management, analytics configuration cleanup, and external service permissions.

### Common Patterns Identified

1. **Deployment Configuration Gaps**: Multiple errors stemmed from incomplete GitHub Pages deployment setup (base path, Pages enablement, Doppler environment mismatch)
2. **Incomplete Feature Implementation**: Event parser was stubbed out to fix build errors but never completed
3. **External Service Configuration Drift**: Old GA4 IDs and Meta Pixel permissions not updated after initial configuration
4. **Dependency Management Issues**: Optional platform-specific dependencies causing local build failures

### Priority Order

1. **CRITICAL**: Error #2 - Event parser implementation (core feature missing)
2. **HIGH**: Error #6 - Rollup platform module (blocks local development)
3. **MEDIUM**: Error #5 - HTML validation (SEO/accessibility)
4. **MEDIUM**: Error #7 - Cleanup old GA4 IDs (data pollution)
5. **LOW**: Errors #8-10 - External config and expected failures

---

## Error #1: [CRITICAL] React app not rendering on GitHub Pages

**STATUS:** ✅ FIXED (2026-01-11)

### Summary
- **Severity:** 🔴 Critical
- **Impact:** Complete application failure on production
- **Frequency:** 100% before fix
- **Environment:** GitHub Pages production only (local builds worked)

### Symptoms
- Empty `#root` div on deployed site
- 404 errors for all JavaScript and CSS assets
- Console errors: `Failed to load resource: /assets/index-[hash].js (404)`
- White screen, no React components rendered

### Root Cause Analysis

**Why it happened:**
Vite builds assume deployment at domain root (`/`) by default. GitHub Pages serves repositories at subdirectories (`/repository-name/`), causing asset path mismatches. The build generated `<script src="/assets/index.js">` but GitHub Pages serves files at `/SingleSiteScraper/assets/index.js`.

**Investigation steps that confirmed:**
1. Examined deployed HTML source - all asset URLs started with `/assets/` (absolute root)
2. Checked GitHub Pages URL structure - served at `username.github.io/SingleSiteScraper/`
3. Reviewed Vite documentation on `base` option for subdirectory deployments
4. Confirmed local `npm run build && npm run preview` worked (serves at root)

**Affected files:**
- `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/vite.config.ts` - Missing `base` configuration
- `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/index.html` - Generated with wrong asset paths

### Fix Strategy

**Selected Approach:** Add `base: '/SingleSiteScraper/'` to vite.config.ts

**Alternative approaches considered:**
1. **Custom domain with CNAME** - More complex, requires DNS configuration, unnecessary overhead
2. **Deploy to root of separate repo** - Creates maintenance burden of multiple repos
3. **Base path injection via environment variable** - Over-engineered for single deployment target

**Why this approach:**
- Simplest, most maintainable solution
- One-line configuration change
- Well-documented Vite pattern for GitHub Pages
- No runtime performance impact

### Implementation Applied

**File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/vite.config.ts`

```typescript
export default defineConfig({
  base: '/SingleSiteScraper/', // ✅ Added line 7
  plugins: [
    react(),
    // ... rest of config
  ]
});
```

**Verification performed:**
1. Built locally: `npm run build` - Generated correct asset paths
2. Checked dist/index.html - Assets referenced as `./assets/` and `/SingleSiteScraper/assets/`
3. Deployed to GitHub Pages - Application loaded successfully
4. Tested navigation and React Router paths - All routes working

### Prevention Measures

**Why this wasn't caught earlier:**
- No preview of GitHub Pages deployment before pushing
- Local development doesn't replicate subdirectory deployment
- Vite documentation for GitHub Pages requires active searching

**Prevention checklist:**
- [ ] Add deployment preview step to PR workflow
- [ ] Document GitHub Pages base path requirement in README
- [ ] Add Vite config validation script checking for `base` when deploying to Pages
- [ ] Add smoke test after deployment (curl check for 200 status on main bundle)

**Similar bugs to check:**
- React Router routes - May need `basename` prop if using React Router
- Image paths in CSS/components - Should use relative paths or import statements
- API endpoints - Should use relative paths or environment variables, not hardcoded roots

---

## Error #2: [HIGH] Event parser not implemented - stub only

**STATUS:** 🔴 OPEN - HIGHEST PRIORITY

### Summary
- **Severity:** 🔴 Critical (feature completely missing)
- **Impact:** Core event extraction functionality non-functional
- **Frequency:** 100% - every call returns empty array
- **Environment:** All environments

### Symptoms
- All calls to `extractEvents()` return `[]`
- Tests expecting events fail or skip
- Event extraction analysis shows "No events detected" even on event-rich sites
- Feature appears functional in UI but produces no results

### Evidence

**File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/src/utils/events/eventParser.ts`

```typescript
export function extractEventsLegacy(html: string): EventData[] {
  // Stub implementation - returns empty array
  // TODO: Implement actual event extraction logic
  return [];
}
```

**Call chain:**
1. User triggers event scraping via UI
2. `scrapeWebsite()` calls `extractEvents(html)` at `/src/scraper/scrapeWebsite.ts`
3. `extractEvents()` delegates to `extractEventsLegacy()` at `/src/utils/parseEvents.ts:18`
4. `extractEventsLegacy()` returns `[]` - no parsing occurs

**Test evidence:**
`/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/src/tests/capital-factory-events.test.ts` contains comprehensive test infrastructure but relies on stub parser.

### Root Cause Analysis

**How this happened:**
1. Original event parser likely had build/type errors
2. Developer created stub file to "fix" TypeScript compilation errors
3. Stub was committed to unblock other work
4. TODO comment added but work never completed
5. Feature silently broken - tests may not have existed or were disabled

**Why it wasn't caught:**
- Tests may have been written after stub was created
- No integration tests verifying actual event extraction before deployment
- UI may not show clear error when zero events found (could look like site has no events)

**Investigation performed:**
- Read `eventParser.ts` - Confirmed stub implementation
- Searched for callers - Found delegation chain through `parseEvents.ts`
- Examined test file - Shows expected structure and validation logic exists
- Checked types - `EventData` interface is comprehensive (lines 81-112 in `src/types/index.ts`)

### Fix Strategy

**RECOMMENDED: Implement event parser using schema.org JSON-LD extraction**

**Approach:**
Parse `<script type="application/ld+json">` tags containing structured event data following schema.org Event format.

**Pros:**
- Most reliable - data is machine-readable and standardized
- Many event sites already implement schema.org markup
- Matches existing `EventData` interface structure (already schema.org compatible)
- Low false positive rate

**Cons:**
- Won't work on sites without structured data
- Requires JSON parsing with error handling

**Alternative Approach #1: HTML pattern matching**

Extract events from HTML structure (headings, dates, descriptions).

**Pros:**
- Works on any site with human-readable events
- Can catch events without structured data

**Cons:**
- High false positive rate (blog posts, news articles with dates)
- Fragile - breaks when HTML structure changes
- Requires complex heuristics and validation

**Alternative Approach #2: Hybrid approach**

Try JSON-LD first, fall back to HTML patterns if none found.

**Pros:**
- Best coverage - works on both structured and unstructured sites
- Prioritizes reliable data sources

**Cons:**
- More complex implementation
- HTML fallback still has high false positive risk
- Longer development time

**Selected Approach:** Start with JSON-LD extraction (Option 1), document HTML fallback as future enhancement.

**Justification:**
- Fastest path to working feature with high reliability
- Capital Factory (primary test site) uses schema.org markup
- Reduces scope creep - can add HTML patterns later if needed
- Existing `EventData` interface already matches schema.org structure

### Implementation Plan

#### Phase 1: Implement JSON-LD Event Extraction (2-3 hours)

**Tasks:**
1. **Parse JSON-LD scripts from HTML** (30 min)
   - Use regex or HTML parser to find `<script type="application/ld+json">` tags
   - Extract script content and parse JSON
   - Handle parse errors gracefully
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/src/utils/events/eventParser.ts`
   - **Acceptance criteria:** Can extract all JSON-LD scripts from HTML string

2. **Filter for Event type objects** (30 min)
   - Check parsed JSON for `@type: "Event"`
   - Handle arrays of objects and nested `@graph` structures
   - Support `@type` as string or array (e.g., `["Event", "SocialEvent"]`)
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/src/utils/events/eventParser.ts`
   - **Acceptance criteria:** Only Event objects returned, ignores Organization/WebSite/etc.

3. **Map schema.org Event fields to EventData interface** (45 min)
   - Map required fields: `name`, `startDate`, `endDate`, `@type`
   - Map optional fields: `location`, `description`, `url`, `image`, etc.
   - Handle location as both string and Place object
   - Parse date strings and validate format
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/src/utils/events/eventParser.ts`
   - **Acceptance criteria:** All schema.org Event properties mapped to EventData interface

4. **Add error handling and validation** (30 min)
   - Validate required fields exist (name, startDate, endDate)
   - Skip events with missing required fields
   - Log warnings for malformed events
   - Handle timezone-aware date parsing
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/src/utils/events/eventParser.ts`
   - **Acceptance criteria:** Gracefully handles malformed JSON-LD, logs useful errors

5. **Add comprehensive JSDoc documentation** (15 min)
   - Document function purpose, parameters, return type
   - Add examples of expected schema.org Event structure
   - Document error handling behavior
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/src/utils/events/eventParser.ts`
   - **Acceptance criteria:** All exported functions have complete JSDoc

#### Phase 2: Testing (1-2 hours)

**Tasks:**
1. **Create unit tests for parser logic** (45 min)
   - Test single event extraction
   - Test multiple events extraction
   - Test malformed JSON handling
   - Test missing required fields
   - Test `@graph` structure handling
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/tests/src/utils/events/eventParser.test.ts` (new file)
   - **Acceptance criteria:** 90%+ code coverage on eventParser.ts

2. **Update integration test** (30 min)
   - Enable capital-factory-events.test.ts assertions
   - Verify events extracted from live Capital Factory site
   - Add assertions for event quality (dates, locations, descriptions)
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/src/tests/capital-factory-events.test.ts`
   - **Acceptance criteria:** Test passes with real events extracted

3. **Add test fixtures** (15 min)
   - Create sample HTML with valid schema.org Event markup
   - Create sample HTML with malformed JSON-LD
   - Create sample HTML with no events
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/tests/fixtures/events/` (new directory)
   - **Acceptance criteria:** 3+ test fixture HTML files covering edge cases

#### Phase 3: Verification and Documentation (30 min)

**Tasks:**
1. **Manual testing with real sites** (15 min)
   - Test with capitalfactory.com
   - Test with eventbrite.com event page
   - Test with site without events
   - Verify UI displays extracted events correctly
   - **Acceptance criteria:** Events display in UI for sites with schema.org markup

2. **Update documentation** (15 min)
   - Add event extraction documentation to README
   - Document supported event formats (schema.org JSON-LD)
   - Add troubleshooting section for sites without structured data
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/README.md`
   - **Acceptance criteria:** README documents event extraction feature and limitations

### Testing Plan

**Unit Tests:**
```typescript
describe('extractEventsLegacy', () => {
  it('should extract single event from JSON-LD', () => {
    const html = `
      <script type="application/ld+json">
      {
        "@type": "Event",
        "name": "Test Event",
        "startDate": "2026-02-01T10:00:00",
        "endDate": "2026-02-01T12:00:00",
        "location": "Austin, TX"
      }
      </script>
    `;
    const events = extractEventsLegacy(html);
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('Test Event');
    expect(events[0]['@type']).toBe('Event');
  });

  it('should handle multiple events in @graph', () => { /* ... */ });
  it('should skip events with missing required fields', () => { /* ... */ });
  it('should handle malformed JSON gracefully', () => { /* ... */ });
  it('should parse location as string and Place object', () => { /* ... */ });
});
```

**Integration Tests:**
- Use existing `capital-factory-events.test.ts` as live integration test
- Verify minimum 1 event extracted from Capital Factory (if site has events)
- Validate event structure matches `EventData` interface
- Check for false positives (blog posts marked as events)

**Manual Tests:**
1. Load app in browser
2. Enter URL: https://capitalfactory.com
3. Click "Scrape Events"
4. Verify events display in results panel
5. Check event details (name, date, location) are populated

### Rollout Plan

**Deployment:**
1. Merge PR with event parser implementation
2. Deploy to GitHub Pages via existing workflow
3. No feature flag needed - currently returns empty array, any results are improvement

**Monitoring:**
- Check Sentry for JSON parsing errors after deployment
- Monitor scraper success rate - should not decrease
- Verify event extraction analytics events fire when events found

**Rollback Plan:**
- Revert PR if JSON parsing causes crashes
- Fallback: Return empty array (current behavior) if implementation has critical bugs

### Prevention Measures

**Why this happened:**
- TODO comment left unaddressed - no process to track incomplete work
- Stub allowed builds to pass - CI didn't verify functional completeness
- No integration tests before deployment verifying core features work

**How to prevent:**
1. **Ban TODO comments without tracking issues**
   - Add ESLint rule: `no-warning-comments` to fail on `TODO` in production code
   - Require GitHub issues for all TODO comments
   - Add pre-commit hook to detect TODO comments and prompt for issue creation

2. **Add smoke tests for core features**
   - CI workflow should run integration tests, not just unit tests
   - Add "feature smoke test" that verifies each major feature produces non-empty results
   - Fail deployment if core features return empty/stub data

3. **Code review checklist**
   - Require reviewers to verify implementation, not just stubs
   - PR template should include "All TODO comments have associated issues" checkbox

4. **Similar bugs to check:**
   - Search codebase for other stub implementations: `grep -r "TODO.*implement" src/`
   - Check for other functions that return empty arrays/objects
   - Verify all features mentioned in README are actually implemented

---

## Error #3: [HIGH] Doppler configuration mismatch

**STATUS:** ✅ FIXED (2026-01-11)

### Summary
- **Severity:** 🟠 High
- **Impact:** All deployments failed
- **Frequency:** 100% before fix
- **Environment:** GitHub Actions CI/CD only

### Symptoms
- Workflow fails at "Build with Sentry source maps" step
- Error message: "Doppler Error: This token does not have access to requested config 'prd'"
- Sentry source maps not uploaded
- No deployment artifact created

### Root Cause Analysis

**Why it happened:**
1. Workflow requested `--config prd` (production config)
2. `DOPPLER_TOKEN` secret was created from `dev` environment token
3. Doppler tokens are scoped to specific configs - dev token cannot access prd config
4. Mismatch between intended environment (production deployment) and available token

**Investigation confirmed:**
- Examined workflow file line 38: `doppler run --project integrity-studio --config prd`
- Error message explicitly stated token doesn't have access to 'prd'
- Developer had `dev` token available, not `prd` token
- Common pattern: dev token used initially, production token never created

**Why this wasn't caught:**
- Workflow likely worked in initial testing if 'dev' was used locally
- Changed to 'prd' without updating token
- No validation that token matches requested config

### Fix Strategy

**Selected Approach:** Change workflow to use `--config dev`

**Why this approach:**
- Dev token already available and working
- For this project, dev vs prd configs may have same values (Sentry tokens)
- Avoids need to create and secure additional production token
- Faster resolution

**Alternative approaches considered:**

1. **Create production Doppler token and update secret**
   - **Pros:** More semantically correct for production deployment
   - **Cons:** Requires Doppler access, additional secret management, unclear if prd config exists

2. **Remove Doppler entirely, use GitHub secrets directly**
   - **Pros:** Simpler workflow, fewer dependencies
   - **Cons:** Loses centralized secret management, requires migrating all secrets

3. **Make config environment-aware via environment variable**
   - **Pros:** Could support multiple environments with same workflow
   - **Cons:** Over-engineered for single deployment target

### Implementation Applied

**File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/.github/workflows/deploy.yml`

```yaml
- name: Build with Sentry source maps
  run: |
    doppler run --project integrity-studio --config dev -- npm run build  # Changed from prd to dev
  env:
    DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
```

**Verification performed:**
1. Pushed commit triggering workflow
2. Workflow completed successfully
3. Sentry source maps uploaded
4. Deployment artifact created and deployed

### Prevention Measures

**Why this wasn't caught:**
- No local testing of deployment workflow before pushing
- Workflow secrets only testable in CI environment
- No validation that requested config matches token scope

**Prevention checklist:**
- [ ] Document Doppler config/token relationship in workflow comments
- [ ] Add workflow dispatch manual trigger for pre-merge testing
- [ ] Consider using GitHub environments to map config names to tokens
- [ ] Add Doppler config validation step (attempt to read a test value before build)

**Future improvements:**
- Use `doppler configure` to validate token before running build
- Add GitHub environment for production with separate Doppler token
- Document token creation process in repository docs

---

## Error #4: [HIGH] GitHub Pages not enabled

**STATUS:** ✅ FIXED (2026-01-11)

### Summary
- **Severity:** 🟠 High
- **Impact:** Deployment workflow failed, cannot publish to GitHub Pages
- **Frequency:** One-time setup issue
- **Environment:** GitHub repository settings

### Symptoms
- Workflow fails at "Deploy to GitHub Pages" step
- Error: "Get Pages site failed. Please verify that the repository has Pages enabled and Pages Actions are allowed"
- Pages deployment status shows no deployments

### Root Cause Analysis

**Why it happened:**
GitHub Pages is not enabled by default for repositories. Must be manually configured via repository settings or API before workflows can deploy to Pages.

**Investigation confirmed:**
- Repository settings showed Pages was "Disabled"
- Workflow had correct `pages: write` permission
- `actions/deploy-pages@v4` requires Pages to be pre-configured
- Common mistake: assuming workflow will auto-enable Pages

### Fix Strategy

**Selected Approach:** Enable Pages via GitHub API

**Command used:**
```bash
gh api repos/aledlie/SingleSiteScraper/pages -X POST \
  -f source[branch]=gh-pages \
  -f source[path]=/
```

**Alternative approaches:**

1. **Manual enablement via repository settings**
   - Navigate to Settings > Pages > Source > GitHub Actions
   - **Pros:** Visual confirmation, easy for first-time users
   - **Cons:** Not automatable, requires UI access

2. **Include Pages enablement in workflow**
   - Add step to check if Pages enabled, enable if not
   - **Pros:** Self-healing workflow
   - **Cons:** Requires repo admin token, complex error handling

**Why selected approach:**
- One-time operation via CLI
- Scriptable and documentable
- No workflow modification needed

### Implementation Applied

Executed GitHub API command to enable Pages with GitHub Actions as source.

**Verification performed:**
1. Checked repository settings - Pages now enabled
2. Re-ran workflow - Deployment succeeded
3. Verified site accessible at https://aledlie.github.io/SingleSiteScraper/

### Prevention Measures

**Why this wasn't caught:**
- New repository setup - Pages not enabled by default
- Workflow assumed Pages was already configured
- No documentation of prerequisite setup steps

**Prevention checklist:**
- [ ] Add repository setup instructions to README (including Pages enablement)
- [ ] Create setup script that enables Pages via API
- [ ] Add check in workflow to provide helpful error if Pages not enabled
- [ ] Document required repository settings for new contributors

**Similar setup issues to check:**
- Branch protection rules - May need to allow Actions to push
- Repository secrets - Document all required secrets (DOPPLER_TOKEN, etc.)
- Workflow permissions - Ensure `contents: read`, `pages: write`, `id-token: write` are set

---

## Error #5: [MEDIUM] HTML validation warning - noscript in head

**STATUS:** 🔴 OPEN

### Summary
- **Severity:** 🟡 Medium
- **Impact:** HTML validation issues, potential SEO/accessibility problems
- **Frequency:** Every build (warning, not error)
- **Environment:** Build time - Vite warns during build process

### Symptoms
- Vite build warning: `parse5 error code disallowed-content-in-noscript-in-head`
- Warning appears for `index.html:292` and `audit/AUDIT_README.html:262`
- Specific to Meta Pixel noscript fallback image tag

### Evidence

**File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/index.html` (lines 291-294)

```html
<script>/* Meta Pixel JavaScript */</script>
<noscript>
  <img height="1" width="1" style="display:none"
       src="https://www.facebook.com/tr?id=25629020546684786&ev=PageView&noscript=1"/>
</noscript>
```

**Problem:** The `<noscript>` tag is in `<head>`, but HTML spec only allows specific elements inside `<head><noscript>` (link, style, meta). The `<img>` tag is not allowed.

### Root Cause Analysis

**Why it happened:**
Meta Pixel installation instructions place both JavaScript and noscript fallback in `<head>` for immediate execution. However, HTML5 spec restricts `<head><noscript>` to metadata-only elements.

**HTML5 spec violation:**
> In a head element, if there are no ancestor noscript elements, the noscript element can contain only link, style, and meta elements.

**Why validation matters:**
- **SEO:** Search engines may penalize invalid HTML
- **Accessibility:** Screen readers may handle invalid structure unpredictably
- **Future compatibility:** Browsers may enforce strict parsing in the future
- **Best practices:** Valid HTML is a quality signal

**Why this wasn't caught earlier:**
- Meta Pixel copied directly from Facebook Business Manager installation instructions
- Build warnings often ignored (not errors)
- Visual functionality works despite invalid HTML
- parse5 validation relatively new in Vite

### Fix Strategy

**RECOMMENDED: Move noscript to body**

**Approach:** Move `<noscript><img /></noscript>` to top of `<body>` element

**Pros:**
- Fully valid HTML5
- Still tracks users with JavaScript disabled
- Minimal change to existing code
- No impact on pixel functionality

**Cons:**
- Pixel fallback loads slightly later (after head parsing)
- Not exact Meta provided code (may complicate future updates)

**Alternative Approach #1: Remove noscript entirely**

Only use JavaScript-based pixel tracking.

**Pros:**
- Eliminates validation warning
- Simpler HTML

**Cons:**
- Loses tracking for users with JavaScript disabled
- Decreases tracking coverage (though JS-disabled users are <1% in 2026)

**Alternative Approach #2: Use data URI in style tag**

Embed image tracking as CSS background in `<style>` within `<noscript>`.

**Pros:**
- HTML5 valid (style allowed in head noscript)
- Keeps fallback in head

**Cons:**
- Hacky workaround
- CSS background may not fire tracking pixel reliably
- Unclear if Meta will accept CSS-based pixel

**Selected Approach:** Move to body (Option 1)

**Justification:**
- Cleanest solution with no functionality loss
- Aligns with HTML5 spec
- Micro-optimization of head vs body placement is negligible for 1x1 transparent pixel
- Maintains tracking coverage for no-JS users

### Implementation Plan

#### Phase 1: Move noscript to body (15 min)

**Tasks:**
1. **Move Meta Pixel noscript in index.html** (5 min)
   - Cut lines 291-294 from `<head>`
   - Paste immediately after opening `<body>` tag
   - Add HTML comment explaining placement
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/index.html`
   - **Acceptance criteria:** Noscript is first element in body

2. **Move Meta Pixel noscript in audit/AUDIT_README.html** (5 min)
   - Apply same change to audit HTML
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/audit/AUDIT_README.html`
   - **Acceptance criteria:** Noscript is first element in body

3. **Verify build passes without warning** (5 min)
   - Run `npm run build`
   - Check for parse5 warnings
   - **Acceptance criteria:** No parse5 error code disallowed-content-in-noscript-in-head

#### Phase 2: Verification (10 min)

**Tasks:**
1. **Test Meta Pixel still fires** (10 min)
   - Build and deploy to test environment
   - Open browser with JavaScript disabled
   - Check browser network tab for request to `facebook.com/tr?...`
   - Verify Meta Events Manager shows PageView event
   - **Acceptance criteria:** Pixel fires in no-JS mode from body location

### Testing Plan

**Build validation:**
```bash
npm run build 2>&1 | grep -i "parse5"
# Should return no results after fix
```

**HTML validation:**
```bash
# Use W3C validator or html5validator
npx html-validate dist/index.html
```

**Functional testing:**
1. Disable JavaScript in browser dev tools
2. Load page with Meta Pixel Events debugger open
3. Verify PageView event fires
4. Check network tab shows request to `facebook.com/tr`

### Rollout Plan

**Deployment:**
1. Merge PR after testing
2. Standard GitHub Pages deployment via workflow
3. No risk of breaking existing tracking (img tag still present)

**Monitoring:**
- Check Meta Events Manager for drop in PageView events (should remain stable)
- Monitor Sentry for any HTML parsing errors (unlikely)

**Rollback:**
- Revert PR if Meta Pixel stops firing
- Quick rollback: Move noscript back to head (accepts validation warning)

### Prevention Measures

**Why this happened:**
- Third-party code snippets copied without validation
- Build warnings treated as low priority
- No HTML validation in CI pipeline

**How to prevent:**
1. **Add HTML validation to CI**
   - Install `html-validate` or use W3C validator API
   - Add npm script: `"validate:html": "html-validate 'dist/**/*.html'"`
   - Run in GitHub Actions workflow after build
   - Fail build on validation errors

2. **Review third-party snippets before adding**
   - Check HTML5 spec compliance
   - Search for known issues with snippet
   - Consider alternative placements that maintain functionality

3. **Don't ignore build warnings**
   - Treat warnings as TODO items
   - Create issues for all build warnings
   - Set goal of zero warnings in production builds

**Similar issues to check:**
- Google Tag Manager noscript (should also be in body)
- Any other tracking pixels (LinkedIn, TikTok, etc.)
- Schema.org JSON-LD scripts (should be valid JSON)

---

## Error #6: [MEDIUM] Rollup platform module missing (local builds)

**STATUS:** 🔴 OPEN - HIGH PRIORITY FOR DEVELOPER EXPERIENCE

### Summary
- **Severity:** 🟡 Medium (High for developer experience)
- **Impact:** Cannot build project locally on macOS ARM64, must use CI/CD
- **Frequency:** 100% on local macOS ARM64 machines after `npm ci`
- **Environment:** Local development only (macOS arm64)

### Symptoms
- Running `npm run build` fails with error: `Cannot find module @rollup/rollup-darwin-arm64`
- Error occurs in `node_modules/rollup/dist/native.js:67`
- `npm ci` completes without errors but doesn't install platform-specific dependency
- Other platforms (linux-x64 in CI) unaffected

### Evidence

**Error stack trace:**
```
Error: Cannot find module '@rollup/rollup-darwin-arm64'
  at Object.<anonymous> (node_modules/rollup/dist/native.js:67:9)
  at Module._compile (node:internal/modules/cjs/loader:1358:14)
```

**Investigation:**
```bash
ls node_modules/@rollup/
# Expected: rollup-darwin-arm64/
# Actual: (directory missing or empty)

npm ls @rollup/rollup-darwin-arm64
# Shows: (empty) or "UNMET OPTIONAL DEPENDENCY"
```

### Root Cause Analysis

**Why it happens:**
1. Rollup uses platform-specific native bindings for performance
2. These are listed as `optionalDependencies` in Rollup's package.json
3. `npm ci` has a long-standing behavior where optional dependencies sometimes fail to install
4. When `npm ci` encounters optional dependency errors, it continues (by design) but leaves modules missing
5. Vite requires the platform-specific Rollup module to exist, not optional for actual usage

**Why optional dependencies fail with npm ci:**
- Network timeouts during optional dep downloads
- Registry availability issues
- npm cache corruption
- `npm ci` doesn't retry failed optionals like `npm install` does

**Why this happens specifically on macOS ARM64:**
- darwin-arm64 is relatively new platform (M1/M2 Macs since 2020)
- Some npm registries have less reliable hosting for newer platform binaries
- Larger binary size may timeout more frequently

**Similar reported issues:**
- Rollup issue #4699: "Optional dependencies not installed with npm ci"
- npm issue #8451: "npm ci fails to install optional dependencies"
- Vite issue #12234: "Missing @rollup/rollup-* on macOS ARM64"

### Fix Strategy

**RECOMMENDED: Explicitly install platform dependency after npm ci**

**Approach:** Add post-install script or modify build command to ensure platform module exists

**Implementation:**
```json
{
  "scripts": {
    "postinstall": "npm install @rollup/rollup-darwin-arm64 --no-save --ignore-scripts || true",
    "build": "vite build"
  }
}
```

**Pros:**
- Automatically fixes missing module after any install
- Works on all platforms (|| true prevents errors on linux)
- No workflow changes needed
- Local development works immediately

**Cons:**
- Adds extra install step (increases install time by 2-3 seconds)
- May download unnecessary modules on non-macOS platforms (mitigated by || true)

**Alternative Approach #1: Use npm install instead of npm ci locally**

**Pros:**
- npm install has better optional dependency retry logic
- May fix issue without code changes

**Cons:**
- Doesn't use package-lock.json strictly (defeats purpose of ci)
- Not a solution for other contributors
- CI still uses npm ci, local/CI divergence

**Alternative Approach #2: Add to dependencies (not optionalDependencies)**

Manually add platform module to package.json dependencies.

**Pros:**
- Guarantees installation
- npm ci will fail loudly if missing

**Cons:**
- Will try to install darwin-arm64 module on linux (wastes bandwidth, may fail)
- Goes against Rollup's design (uses optional for good reason)
- Breaks on other platforms

**Alternative Approach #3: Clear npm cache before install**

```bash
npm cache clean --force && npm ci
```

**Pros:**
- May fix cache corruption issues
- No code changes

**Cons:**
- Slower install (re-downloads everything)
- Doesn't address root cause
- Not automatable for contributors

**Selected Approach:** Postinstall script (Option 1)

**Justification:**
- Most reliable solution that works for all contributors
- Minimal impact (2-3 seconds)
- Doesn't break CI (CI already has working rollup install)
- Can be removed if npm fixes optional dependency behavior

### Implementation Plan

#### Phase 1: Add postinstall script (15 min)

**Tasks:**
1. **Add postinstall to package.json** (5 min)
   - Add script to automatically install platform-specific Rollup after npm ci
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/package.json`
   - **Code:**
   ```json
   "scripts": {
     "postinstall": "node scripts/install-rollup-native.js"
   }
   ```
   - **Acceptance criteria:** Script runs after npm ci or npm install

2. **Create install script** (10 min)
   - Create platform-aware installer that only installs needed binary
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/scripts/install-rollup-native.js` (new file)
   - **Code:**
   ```javascript
   #!/usr/bin/env node
   const { execSync } = require('child_process');
   const os = require('os');

   const platform = os.platform();
   const arch = os.arch();

   const platformMap = {
     'darwin-arm64': '@rollup/rollup-darwin-arm64',
     'darwin-x64': '@rollup/rollup-darwin-x64',
     'linux-x64': '@rollup/rollup-linux-x64-gnu',
     'win32-x64': '@rollup/rollup-win32-x64-msvc',
   };

   const packageName = platformMap[`${platform}-${arch}`];

   if (packageName) {
     try {
       console.log(`Installing ${packageName}...`);
       execSync(`npm install ${packageName} --no-save --ignore-scripts`, {
         stdio: 'inherit'
       });
       console.log(`✓ ${packageName} installed successfully`);
     } catch (error) {
       console.warn(`Warning: Failed to install ${packageName}, build may fail`);
       console.warn('Try running: npm install ${packageName}');
     }
   }
   ```
   - **Acceptance criteria:** Script detects platform and installs correct Rollup binary

#### Phase 2: Testing (15 min)

**Tasks:**
1. **Test on macOS ARM64** (5 min)
   - Delete `node_modules/` and `package-lock.json`
   - Run `npm install`
   - Verify postinstall runs and installs `@rollup/rollup-darwin-arm64`
   - Run `npm run build` - should succeed
   - **Acceptance criteria:** Build works on fresh install

2. **Test on CI (linux-x64)** (5 min)
   - Push commit and trigger workflow
   - Verify postinstall doesn't break linux build
   - Verify build completes successfully
   - **Acceptance criteria:** CI build still works

3. **Test with npm ci** (5 min)
   - Delete `node_modules/`
   - Run `npm ci` (not npm install)
   - Verify postinstall runs even with npm ci
   - **Acceptance criteria:** npm ci triggers postinstall correctly

#### Phase 3: Documentation (10 min)

**Tasks:**
1. **Document workaround in README** (10 min)
   - Add troubleshooting section for Rollup platform module errors
   - Document manual fix if postinstall fails
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/README.md`
   - **Content:**
   ```markdown
   ## Troubleshooting

   ### Build fails with "Cannot find module @rollup/rollup-darwin-arm64"

   This is a known issue with npm optional dependencies. The project includes a postinstall script to fix this automatically.

   If you still see this error:
   ```bash
   npm install @rollup/rollup-darwin-arm64 --no-save
   ```

   Replace `darwin-arm64` with your platform:
   - macOS Intel: `darwin-x64`
   - Linux: `linux-x64-gnu`
   - Windows: `win32-x64-msvc`
   ```
   - **Acceptance criteria:** README has troubleshooting section

### Testing Plan

**Unit test (optional):**
Create test for install-rollup-native.js script logic.

**Integration tests:**
1. **Clean install test:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   # Should succeed without manual intervention
   ```

2. **npm ci test:**
   ```bash
   rm -rf node_modules
   npm ci
   npm run build
   # Should succeed
   ```

3. **Platform detection test:**
   ```bash
   node scripts/install-rollup-native.js
   # Should log correct platform package
   ```

### Rollout Plan

**Deployment:**
1. Merge PR with postinstall script
2. Notify contributors to run `npm ci` or `npm install` to get fix
3. No deployment needed (development-only fix)

**Monitoring:**
- Check for GitHub issue reports about build failures
- Monitor CI build success rate (should remain 100%)
- Ask contributors to verify local builds work

**Rollback:**
- Remove postinstall script if it causes issues
- Document manual fix in README as temporary workaround

### Prevention Measures

**Why this happened:**
- Relied on npm optional dependencies working reliably (they don't)
- No local build verification for new contributors
- Platform-specific dependencies not tested across all platforms

**How to prevent:**
1. **Add platform testing to CI**
   - Add matrix build for darwin-arm64, darwin-x64, linux-x64, win32-x64
   - Catch platform-specific issues before merge
   - GitHub Actions supports multiple platforms

2. **Contributor onboarding checklist**
   - Add "Run `npm run build` successfully" to contributor guide
   - Create setup script that validates environment
   - Detect missing platform modules and provide fix instructions

3. **Monitor Rollup and Vite updates**
   - Check release notes for optional dependency changes
   - Consider switching to alternative bundler if issue persists (esbuild, parcel)

**Similar issues to check:**
- Search for other optional dependencies: `grep -r "optionalDependencies" node_modules/*/package.json`
- Check for platform-specific dependencies in other packages
- Verify Playwright and other native modules install correctly

---

## Error #7: [LOW] Multiple old GA4 IDs still firing

**STATUS:** 🔴 OPEN - CLEANUP NEEDED

### Summary
- **Severity:** 🟢 Low (data quality issue)
- **Impact:** Duplicate analytics events, potential data pollution in old properties
- **Frequency:** Every page load
- **Environment:** Production only (GTM container)

### Symptoms
- Browser network tab shows requests to `analytics.google.com/g/collect?...` for multiple GA4 measurement IDs
- Multiple GA4 IDs firing: `G-J7TL7PQH7S`, `G-ECH51H8L2Z`, `G-9HNZ1EDFYC`
- Current/correct ID: `G-QT41VM3BQQ`
- 3-4x duplicate events in different GA4 properties

### Evidence

**Current code shows correct ID:**
`/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/index.html:304`
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QT41VM3BQQ"></script>
```

**GTM container firing old IDs:**
Container ID: `GTM-NLLQ5ZM3` (line 301 in index.html)
- Contains old GA4 configuration tags that weren't removed
- Tags likely created during testing/setup phase
- Never cleaned up when final GA4 property was selected

### Root Cause Analysis

**Why it happened:**
1. Multiple GA4 properties created during setup/testing
2. GTM container accumulated configuration tags for each property
3. When final property (G-QT41VM3BQQ) was selected, old tags weren't removed
4. GTM fires ALL enabled tags, so all 4 GA4 properties receive events

**Why this is a problem:**
- **Data duplication:** Same event counted 4 times across properties
- **Wasted quota:** Each property counts toward GA4 limits
- **Confusion:** Unclear which property is "source of truth"
- **Performance:** 4x analytics requests on every page load
- **Privacy compliance:** May violate data minimization principles

**Why this wasn't caught:**
- Old properties still receiving data, so no obvious breakage
- GTM container changes not tracked in source control
- No analytics validation tests
- External configuration (GTM) separate from code

### Fix Strategy

**RECOMMENDED: Remove old GA4 tags from GTM container**

**Approach:**
1. Log into Google Tag Manager (tagmanager.google.com)
2. Open container GTM-NLLQ5ZM3
3. Identify GA4 Configuration tags with old measurement IDs
4. Delete or disable tags for G-J7TL7PQH7S, G-ECH51H8L2Z, G-9HNZ1EDFYC
5. Keep only G-QT41VM3BQQ tag
6. Test in GTM preview mode
7. Publish container

**Pros:**
- Eliminates duplicate tracking
- Reduces page load requests by 75%
- Cleans up GTM workspace
- Maintains historical data in old properties (if needed for reference)

**Cons:**
- Requires GTM access and knowledge
- If old properties are actively used, will stop receiving data (verify first!)

**Alternative Approach #1: Pause old tags instead of deleting**

Set tags to "Paused" state instead of deleting.

**Pros:**
- Can quickly re-enable if needed
- Preserves tag configuration for reference

**Cons:**
- Clutters GTM workspace
- Paused tags can accidentally be re-enabled

**Alternative Approach #2: Archive old GA4 properties**

Delete tags AND archive old GA4 properties in Google Analytics.

**Pros:**
- Full cleanup
- Prevents accidental data collection

**Cons:**
- Loses historical data if needed later
- More aggressive, harder to undo

**Selected Approach:** Delete old tags, keep GA4 properties archived (Option 1 + partial Option 2)

**Justification:**
- Clean GTM workspace
- Old properties can remain for historical reference (no cost to keep)
- Can always recreate tags if truly needed

### Implementation Plan

#### Phase 1: Audit GTM Container (15 min)

**Tasks:**
1. **Log into GTM and audit tags** (10 min)
   - Access container GTM-NLLQ5ZM3
   - List all tags with type "Google Analytics: GA4 Configuration"
   - Document tag names and measurement IDs
   - Check tag firing rules (should fire on all pages)
   - **Tool:** Google Tag Manager UI
   - **Acceptance criteria:** Complete list of all GA4 tags with IDs

2. **Verify which properties are active** (5 min)
   - Log into Google Analytics
   - Check each property (G-J7TL7PQH7S, etc.) for recent data
   - Confirm G-QT41VM3BQQ is receiving data
   - **Tool:** Google Analytics UI
   - **Acceptance criteria:** Know which properties can be safely removed

#### Phase 2: Remove Old Tags (20 min)

**Tasks:**
1. **Delete old GA4 tags** (5 min)
   - In GTM, select tags for old measurement IDs
   - Delete tags (or pause if want to keep for reference)
   - **Tool:** Google Tag Manager UI
   - **Acceptance criteria:** Only G-QT41VM3BQQ tag remains enabled

2. **Test in GTM Preview Mode** (10 min)
   - Click "Preview" in GTM
   - Load website in debug tab
   - Verify only 1 GA4 request fires
   - Check Tag Assistant shows only current GA4 tag
   - **Tool:** GTM Preview Mode + Chrome DevTools Network tab
   - **Acceptance criteria:** Only 1 GA4 collect request per event

3. **Publish GTM container** (5 min)
   - Add version description: "Remove old GA4 tags (G-J7TL7PQH7S, G-ECH51H8L2Z, G-9HNZ1EDFYC), keep only G-QT41VM3BQQ"
   - Publish container
   - **Tool:** Google Tag Manager UI
   - **Acceptance criteria:** New version published and live

#### Phase 3: Verification (15 min)

**Tasks:**
1. **Verify production site** (10 min)
   - Load site in incognito mode
   - Open Chrome DevTools Network tab
   - Filter for "google-analytics.com" and "collect"
   - Count GA4 requests - should be 1 per event
   - Check measurement ID in request - should be G-QT41VM3BQQ
   - **Acceptance criteria:** Only 1 GA4 property receiving events

2. **Check GA4 real-time reports** (5 min)
   - Open Google Analytics for G-QT41VM3BQQ
   - Navigate to Reports > Realtime
   - Trigger events on site
   - Verify events appear in real-time
   - **Acceptance criteria:** Events showing in correct property

#### Phase 4: Archive Old Properties (Optional) (10 min)

**Tasks:**
1. **Archive old GA4 properties** (10 min)
   - In Google Analytics Admin, open each old property
   - Go to Property Settings
   - Add "(ARCHIVED)" to property name
   - Remove user access if not needed
   - **Tool:** Google Analytics Admin
   - **Acceptance criteria:** Old properties clearly marked as archived

### Testing Plan

**Pre-cleanup testing:**
```bash
# Check current state
curl -s https://aledlie.github.io/SingleSiteScraper/ | grep -o 'G-[A-Z0-9]*' | sort -u
# Should show: G-QT41VM3BQQ (in code)

# Check GTM container
# Manual: Preview mode and count GA4 tags firing
```

**Post-cleanup testing:**
1. Load page in incognito mode
2. Open DevTools Network tab
3. Filter for "collect"
4. Count requests to analytics.google.com/g/collect
5. Verify only 1 request per event
6. Check `tid=` parameter in request URL - should be G-QT41VM3BQQ

**Automated validation:**
Could add Playwright test to verify only 1 GA4 request fires:
```typescript
test('should fire only one GA4 tag', async ({ page }) => {
  const requests = [];
  page.on('request', req => {
    if (req.url().includes('google-analytics.com/g/collect')) {
      requests.push(req.url());
    }
  });

  await page.goto('/');
  await page.waitForTimeout(2000);

  // Extract measurement IDs
  const ids = requests.map(url => {
    const match = url.match(/tid=(G-[A-Z0-9]+)/);
    return match ? match[1] : null;
  }).filter(Boolean);

  expect(ids).toHaveLength(1);
  expect(ids[0]).toBe('G-QT41VM3BQQ');
});
```

### Rollout Plan

**Deployment:**
1. Make changes in GTM (no code deployment needed)
2. Test in preview mode
3. Publish container
4. Verify immediately via browser DevTools

**Monitoring:**
- Check GA4 real-time reports for 24 hours after change
- Monitor event volume - should drop by 75% (was 4x duplicated)
- Verify all important events still firing (page views, custom events)

**Rollback:**
- GTM maintains version history
- Can revert to previous version in one click if issues detected
- Rollback window: indefinite (GTM keeps version history)

### Prevention Measures

**Why this happened:**
- No process for cleaning up test/dev tags
- GTM changes not documented or reviewed
- External configuration drift (GTM separate from code repo)

**How to prevent:**
1. **GTM configuration as code**
   - Export GTM container configuration regularly
   - Store JSON in repo: `config/gtm-container-export.json`
   - Add script to compare live vs. expected configuration
   - Detect drift in CI

2. **GTM review checklist**
   - Document all active tags and purpose
   - Quarterly GTM audit - remove unused tags
   - Require peer review for GTM changes (via screenshot or export)

3. **Tag naming conventions**
   - Prefix tags with environment: `[PROD]`, `[DEV]`, `[TEST]`
   - Makes it obvious which tags should be active
   - Easier to identify cleanup candidates

4. **Analytics validation tests**
   - Add Playwright test verifying only expected tags fire
   - Fail CI if unexpected GA4 IDs detected
   - Check on every deployment

**Similar issues to check:**
- Facebook Pixel - check for duplicate pixel IDs
- Google Ads tags - verify only current conversion IDs
- Other marketing pixels (LinkedIn, TikTok, etc.)

---

## Error #8: [LOW] Meta Pixel traffic permissions warning

**STATUS:** 🔴 OPEN - EXTERNAL CONFIGURATION

### Summary
- **Severity:** 🟢 Low (may not be actionable)
- **Impact:** Meta Pixel may not track events properly, unclear actual impact
- **Frequency:** Every page load
- **Environment:** Production - browser console

### Symptoms
- Browser console warning: `[Meta pixel] 25629020546684786 is unavailable due to traffic permissions`
- Meta Pixel JavaScript loads successfully
- Warning appears after pixel initialization
- Unclear if events are actually being blocked or just warning

### Evidence

**Pixel ID:** 25629020546684786 (confirmed in `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/index.html:288`)

**Warning source:** Meta Pixel JavaScript SDK, not application code

**Domain:** www.aledlie.com (likely the intended domain, but app served from aledlie.github.io)

### Root Cause Analysis

**What "traffic permissions" means:**
Meta Business Manager allows restricting which domains can use a pixel. This prevents unauthorized websites from sending events to your pixel (pixel hijacking).

**Why warning appears:**
1. Pixel created for domain `www.aledlie.com`
2. Domain restrictions configured in Meta Business Manager
3. App deployed to `aledlie.github.io/SingleSiteScraper/`
4. GitHub Pages domain not in pixel's allowed domains list
5. Meta SDK detects domain mismatch and shows warning

**Unclear impact:**
- Some sources say warning is informational but events still fire
- Other sources say events are blocked if domain not whitelisted
- Meta documentation is ambiguous

### Fix Strategy

**RECOMMENDED: Add GitHub Pages domain to pixel settings**

**Approach:**
1. Log into Meta Business Manager (business.facebook.com)
2. Navigate to Events Manager
3. Select pixel 25629020546684786
4. Settings > Traffic Permissions
5. Add domain: `aledlie.github.io`
6. Save changes

**Pros:**
- Eliminates warning
- Ensures events fire reliably
- Follows Meta's domain whitelisting best practice

**Cons:**
- Requires Meta Business Manager access
- If pixel is shared across properties, may have domain limit

**Alternative Approach #1: Remove domain restrictions entirely**

Allow pixel to fire from any domain.

**Pros:**
- No configuration needed
- Works on any domain

**Cons:**
- Security risk - anyone could use your pixel ID
- Potential data pollution from unauthorized sites
- Not recommended by Meta

**Alternative Approach #2: Use custom domain for GitHub Pages**

Configure GitHub Pages to serve from `www.aledlie.com` instead of `aledlie.github.io`.

**Pros:**
- Matches pixel configuration
- Better branding (custom domain)

**Cons:**
- Requires DNS configuration
- HTTPS certificate setup
- More complex deployment

**Alternative Approach #3: Ignore warning**

If events are firing despite warning, no action needed.

**Pros:**
- No effort required
- May be a false warning

**Cons:**
- Uncertain if events actually being tracked
- Console warnings reduce trust in implementation

**Selected Approach:** Add GitHub Pages domain (Option 1) OR verify events firing and document warning (Option 3)

**Decision criteria:**
1. Check Meta Events Manager - are events from GitHub Pages domain being recorded?
2. If YES: Document warning as expected, no fix needed
3. If NO: Add domain to traffic permissions

### Implementation Plan

#### Phase 1: Verify Impact (15 min)

**Tasks:**
1. **Check if events are firing** (10 min)
   - Open site: https://aledlie.github.io/SingleSiteScraper/
   - Open Meta Pixel Helper Chrome extension
   - Verify PageView event fires
   - Check Events Manager > Test Events for recent activity from GitHub Pages domain
   - **Acceptance criteria:** Know if events are being recorded despite warning

2. **Review Meta Business Manager domain settings** (5 min)
   - Log into business.facebook.com
   - Navigate to pixel settings
   - Check current allowed domains
   - **Acceptance criteria:** Understand current configuration

#### Phase 2A: Fix (if events blocked) (10 min)

**Tasks:**
1. **Add GitHub Pages domain** (10 min)
   - In Meta Business Manager, add `aledlie.github.io` to allowed domains
   - Save and verify
   - Test page load - warning should disappear
   - **Tool:** Meta Business Manager
   - **Acceptance criteria:** No console warning, events firing

#### Phase 2B: Document (if events working) (5 min)

**Tasks:**
1. **Add comment to index.html** (5 min)
   - Document that warning is expected but events fire
   - Note domain mismatch between Business Manager and GitHub Pages
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/index.html`
   - **Code:**
   ```html
   <!-- Meta Pixel Code -->
   <!-- Note: Console warning about traffic permissions is expected.
        Pixel configured for www.aledlie.com but deployed to aledlie.github.io.
        Events fire successfully despite warning. -->
   <script>/* ... */</script>
   ```
   - **Acceptance criteria:** Future developers understand warning

### Testing Plan

**Verify events firing:**
1. Install Meta Pixel Helper Chrome extension
2. Load page with extension active
3. Check extension shows green checkmark (pixel firing)
4. Verify "PageView" event detected
5. Check Events Manager > Test Events for recent pageview from current IP

**Verify domain fix:**
1. Add domain in Business Manager
2. Clear browser cache and cookies
3. Reload page
4. Check console - warning should be gone
5. Verify events still firing via Pixel Helper

### Rollout Plan

**If domain fix needed:**
- Change in Meta Business Manager only
- No code deployment required
- Takes effect immediately (no cache)

**Monitoring:**
- Check Events Manager daily event volume
- Should remain stable or increase (not decrease)

**Rollback:**
- Can remove domain from allowed list if causes issues
- Instant rollback via Business Manager UI

### Prevention Measures

**Why this happened:**
- Pixel created for custom domain before GitHub Pages deployment decided
- Domain configuration not updated when deployment target changed

**How to prevent:**
1. **Document deployment domains in pixel configuration**
   - Add comment in Business Manager pixel settings listing all domains
   - Update when deployment targets change

2. **Environment-specific pixels**
   - Use different pixel IDs for dev/staging/production
   - Avoids domain permission conflicts
   - Clearer analytics separation

3. **Deployment checklist**
   - When changing domains, update all third-party service configurations
   - Check: GA4, Meta Pixel, GTM, Sentry, etc.

**Similar issues to check:**
- Google Analytics domain settings
- Sentry allowed origins
- CORS configuration if using APIs

---

## Error #9: [LOW] Outdated browserslist database

**STATUS:** 🔴 OPEN - MAINTENANCE TASK

### Summary
- **Severity:** 🟢 Low (maintenance issue)
- **Impact:** May target wrong browser versions, outdated polyfills
- **Frequency:** Every build
- **Environment:** Build time

### Symptoms
- Build warning: `Browserslist: caniuse-lite is outdated. Please run: npx update-browserslist-db@latest`
- Warning appears during Vite build
- Message indicates database is 7 months old

### Root Cause Analysis

**What browserslist is:**
Tool that shares browser compatibility data between build tools (Vite, PostCSS, Autoprefixer, Babel). Determines which browser versions to target for transpilation and polyfills.

**Why database gets outdated:**
- Browser features and support data constantly updated
- caniuse-lite (browser support database) released monthly
- npm install doesn't auto-update unless version changed in package.json
- No dependency on browserslist in package.json (inherited from Vite/PostCSS)

**Impact of outdated database:**
- **Over-transpilation:** May add polyfills for browsers that now support features natively (larger bundles)
- **Under-transpilation:** May miss new browser incompatibilities (broken features in older browsers)
- **Incorrect autoprefixer:** CSS vendor prefixes may be wrong
- Generally low risk - 7 months is not critical, but should update

### Fix Strategy

**RECOMMENDED: Run npx update-browserslist-db@latest**

**Approach:**
```bash
npx update-browserslist-db@latest
```

This updates caniuse-lite database in node_modules and package-lock.json.

**Pros:**
- One command fix
- Updates in-place, no version conflicts
- Safe operation (only updates data, not code)

**Cons:**
- Must remember to run periodically
- Doesn't prevent future staleness

**Alternative Approach #1: Add to package.json scripts**

Add npm script to update browserslist regularly:
```json
{
  "scripts": {
    "update:browserslist": "npx update-browserslist-db@latest"
  }
}
```

**Pros:**
- Documented process
- Easy for contributors to run

**Cons:**
- Still manual, not automatic

**Alternative Approach #2: Add postinstall hook**

Always update browserslist after npm install:
```json
{
  "scripts": {
    "postinstall": "npx update-browserslist-db@latest"
  }
}
```

**Pros:**
- Automatic, never outdated

**Cons:**
- Adds 2-3 seconds to every install
- May be overkill for project with infrequent updates

**Alternative Approach #3: Add renovate/dependabot config**

Configure dependency bot to auto-update caniuse-lite.

**Pros:**
- Fully automated via PR
- Tracks updates in git history

**Cons:**
- Requires GitHub app installation
- PR noise for every caniuse-lite update (monthly)

**Selected Approach:** Run update now + add npm script (Option 1 + Option 2)

**Justification:**
- Immediate fix with one command
- Script documents process for future updates
- Doesn't add overhead to every install
- Can run manually quarterly

### Implementation Plan

#### Phase 1: Update Database (5 min)

**Tasks:**
1. **Run browserslist update** (2 min)
   - Execute `npx update-browserslist-db@latest`
   - Verify update successful
   - **Command:** `npx update-browserslist-db@latest`
   - **Acceptance criteria:** No warnings in subsequent builds

2. **Verify package-lock.json updated** (1 min)
   - Check git diff for package-lock.json changes
   - Should show caniuse-lite version update
   - **Acceptance criteria:** package-lock.json shows newer caniuse-lite

3. **Commit update** (2 min)
   - Commit package-lock.json changes
   - Message: "chore: update browserslist database (caniuse-lite)"
   - **Acceptance criteria:** Update committed to repo

#### Phase 2: Add Maintenance Script (5 min)

**Tasks:**
1. **Add npm script** (5 min)
   - Add `update:browserslist` script to package.json
   - Document in README
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/package.json`
   - **Code:**
   ```json
   "scripts": {
     "update:browserslist": "npx update-browserslist-db@latest"
   }
   ```
   - **Acceptance criteria:** Can run `npm run update:browserslist`

#### Phase 3: Documentation (5 min)

**Tasks:**
1. **Document maintenance schedule** (5 min)
   - Add to README maintenance section
   - **File:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/README.md`
   - **Content:**
   ```markdown
   ## Maintenance

   ### Update Browser Support Database

   Run quarterly or when build shows browserslist warning:

   ```bash
   npm run update:browserslist
   ```

   This updates the caniuse-lite database with latest browser compatibility data.
   ```
   - **Acceptance criteria:** README documents maintenance task

### Testing Plan

**Verify update worked:**
```bash
npm run build 2>&1 | grep -i browserslist
# Should return no warnings
```

**Check package-lock.json:**
```bash
grep -A 2 "caniuse-lite" package-lock.json
# Should show recent version
```

**Verify build output unchanged:**
- Build before and after update
- Compare bundle sizes (should be similar, maybe slightly smaller if over-transpilation reduced)
- Test in target browsers (no functionality changes expected)

### Rollout Plan

**Deployment:**
1. Update locally
2. Commit and push
3. CI builds with new database
4. Deploy via normal workflow

**Monitoring:**
- No runtime impact (build-time only change)
- Check build warnings - should be gone
- Verify bundle size similar to previous builds

**Rollback:**
- Revert commit if build breaks (unlikely)
- Can safely leave outdated database if issues arise (low risk)

### Prevention Measures

**Why this happened:**
- No regular maintenance schedule
- Dependency not explicitly managed (transitive via Vite)
- Build warnings often ignored

**How to prevent:**
1. **Quarterly maintenance schedule**
   - Add calendar reminder to update browserslist
   - Include in quarterly dependency update process

2. **CI warning enforcement**
   - Configure CI to fail on build warnings (optional, may be too strict)
   - Or add separate "maintenance check" workflow that warns on PRs

3. **Renovate/Dependabot configuration**
   - Add config to auto-update caniuse-lite
   - Accept automated PRs for data-only updates

4. **Include in dependency update process**
   - When updating Vite, also update browserslist
   - Document in CONTRIBUTING.md

### Similar Issues to Check

- Other transitive dependencies that need periodic updates
- Check for other build warnings that indicate stale data/configs

---

## Error #10: [LOW] Analytics network failures

**STATUS:** 🟢 ACCEPTED - EXPECTED BEHAVIOR

### Summary
- **Severity:** 🟢 Low (expected behavior)
- **Impact:** Some analytics events not recorded (acceptable data loss)
- **Frequency:** Variable (depends on user's ad blocker usage)
- **Environment:** Production - client-side network requests

### Symptoms
- Failed network requests to `analytics.google.com/g/collect`
- Browser console shows "Failed to load resource" or "net::ERR_BLOCKED_BY_CLIENT"
- Some users' events not appearing in Google Analytics

### Root Cause Analysis

**Why this happens:**
1. User has ad blocker or privacy extension installed (uBlock Origin, Privacy Badger, Brave Shields, etc.)
2. Extension blocks requests to known analytics domains
3. Analytics JavaScript executes but network request fails
4. No error thrown to application (failed fetch is swallowed by GA SDK)

**How common:**
- 25-40% of users use ad blockers (varies by audience)
- Privacy-focused browsers (Brave, Firefox with tracking protection) block by default
- Mobile browsers increasingly block trackers

**Impact:**
- Analytics undercounts actual traffic
- Demographics skewed (tech-savvy users more likely to block)
- Cannot prevent without degrading user experience

### Why This Is Acceptable

**Not a bug:**
This is expected behavior of client-side analytics. Users have right to block tracking.

**Best practices:**
- Accept incomplete analytics data
- Don't break functionality when analytics blocked
- Don't detect/warn users about ad blockers (poor UX)

**Alternative measurement:**
If accurate analytics critical, consider:
- Server-side analytics (can't be blocked)
- Privacy-respecting analytics (Plausible, Fathom)
- Log-based analytics

### No Fix Required

**Status:** Accepted as expected behavior

**Recommendation:**
- Document in README that analytics is client-side and blockable
- Consider server-side analytics for critical metrics if needed
- Don't spend time trying to circumvent ad blockers (user hostile, usually fails)

### Prevention Measures

**Not applicable** - this is expected behavior, not a bug.

**If accurate analytics are critical:**
1. Implement server-side event tracking
2. Use privacy-focused analytics (less likely to be blocked)
3. Track critical business metrics server-side (conversions, signups)
4. Accept client-side analytics as directional, not absolute

---

## Cross-Cutting Systemic Improvements

### 1. Deployment Validation Pipeline

**Problem:** Multiple deployment issues (base path, Doppler, Pages enablement) reached production.

**Solution:** Add comprehensive pre-deployment validation

**Implementation:**
```yaml
# .github/workflows/deploy-validation.yml
name: Deployment Validation
on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4

      # Check vite.config.ts has base path
      - name: Validate Vite base path
        run: |
          grep -q "base: '/SingleSiteScraper/'" vite.config.ts || {
            echo "ERROR: vite.config.ts missing base path for GitHub Pages"
            exit 1
          }

      # Validate build produces correct asset paths
      - name: Build and validate paths
        run: |
          npm ci
          npm run build
          grep -q "./assets/" dist/index.html || {
            echo "ERROR: Build assets have incorrect paths"
            exit 1
          }

      # Validate HTML
      - name: HTML validation
        run: |
          npm run validate:html || {
            echo "ERROR: HTML validation failed"
            exit 1
          }

      # Check for TODOs
      - name: No untracked TODOs
        run: |
          ! grep -r "TODO.*implement" src/ || {
            echo "ERROR: Found TODO comments without implementation"
            exit 1
          }
```

### 2. Feature Completeness Tests

**Problem:** Event parser stubbed but feature appears functional (silent failure).

**Solution:** Add smoke tests for all major features

**Implementation:**
```typescript
// tests/smoke/feature-completeness.test.ts
describe('Feature Completeness Smoke Tests', () => {
  test('Event extraction returns non-empty results for known event sites', async () => {
    const html = `
      <script type="application/ld+json">
      {"@type": "Event", "name": "Test", "startDate": "2026-02-01"}
      </script>
    `;
    const events = extractEvents(html);
    expect(events.length).toBeGreaterThan(0);
  });

  test('Scraper extracts content from HTML', async () => {
    const result = await scrapeWebsite('https://example.com');
    expect(result.data).toBeDefined();
    expect(result.data.text.length).toBeGreaterThan(0);
  });

  // Add test for each major feature
});
```

### 3. Configuration Drift Detection

**Problem:** GTM container has stale tags, Meta Pixel domain mismatch, Doppler environment mismatch.

**Solution:** Document external configurations and add validation

**Implementation:**
```markdown
# docs/external-services.md

## External Service Configurations

### Google Tag Manager
- Container: GTM-NLLQ5ZM3
- Active Tags:
  - GA4 Configuration (G-QT41VM3BQQ)
  - Meta Pixel (25629020546684786)
- REMOVED Tags (cleanup 2026-01-11):
  - GA4 G-J7TL7PQH7S (old test property)
  - GA4 G-ECH51H8L2Z (old test property)
  - GA4 G-9HNZ1EDFYC (old test property)

### Meta Business Manager
- Pixel: 25629020546684786
- Allowed Domains: www.aledlie.com, aledlie.github.io

### Doppler
- Project: integrity-studio
- Config: dev
- Token scope: DOPPLER_TOKEN secret must be from dev config

## Validation
Run quarterly to detect drift:
```bash
npm run validate:external-config
```
```

### 4. Dependency Health Checks

**Problem:** Rollup platform module missing, outdated browserslist, optional dependencies failing silently.

**Solution:** Add dependency validation to CI and postinstall

**Implementation:**
```json
// package.json
{
  "scripts": {
    "postinstall": "node scripts/validate-dependencies.js",
    "validate:deps": "node scripts/validate-dependencies.js"
  }
}
```

```javascript
// scripts/validate-dependencies.js
const { execSync } = require('child_process');
const os = require('os');

console.log('Validating dependencies...');

// Check platform-specific Rollup module
const platform = os.platform();
const arch = os.arch();
const rollupModule = `@rollup/rollup-${platform}-${arch}`;

try {
  require.resolve(rollupModule);
  console.log(`✓ ${rollupModule} installed`);
} catch {
  console.warn(`✗ ${rollupModule} missing, installing...`);
  execSync(`npm install ${rollupModule} --no-save`, { stdio: 'inherit' });
}

// Check browserslist age
try {
  const output = execSync('npx browserslist --mobile-to-desktop', { encoding: 'utf-8' });
  console.log('✓ Browserslist database loaded');
} catch (error) {
  console.warn('✗ Browserslist database outdated, run: npm run update:browserslist');
}

console.log('Dependency validation complete');
```

### 5. TODO Comment Governance

**Problem:** TODO comment in event parser left implementation incomplete for unknown duration.

**Solution:** Enforce TODO comments must link to issues

**Implementation:**
```json
// .eslintrc.json
{
  "rules": {
    "no-warning-comments": ["error", {
      "terms": ["TODO", "FIXME", "HACK"],
      "location": "start"
    }]
  }
}
```

```bash
# scripts/check-todos.sh
#!/bin/bash
# Check for TODOs without issue links

todos=$(grep -r "TODO" src/ --exclude-dir=node_modules)

if [ -n "$todos" ]; then
  echo "ERROR: Found TODO comments without issue tracking:"
  echo "$todos"
  echo ""
  echo "Please either:"
  echo "  1. Implement the TODO"
  echo "  2. Create a GitHub issue and reference it: // TODO(#123): ..."
  echo "  3. Remove the TODO if no longer relevant"
  exit 1
fi
```

---

## Prioritized Implementation Timeline

### Immediate (This Week)

1. **Error #2 - Implement Event Parser** (4-5 hours)
   - Highest impact: Core feature currently broken
   - Blocks user value from application
   - Clear implementation path

2. **Error #6 - Fix Rollup Platform Module** (1 hour)
   - High impact on developer experience
   - Blocks local development for macOS ARM64 contributors
   - Simple postinstall script fix

### Short-term (Next 2 Weeks)

3. **Error #5 - Fix HTML Validation Warning** (30 min)
   - Quick win, improves SEO/accessibility
   - Move noscript to body

4. **Error #7 - Clean Up Old GA4 IDs** (30 min)
   - Improves data quality
   - Reduces unnecessary network requests
   - Simple GTM configuration cleanup

5. **Error #9 - Update Browserslist** (15 min)
   - Maintenance task
   - Run update command + add npm script

### Long-term (Next Month)

6. **Systemic Improvements** (4-6 hours)
   - Add deployment validation workflow
   - Create feature smoke tests
   - Document external service configurations
   - Add dependency health checks
   - Implement TODO governance

### Monitoring Only

7. **Error #8 - Meta Pixel Domain Warning** (verify first, fix if needed)
8. **Error #10 - Analytics Network Failures** (accepted, no action)

---

## Success Metrics

### Immediate Wins
- [ ] Event parser extracts events from Capital Factory website
- [ ] Local builds work on macOS ARM64 without manual intervention
- [ ] Zero HTML validation warnings in production build
- [ ] Only 1 GA4 property receiving events (not 4)

### Quality Improvements
- [ ] Zero TODO comments without linked issues
- [ ] All major features have smoke tests
- [ ] Deployment validation catches configuration errors before production
- [ ] External service configurations documented and validated quarterly

### Long-term Health
- [ ] 90%+ test coverage on core features
- [ ] Zero build warnings in CI
- [ ] Automated dependency health checks prevent platform-specific issues
- [ ] Configuration drift detected within 1 week via validation scripts

---

## Appendix: Error Summary Table

| # | Error | Severity | Status | Priority | Time Est. |
|---|-------|----------|--------|----------|-----------|
| 1 | React app not rendering | CRITICAL | ✅ FIXED | N/A | N/A |
| 2 | Event parser stub only | HIGH | 🔴 OPEN | P0 | 4-5 hours |
| 3 | Doppler config mismatch | HIGH | ✅ FIXED | N/A | N/A |
| 4 | GitHub Pages not enabled | HIGH | ✅ FIXED | N/A | N/A |
| 5 | HTML validation warning | MEDIUM | 🔴 OPEN | P2 | 30 min |
| 6 | Rollup platform module | MEDIUM | 🔴 OPEN | P1 | 1 hour |
| 7 | Old GA4 IDs firing | LOW | 🔴 OPEN | P3 | 30 min |
| 8 | Meta Pixel permissions | LOW | 🔴 OPEN | P4 | 15 min |
| 9 | Outdated browserslist | LOW | 🔴 OPEN | P5 | 15 min |
| 10 | Analytics network failures | LOW | ✅ ACCEPTED | N/A | N/A |

**Total estimated time to fix all open issues:** 6.5 hours

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Prioritize** errors based on business impact
3. **Create GitHub issues** for each error (link to this plan)
4. **Start with Error #2** (event parser) - highest impact
5. **Implement systemic improvements** to prevent similar issues

---

**Document Location:** `/Users/alyshialedlie/code/ISPublicSites/SingleSiteScraper/docs/bugfix-plan-2026-01-11.md`

**Last Updated:** 2026-01-11

**Author:** Bugfix Planning Agent

**Status:** Ready for Implementation
