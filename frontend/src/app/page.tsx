'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Sparkles, Search, BrainCircuit, PenTool, CheckCircle2, ArrowRight, FileText, X } from 'lucide-react';

// ─── Documentation Content (mirrors DOCUMENTATION.md) ───
const DOCS_CONTENT = `# Agentic Research Engine

> A multi-actor, stateful research pipeline that autonomously retrieves, analyzes, and synthesizes web data into publication-ready Markdown content.

---

## Project Overview

The **Agentic Research Engine** is a full-stack application that orchestrates multiple AI agents through a directed acyclic graph (DAG) to perform end-to-end research automation. Given a user-provided topic, the system autonomously:

1. **Retrieves** relevant web data via real-time search APIs
2. **Analyzes** and distills the raw data into structured insights
3. **Generates** a publication-quality Markdown blog post

The pipeline is built on LangGraph's stateful graph abstraction, enabling deterministic node-to-node state transitions with full observability. The frontend provides real-time visibility into each agent's execution status via Server-Sent Events (SSE).

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14.2.x | React framework with App Router |
| **Frontend** | Tailwind CSS 3.4.x | Utility-first CSS framework |
| **Frontend** | ReactMarkdown 10.x | Markdown-to-JSX rendering |
| **Backend** | FastAPI | Async Python web framework |
| **Backend** | LangGraph | Stateful multi-agent orchestration |
| **Backend** | Tavily Search API | Real-time web search retrieval |
| **Backend** | Gemini 2.5 Flash | LLM for analysis & generation |

---

## Core Features

### Autonomous Research
The Researcher agent invokes the Tavily Search API with the user's topic, retrieving up to 3 high-relevance web results. Each result includes the source URL and extracted content, formatted into structured research notes.

### Multi-Actor Orchestration
Three specialized agents operate in a linear DAG managed by LangGraph's \`StateGraph\`:
- **Researcher** → data retrieval
- **Analyst** → data filtering and insight extraction
- **Writer** → content synthesis and formatting

### Markdown Synthesis
The Writer agent produces fully formatted Markdown output with proper heading hierarchy, paragraph structure, inline code, and blockquotes.

### Real-time Status Tracking
The frontend receives Server-Sent Events (SSE) from the FastAPI backend as each graph node completes execution.

\`\`\`
SEARCHING → ANALYZING → WRITING → COMPLETE
\`\`\`

---

## System Architecture

### Stateful Graph Model

The core orchestration uses LangGraph's \`StateGraph\` abstraction with a strict linear topology:

\`\`\`
START → researcher → analyst → writer → END
\`\`\`

Each node is a pure function that reads from the shared \`AgentState\`, performs its task, and returns a partial state update.

### State Schema

\`\`\`python
class AgentState(TypedDict):
    topic: str            # User-provided research topic
    research_notes: str   # Raw web data from Tavily
    analysis: str         # Distilled insights from Gemini
    final_post: str       # Publication-ready Markdown
\`\`\`

### Node Specifications

| Node | Input | Tool | Output |
|---|---|---|---|
| \`researcher\` | \`topic\` | Tavily Search (3 results) | \`research_notes\` |
| \`analyst\` | \`topic\`, \`research_notes\` | Gemini 2.5 Flash | \`analysis\` |
| \`writer\` | \`topic\`, \`analysis\` | Gemini 2.5 Flash | \`final_post\` |

---

## API Reference

### \`POST /generate\`

Initiates the research pipeline and streams results via SSE.

**Request:**
\`\`\`json
{ "topic": "The impact of quantum computing on modern cryptography" }
\`\`\`

**Response:** \`text/event-stream\`
\`\`\`
data: {"node": "researcher"}
data: {"node": "analyst"}
data: {"node": "writer", "final_post": "# Blog Post..."}
\`\`\`

### \`GET /\`
Health check endpoint.

---

## Setup Instructions

### Backend
\`\`\`bash
cd agent-researcher/backend
pip install langgraph langchain-google-genai langchain-community tavily-python fastapi uvicorn python-dotenv
python -m uvicorn main:app --reload
\`\`\`

### Frontend
\`\`\`bash
cd agent-researcher/frontend
npm install
npm run dev
\`\`\`

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| \`GOOGLE_API_KEY\` | Yes | Google AI Studio API key |
| \`TAVILY_API_KEY\` | Yes | Tavily Search API key |

Both must be defined in \`backend/.env\`.

---

*Built with precision. Designed for velocity.*
`;

