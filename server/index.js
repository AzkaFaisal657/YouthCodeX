import "dotenv/config";
import express from "express";
import cors from "cors";
import { OpenAI } from "openai";

const app = express();
app.use(cors());
app.use(express.json());

function getClient() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

async function askGrok(systemPrompt, userMessage) {
  const grok = getClient();
  const res = await grok.chat.completions.create({
    model: "llama-3.1-8b-instant",
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
  });
  const text = res.choices[0].message.content ?? "{}";
  const clean = text.replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    return { raw: text };
  }
}

app.post("/api/onboarding/turn", async (req, res) => {
  const { history } = req.body;

  const system = `You are conducting a short onboarding conversation (max 5 exchanges) to build a focus profile for a student with ADHD/brain fog.
You are deciding, one turn at a time, whether to ask another question or finish.
Topics to cover across the conversation: whether their stuck-brain feels racing/scattered vs heavy/foggy, what time of day they crash, whether they freeze before starting or lose focus mid-task, and one more if useful.
Respond ONLY with JSON, no preamble:
If asking another question: {"done": false, "question": "<next question, conversational tone>"}
If you have enough signal (usually after 3-5 answers): {"done": true, "profile": {"brainMode": "scattered"|"foggy"|"mixed", "crashTime": "<string>", "stallType": "freeze"|"midtask-drift"|"both", "notes": "<one sentence synthesis>"}}`;

  try {
    const result = await askGrok(system, JSON.stringify(history));
    res.json(result);
  } catch (err) {
    console.error("/api/onboarding/turn error:", err?.message);
    res.status(500).json({ error: err?.message || "AI request failed" });
  }
});

app.post("/api/session/recommend", async (req, res) => {
  const { profile, energy, avoiding, shameSpiral } = req.body;

  const spiralClause = shameSpiral
    ? `
IMPORTANT: The user has entered this same task before and avoided it again. They are in an avoidance cycle — what some call a shame spiral. Do NOT pretend this is a fresh start. Acknowledge the pattern directly and compassionately in the framing field. Name the avoidance cycle explicitly. Make the microAction even tinier than usual — something that takes under 60 seconds. The framing should validate the feeling of being stuck in a loop without judgment, then offer one concrete reframe. This moment of recognition can change everything.`
    : "";

  const system = `You generate a single focus-session recommendation for a student with ADHD/brain fog, based on their stored profile and current state.
Respond ONLY with JSON:
{
  "soundType": "brown"|"pink"|"binaural",
  "soundReason": "<one sentence, plain language, references their current state>",
  "microAction": "<one tiny, concrete, physical first action related to the task they're avoiding>",
  "framing": "<one or two sentences, framed for their specific stallType>"
}
Sound logic: brown noise for scattered/high-arousal states, pink noise for foggy/low-energy states, binaural beats for in-between/mixed states.${spiralClause}`;

  try {
    const result = await askGrok(system, JSON.stringify({ profile, energy, avoiding }));
    res.json(result);
  } catch (err) {
    console.error("/api/session/recommend error:", err?.message);
    res.status(500).json({ error: err?.message || "AI request failed" });
  }
});

app.post("/api/session/feedback", async (req, res) => {
  const { profile, lastRecommendation, didIt } = req.body;

  const system = `You update a focus profile's notes based on one session's outcome. Keep it short.
Respond ONLY with JSON: {"updatedNotes": "<2-3 sentences max, additive to existing notes>"}`;

  try {
    const result = await askGrok(system, JSON.stringify({ profile, lastRecommendation, didIt }));
    res.json(result);
  } catch (err) {
    console.error("/api/session/feedback error:", err?.message);
    res.status(500).json({ error: err?.message || "AI request failed" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Tether backend on :${PORT}`));