import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let aiClient = null;

if (API_KEY && API_KEY !== "YOUR_API_KEY_HERE") {
  aiClient = new GoogleGenAI({ apiKey: API_KEY });
}

const MODEL_NAME = "gemini-2.5-flash";


const LADDER_SYSTEM_INSTRUCTION = `You are a master educational curriculum designer and conceptual teacher for the platform "Concept Ladder".

Your mission is to take any topic or concept provided by the user and deconstruct it into three distinct, progressive levels of depth:

1. "Kid Level":
   - A fun, simple, and intuitive explanation using imaginative real-world analogies (suitable for a 5-year-old).
   - Use **bold** formatting for core keywords.
   - Provide at least 2 full, well-developed paragraphs.

2. "Beginner Level":
   - A structured, foundational explanation with essential terminology and core mechanisms (suitable for a high school or introductory student).
   - Use **bold** for key terms and clear bullet points for lists.

3. "Advanced Level":
   - A rigorous, expert technical analysis exploring complex nuances, mechanics, mathematical/architectural models, edge cases, and cutting-edge industry applications.
   - Provide comprehensive, in-depth multi-paragraph explanations and technical breakdowns in Markdown.

Output Format Guidelines:
- You must respond ONLY with a valid JSON object matching the exact structure below.
- Do NOT use invalid JSON escape characters (all newlines inside string values must be \\n, and any backslashes in math or code must be escaped as \\\\).

{
  "kid": {
    "subtitle": "Short catchy subtitle",
    "description": "Brief 1-2 sentence overview",
    "content": "Full multi-paragraph explanation in Markdown"
  },
  "beginner": {
    "subtitle": "Short catchy subtitle",
    "description": "Brief 1-2 sentence overview",
    "content": "Full detailed explanation with bullet points in Markdown"
  },
  "advanced": {
    "subtitle": "Short catchy subtitle",
    "description": "Brief 1-2 sentence overview",
    "content": "Deep expert technical analysis in Markdown"
  }
}`;


function sanitizeJSONEscapes(str) {
  return str.replace(/\\(?!["\\/bfnrtu]|u[0-9a-fA-F]{4})/g, "\\\\");
}


function parseGeminiJSON(rawText) {
  if (!rawText) return null;
  const trimmed = rawText.trim();

  let cleaned = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err1) {
    try {
      const sanitized = sanitizeJSONEscapes(cleaned);
      return JSON.parse(sanitized);
    } catch {
      throw err1;
    }
  }
}

export const generateLadderContent = async (topic, retries = 1) => {
  if (!aiClient) {
    console.warn("Gemini API Key is missing or invalid. Using fallback placeholder.");
    return null;
  }

  const userPrompt = `Please generate a comprehensive Concept Ladder curriculum for the topic: "${topic}".`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await aiClient.models.generateContent({
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        config: {
          systemInstruction: LADDER_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });

      const candidate = response?.candidates?.[0];
      const text = candidate?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error(
          `Empty text returned (Finish reason: ${candidate?.finishReason || "UNKNOWN"})`
        );
      }

      const parsed = parseGeminiJSON(text);

      if (parsed && parsed.kid?.content && parsed.beginner?.content && parsed.advanced?.content) {
        return parsed;
      }

      throw new Error("Gemini response missing one or more required ladder levels.");
    } catch (error) {
      console.warn(`[Gemini API Attempt ${attempt + 1}/${retries + 1} Failed]:`, error.message);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } else {
        console.error("All Gemini generation attempts failed:", error);
        return null;
      }
    }
  }

  return null;
};


export const chatWithAI = async (message, history = [], context = "") => {
  if (!aiClient) {
    return "I'm sorry, but I can't chat right now because the AI service isn't configured correctly. Please check your API key.";
  }

  const systemInstruction = `You are the friendly, encouraging AI Tutor for "Concept Ladder", an interactive learning app where topics are explained in 3 progressive levels (Kid, Beginner, Advanced).

Your guidelines:
- Be helpful, concise, friendly, and intellectually inspiring.
- Answer the student's question directly and clearly based on the topic and depth level they are currently studying.
- Speak in clear paragraphs or brief bullet points when explaining complex concepts.
- Do NOT explain your internal reasoning or offer meta-options on how you could respond. Speak directly as the tutor.
${context ? `\n--- Current Learning Context ---\n${context}` : ""}`;

  try {
    const contents = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await aiClient.models.generateContent({
      model: MODEL_NAME,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Chat failed:", error);
    return `Error: ${error.message || "Something went wrong"}. Please check your API key.`;
  }
};
