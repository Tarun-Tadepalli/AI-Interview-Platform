
import os

import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    connection = psycopg2.connect(
        host=os.getenv("DATABASE_HOST"),
        port=os.getenv("DATABASE_PORT"),
        database=os.getenv("DATABASE_NAME"),
        user=os.getenv("DATABASE_USER"),
        password=os.getenv("DATABASE_PASSWORD"),
        sslmode=os.getenv("DATABASE_SSLMODE", "prefer"),
    )

    return connection
