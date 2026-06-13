export const courses = [
  {
    id: 'CS301', code: 'CS301', title: 'Database Systems', programme: 'BSc Computer Science',
    level: 'Level 300', semester: 'Semester 1', credits: 3, totalStudents: 94, threshold: 75,
    sessionsHeld: 12, avgAttendance: 78.4, aboveThreshold: 82, belowThreshold: 12,
    status: 'active', color: '#F59E0B',
  },
  {
    id: 'CS401', code: 'CS401', title: 'Algorithms', programme: 'BSc Computer Science',
    level: 'Level 400', semester: 'Semester 1', credits: 3, totalStudents: 67, threshold: 80,
    sessionsHeld: 14, avgAttendance: 81.2, aboveThreshold: 58, belowThreshold: 9,
    status: 'active', color: '#8B5CF6',
  },
  {
    id: 'CS201', code: 'CS201', title: 'Data Structures', programme: 'BSc Computer Science',
    level: 'Level 200', semester: 'Semester 1', credits: 3, totalStudents: 126, threshold: 75,
    sessionsHeld: 10, avgAttendance: 72.1, aboveThreshold: 98, belowThreshold: 28,
    status: 'active', color: '#3B82F6',
  },
];

export const studentsCS301 = [
  { id: 'STU-0001', name: 'Kwame Asante', email: 'k.asante@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 300', present: 18, total: 24, percentage: 75, status: 'good' },
  { id: 'STU-0002', name: 'Ama Boateng', email: 'a.boateng@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 300', present: 22, total: 24, percentage: 91, status: 'good' },
  { id: 'STU-0003', name: 'Kofi Mensah', email: 'k.mensah@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 300', present: 14, total: 24, percentage: 58, status: 'defaulter' },
  { id: 'STU-0004', name: 'Akua Darko', email: 'a.darko@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 300', present: 19, total: 24, percentage: 79, status: 'good' },
  { id: 'STU-0005', name: 'Yaw Frimpong', email: 'y.frimpong@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 300', present: 16, total: 24, percentage: 66, status: 'at-risk' },
  { id: 'STU-0006', name: 'Abena Owusu', email: 'ab.owusu@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 300', present: 23, total: 24, percentage: 95, status: 'good' },
  { id: 'STU-0007', name: 'Kweku Boateng', email: 'kw.boateng@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 300', present: 13, total: 24, percentage: 54, status: 'defaulter' },
  { id: 'STU-0008', name: 'Adwoa Asiedu', email: 'ad.asiedu@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 300', present: 18, total: 24, percentage: 75, status: 'good' },
  { id: 'STU-0009', name: 'Fiifi Andoh', email: 'f.andoh@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 300', present: 17, total: 24, percentage: 70, status: 'at-risk' },
  { id: 'STU-0010', name: 'Nana Osei', email: 'n.osei@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 300', present: 20, total: 24, percentage: 83, status: 'good' },
];

export const allStudentsPool = [
  ...studentsCS301,
  { id: 'STU-0011', name: 'Efua Mensah', email: 'e.mensah@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 400', present: 10, total: 14, percentage: 71, status: 'at-risk', course: 'CS401' },
  { id: 'STU-0012', name: 'Kojo Appiah', email: 'k.appiah@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 400', present: 8, total: 14, percentage: 57, status: 'defaulter', course: 'CS401' },
  { id: 'STU-0013', name: 'Esi Tetteh', email: 'e.tetteh@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 200', present: 6, total: 10, percentage: 60, status: 'at-risk', course: 'CS201' },
  { id: 'STU-0014', name: 'Yaa Asantewaa', email: 'y.asantewaa@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 200', present: 5, total: 10, percentage: 50, status: 'defaulter', course: 'CS201' },
  { id: 'STU-0015', name: 'Papa Entsie', email: 'p.entsie@st.umat.edu.gh', programme: 'BSc CS', level: 'Level 200', present: 7, total: 10, percentage: 70, status: 'at-risk', course: 'CS201' },
];

