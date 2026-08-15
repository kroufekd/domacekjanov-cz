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

### Automatická synchronizace Studia

Po každém mergi do masteru, který sáhne na `studio/**` nebo na texty výletů,
běží `.github/workflows/sanity-sync.yml` a udělá dvě věci:

```bash
npm run sync:trips --workspace studio   # 1. doplní chybějící výlety do datasetu
npm run deploy --workspace studio       # 2. nasadí schéma na domecek-janov.sanity.studio
```

Synchronizace umí jedinou operaci, `createIfNotExists`. **Nic nepřepisuje a nic
nemaže**, takže nasazení nemůže sáhnout na to, co majitel ve Studiu upravil -
chybějící výlet doplní, existující nechá být. Proto mají dokumenty ID
`trip-text-<id>`: staré `tripTip` se jmenovaly `trip-<id>` a jinak by se kryly.

Pořadí kroků je záměrné - kdyby deploy Studia selhal, výlety v datasetu už jsou
a stačí Studio nasadit ručně.

Obojí potřebuje repo secret `SANITY_API_WRITE_TOKEN` (token role Developer
z [sanity.io/manage](https://sanity.io/manage) → projekt → API → Tokens); ten
samý patří do `studio/.env.local` pro ruční spuštění:

```bash
gh secret set SANITY_API_WRITE_TOKEN
```

Bez tokenu se oba kroky přeskočí s varováním, workflow kvůli tomu nespadne.
Ke *čtení* obsahu web **žádný token nepotřebuje** - bere veřejný dataset přes
CDN. Token do Coolify přidává až editační režim níže.

## Úprava textů z webu

Majitel nemusí do Studia. Na `https://www.domecekjanov.cz/?edit` se objeví
dialog s PINem a po jeho zadání dílna: vlevo web v rámu, vpravo panel se všemi
texty rozdělenými po sekcích. Obě strany jsou svázané:

- **Psaní v panelu se rovnou promítá do stránky**, takže je vidět, jak to bude
  vypadat, ještě než se uloží.
- **Psát jde i rovnou do stránky.** Text pod kurzorem se orámuje, kliknutím se
  do něj začne psát a hodnota se objeví v panelu. Enter psaní ukončí, Escape ho
  vrátí. Přepínačem „Psát rovnou do stránky“ se to vypne, když je potřeba po
  webu jen klikat.
- **Scroll rámu táhne panel.** Jak se čtenář posouvá po stránce, panel otevírá
  odpovídající sekci a doskakuje na text, který je zrovna vidět. Kliknutí do
  pole v panelu naopak odscrolluje rám. Po zásahu z panelu je synchronizace
  chvíli zticha, jinak by se obě strany přetahovaly.
- „Zahodit“ vrátí rozdělané změny v panelu i v náhledu.

Web sedí v rámu schválně. Panel položený přes stránku by ji nejen zakrýval -
lepivá hlavička, hero a šířky počítané z `100vw` by pořád počítaly s celou
obrazovkou a rozjely by se. V rámu má web vlastní viewport a vypadá přesně jako
naostro, jen užší. Rám je ze stejné domény, takže se do něj sahá přímo; žádné
posílání zpráv sem tam.

Text se v rámu hledá podle obsahu, ne podle atributů - komponenty webu kvůli
tomu nemusely dostat žádné značky navíc. Dvě věci, které z toho plynou:

- Menu a patička opakují názvy sekcí („Galerie“, „Ceník“), takže se o stejné
  znění hlásí víc polí. Sporný text připadne tomu, které patří do stejné části
  stránky - položka menu hlavičce, nadpis sekce obsahu.
- Co se nenajde vůbec (typicky text, do kterého se před vykreslením doplňuje
  počet fotek nebo ročník ocenění), se v náhledu nemění a psát se do něj v
  stránce nedá. V panelu funguje normálně a po uložení se rám načte znovu.

Panel edituje **jazyk, ve kterém je stránka otevřená** - `/?edit` češtinu,
`/de?edit` němčinu. Ostatních jazyků se zápis nedotkne. Prázdné pole se
neuloží: normalizace obsahu bere prázdnou hodnotu jako „nevyplněno“ a text by
se vrátil na vestavěné znění.

Režim se zapíná třemi proměnnými prostředí naráz. Chybí-li kterákoli, celé API
odpovídá 404 a `?edit` nic neudělá - stejně jako když web čte obsah z repa
(`CONTENT_SOURCE=fallback` nebo statický export), protože tam by se uložený
text stejně nikde neprojevil.

| Proměnná | K čemu |
| --- | --- |
| `EDIT_PIN` | Přihlášení do panelu, nejméně 6 znaků. |
| `EDIT_SECRET` | Podpis přihlašovací cookie, nejméně 32 znaků (`openssl rand -hex 32`). Změna odhlásí všechny. |
| `SANITY_API_WRITE_TOKEN` | Token role Editor, kterým se zapisuje do datasetu. |

Žádná z nich nesmí být `NEXT_PUBLIC_` - do prohlížeče nepatří ani jedna.

Co panel hlídá:

- Pět pokusů o PIN na IP za čtvrt hodiny a třicet celkem, aby střídání adres
  hádání nezlevnilo.
- Cesty k polím se z prohlížeče nepřebírají. Klient posílá jen klíč do seznamu,
  který si server odvodí z obsahu sám, takže se zápis nedostane mimo texty.
- Před uložením se dokument načte a pošle zpátky s `ifRevisionId`. Souběžná
  úprava ve Studiu tak skončí hláškou místo tichého přepsání.
- Editační API běží v souborech `route.node.ts`. Statický export takovou routu
  neumí, a `pageExtensions` v `web/next.config.ts` ji do něj proto nezahrne.

Panel je jen na texty - včetně názvů a částek v ceníku. Fotky, jejich pořadí,
kategorie, geometrie výletů a schéma zůstávají ve Studiu na
[domecek-janov.sanity.studio](https://domecek-janov.sanity.studio).

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

Workflow `.github/workflows/ci.yml` pouští to samé na každém PR i na pushi do
`master`, ve dvou jobech (typy/lint/build a Playwright).

### CONTENT_SOURCE

Kde se obsah bere:

| Hodnota | Chování |
| --- | --- |
| nenastaveno, `sanity` | čte se ze Sanity, fallback jen když dotaz selže |
| `fallback` | Sanity se přeskočí, obsah jde výhradně z repa |

CI běží s `CONTENT_SOURCE=fallback`, aby si nesahalo na živý dataset klienta -
`web/src/sanity/env.ts` má project ID natvrdo jako fallback, takže bez toho by
build tahal obsah z produkčního CMS a editace ve Studiu by mohla shodit testy.
Statický export (`STATIC_EXPORT=true`) čte z repa vždy. Jiná hodnota než
`sanity` nebo `fallback` build shodí, ať se tiše nečte z produkce.

Stejné přepnutí lze pustit lokálně:

```bash
CONTENT_SOURCE=fallback npm run test:e2e --workspace web
```

E2E testy si samy sestaví a spustí web na portu `3100`. Pokud je port obsazený,
předejte jiný přes `E2E_PORT`:

```bash
E2E_PORT=3187 npm run test:e2e --workspace web
```
