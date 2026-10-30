from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings_config import FRONTEND_ORIGINS
from app.database.connection import get_db_connection
from app.routes.auth_routes import router as auth_router
from app.routes.resume_routes import router as resume_router
from app.routes.profile_routes import router as profile_router
from app.routes.settings_routes import router as settings_router
from app.routes.typing_routes import router as typing_router
from app.routes.progress_routes import router as progress_router
from app.routes.speaking_routes import router as speaking_router
from app.routes.interview_routes import router as interview_router
from app.routes.ask_ai_routes import router as ask_ai_router
from app.routes.dashboard_routes import router as dashboard_router

app = FastAPI(
    title="AI Interview Training Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(profile_router)
app.include_router(settings_router)
app.include_router(typing_router)
app.include_router(progress_router)
app.include_router(speaking_router)
app.include_router(interview_router)
app.include_router(ask_ai_router)
app.include_router(dashboard_router)



@app.get("/")
def home():

    return {
        "message": "AI Interview Training Platform API is running"
    }


@app.get("/health")
def health_check():

    return {
        "status": "healthy"
    }


@app.get("/database-test")
def database_test():

    connection = None

    try:

        connection = get_db_connection()

        cursor = connection.cursor()

        cursor.execute(
            "SELECT version();"
        )

        database_version = cursor.fetchone()

        cursor.close()
        connection.close()

        return {
            "status": "success",
            "message": "PostgreSQL connection successful",
            "database_version": database_version[0]
        }

    except Exception as error:

        return {
            "status": "error",
            "message": str(error)
        }

    finally:

        if connection:
            connection.close()