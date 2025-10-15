import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  createdAt: string;
  todos?: Todo[];
  projectMemberships?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user?: User;
  project?: Project;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  todos?: Todo[];
  members?: ProjectMember[];
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  assigneeId?: string;
  projectId?: string;
  assignee?: User;
  project?: Project;
  tags: Tag[];
  metadata?: TodoMetadata;
  comments?: Comment[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface TodoMetadata {
  id: string;
  viewCount: number;
  lastViewedAt?: string;
  estimatedTime?: number;
  actualTime?: number;
  notes?: string;
}

export interface CreateTodoDto {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  tags?: string[];
  projectId?: string;
  assignedToId?: string;
}

export interface UpdateTodoDto {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
  startDate?: string;
  endDate?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  todoId: string;
  author?: User;
}

// API Methods
export const todoApi = {
  // Get all todos
  getTodos: async (filters?: { completed?: boolean; priority?: string; inefficient?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.completed !== undefined) params.append('completed', String(filters.completed));
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.inefficient) params.append('inefficient', 'true');
    
    const response = await api.get<{ todos: Todo[]; count: number }>(`/todos?${params}`);
    return response.data;
  },

  // Search todos
  searchTodos: async (query: string) => {
    const response = await api.get<{ todos: Todo[]; count: number }>(`/todos/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get single todo
  getTodo: async (id: string) => {
    const response = await api.get<Todo>(`/todos/${id}`);
    return response.data;
  },

  // Create todo
  createTodo: async (data: CreateTodoDto) => {
    const response = await api.post<Todo>('/todos', data);
    return response.data;
  },

  // Update todo
  updateTodo: async (id: string, data: UpdateTodoDto, skipCache?: boolean) => {
    const url = skipCache ? `/todos/${id}?skipCache=true` : `/todos/${id}`;
    const response = await api.put<Todo>(url, data);
    return response.data;
  },

  // Delete todo
  deleteTodo: async (id: string) => {
    await api.delete(`/todos/${id}`);
  },

  // Toggle todo completion
  toggleTodo: async (id: string) => {
    const response = await api.post<Todo>(`/todos/${id}/toggle`);
    return response.data;
  },
};

// Chaos API Methods
export const chaosApi = {
  // Get chaos status
  getStatus: async () => {
    const response = await api.get('/chaos/status');
    return response.data;
  },

  // Seed test data
  seedData: async (count: number = 100) => {
    const response = await api.post('/chaos/seed-data', { count });
    return response.data;
  },

  // Trigger memory leak
  triggerMemoryLeak: async () => {
    const response = await api.post('/chaos/memory-leak/trigger');
    return response.data;
  },

  // Enable memory leak
  enableMemoryLeak: async () => {
    const response = await api.post('/chaos/memory-leak/enable');
    return response.data;
  },

  // Disable memory leak
  disableMemoryLeak: async () => {
    const response = await api.post('/chaos/memory-leak/disable');
    return response.data;
  },

  // Exhaust connection pool
  exhaustPool: async () => {
    const response = await api.post('/chaos/exhaust-pool');
    return response.data;
  },

  // Trigger unhandled promise
  triggerUnhandledPromise: async () => {
    const response = await api.post('/chaos/unhandled-promise');
    return response.data;
  },

  // Trigger CPU spike
  triggerCpuSpike: async (duration: number = 30000) => {
    const response = await api.post(`/chaos/cpu-spike?duration=${duration}`);
    return response.data;
  },

  // Trigger DB timeout
  triggerDbTimeout: async (duration: number = 60000) => {
    const response = await api.post(`/chaos/db-timeout?duration=${duration}`);
    return response.data;
  },

  // Enable all chaos scenarios
  enableAll: async () => {
    const response = await api.post('/chaos/enable-all');
    return response.data;
  },

  // Disable all chaos scenarios
  disableAll: async () => {
    const response = await api.post('/chaos/disable-all');
    return response.data;
  },

  // Reset environment
  reset: async () => {
    const response = await api.post('/chaos/reset');
    return response.data;
  },
};

// User API Methods
export const userApi = {
  getUsers: async (filters?: { role?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get<{ users: User[]; count: number }>(`/users?${params}`);
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  getUserStats: async (id: string) => {
    const response = await api.get(`/users/${id}/stats`);
    return response.data;
  },
};

// Project API Methods
export const projectApi = {
  getProjects: async (filters?: { status?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get<{ projects: Project[]; count: number }>(`/projects?${params}`);
    return response.data;
  },

  getProject: async (id: string) => {
    const response = await api.get<Project>(`/projects/${id}`);
    return response.data;
  },

  getProjectStats: async (id: string) => {
    const response = await api.get(`/projects/${id}/stats`);
    return response.data;
  },

  createProject: async (data: CreateProjectDto) => {
    const response = await api.post<Project>('/projects', data);
    return response.data;
  },

  updateProject: async (id: string, data: UpdateProjectDto) => {
    const response = await api.put<Project>(`/projects/${id}`, data);
    return response.data;
  },
};

// Health check API
export const healthApi = {
  // Basic health check
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Detailed health check
  detailed: async () => {
    const response = await api.get('/health/detailed');
    return response.data;
  },

  // Memory usage
  memory: async () => {
    const response = await api.get('/health/memory');
    return response.data;
  },

  // CPU usage
  cpu: async () => {
    const response = await api.get('/health/cpu');
    return response.data;
  },
};
