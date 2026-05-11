import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  GraduationCap,
  Home,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Timer,
  User,
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
  {
    label: "Perfil",
    path: "/profile",
    icon: User,
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <aside
      className={[
        "hidden min-h-screen flex-col border-r border-slate-200 bg-white px-4 py-6 transition-[width] duration-200 dark:border-slate-800 dark:bg-slate-900 md:flex",
        isCollapsed ? "w-24" : "w-64",
      ].join(" ")}
    >
      <div>
        <div
          className={[
            "mb-8 flex items-center gap-2",
            isCollapsed ? "justify-center" : "justify-between",
          ].join(" ")}
        >
          {!isCollapsed && (
            <div className="rounded-xl bg-white p-2">
              <img
                src="/aprova-planner-logo.png"
                alt="Aprova Planner"
                className="h-auto w-40"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed((value) => !value)}
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>
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
                    isCollapsed ? "justify-center" : "",
                    isActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                  ].join(" ")
                }
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {!isCollapsed && item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        title={isCollapsed ? "Sair" : undefined}
        className={[
          "mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
          isCollapsed ? "justify-center" : "",
        ].join(" ")}
      >
        <LogOut size={18} />
        {!isCollapsed && "Sair"}
      </button>
    </aside>
  );
}
