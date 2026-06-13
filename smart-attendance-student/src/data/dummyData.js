export const COURSES = [
  {
    id: "cs301",
    code: "CS301",
    name: "Database Systems",
    level: "Level 300",
    semester: "Semester 1",
    credits: 3,
    lecturer: "Dr. Ama Owusu",
    programme: "BSc Computer Science",
    attended: 18,
    total: 24,
    threshold: 75,
    color: "#F59E0B",
  },
  {
    id: "cs401",
    code: "CS401",
    name: "Algorithms",
    level: "Level 400",
    semester: "Semester 1",
    credits: 3,
    lecturer: "Dr. Kweku Boateng",
    programme: "BSc Computer Science",
    attended: 20,
    total: 24,
    threshold: 80,
    color: "#3B82F6",
  },
  {
    id: "cs201",
    code: "CS201",
    name: "Data Structures",
    level: "Level 200",
    semester: "Semester 1",
    credits: 3,
    lecturer: "Dr. Ama Owusu",
    programme: "BSc Computer Science",
    attended: 12,
    total: 20,
    threshold: 75,
    color: "#8B5CF6",
  },
];

export const getAttendanceStatus = (percentage, threshold) => {
  if (percentage < threshold) return 'defaulter';
  if (percentage < threshold + 5) return 'at-risk';
  return 'good';
};

export const getStatusColor = (status) => {
  if (status === 'good') return '#10B981';
  if (status === 'at-risk') return '#F59E0B';
  return '#EF4444';
};

export const getStatusLabel = (status) => {
  if (status === 'good') return 'Good Standing';
  if (status === 'at-risk') return 'At Risk';
  return 'Defaulter';
};

export const RECENT_ACTIVITY = [
  { date: "Jun 4", course: "CS301", courseName: "Database Systems", method: "face", status: "present" },
  { date: "Jun 3", course: "CS401", courseName: "Algorithms", method: "qr", status: "present" },
  { date: "Jun 1", course: "CS201", courseName: "Data Structures", method: null, status: "absent" },
  { date: "May 28", course: "CS301", courseName: "Database Systems", method: "qr", status: "present" },
  { date: "May 27", course: "CS401", courseName: "Algorithms", method: "face", status: "present" },
];

export const WEEKLY_SCHEDULE = [
  { day: "Mon", time: "10:00 AM", course: "Database Systems", code: "CS301", room: "Room LT4", isToday: true },
  { day: "Tue", time: "2:00 PM", course: "Algorithms", code: "CS401", room: "Room LT2", isToday: false },
  { day: "Wed", time: "10:00 AM", course: "Data Structures", code: "CS201", room: "Room LT1", isToday: false },
];

export const SESSION_RECORDS = [
  { week: "Week 9", date: "Jun 4", day: "Wed", time: "10:14 AM", method: "face", status: "present", override: false },
  { week: "Week 8", date: "May 28", day: "Wed", time: "10:02 AM", method: "qr", status: "present", override: false },
  { week: "Week 7", date: "May 21", day: "Wed", time: null, method: null, status: "absent", override: false },
  { week: "Week 6", date: "May 14", day: "Wed", time: "09:58 AM", method: "face", status: "present", override: false },
  { week: "Week 5", date: "May 7", day: "Wed", time: "10:21 AM", method: "qr", status: "present", override: false },
  { week: "Week 4", date: "Apr 30", day: "Wed", time: null, method: null, status: "absent", override: false },
  { week: "Week 3", date: "Apr 23", day: "Wed", time: "10:05 AM", method: "face", status: "present", override: false },
  { week: "Week 2", date: "Apr 16", day: "Wed", time: "09:55 AM", method: "face", status: "present", override: false },
  { week: "Week 1", date: "Apr 9", day: "Wed", time: "10:18 AM", method: "qr", status: "present", override: false },
  { week: "Intro", date: "Apr 2", day: "Wed", time: null, method: null, status: "absent", override: false },
  { week: "Orientation", date: "Mar 26", day: "Wed", time: "10:00 AM", method: "qr", status: "present", override: true },
  { week: "Pre-semester", date: "Mar 19", day: "Wed", time: "09:50 AM", method: "face", status: "present", override: false },
];

