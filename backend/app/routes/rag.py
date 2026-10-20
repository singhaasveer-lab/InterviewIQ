import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.rag import Document, DocumentChunk
from backend.app.models.user import User
from backend.app.auth.security import get_current_user
from backend.app.schemas.chat import RAGUploadRequest, RAGSearchRequest

router = APIRouter(prefix="/rag", tags=["rag"])

@router.post("/upload")
def upload_rag_doc(req: RAGUploadRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id

    doc = Document(
        id=f"doc-{uuid.uuid4().hex[:12]}",
        user_id=user_id,
        title=req.title,
        category=req.category or "study_notes"
    )
    db.add(doc)

    paragraphs = [p.strip() for p in req.content.split("\n\n") if p.strip()]
    for idx, p in enumerate(paragraphs):
        chunk = DocumentChunk(
            id=f"chk-{uuid.uuid4().hex[:12]}",
            document_id=doc.id,
            chunk_index=idx,
            content=p,
            keywords=[w.lower() for w in p.split()[:5]]
        )
        db.add(chunk)

    db.commit()
    return {"success": True, "document_id": doc.id, "chunks_count": len(paragraphs)}

@router.post("/search")
def search_rag(req: RAGSearchRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tokens = req.query.lower().split()
    chunks = (
        db.query(DocumentChunk)
        .join(Document, Document.id == DocumentChunk.document_id)
        .filter(Document.user_id == current_user.id)
        .all()
    )
    results = []

    for c in chunks:
        score = 0
        content_lower = c.content.lower()
        for t in tokens:
            if t in content_lower:
                score += 15
        if score > 0:
            doc = db.query(Document).filter(Document.id == c.document_id).first()
            results.append({
                "documentId": c.document_id,
                "docTitle": doc.title if doc else "Document",
                "category": doc.category if doc else "notes",
                "chunkId": c.id,
                "content": c.content,
                "score": min(98, 60 + score)
            })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {"query": req.query, "results": results[:req.limit], "total_matches": len(results)}

@router.get("/documents")
def get_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "category": d.category,
            "chunkCount": len(d.chunks),
            "createdAt": d.created_at.isoformat()
        }
        for d in docs
    ]
