# Contributing to AutoSRS

Thank you for considering contributing to AutoSRS! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Python version, etc.)

### Suggesting Features

Feature requests are welcome! Please provide:
- Clear use case
- Expected behavior
- Why this would benefit users

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation if needed
4. **Test your changes**
   ```bash
   # Test the server
   uvicorn srs_engine.main:app --reload
   ```
5. **Commit with descriptive messages**
   ```bash
   git commit -m "Add: Brief description of changes"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create Pull Request**
   - Describe your changes clearly
   - Reference any related issues

## Development Setup

```bash
# Navigate to project
cd AutoSRS

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt
npm install -g @mermaid-js/mermaid-cli

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run server
uvicorn srs_engine.main:app --reload
```

## Code Style

- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add docstrings for functions and classes
- Keep functions focused and small

## Areas for Contribution

- **New AI Providers:** Add support for more LLM providers
- **UI Improvements:** Enhance the web interface
- **Documentation:** Improve guides and examples
- **Testing:** Add unit and integration tests
- **Performance:** Optimize agent execution
- **Diagram Types:** Support more Mermaid diagram types

## Questions?

Feel free to open an issue for questions or join discussions!

---

**Happy Coding! 🚀**
