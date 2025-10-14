import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { todoApi, type Todo, type CreateTodoDto } from './api/client';
import { Plus, Trash2, Check, X, AlertCircle, Loader2 } from 'lucide-react';

function App() {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch todos
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos', filter],
    queryFn: () => {
      const filters = filter === 'all' ? {} : { completed: filter === 'completed' };
      return todoApi.getTodos(filters);
    },
  });

  // Create todo mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTodoDto) => todoApi.createTodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo created successfully!');
      setShowCreateForm(false);
    },
    onError: () => {
      toast.error('Failed to create todo');
    },
  });

  // Toggle todo mutation
  const toggleMutation = useMutation({
    mutationFn: (id: string) => todoApi.toggleTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
    onError: () => {
      toast.error('Failed to toggle todo');
    },
  });

  // Delete todo mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => todoApi.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      toast.success('Todo deleted!');
    },
    onError: () => {
      toast.error('Failed to delete todo');
    },
  });

  const handleCreateTodo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priority = formData.get('priority') as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

    createMutation.mutate({
      title,
      description: description || undefined,
      priority,
      completed: false,
    });

    e.currentTarget.reset();
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'text-blue-400 bg-blue-950/50',
      MEDIUM: 'text-yellow-400 bg-yellow-950/50',
      HIGH: 'text-orange-400 bg-orange-950/50',
      URGENT: 'text-red-400 bg-red-950/50',
    };
    return colors[priority as keyof typeof colors] || colors.MEDIUM;
  };

  const filteredTodos = data?.todos || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                📝 SRE Demo - Todo App
              </h1>
              <p className="text-gray-400">
                Full-stack demo with intentional bugs for Azure SRE Agent
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="https://github.com/your-org/sre-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              All ({data?.count || 0})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Completed
            </button>
          </div>

          {/* Create Todo Button */}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Todo
          </button>
        </header>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter todo title..."
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter description..."
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Todo'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-400 font-medium">Failed to load todos</p>
                <p className="text-red-300 text-sm">{(error as Error).message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Todos List */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {filteredTodos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-lg">No todos found</p>
                <p className="text-sm">Create your first todo to get started!</p>
              </div>
            ) : (
              filteredTodos.map((todo: Todo) => (
                <div
                  key={todo.id}
                  className={`bg-gray-800 border rounded-lg p-4 transition-all hover:border-gray-600 ${
                    todo.completed ? 'border-gray-700 opacity-75' : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Toggle Button */}
                    <button
                      onClick={() => toggleMutation.mutate(todo.id)}
                      disabled={toggleMutation.isPending}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        todo.completed
                          ? 'bg-green-600 border-green-600'
                          : 'border-gray-500 hover:border-green-500'
                      }`}
                    >
                      {todo.completed && <Check className="w-4 h-4 text-white" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`text-lg font-medium mb-1 ${
                              todo.completed
                                ? 'text-gray-500 line-through'
                                : 'text-white'
                            }`}
                          >
                            {todo.title}
                          </h3>
                          {todo.description && (
                            <p className="text-gray-400 text-sm mb-2">
                              {todo.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs px-2 py-1 rounded ${getPriorityColor(
                                todo.priority
                              )}`}
                            >
                              {todo.priority}
                            </span>
                            {todo.tags?.map((tag) => (
                              <span
                                key={tag.id}
                                className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300"
                                style={{ backgroundColor: tag.color + '20', color: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this todo?')) {
                              deleteMutation.mutate(todo.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-700 text-center text-gray-500 text-sm">
          <p>
            Built for Azure SRE Agent demonstrations • Contains intentional bugs
          </p>
          <p className="mt-2">
            Check{' '}
            <a
              href="/docs/CHAOS_SCENARIOS.md"
              className="text-primary-400 hover:text-primary-300"
            >
              CHAOS_SCENARIOS.md
            </a>{' '}
            for demo instructions
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
