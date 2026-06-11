from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.dependencies import require_admin
from app.models.department import Department
from app.models.programme import Programme
from app.models.course import Course
from app.models.student import Student
from app.models.user import User
from app.schemas.programme import ProgrammeCreate, ProgrammeUpdate, ProgrammeResponse, ProgrammeListResponse
from app.services.notification_service import NotificationService

router = APIRouter(dependencies=[Depends(require_admin)])

def compute_levels(duration_years: int) -> List[int]:
    return [i * 100 for i in range(1, duration_years + 1)]

@router.get("/", response_model=ProgrammeListResponse)
async def list_programmes(
    search: str = None,
    department_id: str = None,
    is_active: bool = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(Programme, Department.name.label("department_name")).join(Department)
    
    if search:
        query = query.filter(Programme.name.ilike(f"%{search}%") | Programme.code.ilike(f"%{search}%"))
    if department_id:
        query = query.filter(Programme.department_id == department_id)
    if is_active is not None:
        query = query.filter(Programme.is_active == is_active)
        
    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    rows = res.all()
    
    total_res = await db.execute(select(func.count(Programme.id)))
    total = total_res.scalar() or 0
    
    responses = []
    for prog, dept_name in rows:
        stu_cnt = await db.execute(select(func.count(Student.id)).filter(Student.programme_id == prog.id, Student.is_suspended == False))
        crs_cnt = await db.execute(select(func.count(Course.id)).filter(Course.programme_id == prog.id, Course.is_active == True))
        
        prog_dict = prog.__dict__.copy()
        prog_dict["department_name"] = dept_name
        prog_dict["levels"] = compute_levels(prog.duration_years)
        prog_dict["student_count"] = stu_cnt.scalar() or 0
        prog_dict["course_count"] = crs_cnt.scalar() or 0
        responses.append(ProgrammeResponse(**prog_dict))
        
    return ProgrammeListResponse(programmes=responses, total=total)

@router.post("/", response_model=ProgrammeResponse, status_code=status.HTTP_201_CREATED)
async def create_programme(
    prog: ProgrammeCreate, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    dept_res = await db.execute(select(Department).filter(Department.id == prog.department_id, Department.is_active == True))
    dept = dept_res.scalars().first()
    if not dept:
        raise HTTPException(status_code=400, detail="Department does not exist or is inactive")
        
    code_check = await db.execute(select(Programme).filter(func.lower(Programme.code) == prog.code.lower()))
    if code_check.scalars().first():
        raise HTTPException(status_code=409, detail="Programme code already exists")
        
    new_prog = Programme(**prog.model_dump())
    db.add(new_prog)
    await db.commit()
    await db.refresh(new_prog)
    
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="programme_created", entity_type="programme", 
        entity_id=new_prog.id, details={"code": new_prog.code}, ip_address=None, db=db
    )
    
    prog_dict = new_prog.__dict__.copy()
    prog_dict["department_name"] = dept.name
    prog_dict["levels"] = compute_levels(new_prog.duration_years)
    prog_dict["student_count"] = 0
    prog_dict["course_count"] = 0
    return ProgrammeResponse(**prog_dict)

@router.get("/{programme_id}", response_model=ProgrammeResponse)
async def get_programme(programme_id: str, db: AsyncSession = Depends(get_db)):
    query = select(Programme, Department.name.label("department_name")).join(Department).filter(Programme.id == programme_id)
    res = await db.execute(query)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Programme not found")
    prog, dept_name = row
    
    stu_cnt = await db.execute(select(func.count(Student.id)).filter(Student.programme_id == prog.id))
    crs_cnt = await db.execute(select(func.count(Course.id)).filter(Course.programme_id == prog.id))
    
    prog_dict = prog.__dict__.copy()
    prog_dict["department_name"] = dept_name
    prog_dict["levels"] = compute_levels(prog.duration_years)
    prog_dict["student_count"] = stu_cnt.scalar() or 0
    prog_dict["course_count"] = crs_cnt.scalar() or 0
    return ProgrammeResponse(**prog_dict)

@router.patch("/{programme_id}", response_model=ProgrammeResponse)
async def update_programme(
    programme_id: str, 
    update_data: ProgrammeUpdate, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    res = await db.execute(select(Programme).filter(Programme.id == programme_id))
    prog = res.scalars().first()
    if not prog:
        raise HTTPException(status_code=404, detail="Programme not found")
        
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(prog, key, value)
        
    await db.commit()
    await db.refresh(prog)
    
    await NotificationService.log_audit_action(
        admin.id, "programme_updated", "programme", prog.id, update_data.model_dump(exclude_unset=True), None, db
    )
    
    return await get_programme(programme_id, db)

@router.delete("/{programme_id}")
async def delete_programme(
    programme_id: str, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    res = await db.execute(select(Programme).filter(Programme.id == programme_id))
    prog = res.scalars().first()
    if not prog: raise HTTPException(status_code=404, detail="Programme not found")
        
    stu_cnt = await db.execute(select(func.count(Student.id)).filter(Student.programme_id == prog.id))
    crs_cnt = await db.execute(select(func.count(Course.id)).filter(Course.programme_id == prog.id))
    
    if (stu_cnt.scalar() or 0) > 0 or (crs_cnt.scalar() or 0) > 0:
        raise HTTPException(status_code=409, detail="Cannot delete programme with existing students or courses")
        
    await db.delete(prog)
    await db.commit()
    
    await NotificationService.log_audit_action(admin.id, "programme_deleted", "programme", prog.id, None, None, db)
    return {"message": "Programme deleted"}

@router.patch("/{programme_id}/deactivate", response_model=ProgrammeResponse)
async def deactivate_programme(programme_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    res = await db.execute(select(Programme).filter(Programme.id == programme_id))
    prog = res.scalars().first()
    if not prog: raise HTTPException(status_code=404)
    prog.is_active = False
    await db.commit()
    await NotificationService.log_audit_action(admin.id, "programme_deactivated", "programme", prog.id, None, None, db)
    return await get_programme(programme_id, db)

@router.patch("/{programme_id}/archive", response_model=ProgrammeResponse)
async def archive_programme(programme_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    from datetime import datetime
    res = await db.execute(select(Programme).filter(Programme.id == programme_id))
    prog = res.scalars().first()
    if not prog: raise HTTPException(status_code=404)
    prog.is_active = False
    prog.archived_at = datetime.utcnow()
    await db.commit()
    await NotificationService.log_audit_action(admin.id, "programme_archived", "programme", prog.id, None, None, db)
    return await get_programme(programme_id, db)

@router.get("/{programme_id}/students")
async def get_programme_students(
    programme_id: str, 
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Student).where(Student.programme_id == programme_id)
        .offset(skip).limit(limit)
    )
    total = await db.scalar(
        select(func.count(Student.id)).where(Student.programme_id == programme_id)
    )
    return {"students": result.scalars().all(), "total": total or 0}

@router.get("/{programme_id}/courses")
async def get_programme_courses(programme_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Course).where(Course.programme_id == programme_id)
    )
    courses = result.scalars().all()
    return {"courses": courses, "total": len(courses)}
