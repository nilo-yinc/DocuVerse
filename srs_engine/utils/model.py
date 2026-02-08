from dotenv import load_dotenv, find_dotenv
import os
from google.adk.models.lite_llm import LiteLlm

load_dotenv(find_dotenv())

GROQ_MODEL = os.getenv("GROQ_MODEL")

# Suppress Gemini via LiteLLM warning
os.environ["ADK_SUPPRESS_GEMINI_LITELLM_WARNINGS"] = "true"

groq_llm = LiteLlm(
    model=GROQ_MODEL
)
