import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { BarChart3, BookOpen, CalendarDays, Home, LogOut, User } from "lucide-react";

import { ThemeToggle } from "../theme/ThemeToggle";
import { Sidebar } from "./Sidebar";
import { supabase } from "../../services/supabase";

type AppLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AppLayout({ title, description, children }: AppLayoutProps) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:flex">
      <Sidebar />

      <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-6">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sair"
              title="Sair"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-slate-200 bg-white px-2 py-2 dark:border-slate-800 dark:bg-slate-900 md:hidden">
        {[
          { label: "Inicio", path: "/dashboard", icon: Home },
          { label: "Materias", path: "/subjects", icon: BookOpen },
          { label: "Agenda", path: "/schedule", icon: CalendarDays },
          { label: "Relatorios", path: "/reports", icon: BarChart3 },
          { label: "Perfil", path: "/profile", icon: User },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-slate-500 dark:text-slate-400",
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
  );
}
