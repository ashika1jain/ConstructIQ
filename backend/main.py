
# import os
# import base64
# import asyncio
# from typing import Literal

# from dotenv import load_dotenv
# from fastapi import FastAPI, File, HTTPException, UploadFile
# from fastapi.middleware.cors import CORSMiddleware
# from google import genai
# from google.genai import types
# from pydantic import BaseModel

# load_dotenv()

# API_KEY = os.getenv("GEMINI_API_KEY")
# MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
# MAX_IMAGE_SIZE = 10 * 1024 * 1024

# app = FastAPI(title="ConstructIQ Intelligence API")

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=[
#         "http://localhost:5173",
#         "http://127.0.0.1:5173",
#     ],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )


# # Expected structure of Gemini's safety assessment
# class SafetyFinding(BaseModel):
#     hazard: str
#     severity: Literal["Low", "Medium", "High", "Critical"]
#     description: str
#     recommendation: str


# class SafetyAnalysis(BaseModel):
#     overall_risk: Literal["Low", "Medium", "High", "Critical"]
#     summary: str
#     findings: list[SafetyFinding]
#     positive_observations: list[str]
#     limitations: list[str]


# @app.get("/")
# async def root():
#     return {"message": "ConstructIQ API is running"}


# @app.get("/api/health")
# async def health():
#     return {
#         "status": "healthy",
#         "gemini_configured": bool(API_KEY),
#         "model": MODEL_NAME,
#     }


# @app.post("/api/analyze-safety")
# async def analyze_safety(image: UploadFile = File(...)):
#     if not API_KEY:
#         raise HTTPException(
#             status_code=500,
#             detail="Gemini API key is missing. Check backend/.env.",
#         )

#     allowed_types = {"image/jpeg", "image/png", "image/webp"}

#     if image.content_type not in allowed_types:
#         raise HTTPException(
#             status_code=400,
#             detail="Please upload a JPEG, PNG, or WebP image.",
#         )

#     image_bytes = await image.read(MAX_IMAGE_SIZE + 1)

#     if not image_bytes:
#         raise HTTPException(status_code=400, detail="The image is empty.")

#     if len(image_bytes) > MAX_IMAGE_SIZE:
#         raise HTTPException(
#             status_code=413,
#             detail="Image size must be 10 MB or less.",
#         )

#     prompt = """
# You are a construction-site safety assessment assistant.

# Inspect the supplied image for visible safety hazards, including:
# - Missing or inadequate personal protective equipment (PPE)
# - Unsafe work at height or missing fall protection
# - Unsafe machinery or tool use
# - Visible electrical hazards
# - Debris, poor housekeeping, and trip hazards
# - Falling-object risks and unsafe access routes

# Rules:
# - Report only observations supported by the image.
# - Do not assume missing PPE when it cannot be seen clearly.
# - Give each identified hazard a practical corrective recommendation.
# - Assign severity based on visible evidence and potential consequences.
# - If no hazards are clearly visible, return an empty findings list.
# - Describe uncertainty in limitations.
# - Do not claim the site is compliant based on one image.
# - This is a preliminary visual assessment, not a certified inspection.
# """

#     client = genai.Client(
#         api_key=API_KEY,
#         http_options=types.HttpOptions(timeout=45000),
#     )

#     try:
#         request_input = [
#             {
#                 "type": "text",
#                 "text": prompt,
#             },
#             {
#                 "type": "image",
#                 "data": base64.b64encode(image_bytes).decode("utf-8"),
#                 "mime_type": image.content_type,
#             },
#         ]

#         response_format = {
#             "type": "text",
#             "mime_type": "application/json",
#             "schema": SafetyAnalysis.model_json_schema(),
#         }

#         interaction = await asyncio.wait_for(
#             asyncio.to_thread(
#                 client.interactions.create,
#                 model=MODEL_NAME,
#                 input=request_input,
#                 response_format=response_format,
#             ),
#             timeout=50,
#         )

#         response_text = interaction.output_text

#         if not response_text:
#             raise ValueError("Gemini returned an empty response.")

#         analysis = SafetyAnalysis.model_validate_json(response_text)

#         return {
#             "message": "Safety analysis completed successfully.",
#             "filename": image.filename,
#             "size_bytes": len(image_bytes),
#             "analysis": analysis.model_dump(),
#         }

#     except asyncio.TimeoutError:
#         raise HTTPException(
#             status_code=504,
#             detail="Gemini took too long to respond. Please try again.",
#         )

#     except Exception as exc:
#         print(f"Safety analysis error: {type(exc).__name__}: {exc}")
#         raise HTTPException(
#             status_code=502,
#             detail=(
#                 "AI analysis failed. Check the backend terminal "
#                 "for the specific error."
#             ),
#         ) from exc

#     finally:
#         client.close()
#         await image.close()




import os
import json
import base64
import asyncio
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from google import genai
from google.genai import types

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
MAX_IMAGE_SIZE = 10 * 1024 * 1024

app = FastAPI(title="ConstructIQ API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)


class PlanRequest(BaseModel):
    project_name: str = Field(default="Construction Project", max_length=120)
    project_type: str = Field(default="Residential building", max_length=100)
    duration_weeks: int = Field(default=12, ge=1, le=104)
    team_size: int = Field(default=8, ge=1, le=500)
    budget: float = Field(default=5000000, ge=0)


class ValuationRequest(BaseModel):
    location: str = Field(min_length=2, max_length=160)
    area_sqft: float = Field(gt=0, le=100000000)
    property_type: str = Field(default="Residential", max_length=80)
    age_years: float = Field(default=0, ge=0, le=200)
    rate_per_sqft: float = Field(gt=0, le=100000000)
    condition: str = Field(default="Good", max_length=40)


def get_client():
    if not API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini is not configured. Add GEMINI_API_KEY to backend/.env.",
        )
    return genai.Client(
        api_key=API_KEY,
        http_options=types.HttpOptions(timeout=120000),
    )


async def run_interaction(model_input: Any, timeout_seconds: int = 125) -> str:
    client = get_client()
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(
                client.interactions.create,
                model=MODEL_NAME,
                input=model_input,
            ),
            timeout=timeout_seconds,
        )
        output = getattr(result, "output_text", None)
        if not output:
            raise HTTPException(status_code=502, detail="The AI returned an empty response.")
        return output
    except asyncio.TimeoutError as exc:
        raise HTTPException(status_code=504, detail="AI request timed out. Please try again.") from exc
    except HTTPException:
        raise
    except Exception as exc:
        # Do not expose keys or full provider responses to the browser.
        print(f"Gemini request failed: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=502,
            detail="AI request failed. Check the backend terminal for the diagnostic message.",
        ) from exc
    finally:
        client.close()


