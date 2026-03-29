# Agentic Research Engine

> A multi-actor, stateful research pipeline that autonomously retrieves, analyzes, and synthesizes web data into publication-ready Markdown content.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Core Features](#core-features)
- [System Architecture](#system-architecture)
- [State Schema](#state-schema)
- [Graph Execution Flow](#graph-execution-flow)
- [API Reference](#api-reference)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Project Overview

The **Agentic Research Engine** is a full-stack application that orchestrates multiple AI agents through a directed acyclic graph (DAG) to perform end-to-end research automation. Given a user-provided topic, the system autonomously:

1. **Retrieves** relevant web data via real-time search APIs
2. **Analyzes** and distills the raw data into structured insights
3. **Generates** a publication-quality Markdown blog post

The pipeline is built on LangGraph's stateful graph abstraction, enabling deterministic node-to-node state transitions with full observability. The frontend provides real-time visibility into each agent's execution status via Server-Sent Events (SSE).

---

## Tech Stack

| Layer        | Technology              | Version   | Purpose                                      |
|-------------|------------------------|-----------|----------------------------------------------|
| **Frontend** | Next.js                | 14.2.x    | React framework with App Router              |
| **Frontend** | Tailwind CSS           | 3.4.x     | Utility-first CSS framework                  |
| **Frontend** | ReactMarkdown          | 10.x      | Markdown-to-JSX rendering                    |
| **Frontend** | Lucide React           | 1.7.x     | Icon system                                  |
| **Backend**  | FastAPI                | latest    | Async Python web framework                   |
| **Backend**  | LangGraph              | latest    | Stateful multi-agent orchestration framework |
| **Backend**  | Tavily Search API      | latest    | Real-time web search retrieval               |
| **Backend**  | Gemini 2.5 Flash       | latest    | LLM for analysis and content generation      |
| **Backend**  | LangChain Google GenAI | latest    | Gemini integration via LangChain             |

---

## Core Features

### Autonomous Research
The Researcher agent invokes the Tavily Search API with the user's topic, retrieving up to 3 high-relevance web results. Each result includes the source URL and extracted content, formatted into structured research notes.

### Multi-Actor Orchestration
Three specialized agents operate in a linear DAG managed by LangGraph's `StateGraph`:
- **Researcher** → data retrieval
- **Analyst** → data filtering and insight extraction
- **Writer** → content synthesis and formatting

Each agent receives the accumulated state from all prior nodes and appends its output to the shared `AgentState` object.

### Markdown Synthesis
The Writer agent produces fully formatted Markdown output with proper heading hierarchy, paragraph structure, inline code, and blockquotes — ready for direct publication or further editorial review.

### Real-time Status Tracking
The frontend receives Server-Sent Events (SSE) from the FastAPI backend as each graph node completes execution. Status indicators transition in real-time:

```
SEARCHING → ANALYZING → WRITING → COMPLETE
```

---

## System Architecture

### Stateful Graph Model

The core orchestration layer uses LangGraph's `StateGraph` abstraction. The graph defines a strict linear topology:

```
START → researcher → analyst → writer → END
```

Each node is a pure function that:
1. **Reads** from the shared `AgentState` (a `TypedDict`)
2. **Performs** its specialized task (search, LLM inference, etc.)
3. **Returns** a partial state update (merged into the global state)

### State Schema

```python
class AgentState(TypedDict):
    topic: str            # User-provided research topic
    research_notes: str   # Raw web data from Tavily (Researcher output)
    analysis: str         # Distilled insights from Gemini (Analyst output)
    final_post: str       # Publication-ready Markdown (Writer output)
```

### Node Specifications

#### `researcher(state: AgentState) → dict`
- **Input:** `state["topic"]`
- **Tool:** `TavilySearchResults(max_results=3)`
- **Output:** `{"research_notes": formatted_results}`
- **Behavior:** Invokes the Tavily API, iterates over results, and concatenates URL + content pairs into a single string.

#### `analyst(state: AgentState) → dict`
- **Input:** `state["topic"]`, `state["research_notes"]`
- **Tool:** `ChatGoogleGenerativeAI(model="gemini-2.5-flash")`
- **Output:** `{"analysis": response.content}`
- **Behavior:** Prompts Gemini to act as an expert analyst, producing a structured summary of the raw research data.

#### `writer(state: AgentState) → dict`
- **Input:** `state["topic"]`, `state["analysis"]`
- **Tool:** `ChatGoogleGenerativeAI(model="gemini-2.5-flash")`
- **Output:** `{"final_post": response.content}`
- **Behavior:** Prompts Gemini to act as a professional blog writer, transforming the analysis into a well-formatted Markdown post.

---

## Graph Execution Flow

```
┌─────────────────────────────────────────────────────────┐
│                      User Input                         │
│                   (topic: string)                       │
└─────────────┬───────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────┐
│       RESEARCHER        │
│  Tavily Search API      │
│  → research_notes       │
│  (3 web results)        │
└─────────────┬───────────┘
              │  SSE: {"node": "researcher"}
              ▼
┌─────────────────────────┐
│        ANALYST          │
│  Gemini 2.5 Flash       │
│  → analysis             │
│  (structured insights)  │
└─────────────┬───────────┘
              │  SSE: {"node": "analyst"}
              ▼
┌─────────────────────────┐
│         WRITER          │
│  Gemini 2.5 Flash       │
│  → final_post           │
│  (Markdown output)      │
└─────────────┬───────────┘
              │  SSE: {"node": "writer", "final_post": "..."}
              ▼
┌─────────────────────────┐
│        FRONTEND         │
│  ReactMarkdown render   │
│  + prose-invert styling │
└─────────────────────────┘
```

---

## API Reference

### `POST /generate`

Initiates the research pipeline and streams results via SSE.

**Request Body:**
```json
{
  "topic": "The impact of quantum computing on modern cryptography"
}
```

**Response:** `text/event-stream`

Each event follows the SSE format:
```
data: {"node": "researcher"}\n\n
data: {"node": "analyst"}\n\n
data: {"node": "writer", "final_post": "# Blog Post Title\n\n..."}\n\n
```

### `GET /`

Health check endpoint.

**Response:**
```json
{
  "message": "Agent Researcher API is running. Try POST /generate"
}
```

---

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- Tavily API Key ([tavily.com](https://tavily.com))
- Google AI API Key ([aistudio.google.com](https://aistudio.google.com))

### Backend

```bash
cd agent-researcher/backend

# Create and populate .env
echo "GOOGLE_API_KEY=your_key_here" > .env
echo "TAVILY_API_KEY=your_key_here" >> .env

# Install dependencies
pip install langgraph langchain-google-genai langchain-community tavily-python fastapi uvicorn python-dotenv

# Start the server
python -m uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd agent-researcher/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The UI will be available at `http://localhost:3000`.

---

## Environment Variables

| Variable          | Required | Description                    |
|-------------------|----------|--------------------------------|
| `GOOGLE_API_KEY`  | Yes      | Google AI Studio API key       |
| `TAVILY_API_KEY`  | Yes      | Tavily Search API key          |

Both variables must be defined in `backend/.env`.

---

## Project Structure

```
agent-researcher/
├── backend/
│   ├── .env                  # API keys (not committed)
│   ├── main.py               # FastAPI app with SSE streaming
│   └── research_graph.py     # LangGraph stateful pipeline
├── frontend/
│   ├── src/app/
│   │   ├── globals.css       # Tailwind directives + theme
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Main dashboard UI
│   ├── tailwind.config.js    # Tailwind v3 configuration
│   ├── postcss.config.js     # PostCSS plugin chain
│   └── package.json
└── DOCUMENTATION.md          # This file
```

---

*Built with precision. Designed for velocity.*
