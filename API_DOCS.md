Invoke-WebRequest https://loca.lt/mytunnelpassword | Select-Object -ExpandProperty Content# AutoSRS - API Documentation

## Overview

AutoSRS provides a REST API for generating Software Requirements Specification documents using AI.

## Endpoints

### `GET /`

Returns the web interface for SRS generation.

**Response:** HTML page

---

### `POST /generate_srs`

Generates an SRS document based on project requirements.

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "project_identity": {
    "project_name": "string",
    "author": ["string"],
    "organization": "string"
  },
  "project_overview": {
    "purpose": "string",
    "scope": "string",
    "intended_audience": ["string"],
    "project_description": "string"
  },
  "product_description": {
    "perspective": "string",
    "functions": ["string"],
    "user_characteristics": "string",
    "constraints": ["string"],
    "assumptions_dependencies": ["string"]
  },
  "technology_stack": {
    "frontend": ["string"],
    "backend": ["string"],
    "database": ["string"],
    "deployment": ["string"]
  }
}
```

**Response:**

```json
{
  "srs_document_path": "string"
}
```

**Status Codes:**
- `200 OK` - SRS generated successfully
- `400 Bad Request` - Invalid input data
- `500 Internal Server Error` - Generation failed

**Example:**

```bash
curl -X POST "http://127.0.0.1:8000/generate_srs" \
  -H "Content-Type: application/json" \
  -d '{
    "project_identity": {
      "project_name": "E-Commerce Platform",
      "author": ["John Doe"],
      "organization": "Tech Corp"
    },
    "project_overview": {
      "purpose": "Online shopping platform",
      "scope": "Web and mobile applications",
      "intended_audience": ["Customers", "Admins"],
      "project_description": "Full-featured e-commerce solution"
    },
    ...
  }'
```

## Generated Files

### SRS Document
**Location:** `srs_engine/generated_srs/{project_name}_SRS.docx`

### Architecture Diagrams
**Location:** `srs_engine/static/`
- `{project_name}_user_interfaces_diagram.png`
- `{project_name}_hardware_interfaces_diagram.png`
- `{project_name}_software_interfaces_diagram.png`
- `{project_name}_communication_interfaces_diagram.png`

## Configuration

Set environment variables in `.env`:

```ini
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
GROQ_MODEL=gemini/gemini-1.5-pro-latest
```

## Rate Limits

- **Gemini Pro:** 360 requests/min (Free tier)
- **Groq:** Varies by model (5k-30k tokens/min)

System includes automatic retry with exponential backoff.
