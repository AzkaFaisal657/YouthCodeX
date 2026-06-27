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
      { role: "user", content: userMessage },
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
Topics to cover: whether their stuck-brain feels racing/scattered vs heavy/foggy, what time of day they crash, whether they freeze before starting or lose focus mid-task.
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
  const { profile, energy, avoiding, shameSpiral, spiralCount = 0 } = req.body;

  let spiralClause = "";
  if (spiralCount >= 3) {
    spiralClause = `
CRITICAL: This is the ${spiralCount === 3 ? "third" : spiralCount + "th"} time this exact task has appeared. Do NOT treat this like a normal session. This is not a productivity failure — it is an avoidance pattern built on shame, and shame needs a completely different door.
In the framing field, say something like: "This is the third time this task has shown up. That's not a character flaw. That's avoidance built on shame, and shame needs a different door." Be direct, compassionate, and name the pattern explicitly.
Make the microAction absurdly tiny — something that takes under 30 seconds and doesn't even feel like working on the task.
The goal is not productivity. The goal is breaking the shame loop.`;
  } else if (shameSpiral) {
    spiralClause = `
IMPORTANT: The user has entered this same task before and avoided it again. Acknowledge the pattern directly and compassionately in the framing field. Make the microAction even tinier than usual — under 60 seconds. Validate the feeling of being stuck in a loop without judgment, then offer one concrete reframe.`;
  }

  const system = `You generate a single focus-session recommendation for a student with ADHD/brain fog.
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

app.post("/api/insights", async (req, res) => {
  const { sessions } = req.body;
  if (!sessions || sessions.length < 1) {
    return res.status(400).json({ error: "No session data" });
  }
  const system = `You are analyzing focus session data for a student with ADHD/brain fog to generate empathetic, specific behavioral insights.
Look for: time-of-day patterns, task completion rates, sound type effectiveness, task word patterns, spiral patterns.
Be specific with numbers when you can calculate them. Be empathetic, not clinical.
Respond ONLY with JSON:
{
  "insights": ["<insight 1>", "<insight 2>", "<insight 3>"],
  "headline": "<one powerful, specific sentence about their dominant pattern>",
  "strength": "<one compassionate sentence about something they're consistently doing right>"
}
Good insight examples: "Brown noise works for you 80% of the time", "You start sessions more often after 3pm", "You chose to try again every single time".`;
  try {
    const result = await askGrok(system, JSON.stringify(sessions));
    res.json(result);
  } catch (err) {
    console.error("/api/insights error:", err?.message);
    res.status(500).json({ error: err?.message || "AI request failed" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`Tether backend on :${PORT}`));