import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../api/client';
import { 
  ArrowLeft, 
  Users, 
  CheckSquare, 
  Square,
  Calendar,
  TrendingUp,
  FolderKanban
} from 'lucide-react';
import clsx from 'clsx';

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getProject(id!),
    enabled: !!id,
  });

  const { data: statsData } = useQuery({
    queryKey: ['projectStats', id],
    queryFn: () => projectApi.getProjectStats(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <FolderKanban className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Project not found</h3>
        <Link to="/projects" className="text-blue-400 hover:text-blue-300">
          ← Back to projects
        </Link>
      </div>
    );
  }

  const stats = statsData || { totalTodos: 0, completedTodos: 0, completionRate: 0, priorityBreakdown: {} };
  const todos = project.todos || [];

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

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      URGENT: 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[priority as keyof typeof colors] || colors.MEDIUM;
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/projects"
        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to projects</span>
      </Link>

      {/* Project Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 rounded-xl bg-gray-700 flex items-center justify-center text-4xl flex-shrink-0">
            {project.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{project.name}</h1>
                <span className={clsx(
                  'text-sm px-3 py-1 rounded border font-medium',
                  getStatusColor(project.status)
                )}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            {project.description && (
              <p className="text-gray-400 text-lg">{project.description}</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Tasks</p>
            <p className="text-2xl font-bold text-white">{stats.totalTodos}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-400">{stats.completedTodos}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-400">{Math.round(stats.completionRate)}%</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Team Members</p>
            <p className="text-2xl font-bold text-purple-400">{project.members?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xl font-bold text-white mb-4">Tasks</h2>
          
          {todos.length === 0 ? (
            <div className="text-center py-12 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl">
              <CheckSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No tasks in this project yet</p>
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className={clsx(
                  'bg-gray-800/50 backdrop-blur-sm border rounded-xl p-5 transition-all',
                  todo.completed ? 'border-gray-700 opacity-75' : 'border-gray-700 hover:border-gray-600'
                )}
              >
                <div className="flex items-start space-x-3">
                  <button className="mt-1 flex-shrink-0">
                    {todo.completed ? (
                      <CheckSquare className="w-5 h-5 text-green-400" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className={clsx(
                        'font-semibold',
                        todo.completed ? 'text-gray-500 line-through' : 'text-white'
                      )}>
                        {todo.title}
                      </h3>
                      <span className={clsx(
                        'text-xs px-2 py-1 rounded border font-medium flex-shrink-0',
                        getPriorityColor(todo.priority)
                      )}>
                        {todo.priority}
                      </span>
                    </div>
                    {todo.description && (
                      <p className="text-gray-400 text-sm mb-2 line-clamp-2">{todo.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      {todo.assignee && (
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{todo.assignee.name}</span>
                        </span>
                      )}
                      {todo.dueDate && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Due {new Date(todo.dueDate).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Members */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Team</h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            {project.members && project.members.length > 0 ? (
              <div className="space-y-3">
                {project.members.map((member) => (
                  <Link
                    key={member.userId}
                    to={`/users/${member.userId}`}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
                      {member.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{member.user?.name}</p>
                      <p className="text-xs text-gray-400">{member.role}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No team members yet</p>
            )}
          </div>

          {/* Priority Breakdown */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Priority</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {Object.entries(stats.priorityBreakdown || {}).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={clsx(
                      'w-3 h-3 rounded-full',
                      priority === 'URGENT' && 'bg-red-500',
                      priority === 'HIGH' && 'bg-orange-500',
                      priority === 'MEDIUM' && 'bg-yellow-500',
                      priority === 'LOW' && 'bg-blue-500'
                    )} />
                    <span className="text-gray-300 text-sm">{priority}</span>
                  </div>
                  <span className="text-white font-semibold">{count as number}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Project Info */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Project Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Status</p>
                <span className={clsx(
                  'inline-block px-2 py-1 rounded border text-xs font-medium',
                  getStatusColor(project.status)
                )}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Created</p>
                <p className="text-white">{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">Last Updated</p>
                <p className="text-white">{new Date(project.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
