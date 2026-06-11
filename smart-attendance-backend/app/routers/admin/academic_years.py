from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update

from app.database import get_db
from app.dependencies import require_admin
from app.models.academic_year import AcademicYear, Semester
from app.models.session import Session
from app.models.institution import Institution
from app.models.user import User
from app.schemas.academic_year import (
    AcademicYearCreate, AcademicYearUpdate, AcademicYearResponse, AcademicYearListResponse,
    SemesterCreate, SemesterUpdate, SemesterResponse
)
from app.services.notification_service import NotificationService

router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/", response_model=AcademicYearListResponse)
async def list_academic_years(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AcademicYear).order_by(AcademicYear.created_at.desc()))
    years = res.scalars().all()
    
    total = len(years)
    responses = []
    
    for year in years:
        sem_res = await db.execute(select(Semester).filter(Semester.academic_year_id == year.id))
        semesters = sem_res.scalars().all()
        
        y_dict = year.__dict__.copy()
        y_dict["semesters"] = [s.__dict__ for s in semesters]
        responses.append(AcademicYearResponse(**y_dict))
        
    return AcademicYearListResponse(academic_years=responses, total=total)

@router.post("/", response_model=AcademicYearResponse, status_code=status.HTTP_201_CREATED)
async def create_academic_year(
    data: AcademicYearCreate, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    inst_res = await db.execute(select(Institution).limit(1))
    inst = inst_res.scalars().first()
    
    dup_res = await db.execute(select(AcademicYear).filter(AcademicYear.year_label == data.year_label))
    if dup_res.scalars().first():
        raise HTTPException(status_code=409, detail="Academic year already exists")
        
    if data.set_as_active:
        await db.execute(update(AcademicYear).values(is_active=False))
        
    new_year = AcademicYear(year_label=data.year_label, is_active=data.set_as_active, institution_id=inst.id)
    db.add(new_year)
    await db.commit()
    await db.refresh(new_year)
    
    await NotificationService.log_audit_action(admin.id, "academic_year_created", "academic_year", new_year.id, {"label": new_year.year_label}, None, db)
    
    y_dict = new_year.__dict__.copy()
    y_dict["semesters"] = []
    return AcademicYearResponse(**y_dict)

@router.get("/active")
async def get_active_year(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AcademicYear).filter(AcademicYear.is_active == True))
    year = res.scalars().first()
    if not year:
        return {"academic_year": None, "active_semester": None}
        
    sem_res = await db.execute(select(Semester).filter(Semester.is_active == True))
    sem = sem_res.scalars().first()
    
    all_sem_res = await db.execute(select(Semester).filter(Semester.academic_year_id == year.id))
    sems = all_sem_res.scalars().all()
    
    y_dict = year.__dict__.copy()
    y_dict["semesters"] = [s.__dict__ for s in sems]
    
    return {
        "academic_year": AcademicYearResponse(**y_dict),
        "active_semester": SemesterResponse(**sem.__dict__) if sem else None
    }

@router.get("/{year_id}", response_model=AcademicYearResponse)
async def get_academic_year(year_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(AcademicYear).filter(AcademicYear.id == year_id))
    year = res.scalars().first()
    if not year: raise HTTPException(status_code=404)
    
    sem_res = await db.execute(select(Semester).filter(Semester.academic_year_id == year.id))
    y_dict = year.__dict__.copy()
    y_dict["semesters"] = [s.__dict__ for s in sem_res.scalars().all()]
    return AcademicYearResponse(**y_dict)

@router.patch("/{year_id}", response_model=AcademicYearResponse)
async def update_academic_year(
    year_id: str, 
    data: AcademicYearUpdate, 
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin)
):
    res = await db.execute(select(AcademicYear).filter(AcademicYear.id == year_id))
    year = res.scalars().first()
    if not year: raise HTTPException(status_code=404)
    
    if data.is_active:
        await db.execute(update(AcademicYear).values(is_active=False))
        year.is_active = True
        
    if data.year_label:
        year.year_label = data.year_label
        
    await db.commit()
    await db.refresh(year)
    
    await NotificationService.log_audit_action(admin.id, "academic_year_updated", "academic_year", year.id, None, None, db)
    return await get_academic_year(year_id, db)

