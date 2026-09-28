import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from services.database import get_db
from services.models import User, ChatMessage, DocumentRAG
from services.auth_utils import get_current_user
from services.ollama_service import generar_resumen

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


# ─── Schemas Pydantic ────────────────────────────────────────────────────────

class ChatMessageIn(BaseModel):
    document_id: Optional[str] = None   # ID del doc RAG para contexto
    content: str                         # Pregunta del usuario


class ChatMessageOut(BaseModel):
    id: str
    role: str          # "user" | "assistant"
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    user_message: ChatMessageOut
    assistant_message: ChatMessageOut


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/message", response_model=ChatResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    body: ChatMessageIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Envía una pregunta al asistente. Si se provee document_id, el contenido
    del documento se usa como contexto RAG para la respuesta.
    """
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="El mensaje no puede estar vacío.")

    # 1. Obtener contexto del documento si se indicó
    contexto = ""
    if body.document_id:
        doc = db.query(DocumentRAG).filter(
            DocumentRAG.id == body.document_id,
            DocumentRAG.user_id == current_user.id
        ).first()
        if not doc:
            raise HTTPException(status_code=404, detail="Documento no encontrado.")
        contexto = f"\n\n--- Contexto del documento '{doc.filename}' ---\n{doc.content[:6000]}\n---\n"

    # 2. Guardar mensaje del usuario
    user_msg_id = str(uuid.uuid4())[:8]
    user_msg = ChatMessage(
        id=user_msg_id,
        user_id=current_user.id,
        document_id=body.document_id,
        role="user",
        content=body.content.strip()
    )
    db.add(user_msg)
    db.flush()  # Para tener el timestamp real

    # 3. Construir historial reciente para el prompt (últimos 6 turnos)
    history = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id,
        ChatMessage.document_id == body.document_id
    ).order_by(ChatMessage.created_at.desc()).limit(6).all()
    history.reverse()

    history_text = ""
    for msg in history[:-1]:  # Excluir el mensaje recién agregado
        prefix = "Usuario" if msg.role == "user" else "Asistente"
        history_text += f"{prefix}: {msg.content}\n"

    # 4. Construir el prompt completo
    prompt = (
        "Eres un asistente experto en análisis de documentos. "
        "Responde en español de manera clara, precisa y concisa."
        f"{contexto}"
        f"\n\nHistorial de conversación:\n{history_text}"
        f"\nUsuario: {body.content.strip()}"
        "\nAsistente:"
    )

    # 5. Llamar a Ollama
    respuesta = generar_resumen(prompt)
    if "Error conectando" in respuesta:
        db.rollback()
        raise HTTPException(status_code=503, detail="El servicio de IA no está disponible.")

    # 6. Guardar respuesta del asistente
    assistant_msg_id = str(uuid.uuid4())[:8]
    assistant_msg = ChatMessage(
        id=assistant_msg_id,
        user_id=current_user.id,
        document_id=body.document_id,
        role="assistant",
        content=respuesta.strip()
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(user_msg)
    db.refresh(assistant_msg)

    return ChatResponse(
        user_message=ChatMessageOut.from_orm(user_msg),
        assistant_message=ChatMessageOut.from_orm(assistant_msg)
    )


@router.get("/history", response_model=List[ChatMessageOut])
async def get_chat_history(
    document_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna el historial de mensajes del usuario.
    Filtrar por document_id para obtener la conversación de un documento específico.
    """
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if document_id:
        query = query.filter(ChatMessage.document_id == document_id)
    messages = query.order_by(ChatMessage.created_at.asc()).limit(limit).all()
    return [ChatMessageOut.from_orm(m) for m in messages]


@router.delete("/history")
async def clear_chat_history(
    document_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Elimina el historial de chat del usuario (opcionalmente solo de un documento)."""
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if document_id:
        query = query.filter(ChatMessage.document_id == document_id)
    count = query.delete()
    db.commit()
    return {"message": f"{count} mensaje(s) eliminado(s)."}