export const WEEKLY_TREND = [
  {
    week: "Wk 10", date: "May 19",
    overall: 72,
    courses: [
      { code: "CS301", pct: 75, color: "#F59E0B" },
      { code: "CS401", pct: 79, color: "#3B82F6" },
      { code: "CS201", pct: 62, color: "#8B5CF6" },
    ],
  },
  {
    week: "Wk 11", date: "May 26",
    overall: 76,
    courses: [
      { code: "CS301", pct: 77, color: "#F59E0B" },
      { code: "CS401", pct: 82, color: "#3B82F6" },
      { code: "CS201", pct: 65, color: "#8B5CF6" },
    ],
  },
  {
    week: "Wk 12", date: "Jun 2",
    overall: 73,
    courses: [
      { code: "CS301", pct: 75, color: "#F59E0B" },
      { code: "CS401", pct: 83, color: "#3B82F6" },
      { code: "CS201", pct: 60, color: "#8B5CF6" },
    ],
  },
  {
    week: "Wk 13", date: "Jun 9",
    overall: 78,
    courses: [
      { code: "CS301", pct: 75, color: "#F59E0B" },
      { code: "CS401", pct: 83, color: "#3B82F6" },
      { code: "CS201", pct: 60, color: "#8B5CF6" },
    ],
  },
];

// CALENDAR_EVENTS: past sessions (with status) + upcoming scheduled sessions
// Dates are relative to "today" = 2026-06-13 (Saturday).
// Past sessions come from SESSION_RECORDS (CS301 on Wednesdays) + similar for CS401/CS201.
export const CALENDAR_EVENTS = [
  // ── Past sessions ──────────────────────────────────────────────
  // CS301 – Database Systems (Wed 10:00 AM)
  { date: "2026-03-19", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "present" },
  { date: "2026-03-26", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "present" },
  { date: "2026-04-02", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "absent" },
  { date: "2026-04-09", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "present" },
  { date: "2026-04-16", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "present" },
  { date: "2026-04-23", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "present" },
  { date: "2026-04-30", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "absent" },
  { date: "2026-05-07", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "present" },
  { date: "2026-05-14", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "present" },
  { date: "2026-05-21", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "absent" },
  { date: "2026-05-28", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "present" },
  { date: "2026-06-04", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "present" },
  // CS401 – Algorithms (Tue 2:00 PM)
  { date: "2026-04-07", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "present" },
  { date: "2026-04-14", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "present" },
  { date: "2026-04-21", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "present" },
  { date: "2026-04-28", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "present" },
  { date: "2026-05-05", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "absent" },
  { date: "2026-05-12", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "present" },
  { date: "2026-05-19", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "present" },
  { date: "2026-05-26", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "present" },
  { date: "2026-06-02", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "present" },
  { date: "2026-06-09", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "present" },
  // CS201 – Data Structures (Wed 10:00 AM)
  { date: "2026-04-08", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "present" },
  { date: "2026-04-15", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "absent" },
  { date: "2026-04-22", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "present" },
  { date: "2026-04-29", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "present" },
  { date: "2026-05-06", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "absent" },
  { date: "2026-05-13", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "present" },
  { date: "2026-05-20", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "absent" },
  { date: "2026-05-27", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "present" },
  { date: "2026-06-01", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "absent" },
  { date: "2026-06-10", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "present" },
  // ── Upcoming sessions ─────────────────────────────────────────
  { date: "2026-06-15", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "upcoming" },
  { date: "2026-06-16", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "upcoming" },
  { date: "2026-06-17", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "upcoming" },
  { date: "2026-06-22", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "upcoming" },
  { date: "2026-06-23", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "upcoming" },
  { date: "2026-06-24", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "upcoming" },
  { date: "2026-06-29", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "upcoming" },
  { date: "2026-06-30", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "upcoming" },
  { date: "2026-07-01", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "upcoming" },
  { date: "2026-07-06", code: "CS301", name: "Database Systems", color: "#F59E0B", time: "10:00 AM", room: "LT4", status: "upcoming" },
  { date: "2026-07-07", code: "CS401", name: "Algorithms", color: "#3B82F6", time: "2:00 PM", room: "LT2", status: "upcoming" },
  { date: "2026-07-08", code: "CS201", name: "Data Structures", color: "#8B5CF6", time: "10:00 AM", room: "LT1", status: "upcoming" },
];

export const ATTENDANCE_TIMELINE = [
  { week: "W1", date: "Apr 9", attended: 1, total: 1, percentage: 100 },
  { week: "W2", date: "Apr 16", attended: 2, total: 2, percentage: 100 },
  { week: "W3", date: "Apr 23", attended: 3, total: 3, percentage: 100 },
  { week: "W4", date: "Apr 30", attended: 3, total: 4, percentage: 75 },
  { week: "W5", date: "May 7", attended: 4, total: 5, percentage: 80 },
  { week: "W6", date: "May 14", attended: 5, total: 6, percentage: 83 },
  { week: "W7", date: "May 21", attended: 5, total: 7, percentage: 71 },
  { week: "W8", date: "May 28", attended: 6, total: 8, percentage: 75 },
  { week: "W9", date: "Jun 4", attended: 7, total: 9, percentage: 78 },
];