def parse_json_response(raw: str) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        print(f"AI returned invalid JSON: {exc}")
        raise HTTPException(status_code=502, detail="AI returned an unexpected format. Please retry.") from exc
    if not isinstance(parsed, dict):
        raise HTTPException(status_code=502, detail="AI response was not a JSON object.")
    return parsed


async def read_image(image: UploadFile) -> tuple[bytes, str]:
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if image.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Upload a JPEG, PNG, or WebP image.")
    content = await image.read(MAX_IMAGE_SIZE + 1)
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=413, detail="Image size must be 10 MB or less.")
    return content, image.content_type


async def analyze_image(image: UploadFile, task: str) -> dict:
    content, mime_type = await read_image(image)
    instructions = {
        "safety": """
Review the construction-site image for visible safety hazards. Return ONLY JSON with:
{"overall_risk":"Low|Medium|High|Critical","summary":"string","findings":[{"hazard":"string","severity":"Low|Medium|High|Critical","description":"string","recommendation":"string"}],"positive_observations":["string"],"limitations":["string"]}.
Report only visible evidence; note uncertainty. Look for PPE, work at height, tools, electrical risks, trip hazards, housekeeping and falling-object risks. This is preliminary visual screening, not a certified inspection.
""",
        "cracks": """
Review the image for visible cracks or surface defects in concrete, masonry, plaster or other visible building materials. Return ONLY JSON with:
{"overall_severity":"Low|Medium|High|Critical|Unable to determine","summary":"string","observations":[{"defect":"string","location_in_image":"string","severity":"Low|Medium|High|Critical|Unable to determine","description":"string","recommended_next_step":"string"}],"limitations":["string"],"professional_inspection_recommended":true}.
Do not infer structural safety from a photo. If no clear crack is visible, say so. Severity is preliminary visual triage only, not an engineering diagnosis.
"""
    }
    prompt = instructions[task]
    image_part = {
        "type": "image",
        "data": base64.b64encode(content).decode("utf-8"),
        "mime_type": mime_type,
    }
    raw = await run_interaction([{"type": "text", "text": prompt}, image_part])
    data = parse_json_response(raw)
    return {
        "message": "AI image analysis completed.",
        "filename": image.filename or "uploaded-image",
        "size_bytes": len(content),
        "analysis": data,
        "model": MODEL_NAME,
        "disclaimer": "Preliminary visual screening only. Verify findings on site with a qualified professional.",
    }


@app.get("/")
async def root():
    return {"message": "ConstructIQ API is running", "docs": "/docs"}


@app.get("/api/health")
async def health():
    return {"status": "healthy", "gemini_configured": bool(API_KEY), "model": MODEL_NAME}


