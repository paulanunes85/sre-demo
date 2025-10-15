import { useQuery } from '@tanstack/react-query';
import { todoApi, projectApi, userApi } from '../api/client';
import { 
  CheckSquare, 
  FolderKanban, 
  Users, 
  TrendingUp, 
  AlertCircle,
  Clock,
  Target,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: todosData } = useQuery({
    queryKey: ['todos'],
    queryFn: () => todoApi.getTodos(),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.getProjects(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers(),
  });

  const todos = todosData?.todos || [];
  const projects = projectsData?.projects || [];
  const users = usersData?.users || [];

  const completedTodos = todos.filter(t => t.completed).length;
  const completionRate = todos.length > 0 ? (completedTodos / todos.length) * 100 : 0;
  const urgentTodos = todos.filter(t => t.priority === 'URGENT' && !t.completed).length;
  const activeProjects = projects.filter(p => p.status === 'ACTIVE').length;

  const priorityBreakdown = {
    URGENT: todos.filter(t => t.priority === 'URGENT' && !t.completed).length,
    HIGH: todos.filter(t => t.priority === 'HIGH' && !t.completed).length,
    MEDIUM: todos.filter(t => t.priority === 'MEDIUM' && !t.completed).length,
    LOW: todos.filter(t => t.priority === 'LOW' && !t.completed).length,
  };

  const stats = [
    {
      name: 'Total Tasks',
      value: todos.length,
      icon: CheckSquare,
      color: 'bg-blue-500',
      link: '/todos',
    },
    {
      name: 'Active Projects',
      value: activeProjects,
      icon: FolderKanban,
      color: 'bg-green-500',
      link: '/projects',
    },
    {
      name: 'Team Members',
      value: users.length,
      icon: Users,
      color: 'bg-purple-500',
      link: '/users',
    },
    {
      name: 'Completion Rate',
      value: `${Math.round(completionRate)}%`,
      icon: TrendingUp,
      color: 'bg-yellow-500',
      link: '/todos',
    },
  ];

  const recentTodos = todos
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome back! Here's what's happening with your tasks.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.name}
              to={stat.link}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all hover:transform hover:scale-105"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium">{stat.name}</p>
                  <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority Breakdown */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Priority Breakdown</h2>
            <Target className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {urgentTodos > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-medium">Urgent Tasks</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">{urgentTodos}</span>
                </div>
                <p className="text-red-300/70 text-sm mt-2">Requires immediate attention</p>
              </div>
            )}

            {Object.entries(priorityBreakdown).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    priority === 'URGENT' ? 'bg-red-500' :
                    priority === 'HIGH' ? 'bg-orange-500' :
                    priority === 'MEDIUM' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <span className="text-gray-300 font-medium">{priority}</span>
                </div>
                <span className="text-xl font-bold text-white">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Tasks</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {recentTodos.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent tasks</p>
              </div>
            ) : (
              recentTodos.map((todo) => (
                <Link
                  key={todo.id}
                  to="/todos"
                  className="block bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(todo.priority)}`}>
                          {todo.priority}
                        </span>
                        {todo.completed && (
                          <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                            Completed
                          </span>
                        )}
                      </div>
                      <h3 className={`font-medium mb-1 ${todo.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="text-sm text-gray-400 line-clamp-1">{todo.description}</p>
                      )}
                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                        {todo.assignee && (
                          <span className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{todo.assignee.name}</span>
                          </span>
                        )}
                        {todo.project && (
                          <span className="flex items-center space-x-1">
                            <FolderKanban className="w-3 h-3" />
                            <span>{todo.project.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {recentTodos.length > 0 && (
            <Link
              to="/todos"
              className="block text-center mt-4 text-blue-400 hover:text-blue-300 font-medium text-sm"
            >
              View all tasks →
            </Link>
          )}
        </div>
      </div>

      {/* Active Projects */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Active Projects</h2>
          <Link to="/projects" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.filter(p => p.status === 'ACTIVE').slice(0, 4).map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-all"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-opacity-20">
                  {project.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white mb-1 truncate">{project.name}</h3>
                  <p className="text-xs text-gray-400">Active project</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
