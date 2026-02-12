export type PlaceCategory =
  | "fresh"
  | "salty"
  | "project"
  | "problem"
  | "energy"
  | "renewable"
  | "mineral"
  | "agri"
  | "transport"
  | "urban"
  | "aquaculture"
  | "waterway"
  | "mega";

export type PlaceMedia = {
  image?: string; // URL
  images?: string[]; // URLs
  video?: string; // YouTube embed URL
  videos?: string[]; // URLs / embed URLs
  source?: string; // URL
  attribution?: string;
};

export type PlaceMetrics = {
  importance?: number; // 1-100
  score?: number; // 0-100 (for quizzes/learning)
};

export type Place = {
  id: string;
  title: string;
  aliases?: string[];
  lat: number;
  lng: number;
  category: PlaceCategory;
  summary: string;
  details?: string[];
  media?: PlaceMedia;
  metrics?: PlaceMetrics;
};

export type ConceptCard = {
  id: string;
  title: string;
  bullets: string[];
  miniTip?: string;
  placeId?: string; // optional deep-link to the map
};

export type DragMatchActivity = {
  id: string;
  type: "drag_match";
  title: string;
  prompt: string;
  groups: { id: string; title: string }[];
  items: { id: string; label: string; answerGroup: string }[];
};

export type QuizActivity = {
  id: string;
  type: "quiz";
  title: string;
  questions: {
    id: string;
    q: string;
    choices: string[];
    answerIndex: number;
    explain: string;
  }[];
};

export type Activity = DragMatchActivity | QuizActivity;

export type Fact = { k: string; v: string; hint?: string };

export type Mission = {
  id: string;
  title: string;
  steps?: string[];
  activity?: string;
};

export type Lesson = {
  id: string;
  title: string;
  ageHint?: string;
  objectives: string[];
  conceptCards: ConceptCard[];
  places: Place[];
  activities: Activity[];
  facts?: Fact[];
  missions?: Mission[];
  funFacts?: string[];
};
