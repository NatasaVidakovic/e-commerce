# Web Shop App - jedini audit i status fajl

Datum zadnje dopune: 2026-06-07

Ovaj fajl je centralno mjesto za provjeru stanja aplikacije. U njemu su spojeni raniji audit, sigurnosni plan, remediation izvjestaj, lokalni secret zahtjevi, zadnje izmjene i preostale stavke. Stari `.md` dokumenti u `docs` su uklonjeni da ne bude vise paralelnih izvora istine.

## Kratka ocjena

- Kvalitet aplikacije: dobar, sa jasnom layered backend arhitekturom i Angular frontend strukturom.
- Sigurnost koda: znacajno popravljena; admin endpointi, CSRF, cookie auth, rate limiting, upload hardening i generic login greske su pokriveni.
- Brzina: lokalni smoke i build su dobri; full load test nije radjen.
- Spremnost za javno koristenje: nije potpuno spremno dok se ne rijese operativne stavke: real Redis, checkout E2E, Google OAuth konfiguracija, rotacija credentiala, monitoring i admin MFA/step-up.

## Sta je izmijenjeno

### Auth, session i CSRF

- Uklonjeno automatsko mapiranje Identity API endpointa pod `/api`, tako da se koristi kontrolisani `AccountController`.
- Login greske su genericke: ne otkrivaju da li email postoji, da li je lozinka pogresna ili da li je nalog Google-only.
- `forgot-password` vraca genericku poruku i za Google-only naloge, a detalj se loguje interno.
- Reset password submit je rate-limited.
- Identity politika je eksplicitna: unique email, lockout 5 pokusaja / 15 minuta, password minimum 8 karaktera, reset token 1 sat.
- Logout salje `Clear-Site-Data`.
- Cookie auth sada vraca 401/403 za API umjesto browser redirecta.
- Dodata antiforgery konfiguracija:
  - HttpOnly backend antiforgery cookie `WebShop.Antiforgery`.
  - Readable frontend token cookie `XSRF-TOKEN`.
  - Angular salje `X-XSRF-TOKEN` na unsafe metode.

### Authorization i vlasnistvo podataka

- Product discount mutation endpointi su admin-only.
- Review create/update/delete endpointi traze authenticated user-a.
- Review update/delete dozvoljava samo vlasniku recenzije ili adminu.
- Cart ownership je ojacan: authenticated cart se veze za email, a tudji cart se odbija.
- Frontend vise ne koristi email-derived cart id, nego random `nanoid()` id.
- User order reads su scoped na trenutni email.
- Admin/reports/settings/voucher/refund/product mutation rute su zasticene role-based autorizacijom.

### Products, discounts i filtering

- Popravljen filter promotivnih cijena: `discountedOnly=true` vise ne koristi EF LINQ izraz koji se ne prevodi, nego prvo izvlaci aktivne discount product id-jeve pa filtrira proizvode.
- Aktivni discount date filteri su prebaceni na opseg `today/tomorrow` bez `.Date` izraza u queryju.
- Dodata migracija `20260607195802_FixOrderTrackingAndDecimalPrecision` sa indeksima:
  - `ProductDiscounts.DiscountsId`,
  - `Discounts.IsActive`,
  - `Discounts.IsActive, DateFrom, DateTo`.
- Dynamic filtering je parametrizovan da vrijednosti ne idu direktno u Dynamic LINQ expression string.
- Server-side grid paging je normalizovan:
  - invalid `PageSize` ide na 20,
  - maksimalni `PageSize` je 100,
  - invalid/current page se clampuje na validan opseg.

### Orders, checkout, refund i placanje

- Order creation ponovno racuna cijene na backendu.
- Stock se validira i umanjuje u serializable transakciji prilikom kreiranja ordera.
- Refund item podaci se validiraju prema originalnim order itemima; ime/cijena se uzimaju sa servera, ne iz client payload-a.
- EF decimal precision warning je zatvoren za `Order.RefundAmount`, `OrderItem.OriginalUnitPrice`, `RefundItem.Price`, `Voucher.AmountOff` i `Voucher.PercentOff`.
- `OrderTracking` owned model je sada required i inicijalizovan na `Order` entitetu, bez rizinog `ALTER COLUMN` nad postojecim tracking string kolonama.
- Stripe publishable key se cita runtime preko `GET /api/payments/config`.
- Stripe webhook provjerava payment amount prije oznacavanja ordera kao placenog.
- Guest checkout `POST /api/orders` je ostao javan namjerno, ali je sada rate-limited (`order-create`, 10 pokusaja po IP-u / 15 minuta).
- `CreateOrderDto` ima dodatne granice:
  - `CartId` max 128,
  - `SpecialNotes` max 1000,
  - `VoucherCode` max 64,
  - `GuestName` max 120,
  - `GuestEmail` email format + max 256,
  - `GuestPhone` max 40.

