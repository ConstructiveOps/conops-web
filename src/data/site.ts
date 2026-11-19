// One place for site-wide settings. Edit values here, not in components.
//
// Rules (see CLAUDE.md):
// - Never add the Sundial demo portal's address here or anywhere else.
// - No client names, rates or record ids.

export const site = {
  /**
   * LAUNCH SWITCH. While false, every page on every domain carries
   * <meta name="robots" content="noindex, nofollow"> and both robots.txt
   * files disallow everything. Flip to true only on launch day.
   */
  launched: false,

  domains: {
    co: 'https://constructiveoperations.com',
    sundial: 'https://sundialcrm.com',
  },

  company: {
    name: 'Constructive Operations',
    legalName: 'Constructive Operations LLC',
    email: 'info@constructiveoperations.com',
    phone: '(833) 669-1318',
    phoneHref: 'tel:+18336691318',
    address: ['PO Box 67015', 'Phoenix, AZ 85082'],
  },

  /** Microsoft Bookings page. Every "book a demo" button uses this. */
  bookingUrl:
    'https://outlook.office365.com/owa/calendar/ConstructiveOperationsDemonstration@constructiveoperations.com/bookings/s/6Bqs-Zb5gkKyGNHkT4ye8g2',

  /** Existing-client portal. Shown in the Constructive Operations footer only. */
  clientPortalUrl: 'https://portal.constructiveoperations.com/home',

  /**
   * Where the contact form POSTs (JSON). Empty = not connected yet: the form
   * shows a "not connected" notice in development and a fallback message
   * (email / book a demo) in production. A later step sets this to the AWS
   * endpoint.
   */
  contactFormEndpoint: '',

  /** Reserved for the chat widget, built later. Nothing renders while false. */
  chatWidget: {
    enabled: false,
  },

  social: {
    linkedin: 'https://www.linkedin.com/company/constructiveops',
    facebook: 'https://www.facebook.com/constructiveoperations',
  },
} as const;

export type NavItem = { label: string; site: 'co' | 'sundial'; path: string };

/** Main navigation for the Constructive Operations pages. */
export const coNav: NavItem[] = [
  { label: 'services.', site: 'co', path: '/services' },
  { label: 'sundial.', site: 'sundial', path: '/' },
  { label: 'about.', site: 'co', path: '/about' },
  { label: 'contact.', site: 'co', path: '/contact' },
];

/** Navigation for the Sundial pages. */
export const sundialNav: NavItem[] = [
  { label: 'platform.', site: 'sundial', path: '/#platform' },
  { label: 'features.', site: 'sundial', path: '/#features' },
  { label: 'walkthrough.', site: 'sundial', path: '/#walkthrough' },
  { label: 'back-office services.', site: 'co', path: '/services' },
];
