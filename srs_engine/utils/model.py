from dotenv import load_dotenv, find_dotenv
import os
from google.adk.models.lite_llm import LiteLlm

load_dotenv(find_dotenv())

GROQ_MODEL = os.getenv("GROQ_MODEL", "gemini/gemini-1.5-pro-latest").strip()
GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or os.getenv("GEMINI_API_KEY") or "").strip()

# Set the API key in environment for LiteLLM
if GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY

# Suppress Gemini via LiteLLM warning
os.environ["ADK_SUPPRESS_GEMINI_LITELLM_WARNINGS"] = "true"

if not GROQ_API_KEY:
    groq_llm = None  # Will be checked at request time
else:
    groq_llm = LiteLlm(
        model=GROQ_MODEL,
        api_key=GROQ_API_KEY
    )
