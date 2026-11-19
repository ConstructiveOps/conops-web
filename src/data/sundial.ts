// Sundial page copy (served at https://sundialcrm.com/). Approved mock-up
// copy: design-reference/sundial.reference.html.
// Rules: the call to action is always "book a demo". Never link, name or
// describe access to the demo portal. Media are screenshots/recordings WE supply.

export type WalkthroughStep = {
  title: string;
  body: string;
  /** Bracketed label + description shown until media is supplied. */
  slot: { label: string; description: string };
  /** Later: a video file in public/media/ (e.g. '/media/walkthrough-1.mp4'). */
  video?: string;
  /** Later: a poster image in public/media/ shown before play and under reduced motion. */
  poster?: string;
  /** Frame drawn around the media. */
  frame: 'desktop' | 'phone';
};

export const sundial = {
  title: 'Sundial | Sales, projects and service on one record',
  description:
    'Sundial is an operations platform for contractors who sell, build and service, configured to your stages, your fields and your roles.',

  hero: {
    heading: 'Sales, projects and service on one record.',
    intro:
      'Sundial is an operations platform for contractors who sell, build and service. It is configured to your stages, your fields and your roles, so your office, your crews and your sales partners work from the same information.',
    secondaryCta: 'Watch the walkthrough',
    media: {
      label: '[HERO VIDEO]',
      // Mock-up wording trimmed: it referred to where the recording is made,
      // and the site never mentions the demo portal.
      description: '20-second silent loop: dashboard, pipeline board, a record opening.',
    },
  },

  platform: {
    heading: 'platform.',
    intro: 'Turn on the modules you need. Every one of them shares the same customer record, files and conversation.',
    modules: [
      { name: 'Sales', note: 'Leads to signed customers' },
      { name: 'Solar', note: 'Projects by stage' },
      { name: 'Roofing', note: 'Jobs beside solar' },
      { name: 'Service', note: 'Estimates, dispatch, invoices' },
      { name: 'Tech app', note: "The day's work on a phone" },
      { name: 'Dealer app', note: 'Sales partners see their deals' },
      { name: 'Reports', note: 'Built, saved, scheduled' },
    ],
  },

  features: {
    heading: 'features.',
    items: [
      {
        title: 'customizations.',
        body: "Your stages, your fields, your terms. Each role sees the tabs and fields it should, and nothing it shouldn't. Your logo is on the portal, the apps and every customer document.",
      },
      {
        title: 'automations.',
        body: 'Customer texts and emails, stage-change alerts to your sales partners, appointment messages, and notifications to the person who needs to act next.',
      },
      {
        title: 'reporting.',
        body: 'Build a report, group and subtotal it, save it, share it, export it, and schedule it to arrive by email. Or describe the report you want in a sentence and let the assistant draft it.',
      },
      {
        title: 'field work.',
        body: "A dispatch board for the office and a phone app for the crew: the day's calls, clock in and out, checklists, photos, and a photo report the customer receives.",
      },
    ],
  },

  walkthrough: {
    heading: 'walkthrough.',
    intro: 'One customer, followed from first call to final report.',
    steps: [
      {
        title: 'A lead becomes a customer.',
        body: 'Intake questions, duplicate check, and the customer record every department will share.',
        slot: { label: '[RECORDING 1]', description: 'New customer popup and the customer page.' },
        frame: 'desktop',
      },
      {
        title: 'The project moves by stage.',
        body: 'A board for the pipeline, a page for the project, files and comments in one place, and the sales partner watching progress in their own app.',
        slot: { label: '[RECORDING 2]', description: 'Solar board, a card dragged to the next stage, the dealer app beside it.' },
        frame: 'desktop',
      },
      {
        title: 'A service call is scheduled.',
        body: 'An estimate, a job, and a drag onto the dispatch board. The customer gets the appointment by text or email.',
        slot: { label: '[RECORDING 3]', description: "Dispatch board with a call dropped on a tech's day." },
        frame: 'desktop',
      },
      {
        title: 'The tech does the work.',
        body: 'On my way, clock in, checklist, photos, clock out. All from a phone, and it keeps working when the signal drops.',
        slot: { label: '[RECORDING 4]', description: 'The tech app in a phone frame, with the office view updating beside it.' },
        frame: 'phone',
      },
      {
        title: 'Invoice, payment, report.',
        body: 'The invoice goes out with a pay link, the customer gets a photo report, and the numbers land in a report the owner reads on Monday.',
        slot: { label: '[RECORDING 5]', description: 'Invoice, the photo report, then a grouped report with subtotals.' },
        frame: 'desktop',
      },
    ] satisfies WalkthroughStep[],
  },

  builtBy: {
    heading: 'built and run by constructive operations.',
    paragraph:
      'Need the back-office work done as well? Our team provides white-labeled operations, project management and customer care for solar contractors, and works inside the same platform.',
    link: 'See back-office services at constructiveoperations.com',
  },

  demo: {
    heading: 'see it with your own workflow.',
    paragraph:
      'Thirty minutes on a screen share with the people who built it. Tell us which tools you would like to stop paying for and we will show you that part first.',
  },
} as const;
