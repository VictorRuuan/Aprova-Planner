import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Home,
  LogOut,
  Timer,
} from "lucide-react";

import { supabase } from "../../services/supabase";

const menuItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: Home,
  },
  {
    label: "Concursos",
    path: "/exams",
    icon: GraduationCap,
  },
  {
    label: "Materias",
    path: "/subjects",
    icon: BookOpen,
  },
  {
    label: "Cronograma",
    path: "/schedule",
    icon: CalendarDays,
  },
  {
    label: "Registrar estudo",
    path: "/study-session",
    icon: Timer,
  },
  {
    label: "Relatorios",
    path: "/reports",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 md:flex">
      <div>
        <div className="mb-8 rounded-xl bg-white p-2">
          <img
            src="/aprova-planner-logo.png"
            alt="Aprova Planner"
            className="h-auto w-full"
          />
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                  ].join(" ")
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        <LogOut size={18} />
        Sair
      </button>
    </aside>
  );
}