// ─── Agent step config ───
const STEP_CONFIG: Record<string, { label: string; icon: React.ReactNode; glowColor: string }> = {
  researcher: {
    label: 'Searching',
    icon: <Search className="w-3.5 h-3.5" />,
    glowColor: 'bg-blue-500/20 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.3)] border-blue-500/30',
  },
  analyst: {
    label: 'Analyzing',
    icon: <BrainCircuit className="w-3.5 h-3.5" />,
    glowColor: 'bg-violet-500/20 text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.3)] border-violet-500/30',
  },
  writer: {
    label: 'Writing',
    icon: <PenTool className="w-3.5 h-3.5" />,
    glowColor: 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] border-emerald-500/30',
  },
  completed: {
    label: 'Complete',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    glowColor: 'bg-green-500/20 text-green-400 shadow-[0_0_12px_rgba(34,197,94,0.3)] border-green-500/30',
  },
};

export default function Home() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [docsOpen, setDocsOpen] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setActiveNode(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) throw new Error('Failed to fetch data from backend');
      if (!response.body) throw new Error('Response body is null');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedChunkStr = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          accumulatedChunkStr += chunkStr;
          const events = accumulatedChunkStr.split('\n\n');
          accumulatedChunkStr = events.pop() || '';

          for (const event of events) {
            if (event.startsWith('data: ')) {
              const dataStr = event.substring('data: '.length);
              if (!dataStr.trim()) continue;
              try {
                const data = JSON.parse(dataStr);
                if (data.error) { setError(data.error); break; }
                if (data.node) setActiveNode(data.node);
                if (data.final_post) {
                  setResult(data.final_post);
                  setActiveNode('completed');
                }
              } catch (e) {
                console.error('Error parsing JSON chunk from stream', e);
              }
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setActiveNode(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-start overflow-hidden">

      {/* ── Ambient background glow ── */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] rounded-full bg-zinc-700/10 blur-[160px]" />
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full bg-indigo-900/[0.07] blur-[120px]" />
      </div>

      {/* ── Main Content ── */}
      <main className="relative z-10 w-full max-w-3xl mx-auto px-6 pt-28 pb-20 flex flex-col items-center">

        {/* ── Hero Title ── */}
        <div className="text-center mb-16 space-y-5">
          <h1 className="text-5xl md:text-[64px] font-bold leading-[1.08] tracking-[-0.04em] bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Research at the speed
            <br />
            of thought
          </h1>
          <p className="text-zinc-500 text-lg font-light tracking-wide max-w-md mx-auto leading-relaxed">
            Research, analyze, and generate — powered by a multi-agent pipeline.
          </p>
        </div>

        {/* ── Agent Status Pills ── */}
        <div className="flex items-center gap-2 mb-10">
          {Object.entries(STEP_CONFIG).map(([key, config]) => {
            const isActive = activeNode === key;
            return (
              <div
                key={key}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-500
                  ${isActive
                    ? config.glowColor
                    : 'bg-zinc-900/40 text-zinc-600 border-zinc-800/50'
                  }
                `}
              >
                {isActive && loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  config.icon
                )}
                <span className="font-mono-clean tracking-wider uppercase text-[11px]">
                  {config.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Command Bar (Input) ── */}
        <div className="w-full relative group mb-8">
          <div className="absolute -bottom-px left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-zinc-600/50 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />

          <div className="relative bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-2xl p-1.5 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3">
              <input
                id="topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What should the agent research?"
                className="flex-1 bg-transparent px-5 py-4 text-[15px] text-zinc-200 placeholder:text-zinc-600 outline-none font-light tracking-wide"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                }}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !topic.trim()}
                className="flex items-center gap-2.5 px-6 py-3 mr-1 text-sm font-medium rounded-xl transition-all duration-300
                  bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white
                  disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-zinc-800
                  border border-zinc-700/50 hover:border-zinc-600/80
                  shadow-lg shadow-black/30 hover:shadow-black/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-mono-clean text-xs tracking-widest uppercase">Running</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Capture</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Active status line ── */}
        {activeNode && loading && (
          <div className="flex items-center gap-3 mb-10 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <p className="font-mono-clean text-xs text-zinc-500 tracking-widest uppercase">
              {STEP_CONFIG[activeNode]?.label || 'Processing'}...
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="w-full mb-8 bg-red-500/5 border border-red-500/10 rounded-2xl px-6 py-4 backdrop-blur-sm">
            <p className="text-red-400/80 text-sm font-light flex items-center gap-3">
              <span className="text-base">⚠</span>
              {error}
            </p>
          </div>
        )}

        {/* ── Result Output ── */}
        {result && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
              <span className="font-mono-clean text-[11px] text-zinc-600 tracking-[0.2em] uppercase">
                Generated Output
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-zinc-800 to-transparent" />
            </div>

            <div className="bg-zinc-900/30 backdrop-blur-xl border border-zinc-800/40 rounded-2xl p-8 md:p-12 shadow-2xl shadow-black/40">
              <div
                className="prose prose-invert prose-zinc max-w-none
                  prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-zinc-100
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-p:text-zinc-400 prose-p:leading-[1.85] prose-p:font-light prose-p:text-[15px]
                  prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300
                  prose-strong:text-zinc-200 prose-strong:font-semibold
                  prose-blockquote:border-l-zinc-700 prose-blockquote:bg-zinc-900/50 prose-blockquote:py-1 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-zinc-400
                  prose-ul:text-zinc-400 prose-ol:text-zinc-400
                  prose-li:text-[15px] prose-li:font-light prose-li:marker:text-zinc-700
                  prose-code:text-indigo-300/80 prose-code:bg-zinc-800/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:font-mono-clean prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-zinc-950/80 prose-pre:border prose-pre:border-zinc-800/50 prose-pre:rounded-xl
                  prose-hr:border-zinc-800/60
                  prose-img:rounded-2xl"
              >
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 w-full border-t border-zinc-900/80 mt-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="font-mono-clean text-[11px] text-zinc-700 tracking-widest uppercase">
            Agent Researcher
          </p>
          <button
            onClick={() => setDocsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-zinc-500 hover:text-zinc-300
              border border-zinc-800/50 hover:border-zinc-700/80
              bg-transparent hover:bg-zinc-900/50
              transition-all duration-300
              hover:shadow-[0_0_15px_rgba(82,82,91,0.15)]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="font-mono-clean text-[11px] tracking-wider uppercase">Docs</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </footer>

      {/* ── Docs Modal ── */}
      {docsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDocsOpen(false);
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

          {/* Modal Content */}
          <div className="relative z-10 w-full max-w-4xl mx-4 my-8 md:my-16 max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-8rem)] flex flex-col bg-zinc-950/95 border border-zinc-800/60 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/50 shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-zinc-500" />
                <h2 className="font-mono-clean text-sm text-zinc-300 tracking-wider uppercase">Documentation</h2>
              </div>
              <button
                onClick={() => setDocsOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800/50 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-8 md:px-12 py-10">
              <div
                className="prose prose-invert prose-zinc max-w-none
                  prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-zinc-100
                  prose-h1:text-3xl prose-h1:mb-6 prose-h1:pb-4 prose-h1:border-b prose-h1:border-zinc-800/50
                  prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-zinc-400 prose-p:leading-[1.85] prose-p:font-light prose-p:text-[15px]
                  prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:text-indigo-300
                  prose-strong:text-zinc-200 prose-strong:font-semibold
                  prose-blockquote:border-l-zinc-700 prose-blockquote:bg-zinc-900/50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-zinc-400
                  prose-ul:text-zinc-400 prose-ol:text-zinc-400
                  prose-li:text-[15px] prose-li:font-light prose-li:marker:text-zinc-700
                  prose-code:text-indigo-300/80 prose-code:bg-zinc-800/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
                  prose-pre:bg-zinc-950/80 prose-pre:border prose-pre:border-zinc-800/50 prose-pre:rounded-xl
                  prose-table:text-[14px]
                  prose-th:text-zinc-300 prose-th:font-semibold prose-th:text-left prose-th:border-zinc-800 prose-th:py-2.5 prose-th:px-4
                  prose-td:text-zinc-400 prose-td:font-light prose-td:border-zinc-800/50 prose-td:py-2.5 prose-td:px-4
                  prose-hr:border-zinc-800/60
                  prose-img:rounded-2xl"
              >
                <ReactMarkdown>{DOCS_CONTENT}</ReactMarkdown>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-8 py-4 border-t border-zinc-800/50 shrink-0">
              <p className="font-mono-clean text-[10px] text-zinc-700 tracking-wider">
                DOCUMENTATION.md • Agent Researcher
              </p>
              <button
                onClick={() => setDocsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-500 hover:text-zinc-300 border border-zinc-800/50 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800/50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
