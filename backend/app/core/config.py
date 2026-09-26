from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    superset_base_url: str = "http://localhost:8088"
    superset_username: str = "admin"
    superset_password: str = "admin123"
    superset_secret_key: str = "chave_secreta_monisus_ambiente_dev_123"
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    api_prefix: str = "/api"
    superset_timeout: float = 30.0
    database_url: str = "postgresql+psycopg://saude360:saude360_password@localhost:5433/saude360"
    test_database_url: str = (
        "postgresql+psycopg://saude360:saude360_password@localhost:5433/saude360_test"
    )


settings = Settings()
