import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { CreateProjectModal } from '../components/CreateProjectModal';
import { Project } from '../types';

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const navigate = useNavigate();

  const handleProjectCreated = (newProject: Project) => {
    navigate(`/projects/${newProject.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500/30 selection:text-orange-200">
      <Navbar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex flex-1">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenCreateProject={() => setIsCreateProjectOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 lg:pl-64 min-w-0 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <Outlet context={{ openCreateProject: () => setIsCreateProjectOpen(true) }} />
          </div>
        </main>
      </div>

      {/* Global Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};
