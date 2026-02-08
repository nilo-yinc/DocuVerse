from dotenv import load_dotenv, find_dotenv
import os
from google.adk.models.lite_llm import LiteLlm

load_dotenv(find_dotenv())

GROQ_MODEL = os.getenv("GROQ_MODEL", "gemini/gemini-1.5-pro-latest").strip()
GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or "").strip()
GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()

# LiteLLM uses GEMINI_API_KEY for gemini/* models; set so provider can find it
if GEMINI_API_KEY:
    os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
if GROQ_API_KEY:
    os.environ["GROQ_API_KEY"] = GROQ_API_KEY

os.environ["ADK_SUPPRESS_GEMINI_LITELLM_WARNINGS"] = "true"

# Use the key that matches the model (gemini/* needs GEMINI_API_KEY)
_use_gemini = GROQ_MODEL.startswith("gemini/")
if _use_gemini and GEMINI_API_KEY:
    groq_llm = LiteLlm(model=GROQ_MODEL, api_key=GEMINI_API_KEY)
elif not _use_gemini and GROQ_API_KEY:
    groq_llm = LiteLlm(model=GROQ_MODEL, api_key=GROQ_API_KEY)
elif GROQ_API_KEY:
    groq_llm = LiteLlm(model=GROQ_MODEL, api_key=GROQ_API_KEY)
else:
    groq_llm = None

# For "is any key configured?" check in main
API_KEY_CONFIGURED = bool(GROQ_API_KEY or GEMINI_API_KEY)
