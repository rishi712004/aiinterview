/**
 * GROQ AI SERVICE
 * Free alternative to OpenAI — same API format, zero cost
 * Model: llama-3.1-8b-instant (fast) or llama-3.3-70b-versatile (smarter)
 */

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL_FAST   = "llama-3.1-8b-instant";       // fast, free
const MODEL_SMART  = "llama-3.3-70b-versatile";    // smarter, still free

// ─── Helper: call Groq and parse JSON ─────────────────────────────────────
async function askGroq(prompt, systemPrompt = "", smart = false) {
  const messages = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  messages.push({ role: "user", content: prompt });

  const res = await groq.chat.completions.create({
    model: smart ? MODEL_SMART : MODEL_FAST,
    messages,
    temperature: 0.3,
    max_tokens: 1500,
  });

  const text = res.choices[0]?.message?.content || "";
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    return { raw: text };
  }
}

// ─── 1. CODE EXECUTION SIMULATION ─────────────────────────────────────────
// Simulates running code and returns stdout, stderr, test results
export async function executeCode({ code, language, question, topic }) {
  const system = `You are a code execution engine and expert software engineer.
Your job is to mentally execute code, trace through it step by step, and return the exact output.
Always respond with valid JSON only. Never add explanation outside the JSON.`;

  const prompt = `
Execute this ${language} code mentally and return what it would output.
Also generate 3 test cases for this DSA problem and check if the code passes them.

Problem: "${question}" (Topic: ${topic})

Code:
\`\`\`${language}
${code}
\`\`\`

Respond with this EXACT JSON (no extra text):
{
  "stdout": "<the exact console output of the code, or empty string if none>",
  "stderr": "<any error message if code has syntax/runtime errors, or empty string>",
  "has_error": <true|false>,
  "error_type": "<SyntaxError|RuntimeError|LogicError|null>",
  "error_line": <line number or null>,
  "test_cases": [
    {
      "input": "<test input>",
      "expected": "<expected output>",
      "actual": "<what your code produces>",
      "passed": <true|false>
    },
    {
      "input": "<test input>",
      "expected": "<expected output>",
      "actual": "<what your code produces>",
      "passed": <true|false>
    },
    {
      "input": "<edge case input>",
      "expected": "<expected output>",
      "actual": "<what your code produces>",
      "passed": <true|false>
    }
  ],
  "tests_passed": <number 0-3>,
  "tests_total": 3,
  "execution_time_ms": <estimated ms as integer>
}
`;

  return askGroq(prompt, system, true); // use smarter model for execution
}

// ─── 2. CODE FEEDBACK ────────────────────────────────────────────────────
export async function getCodeFeedback({ question, code, language, topic, executionResult }) {
  const system = `You are a senior software engineer and coding interviewer.
Analyze code submissions and give structured feedback.
Always respond with valid JSON only, no extra text.`;

  const executionContext = executionResult ? `
Execution Results:
- Tests passed: ${executionResult.tests_passed}/${executionResult.tests_total}
- Has errors: ${executionResult.has_error}
- Error: ${executionResult.stderr || "none"}
` : "";

  const prompt = `
Evaluate this ${language} solution for the DSA problem below.
${executionContext}

Problem: "${question}"
Topic: ${topic}

Code:
\`\`\`${language}
${code}
\`\`\`

Respond with this exact JSON:
{
  "score": <integer 0-100, heavily influenced by test results if provided>,
  "status": "<solved|attempted|failed>",
  "summary": "<2-3 sentence overall assessment>",
  "time_complexity": "<e.g. O(n)>",
  "space_complexity": "<e.g. O(1)>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "optimal_approach": "<brief description of best approach>"
}
`;

  return askGroq(prompt, system);
}

// ─── 3. STUDY PLAN ───────────────────────────────────────────────────────
export async function getStudyPlan({ weakTopics, targetCompany, targetRole }) {
  const system = `You are an expert DSA coach and interview preparation specialist.
Generate concise, actionable study plans. Respond with valid JSON only.`;

  const prompt = `
Create a 2-week study plan for a student preparing for ${targetRole} interviews${targetCompany ? ` at ${targetCompany}` : ""}.

Their weak topics (sorted by accuracy, lowest first):
${weakTopics.map((t) => `- ${t.topic}: ${t.accuracy}% accuracy (${t.solved}/${t.total} solved)`).join("\n")}

Respond with this exact JSON:
{
  "headline": "<one motivating sentence>",
  "priority_topic": "<the single most important topic to focus on>",
  "reason": "<why this topic matters for their target>",
  "week1": [
    { "day": "Mon-Tue", "focus": "<topic>", "problems": <number>, "tip": "<specific tip>" },
    { "day": "Wed-Thu", "focus": "<topic>", "problems": <number>, "tip": "<specific tip>" },
    { "day": "Fri-Sun", "focus": "<topic>", "problems": <number>, "tip": "<specific tip>" }
  ],
  "week2": [
    { "day": "Mon-Tue", "focus": "<topic>", "problems": <number>, "tip": "<specific tip>" },
    { "day": "Wed-Thu", "focus": "<topic>", "problems": <number>, "tip": "<specific tip>" },
    { "day": "Fri-Sun", "focus": "<topic>", "problems": <number>, "tip": "<specific tip>" }
  ],
  "daily_goal": <number of problems per day>,
  "resources": ["<resource 1>", "<resource 2>"]
}
`;

  return askGroq(prompt, system);
}

// ─── 4. RESUME ANALYSIS ──────────────────────────────────────────────────
export async function analyzeResume({ resumeText, targetRole, targetCompany }) {
  const system = `You are an expert technical recruiter and resume coach with 10 years of experience
at top tech companies. Analyse resumes critically and give actionable feedback.
Respond with valid JSON only.`;

  const prompt = `
Analyse this resume for a ${targetRole} position${targetCompany ? ` at ${targetCompany}` : ""}.

Resume text:
---
${resumeText.slice(0, 3000)}
---

Respond with this exact JSON:
{
  "ats_score": <integer 0-100>,
  "format_score": <integer 0-100>,
  "impact_score": <integer 0-100>,
  "keyword_score": <integer 0-100>,
  "overall_verdict": "<one sentence summary>",
  "suggestions": [
    { "type": "warning", "title": "<issue title>", "description": "<specific fix>" },
    { "type": "tip",     "title": "<improvement>",  "description": "<how to do it>" }
  ],
  "role_matches": [
    { "role": "<role @ company>", "match_pct": <integer 0-100> },
    { "role": "<role @ company>", "match_pct": <integer 0-100> },
    { "role": "<role @ company>", "match_pct": <integer 0-100> }
  ],
  "missing_keywords": ["<keyword>", "<keyword>", "<keyword>"],
  "top_strengths": ["<strength>", "<strength>"]
}
`;

  return askGroq(prompt, system);
}
