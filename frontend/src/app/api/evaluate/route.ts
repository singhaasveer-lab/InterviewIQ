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
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  const lowerMessage =
    message.toLowerCase();

  if (
    message.includes("429") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    lowerMessage.includes("quota")
  ) {
    return "Today's AI evaluation limit has been reached. Please try again later.";
  }

  if (
    message.includes("401") ||
    message.includes("403") ||
    lowerMessage.includes("api key")
  ) {
    return "The Gemini API configuration is invalid. Please check the API key.";
  }

  return "We couldn't evaluate your interview right now. Please try again.";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      questions,
      answers,
    } = body ?? {};

    if (
      !Array.isArray(questions) ||
      !Array.isArray(answers)
    ) {
      return Response.json(
        {
          error:
            "Questions and answers are required.",
        },
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return Response.json(
        {
          error:
            "No interview questions were provided.",
        },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        {
          error:
            "Gemini API is not configured. Please check GEMINI_API_KEY.",
        },
        { status: 500 }
      );
    }

    /*
     * Combine each question with the actual
     * answer supplied by the candidate.
     */

    const interview = questions.map(
      (question: any, index: number) => ({
        questionNumber: index + 1,
        question:
          typeof question?.question ===
          "string"
            ? question.question
            : "",
        type: question?.type || "text",
        options: Array.isArray(
          question?.options
        )
          ? question.options
          : [],
        candidateAnswer:
          typeof answers[index] === "string"
            ? answers[index]
            : "",
        correctAnswer:
          question?.type === "mcq"
            ? question?.correctAnswer ||
              null
            : null,
      })
    );

    const prompt = `
You are an expert technical interviewer and career coach evaluating a real candidate's mock interview.

IMPORTANT:
Evaluate ONLY the supplied questions and actual candidate answers.

Never invent:
- experience
- skills
- achievements
- projects
- certifications
- answers
- background information

INTERVIEW DATA:

${JSON.stringify(
  interview,
  null,
  2
)}

Evaluate every question.

SCORING:

Score every question from 0 to 100.

For MCQs:
- Compare candidateAnswer directly with correctAnswer.
- Correct answer = 100.
- Incorrect answer = 0.

For text questions:
Evaluate:
- technical correctness
- reasoning
- completeness
- relevance
- clarity

Empty answers should receive:
- score: 0
- verdict: "No Answer"

OVERALL METRICS:

Calculate:
- overallScore
- technicalKnowledge
- problemSolving
- communication
- interviewReadiness

These must be based ONLY on the supplied answers.

Do not award points for skills that the candidate did not demonstrate.

Return ONLY valid JSON.

Required structure:

{
  "overallScore": 0,
  "technicalKnowledge": 0,
  "problemSolving": 0,
  "communication": 0,
  "interviewReadiness": 0,
  "feedback": "Evidence-based overall evaluation.",
  "strengths": [
    "Specific demonstrated strength"
  ],
  "improvements": [
    "Specific actionable weakness"
  ],
  "recommendedTopics": [
    "Specific topic to practice"
  ],
  "questionEvaluations": [
    {
      "questionNumber": 1,
      "question": "Original question",
      "candidateAnswer": "Actual answer",
      "type": "mcq",
      "score": 100,
      "verdict": "Correct",
      "evaluation": "Specific evaluation.",
      "correctAnswer": "Correct MCQ answer or null",
      "explanation": "Why the answer is correct or what was missing."
    }
  ]
}

RULES:

1. Exactly one questionEvaluation for every input question.
2. Preserve the original question order.
3. Never skip a question.
4. Never create an additional question.
5. Never modify candidateAnswer.
6. Scores must be numbers from 0 to 100.
7. MCQ verdict must be exactly "Correct" or "Incorrect".
8. Text verdict must be exactly one of:
   - "Excellent"
   - "Good"
   - "Partially Correct"
   - "Needs Improvement"
   - "No Answer"
9. For MCQs, correctAnswer must contain the actual correct answer.
10. For text questions, correctAnswer must be null.
11. Base strengths on demonstrated answers only.
12. Base improvements on observed weaknesses only.
13. recommendedTopics must come from observed weaknesses.
14. Do not invent candidate background.
15. Return JSON only.
16. Do not include markdown.
17. Do not include code fences.
`;

    const ai = new GoogleGenAI({
      apiKey,
    });

    const response =
      await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType:
            "application/json",
        },
      });

    const text = response.text;

    if (!text) {
      throw new Error(
        "Gemini returned an empty evaluation."
      );
    }

    const evaluation =
      parseJson(text);

    /*
     * Basic structure validation.
     */

    if (
      typeof evaluation?.overallScore !==
        "number" ||
      !Array.isArray(
        evaluation?.questionEvaluations
      )
    ) {
      throw new Error(
        "Gemini returned an invalid evaluation structure."
      );
    }

    if (
      evaluation.questionEvaluations
        .length !== questions.length
    ) {
      throw new Error(
        "Gemini did not return an evaluation for every question."
      );
    }

    /*
     * Validate every question evaluation.
     */

    const valid =
      evaluation.questionEvaluations.every(
        (item: any, index: number) => {
          if (
            !item ||
            typeof item.questionNumber !==
              "number" ||
            item.questionNumber !==
              index + 1
          ) {
            return false;
          }

          if (
            typeof item.score !==
              "number" ||
            item.score < 0 ||
            item.score > 100
          ) {
            return false;
          }

          if (
            typeof item.question !==
              "string"
          ) {
            return false;
          }

          if (
            typeof item.candidateAnswer !==
              "string"
          ) {
            return false;
          }

          if (
            ![
              "mcq",
              "text",
            ].includes(item.type)
          ) {
            return false;
          }

          if (
            typeof item.verdict !==
              "string"
          ) {
            return false;
          }

          return true;
        }
      );

    if (!valid) {
      throw new Error(
        "Gemini returned an invalid question evaluation."
      );
    }

    return Response.json(
      evaluation
    );
  } catch (error) {
    console.error(
      "Interview evaluation error:",
      error
    );

    const rawMessage =
      error instanceof Error
        ? error.message
        : String(error);

    const lowerMessage =
      rawMessage.toLowerCase();

    const isQuotaError =
      rawMessage.includes("429") ||
      rawMessage.includes(
        "RESOURCE_EXHAUSTED"
      ) ||
      lowerMessage.includes("quota");

    return Response.json(
      {
        error:
          getErrorMessage(error),
        code: isQuotaError
          ? "QUOTA_EXCEEDED"
          : "EVALUATION_ERROR",
      },
      {
        status: isQuotaError ? 429 : 500,
      }
    );
  }
}