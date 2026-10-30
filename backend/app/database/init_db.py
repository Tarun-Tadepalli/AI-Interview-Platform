from pathlib import Path

from app.database.connection import get_db_connection


def initialize_database():
    schema_path = Path(__file__).with_name("schema.sql")

    schema_sql = schema_path.read_text(encoding="utf-8")

    connection = None

    try:
        connection = get_db_connection()

        with connection:
            with connection.cursor() as cursor:
                cursor.execute(schema_sql)

        print("Database tables created successfully.")

    except Exception as error:
        print("Database initialization failed.")
        print(error)

    finally:
        if connection:
            connection.close()


if __name__ == "__main__":
    initialize_database()