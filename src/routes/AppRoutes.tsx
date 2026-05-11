import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { Dashboard } from "../pages/Dashboard";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Exams } from "../pages/Exams";
import { Subjects } from "../pages/Subjects";
import { Schedule } from "../pages/Schedule";
import { StudySession } from "../pages/StudySession";
import { Reports } from "../pages/Reports";
import { Profile } from "../pages/Profile";

import { SupabaseTest } from "../pages/SupabaseTest";
import { ProtectedRoute } from "./ProtectedRoute";

function protectedPage(element: React.ReactNode) {
  return <ProtectedRoute>{element}</ProtectedRoute>;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
        <Route path="/exams" element={protectedPage(<Exams />)} />
        <Route path="/subjects" element={protectedPage(<Subjects />)} />
        <Route path="/schedule" element={protectedPage(<Schedule />)} />
        <Route path="/study-session" element={protectedPage(<StudySession />)} />
        <Route path="/reports" element={protectedPage(<Reports />)} />
        <Route path="/profile" element={protectedPage(<Profile />)} />

        <Route path="/supabase-test" element={protectedPage(<SupabaseTest />)} />
      </Routes>
    </BrowserRouter>
  );
}
