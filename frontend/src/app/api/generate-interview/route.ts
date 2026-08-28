import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.6-flash";

function parseJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  return JSON.parse(cleaned);
}

function getErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.toLowerCase().includes("quota")
  ) {
    return "Today's AI generation limit has been reached. Please try again later.";
  }

  if (
    message.includes("401") ||
    message.includes("403") ||
    message.toLowerCase().includes("api key")
  ) {
    return "The Gemini API configuration is invalid. Please check your API key.";
  }

  return "We couldn't generate your interview right now. Please try again.";
}

export async function POST(request: Request) {
  try {
    const preferences = await request.json();

    const {
      role,
      experience,
      interviewType,
      skills,
      jobDescription,
    } = preferences ?? {};

    if (!role || !experience || !interviewType) {
      return Response.json(
        {
          error:
            "Role, experience level and interview type are required.",
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "Gemini API is not configured. Please check GEMINI_API_KEY.",
        },
        { status: 500 }
      );
    }

    const prompt = `
You are an expert interviewer creating a realistic mock interview.

Candidate profile:

Role: ${role}
Experience: ${experience}
Interview type: ${interviewType}
Skills: ${skills || "Not specified"}
Target job description: ${jobDescription || "Not provided"}

Create exactly 20 questions.

Tailor every question to the candidate profile.

Avoid:
- generic filler questions
- duplicate questions
- unrelated questions

For Technical interviews:
- emphasize technical knowledge
- practical reasoning
- debugging
- problem solving
- role-specific concepts

For HR / Behavioral interviews:
- emphasize behavioral
- situational
- communication
- teamwork
- leadership
- workplace scenarios

For Mixed interviews:
- combine technical and behavioral questions sensibly.

Include a useful mixture of MCQs and open-ended questions.

Return ONLY valid JSON.

{
  "questions": [
    {
      "type": "mcq",
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": "Option A"
    },
    {
      "type": "text",
      "question": "Question text"
    }
  ]
}

Rules:

- Exactly 20 questions.
- MCQs must have exactly 4 options.
- correctAnswer must exactly match one of the options.
- Text questions must not contain options.
- Text questions must not contain correctAnswer.
- No markdown.
- No code fences.
- Return JSON only.
`;

    const ai = new GoogleGenAI({
      apiKey,
    });

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    const parsed = parseJson(text);

    if (
      !Array.isArray(parsed?.questions) ||
      parsed.questions.length !== 20
    ) {
      throw new Error(
        `Gemini returned ${
          parsed?.questions?.length ?? 0
        } questions instead of 20.`
      );
    }

    const valid = parsed.questions.every((q: any) => {
      if (
        !q ||
        typeof q.question !== "string" ||
        !["mcq", "text"].includes(q.type)
      ) {
        return false;
      }

      if (q.type === "mcq") {
        return (
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          typeof q.correctAnswer === "string" &&
          q.options.includes(q.correctAnswer)
        );
      }

      return !q.options && !q.correctAnswer;
    });

    if (!valid) {
      throw new Error(
        "Gemini returned a question with an invalid structure."
      );
    }

    return Response.json({
      questions: parsed.questions,
    });
  } catch (error) {
    console.error("Interview generation error:", error);

    const rawMessage =
      error instanceof Error ? error.message : String(error);

    const isQuotaError =
      rawMessage.includes("429") ||
      rawMessage.includes("RESOURCE_EXHAUSTED") ||
      rawMessage.toLowerCase().includes("quota");

    return Response.json(
      {
        error: getErrorMessage(error),
        code: isQuotaError
          ? "QUOTA_EXCEEDED"
          : "GENERATION_ERROR",
      },
      {
        status: isQuotaError ? 429 : 500,
      }
    );
  }
}