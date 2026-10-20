import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.interview import Interview, Question, Answer, Evaluation
from backend.app.models.user import User
from backend.app.auth.security import get_current_user
from backend.app.auth.rate_limit import ai_rate_limit

from backend.app.schemas.interview import (
    InterviewGenerateRequest,
    InterviewGenerateResponse,
    InterviewEvaluateRequest,
    EvaluationResponse,
)

from backend.app.services.ai_service import AIService


router = APIRouter(
    prefix="/interview",
    tags=["interview"]
)


@router.post(
    "/generate",
    response_model=InterviewGenerateResponse
)
async def generate_interview(
    req: InterviewGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(ai_rate_limit)
):

    ai_result = await AIService.generate_interview_questions(
        role=req.role,
        experience=req.experience,
        interview_type=req.interview_type,
        difficulty=req.difficulty,
        question_count=req.question_count,
        skills=req.skills,
        job_description=req.job_description or "",
        resume_context=req.resume_context or ""
    )

    questions_list = ai_result.get("questions", [])

    # Guarantee maximum requested question count
    if len(questions_list) > req.question_count:
        questions_list = questions_list[:req.question_count]

    user_id = current_user.id

    # Create interview
    interview = Interview(
        id=f"int-{uuid.uuid4().hex[:12]}",
        user_id=user_id,
        role=req.role,
        experience=req.experience,
        interview_type=req.interview_type,
        difficulty=req.difficulty,
        question_count=req.question_count,
        skills=req.skills,
        job_description=req.job_description,
        resume_context=req.resume_context
    )

    db.add(interview)

    # Save generated questions
    for idx, q in enumerate(questions_list):

        db_q = Question(
            interview_id=interview.id,
            index=idx + 1,
            question_type=q.get("type", "text"),
            question_text=q.get("question", ""),
            options=q.get("options"),
            correct_answer=q.get("correct_answer"),
            topic=q.get("topic", "General")
        )

        db.add(db_q)

    db.commit()

    return {
        "interview_id": interview.id,
        "questions": questions_list,
        "total_questions": len(questions_list),
        "role": req.role,
        "difficulty": req.difficulty
    }


@router.post(
    "/evaluate",
    response_model=EvaluationResponse
)
async def evaluate_interview(
    req: InterviewEvaluateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(ai_rate_limit)
):

    eval_result = await AIService.evaluate_interview(
        questions=req.questions,
        answers=req.answers,
        role=req.role or "Software Engineer",
        skills=req.skills or [],
        job_description=req.job_description or ""
    )

    eval_q_feedback = []

    eval_map = {
        e.get("question_id"): e
        for e in eval_result.get("question_evaluations", [])
    }

    for q in req.questions:

        qid = q.get("id")

        match = eval_map.get(qid, {})

        user_answer = (
            req.answers.get(str(qid))
            or req.answers.get(qid)
            or "(Skipped)"
        )

        eval_q_feedback.append({
            "questionId": qid,
            "question": q.get("question", ""),
            "userAnswer": user_answer,
            "score": match.get("score", 75),
            "feedback": match.get(
                "feedback",
                "Solid effort."
            ),
            "suggestedAnswer": match.get(
                "suggested_answer",
                "Standard industry solution."
            ),
            "topic": q.get(
                "topic",
                "General"
            )
        })

    response_payload = {

        "overallScore": eval_result.get(
            "overall_score",
            80
        ),

        "technicalScore": eval_result.get(
            "technical_score",
            80
        ),

        "communicationScore": eval_result.get(
            "communication_score",
            80
        ),

        "problemSolvingScore": eval_result.get(
            "problem_solving_score",
            80
        ),

        "confidenceScore": eval_result.get(
            "confidence_score",
            80
        ),

        "strengths": eval_result.get(
            "strengths",
            ["Solid foundational knowledge"]
        ),

        "weaknesses": eval_result.get(
            "weaknesses",
            ["Could provide more metrics"]
        ),

        "recommendations": eval_result.get(
            "recommendations",
            ["Structure answers with STAR format"]
        ),

        "questionFeedback": eval_q_feedback
    }

    # Save evaluation
    if req.interview_id:

        interview = (
            db.query(Interview)
            .filter(
                Interview.id == req.interview_id,
                Interview.user_id == current_user.id
            )
            .first()
        )

        if interview:

            interview.completed_at = datetime.utcnow()

            db_eval = Evaluation(
                interview_id=interview.id,
                overall_score=response_payload["overallScore"],
                technical_score=response_payload["technicalScore"],
                communication_score=response_payload["communicationScore"],
                problem_solving_score=response_payload["problemSolvingScore"],
                confidence_score=response_payload["confidenceScore"],
                strengths=response_payload["strengths"],
                weaknesses=response_payload["weaknesses"],
                recommendations=response_payload["recommendations"],
                per_question_feedback=eval_q_feedback
            )

            db.add(db_eval)

            db.commit()

    return response_payload


@router.get("/history")
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.created_at.desc())
        .all()
    )

    results = []

    for item in interviews:

        results.append({

            "id": item.id,

            "role": item.role,

            "experience": item.experience,

            "interviewType": item.interview_type,

            "difficulty": item.difficulty,

            "questionCount": item.question_count,

            "score": (
                item.evaluation.overall_score
                if item.evaluation
                else None
            ),

            "createdAt": (
                item.created_at.isoformat()
            ),

            "completedAt": (
                item.completed_at.isoformat()
                if item.completed_at
                else None
            ),

            "hasEvaluation": bool(
                item.evaluation
            )
        })

    return results


@router.get("/{interview_id}")
def get_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id
        )
        .first()
    )

    if not interview:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found."
        )

    return {

        "id": interview.id,

        "role": interview.role,

        "difficulty": interview.difficulty,

        "questionCount": interview.question_count,

        "evaluation": (

            {
                "overallScore":
                    interview.evaluation.overall_score,

                "technicalScore":
                    interview.evaluation.technical_score,

                "communicationScore":
                    interview.evaluation.communication_score,

                "problemSolvingScore":
                    interview.evaluation.problem_solving_score,

                "confidenceScore":
                    interview.evaluation.confidence_score,

                "strengths":
                    interview.evaluation.strengths,

                "weaknesses":
                    interview.evaluation.weaknesses,

                "recommendations":
                    interview.evaluation.recommendations,

                "questionFeedback":
                    interview.evaluation.per_question_feedback
            }

            if interview.evaluation
            else None
        )
    }


@router.delete("/{interview_id}")
def delete_interview(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id
        )
        .first()
    )

    if not interview:

        raise HTTPException(
            status_code=404,
            detail="Interview not found."
        )

    db.delete(interview)

    db.commit()

    return {
        "success": True,
        "message": "Interview deleted successfully."
    }