/** Fictional onboarding steps and dashboard navigation for the onboarding wizard demo. */

export interface OnboardingStep {
  id: string;
  title: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to the intranet",
    paragraphs: [
      "This is where the whole company meets: news, teams, people, training and office booking, all in one place.",
      "The tour only appears until you finish it. Use Next and Back to move between steps.",
    ],
  },
  {
    id: "how-it-is-organised",
    title: "How the intranet is organised",
    paragraphs: ["Everything is reachable from the dashboard navigation once onboarding is complete."],
    bullets: [
      "Home: company news, events and announcements.",
      "Teams: a space for your department and your team.",
      "Directory and map: find colleagues by name, team or approximate location.",
      "Office Hub: book a desk or a meeting room for the days you come in.",
      "Training and resources: courses, guides and documents.",
    ],
  },
  {
    id: "your-profile",
    title: "Set up your profile",
    paragraphs: [
      "Check your job title, team and manager. Your direct reports are listed automatically.",
      "Add your city and region so colleagues can find you on the remote employee map. Only an approximate location is ever shown.",
    ],
  },
  {
    id: "getting-help",
    title: "Where to find help",
    paragraphs: [
      "Support documentation is searchable and grouped by category.",
      "Questions about access or equipment go to the IT help desk from the Support page.",
      "Your manager is listed on your profile if you are not sure who to ask.",
    ],
  },
  {
    id: "ready",
    title: "Ready to start",
    paragraphs: [
      "Choose Complete onboarding to finish the tour. The dashboard header and navigation unlock straight away.",
      "In this demo nothing is recorded: choose Reset demo to see the tour again.",
    ],
  },
];

export interface DashboardNavItem {
  id: string;
  label: string;
}

export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] = [
  { id: "home", label: "Home" },
  { id: "news-events", label: "News & Events" },
  { id: "teams", label: "Teams" },
  { id: "directory-map", label: "Directory & Map" },
  { id: "office-hub", label: "Office Hub" },
  { id: "training-resources", label: "Training & Resources" },
];
