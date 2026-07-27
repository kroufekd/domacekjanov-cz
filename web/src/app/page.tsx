import {
  Accessibility,
  ArrowRight,
  Baby,
  Bath,
  BedDouble,
  Check,
  ChefHat,
  Flame,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Trees,
  UsersRound,
  Waves,
  Wifi,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";

import { Availability } from "@/components/availability";
import { Brand } from "@/components/brand";
import { Gallery } from "@/components/gallery";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { MatterportTour } from "@/components/matterport-tour";
import { SectionHeading } from "@/components/section-heading";
import { TripMap } from "@/components/trip-map";
import { getSiteContent } from "@/lib/content";
import { localAsset } from "@/lib/paths";

const featureIcons = [UsersRound, BedDouble, Trees, Sparkles];
const amenityIcons = [Flame, Waves, ShieldCheck];

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getSiteContent();
  const socialImage = settings.seoImage || settings.heroImage;

  return {
    title:
      settings.seoTitle ||
      `${settings.title} | Celá chalupa v Českém Švýcarsku`,
    description: settings.seoDescription || settings.description,
    openGraph: {
      title: settings.seoTitle || settings.heroTitle,
      description: settings.seoDescription || settings.description,
      images: [
        {
          url: socialImage.src,
          width: socialImage.width,
          height: socialImage.height,
          alt: socialImage.alt,
        },
      ],
    },
  };
}

