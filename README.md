# Domeček Janov

Prémiový one-page web ubytování v Českém Švýcarsku. Projekt je rozdělený podle nastavení Sanity na:

- `web/` - Next.js 16, React 19, TypeScript a Tailwind CSS
- `studio/` - samostatné Sanity Studio pro projekt `lli7g5ge`, dataset `production`

## Lokální vývoj

```bash
npm install
npm run dev:web
npm run dev:studio
```

Web poběží na `http://localhost:3000`, Studio standardně na `http://localhost:3333`.
Pokud zatím v Sanity není publikovaný obsah, web bezpečně použije lokální počáteční
obsah a fotografie.

## Sanity

Zkopírujte `studio/.env.example` do `studio/.env.local`. Pro jednorázové nahrání
počátečního obsahu a lokálních fotografií vytvořte v Sanity token s právem zápisu,
nastavte `SANITY_API_WRITE_TOKEN` a spusťte:

```bash
npm run seed --workspace studio
```

Seed používá stabilní ID dokumentů, takže jej lze bezpečně spustit znovu. Nová
letecká fotografie se později vymění v dokumentu **Nastavení webu → Hlavní
fotografie**.

## Mapa výletů

Sekce **Výlety po okolí** obsahuje interaktivní mapu (Leaflet). Kliknutí na cíl
vykreslí pěší trasu z výchozího bodu - u části výletů je jím přímo domeček.

Trasy se v prohlížeči **nepočítají**. Jsou předgenerované do
`web/src/data/trip-routes.json` a web tedy za běhu nevolá žádné routovací API:

```bash
MAPY_API_KEY=... npm run build:routes --workspace web
```

Skript použije Mapy.com s profilem `foot_hiking`, který kopíruje značené KČT
stezky. Bez klíče spadne na BRouter (profil `hiking-beta` nad daty OSM) - trasy
pak také vedou po značených cestách, ale obcházejí místa s omezeným přístupem
(například turniket u Pravčické brány), takže bývají delší.

Podklad mapy řídí `NEXT_PUBLIC_MAPY_API_KEY`:

| klíč | podklad |
| --- | --- |
| nastaven | turistická mapa Mapy.com (`outdoor`) včetně loga podle licence |
| chybí | OpenStreetMap + vrstva Waymarked Trails se značenými trasami |

Klíč vytvoříte na [developer.mapy.com](https://developer.mapy.com). V projektu
musí být povolené funkce **Mapové dlaždice** a **Plánování tras**, jinak API
vrací `403 Forbidden`. Veřejný klíč omezte na doménu webu.

Zdroj dat o výletech je `web/src/data/trips.ts` - po jeho úpravě je potřeba
`npm run build:routes` spustit znovu, jinak by se rozešly značky s trasami.

## Coolify

Nasazení používá kořenový `Dockerfile`, Node 22, port `3000` a healthcheck
`/api/health`. V Coolify nastavte:

```text
NEXT_PUBLIC_SANITY_PROJECT_ID=lli7g5ge
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SITE_URL=https://www.domecekjanov.cz
```

Build context je kořen repozitáře a Dockerfile je `./Dockerfile`. Sanity Studio lze
nasadit samostatně příkazem `npm run build:studio` nebo provozovat přes Sanity
hosting příkazem `npm run deploy --workspace studio`.

## Statická ukázka na GitHub Pages

Workflow `.github/workflows/pages.yml` sestaví čistě statickou verzi z lokálního
počátečního obsahu a fotografií. Při tomto buildu se Sanity nepoužívá. Náhled je
publikovaný na:

```text
https://kroufekd.github.io/domacekjanov-cz/
```

Stejný export lze lokálně ověřit příkazem:

```bash
STATIC_EXPORT=true NEXT_PUBLIC_BASE_PATH=/domacekjanov-cz npm run build:web
```

## Ověření

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e --workspace web
```
