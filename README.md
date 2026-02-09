# 🚀 AutoSRS - AI-Powered SRS Generator

<div align="center">

![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-latest-green.svg)

![Gemini](https://img.shields.io/badge/Gemini-Pro-orange.svg)

**AI-powered automated Software Requirements Specification (SRS) document generator with architecture diagrams**

Generate professional IEEE 830-1998 compliant SRS documents in 30-90 seconds!

</div>

---

## 🎯 Overview

An intelligent multi-agent system that automates SRS creation using **Google Gemini AI**. Built with FastAPI, it generates professional IEEE 830-1998 compliant documents complete with Mermaid diagrams - all in minutes!

**Key Features:**
- 🤖 7 Specialized AI agents for different SRS sections
- ⚡ Powered by Google Gemini's advanced AI
- 📄 Professional `.docx` output with architecture diagrams
- 🆓 100% Free - No billing required
- 🔒 Runs locally - Your data stays private

---

## 📸 Screenshots

<img width="450" height="946" alt="image" src="https://github.com/user-attachments/assets/0996958c-390c-4ac2-b027-33b867c68641" />
<img width="1916" height="935" alt="image" src="https://github.com/user-attachments/assets/3dd14274-f827-42b9-949f-3e7c58bca7e4" />


<img width="1904" height="1031" alt="Screenshot 2026-02-09 095326" src="https://github.com/user-attachments/assets/2423ad7d-cbb3-4784-834f-f3b40da7b15c" />


---

## 📦 Prerequisites

| Requirement | Version | Download |
|------------|---------|----------|
| Python | 3.10+ | [Download](https://www.python.org/downloads/) |
| Node.js | Latest LTS | [Download](https://nodejs.org/) |
| Git | Latest | [Download](https://git-scm.com/downloads/) |
| Gemini API Key | Free | [Get Key](https://aistudio.google.com/app/apikey) |

---

## 🛠 Installation

### Step 1: Setup Project
```bash
cd AutoSRS
```

### Step 2: Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

> 💡 You'll see `(venv)` in your terminal when activated

### Step 3: Install Python Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 4: Install Mermaid CLI
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc --version  # Verify installation
```

> **⚠️ CRITICAL for Windows Users**: After installation, you **MUST** configure the Mermaid CLI path in the code.

**Windows Configuration:**
1. Locate your Mermaid CLI installation path (typically):
   ```
   C:\Users\<Your Username>\AppData\Roaming\npm\mmdc.cmd
   ```

2. Open `srs_engine/utils/globals.py` and update the `render_mermaid_png` function:
   ```python
   # Find the subprocess.run line and update it to:
   subprocess.run([
       "C:\\Users\\<Your Username>\\AppData\\Roaming\\npm\\mmdc.cmd",
       "-i", str(mmd_path),
       "-o", str(output_path)
   ], check=True)
   ```

3. Replace `<Your Username>` with your actual Windows username

**Without this configuration, diagram generation will fail on Windows!**

---

## ⚙️ Configuration

### 1. Get Your Free Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key" or "Create API Key"
4. Copy your key

### 2. Create `.env` File

**Windows:**
```bash
type nul > .env
```

**macOS/Linux:**
```bash
touch .env
```

### 3. Add Configuration

Open `.env` and add:

```ini
# Gemini API Key (Required)
GEMINI_API_KEY=your_actual_api_key_here

# Model Selection (Optional - defaults to gemini-2.0-flash-exp)
GEMINI_MODEL=gemini-2.0-flash-exp
```

**Available Models:** [Gemini Models Docs](https://ai.google.dev/gemini-api/docs/models)

| Model | Name | Best For |
|-------|------|----------|
| Gemini 2.0 Flash | `gemini-2.0-flash-exp` | ⭐ Recommended - Fast & Accurate |
| Gemini 1.5 Pro | `gemini-1.5-pro` | High Quality & Complex Tasks |
| Gemini 1.5 Flash | `gemini-1.5-flash` | Speed Optimized |

---

## 🚀 Usage

### 1. Start Server
```bash
uvicorn srs_engine.main:app --reload
```

### 2. Open Web Interface
Navigate to: **http://127.0.0.1:8000**

### 3. Enter Project Details
Fill in the form:
- Project Name
- Project Description
- Key Features
- Target Users
- Technology Stack (optional)

### 4. Generate SRS
Click "Generate SRS" and wait 2-5 minutes

### 5. Access Generated Files

**SRS Document:**
```
srs_engine/generated_srs/{project_name}_SRS.docx
```

**Architecture Diagrams:**
```
srs_engine/static/{project_name}_user_interfaces_diagram.png
srs_engine/static/{project_name}_hardware_interfaces_diagram.png
srs_engine/static/{project_name}_software_interfaces_diagram.png
srs_engine/static/{project_name}_communication_interfaces_diagram.png
```

---

## 🔧 Troubleshooting

**`mmdc: command not found`**
```bash
npm install -g @mermaid-js/mermaid-cli
# Add Node.js to PATH if needed
```

**`ModuleNotFoundError`**
```bash
# Activate venv first!
pip install -r requirements.txt
```

**API Key Error (401)**
- Verify key at [Google AI Studio](https://aistudio.google.com/app/apikey)
- Check `.env` is in root directory
- No spaces/quotes around the key

**Port 8000 in use**
```bash
uvicorn srs_engine.main:app --reload --port 8001
```

**Diagrams not generating (Windows)**
```bash
# ⚠️ CRITICAL: Windows users must configure mmdc path
# Open srs_engine/utils/globals.py
# Find render_mermaid_png function and update subprocess.run to:

subprocess.run([
    "C:\\Users\\<Your Username>\\AppData\\Roaming\\npm\\mmdc.cmd",
    "-i", str(mmd_path),
    "-o", str(output_path)
], check=True)

# Replace <Your Username> with your actual Windows username
# Without this, mmdc won't be found even if installed correctly
```

---

## 📁 Project Structure

```
SRS_Generation/
├── srs_engine/
│   ├── agents/              # 7 specialized AI agents
│   ├── schemas/             # Pydantic models
│   ├── utils/               # Document generator
│   ├── templates/           # Web interface
│   ├── static/              # Generated diagrams
│   ├── generated_srs/       # Output documents
│   └── main.py              # FastAPI app
├── .env                     # Your configuration
├── requirements.txt         # Dependencies
└── README.md
```

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/name`)
5. Open Pull Request

---

## � Acknowledgments

Built with: [FastAPI](https://fastapi.tiangolo.com/) • [Google Gemini](https://ai.google.dev/) • [Mermaid](https://mermaid.js.org/) • [python-docx](https://python-docx.readthedocs.io/)
