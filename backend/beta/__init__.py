"""
AutoSRS Package

AI-powered Software Requirements Specification document generator.
Built with FastAPI, Google ADK, and LiteLLM.
"""

__version__ = "1.1.0"
__author__ = "nilo-yinc"
__license__ = "MIT"
__description__ = "Technical documentation generation engine"

from .main import app

__all__ = ["app"]
