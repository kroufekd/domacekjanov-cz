import type { TripsDictionary } from "@/i18n/trips-dictionary";

/**
 * Interface strings that never leave the codebase: accessibility labels, image
 * alternative texts and the few micro-copy bits nobody needs to edit.
 * Everything a site owner would realistically want to rewrite lives in
 * `SiteCopy` instead and is editable in the Studio.
 */
export type Dictionary = {
  skipToContent: string;
  backToTop: string;
  mainNavigation: string;
  mobileNavigation: string;
  openMenu: string;
  closeMenu: string;
  language: {
    /** Accessible name of the switcher button. */
    label: string;
    /** Heading rendered above the list of languages. */
    heading: string;
    /** Suffix appended to the active language for screen readers. */
    current: string;
  };
  gallery: {
    filterRegion: string;
    openPhoto: string;
    viewer: string;
    close: string;
    previous: string;
    next: string;
  };
  /** Hero corner plates. `{count}` is the sleeping capacity of the house. */
  hero: {
    capacityLink: string;
  };
  /** Booking.com award. `{year}` and `{score}` are filled per certificate. */
  award: {
    open: string;
    viewer: string;
    close: string;
    previous: string;
    next: string;
    certificateAlt: string;
  };
  tour: {
    iframeTitle: string;
  };
  /** Trip map - its own module, the block would otherwise dwarf the rest. */
  trips: TripsDictionary;
  dialog: {
    close: string;
    closeDialog: string;
  };
  alt: {
    storyCollage: string;
    storyMain: string;
    storyDetail: string;
    gardenWide: string;
    roomsShowcase: string;
    tourPoster: string;
    contactPhoto: string;
  };
};
