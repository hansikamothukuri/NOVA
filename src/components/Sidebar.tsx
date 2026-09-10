import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  UserCheck,
  PlusCircle,
  Database,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from './Button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateProject?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenCreateProject }) => {
  const navigate = useNavigate();

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/projects',
      label: 'Projects',
      icon: FolderKanban,
    },
    {
      to: '/meetings',
      label: 'Schedule Meetings',
      icon: Calendar,
    },
    {
      to: '/profile',
      label: 'My Profile',
      icon: UserCheck,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-slate-900/95 border-r border-slate-800/80 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Quick Create Button */}
          {onOpenCreateProject && (
            <Button
              variant="primary"
              size="md"
              fullWidth
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={() => {
                onOpenCreateProject();
                onClose();
              }}
              className="shadow-md shadow-orange-950/60"
            >
              New Project
            </Button>
          )}

          {/* Nav Links */}
          <nav className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Workspace
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Database & Architecture Badge */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 text-xs">
          <div className="flex items-center justify-between text-slate-300 font-semibold mb-1">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-orange-400" />
              MySQL Engine
            </span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ready
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Relational tables: users, projects, tasks, members, meetings.
          </p>
        </div>
      </aside>
    </>
  );
};
