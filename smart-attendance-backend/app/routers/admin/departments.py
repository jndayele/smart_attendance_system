from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.dependencies import require_admin
from app.models.department import Department
from app.models.programme import Programme
from app.models.student import Student
from app.models.institution import Institution
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse, DepartmentListResponse
from app.schemas.programme import ProgrammeListResponse
from app.schemas.student import StudentListResponse
from app.services.notification_service import NotificationService
from app.models.user import User

router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/", response_model=DepartmentListResponse)
async def list_departments(
    search: str = None,
    is_active: bool = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(Department)
    if search:
        query = query.filter(Department.name.ilike(f"%{search}%") | Department.code.ilike(f"%{search}%"))
    if is_active is not None:
        query = query.filter(Department.is_active == is_active)
        
    res = await db.execute(query.offset((page - 1) * limit).limit(limit))
    departments = res.scalars().all()
    
    total_res = await db.execute(select(func.count(Department.id)))
    total = total_res.scalar() or 0
    
    responses = []
    for dept in departments:
        prog_cnt = await db.execute(select(func.count(Programme.id)).filter(Programme.department_id == dept.id))
        stu_cnt = await db.execute(select(func.count(Student.id)).filter(Student.department_id == dept.id))
        
        dept_dict = dept.__dict__.copy()
        dept_dict["programme_count"] = prog_cnt.scalar() or 0
        dept_dict["student_count"] = stu_cnt.scalar() or 0
        responses.append(DepartmentResponse(**dept_dict))
        
    return DepartmentListResponse(departments=responses, total=total)

@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    dept: DepartmentCreate, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # Check if institution exists
    inst_res = await db.execute(select(Institution).limit(1))
    inst = inst_res.scalars().first()
    if not inst:
        raise HTTPException(status_code=400, detail="Institution not setup")
        
    # Check code uniqueness
    code_check = await db.execute(select(Department).filter(func.lower(Department.code) == dept.code.lower()))
    if code_check.scalars().first():
        raise HTTPException(status_code=409, detail="Department code already exists")
        
    new_dept = Department(**dept.model_dump(), institution_id=inst.id)
    db.add(new_dept)
    await db.commit()
    await db.refresh(new_dept)
    
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="department_created", entity_type="department", 
        entity_id=new_dept.id, details={"code": new_dept.code}, ip_address=None, db=db
    )
    
    dept_dict = new_dept.__dict__.copy()
    dept_dict["programme_count"] = 0
    dept_dict["student_count"] = 0
    return DepartmentResponse(**dept_dict)

@router.get("/{department_id}", response_model=DepartmentResponse)
async def get_department(department_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Department).filter(Department.id == department_id))
    dept = res.scalars().first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    prog_cnt = await db.execute(select(func.count(Programme.id)).filter(Programme.department_id == dept.id))
    stu_cnt = await db.execute(select(func.count(Student.id)).filter(Student.department_id == dept.id))
    
    dept_dict = dept.__dict__.copy()
    dept_dict["programme_count"] = prog_cnt.scalar() or 0
    dept_dict["student_count"] = stu_cnt.scalar() or 0
    return DepartmentResponse(**dept_dict)

@router.patch("/{department_id}", response_model=DepartmentResponse)
async def update_department(
    department_id: str, 
    update_data: DepartmentUpdate, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    res = await db.execute(select(Department).filter(Department.id == department_id))
    dept = res.scalars().first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    if update_data.code and update_data.code.lower() != dept.code.lower():
        code_check = await db.execute(select(Department).filter(func.lower(Department.code) == update_data.code.lower()))
        if code_check.scalars().first():
            raise HTTPException(status_code=409, detail="Department code already exists")
            
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(dept, key, value)
        
    await db.commit()
    await db.refresh(dept)
    
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="department_updated", entity_type="department", 
        entity_id=dept.id, details=update_data.model_dump(exclude_unset=True), ip_address=None, db=db
    )
    
    # Return response with real counts
    prog_cnt = await db.scalar(select(func.count(Programme.id)).where(Programme.department_id == department_id))
    stu_cnt = await db.scalar(
        select(func.count(Student.id)).join(Programme).where(Programme.department_id == department_id)
    )
    
    dept_dict = dept.__dict__.copy()
    dept_dict["programme_count"] = prog_cnt or 0
    dept_dict["student_count"] = stu_cnt or 0
    return DepartmentResponse(**dept_dict)

@router.delete("/{department_id}")
async def delete_department(
    department_id: str, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    res = await db.execute(select(Department).filter(Department.id == department_id))
    dept = res.scalars().first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
        
    prog_cnt = await db.execute(select(func.count(Programme.id)).filter(Programme.department_id == dept.id))
    if (prog_cnt.scalar() or 0) > 0:
        raise HTTPException(status_code=409, detail="Cannot delete department with existing programmes. Remove all programmes first or deactivate instead.")
        
    await db.delete(dept)
    await db.commit()
    
    await NotificationService.log_audit_action(
        performed_by=admin.id, action="department_deleted", entity_type="department", 
        entity_id=dept.id, details=None, ip_address=None, db=db
    )
    return {"message": "Department deleted"}

@router.patch("/{department_id}/deactivate", response_model=DepartmentResponse)
async def deactivate_department(department_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    res = await db.execute(select(Department).filter(Department.id == department_id))
    dept = res.scalars().first()
    if not dept: raise HTTPException(status_code=404, detail="Not found")
    
    dept.is_active = False
    await db.commit()
    await NotificationService.log_audit_action(admin.id, "department_deactivated", "department", dept.id, None, None, db)
    
    dept_dict = dept.__dict__.copy()
    dept_dict["programme_count"] = 0
    dept_dict["student_count"] = 0
    return DepartmentResponse(**dept_dict)

@router.patch("/{department_id}/activate", response_model=DepartmentResponse)
async def activate_department(department_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    res = await db.execute(select(Department).filter(Department.id == department_id))
    dept = res.scalars().first()
    if not dept: raise HTTPException(status_code=404, detail="Not found")
    
    dept.is_active = True
    await db.commit()
    await NotificationService.log_audit_action(admin.id, "department_activated", "department", dept.id, None, None, db)
    
    dept_dict = dept.__dict__.copy()
    dept_dict["programme_count"] = 0
    dept_dict["student_count"] = 0
    return DepartmentResponse(**dept_dict)

@router.get("/{department_id}/programmes")
async def get_department_programmes(department_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Programme)
        .where(Programme.department_id == department_id)
        .order_by(Programme.name)
    )
    programmes = result.scalars().all()
    return {"programmes": [p.__dict__ for p in programmes], "total": len(programmes)}

@router.get("/{department_id}/students")
async def get_department_students(
    department_id: str, 
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Student)
        .join(Programme, Student.programme_id == Programme.id)
        .where(Programme.department_id == department_id)
        .offset(skip).limit(limit)
    )
    students = result.scalars().all()
    total = await db.scalar(
        select(func.count(Student.id))
        .join(Programme).where(Programme.department_id == department_id)
    )
    return {"students": students, "total": total or 0}