### Upload i slike

- Upload proizvoda/galerije je admin-only.
- Upload validira ekstenziju, MIME type, velicinu, decode slike i pixel limit.
- Dodata magic-byte provjera za JPEG, PNG, GIF i WebP.
- Slike se re-enkodiraju u WebP varijante.
- Local static file serving dozvoljava samo image ekstenzije.
- About mapa vise ne koristi `innerHTML` za adresu; fallback DOM se gradi sa `textContent`.

### Frontend jasnoca i UX

- Reset password frontend validator i prevodi su uskladjeni na minimum 8 karaktera.
- Register forma sada ima `Validators.minLength(8)`.
- Shared text input prikazuje `minlength` gresku.
- Uklonjena public `test-error` ruta i debug logging iz product details toka.
- Angular startup je tolerantniji na anonymous/offline API startup greske.
- Dodati/azurirani SEO/social metadata i build budget/Sass cleanup iz ranijeg prolaza.

### Production hardening

- Swagger je ogranicen na Development.
- Production CORS zahtijeva explicit trusted origins.
- Dodati HTTPS redirection, HSTS izvan developmenta, forwarded headers i security headers:
  - `X-Content-Type-Options`,
  - `X-Frame-Options`,
  - `Referrer-Policy`,
  - `Permissions-Policy`,
  - CSP.
- Dodato security audit logovanje za 401/403/429.
- Production SameSite cookie mod je deployment-aware.

### Testovi dodani

- Backend `API.Tests` pokriva:
  - product discount admin authorization metadata,
  - review auth metadata,
  - Google return URL normalization,
  - dynamic filtering injection-like payload tretiran kao data,
  - refund item validation/server-derived fields,
  - table paging clamp/defaults,
  - review DTO validation,
  - order DTO validation,
  - guest order rate-limit metadata.
- Prosireni su authorization metadata testovi za:
  - voucher admin rute,
  - refund admin rute,
  - user order read rute,
  - explicit anonymous + rate-limited guest order create,
  - controller-level admin zastitu za `AdminController` i `ReportsController`.
- Angular root component spec provjerava shell render uz mock startup servise.

## Zadnja verifikacija

Komande koje su prosle lokalno:

- `dotnet build .\webshop.sln --no-restore`: proslo, 0 warninga.
- `dotnet test .\webshop.sln --no-build`: proslo, 45/45.
- `dotnet list .\webshop.sln package --vulnerable --include-transitive`: nema ranjivih NuGet paketa.
- `npm run build`: proslo.
- `npm test -- --watch=false --browsers=ChromeHeadless`: proslo, 2/2.
- `npm audit --audit-level=low`: 0 vulnerabilities.
- Nova EF migracija je lokalno primijenjena pri API startu: `20260607195802_FixOrderTrackingAndDecimalPrecision`.
- `git diff --check`: proslo bez whitespace gresaka; postoje samo Git LF/CRLF upozorenja.

Live smoke:

- `GET /api/products/brands`: 200.
- `POST /api/products/filter?discountedOnly=true`: 200.
- `GET /api/orders` bez sesije: 401.
- In-app browser reload `https://localhost:4200/` je blokiran od browser runtime-a sa `ERR_BLOCKED_BY_CLIENT`; serveri su ipak aktivni i API smoke prolazi.

Trenutno lokalno:

- Frontend: `https://localhost:4200`
- API: `https://localhost:5001`

## Sta je ostalo da se popravi

### Visok prioritet

1. Real Redis i full cart/checkout test
   - Problem: privremeni local Redis shim nije dovoljan za pouzdan StackExchange.Redis write path.
   - Sta uraditi: pokrenuti real Redis preko Docker Desktopa ili lokalnog Redis servisa sa konfigurisanom lozinkom, restartovati API, pa testirati cart update, payment intent, guest checkout, authenticated checkout i order status.
   - Slozenost: srednja.

