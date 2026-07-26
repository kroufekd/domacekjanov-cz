export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  title,
  description,
  seoTitle,
  seoDescription,
  "seoImage": {
    "id": seoImage.asset->_id,
    "src": seoImage.asset->url,
    "alt": coalesce(seoImage.alt, "Domeček Janov"),
    "width": seoImage.asset->metadata.dimensions.width,
    "height": seoImage.asset->metadata.dimensions.height
  },
  phone,
  phoneDisplay,
  email,
  address,
  heroEyebrow,
  heroTitle,
  heroDescription,
  "heroImage": {
    "id": heroImage.asset->_id,
    "src": heroImage.asset->url,
    "alt": coalesce(heroImage.alt, "Domeček Janov"),
    "width": heroImage.asset->metadata.dimensions.width,
    "height": heroImage.asset->metadata.dimensions.height
  },
  matterportUrl,
  calendarUrl,
  listingUrl,
  mapUrl,
  facebookUrl,
  instagramUrl
}`;

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
  "alt": coalesce(alt, caption, "Domeček Janov"),
  "width": image.asset->metadata.dimensions.width,
  "height": image.asset->metadata.dimensions.height,
  category,
  caption,
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

export const tripTipsQuery = `*[_type == "tripTip"] | order(order asc) {
  "id": _id,
  title,
  distance,
  description,
  href
}`;
