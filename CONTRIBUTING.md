# Contributing to DocuVerse

Thank you for considering contributing to DocuVerse! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, Python version, etc.)

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
   # Test the Node.js backend
   cd backend
   npm run dev
   
   # Test the Python service
   cd backend/beta
   uvicorn main:app --reload
   
   # Test the frontend
   cd frontend
   npm run dev
   ```
5. **Commit with descriptive messages**
   ```bash
   git commit -m "feat: brief description of changes"
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
# Clone the repository
git clone https://github.com/nilo-yinc/DocuVerse.git
cd DocuVerse

# Backend (Node.js)
cd backend
npm install

# Backend (Python)
cd backend/beta
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
npm install -g @mermaid-js/mermaid-cli

# Frontend
cd frontend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys and MongoDB connection

# Run all services (separate terminals)
# Terminal 1: Node backend
cd backend && npm run dev

# Terminal 2: Python backend
cd backend/beta && uvicorn main:app --reload

# Terminal 3: Frontend
cd frontend && npm run dev
```

## Code Style

- **JavaScript/React**: Follow ESLint configuration
- **Python**: Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add docstrings/JSDoc for functions and classes
- Keep functions focused and small

## Areas for Contribution

- **New AI Providers**: Add support for more LLM providers
- **UI Improvements**: Enhance the web interface and studio editor
- **Documentation**: Improve guides and examples
- **Testing**: Add unit and integration tests
- **Performance**: Optimize agent execution and API response times
- **Diagram Types**: Support more Mermaid diagram types
- **Mobile Support**: Improve responsive design

## Questions?

Feel free to open an issue for questions or join discussions!

---

**Happy Coding!**
