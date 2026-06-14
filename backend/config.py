from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    neomodel_cypher_connection_url: str
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True)

settings = Settings()