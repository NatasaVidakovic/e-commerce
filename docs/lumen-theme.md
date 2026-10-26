# Lumen storefront

Lumen is a third appearance alongside the original Web Shop and Noli. Administrators select it under **Administration → Theme settings → Storefront appearance**, then save. The server persists `StorefrontBrand=lumen`; visitors receive the selected appearance on their next page load. The existing Admin authorization remains required for writes. Anonymous and customer sessions cannot change the appearance.

## Design and implementation

The supplied `src.zip` React demo and reference images guide the design. Its demo application and mock catalog are not executed or imported. The Angular application keeps its existing product, cart, favourites, discount, order, account and administration services.

Lumen uses forest green, moss, sage, warm ivory, sand and antique gold. Fraunces supplies the display typography and DM Sans supplies interface text. The wordmark and flame are vector components; the favicon is an SVG. `client/public/brand/lumen/sunlight.jpg` and `linen.jpg` are unchanged copies of the supplied demo's `imports/brand-3.jpg` and `imports/brand-2.jpg`.

The homepage follows the supplied demo with a sunlight photograph across the viewport, staggered photographic collections on ivory and forest backgrounds, an archive link and studio story. Ten collection photographs are copied locally from the image URLs in the Figma export; their sources are recorded in `docs/lumen-image-sources.json`. The export's missing fifth candle image is replaced by its sixth candle photograph. These editorial tiles open the matching candle or jewellery catalog. They do not create inventory or display demo prices. The real API continues to provide products, prices, stock, favourites, configured recommendations and promotions; if no recommendations are configured, the homepage shows available catalog products.

The hero and header collection links scroll to the photographic sections, including from the mobile menu. Native horizontal scrolling, keyboard focus, previous/next controls and a scroll progress line support the staggered collections. The navigation is translucent over the hero and gains the Lumen wordmark after scrolling. Hero image, text and logo overrides remain available.

Lumen has dedicated header, footer, home and story templates. Login, product details, cards, filters, cart, checkout, admin tables, charts and report printouts use the Lumen palette. Serbian and English interface text is included. Custom hero images, hero text, logo overrides, colour customization and light/dark settings remain available. Motion respects the reduced-motion preference.

All three appearances share a neutral startup skeleton in `client/src/index.html`. Its critical styles are inline, so no logo flashes while JavaScript or the saved appearance loads. Branding initialization never changes this loader. `AppComponent` removes it with `afterNextRender` after the first application render. The skeleton adapts to phones and disables its pulse for reduced motion.

Warm, diffuse sunlight, gold beams and small drifting light motes add depth across the homepage. Desktop ambient motion uses opacity and transforms. Phones receive static light; reduced-motion settings disable animations and hide motes. Light layers do not intercept interaction or affect layout. The separate story introduction fades light at its edges rather than displaying a rectangular panel.

Lumen's story gallery excludes the bundled `/brand/noli-*` character illustrations. Merchant-uploaded photographs and the saved gallery configuration are preserved. The lightbox navigates the filtered photograph list; an empty gallery is hidden. Noli and the original appearance retain their existing gallery. Product catalog images remain the merchant's images.

`BrandingService` recognizes `default`, `noli` and `lumen`. Lumen customization is stored separately under `lumen-theme-config`. Shared responsive layouts use the server-initialized `data-studio` attribute for Noli and Lumen; brand-specific styles remain scoped to `html[data-brand='lumen']` or `html[data-brand='noli']`. The existing `--noli-header-height` variable is retained as a compatibility alias for shared layout offsets.

Lumen honours the administrator's existing payment-method configuration. Noli retains its cash-only policy. Selecting a theme does not rewrite product names, manufacturer brands, images, gallery data, orders or payment settings. Existing Noli-branded demo records therefore remain merchant data until edited through normal catalog/site settings.

## Validation

Verified locally on 2026-10-26:

- Production Angular build.
- 52 frontend tests, including Lumen bootstrap, metadata, isolated customization, bilingual category labels, payment configuration, gallery/lightbox isolation, startup skeleton removal after rendering and navigation that preserves router scroll restoration.
- 63 backend tests, including administrator persistence of Lumen and rejection of invalid theme identifiers.
- Translation check: 1,758 matching Serbian/English entries.
- Browser checks of theme selection, customer denial of admin access, Serbian/English navigation, phone/desktop homepage, login, products, cart and responsive checkout. A product was added to the local test cart and removed after the check. No order was submitted.
- Responsive refinement checks at 320, 390, 768, 1,024 and 1,440 CSS pixels cover the homepage, story, shop, product details and administration. Login also covers the 761–767 pixel transition. Product purchase controls retain a minimum height of 44 pixels; favourites have a Lumen page title and empty states use restrained spacing.
- Figma homepage checks confirm all ten local photographs load, collection scrolling reaches and disables its end control, editorial links apply the correct catalog filter, and the homepage fits all five viewport sizes without horizontal page overflow.

Switch back to Noli or the original Web Shop in the same administrator control. No rebuild or database rollback is required.
