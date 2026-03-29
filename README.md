<div align="center">

# ⚡ Nexus

### Stateful Agentic Research Engine

*A multi-actor orchestration pipeline that autonomously researches, analyzes, and synthesizes web data into publication-ready Markdown — streamed in real-time.*

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://nexus-research.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_14-000?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=flat-square&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)

</div>

---

## 📖 Overview

**Nexus** orchestrates specialized AI agents through a deterministic stateful graph to perform end-to-end research automation. By moving beyond linear LLM chains, Nexus implements a **Directed Acyclic Graph (DAG)** where each node maintains a persistent global state.

The system is built on two core engineering principles:
1. **Observability** — Every node transition is streamed to the frontend via Server-Sent Events (SSE), providing real-time visibility into the agentic workflow.
2. **Determinism** — The graph topology guarantees a strict `Researcher → Analyst → Writer` execution contract, eliminating "context drift" common in standard LLM calls.

---

## 🏗️ Architecture



```mermaid
graph TD
    UserInput[Topic Input] --> Researcher;
    
    subgraph Nexus: Agentic Orchestration
        Researcher[Researcher: Tavily Search] --> Analyst;
        Analyst{Gemini: Fact Extraction} --> Analyst_Check;
        Analyst_Check[Validated Data] --> Writer;
        Analyst_Check[Needs More Context?] -.->|Loop| Researcher;
        Writer[Gemini: Markdown Synthesis] --> Synthesis[Technical Post];
    end
    
    Synthesis --> OutputPage[Live UI View];
