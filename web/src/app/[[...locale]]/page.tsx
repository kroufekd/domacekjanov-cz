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
import { notFound } from "next/navigation";

import { Availability } from "@/components/availability";
import { BookingAward } from "@/components/booking-award";
import { Brand } from "@/components/brand";
import { Gallery } from "@/components/gallery";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { MatterportTour } from "@/components/matterport-tour";
import { HeadingText, SectionHeading } from "@/components/section-heading";
import { TripMap } from "@/components/trip-map";
import {
  defaultLocale,
  getDictionary,
  localeFromSegments,
  localeHref,
  localeMeta,
  locales,
  localeSegments,
} from "@/i18n";
import { getSiteContent } from "@/lib/content";
import { localAsset } from "@/lib/paths";
import { getTrips } from "@/lib/trips";
import { buildStructuredData } from "@/lib/structured-data";

const featureIcons = [UsersRound, BedDouble, Trees, Sparkles];
const amenityIcons = [Flame, Waves, ShieldCheck];
const comfortIcons = [Accessibility, Baby, ChefHat, Wifi, Bath];

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.domecekjanov.cz";

type HomePageProps = {
  params: Promise<{ locale?: string[] }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale: localeSegments(locale) }));
}

// Note: do not add `dynamicParams = false` here. Combined with an optional
// catch-all it makes `next start` answer 404 for every prefixed language even
// though the pages are prerendered. Unknown prefixes are turned away by the
// `notFound()` below instead.

