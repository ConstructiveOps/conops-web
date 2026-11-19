// Home page copy (constructiveoperations.com/). Approved mock-up copy:
// design-reference/home.reference.html. Edit wording here, not in components.
// The hero copy lives in src/data/process.ts; the service cards in
// src/content/services/*.md. Never show a per-project price.

export const home = {
  title: 'Constructive Operations | White-labeled solar operations, done for you',
  description:
    'White-labeled operations, project management and customer care for solar contractors in all 50 states. Designs, permits, interconnection, finance packages and homeowner communication, under your brand.',

  stats: [
    { figure: '40+ years', label: 'of solar leadership experience' },
    { figure: '10,000+', label: 'solar projects completed' },
    { figure: '50 states', label: 'served' },
    { figure: 'Flat rate', label: 'per project, lower fixed overhead' },
  ],

  services: {
    heading: 'services.',
    intro:
      'From the point of sale through PTO, we handle the operations and customer care so you can focus on selling and building.',
  },

  about: {
    heading: 'about.',
    lead: 'High tech, low friction, constructive solutions for the solar industry.',
    paragraphs: [
      'Constructive Operations is a tech-based operations and project management company. Our leadership team has more than 40 years of experience in all aspects of the solar industry and has completed over 10,000 solar projects.',
      'We can help you complete projects faster, with fewer cancellations, higher customer satisfaction, and more profitability.',
    ],
  },

  brand: {
    heading: 'your brand.',
    paragraph:
      "Our services are white-labeled, so your customers will think it's all coming from you. You focus on what you do best, and we will do the rest.",
    visual: {
      label: '[VISUAL]',
      description: 'A customer update and a portal screen, with the logo swapping between sample contractor brands.',
    },
  },

  sundial: {
    heading: 'sundial.',
    lead: 'Operations intelligence, built by Constructive Operations.',
    paragraph:
      'One platform for sales, solar, roofing and service, configured to the way your company already works. Use it with our back-office team or on its own.',
    cta: 'Explore Sundial at sundialcrm.com',
    recording: {
      label: '[SCREEN RECORDING]',
      description: 'A short silent loop of the Sundial pipeline board, in a browser frame. Plays when scrolled into view.',
    },
  },

  reviews: {
    heading: 'reviews.',
    slot: {
      label: '[CLIENT QUOTE]',
      description: 'One named client, with their company and role, once they have agreed in writing. Left out until then.',
    },
  },

  contact: {
    heading: 'contact.',
    paragraph: 'Contact us for pricing and more details, or schedule a 30-minute demo now.',
  },
} as const;
