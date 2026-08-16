# Domeček Janov

Prémiový one-page web ubytování v Českém Švýcarsku.

Celý web je jeden workspace `web/` - Next.js 16, React 19, TypeScript a Tailwind CSS.

## Lokální vývoj

```bash
npm install
npm run dev
```

Web poběží na `http://localhost:3000` a přečte obsah z repa. Pro práci nad
skutečným úložištěm se přidá `CONTENT_SOURCE=store` a adresář, viz níže.

## Kde je obsah

Texty, ceník a fotky drží jeden soubor `content.json` na připojeném svazku.
Spravuje ho editační panel na webu; žádné externí CMS v projektu není.

```text
/data/content.json     texty, ceník, popisky fotek
/data/media/           fotky nahrané z panelu
/data/history/         předchozí verze obsahu
```

Výchozí obsah je `web/src/data/content-seed.json`. Prázdný svazek se jím naplní
při prvním uložení a zároveň slouží jako záloha - viz *Záloha obsahu* níž.
Původních 35 fotek zůstává v `web/public/images` jako součást nasazení.

Adresář se přenastaví přes `CONTENT_DIR`, takže lokální vývoj nesahá na
produkční data:

```bash
CONTENT_SOURCE=store CONTENT_DIR=/tmp/domecek npm run dev
```

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
  jazycích. Slouží jako vestavěné znění, když v úložišti něco chybí.
- `web/src/i18n/dictionaries/*` - jen přístupnostní popisky a alternativní texty
  obrázků, tedy věci, které se v CMS needitují.

Ceny, telefony, odkazy a rozměry fotografií jsou v
`web/src/lib/content/shared.ts` jen jednou, aby se částky mezi jazyky nikdy
nerozešly.

Překlad se čte striktně: pokud v daném jazyce chybí, použije se
vestavěné znění pro tentýž jazyk - nikdy se nemíchá čeština do německé stránky.
Položka seznamu (fotka, cena) bez překladu se v daném jazyce
nezobrazí; když takto vypadne celý seznam, nastoupí vestavěný.

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

Režim se zapíná `EDIT_PIN` a `EDIT_SECRET` naráz, a jen když web čte z
úložiště. Chybí-li kterákoli podmínka, celé API odpovídá 404 a `?edit` nic
neudělá - se čtením z repa nebo ve statickém exportu by se uložený text stejně
nikde neprojevil.

| Proměnná | K čemu |
| --- | --- |
| `CONTENT_SOURCE` | Musí být `store`, jinak panel nemá kam zapisovat. |
| `EDIT_PIN` | Přihlášení do panelu, nejméně 6 znaků. |
| `EDIT_SECRET` | Podpis přihlašovací cookie, nejméně 32 znaků (`openssl rand -hex 32`). Změna odhlásí všechny a používá ho i záloha. |

Žádná z nich nesmí být `NEXT_PUBLIC_` - do prohlížeče nepatří ani jedna.

Co panel hlídá:

- Pět pokusů o PIN na IP za čtvrt hodiny a třicet celkem, aby střídání adres
  hádání nezlevnilo.
- Cesty k polím se z prohlížeče nepřebírají. Klient posílá jen klíč do seznamu,
  který si server odvodí z obsahu sám, takže se zápis nedostane mimo texty.
- Ukládání se řadí do fronty a soubor se přepisuje přes dočasnou kopii a
  přejmenování, takže pád uprostřed nenechá na disku půlku nové verze.
- Editační API běží v souborech `route.node.ts`. Statický export takovou routu
  neumí, a `pageExtensions` v `web/next.config.ts` ji do něj proto nezahrne.

### Fotky

Sekce **Fotky** v panelu umí nahrát fotku, přerovnat galerii, přepnout
kategorii, napsat alt text i popisek a fotku vyřadit. Na rozdíl od textů se
ukládá hned, proto je mazání na dvě kliknutí.

Fotky mají dvě bydliště a je to schválně:

| Adresa | Kde leží | Co dělá vyřazení |
| --- | --- | --- |
| `/images/…` | v repu, součást nasazení | vypustí ji ze seznamu, soubor zůstane |
| `/media/…` | na svazku, nahraná z panelu | smaže i soubor |

Formát a rozměry se čtou z hlavičky souboru, ne z `Content-Type` z formuláře -
ten si posílá prohlížeč. Co se nepodaří přečíst jako JPEG, PNG nebo WebP, se
nenahraje. Strop je 10 MB.

Geometrie výletů zůstává v kódu (`web/src/data/trips.ts`), texty výletů zatím
panel needituje.

## Záloha obsahu

`.github/workflows/content-backup.yml` si jednou denně stáhne obsah z běžícího
webu a commitne ho do `web/src/data/content-seed.json`, nahrané fotky do
`web/public/uploads/`. Záloha a výchozí obsah jsou schválně jeden a ten samý
soubor: kdyby se svazek ztratil, web naběhne z poslední zálohy.

**Stahuje se, netlačí.** Kontejner tak nepotřebuje zápisový přístup do
repozitáře - kdyby ho někdo prolomil, k historii projektu se nedostane.

Workflow potřebuje dva repo secrety; bez nich se přeskočí, ne že spadne:

```bash
gh secret set CONTENT_BACKUP_URL   # adresa běžícího webu, bez lomítka na konci
gh secret set EDIT_SECRET          # stejná hodnota jako v Coolify
```

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
CONTENT_SOURCE=store
NEXT_PUBLIC_SITE_URL=https://www.domecekjanov.cz
EDIT_PIN=…
EDIT_SECRET=…
```

**Appka potřebuje připojený svazek na `/data`.** Bez něj by obsah ležel v
dočasné vrstvě kontejneru a každý deploy by ho zahodil i s klientovými
úpravami. Adresář je v obrazu založený pod uid 1001, takže Docker z něj při
prvním připojení převezme vlastnictví - proto svazek zakládejte **až s
nasazením obrazu, který ho zná**, ne dřív.

> **`NEXT_PUBLIC_SITE_URL` musí být veřejná doména, nikdy adresa nasazení.**
> Čtou z ní `layout.tsx`, `robots.ts`, `sitemap.ts` i strukturovaná data, takže
> dosazená preview adresa (`*.sslip.io`) se propíše do `canonical`, `og:url`,
> hostu v `robots.txt` a do celé sitemapy - vyhledávačům se pak jako kanonická
> nabízí hostname, který po přepnutí DNS zmizí. Proměnná je build-time, projeví
> se až dalším buildem.

Build context je kořen repozitáře a Dockerfile je `./Dockerfile`.

## Statická ukázka na GitHub Pages

Workflow `.github/workflows/pages.yml` sestaví čistě statickou verzi z obsahu
v repu. Editační panel ani úložiště se v ní nepoužijí. Náhled je
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
| nenastaveno, `fallback` | obsah jde výhradně z repa |
| `store` | čte se `content.json` ze svazku, editační panel je zapnutý |

Výchozí je repo, ne úložiště: vývojářský stroj tak nikdy nesáhne na cizí data a
zapisovat se musí zapnout vědomě. Statický export (`STATIC_EXPORT=true`) čte z
repa vždy. Jiná hodnota build shodí, ať se tiše nečte odjinud.

E2E testy si samy sestaví a spustí web na portu `3100`. Pokud je port obsazený,
předejte jiný přes `E2E_PORT`:

```bash
E2E_PORT=3187 npm run test:e2e --workspace web
```
