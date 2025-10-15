import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { todoApi } from '../api/client';
import { 
  Search, 
  Filter, 
  Plus,
  CheckSquare,
  Square,
  Calendar,
  Users,
  FolderKanban,
  AlertCircle
} from 'lucide-react';
import clsx from 'clsx';

export default function TodosPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const { data: todosData, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: () => todoApi.getTodos(),
  });

  const todos = todosData?.todos || [];

  // Apply filters
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      todo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'active' ? !todo.completed :
      todo.completed;
    
    const matchesPriority = filterPriority === 'all' ? true : todo.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
    urgent: todos.filter(t => t.priority === 'URGENT' && !t.completed).length,
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tasks</h1>
          <p className="text-gray-400">Manage and track all your tasks</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Plus className="w-5 h-5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Tasks</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Active</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.active}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.completed}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Urgent</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.urgent}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by priority"
          >
            <option value="all">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading tasks...</p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl">
            <CheckSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No tasks found</h3>
            <p className="text-gray-400">
              {searchQuery || filterStatus !== 'all' || filterPriority !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first task to get started'}
            </p>
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <div
              key={todo.id}
              className={clsx(
                'bg-gray-800/50 backdrop-blur-sm border rounded-xl p-6 transition-all hover:border-gray-600',
                todo.completed ? 'border-gray-700 opacity-75' : 'border-gray-700'
              )}
            >
              <div className="flex items-start space-x-4">
                {/* Checkbox */}
                <button className="mt-1 flex-shrink-0">
                  {todo.completed ? (
                    <CheckSquare className="w-6 h-6 text-green-400" />
                  ) : (
                    <Square className="w-6 h-6 text-gray-400 hover:text-blue-400 transition-colors" />
                  )}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className={clsx(
                        'text-lg font-semibold mb-2',
                        todo.completed ? 'text-gray-500 line-through' : 'text-white'
                      )}>
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className="text-gray-400 text-sm line-clamp-2">{todo.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <span className={`text-xs px-3 py-1 rounded border font-medium ${getPriorityColor(todo.priority)}`}>
                        {todo.priority}
                      </span>
                      {todo.priority === 'URGENT' && !todo.completed && (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    {todo.assignee && (
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4" />
                        <span>Assigned to {todo.assignee.name}</span>
                      </div>
                    )}
                    {todo.project && (
                      <div className="flex items-center space-x-2">
                        <FolderKanban className="w-4 h-4" />
                        <span>{todo.project.name}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created {formatDate(todo.createdAt)}</span>
                    </div>
                    {todo.dueDate && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span className={new Date(todo.dueDate) < new Date() && !todo.completed ? 'text-red-400' : ''}>
                          Due {formatDate(todo.dueDate)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {todo.tags && todo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {todo.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
