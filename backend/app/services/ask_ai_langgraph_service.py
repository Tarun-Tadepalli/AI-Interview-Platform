"""LangGraph orchestration for the existing Ask AI Gemini + RAG pipeline.

This module deliberately receives already-authorized context from ask_ai_routes.py.
It does not query the database, access other users, or change the existing RAG service.
"""

import logging
import re
from typing import TypedDict

from langgraph.graph import END, START, StateGraph

logger = logging.getLogger("app.ask_ai.langgraph")


class AskAIState(TypedDict, total=False):
    question: str
    history: list[dict[str, str]]
    system_prompt: str
    api_key: str
    model_name: str
    intent: str
    conversation_input: str
    answer: str


def _classify_question(state: AskAIState) -> dict:
    """Classify the request for observability and future routing; no model call."""
    question = (state.get("question") or "").lower()
    rules = (
        ("resume", r"\b(resume|résumé|cv|project|certification|experience|skills?)\b"),
        ("typing", r"\b(typing|wpm|words per minute|accuracy|keystrokes)\b"),
        ("speaking", r"\b(speaking|speech|fluency|pronunciation|voice)\b"),
        ("interview", r"\b(interview|answer|scorecard|suggested answer)\b"),
        ("progress", r"\b(progress|compare|trend|improve|performance|history)\b"),
    )
    for intent, pattern in rules:
        if re.search(pattern, question, flags=re.IGNORECASE):
            return {"intent": intent}
    return {"intent": "general"}


def _prepare_conversation(state: AskAIState) -> dict:
    """Build a bounded conversation input from the route's safe prompt and history."""
    parts = []
    for item in (state.get("history") or [])[-8:]:
        content = str(item.get("content") or "").strip()
        if not content:
            continue
        role = "User" if item.get("role") == "user" else "Assistant"
        parts.append(f"{role}: {content[:2500]}")
    parts.append(f"User: {(state.get('question') or '').strip()}")
    intent = state.get("intent", "general")
    conversation_input = (
        f"{state.get('system_prompt', '')}\n\n"
        f"REQUEST CATEGORY (for response focus only): {intent}\n\n"
        "Conversation:\n" + "\n".join(parts) + "\n\nAssistant:"
    )
    return {"conversation_input": conversation_input}


def _generate_answer(state: AskAIState) -> dict:
    """Call the same Gemini Interactions API used by the previous route."""
    from google import genai

    client = genai.Client(api_key=state["api_key"])
    result = client.interactions.create(
        model=state["model_name"],
        input=state["conversation_input"],
    )
    return {"answer": (result.output_text or "").strip()}


def _validate_answer(state: AskAIState) -> dict:
    answer = (state.get("answer") or "").strip()
    if not answer:
        raise RuntimeError("The AI returned an empty response.")
    return {"answer": answer}


def _build_graph():
    graph = StateGraph(AskAIState)
    graph.add_node("classify_question", _classify_question)
    graph.add_node("prepare_conversation", _prepare_conversation)
    graph.add_node("generate_answer", _generate_answer)
    graph.add_node("validate_answer", _validate_answer)
    graph.add_edge(START, "classify_question")
    graph.add_edge("classify_question", "prepare_conversation")
    graph.add_edge("prepare_conversation", "generate_answer")
    graph.add_edge("generate_answer", "validate_answer")
    graph.add_edge("validate_answer", END)
    return graph.compile()


# Compile once per worker process, not on every chat request.
_ASK_AI_GRAPH = _build_graph()


def generate_with_langgraph(
    *,
    question: str,
    history: list[dict[str, str]],
    system_prompt: str,
    api_key: str,
    model_name: str,
) -> dict[str, str]:
    """Run the Ask AI workflow and return its answer and request category."""
    result = _ASK_AI_GRAPH.invoke({
        "question": question,
        "history": history,
        "system_prompt": system_prompt,
        "api_key": api_key,
        "model_name": model_name,
    })
    return {
        "answer": result.get("answer", ""),
        "intent": result.get("intent", "general"),
    }