const languageAlternates = Object.fromEntries([
  ...locales.map((locale) => [localeMeta[locale].htmlLang, localeHref(locale)]),
  ["x-default", localeHref(defaultLocale)],
]);

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale: segments } = await params;
  const locale = localeFromSegments(segments);
  if (!locale) return {};

  const { settings } = await getSiteContent(locale);
  const socialImage = settings.seoImage || settings.heroImage;

  return {
    title: settings.seoTitle || settings.title,
    description: settings.seoDescription || settings.description,
    alternates: {
      canonical: localeHref(locale),
      languages: languageAlternates,
    },
    openGraph: {
      type: "website",
      url: localeHref(locale),
      siteName: settings.title,
      locale: localeMeta[locale].ogLocale,
      alternateLocale: locales
        .filter((item) => item !== locale)
        .map((item) => localeMeta[item].ogLocale),
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
    twitter: {
      card: "summary_large_image",
      title: settings.seoTitle || settings.title,
      description: settings.seoDescription || settings.description,
      images: [socialImage.src],
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale: segments } = await params;
  const locale = localeFromSegments(segments);
  if (!locale) notFound();

  const dictionary = getDictionary(locale);
  const content = await getSiteContent(locale);
  // `tripTips` ze Sanity už stránka nevypisuje - seznam cílů si drží sama mapa.
  const { settings, accommodation, copy, gallery, rates } = content;
  const structuredData = buildStructuredData(content, locale, siteUrl);

  // Grouping differs per language: 4 000 m² in Czech, 4.000 m² in German.
  const gardenArea = `${new Intl.NumberFormat(
    localeMeta[locale].htmlLang,
  ).format(accommodation.gardenArea)} m²`;

  return (
    <>
      <Header
        phone={settings.phone}
        locale={locale}
        copy={copy}
        dictionary={dictionary}
      />
      <main id="hlavni-obsah">
        <Hero
          settings={settings}
          accommodation={accommodation}
          copy={copy}
          dictionary={dictionary}
        />

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
                eyebrow={copy.story.eyebrow}
                title={accommodation.introTitle}
              />
              <div className="story-copy__text">
                {accommodation.introText.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <a className="text-link" href="#galerie">
                {copy.actions.lookInside}
                <ArrowRight aria-hidden="true" size={18} />
              </a>
            </div>
            <div className="story-collage" aria-label={dictionary.alt.storyCollage}>
              <figure className="story-collage__main">
                <Image
                  src={localAsset("/images/kitchen-dining.jpg")}
                  alt={dictionary.alt.storyMain}
                  fill
                  sizes="(max-width: 800px) 92vw, 46vw"
                />
              </figure>
              <figure className="story-collage__detail">
                <Image
                  src={localAsset("/images/living-room.jpg")}
                  alt={dictionary.alt.storyDetail}
                  fill
                  sizes="(max-width: 800px) 48vw, 22vw"
                />
              </figure>
              <p className="hand-note">
                <span>{copy.story.noteAccent}</span>
                {copy.story.noteRest}
              </p>
            </div>
          </div>
        </section>

        <section className="section garden-section topo-texture">
          <div className="page-shell">
            <div className="garden-heading-row">
              <SectionHeading
                eyebrow={copy.garden.eyebrow}
                title={copy.garden.title}
                description={copy.garden.description}
              />
              <div className="garden-stamp" aria-hidden="true">
                <Trees />
                <span>{gardenArea}</span>
                <small>{copy.garden.stampNote}</small>
              </div>
            </div>
            <div className="garden-visual">
              <figure className="garden-visual__wide">
                <Image
                  src={localAsset("/images/hot-tub-terrace.jpg")}
                  alt={dictionary.alt.gardenWide}
                  fill
                  sizes="(max-width: 900px) 94vw, 72vw"
                />
              </figure>
              <div className="garden-visual__card">
                <Waves aria-hidden="true" />
                <h3>{copy.garden.cardTitle}</h3>
                <p>{copy.garden.cardText}</p>
                <span>{copy.garden.cardPrice}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="vybaveni" className="section rooms-section">
          <div className="page-shell">
            <SectionHeading
              eyebrow={copy.rooms.eyebrow}
              title={copy.rooms.title}
              description={copy.rooms.description}
            />

            <div className="rooms-showcase">
              <figure className="rooms-showcase__image">
                <Image
                  src={localAsset("/images/bedroom-double.jpg")}
                  alt={dictionary.alt.roomsShowcase}
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
              {copy.rooms.comfort.map((item, index) => {
                const Icon = comfortIcons[index % comfortIcons.length];
                return (
                  <span key={item}>
                    <Icon aria-hidden="true" />
                    {item}
                  </span>
                );
              })}
            </div>
          </div>
        </section>

        <section id="galerie" className="section gallery-section paper-texture">
          <div className="page-shell">
            <SectionHeading
              eyebrow={copy.gallery.eyebrow}
              title={copy.gallery.title}
              description={copy.gallery.description}
            />
            <Gallery
              images={gallery}
              copy={copy.gallery}
              actions={copy.actions}
              dictionary={dictionary.gallery}
            />
          </div>
        </section>

        <section id="3d-prohlidka" className="section tour-section">
          <div className="page-shell">
            <SectionHeading
              eyebrow={copy.tour.eyebrow}
              title={copy.tour.title}
              description={copy.tour.description}
              light
            />
            <MatterportTour
              url={settings.matterportUrl}
              copy={copy.tour}
              actions={copy.actions}
              iframeTitle={dictionary.tour.iframeTitle}
              posterAlt={dictionary.alt.tourPoster}
            />
          </div>
        </section>

        <section id="okoli" className="section trips-section topo-texture">
          <div className="page-shell">
            <div className="trips-intro">
              <SectionHeading
                eyebrow={copy.trips.eyebrow}
                title={copy.trips.title}
                description={copy.trips.description}
              />
              <a
                className="button button--outline"
                href={settings.mapUrl}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin aria-hidden="true" size={18} />
                {copy.actions.showOnMap}
              </a>
            </div>
            <TripMap
              locale={locale}
              dictionary={dictionary.trips}
              trips={getTrips(locale)}
            />
          </div>
        </section>

        <section id="cenik" className="section pricing-section">
          <div className="page-shell">
            <SectionHeading
              eyebrow={copy.pricing.eyebrow}
              title={copy.pricing.title}
              description={copy.pricing.description}
              align="center"
            />
            <div className="rates-grid">
              {rates.map((rate) => (
                <article
                  key={rate.id}
                  className={
                    rate.featured ? "rate-card rate-card--featured" : "rate-card"
                  }
                >
                  {rate.featured ? (
                    <span className="rate-card__tag">
                      {copy.pricing.featuredTag}
                    </span>
                  ) : null}
                  <h3>{rate.title}</h3>
                  <strong>{rate.price}</strong>
                  <span>{rate.unit}</span>
                  {rate.note ? <p>{rate.note}</p> : null}
                </article>
              ))}
            </div>
            <div className="pricing-notes">
              {copy.pricing.notes.map((note) => (
                <p key={note}>
                  <span>+</span>
                  {note}
                </p>
              ))}
            </div>
            <div className="pricing-action">
              <Availability
                listingUrl={settings.listingUrl}
                label={copy.actions.checkAvailability}
              />
              <p>{copy.pricing.calendarNote}</p>
            </div>
          </div>
        </section>

        <section id="kontakt" className="contact-section">
          <div className="contact-section__photo">
            <Image
              src={localAsset("/images/exterior-golden-hour.jpg")}
              alt={dictionary.alt.contactPhoto}
              fill
              sizes="100vw"
            />
            <div className="contact-section__veil" />
          </div>
          <div className="page-shell contact-layout">
            <div>
              <p className="eyebrow">{copy.contact.eyebrow}</p>
              <h2>
                <HeadingText title={copy.contact.title} />
              </h2>
              <p>{copy.contact.description}</p>
            </div>
            <div className="contact-card">
              <a href={`tel:${settings.phone}`}>
                <span>
                  <Phone aria-hidden="true" />
                  {copy.contact.phoneLabel}
                </span>
                <strong>{settings.phoneDisplay}</strong>
              </a>
              <a href={`mailto:${settings.email}`}>
                <span>
                  <Mail aria-hidden="true" />
                  {copy.contact.emailLabel}
                </span>
                <strong>{settings.email}</strong>
              </a>
              <a href={settings.mapUrl} target="_blank" rel="noreferrer">
                <span>
                  <MapPin aria-hidden="true" />
                  {copy.contact.addressLabel}
                </span>
                <strong>{settings.address}</strong>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-shell site-footer__inner">
          <a href="#nahoru" aria-label={dictionary.backToTop}>
            <Brand light label={settings.title} />
          </a>
          <p>{copy.footer.tagline}</p>
          <div className="site-footer__nav">
            <a href="#cenik">{copy.footer.pricingLink}</a>
            <a href={settings.mapUrl} target="_blank" rel="noreferrer">
              {copy.footer.mapLink}
            </a>
            {settings.instagramUrl ? (
              <a href={settings.instagramUrl} target="_blank" rel="noreferrer">
                {copy.footer.instagramLink}
              </a>
            ) : null}
            {settings.facebookUrl ? (
              <a href={settings.facebookUrl} target="_blank" rel="noreferrer">
                {copy.footer.facebookLink}
              </a>
            ) : null}
          </div>
          <div className="site-footer__bottom">
            <small>
              © {new Date().getFullYear()} {settings.title}
            </small>
            <BookingAward
              variant="footer"
              copy={copy.award}
              dictionary={dictionary.award}
            />
          </div>
        </div>
      </footer>

      <div className="mobile-contact-bar">
        <a href={`tel:${settings.phone}`}>
          <Phone aria-hidden="true" size={17} />
          {copy.actions.call}
        </a>
        <a href="#cenik">
          {copy.actions.datesAndPrices}
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
