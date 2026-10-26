#  ConstructIQ — AI-Powered Construction Intelligence

ConstructIQ is an AI-powered construction intelligence platform designed to support safer, smarter, and more efficient construction projects. It combines AI-driven visual analysis, project planning, real estate valuation, weather insights, and an AI assistant in a unified dashboard.

##  Features

###  1. Site Safety Analysis
- Analyze construction-site images using AI.
- Identify potential visual safety hazards.
- Generate risk assessments and safety recommendations.
- Highlight positive safety observations.
- Support preliminary construction-site safety screening.

###  2. Crack Analysis
- Upload images of visible cracks for AI-assisted analysis.
- Generate preliminary observations about visible cracks.
- Support further investigation and structural inspection.

###  3. Project Planning
- Explore construction project-planning estimates and calculations.
- Support planning through structured project information.

###  4. Real Estate Valuation
- Generate preliminary property valuation estimates using available inputs.
- Explore property-related insights through the dashboard.

### 5. AI Assistant
- Ask construction-related questions.
- Get AI-generated explanations and guidance.
- Support construction workflows with conversational assistance.

###  6. Weather Advisory
- Access weather information for construction-site planning.
- Consider weather conditions when planning outdoor work.

##  Tech Stack

| Component | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, CSS |
| Backend | Python, FastAPI, Uvicorn |
| AI Integration | Google Gemini API |
| Weather Data | Open-Meteo |
| Version Control | Git, GitHub |

##  Project Structure

```text
ConstructIQ/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

##  Getting Started

### Prerequisites

Make sure you have installed:

- Python 3.10 or later
- Node.js and npm
- A Google AI Studio API key for Gemini-powered features

### 1. Clone the Repository

```bash
git clone https://github.com/ashika1jain/ConstructIQ.git
cd ConstructIQ
```

### 2. Set Up the Backend

Navigate to the backend directory:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file inside the `backend/` directory:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite
```

Replace `your_gemini_api_key` with your own API key. Never publish your actual API key.

Start the backend server:

```powershell
uvicorn main:app --reload
```

Backend endpoints:

- API: http://127.0.0.1:8000
- Interactive API documentation: http://127.0.0.1:8000/docs

### 3. Set Up the Frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually:

http://localhost:5173

##  Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | API key for Google Gemini |
| `GEMINI_MODEL` | Gemini model used by supported AI features |

**Security best practices:**
- Keep API keys in local environment files.
- Never commit `.env` files containing secrets.
- Use environment variables for sensitive configuration.
- Avoid uploading private project data or confidential construction-site images.

##  Disclaimer

ConstructIQ is intended as a decision-support tool and provides preliminary AI-generated insights. Its outputs may be incomplete or inaccurate.

- Site safety analysis does not replace professional safety inspections.
- Crack analysis does not replace evaluation by a qualified structural engineer.
- Property valuation estimates should be independently verified.
- Project-planning calculations should be reviewed before operational use.
- Weather conditions should be checked against reliable, current sources before making safety-critical decisions.

## Future Enhancements

Potential improvements include:

- Advanced construction hazard detection.
- Crack classification and severity estimation.
- Project scheduling and resource optimization.
- Data-driven property valuation models.
- Historical project analytics and reporting.
- User authentication and role-based access control.

## Author

**Ashika Jain**

GitHub: [@ashika1jain](https://github.com/ashika1jain)

## Support

If you find ConstructIQ interesting, consider starring the repository!

