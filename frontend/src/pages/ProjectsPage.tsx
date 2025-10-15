import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../api/client';
import { Link } from 'react-router-dom';
import { FolderKanban, Users, CheckSquare, Plus } from 'lucide-react';
import clsx from 'clsx';

export default function ProjectsPage() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
  });

  const projects = projectsData?.projects || [];

  const getStatusColor = (status: string) => {
    const colors = {
      PLANNING: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
      ON_HOLD: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      COMPLETED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      ARCHIVED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colors[status as keyof typeof colors] || colors.ACTIVE;
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ');
  };

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'ACTIVE').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
    planning: projects.filter(p => p.status === 'PLANNING').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Projects</h1>
          <p className="text-gray-400">Manage and track all your projects</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Projects</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Active</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.active}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Completed</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Planning</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.planning}</p>
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl">
          <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No projects yet</h3>
          <p className="text-gray-400 mb-6">Create your first project to get started</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors">
            <Plus className="w-5 h-5" />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all hover:transform hover:scale-105"
            >
              {/* Project Header */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl flex-shrink-0">
                  {project.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-1 truncate group-hover:text-blue-400 transition-colors">
                    {project.name}
                  </h3>
                  <span className={clsx(
                    'text-xs px-2 py-1 rounded border font-medium',
                    getStatusColor(project.status)
                  )}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {project.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <CheckSquare className="w-4 h-4" />
                  <span>0 tasks</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Users className="w-4 h-4" />
                  <span>0 members</span>
                </div>
              </div>


            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