@app.post("/api/analyze-safety")
async def analyze_safety(image: UploadFile = File(...)):
    try:
        return await analyze_image(image, "safety")
    finally:
        await image.close()


@app.post("/api/analyze-cracks")
async def analyze_cracks(image: UploadFile = File(...)):
    try:
        return await analyze_image(image, "cracks")
    finally:
        await image.close()


@app.post("/api/assistant")
async def assistant(request: AssistantRequest):
    prompt = (
        "You are ConstructIQ, a helpful construction project assistant. "
        "Give practical, cautious answers about construction safety, materials, "
        "planning, estimation, and site operations. State assumptions, do not "
        "invent legal requirements, and recommend qualified professionals for "
        "structural or safety-critical decisions. User message:\n" + request.message
    )
    answer = await run_interaction(prompt)
    return {"answer": answer, "model": MODEL_NAME}


@app.post("/api/plan")
async def create_plan(request: PlanRequest):
    # Deterministic, explainable demo plan; not AI-generated and not a contractor schedule.
    phases = [
        ("Planning and permits", 0.10),
        ("Site preparation and excavation", 0.12),
        ("Foundation", 0.16),
        ("Structure and framing", 0.24),
        ("Roofing and external envelope", 0.12),
        ("Electrical and plumbing", 0.10),
        ("Finishes", 0.11),
        ("Inspection and handover", 0.05),
    ]
    remaining = request.duration_weeks
    tasks = []
    week = 1
    for name, fraction in phases:
        duration = max(1, round(request.duration_weeks * fraction))
        end = min(request.duration_weeks, week + duration - 1)
        tasks.append({
            "task": name,
            "start_week": min(week, request.duration_weeks),
            "end_week": end,
            "duration_weeks": max(1, end - min(week, request.duration_weeks) + 1),
            "budget_estimate": round(request.budget * fraction, 2),
        })
        week = end + 1
        if week > request.duration_weeks:
            week = request.duration_weeks
    return {
        "project_name": request.project_name,
        "project_type": request.project_type,
        "duration_weeks": request.duration_weeks,
        "team_size": request.team_size,
        "budget": request.budget,
        "tasks": tasks,
        "notes": [
            "Demo schedule based on generic phase proportions, not local codes or a contractor's work plan.",
            "Tasks may overlap in real projects; verify durations, permits, dependencies, site constraints and costs with the project team.",
        ],
    }


@app.post("/api/valuation")
async def estimate_valuation(request: ValuationRequest):
    condition_factors = {"Excellent": 1.05, "Good": 1.0, "Average": 0.90, "Needs repair": 0.75}
    factor = condition_factors.get(request.condition, 1.0)
    age_factor = max(0.60, 1 - (request.age_years * 0.008))
    estimated_value = request.area_sqft * request.rate_per_sqft * factor * age_factor
    return {
        "location": request.location,
        "property_type": request.property_type,
        "area_sqft": request.area_sqft,
        "base_rate_per_sqft": request.rate_per_sqft,
        "condition_factor": factor,
        "age_factor": round(age_factor, 3),
        "estimated_value": round(estimated_value, 2),
        "currency": "INR",
        "method": "area × user-provided rate × demo condition factor × demo age factor",
        "disclaimer": "Illustrative estimate only. The rate per square foot must be supplied by you and verified against current local comparable sales. Not a formal valuation.",
    }


@app.get("/api/weather")
async def weather(latitude: float, longitude: float):
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid latitude or longitude.")
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code",
        "daily": "precipitation_probability_max,wind_speed_10m_max,temperature_2m_max,temperature_2m_min",
        "forecast_days": 3,
        "timezone": "auto",
    }
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        print(f"Weather provider failed: {type(exc).__name__}: {exc}")
        raise HTTPException(status_code=502, detail="Weather service is unavailable. Please retry.") from exc

    current = data.get("current", {})
    daily = data.get("daily", {})
    rain = current.get("precipitation", 0) or 0
    wind = current.get("wind_speed_10m", 0) or 0
    advice = []
    if rain > 0 or max(daily.get("precipitation_probability_max", [0]) or [0]) >= 60:
        advice.append("Check drainage, slippery surfaces, concrete protection and work-at-height conditions.")
    if wind >= 30 or max(daily.get("wind_speed_10m_max", [0]) or [0]) >= 40:
        advice.append("Review lifting operations, scaffolding and loose materials against site wind limits.")
    if not advice:
        advice.append("No obvious weather trigger in the returned data; continue normal site-specific monitoring.")
    return {"latitude": latitude, "longitude": longitude, "current": current, "daily": daily, "construction_advisory": advice, "source": "Open-Meteo", "disclaimer": "Weather-based guidance only. Follow site procedures and official alerts."}
