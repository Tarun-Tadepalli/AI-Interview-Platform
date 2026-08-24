from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import get_db_connection


app = FastAPI(
    title="AI Interview Training Platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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

        cursor.execute("SELECT version();")

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