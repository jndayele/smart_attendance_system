"""
Notification Pydantic schemas — shared between student and lecturer profile routers.
"""
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import List


class NotificationResponse(BaseModel):
    id: UUID
    type: str
    title: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    notifications: List[NotificationResponse]
    total: int
    unread_count: int
