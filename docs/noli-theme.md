# Optional Noli theme

Noli is an optional brand experience. The original Web Shop remains available in the same application.

## Turn Noli off or on

Sign in as an administrator and open **Administration → Theme settings → Storefront appearance** (`/admin/theme-settings`). Choose **Original Web Shop** or **Noli**, then click **Save appearance**. The page reloads after a successful save.

The selection is stored in the database as `StorefrontBrand`. It applies to all visitors on their next page load, across browsers and devices. No source edit or frontend rebuild is needed. A missing or unknown setting uses `default`.

Only administrators can see or save the appearance controls. Both the admin route and the control itself check the role. The server independently requires the `Admin` role for `PUT /api/appearance`; anonymous callers receive 401 and authenticated non-admin callers receive 403. The existing site-setting write endpoints also require `Admin`.

`GET /api/appearance` is public because the storefront needs the selected design before rendering. It returns only the brand and disables response caching. Startup waits for this setting before creating components and theme-dependent services. Public configuration files, browser storage and HTML attributes cannot override the saved server setting. The previous `brand-config.js` has been removed.

| Feature | `default` | `noli` |
| --- | --- | --- |
| Header, footer, home and About | Original templates and layout | Noli editorial layout and story |
| Colours, type and icons | Original Web Shop theme | Peach, cream and sage; Noli fonts and icons |
| Login, products and admin | Base styling | Noli styling |
| Store location on About | Original map and configuration | Hidden |
| Cart and favourite reactions | Disabled | Small stars and hearts, respecting reduced motion |
| Back to top mascot | Hidden | Animated Noli |
| Payment methods | Administrator's cash/card/both setting | Cash on delivery only |
| Theme customisation storage | `app-theme-config` | `noli-theme-config` |
| Metadata and favicon | Original Web Shop | Noli |

`StorefrontAppearanceService` loads the server choice and saves it through the protected API. `BrandingService` applies that choice to the document. Noli global styles are scoped to `html[data-brand='noli']`. Original page templates are in the `base-*.component.*` files and inherit shared behaviour. Shared semantic colour helpers resolve to the selected palette. Translation fixes and functional fixes remain useful in both modes.

The selection is read at page startup; a failed load safely uses the base shop without HTTP error redirects. Saving reloads the administrator's page only after persistence succeeds. Rejected saves show an error and leave the current appearance unchanged. Login waits for the user profile and roles before navigating to a protected page. The theme editor's light/dark and custom colour settings continue to work independently in each mode.

## Theme versus data

Turning off a theme never deletes or rewrites merchant data. Products, names, uploaded images, gallery images and site settings saved in the database remain as configured by its owner. In the isolated `NoliLocal` demo database, those records intentionally contain Noli content. Use the normal shop database and its administrator settings when reusing this application for another shop.

The backend does not seed Noli products by default. The explicit development setting `NoliDemo:SeedCatalog=true` enables the empty-catalog demo seed. `scripts/Start-NoliLocal.ps1` opts in for the separate local demo database. It leaves the original shop database untouched. Do not use that demo launcher for a different merchant.

## Git rollback

The original Noli work and its optional switch are grouped in commit `ac2781d`:

**`feat(noli): add optional Noli theme (revert to restore base shop)`**

Find its hash with:

```powershell
git log --all --oneline --grep="feat(noli): add optional Noli theme"
```

To keep the code and use the base shop, select **Original Web Shop** in the admin panel. The admin-only appearance change is in `072f833`, **`feat(noli): restrict appearance changes to administrators`**. Responsive refinements are grouped in **`fix(noli): adapt layouts for mobile tablet and desktop`**. To remove Noli source changes entirely, revert the responsive commit first, then `072f833`, then `ac2781d`, starting with a clean working tree. Reverting source code does not undo database records or remove local demo containers.

The exact original source revision before Noli is `f083a1d` (`deploy dokument`). It can be inspected without changing the working tree with `git show f083a1d:<path>`.

## Responsive Noli layouts

The mobile header and admin navigation switch at 767px. Mobile admin links have fixed 112px widths, two-line labels and horizontal scrolling; opening a section brings its link into view. The breakpoint subscription ends when the layout is destroyed. The base shop does not use the automatic scrolling.

Home typography and imagery scale down on phones, product grids use two to five columns, tablet filters wrap onto two rows, and narrow cart rows keep quantity controls below the product name. Checkout stacks its summary below the form under 1100px and uses a 320px summary column on larger screens. Noli checkout omits the base layout utility classes so percentage widths cannot shrink the summary inside its grid. Theme settings, login, registration and order pages use smaller mobile spacing. These layout rules are scoped to the Noli brand; original templates remain available.

## Validation

```powershell
node scripts/check-i18n.mjs
cd client
npm run build
$env:CHROME_BIN = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm test -- --watch=false --browsers=ChromeHeadless
```

Focused tests cover both branding selections, server startup loading, the fallback configuration, isolated theme storage, base payment configuration, Noli cash-only policy, disabled reactions/catalog remapping in base mode and rejected admin saves. HTTP integration tests use the real controllers and authorization middleware to verify 401/403 responses, administrator persistence, invalid input and public reads. Both frontend branches are compiled in the same production build.

Verified on 2026-10-26: production frontend build, 38 frontend tests, 61 backend tests and 1,691 matching translation entries. Browser checks covered guest redirection, non-admin redirection, administrator saves in both directions, persistence after reload and mobile layout. A direct anonymous write against the running local API returned 401 and left the saved Noli choice unchanged.

Responsive browser checks sampled 320, 360, 697, 768, 1024 and 1440px widths across the homepage, shop, product details, filters, admin catalog, theme/site settings, login, favourites, cart and checkout. The local buyer has no orders, so the orders check covers its empty state. Checkout was inspected without submitting an order. Three additional navigation tests verify that active links become visible on mobile, base/desktop navigation stays still, and breakpoint observation stops on destruction. Backend code was unchanged during the responsive refinements.
