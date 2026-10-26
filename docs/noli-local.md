# Noli local storefront

The existing Angular 20 / .NET 9 shop uses the supplied Noli imagery and a peach, cream and sage palette. Quicksand headings and wordmark pair with Nunito Sans body text and a few Cormorant Garamond accents. Account, favourites, discounts, product filtering, checkout and administrative routes remain connected to their original services.

## Run on Windows

Requirements: Node dependencies in `client/node_modules`, .NET 9 SDK, Docker Desktop, a running SQL Server Express instance and the existing API user secrets (including `ADMIN_USER_PASSWORD`). Install frontend dependencies with `npm ci` inside `client` if needed.

From the repository root:

```powershell
.\scripts\Start-NoliLocal.ps1
```

Open <http://localhost:4200>. The API listens on <https://localhost:5001>. Logs and process IDs are stored in `.local/noli/` and ignored by Git.

The script uses a separate `NoliLocal` SQL database and a `noli-local-redis` Docker container bound to `127.0.0.1:6381`. The existing `WebShop` database and other Redis instances are not changed. Specify another SQL instance with `-SqlServer`; the database name can also be overridden with `-Database`.

This local profile selects local image storage, mock payments and cash checkout. It does not exercise live card payments, email delivery, Google sign-in or reporting providers.

The Noli checkout now presents cash on delivery to both guests and signed-in customers, including when an older site configuration still specifies cards. Card selection is hidden and its handler rejects switching away from cash. The existing card integration remains available in the service layer and uses Stripe's pure loader, so browsing the cash checkout does not initialize Stripe scripts.

## Catalog and assets

The development-only `NoliDemo:SeedCatalog` flag enables `NoliCatalogSeed`. It inserts Rosa (24 KM), Luna (27 KM), Nježno jutro (29 KM) and Topli zagrljaj (34 KM), their two categories and local brand settings only when the product catalog is empty. Repeated startup does not replace an existing catalog. No catalog schema migration is required.

Assets in `client/public/brand/` come from the user's supplied images and embedded images in `nolii_web_shop_demo.html`. The source files in Downloads were not modified. Theme preferences use the `noli-theme-config` storage key so other localhost projects cannot supply an unrelated logo or palette.

See [Noli assets](noli-assets.md) for the clean illustrations and image-editing brief. The latest supplied clean jewelry, candle and workshop scenes replace the earlier versions at their existing public paths. The Noli world section and About story use translated captions outside the images. About no longer loads or displays the store location. The administrator can still manage that setting.

## Interaction and localization

Successful cart additions trigger small stars, and newly saved favourites trigger small hearts. Both wait for persistence, prevent duplicate pending submissions and remove their decorative layers after completion. Noli's floating button flies upward while the page scrolls to the top. Reduced-motion preferences suppress the particles and flight and scroll immediately.

Status, rating, error, notification, button and filter colours use shared Noli tokens, including older administrative utility classes. Rating and stock labels wrap without overlapping. Product filters keep their backend values; only displayed labels are translated. Bundled catalog copy also changes language, while merchant-entered names and descriptions remain intact.

Both catalogs have 1,677 matching entries. Check keys and interpolation parameters from the repository root:

```powershell
node scripts/check-i18n.mjs
```

The existing June 7 migration repeated the three indexes created by the June 5 migration, preventing a fresh database from starting. Its duplicate Up/Down operations were removed; the earlier migration remains the owner of those indexes. A regression test covers both directions.

## Validation

- Angular production build.
- Backend suite: 46 tests passed, including the migration regression test.
- Frontend: all 17 tests passed, including 15 focused tests for persistence feedback, reduced motion, animation cleanup, catalog translation and cash-only checkout.
- Translation key parity, interpolation parity and template copy audit.
- Fresh local database startup and repeated seed execution.
- Browser checks for category links, collection filters, product details, cart persistence, language switching and mobile layout.

No orders or live payments were submitted during validation.

## Optional branding

Administrators can switch between Noli and the original shop in **Administration → Theme settings → Storefront appearance**. This choice is saved on the server and applies to all visitors. See [Optional Noli theme](noli-theme.md) for access control, the base mode, payment policy, database distinction and Git rollback instructions.