export const sessionsCS301 = [
  { id: 's1', courseId: 'CS301', courseCode: 'CS301', courseName: 'Database Systems', label: 'Week 8 Lecture', date: '2025-06-04', time: '10:00 AM', endTime: '11:30 AM', present: 78, total: 94, percentage: 83, status: 'completed', faceScan: 62, qrCode: 16 },
  { id: 's2', courseId: 'CS301', courseCode: 'CS301', courseName: 'Database Systems', label: 'Week 7 Lecture', date: '2025-05-28', time: '10:00 AM', endTime: '11:15 AM', present: 71, total: 94, percentage: 75.5, status: 'completed', faceScan: 55, qrCode: 16 },
  { id: 's3', courseId: 'CS301', courseCode: 'CS301', courseName: 'Database Systems', label: 'Week 6 Lecture', date: '2025-05-21', time: '10:00 AM', endTime: '11:20 AM', present: 65, total: 94, percentage: 69.1, status: 'completed', faceScan: 50, qrCode: 15 },
  { id: 's4', courseId: 'CS301', courseCode: 'CS301', courseName: 'Database Systems', label: 'Week 5 Lecture', date: '2025-05-14', time: '10:00 AM', endTime: '11:30 AM', present: 82, total: 94, percentage: 87.2, status: 'completed', faceScan: 65, qrCode: 17 },
  { id: 's5', courseId: 'CS301', courseCode: 'CS301', courseName: 'Database Systems', label: 'Week 4 Lecture', date: '2025-05-07', time: '10:00 AM', endTime: '11:25 AM', present: 79, total: 94, percentage: 84, status: 'completed', faceScan: 60, qrCode: 19 },
];

export const sessionsCS401 = [
  { id: 's6', courseId: 'CS401', courseCode: 'CS401', courseName: 'Algorithms', label: 'Week 8 Lecture', date: '2025-06-04', time: '2:00 PM', endTime: '3:30 PM', present: 56, total: 67, percentage: 83.5, status: 'completed', faceScan: 44, qrCode: 12 },
  { id: 's7', courseId: 'CS401', courseCode: 'CS401', courseName: 'Algorithms', label: 'Week 7 Lecture', date: '2025-05-28', time: '2:00 PM', endTime: '3:25 PM', present: 52, total: 67, percentage: 77.6, status: 'completed', faceScan: 40, qrCode: 12 },
  { id: 's8', courseId: 'CS401', courseCode: 'CS401', courseName: 'Algorithms', label: 'Week 6 Lecture', date: '2025-05-21', time: '2:00 PM', endTime: '3:30 PM', present: 58, total: 67, percentage: 86.5, status: 'completed', faceScan: 46, qrCode: 12 },
];

export const sessionsCS201 = [
  { id: 's9', courseId: 'CS201', courseCode: 'CS201', courseName: 'Data Structures', label: 'Week 7 Lecture', date: '2025-05-28', time: '8:00 AM', endTime: '9:30 AM', present: 98, total: 126, percentage: 77.7, status: 'completed', faceScan: 78, qrCode: 20 },
  { id: 's10', courseId: 'CS201', courseCode: 'CS201', courseName: 'Data Structures', label: 'Week 6 Lecture', date: '2025-05-21', time: '8:00 AM', endTime: '9:25 AM', present: 85, total: 126, percentage: 67.4, status: 'completed', faceScan: 65, qrCode: 20 },
];

export const allSessions = [...sessionsCS301, ...sessionsCS401, ...sessionsCS201].sort((a, b) => new Date(b.date) - new Date(a.date));

