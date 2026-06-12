import { createFileRoute } from "@tanstack/react-router";
import LecturerModule from "@/components/LecturerModule";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KNUST Smart Attendance — Lecturer Portal" },
      { name: "description", content: "Manage courses and run live QR & face-recognition attendance sessions as a university lecturer." },
      { property: "og:title", content: "KNUST Smart Attendance — Lecturer Portal" },
      { property: "og:description", content: "Manage courses and run live QR & face-recognition attendance sessions as a university lecturer." },
    ],
  }),
  component: LecturerModule,
});
