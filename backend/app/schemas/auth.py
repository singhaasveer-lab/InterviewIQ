from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse


class UserUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=128)
    role: Optional[str] = Field(default=None, max_length=128)
