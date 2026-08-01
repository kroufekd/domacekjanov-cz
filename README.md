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

## Jazykové verze

Web běží ve třech jazycích. Čeština zůstává na kořenové adrese, ostatní jazyky
mají vlastní prefix:

```text
/      čeština
/de    němčina
/en    angličtina
```

Nepoužívá se middleware ani přesměrování, takže stejné routování funguje i pro
statický export. Přepínač jazyků je v hlavičce a při přepnutí si drží aktuální
kotvu na stránce, takže čtenář zůstane ve stejné sekci.

Texty mají dvě vrstvy:

- `web/src/lib/content/text/{cs,de,en}.json` - veškerý obsah webu ve třech
  jazycích. Slouží jako výchozí obsah i jako zdroj dat pro seed do Sanity.
- `web/src/i18n/dictionaries/*` - jen přístupnostní popisky a alternativní texty
  obrázků, tedy věci, které se v CMS needitují.

Ceny, telefony, odkazy a rozměry fotografií jsou v
`web/src/lib/content/shared.ts` jen jednou, aby se částky mezi jazyky nikdy
nerozešly.

Překlad z Sanity se čte striktně: pokud v daném jazyce chybí, použije se
vestavěné znění pro tentýž jazyk - nikdy se nemíchá čeština do německé stránky.
Položka seznamu (fotka, cena) bez překladu se v daném jazyce
nezobrazí; když takto vypadne celý seznam, nastoupí vestavěný.

## Sanity

Zkopírujte `studio/.env.example` do `studio/.env.local`. Pro jednorázové nahrání
počátečního obsahu a lokálních fotografií vytvořte v Sanity token s právem zápisu,
nastavte `SANITY_API_WRITE_TOKEN` a spusťte:

```bash
npm run seed --workspace studio
```

Seed nahraje všechny tři jazyky přímo z `web/src/lib/content/text/*.json` a texty
výletů z `web/src/data/trip-text/*.json`, takže Studio od začátku obsahuje
kompletní překlady. Nová letecká fotografie se později vymění v dokumentu
**Nastavení webu → Hlavní fotografie**. Zároveň uklidí dokumenty mrtvého typu
`tripTip` (sekce „Tipy na výlet“, kterou web přestal vypisovat po nasazení mapy).

> **Seed patří jen do prázdného projektu.** Zapisuje přes `createOrReplace`, takže
> na živém datasetu přemaže všechno, co majitel ve Studiu napsal. Na běžící web
> používejte synchronizaci níže.

### Synchronizace výletů

O to, aby se nové výlety z kódu objevily ve Studiu, se stará
`.github/workflows/sanity-sync.yml` - po každém mergi do masteru, který sáhne na
texty výletů nebo na skripty Studia:

```bash
npm run sync:trips --workspace studio   # totéž ručně
```

Skript umí jedinou operaci, `createIfNotExists`. **Nic nepřepisuje a nic nemaže**,
takže nasazení nemůže sáhnout na to, co majitel ve Studiu upravil - chybějící
výlet doplní, existující nechá být. Proto mají nové dokumenty ID `trip-text-<id>`:
staré `tripTip` se jmenovaly `trip-<id>` a jinak by se kryly.

Workflow potřebuje v repozitáři secret `SANITY_API_WRITE_TOKEN` (token s právem
zápisu z [sanity.io/manage](https://sanity.io/manage) → projekt → API → Tokens):

```bash
gh secret set SANITY_API_WRITE_TOKEN
```

Bez tokenu se krok jen přeskočí s varováním, nasazení kvůli němu nespadne.

### Struktura Studia

V levém sloupci jsou tři samostatné dokumenty a tři seznamy:

| Položka | Co obsahuje |
| --- | --- |
| Nastavení webu | název, kontakty, odkazy, úvodní obrazovka, SEO |
| Texty webu | všechny popisky rozhraní - menu, tlačítka, nadpisy sekcí, patička |
| Domeček a vybavení | úvodní odstavce, čísla, pokoje, skupiny vybavení |
| Fotografie / Ceny / Výlety na mapě | běžné seznamy dokumentů |

Každé přeložitelné pole je typu `localeString` nebo `localeText` a vykresluje se
jako tři sloupce vedle sebe - 🇨🇿 čeština, 🇩🇪 němčina, 🇬🇧 angličtina. Jedno pole
tedy vždy ukazuje všechny své varianty pohromadě.

Dvě konvence, které se hodí znát:

- V titulcích sekcí zalomí svislítko `|` řádek a text za ním se vysází kurzívou,
  například `Celý dům.|Žádní cizí hosté.`
- V textu „Zobrazit všech {count} fotek“ se `{count}` nahradí počtem fotografií.

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

### Texty výletů ve Studiu

Geometrie zůstává v kódu, **názvy, výchozí body, popisy a upozornění** ale řídí
Studio - seznam **Výlety na mapě**. Dokument se s bodem na mapě páruje polem
`Id výletu`, které se po uložení zamkne; id, které v `trips.ts` neexistuje, web
přeskočí a napíše to do serverového logu.

| Situace ve Studiu | Co uvidí host |
| --- | --- |
| pole vyplněné | text ze Studia |
| pole prázdné | vestavěný překlad z `web/src/data/trip-text/*.json` |
| dokument smazaný | vestavěný překlad ve všech jazycích |

Výjimkou je **Upozornění**: prázdné pole uzavírku z karty odstraní, aby po
znovuotevření stezky nešlo varování jen tak zaseknout. Proto Studio hlídá, že se
vyplní ve všech třech jazycích naráz - jinak by jeden z hostů vyrazil na
uzavřenou trasu bez varování.

Změna textu se projeví do minuty (`revalidate: 60`) a **nevyžaduje nový build
tras ani klíč k Mapy.com**.

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

E2E testy si samy sestaví a spustí web na portu `3100`. Pokud je port obsazený,
předejte jiný přes `E2E_PORT`:

```bash
E2E_PORT=3187 npm run test:e2e --workspace web
```