@router.delete("/{year_id}")
async def delete_academic_year(year_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    from app.models.session import Session
    res = await db.execute(select(AcademicYear).filter(AcademicYear.id == year_id))
    year = res.scalars().first()
    if not year: raise HTTPException(status_code=404)
    
    # Session guard check
    semesters = await db.execute(select(Semester).where(Semester.academic_year_id == year_id))
    sem_ids = [s.id for s in semesters.scalars().all()]
    if sem_ids:
        # Assuming we need to check if there are any sessions linked to these semesters
        # But wait, sessions don't have semester_id. We check by date.
        pass
    
    # A simpler way to guard: Check if year has semesters with sessions? Wait, year has semesters.
    # The prompt: "DELETE /admin/academic-years/{id} — add sessions guard."
    # If we can't reliably link sessions to years via foreign keys, what's the logic?
    # Session belongs to Course -> Programme -> Department -> Institution. No direct link to year.
    # But Session has a date.
    has_sessions = False
    for s_id in sem_ids:
        sem = await db.scalar(select(Semester).filter(Semester.id == s_id))
        if sem and sem.start_date and sem.end_date:
            session_count = await db.scalar(
                select(func.count(Session.id)).where(Session.session_date >= sem.start_date, Session.session_date <= sem.end_date)
            )
            if session_count and session_count > 0:
                has_sessions = True
                break
                
    if has_sessions:
        raise HTTPException(status_code=409, detail="Cannot delete academic year with existing sessions.")

    await db.delete(year)
    await db.commit()
    await NotificationService.log_audit_action(admin.id, "academic_year_deleted", "academic_year", year.id, None, None, db)
    return {"message": "Academic year deleted"}

@router.post("/{year_id}/semesters", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED)
async def create_semester(year_id: str, data: SemesterCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    new_sem = Semester(**data.model_dump())
    new_sem.academic_year_id = year_id
    db.add(new_sem)
    await db.commit()
    await db.refresh(new_sem)
    await NotificationService.log_audit_action(admin.id, "semester_created", "semester", new_sem.id, None, None, db)
    return SemesterResponse(**new_sem.__dict__)

@router.patch("/{year_id}/semesters/{sem_id}", response_model=SemesterResponse)
async def update_semester(year_id: str, sem_id: str, data: SemesterUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    res = await db.execute(select(Semester).filter(Semester.id == sem_id))
    sem = res.scalars().first()
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(sem, k, v)
    await db.commit()
    await NotificationService.log_audit_action(admin.id, "semester_updated", "semester", sem.id, None, None, db)
    return SemesterResponse(**sem.__dict__)

@router.post("/{year_id}/semesters/{sem_id}/activate", response_model=SemesterResponse)
async def activate_semester(year_id: str, sem_id: str, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    await db.execute(update(Semester).values(is_active=False))
    
    res = await db.execute(select(Semester).filter(Semester.id == sem_id))
    sem = res.scalars().first()
    sem.is_active = True
    await db.commit()
    await NotificationService.log_audit_action(admin.id, "semester_activated", "semester", sem.id, None, None, db)
    return SemesterResponse(**sem.__dict__)

@router.post("/{year_id}/semesters/{sem_id}/close")
async def close_semester(year_id: str, sem_id: str, body: dict, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    from app.models.session import Session
    from sqlalchemy import update
    if body.get("confirm") != "CONFIRM":
        raise HTTPException(status_code=400, detail="Confirmation required")
        
    res = await db.execute(select(Semester).filter(Semester.id == sem_id))
    sem = res.scalars().first()
    if not sem:
        raise HTTPException(status_code=404, detail="Semester not found")
        
    sem.is_closed = True
    sem.is_active = False
    
    sessions_archived = 0
    if sem.start_date and sem.end_date:
        # Count sessions before archiving
        sessions_archived = await db.scalar(
            select(func.count(Session.id)).where(Session.session_date >= sem.start_date, Session.session_date <= sem.end_date)
        )
        # Archive sessions
        await db.execute(
            update(Session)
            .where(Session.session_date >= sem.start_date, Session.session_date <= sem.end_date)
            .values(is_archived=True, is_active=False, is_locked=True)
        )
    
    await db.commit()
    await NotificationService.log_audit_action(
        admin.id, "semester_closed", "semester", sem.id, {"sessions_archived": sessions_archived}, None, db
    )
    return {"message": "Semester closed and archived", "sessions_archived": sessions_archived or 0}
