// Keyword fallback used when Gemini is not configured or fails. Results are
// stored with source "rules" so the UI never presents them as model output.

const CATEGORY_KEYWORDS = [
  ["Pothole", ["pothole", "pot hole", "road damage", "crater", "broken road", "road is damaged", "asphalt"]],
  ["Water Leakage", ["water leak", "leakage", "leaking", "pipe burst", "burst pipe", "pipeline", "water supply", "tap"]],
  ["Street Light", ["street light", "streetlight", "lamp post", "light not working", "dark street", "bulb"]],
  ["Drainage", ["drain", "sewer", "sewage", "manhole", "waterlogging", "water logging", "clogged", "overflow"]],
  ["Dead Animal", ["dead animal", "carcass", "dead dog", "dead cow", "dead cat", "dead bird"]],
  ["Garbage", ["garbage", "trash", "waste", "litter", "dump", "rubbish", "dustbin", "debris"]],
];

const HIGH_PRIORITY = ["urgent", "accident", "danger", "dangerous", "injur", "live wire", "electrocut", "flood", "collapse", "children", "school", "hospital", "fire"];
const MEDIUM_PRIORITY = ["broken", "damaged", "blocked", "overflow", "smell", "days", "week"];

export const ruleBasedAnalysis = ({ title = "", description = "" }) => {
  const text = `${title} ${description}`.toLowerCase();

  // The category with the most keyword hits wins; ties go to the earlier entry.
  let match = null;
  let best = 0;
  for (const entry of CATEGORY_KEYWORDS) {
    const hits = entry[1].filter((word) => text.includes(word)).length;
    if (hits > best) {
      best = hits;
      match = entry;
    }
  }
  const category = match ? match[0] : "Other";

  let priority = "Low";
  if (HIGH_PRIORITY.some((word) => text.includes(word))) priority = "High";
  else if (MEDIUM_PRIORITY.some((word) => text.includes(word))) priority = "Medium";

  return {
    source: "rules",
    category,
    priority,
    explanation: match
      ? `Keyword match for "${category}". Priority set to ${priority} from wording in the report.`
      : "No category keywords matched; classified as Other.",
    confidence: null,
  };
};
