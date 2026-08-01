import { accommodationType } from "./accommodation";
import { galleryItemType } from "./galleryItem";
import { localeTypes } from "./locale";
import { rateType } from "./rate";
import { siteCopyType } from "./siteCopy";
import { siteSettingsType } from "./siteSettings";
import { tripType } from "./trip";

export const schemaTypes = [
  ...localeTypes,
  siteSettingsType,
  siteCopyType,
  accommodationType,
  galleryItemType,
  rateType,
  tripType,
];
