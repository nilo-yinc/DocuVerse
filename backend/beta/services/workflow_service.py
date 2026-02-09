import os
import json
import requests
import traceback
from fastapi import HTTPException
from backend.beta.utils.model import GEMINI_API_KEY, GROQ_API_KEY, GROQ_MODEL
from litellm import completion as litellm_completion

# Default n8n webhook base URL (can be overridden by env var)
# Example: https://n8n.yourdomain.com/webhook/
N8N_BASE_URL = os.getenv("N8N_WEBHOOK_URL")

class WorkflowService:
    @staticmethod
    async def execute_workflow(workflow_type: str, payload: dict):
        """
        Executes a workflow either via n8n (if configured) or locally (fallback).
        
        Args:
            workflow_type (str): 'analyze', 'chat', or 'diagram'
            payload (dict): The data to process (content, query, history, etc.)
        """
        
        # --- MODE A: n8n Webhook ---
        if N8N_BASE_URL:
            try:
                # Construct webhook URL (e.g., .../webhook/analyze_notebook)
                webhook_url = f"{N8N_BASE_URL.rstrip('/')}/{workflow_type}"
                
                print(f"DEBUG: Triggering n8n workflow: {webhook_url}")
                response = requests.post(webhook_url, json=payload, timeout=30)
                
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"ERROR: n8n returned {response.status_code}: {response.text}")
                    # If n8n fails, we can optionally fall back to local, 
                    # but for now let's raise/log and fall back to local to ensure continuity.
                    print("Falling back to local execution due to n8n error.")
            except Exception as e:
                print(f"ERROR: Failed to connect to n8n: {e}")
                print("Falling back to local execution.")

        # --- MODE B: Local Fallback (Gemini) ---
        return await WorkflowService._execute_local(workflow_type, payload)

    @staticmethod
    async def _execute_local(workflow_type: str, payload: dict):
        """
        Local implementation using LiteLLM + Gemini (Legacy Refactored Logic).
        """
        print(f"DEBUG: Executing local workflow: {workflow_type}")
        if GROQ_API_KEY:
            model_name = GROQ_MODEL or "groq/llama-3.1-8b-instant"
            if not model_name.startswith("groq/"):
                model_name = f"groq/{model_name}"
            api_key = GROQ_API_KEY
        elif GEMINI_API_KEY:
            model_name = "gemini/gemini-1.5-flash"
            api_key = GEMINI_API_KEY
        else:
            raise HTTPException(status_code=500, detail="No LLM API key configured. Set GROQ_API_KEY or GEMINI_API_KEY.")

        try:
            if workflow_type == "analyze":
                return await WorkflowService._local_analyze(payload, model_name, api_key)
            
            elif workflow_type == "chat":
                return await WorkflowService._local_chat(payload, model_name, api_key)
            
            elif workflow_type == "diagram":
                return await WorkflowService._local_diagram(payload, model_name, api_key)
            
            else:
                raise ValueError(f"Unknown workflow type: {workflow_type}")

        except Exception as e:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Workflow failed: {str(e)}")

    # --- Local Implementations ---

    @staticmethod
    async def _local_analyze(payload, model, key):
        content = payload.get("content", "")
        if not content.strip():
            return {"services": []}

        prompt = f"""
        You are a Senior Software Architect. Analyze the following software engineering notes/requirements.
        
        Extract 3-4 key insights, categorizing them into 'Security', 'Architecture', 'Best Practice', 'Scalability', or 'Database'.
        
        Return STRICT JSON format:
        {{
            "services": [
                {{
                    "title": "Short Title",
                    "type": "security|architecture|best-practice|scalability|database",
                    "desc": "2-sentence explanation of the pattern or advice."
                }}
            ]
        }}

        NOTES:
        {content}
        """
        
        response = litellm_completion(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            api_key=key,
            temperature=0.7
        )
        raw = response.choices[0].message.content
        return WorkflowService._safe_json(raw, fallback={"services": []})

    @staticmethod
    async def _local_chat(payload, model, key):
        content = payload.get("content", "")
        query = payload.get("query", "")
        history = payload.get("history", [])

        messages = [
            {"role": "system", "content": "You are a specialized Software Engineering Tutor. Answer the user's question based STRICTLY on the provided Context Notes. If the answer is not in the notes, use your general knowledge but mention that it wasn't explicitly stated in the context. Keep answers concise and technical."}
        ]
        
        # Add history (limit last 4)
        for msg in history[-4:]:
            raw_role = (msg.get("role") or "").lower()
            if raw_role == "ai":
                role = "assistant"
            elif raw_role == "user":
                role = "user"
            elif raw_role == "system":
                role = "system"
            else:
                role = "user"
            messages.append({"role": role, "content": msg.get("text", "")})
            
        messages.append({"role": "user", "content": f"CONTEXT NOTES:\n{content}\n\nUSER QUESTION: {query}"})

        response = litellm_completion(
            model=model,
            messages=messages,
            api_key=key,
            temperature=0.7
        )
        return {"answer": response.choices[0].message.content}

    @staticmethod
    async def _local_diagram(payload, model, key):
        content = payload.get("content", "")
        if not content.strip():
            return {"nodes": [], "edges": []}

        prompt = f"""
        You are a Cloud Solution Architect. Generate a system architecture diagram for these requirements.
        Output MUST be valid JSON structure compatible with ReactFlow.
        
        Strictly follow this structure:
        {{
            "nodes": [
                {{
                    "id": "1", 
                    "type": "server|db|client|api", 
                    "label": "Short Name", 
                    "x": 250, 
                    "y": 50 
                }}
            ],
            "edges": [
                {{ "id": "e1-2", "source": "1", "target": "2", "animated": true, "label": "calls" }}
            ]
        }}
        
        Style Guide:
        - Layout nodes in a logical flow (Top-Down or Left-Right).
        - Use x,y coordinates to space them out (assume canvas is 800x600).
        - 'type' must be one of: 'client', 'server', 'db', 'api'.
        
        REQUIREMENTS:
        {content}
        """

        response = litellm_completion(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            api_key=key,
            temperature=0.2
        )
        raw = response.choices[0].message.content
        return WorkflowService._safe_json(raw, fallback={"nodes": [], "edges": []})

    @staticmethod
    def _safe_json(text: str, fallback: dict):
        try:
            return json.loads(text)
        except Exception:
            try:
                start = text.find("{")
                end = text.rfind("}")
                if start != -1 and end != -1 and end > start:
                    return json.loads(text[start:end + 1])
            except Exception:
                pass
        return fallback
