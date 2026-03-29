import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables first so that other modules can access them
load_dotenv()

# Import the compiled graph from research_graph
from research_graph import app as agent_app

app = FastAPI()

# Enable CORS for localhost:3000 (Next.js default port)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    topic: str

@app.post("/generate")
async def generate_post(request: GenerateRequest):
    async def event_stream():
        initial_state = {"topic": request.topic}
        try:
            # LangGraph stream yields dicts containing the output of each node execution
            # e.g., {'researcher': {'research_notes': '...'}}
            for event in agent_app.stream(initial_state):
                node_name = list(event.keys())[0]
                node_state = event[node_name]
                
                payload = {"node": node_name}
                if node_name == "writer" and "final_post" in node_state:
                    payload["final_post"] = node_state["final_post"]
                
                # Send Server-Sent Events (SSE) data format
                data_str = json.dumps(payload)
                yield f"data: {data_str}\n\n"
                
        except Exception as e:
            error_data = json.dumps({'error': str(e)})
            yield f"data: {error_data}\n\n"
            
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/")
def read_root():
    return {"message": "Agent Researcher API is running. Try POST /generate"}
