/**
 * Translatable fields come back as raw `{ cs, de, en }` objects and are
 * resolved in `@/lib/content/from-sanity`. Keeping the resolution in TypeScript
 * instead of GROQ means one query serves every language and documents written
 * before the site went multilingual keep working.
 */

const imageProjection = (field: string) => `{
    "id": ${field}.asset->_id,
    "src": ${field}.asset->url,
    "alt": ${field}.alt,
    "width": ${field}.asset->metadata.dimensions.width,
    "height": ${field}.asset->metadata.dimensions.height
  }`;

export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  title,
  description,
  seoTitle,
  seoDescription,
  "seoImage": ${imageProjection("seoImage")},
  phone,
  phoneDisplay,
  email,
  address,
  heroEyebrow,
  heroTitle,
  heroDescription,
  "heroImage": ${imageProjection("heroImage")},
  matterportUrl,
  calendarUrl,
  listingUrl,
  mapUrl,
  facebookUrl,
  instagramUrl
}`;

export const siteCopyQuery = `*[_type == "siteCopy"][0]`;

export const accommodationQuery = `*[_type == "accommodation"][0] {
  introTitle,
  introText,
  capacity,
  bedrooms,
  gardenArea,
  facts[]{value, label},
  rooms[]{title, description},
  amenities[]{title, items}
}`;

export const galleryQuery = `*[_type == "galleryItem"] | order(order asc) {
  "id": _id,
  "src": image.asset->url,
  "width": image.asset->metadata.dimensions.width,
  "height": image.asset->metadata.dimensions.height,
  alt,
  caption,
  category,
  featured
}`;

export const ratesQuery = `*[_type == "rate" && active != false] | order(order asc) {
  "id": _id,
  title,
  price,
  unit,
  note,
  featured
}`;

/**
 * Texty cílů na mapě. Pořadí ani souřadnice odsud nechodí - ty drží
 * `@/data/trips` a dokument se s bodem páruje přes `tripId`.
 */
export const tripTextsQuery = `*[_type == "trip" && defined(tripId)] {
  tripId,
  title,
  startName,
  summary,
  note
}`;
