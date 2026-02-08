# Changelog

All notable changes to AutoSRS will be documented in this file.

## [1.1.0] - 2026-02-08

### Added
- Gemini Pro API support for faster generation (30-90 seconds)
- Automatic retry logic with exponential backoff for rate limits
- Comprehensive API documentation
- Detailed setup guide
- Support for parallel agent execution with Gemini
- Environment variable for suppressing LiteLLM warnings

### Changed
- Optimized agent execution workflow
- Improved error handling for rate limit scenarios
- Updated .env.example with Gemini configuration
- Enhanced mmdc path configuration for Windows users

### Fixed
- Rate limit handling for Groq free tier
- Retry mechanism for failed API calls
- Windows-specific mmdc.cmd path issues

## [1.0.0] - Initial Release

### Added
- AI-powered SRS document generation
- 7 specialized AI agents for different SRS sections
- IEEE 830-1998 compliant document generation
- Mermaid diagram generation for architecture
- FastAPI web interface
- Support for multiple LLM providers (Groq, Gemini)
- Export to .docx format with embedded diagrams
