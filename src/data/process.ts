// The solar operations process shown in the home hero.
// Labels are kept EXACTLY as written in design-reference/hero-process.reference.html.
// `ours` = steps above the line (our team), `yours` = below the line (your team).
// 15 "ours" + 5 "yours" — matches "15 steps handled by our team. 5 by yours."

export type ProcessStep = {
  icon: 'icon01' | 'icon02' | 'icon03' | 'icon04' | 'icon05' | 'icon06' | 'icon07' | 'icon08' | 'icon09' | 'icon10';
  alt: string;
  ours: string[];
  yours: string[];
};

export const processSteps: ProcessStep[] = [
  { icon: 'icon01', alt: 'Contract', ours: ['Welcome Call'], yours: ['Solar Sale Closed / Contract Execution'] },
  { icon: 'icon02', alt: 'Customer contact', ours: ['Site Visit Scheduling'], yours: [] },
  { icon: 'icon03', alt: 'Site visit', ours: ['Contract Review & Design'], yours: ['Site Visit Completed / Photos Captured'] },
  { icon: 'icon04', alt: 'Design', ours: ['Design Complete', 'NTP Approval (from Client, Customer, Finance)'], yours: [] },
  { icon: 'icon05', alt: 'Permitting', ours: ['Permit, Utility, & HOA Applications Submitted', 'Permit Approved'], yours: [] },
  { icon: 'icon06', alt: 'Installation', ours: ['BOM Created & Sent to Client', 'Installation Scheduled with Customer'], yours: ['Installation Completed'] },
  { icon: 'icon07', alt: 'Finance', ours: ['Finance Substantial Package Submitted'], yours: ['Final Inspection Completed / Install Photos Captured'] },
  { icon: 'icon08', alt: 'Utility and monitoring', ours: ['Utility PTO Submission', 'Monitoring Setup'], yours: [] },
  { icon: 'icon09', alt: 'Activation', ours: ['PTO Received'], yours: ['System Commissioned & Activated'] },
  { icon: 'icon10', alt: 'Survey and service', ours: ['Customer Survey & Referral Requests', 'Post-Activation Service Coordination'], yours: [] },
];

export const processCopy = {
  definition: {
    word: 'Constructive',
    partOfSpeech: 'adjective',
    meaning: 'helping to improve; promoting further development or advancement',
  },
  heading: 'White-Labeled Solar Operations, Done For You',
  intro:
    'We create designs, submit permits, handle utility interconnection, process finance packages, and manage all homeowner communication, all under your brand.',
  cta: 'Book a 30-minute demo',
  ourTeam: { label: 'our team.', note: 'everything above the line' },
  yourTeam: { label: 'your team.', note: 'sell it, build it, switch it on' },
} as const;
