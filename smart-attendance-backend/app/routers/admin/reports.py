from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies import require_admin
from app.services.report_service import ReportService
from app.models.institution import Institution

router = APIRouter(dependencies=[Depends(require_admin)])

@router.get("/institution")
async def report_institution_json(academic_year_id: str = None, semester_id: str = None, db: AsyncSession = Depends(get_db)):
    return {"summary": {}, "departments": [], "courses": []}

@router.get("/institution/pdf")
async def report_institution_pdf(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Institution).limit(1))
    inst = res.scalars().first()
    name = inst.name if inst else "Institution"
    
    pdf_bytes = ReportService.generate_institution_attendance_pdf(name, {}, "2024/2025", "Semester 1")
    
    return StreamingResponse(
        iter([pdf_bytes]), 
        media_type="application/pdf", 
        headers={"Content-Disposition": 'attachment; filename="institution_attendance.pdf"'}
    )

@router.get("/institution/excel")
async def report_institution_excel(db: AsyncSession = Depends(get_db)):
    excel_bytes = ReportService.generate_institution_attendance_excel({})
    return StreamingResponse(
        iter([excel_bytes]), 
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
        headers={"Content-Disposition": 'attachment; filename="institution_attendance.xlsx"'}
    )

@router.get("/department/{department_id}/pdf")
async def report_department_pdf(department_id: str):
    return {"message": "PDF output stream"}

@router.get("/department/{department_id}/excel")
async def report_department_excel(department_id: str):
    return {"message": "Excel output stream"}

@router.get("/course/{course_id}/pdf")
async def report_course_pdf(course_id: str):
    return {"message": "PDF output stream"}

@router.get("/course/{course_id}/excel")
async def report_course_excel(course_id: str):
    return {"message": "Excel output stream"}

@router.get("/student/{student_id}/pdf")
async def report_student_pdf(student_id: str):
    return {"message": "PDF output stream"}

@router.get("/defaulters")
async def get_defaulters():
    return {"defaulters": [], "total": 0}

@router.get("/defaulters/pdf")
async def get_defaulters_pdf():
    return {"message": "PDF output stream"}

@router.get("/defaulters/excel")
async def get_defaulters_excel():
    return {"message": "Excel output stream"}

@router.get("/lecturers/activity")
async def get_lecturers_activity():
    return []

@router.get("/lecturers/activity/pdf")
async def get_lecturers_activity_pdf():
    return {"message": "PDF output stream"}

@router.get("/lecturers/activity/excel")
async def get_lecturers_activity_excel():
    return {"message": "Excel output stream"}

@router.post("/notifications/send-threshold-warnings")
async def trigger_threshold_warnings(db: AsyncSession = Depends(get_db)):
    return {"emails_sent": 0, "students_notified": 0}

@router.post("/notifications/send-weekly-summary")
async def trigger_weekly_summary(db: AsyncSession = Depends(get_db)):
    return {"emails_sent": 0}
