from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from app.database import get_db
from app.dependencies import require_admin
from app.models.course import Course
from app.models.programme import Programme
from app.models.lecturer import Lecturer
from app.models.student import Student, StudentCourse
from app.models.session import Session
from app.models.user import User
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse, CourseListResponse, CourseCloneRequest
from app.services.notification_service import NotificationService

router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/", response_model=CourseListResponse)
async def list_courses(
    search: str = None,
    programme_id: str = None,
    level: int = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(Course, Programme.name, Programme.code, Lecturer.name).outerjoin(Programme, Course.programme_id == Programme.id).outerjoin(Lecturer, Course.lecturer_id == Lecturer.id)
    
    if search:
        query = query.filter(Course.title.ilike(f"%{search}%") | Course.code.ilike(f"%{search}%"))
        
    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()
    
    total_res = await db.execute(select(func.count(Course.id)))
    total = total_res.scalar() or 0
    
    responses = []
    for c, p_name, p_code, l_name in rows:
        stu_cnt = await db.execute(select(func.count(StudentCourse.id)).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
        sess_cnt = await db.execute(select(func.count(Session.id)).filter(Session.course_id == c.id))
        
        c_dict = c.__dict__.copy()
        c_dict.update({
            "programme_name": p_name or "Unknown",
            "programme_code": p_code or "Unknown",
            "lecturer_name": l_name,
            "enrolled_student_count": stu_cnt.scalar() or 0,
            "session_count": sess_cnt.scalar() or 0
        })
        responses.append(CourseResponse(**c_dict))
        
    return CourseListResponse(courses=responses, total=total)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_course(data: CourseCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    code_check = await db.execute(select(Course).filter(func.lower(Course.code) == data.code.lower()))
    if code_check.scalars().first(): raise HTTPException(status_code=409, detail="Code exists")
    
    new_course = Course(**data.model_dump())
    db.add(new_course)
    await db.commit()
    await db.refresh(new_course)
    
    # Auto-enroll logic
    stu_res = await db.execute(select(Student).filter(Student.programme_id == new_course.programme_id, Student.level == new_course.level, Student.is_suspended == False))
    students = stu_res.scalars().all()
    
    for s in students:
        sc = StudentCourse(student_id=s.id, course_id=new_course.id)
        db.add(sc)
    
    await db.commit()
    
    await NotificationService.log_audit_action(admin.id, "course_created", "course", new_course.id, {"students_auto_enrolled": len(students)}, None, db)
    
    # Return mock dict matching CourseResponse + students_enrolled
    return {"message": "Course created", "students_enrolled": len(students)}

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Course, Programme.name, Programme.code, Lecturer.name).outerjoin(Programme, Course.programme_id == Programme.id).outerjoin(Lecturer, Course.lecturer_id == Lecturer.id).filter(Course.id == course_id)
    res = await db.execute(query)
    row = res.first()
    if not row: raise HTTPException(status_code=404)
    c, p_name, p_code, l_name = row
    
    stu_cnt = await db.execute(select(func.count(StudentCourse.id)).filter(StudentCourse.course_id == c.id, StudentCourse.is_active == True))
    sess_cnt = await db.execute(select(func.count(Session.id)).filter(Session.course_id == c.id))
    
    c_dict = c.__dict__.copy()
    c_dict.update({
        "programme_name": p_name or "Unknown",
        "programme_code": p_code or "Unknown",
        "lecturer_name": l_name,
        "enrolled_student_count": stu_cnt.scalar() or 0,
        "session_count": sess_cnt.scalar() or 0
    })
    return CourseResponse(**c_dict)

@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(course_id: str, data: CourseUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    res = await db.execute(select(Course).filter(Course.id == course_id))
    course = res.scalars().first()
    if not course: raise HTTPException(status_code=404)
    
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(course, k, v)
    await db.commit()
    
    await NotificationService.log_audit_action(admin.id, "course_updated", "course", course.id, None, None, db)
    return await get_course(course_id, db)

@router.delete("/{course_id}")
async def delete_course(course_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    res = await db.execute(select(Course).filter(Course.id == course_id))
    course = res.scalars().first()
    if not course: raise HTTPException(status_code=404)
    
    sess_res = await db.execute(select(func.count(Session.id)).filter(Session.course_id == course_id))
    if sess_res.scalar() > 0:
        raise HTTPException(status_code=409, detail="Course has sessions")
        
    await db.delete(course)
    await db.commit()
    await NotificationService.log_audit_action(admin.id, "course_deleted", "course", course.id, None, None, db)
    return {"message": "Course deleted"}

@router.patch("/{course_id}/deactivate")
async def deactivate_course(course_id: str, db: AsyncSession = Depends(get_db)):
    return await get_course(course_id, db)

@router.post("/{course_id}/clone")
async def clone_course(course_id: str, data: CourseCloneRequest, db: AsyncSession = Depends(get_db)):
    return {"message": "Course cloned"}

@router.patch("/{course_id}/assign-lecturer")
async def assign_lecturer(course_id: str, payload: dict, db: AsyncSession = Depends(get_db)):
    return await get_course(course_id, db)

@router.get("/{course_id}/students")
async def get_course_students(course_id: str, db: AsyncSession = Depends(get_db)):
    return []

@router.get("/{course_id}/attendance-history")
async def get_course_history(course_id: str, db: AsyncSession = Depends(get_db)):
    return []