export default async function HomePage() {
  const content = await getSiteContent();
  const { settings, accommodation, gallery, rates } = content;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["LodgingBusiness", "VacationRental"],
    name: settings.title,
    description: settings.description,
    url: "https://www.domecekjanov.cz",
    telephone: settings.phone,
    email: settings.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Janov 167",
      postalCode: "405 02",
      addressLocality: "Janov",
      addressCountry: "CZ",
    },
    image: gallery.slice(0, 8).map((item) =>
      item.src.startsWith("http")
        ? item.src
        : `https://www.domecekjanov.cz${item.src}`,
    ),
    numberOfBedrooms: accommodation.bedrooms,
    occupancy: {
      "@type": "QuantitativeValue",
      maxValue: accommodation.capacity,
    },
    amenityFeature: accommodation.amenities.flatMap((group) =>
      group.items.map((item) => ({
        "@type": "LocationFeatureSpecification",
        name: item,
        value: true,
      })),
    ),
  };

  return (
    <>
      <Header phone={settings.phone} />
      <main id="hlavni-obsah">
        <Hero settings={settings} accommodation={accommodation} />

        <section id="rychla-fakta" className="facts-section paper-texture">
          <div className="page-shell facts-grid">
            {accommodation.facts.map((fact, index) => {
              const Icon = featureIcons[index % featureIcons.length];
              return (
                <article key={`${fact.value}-${fact.label}`}>
                  <Icon aria-hidden="true" />
                  <strong>{fact.value}</strong>
                  <span>{fact.label}</span>
                </article>
              );
            })}
          </div>
        </section>

        <section id="o-domecku" className="section story-section">
          <div className="page-shell story-layout">
            <div className="story-copy">
              <SectionHeading
                eyebrow="O domečku"
                title={accommodation.introTitle}
              />
              <div className="story-copy__text">
                {accommodation.introText.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <a className="text-link" href="#galerie">
                Podívat se dovnitř
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
            <div className="story-collage" aria-label="Společné prostory">
              <figure className="story-collage__main">
                <Image
                  src={localAsset("/images/kitchen-dining.jpg")}
                  alt="Velká kuchyň a jídelna pro celou skupinu"
                  fill
                  sizes="(max-width: 800px) 92vw, 46vw"
                />
              </figure>
              <figure className="story-collage__detail">
                <Image
                  src={localAsset("/images/living-room.jpg")}
                  alt="Obývací pokoj s prostornou pohovkou"
                  fill
                  sizes="(max-width: 800px) 48vw, 22vw"
                />
              </figure>
              <p className="hand-note">
                <span>pro tři až čtyři rodiny</span>
                i partu dobrých přátel
              </p>
            </div>
          </div>
        </section>

        <section className="section garden-section topo-texture">
          <div className="page-shell">
            <div className="garden-heading-row">
              <SectionHeading
                eyebrow="Zahrada a terasa"
                title={
                  <>
                    Čtyři tisíce metrů
                    {" "}
                    <br className="heading-break" />
                    <em>oplocené zahrady.</em>
                  </>
                }
                description="Terasa s grilem míří na jih. Na zahradě je trampolína, houpačka a dětský domeček - a protože je pozemek celý oplocený, děti klidně pustíte z dohledu."
              />
              <div className="garden-stamp" aria-hidden="true">
                <Trees />
                <span>4 000 m²</span>
                <small>jen pro vás</small>
              </div>
            </div>
            <div className="garden-visual">
              <figure className="garden-visual__wide">
                <Image
                  src={localAsset("/images/terrace-hot-tub.jpg")}
                  alt="Terasa s posezením a vyhřívaným vířivým sudem"
                  fill
                  sizes="(max-width: 900px) 94vw, 72vw"
                />
              </figure>
              <div className="garden-visual__card">
                <Waves aria-hidden="true" />
                <h3>Vířivý sud</h3>
                <p>
                  Vyhřívaný koupací sud na terase. Když ho budete chtít,
                  připravíme ho na celý pobyt.
                </p>
                <span>2 000 Kč / pobyt</span>
              </div>
            </div>
          </div>
        </section>

        <section id="vybaveni" className="section rooms-section">
          <div className="page-shell">
            <SectionHeading
              eyebrow="Spaní & vybavení"
              title={
                <>
                  Patnáct lůžek
                  {" "}
                  <br className="heading-break" />
                  <em>v šesti ložnicích.</em>
                </>
              }
              description="Pět pokojů v patře, jeden bezbariérový v přízemí a k tomu dvě rozkládací pohovky v obýváku - dohromady až 17 míst na spaní."
            />

            <div className="rooms-showcase">
              <figure className="rooms-showcase__image">
                <Image
                  src={localAsset("/images/bedroom-double.jpg")}
                  alt="Světlá ložnice s manželskou postelí"
                  fill
                  sizes="(max-width: 900px) 94vw, 52vw"
                />
              </figure>
              <div className="rooms-list">
                {accommodation.rooms.map((room) => (
                  <article key={room.title}>
                    <h3>{room.title}</h3>
                    <p>{room.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="amenities-grid">
              {accommodation.amenities.map((group, index) => {
                const Icon = amenityIcons[index % amenityIcons.length];
                return (
                  <article key={group.title}>
                    <div className="amenities-grid__icon">
                      <Icon aria-hidden="true" />
                    </div>
                    <h3>{group.title}</h3>
                    <ul>
                      {group.items.map((item) => (
                        <li key={item}>
                          <Check aria-hidden="true" size={15} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>

            <div className="comfort-strip">
              <span>
                <Accessibility aria-hidden="true" />
                bezbariérový pokoj
              </span>
              <span>
                <Baby aria-hidden="true" />
                vybavení pro děti
              </span>
              <span>
                <ChefHat aria-hidden="true" />
                plně vybavená kuchyň
              </span>
              <span>
                <Wifi aria-hidden="true" />
                Wi‑Fi v celém domě
              </span>
              <span>
                <Bath aria-hidden="true" />
                dvě koupelny
              </span>
            </div>
          </div>
        </section>

        <section id="galerie" className="section gallery-section paper-texture">
          <div className="page-shell">
            <SectionHeading
              eyebrow="Galerie"
              title={
                <>
                  Podívejte se,
                  {" "}
                  <br className="heading-break" />
                  <em>jak to tu vypadá.</em>
                </>
              }
              description="Aktuální fotky domu - pokoje, kuchyň, zahrada i terasa."
            />
            <Gallery images={gallery} />
          </div>
        </section>

        <section id="3d-prohlidka" className="section tour-section">
          <div className="page-shell">
            <SectionHeading
              eyebrow="Virtuální návštěva"
              title={
                <>
                  Projděte si Domeček
                  {" "}
                  <br className="heading-break" />
                  <em>pokoj po pokoji.</em>
                </>
              }
              description="Otevřete dveře, nahlédněte do ložnic a ověřte si dispozici ještě před příjezdem."
              light
            />
            <MatterportTour url={settings.matterportUrl} />
          </div>
        </section>

        <section id="okoli" className="section trips-section topo-texture">
          <div className="page-shell">
            <div className="trips-intro">
              <SectionHeading
                eyebrow="Výlety po okolí"
                title={
                  <>
                    Každý den
                    {" "}
                    <br className="heading-break" />
                    <em>jiným směrem.</em>
                  </>
                }
                description="Janov leží na okraji národního parku České Švýcarsko, dva kilometry nad Hřenskem. Soutěsky, skalní vyhlídky i Pravčická brána jsou na dosah pěšky nebo pár minut autem."
              />
              <a
                className="button button--outline"
                href={settings.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin aria-hidden="true" size={18} />
                Ukázat na mapě
              </a>
            </div>
            <TripMap />
          </div>
        </section>

        <section id="cenik" className="section pricing-section">
          <div className="page-shell">
            <SectionHeading
              eyebrow="Ceny & volné termíny"
              title={
                <>
                  Celý dům.
                  {" "}
                  <br className="heading-break" />
                  <em>Žádní cizí hosté.</em>
                </>
              }
              description="Cena je vždy za celý Domeček. Stačí vybrat termín a zavolat nebo napsat - domluvíte se přímo s majitelem."
              align="center"
            />
            <div className="rates-grid">
              {rates.map((rate) => (
                <article
                  key={rate.id}
                  className={rate.featured ? "rate-card rate-card--featured" : "rate-card"}
                >
                  {rate.featured ? <span className="rate-card__tag">Nejoblíbenější</span> : null}
                  <h3>{rate.title}</h3>
                  <strong>{rate.price}</strong>
                  <span>{rate.unit}</span>
                  {rate.note ? <p>{rate.note}</p> : null}
                </article>
              ))}
            </div>
            <div className="pricing-notes">
              <p>
                <span>+</span>
                rekreační poplatek obci 20 Kč / dospělý / den
              </p>
              <p>
                <span>+</span>
                vířivý sud 2 000 Kč / pobyt
              </p>
            </div>
            <div className="pricing-action">
              <Availability listingUrl={settings.listingUrl} />
              <p>Kalendář obsazenosti najdete na e‑chalupy.cz.</p>
            </div>
          </div>
        </section>

        <section id="kontakt" className="contact-section">
          <div className="contact-section__photo">
            <Image
              src={localAsset("/images/exterior-wide.jpg")}
              alt="Domeček Janov a velká zahrada"
              fill
              sizes="100vw"
            />
            <div className="contact-section__veil" />
          </div>
          <div className="page-shell contact-layout">
            <div>
              <p className="eyebrow">Rezervace a dotazy</p>
              <h2>
                Těšíme se
                {" "}
                <br className="heading-break" />
                <em>na vaši partu.</em>
              </h2>
              <p>
                Rezervace jde přímo přes majitele, bez agentur a prostředníků.
                Zavolejte nebo napište, domluvíme termín i detaily.
              </p>
            </div>
            <div className="contact-card">
              <a href={`tel:${settings.phone}`}>
                <span>
                  <Phone aria-hidden="true" />
                  Telefon
                </span>
                <strong>{settings.phoneDisplay}</strong>
              </a>
              <a href={`mailto:${settings.email}`}>
                <span>
                  <Mail aria-hidden="true" />
                  E‑mail
                </span>
                <strong>{settings.email}</strong>
              </a>
              <a href={settings.mapUrl} target="_blank" rel="noreferrer">
                <span>
                  <MapPin aria-hidden="true" />
                  Adresa
                </span>
                <strong>{settings.address}</strong>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-shell site-footer__inner">
          <a href="#nahoru" aria-label="Domeček Janov – zpět nahoru">
            <Brand light />
          </a>
          <p>Ubytování pro rodiny, přátele a týmy v Českém Švýcarsku.</p>
          <div>
            <a href="#cenik">Ceny a termíny</a>
            <a href={settings.mapUrl} target="_blank" rel="noreferrer">
              Kde nás najdete
            </a>
            {settings.instagramUrl ? (
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer">
                Instagram
              </a>
            ) : null}
            {settings.facebookUrl ? (
              <a href={settings.facebookUrl} target="_blank" rel="noreferrer">
                Facebook
              </a>
            ) : null}
          </div>
          <small>© {new Date().getFullYear()} Domeček Janov</small>
        </div>
      </footer>

      <div className="mobile-contact-bar">
        <a href={`tel:${settings.phone}`}>
          <Phone aria-hidden="true" size={17} />
          Zavolat
        </a>
        <a href="#cenik">
          Termíny a ceny
          <ArrowRight aria-hidden="true" size={17} />
        </a>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
    </>
  );
}
