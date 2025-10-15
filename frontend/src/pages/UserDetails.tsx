import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/client';
import { 
  ArrowLeft, 
  Mail, 
  Shield, 
  Briefcase,
  User as UserIcon,
  CheckSquare,
  TrendingUp,
  FolderKanban,
  Calendar
} from 'lucide-react';
import clsx from 'clsx';

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getUser(id!),
    enabled: !!id,
  });

  const { data: statsData } = useQuery({
    queryKey: ['userStats', id],
    queryFn: () => userApi.getUserStats(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Loading user profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <UserIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-300 mb-2">User not found</h3>
        <Link to="/users" className="text-blue-400 hover:text-blue-300">
          ← Back to team
        </Link>
      </div>
    );
  }

  const stats = statsData || { totalTodos: 0, completedTodos: 0, urgentTodos: 0, completionRate: 0 };

  const getRoleIcon = (role: string) => {
    if (role === 'ADMIN') return Shield;
    if (role === 'MANAGER') return Briefcase;
    return UserIcon;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
      MANAGER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      MEMBER: 'bg-green-500/10 text-green-400 border-green-500/20',
    };
    return colors[role as keyof typeof colors] || colors.MEMBER;
  };

  const RoleIcon = getRoleIcon(user.role);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        to="/users"
        className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to team</span>
      </Link>

      {/* User Profile Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
            <div className="flex flex-col space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-gray-400">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div>
                <span className={clsx(
                  'inline-flex items-center space-x-2 text-sm px-3 py-1 rounded border font-medium',
                  getRoleColor(user.role)
                )}>
                  <RoleIcon className="w-4 h-4" />
                  <span>{user.role}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-700">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Tasks</p>
            <p className="text-3xl font-bold text-white">{stats.totalTodos}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-400">{stats.completedTodos}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Completion Rate</p>
            <p className="text-3xl font-bold text-blue-400">{Math.round(stats.completionRate)}%</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Urgent Tasks</p>
            <p className="text-3xl font-bold text-red-400">{stats.urgentTodos}</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Tasks</h2>
            <CheckSquare className="w-5 h-5 text-gray-400" />
          </div>

          {user.todos && user.todos.length > 0 ? (
            <div className="space-y-3">
              {user.todos.slice(0, 5).map((todo: any) => (
                <div
                  key={todo.id}
                  className={clsx(
                    'bg-gray-900/50 border rounded-lg p-4',
                    todo.completed ? 'border-gray-700 opacity-75' : 'border-gray-700'
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-1">
                      <CheckSquare className={clsx(
                        'w-5 h-5',
                        todo.completed ? 'text-green-400' : 'text-gray-400'
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={clsx(
                        'font-medium mb-1',
                        todo.completed ? 'text-gray-500 line-through' : 'text-white'
                      )}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="text-sm text-gray-400 line-clamp-1 mb-2">{todo.description}</p>
                      )}
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className={clsx(
                          'px-2 py-1 rounded border',
                          todo.priority === 'URGENT' && 'bg-red-500/10 text-red-400 border-red-500/20',
                          todo.priority === 'HIGH' && 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                          todo.priority === 'MEDIUM' && 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                          todo.priority === 'LOW' && 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        )}>
                          {todo.priority}
                        </span>
                        {todo.project && (
                          <span className="flex items-center space-x-1">
                            <FolderKanban className="w-3 h-3" />
                            <span>{todo.project.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tasks assigned yet</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Performance</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {/* Completion Rate Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Task Completion</span>
                  <span className="text-sm font-semibold text-white">{Math.round(stats.completionRate)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={clsx(
                      'bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all',
                      stats.completionRate > 0 && 'w-0'
                    )}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Active Tasks</span>
                  <span className="text-lg font-bold text-white">{stats.totalTodos - stats.completedTodos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Completed Tasks</span>
                  <span className="text-lg font-bold text-green-400">{stats.completedTodos}</span>
                </div>
                {stats.urgentTodos > 0 && (
                  <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                    <span className="text-sm text-red-400">Urgent Tasks</span>
                    <span className="text-lg font-bold text-red-400">{stats.urgentTodos}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Projects */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Projects</h3>
              <FolderKanban className="w-5 h-5 text-gray-400" />
            </div>

            {user.projectMemberships && user.projectMemberships.length > 0 ? (
              <div className="space-y-3">
                {user.projectMemberships.map((membership: any) => (
                  <Link
                    key={membership.id}
                    to={`/projects/${membership.projectId}`}
                    className="block bg-gray-900/50 border border-gray-700 rounded-lg p-3 hover:border-gray-600 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-xl flex-shrink-0">
                        {membership.project?.icon || '📁'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">{membership.project?.name}</h4>
                        <p className="text-xs text-gray-400">{membership.role}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No project memberships</p>
            )}
          </div>

          {/* Account Info */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Account Info</h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 mb-1">Member Since</p>
                <p className="text-white">{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-gray-400 mb-1">User ID</p>
                <p className="text-white font-mono text-xs">{user.id}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
