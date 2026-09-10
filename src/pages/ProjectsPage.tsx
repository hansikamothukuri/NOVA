import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  FolderKanban,
  Search,
  Plus,
  Filter,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { projectService, ProjectQueryParams } from '../services/projectService';
import { Project, ProjectStatus } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { Button } from '../components/Button';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';

export const ProjectsPage: React.FC = () => {
  const { openCreateProject } = useOutletContext<{ openCreateProject: () => void }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatusParam = searchParams.get('status') || 'all';

  const [projects, setProjects] = useState<Project[]>([]);
  const [allProjectsCache, setAllProjectsCache] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusParam);
  const [sortBy, setSortBy] = useState<'due_date' | 'name' | 'created_at'>('created_at');

  // Sync state if URL query param changes
  useEffect(() => {
    const param = searchParams.get('status');
    if (param && param !== statusFilter) {
      setStatusFilter(param);
    }
  }, [searchParams]);

  const fetchProjects = useCallback(async (currentStatus = statusFilter, currentSearch = search, currentSort = sortBy) => {
    setLoading(true);
    setError(null);
    try {
      const params: ProjectQueryParams = {
        search: currentSearch.trim() || undefined,
        status: currentStatus !== 'all' ? currentStatus : undefined,
        sort: currentSort,
      };
      const data = await projectService.getProjects(params);
      setProjects(data);

      // Keep cache for calculating accurate status counts when fetching without filters
      if (currentStatus === 'all' && !currentSearch.trim()) {
        setAllProjectsCache(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, sortBy]);

  // Load all projects initially to populate tab counters
  useEffect(() => {
    projectService.getProjects({ sort: 'created_at' })
      .then((data) => setAllProjectsCache(data))
      .catch(() => {});
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchProjects(statusFilter, search, sortBy);
    }, 250);

    return () => clearTimeout(handler);
  }, [search, statusFilter, sortBy, fetchProjects]);

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    if (newStatus === 'all') {
      searchParams.delete('status');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ ...Object.fromEntries(searchParams.entries()), status: newStatus });
    }
    // Instantly trigger fetch for the selected status
    fetchProjects(newStatus, search, sortBy);
  };

  const statuses: { label: string; value: string }[] = [
    { label: 'All Projects', value: 'all' },
    { label: 'Planning', value: 'Planning' },
    { label: 'Active', value: 'Active' },
    { label: 'On Hold', value: 'On Hold' },
    { label: 'Completed', value: 'Completed' },
  ];

  // Calculate status counts from cache (or current projects if cache is empty)
  const countSource = allProjectsCache.length > 0 ? allProjectsCache : projects;
  const getStatusCount = (statusVal: string) => {
    if (statusVal === 'all') return countSource.length;
    const norm = statusVal.toLowerCase().replace(/[\s-_]/g, '');
    return countSource.filter((p) => (p.status || '').toLowerCase().replace(/[\s-_]/g, '') === norm).length;
  };

  // Client-side fallback to guarantee no unfiltered projects are ever shown
  const displayedProjects = useMemo(() => {
    if (statusFilter === 'all') return projects;
    const normFilter = statusFilter.toLowerCase().replace(/[\s-_]/g, '');
    return projects.filter((project) => {
      const normStatus = (project.status || '').toLowerCase().replace(/[\s-_]/g, '');
      return normStatus === normFilter;
    });
  }, [projects, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 flex items-center gap-2.5">
            <FolderKanban className="w-7 h-7 text-orange-500" />
            Projects
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your collaborative roadmaps, track team milestones, and monitor deliverables.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={openCreateProject}
        >
          Create Project
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="flex-1 w-full">
            <Input
              placeholder="Search projects by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Sort By */}
          <div className="w-full md:w-56 shrink-0">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={[
                { value: 'created_at', label: 'Sort by: Created Date' },
                { value: 'due_date', label: 'Sort by: Due Date' },
                { value: 'name', label: 'Sort by: Name (A-Z)' },
              ]}
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 pt-1 border-t border-slate-800/80">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          {statuses.map((item) => {
            const count = getStatusCount(item.value);
            const isSelected =
              statusFilter.toLowerCase().replace(/[\s-_]/g, '') ===
              item.value.toLowerCase().replace(/[\s-_]/g, '');

            return (
              <button
                key={item.value}
                onClick={() => handleStatusChange(item.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-400/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-orange-800/80 text-orange-200' : 'bg-slate-700/80 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Content */}
      {loading && projects.length === 0 ? (
        <LoadingSpinner message="Fetching projects from database..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => fetchProjects(statusFilter, search, sortBy)} />
      ) : displayedProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects found"
          description={
            search || statusFilter !== 'all'
              ? `No projects found with status "${statusFilter}". Try selecting "All Projects" or adjusting your search.`
              : 'You have not joined or created any projects yet. Get started by creating one now.'
          }
          actionText={statusFilter !== 'all' ? 'Show All Projects' : 'Create New Project'}
          onAction={statusFilter !== 'all' ? () => handleStatusChange('all') : openCreateProject}
        />
      )}
    </div>
  );
};