export const notifications = [
  { id: 'n1', type: 'threshold_alert', title: "Kofi Mensah's attendance dropped to 58%", description: 'Database Systems (CS301) — attendance is well below the 75% threshold.', time: '2 hours ago', read: false, link: '/courses/CS301' },
  { id: 'n2', type: 'session_reminder', title: 'Your CS201 session from Monday is still open', description: 'Data Structures session has not been closed. Please end or extend it.', time: '3 hours ago', read: false, link: '/sessions' },
  { id: 'n3', type: 'weekly_summary', title: 'Weekly summary: avg 79.3% across all courses', description: 'Your courses had 5 sessions this week with an average attendance of 79.3%.', time: 'Yesterday', read: false, link: '/reports' },
  { id: 'n4', type: 'threshold_alert', title: "Kweku Boateng dropped to 54% in CS301", description: 'Database Systems (CS301) — student is at serious risk of failing attendance requirement.', time: '2 days ago', read: false, link: '/courses/CS301' },
  { id: 'n5', type: 'session_completed', title: 'Session completed: CS301 Week 8', description: '78 out of 94 students present (83%). All records saved.', time: '2 days ago', read: true, link: '/sessions' },
  { id: 'n6', type: 'session_completed', title: 'Session completed: CS401 Week 8', description: '56 out of 67 students present (83.5%). All records saved.', time: '2 days ago', read: true, link: '/sessions' },
  { id: 'n7', type: 'system', title: 'New semester activated by admin', description: 'Semester 1 of 2024/2025 has been activated. All course data has been refreshed.', time: '5 days ago', read: true, link: '/dashboard' },
  { id: 'n8', type: 'weekly_summary', title: 'Weekly summary: avg 76.8% across all courses', description: 'Previous week performance summary across your assigned courses.', time: '1 week ago', read: true, link: '/reports' },
  { id: 'n9', type: 'threshold_alert', title: "Yaw Frimpong at risk in CS301 (66%)", description: 'Student approaching the attendance threshold — consider intervention.', time: '1 week ago', read: true, link: '/courses/CS301' },
  { id: 'n10', type: 'session_completed', title: 'Session completed: CS201 Week 7', description: '98 out of 126 students present (77.7%).', time: '1 week ago', read: true, link: '/sessions' },
  { id: 'n11', type: 'session_reminder', title: 'Reminder: CS401 session tomorrow at 2 PM', description: 'Your Algorithms lecture is scheduled for tomorrow.', time: '2 weeks ago', read: true, link: '/courses/CS401' },
  { id: 'n12', type: 'system', title: 'System maintenance completed', description: 'The attendance system has been updated with new features.', time: '2 weeks ago', read: true, link: '/dashboard' },
];

export const checkInPool = [
  'Kwame Asante', 'Ama Boateng', 'Akua Darko', 'Abena Owusu', 'Adwoa Asiedu',
  'Nana Osei', 'Kofi Mensah', 'Yaw Frimpong', 'Kweku Boateng', 'Fiifi Andoh',
  'Efua Mensah', 'Kojo Appiah', 'Esi Tetteh', 'Yaa Asantewaa', 'Papa Entsie',
  'Adjoa Manu', 'Kwabena Adu', 'Akosua Tawiah', 'Paa Kwesi Baidoo', 'Kukua Mensah',
  'Yeboah Amankwah', 'Serwaa Bonsu', 'Opoku Ware', 'Maame Esi', 'Kwabenah Gyamfi',
  'Afia Pokua', 'Kwadwo Antwi', 'Akua Sarpong', 'Yaw Boateng', 'Ama Serwaa',
  'Kofi Amoako', 'Nana Addo', 'Esi Amoah', 'Kweku Forson', 'Abena Achiaa',
  'Yaw Oppong', 'Adjoa Asiedua', 'Paa Kwesi', 'Ama Kyerewaa', 'Kofi Annan',
  'Akosua Mensah', 'Kwame Nkrumah Jr', 'Yaa Serwaa', 'Esi Cleland', 'Kojo Baiden',
  'Efua Sutherland', 'Papa Arko',
];

export const weeklyTrendData = [
  { week: 'Week 1', CS301: 82, CS401: 85, CS201: 78 },
  { week: 'Week 2', CS301: 79, CS401: 82, CS201: 74 },
  { week: 'Week 3', CS301: 84, CS401: 78, CS201: 71 },
  { week: 'Week 4', CS301: 84, CS401: 80, CS201: 68 },
  { week: 'Week 5', CS301: 87, CS401: 83, CS201: 73 },
  { week: 'Week 6', CS301: 69, CS401: 86, CS201: 67 },
  { week: 'Week 7', CS301: 75, CS401: 77, CS201: 77 },
  { week: 'Week 8', CS301: 83, CS401: 83, CS201: 72 },
];