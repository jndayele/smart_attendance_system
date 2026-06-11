from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import uuid

from app.database import get_db
from app.dependencies import require_admin
from app.models.lecturer import Lecturer
from app.models.user import User, RoleEnum
from app.models.department import Department
from app.models.course import Course
from app.models.session import Session
from app.schemas.lecturer import LecturerCreate, LecturerUpdate, LecturerResponse, LecturerListResponse
from app.services.notification_service import NotificationService
from app.services.email_service import send_lecturer_activation_email
from app.utils.security import hash_password

router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/", response_model=LecturerListResponse)
async def list_lecturers(
    search: str = None,
    department_id: str = None,
    is_active: bool = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(Lecturer, Department.name.label("dept_name"), User).join(Department).join(User, Lecturer.user_id == User.id)
    
    if search:
        query = query.filter(Lecturer.name.ilike(f"%{search}%") | Lecturer.staff_id.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    if department_id:
        query = query.filter(Lecturer.department_id == department_id)
    if is_active is not None:
        query = query.filter(Lecturer.is_active == is_active)
        
    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()
    
    total_res = await db.execute(select(func.count(Lecturer.id)))
    total = total_res.scalar() or 0
    
    responses = []
    for lec, dept_name, user in rows:
        crs_cnt = await db.execute(select(func.count(Course.id)).filter(Course.lecturer_id == lec.id))
        sess_cnt = await db.execute(select(func.count(Session.id)).filter(Session.lecturer_id == lec.id))
        
        lec_dict = lec.__dict__.copy()
        lec_dict.update({
            "email": user.email,
            "department_name": dept_name,
            "course_count": crs_cnt.scalar() or 0,
            "session_count": sess_cnt.scalar() or 0,
            "is_verified": user.is_verified,
            "last_login": user.last_login
        })
        responses.append(LecturerResponse(**lec_dict))
        
    return LecturerListResponse(lecturers=responses, total=total)

@router.post("/", response_model=LecturerResponse, status_code=status.HTTP_201_CREATED)
async def create_lecturer(
    data: LecturerCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    dept_res = await db.execute(select(Department).filter(Department.id == data.department_id))
    dept = dept_res.scalars().first()
    if not dept: raise HTTPException(status_code=400, detail="Department not found")
        
    email_check = await db.execute(select(User).filter(func.lower(User.email) == data.email.lower()))
    if email_check.scalars().first(): raise HTTPException(status_code=409, detail="Email exists")
        
    staff_check = await db.execute(select(Lecturer).filter(func.lower(Lecturer.staff_id) == data.staff_id.lower()))
    if staff_check.scalars().first(): raise HTTPException(status_code=409, detail="Staff ID exists")
        
    # Create User
    new_user = User(
        email=data.email.lower(),
        password_hash="", # Need to set later via activation link
        role=RoleEnum.lecturer,
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    await db.flush() # Get user ID
    
    # Create Lecturer
    new_lec = Lecturer(
        id=uuid.uuid4(),
        user_id=new_user.id,
        name=data.name,
        staff_id=data.staff_id,
        department_id=data.department_id,
        phone=data.phone
    )
    db.add(new_lec)
    await db.commit()
    await db.refresh(new_lec)
    
    # Generate activation link (mocked)
    activation_link = f"https://frontend.com/activate?token={uuid.uuid4()}"
    background_tasks.add_task(send_lecturer_activation_email, new_user.email, new_lec.name, activation_link)
    
    await NotificationService.log_audit_action(admin.id, "lecturer_created", "lecturer", new_lec.id, None, None, db)
    
    lec_dict = new_lec.__dict__.copy()
    lec_dict.update({
        "email": new_user.email,
        "department_name": dept.name,
        "course_count": 0,
        "session_count": 0,
        "is_verified": False,
        "last_login": None
    })
    return LecturerResponse(**lec_dict)

@router.get("/{lecturer_id}")
async def get_lecturer(lecturer_id: str, db: AsyncSession = Depends(get_db)):
    return {"message": "Get lecturer"}

@router.patch("/{lecturer_id}")
async def update_lecturer(lecturer_id: str, data: LecturerUpdate, db: AsyncSession = Depends(get_db)):
    return {"message": "Update lecturer"}

@router.delete("/{lecturer_id}")
async def delete_lecturer(lecturer_id: str, db: AsyncSession = Depends(get_db)):
    return {"message": "Delete lecturer"}

@router.post("/{lecturer_id}/resend-activation")
async def resend_activation(lecturer_id: str, db: AsyncSession = Depends(get_db)):
    return {"message": "Activation resent"}

@router.patch("/{lecturer_id}/suspend")
async def suspend_lecturer(lecturer_id: str, db: AsyncSession = Depends(get_db)):
    return {"message": "Lecturer suspended"}
