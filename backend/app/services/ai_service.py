import json

from backend.app.ai.gemini_service import generate_text


class AIService:

    @staticmethod
    def _parse_json(response_text: str) -> dict:
        if not response_text:
            raise RuntimeError(
                "Gemini returned an empty response."
            )

        cleaned = response_text.strip()

        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        elif cleaned.startswith("```"):
            cleaned = cleaned[3:]

        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]

        cleaned = cleaned.strip()

        try:
            result = json.loads(cleaned)
        except json.JSONDecodeError as error:
            raise RuntimeError(
                f"Gemini returned invalid JSON: {error}"
            ) from error

        if not isinstance(result, dict):
            raise RuntimeError(
                "Gemini response must be a JSON object."
            )

        return result

    @staticmethod
    async def generate_aptitude_questions(
        sections: list,
        difficulty: str,
        question_count: int,
        focus_topics: list = None,
    ) -> list:
        import random

        # Split the requested count as evenly as possible across sections
        base, extra = divmod(question_count, len(sections))
        plan = {
            section: base + (1 if index < extra else 0)
            for index, section in enumerate(sections)
        }
        plan_text = "\n".join(
            f"- {name}: {count} questions" for name, count in plan.items()
        )

        topic_hints = (
            "Quantitative topics: percentages, ratios, profit and loss, time and work, "
            "speed-distance-time, averages, simple/compound interest, number series, probability. "
            "Logical topics: series, coding-decoding, blood relations, seating arrangement, "
            "syllogisms, direction sense, data sufficiency, puzzles. "
            "Verbal topics: grammar correction, synonyms/antonyms, sentence completion, "
            "reading comprehension (short passage inside the question), para-jumbles, idioms."
        )

        focus_line = (
            "\nFOCUS: the candidate is weak at these topics, so make most questions test them: "
            + ", ".join(focus_topics)
            + "\n"
        ) if focus_topics else ""

        prompt = f"""
You are an expert aptitude test setter for campus and corporate hiring exams.

Difficulty: {difficulty}
Create exactly this many multiple-choice questions per section:
{plan_text}

{topic_hints}
{focus_line}
RULES:
1. Every question must have exactly 4 distinct options and exactly one correct option.
2. "correct_answer" must be copied exactly from one of the options.
3. Verify every calculation before answering. A wrong answer key is worse than no question.
4. No duplicate questions. Vary the topics within each section.
5. "explanation" is a clear step-by-step solution in 2-4 short sentences.
6. "shortcut" is a quick trick or mental-math method, or an empty string if none exists.
7. "section" must be exactly one of: {", ".join(sections)}.

Return ONLY valid JSON in this schema:

{{
  "questions": [
    {{
      "section": "Quantitative",
      "topic": "Percentages",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": "A",
      "explanation": "Step-by-step solution",
      "shortcut": "Quick trick or empty string"
    }}
  ]
}}
"""

        result = AIService._parse_json(await generate_text(prompt))
        raw = result.get("questions")

        if not isinstance(raw, list):
            raise RuntimeError(
                "Gemini response does not contain a valid questions list."
            )

        seen = set()
        valid = []

        for item in raw:
            if not isinstance(item, dict):
                continue

            question = str(item.get("question", "")).strip()
            options = item.get("options")
            answer = item.get("correct_answer")
            section = item.get("section")

            if (
                not question
                or question.lower() in seen
                or section not in plan
                or not isinstance(options, list)
                or len(options) != 4
                or len({str(o).strip() for o in options}) != 4
                or answer not in options
            ):
                continue

            seen.add(question.lower())
            options = [str(o).strip() for o in options]
            correct_text = str(answer).strip()

            # Shuffle so the answer position is not biased toward the first option
            random.shuffle(options)

            valid.append({
                "section": section,
                "topic": str(item.get("topic") or section).strip(),
                "question": question,
                "options": options,
                "correct_index": options.index(correct_text),
                "explanation": str(item.get("explanation") or "").strip(),
                "shortcut": str(item.get("shortcut") or "").strip(),
            })

        if not valid:
            raise RuntimeError(
                "Gemini did not return any valid aptitude questions."
            )

        # Keep section order stable and cap each section at its planned size
        ordered = []
        for name in sections:
            ordered.extend([q for q in valid if q["section"] == name][:plan[name]])

        for index, q in enumerate(ordered, start=1):
            q["id"] = index

        return ordered

    @staticmethod
    async def generate_interview_questions(
        role: str,
        experience: str,
        interview_type: str,
        difficulty: str,
        question_count: int,
        skills: list,
        job_description: str = "",
        resume_context: str = "",
    ) -> dict:

        if question_count < 1:
            raise ValueError(
                "question_count must be greater than 0."
            )

        prompt = f"""
You are a Principal Technical Hiring Evaluator creating a realistic mock interview for InterviewIQ.

Target Role: {role}
Candidate Experience: {experience}
Interview Type: {interview_type}
Difficulty: {difficulty}
Required Number of Questions: {question_count}

Key Skills:
{", ".join(skills) if skills else "Core competencies"}

Job Description:
{job_description[:1500] if job_description else "None"}

Resume Background:
{resume_context[:1500] if resume_context else "None"}

REQUIREMENTS:

1. Generate EXACTLY {question_count} questions.
2. Match the selected role, experience, difficulty and skills.
3. Avoid duplicate questions.
4. Mix MCQ and open-ended questions.
5. MCQs must contain exactly 4 unique options.
6. MCQs must contain correct_answer matching one of the options.
7. Text questions must not contain options or correct_answer.
8. IDs must start at 1 and be sequential.

Return ONLY valid JSON.

Schema:

{{
  "questions": [
    {{
      "id": 1,
      "type": "mcq",
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correct_answer": "Option A",
      "topic": "Topic"
    }},
    {{
      "id": 2,
      "type": "text",
      "question": "Question text",
      "topic": "Topic"
    }}
  ]
}}
"""

        response_text = await generate_text(prompt)

        result = AIService._parse_json(response_text)

        questions = result.get("questions")

        if not isinstance(questions, list):
            raise RuntimeError(
                "Gemini response does not contain a valid questions list."
            )

        if len(questions) != question_count:
            raise RuntimeError(
                f"Gemini generated {len(questions)} questions, "
                f"but {question_count} were requested."
            )

        for index, question in enumerate(
            questions,
            start=1,
        ):

            if not isinstance(question, dict):
                raise RuntimeError(
                    f"Question {index} is invalid."
                )

            question["id"] = index

            if question.get("type") not in {
                "mcq",
                "text",
            }:
                raise RuntimeError(
                    f"Question {index} has an invalid type."
                )

            if not question.get("question"):
                raise RuntimeError(
                    f"Question {index} has no text."
                )

            if not question.get("topic"):
                question["topic"] = "General"

            if question["type"] == "mcq":

                options = question.get(
                    "options",
                    [],
                )

                if (
                    not isinstance(options, list)
                    or len(options) != 4
                ):
                    raise RuntimeError(
                        f"MCQ question {index} must have exactly 4 options."
                    )

                if len(set(options)) != 4:
                    raise RuntimeError(
                        f"MCQ question {index} has duplicate options."
                    )

                if question.get(
                    "correct_answer"
                ) not in options:
                    raise RuntimeError(
                        f"MCQ question {index} has an invalid correct answer."
                    )

            else:
                question.pop("options", None)
                question.pop("correct_answer", None)

        return result

    @staticmethod
    async def evaluate_interview(
        questions: list,
        answers: dict,
        role: str,
        skills: list,
        job_description: str = "",
    ) -> dict:

        prompt = f"""
You are a Lead Technical Hiring Evaluator at InterviewIQ.

Role:
{role}

Skills:
{", ".join(skills) if skills else "Not specified"}

Job Description:
{job_description[:1500] if job_description else "None"}

Questions and candidate answers:

{json.dumps({
    "questions": questions,
    "answers": answers,
}, indent=2)}

TASK:

1. Score every question from 0 to 100.
2. Calculate overall_score.
3. Calculate:
   technical_score
   communication_score
   problem_solving_score
   confidence_score
4. Provide exactly 3 strengths.
5. Provide 2-3 weaknesses.
6. Provide exactly 3 recommendations.
7. Evaluate every question.

Return ONLY valid JSON.

Schema:

{{
  "overall_score": 85,
  "technical_score": 88,
  "communication_score": 82,
  "problem_solving_score": 86,
  "confidence_score": 84,
  "strengths": ["...", "...", "..."],
  "weaknesses": ["...", "..."],
  "recommendations": ["...", "...", "..."],
  "question_evaluations": [
    {{
      "question_id": 1,
      "score": 90,
      "feedback": "...",
      "suggested_answer": "..."
    }}
  ]
}}
"""

        response_text = await generate_text(prompt)

        result = AIService._parse_json(
            response_text
        )

        for field in [
            "overall_score",
            "technical_score",
            "communication_score",
            "problem_solving_score",
            "confidence_score",
        ]:

            score = result.get(field)

            if not isinstance(
                score,
                (int, float),
            ):
                raise RuntimeError(
                    f"{field} must be a number."
                )

            if not 0 <= score <= 100:
                raise RuntimeError(
                    f"{field} must be between 0 and 100."
                )

        return result