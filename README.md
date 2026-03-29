<div align="center">

# ⚡ Nexus

### Stateful Agentic Research Engine

*A multi-actor pipeline that autonomously researches, analyzes, and synthesizes web data into publication-ready Markdown — streamed in real-time.*

[![Live Demo](https://img.shields.io/badge/▶_Live_Demo-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://nexus-research.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_14-000?style=flat-square&logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-1C3C3C?style=flat-square&logo=langchain&logoColor=white)](https://langchain-ai.github.io/langgraph/)

</div>

---

## Overview

**Nexus** orchestrates three specialized AI agents through a deterministic stateful graph to perform end-to-end research automation. Type a topic, hit Capture, and watch the pipeline execute in real-time — from web retrieval to structured analysis to polished Markdown output.

The system is built on two principles:
1. **Observability** — Every node transition is streamed to the frontend via SSE, giving full visibility into the pipeline's execution state.
2. **Determinism** — The DAG topology guarantees a consistent `Researcher → Analyst → Writer` execution order with typed state contracts.

---

## Architecture

```mermaid
graph TD
    UserInput[Topic: Quantum Computing] --> Researcher;
    
    subgraph Nexus: Agentic Orchestration
        Researcher[Researcher: Tavily Search] --> Analyst;
        Analyst{Gemini: Filter Data} --> Analyst_Check;
        Analyst_Check[Validated Data] --> Writer;
        Analyst_Check[Needs More Data?] -.->|Loop| Researcher;
        Writer[Gemini: Generate Markdown] --> Synthesis[Final Blog Post];
    end
    
    Synthesis --> OutputPage[Live UI View];


### State Contract

Every node reads from and writes to a shared typed state object:

```python
class AgentState(TypedDict):
    topic: str            # User-provided research query
    research_notes: str   # Raw web data        (Researcher → )
    analysis: str         # Distilled insights   (Analyst → )
    final_post: str       # Markdown output      (Writer → )
```

The graph is compiled via LangGraph's `StateGraph` into a single executable with strict edge definitions (`START → researcher → analyst → writer → END`), eliminating ambiguity in execution order.

---

## Features

| Feature | Description |
|---|---|
| **Stateful Multi-Actor Logic** | Three agents with typed state contracts orchestrated through a LangGraph DAG. Each node is a pure function that receives accumulated state and returns a partial update. |
| **Real-time Web Research via Tavily** | The Researcher agent retrieves up to 3 high-relevance results from the live web using Tavily's search API, providing the pipeline with current, factual source material. |
| **Streamed Markdown Synthesis** | Server-Sent Events stream each node's completion status to the frontend in real-time. The final output is rendered through ReactMarkdown with `prose-invert` styling. |
| **Minimalist Dark Mode UI** | A precision-crafted interface inspired by Linear and Lazy — glassmorphism containers, ambient glow backgrounds, glowing status pills, and monospaced typography. |
| **In-App Documentation** | Full technical documentation rendered in a glassmorphism modal via the Docs button, powered by ReactMarkdown. |

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | React server components, file-based routing |
| **Styling** | Tailwind CSS 3.4 | Utility-first, minimalist dark mode theme |
| **Icons** | Lucide React | Consistent, lightweight SVG icon system |
| **Markdown** | ReactMarkdown + Typography | Renders agent output with `prose-invert prose-zinc` |
| **Backend** | FastAPI | Async Python API with SSE streaming |
| **Orchestration** | LangGraph | Stateful DAG for multi-agent coordination |
| **Search** | Tavily API | Real-time web search and content extraction |
| **LLM** | Gemini 2.5 Flash | Analysis and content generation |
| **Deployment** | Vercel | Serverless functions (Python) + Next.js edge |

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Tavily API Key](https://tavily.com)
- [Google AI API Key](https://aistudio.google.com)

### 1. Clone & Configure

```bash
git clone https://github.com/your-username/nexus-research.git
cd nexus-research
```

Create `backend/.env`:

```env
GOOGLE_API_KEY=your_google_ai_key
TAVILY_API_KEY=your_tavily_key
```

### 2. Backend

```bash
cd backend
pip install -r ../requirements.txt
python -m uvicorn main:app --reload
```

API available at `http://localhost:8000`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

UI available at `http://localhost:3000`

---

## Deployment (Vercel)

The project is pre-configured for Vercel monorepo deployment:

```
vercel.json          → Build config + API rewrites
api/main.py          → Serverless FastAPI handler
frontend/            → Next.js app
requirements.txt     → Python dependencies
```

Set environment variables in the Vercel dashboard:
- `GOOGLE_API_KEY`
- `TAVILY_API_KEY`

Then deploy:

```bash
vercel --prod
```

---

## Project Structure

```
nexus-research/
├── api/                          # Vercel serverless functions
│   ├── __init__.py
│   ├── main.py                   # FastAPI + SSE streaming
│   └── research_graph.py         # LangGraph pipeline
├── backend/                      # Local development server
│   ├── .env                      # API keys (gitignored)
│   ├── main.py                   # FastAPI app
│   └── research_graph.py         # LangGraph pipeline
├── frontend/
│   ├── src/app/
│   │   ├── globals.css           # Tailwind + custom theme
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Dashboard UI
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── vercel.json                   # Deployment config
├── requirements.txt              # Python dependencies
├── DOCUMENTATION.md              # Full technical docs
└── README.md                     # This file
```

---

## API Reference

### `POST /api/generate`

Streams research pipeline execution via SSE.

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"topic": "quantum computing and cryptography"}'
```

**Events:**
```
data: {"node": "researcher"}
data: {"node": "analyst"}
data: {"node": "writer", "final_post": "# Generated Blog Post\n\n..."}
```

---

## License

MIT

---

<div align="center">

*Built with precision. Designed for velocity.*

</div>
