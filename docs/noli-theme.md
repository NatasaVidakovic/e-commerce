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

To keep the code and use the base shop, select **Original Web Shop** in the admin panel. The admin-only appearance change is in the follow-up commit **`feat(noli): restrict appearance changes to administrators`**. To remove Noli source changes entirely, revert that follow-up first, then revert `ac2781d`, starting with a clean working tree. Reverting source code does not undo database records or remove local demo containers.

The exact original source revision before Noli is `f083a1d` (`deploy dokument`). It can be inspected without changing the working tree with `git show f083a1d:<path>`.

## Validation

```powershell
node scripts/check-i18n.mjs
cd client
npm run build
$env:CHROME_BIN = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm test -- --watch=false --browsers=ChromeHeadless
```

Focused tests cover both branding selections, server startup loading, the fallback configuration, isolated theme storage, base payment configuration, Noli cash-only policy, disabled reactions/catalog remapping in base mode and rejected admin saves. HTTP integration tests use the real controllers and authorization middleware to verify 401/403 responses, administrator persistence, invalid input and public reads. Both frontend branches are compiled in the same production build.

Verified on 2026-10-26: production frontend build, 35 frontend tests, 61 backend tests and 1,691 matching translation entries. Browser checks covered guest redirection, non-admin redirection, administrator saves in both directions, persistence after reload and mobile layout. A direct anonymous write against the running local API returned 401 and left the saved Noli choice unchanged.
