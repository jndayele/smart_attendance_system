from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import uuid
import csv
import io

from app.database import get_db
from app.dependencies import require_admin
from app.models.student import Student, StudentCourse
from app.models.user import User, RoleEnum
from app.models.department import Department
from app.models.programme import Programme
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse, StudentListResponse, StudentBulkImportResponse, StudentMoveLevel, ManualAttendanceOverride
from app.services.notification_service import NotificationService
from app.services.email_service import send_student_invitation_email

router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/", response_model=StudentListResponse)
async def list_students(
    search: str = None,
    department_id: str = None,
    programme_id: str = None,
    level: int = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(Student, Department.name.label("dept_name"), Programme.name.label("prog_name"), User).join(Department).join(Programme).join(User, Student.user_id == User.id)
    
    if search:
        query = query.filter(Student.name.ilike(f"%{search}%") | Student.student_id.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    if department_id: query = query.filter(Student.department_id == department_id)
    if programme_id: query = query.filter(Student.programme_id == programme_id)
    if level: query = query.filter(Student.level == level)
        
    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()
    
    total_res = await db.execute(select(func.count(Student.id)))
    total = total_res.scalar() or 0
    
    responses = []
    for stu, d_name, p_name, user in rows:
        stu_dict = stu.__dict__.copy()
        stu_dict.update({
            "email": user.email,
            "department_name": d_name,
            "programme_name": p_name,
            "is_verified": user.is_verified,
            "last_login": user.last_login
        })
        responses.append(StudentResponse(**stu_dict))
        
    return StudentListResponse(students=responses, total=total)

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    data: StudentCreate, 
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db), 
    admin: User = Depends(require_admin)
):
    d_res = await db.execute(select(Department).filter(Department.id == data.department_id))
    dept = d_res.scalars().first()
    if not dept: raise HTTPException(status_code=400, detail="Department not found")
        
    p_res = await db.execute(select(Programme).filter(Programme.id == data.programme_id))
    prog = p_res.scalars().first()
    if not prog: raise HTTPException(status_code=400, detail="Programme not found")
        
    email_check = await db.execute(select(User).filter(func.lower(User.email) == data.email.lower()))
    if email_check.scalars().first(): raise HTTPException(status_code=409, detail="Email exists")
        
    stu_check = await db.execute(select(Student).filter(func.lower(Student.student_id) == data.student_id.lower()))
    if stu_check.scalars().first(): raise HTTPException(status_code=409, detail="Student ID exists")
        
    new_user = User(
        email=data.email.lower(),
        password_hash="",
        role=RoleEnum.student,
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    await db.flush()
    
    new_stu = Student(
        id=uuid.uuid4(),
        user_id=new_user.id,
        name=data.name,
        student_id=data.student_id,
        department_id=data.department_id,
        programme_id=data.programme_id,
        level=data.level,
        semester_of_entry=data.semester_of_entry,
        invitation_token=str(uuid.uuid4()),
        invitation_status="pending"
    )
    db.add(new_stu)
    await db.commit()
    await db.refresh(new_stu)
    
    invitation_link = f"https://frontend.com/register?token={new_stu.invitation_token}"
    background_tasks.add_task(send_student_invitation_email, new_user.email, new_stu.name, new_stu.student_id, [], invitation_link)
    
    await NotificationService.log_audit_action(admin.id, "student_created", "student", new_stu.id, None, None, db)
    
    stu_dict = new_stu.__dict__.copy()
    stu_dict.update({
        "email": new_user.email,
        "department_name": dept.name,
        "programme_name": prog.name,
        "is_verified": False,
        "last_login": None
    })
    return StudentResponse(**stu_dict)

@router.get("/{student_id}")
async def get_student(student_id: str, db: AsyncSession = Depends(get_db)):
    return {"message": "Get student"}

@router.patch("/{student_id}")
async def update_student(student_id: str, data: StudentUpdate, db: AsyncSession = Depends(get_db)):
    return {"message": "Update student"}

@router.delete("/{student_id}")
async def delete_student(student_id: str, db: AsyncSession = Depends(get_db)):
    return {"message": "Delete student"}

@router.post("/bulk-import", response_model=StudentBulkImportResponse)
async def bulk_import_students(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    return {"total_submitted": 0, "total_created": 0, "total_failed": 0, "errors": [], "created_student_ids": []}

@router.post("/bulk-move-level")
async def bulk_move_level(payload: dict, db: AsyncSession = Depends(get_db)):
    return {"message": "Levels updated", "students_updated": 0}

@router.patch("/{student_id}/suspend")
async def suspend_student(student_id: str, db: AsyncSession = Depends(get_db)):
    return {"message": "Student suspended"}

@router.post("/{student_id}/attendance/override")
async def override_attendance(student_id: str, data: ManualAttendanceOverride, db: AsyncSession = Depends(get_db)):
    return {"message": "Attendance overridden"}
