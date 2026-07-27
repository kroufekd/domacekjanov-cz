import { accommodationType } from "./accommodation";
import { galleryItemType } from "./galleryItem";
import { localeTypes } from "./locale";
import { rateType } from "./rate";
import { siteCopyType } from "./siteCopy";
import { siteSettingsType } from "./siteSettings";
import { tripTipType } from "./tripTip";

export const schemaTypes = [
  ...localeTypes,
  siteSettingsType,
  siteCopyType,
  accommodationType,
  galleryItemType,
  rateType,
  tripTipType,
];
