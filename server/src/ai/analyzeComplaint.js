import env from "../config/env.js";
import { departmentForCategory } from "../services/departmentService.js";
import { classifyWithGemini, isGeminiConfigured } from "./gemini.js";
import { ruleBasedAnalysis } from "./rules.js";

const describeFailure = (error) => {
  const status = error?.status ?? error?.code;
  if (status === 429 || /quota|rate/i.test(error?.message || "")) return "Gemini rate limit reached";
  if (status === "timeout") return "Gemini request timed out";
  if (status === "invalid_output") return "Gemini returned output that failed validation";
  if (status === 401 || status === 403) return "Gemini credentials were rejected";
  return "Gemini request failed";
};

// Returns the value stored in complaint.ai. Gemini is tried first when
// configured; otherwise (or on any failure) the keyword rules are used and the
// reason is recorded.
export const analyzeComplaint = async ({ title, description, image }) => {
  let result;

  if (!isGeminiConfigured()) {
    result = { ...ruleBasedAnalysis({ title, description }), fallbackReason: "Gemini is not configured" };
  } else {
    try {
      const gemini = await classifyWithGemini({
        title,
        description,
        image: env.geminiAnalyzeImages ? image : undefined,
      });
      result = { source: "gemini", ...gemini };
    } catch (error) {
      if (!env.isTest) console.warn("Gemini analysis failed:", error?.message);
      result = { ...ruleBasedAnalysis({ title, description }), fallbackReason: describeFailure(error) };
    }
  }

  return {
    ...result,
    department: await departmentForCategory(result.category),
    analyzedAt: new Date(),
  };
};
