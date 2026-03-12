from pydantic import ConfigDict
from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/calligraphy_db"
    
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_PASSWORD: str = ""
    USE_FAKE_REDIS: bool = False
    
    SECRET_KEY: str = "change-this-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    WECHAT_APPID: str = "mock_appid"
    WECHAT_SECRET: str = "mock_secret"
    
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'
    
    ENVIRONMENT: str = "development"
    
    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.CORS_ORIGINS)
        except:
            return ["http://localhost:5173"]
    
    model_config = ConfigDict(
        env_file=".env",
        extra="allow",
    )


settings = Settings()
