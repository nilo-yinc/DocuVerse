<div align="center">

<img src="frontend/public/logo.svg" alt="DocuVerse Logo" width="120" height="120" />

# DocuVerse

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![React](https://img.shields.io/badge/React-18+-blue?logo=react)
![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-latest-teal?logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-latest-green?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

**AI-Powered Software Requirements Specification (SRS) Generator & Interactive Documentation Studio**

[Live Demo](https://docu-verse-ai.vercel.app) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## Overview

**DocuVerse** is a full-stack MERN platform that revolutionizes technical documentation creation. Combining the power of advanced AI language models with an intuitive visual studio, DocuVerse generates professional, IEEE 830-compliant SRS documents in under 60 seconds—complete with architecture diagrams, use cases, and interactive editing capabilities.

### Key Features

- **AI-Powered Generation**: 7 specialized AI agents working in parallel to create comprehensive SRS documents
- **Lightning Fast**: Generate complete documentation in 30-90 seconds
- **Visual Studio**: Interactive editing environment with real-time preview
- **Auto-Generated Diagrams**: System context, use case, sequence, and architecture diagrams
- **Secure Authentication**: OAuth & JWT-based auth with session management
- **Responsive Design**: Beautiful dark-mode UI optimized for all devices
- **Cloud Storage**: MongoDB-based persistence with GridFS for large documents
- **Multi-Mode Generation**: Quick, Standard, and Enterprise-grade documentation levels
- **Version Control**: Track document revisions and workflow history
- **Client Collaboration**: Share documents for review with stakeholders

---

## Use Cases

- **Startups**: Rapidly prototype and document new product ideas
- **Developers**: Auto-generate technical specs from feature descriptions
- **Product Managers**: Create comprehensive requirement documents
- **Students**: Learn software engineering best practices
- **Enterprises**: Maintain consistent documentation standards

---

## Platform Preview

<div align="center">
  <img src=".github/screenshots/platform-preview.png" alt="DocuVerse Platform" width="100%"/>
  <br />
  <sub>Enterprise SRS generation with AI-powered workflow and interactive studio</sub>
</div>

---

## Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tooling
- **TailwindCSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client

### Backend (Node.js)
- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database & ODM
- **JWT** - Authentication
- **Passport (Google OAuth)** - Social login
- **Nodemailer** - Email notifications

### Backend (Python)
- **FastAPI** - High-performance API framework
- **Google Gemini AI** - Advanced language model
- **python-docx** - DOCX generation
- **Mermaid** - Diagram rendering
- **Pydantic** - Data validation

### Deployment
- **Vercel** - Frontend hosting
- **Render** - Backend services
- **MongoDB Atlas** - Cloud database

---

## Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 18+ | Backend & Frontend |
| Python | 3.10+ | AI Engine |
| MongoDB | 5+ | Database |
| Git | Latest | Version Control |

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nilo-yinc/DocuVerse.git
   cd DocuVerse
   ```

2. **Set up environment variables**
   ```bash
   # Create .env file in root directory
   cp .env.example .env
   ```

   **Required Environment Variables:**
   ```ini
   # MongoDB
   MONGO_URI=your_mongodb_connection_string

   # AI Language Model API
   GEMINI_API_KEY=your_ai_api_key

   # JWT Secret
   JWT_SECRET=your_secure_random_string
   JWT_EXPIRY=24h

   # OAuth (Optional)
   GOOGLE_CLIENT_ID=your_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_oauth_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/v1/users/google/callback

   # Frontend URL
   FRONTEND_URL=http://localhost:5173

   # Email (Optional - for notifications)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

3. **Install dependencies**

   **Backend (Node.js):**
   ```bash
   cd backend
   npm install
   ```

   **Backend (Python):**
   ```bash
   cd backend/beta
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm install
   ```

4. **Install Mermaid CLI (for diagrams)**
   ```bash
   npm install -g @mermaid-js/mermaid-cli
   ```

5. **Start the development servers**

   **Terminal 1 - Node Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Python Backend:**
   ```bash
   cd backend/beta
   uvicorn main:app --reload --port 8000
   ```

   **Terminal 3 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: `http://localhost:5173`
   - Node API: `http://localhost:5000`
   - Python API: `http://localhost:8000`

---

## Project Structure

```
DocuVerse/
├── frontend/                 # React + Vite frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React Context (Auth, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   └── utils/           # Utility functions
│   └── package.json
│
├── backend/                 # Node.js + Express backend
│   ├── routes/             # API route handlers
│   ├── controllers/        # Business logic
│   ├── models/             # Mongoose schemas
│   ├── middlewares/        # Auth & validation
│   ├── config/             # DB connection
│   ├── utils/              # Helper functions
│   ├── beta/               # Python FastAPI service
│   │   ├── agents/         # 7 AI agents
│   │   ├── schemas/        # Pydantic models
│   │   ├── services/       # Business logic
│   │   ├── utils/          # DOCX generation
│   │   └── main.py         # FastAPI app
│   └── server.js
│
├── .env                    # Environment variables (create this)
├── .env.example            # Example env file
├── render.yaml             # Render deployment config
└── README.md
```

---

## Features in Detail

### 1. **Intelligent SRS Generation**
- Multi-agent AI system with specialized roles (Requirements, Architecture, UI/UX, Security, etc.)
- Context-aware generation based on domain, tech stack, and project requirements
- Automatic diagram creation (Context, Use Case, Sequence, Architecture)

### 2. **Interactive Studio**
- Real-time document preview
- Section-by-section editing
- Markdown support
- Diagram regeneration
- Export to DOCX

### 3. **Authentication & Security**
- JWT-based session management
- Google OAuth integration
- Password reset via OTP
- Secure cookie handling
- Auto-logout on token expiration

### 4. **Client Collaboration**
- Share documents via secure links
- Email notifications
- Public review mode (no login required)
- Feedback collection

### 5. **Project Dashboard**
- Manage multiple SRS documents
- Track generation history
- Quick actions (Edit, Download, Delete)
- Search and filter projects

---

## Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute
- **Report Bugs**: Open an issue with detailed steps to reproduce
- **Suggest Features**: Share your ideas in the discussions
- **Improve Documentation**: Fix typos, add examples, clarify instructions
- **UI/UX Enhancements**: Improve the design and user experience
- **Code Contributions**: Fix bugs or implement new features

### Development Workflow

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/DocuVerse.git
   ```

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
   # Run backend tests
   npm test

   # Run frontend
   npm run dev
   ```

5. **Commit with clear messages**
   ```bash
   git commit -m "feat: add new diagram type for data flow"
   ```

6. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Style Guidelines
- Use **ESLint** for JavaScript/React
- Use **Black** for Python formatting
- Write meaningful variable names
- Add JSDoc comments for functions
- Keep functions small and focused

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- **Commercial use** allowed
- **Modification** allowed
- **Distribution** allowed
- **Private use** allowed
- **Liability**: No warranty provided
- **Attribution**: Must give credit to original author

**When using this project, please provide attribution:**
```
DocuVerse by @nilo-yinc
https://github.com/nilo-yinc/DocuVerse
```

---

## Acknowledgments

- **Advanced AI Language Models** - Powering the intelligent document generation
- **FastAPI** - High-performance Python backend framework
- **React Team** - Modern UI framework
- **MongoDB** - Flexible database solution
- **Mermaid.js** - Beautiful diagram rendering
- **Open Source Community** - For inspiration and tools

---

## Contact & Support

- **Issues**: [GitHub Issues](https://github.com/nilo-yinc/DocuVerse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/nilo-yinc/DocuVerse/discussions)
- **Email**: repository owner (via GitHub profile)

---

## Roadmap

- [ ] Real-time collaborative editing
- [ ] Export to PDF with custom templates
- [ ] Integration with Jira/Confluence
- [ ] Multi-language support
- [ ] Cloud file storage (AWS S3)
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations
- [ ] Mobile app (React Native)

---

<div align="center">

**⭐ Star this repo if you find it helpful!**

Made with ❤️ by the DocuVerse team

[Report Bug](https://github.com/nilo-yinc/DocuVerse/issues) • [Request Feature](https://github.com/nilo-yinc/DocuVerse/issues) • [Documentation](https://github.com/nilo-yinc/DocuVerse/wiki)

</div>
