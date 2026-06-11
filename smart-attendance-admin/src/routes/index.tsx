import { createFileRoute } from "@tanstack/react-router";
import AdminApp from "@/components/AdminApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KNUST · Admin Panel" },
      { name: "description", content: "Smart Attendance System — administrative console for managing departments, programmes, courses, lecturers and students." },
    ],
  }),
  component: AdminApp,
});
