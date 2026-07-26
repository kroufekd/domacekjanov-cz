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

## Ověření

```bash
npm run typecheck
npm run lint
npm run build
npm run test:e2e --workspace web
```
