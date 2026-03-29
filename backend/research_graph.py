import os
from typing import TypedDict
from langgraph.graph import StateGraph, START, END
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_google_genai import ChatGoogleGenerativeAI

# Define the state schema
class AgentState(TypedDict):
    topic: str
    research_notes: str
    analysis: str
    final_post: str

# Node 1: Researcher uses Tavily to find web data
def researcher(state: AgentState):
    topic = state["topic"]
    
    # Initialize Tavily search tool
    search = TavilySearchResults(max_results=3)
    results = search.invoke({"query": topic})
    
    # Format the search results into notes
    notes = ""
    if isinstance(results, list):
        for res in results:
            notes += f"URL: {res.get('url', 'N/A')}\n"
            notes += f"Content: {res.get('content', 'N/A')}\n\n"
    else:
        notes = str(results)
        
    return {"research_notes": notes}

# Node 2: Analyst uses Gemini to summarize the data
def analyst(state: AgentState):
    topic = state["topic"]
    notes = state.get("research_notes", "")
    
    # Initialize Gemini 1.5 Flash
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
    
    prompt = (
        f"You are an expert analyst. Summarize the following web research data "
        f"and provide an insightful analysis for the topic: '{topic}'.\n\n"
        f"Research Notes:\n{notes}"
    )
    
    response = llm.invoke(prompt)
    return {"analysis": response.content}

# Node 3: Writer formats the summary into a blog post
def writer(state: AgentState):
    topic = state["topic"]
    analysis = state.get("analysis", "")
    
    # Initialize Gemini 1.5 Flash
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
    
    prompt = (
        f"You are a professional blog writer. Based on the following analysis, "
        f"write a well-structured, engaging Markdown blog post about the topic: '{topic}'. "
        f"Make sure to use proper headers, paragraphs, and formatting.\n\n"
        f"Analysis:\n{analysis}"
    )
    
    response = llm.invoke(prompt)
    return {"final_post": response.content}

# Build the LangGraph workflow
workflow = StateGraph(AgentState)

# Add all nodes
workflow.add_node("researcher", researcher)
workflow.add_node("analyst", analyst)
workflow.add_node("writer", writer)

# Connect the graph linearly
workflow.add_edge(START, "researcher")
workflow.add_edge("researcher", "analyst")
workflow.add_edge("analyst", "writer")
workflow.add_edge("writer", END)

# Compile the graph into a runnable application
app = workflow.compile()