2. Rotacija ranije izlozenih credentiala
   - Problem: raniji audit je nasao da su kredencijali bili commitovani ili prisutni u konfiguracijama.
   - Sta uraditi: rotirati Stripe, Google, Mailjet, Supabase, SQL, Redis i Google Maps credentiale u providerima.
   - Slozenost: srednja.

3. Admin MFA / step-up auth
   - Problem: RBAC postoji, ali osjetljive admin akcije nemaju MFA ili dodatnu potvrdu identiteta.
   - Sta uraditi: uvesti MFA ili step-up provjeru za refund, order status, product mutation, voucher, reports i site settings.
   - Slozenost: srednja do velika.

4. Produkcioni monitoring i alerting
   - Problem: lokalni audit logging postoji, ali nema centralizovanih alert pravila.
   - Sta uraditi: slati 401/403/429, failed login, lockout, upload rejection, admin actions, refunds, payment mismatch i suspicious checkout events u centralni log/SIEM.
   - Slozenost: srednja.

### Srednji prioritet

5. Google OAuth redirect mismatch
   - Problem: Google Console ne prihvata lokalni redirect URI.
   - Sta uraditi: registrovati tacno `https://localhost:5001/signin-google` za local dev i produkcioni callback za deployment.
   - Slozenost: mala.

6. Role-boundary integration i E2E testovi
   - Problem: backend unit/metadata testovi su prosireni, ali nema dovoljno full integration/E2E pokrivenosti kroz stvarni browser/API tok.
   - Sta uraditi: dodati testove za anonymous/customer/admin, cart ownership, checkout, refunds, uploads i admin CRUD.
   - Slozenost: velika.

7. Incident response, backup i privacy procesi
   - Problem: kod ima sigurnosne kontrole, ali produkcioni operativni procesi nisu dokazani.
   - Sta uraditi: definisati restore-tested backup, RPO/RTO, PII inventory, data retention, export/delete i breach notification procedure.
   - Slozenost: srednja.

### Nizi prioritet

8. Frontend bundle/CSS optimizacija
    - Trenutno: production build prolazi; initial bundle oko 1.05 MB raw / 265 kB estimated transfer, global CSS oko 112 kB raw.
    - Sta uraditi: bundle analyzer, dodatno splitovanje admin/report modula i smanjenje shared/global CSS tezine.
    - Slozenost: srednja.

9. Refaktor velikih admin/frontend dijelova
    - Problem: pojedini admin/report/UI dijelovi su veliki i test coverage je nizak.
    - Sta uraditi: postepeno izdvajati manje komponente i dodavati focused unit/component testove.
    - Slozenost: srednja.

10. Canonical API inventory u CI
    - Problem: nema automatskog checka da se ne pojave neocekivani public endpointi.
    - Sta uraditi: generisati OpenAPI/API inventory i failati CI na neocekivane public rute.
    - Slozenost: srednja.

## Secret konfiguracija za lokalni/full run

Repo ne treba cuvati API kljuceve, lozinke, webhook secrets ili service-role tokene. Za full lokalni API run podesiti kroz environment variables, .NET user-secrets, Docker Compose env ili secret store:

- `ConnectionStrings__DefaultConnection`
- `ConnectionStrings__Redis`
- `ADMIN_USER_PASSWORD`
- `StripeSettings__PublishableKey`
- `StripeSettings__SecretKey`
- `StripeSettings__WhSecret`
- `Google__ClientId`
- `Google__ClientSecret`
- `MailjetSettings__ApiKey`
- `MailjetSettings__ApiSecret`
- `MailjetSettings__SenderEmail`
- `Supabase__ProjectUrl`
- `Supabase__ServiceRoleKey`

Ako je `ImageStorage__Provider=local`, Supabase vrijednosti nisu potrebne.

Za Docker Compose:

- `WEB_SHOP_DB_PASSWORD`
- `WEB_SHOP_REDIS_PASSWORD`

## Finalni odgovor na spremnost

Aplikacija je kvalitetno popravljena i ima dobru sigurnosnu osnovu, ali jos nije spremna za javni produkcioni launch dok se ne odrade:

1. real Redis i full checkout/cart E2E,
2. rotacija svih ranije izlozenih credentiala,
3. Google OAuth konfiguracija,
4. admin MFA/step-up,
5. centralizovani monitoring/alerting,
6. produkcioni backup/privacy/incident procesi.
