/**
 * Interface strings that never leave the codebase: accessibility labels, image
 * alternative texts and the few micro-copy bits nobody needs to edit in Sanity.
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
  tour: {
    iframeTitle: string;
  };
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
