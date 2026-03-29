import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import the compiled graph (flat import — Vercel runs each file as its own module)
from api.research_graph import agent_app

app = FastAPI()

# Enable CORS for all origins (Vercel frontend + localhost dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    topic: str

@app.post("/api/generate")
async def generate_post(request: GenerateRequest):
    async def event_stream():
        initial_state = {"topic": request.topic}
        try:
            for event in agent_app.stream(initial_state):
                node_name = list(event.keys())[0]
                node_state = event[node_name]
                
                payload = {"node": node_name}
                if node_name == "writer" and "final_post" in node_state:
                    payload["final_post"] = node_state["final_post"]
                
                data_str = json.dumps(payload)
                yield f"data: {data_str}\n\n"
                
        except Exception as e:
            error_data = json.dumps({'error': str(e)})
            yield f"data: {error_data}\n\n"
            
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/api")
def read_root():
    return {"message": "Agent Researcher API is running. Try POST /api/generate"}

# Vercel serverless compatibility
app = app
