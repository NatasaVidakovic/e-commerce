# Optional Noli theme

Noli is an optional brand experience. The original Web Shop remains available in the same application.

## Turn Noli off or on

Edit `client/public/brand-config.js`:

```js
window.shopBrand = 'default'; // Original Web Shop
// window.shopBrand = 'noli'; // Noli experience
```

Change only the assignment, keep the following `dataset.brand` statement, then reload the browser. No rebuild is needed when editing the deployed `brand-config.js` in the web root. For a source deployment, edit it before building or copying the public assets. Missing or unknown configuration falls back to `default`.

The checked-in selection is `noli`, preserving the current preview. There is no browser preference that can silently override this deployment setting.

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

`BrandingService` is the single frontend switch. Noli global styles are scoped to `html[data-brand='noli']`. Original page templates are in the `base-*.component.*` files and inherit shared behaviour. Shared semantic colour helpers resolve to the selected palette. Translation fixes and functional fixes remain useful in both modes.

The selection is read at page startup. Reload after changing it. The theme editor's light/dark and custom colour settings continue to work independently in each mode.

## Theme versus data

Turning off a theme never deletes or rewrites merchant data. Products, names, uploaded images, gallery images and site settings saved in the database remain as configured by its owner. In the isolated `NoliLocal` demo database, those records intentionally contain Noli content. Use the normal shop database and its administrator settings when reusing this application for another shop.

The backend does not seed Noli products by default. The explicit development setting `NoliDemo:SeedCatalog=true` enables the empty-catalog demo seed. `scripts/Start-NoliLocal.ps1` opts in for the separate local demo database. It leaves the original shop database untouched. Do not use that demo launcher for a different merchant.

## Git rollback

All Noli work and its optional switch are grouped in the commit named:

**`feat(noli): add optional Noli theme (revert to restore base shop)`**

Find its hash with:

```powershell
git log --all --oneline --grep="feat(noli): add optional Noli theme"
```

To keep the code and use the base shop, set `window.shopBrand = 'default'`. To remove the entire Noli change from Git history's resulting tree, use `git revert <NOLI_COMMIT_HASH>` from a clean working tree. This adds a reversal commit and preserves history. Reverting source code does not undo database records or remove local demo containers.

The exact original source revision before Noli is `f083a1d` (`deploy dokument`). It can be inspected without changing the working tree with `git show f083a1d:<path>`.

## Validation

```powershell
node scripts/check-i18n.mjs
cd client
npm run build
$env:CHROME_BIN = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm test -- --watch=false --browsers=ChromeHeadless
```

Focused tests cover both branding selections, the fallback configuration, isolated theme storage, base payment configuration, Noli cash-only policy and disabled reactions/catalog remapping in base mode. Both frontend branches are compiled in the same production build.
