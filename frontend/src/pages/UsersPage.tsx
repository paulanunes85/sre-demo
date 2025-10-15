import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/client';
import { Link } from 'react-router-dom';
import { Users, Search, Shield, Briefcase, User as UserIcon } from 'lucide-react';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getUsers(),
  });

  const users = usersData?.users || [];

  // Apply filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' ? true : user.role === filterRole;

    return matchesSearch && matchesRole;
  });

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

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    managers: users.filter(u => u.role === 'MANAGER').length,
    members: users.filter(u => u.role === 'MEMBER').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Team Members</h1>
          <p className="text-gray-400">Manage your team and view member details</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total Members</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Admins</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{stats.admins}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Managers</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{stats.managers}</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
          <p className="text-gray-400 text-sm">Members</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{stats.members}</p>
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
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by role"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="MANAGER">Manager</option>
            <option value="MEMBER">Member</option>
          </select>
        </div>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading team members...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No team members found</h3>
          <p className="text-gray-400">
            {searchQuery || filterRole !== 'all'
              ? 'Try adjusting your filters'
              : 'No team members available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const RoleIcon = getRoleIcon(user.role);
            return (
              <Link
                key={user.id}
                to={`/users/${user.id}`}
                className="group bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-all hover:transform hover:scale-105"
              >
                {/* User Header */}
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white mb-1 truncate group-hover:text-blue-400 transition-colors">
                      {user.name}
                    </h3>
                    <p className="text-sm text-gray-400 truncate mb-2">{user.email}</p>
                    <span className={`text-xs px-2 py-1 rounded border font-medium inline-flex items-center space-x-1 ${getRoleColor(user.role)}`}>
                      <RoleIcon className="w-3 h-3" />
                      <span>{user.role}</span>
                    </span>
                  </div>
                </div>

                {/* User Stats */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">0</p>
                      <p className="text-xs text-gray-400 mt-1">Tasks</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-400">0%</p>
                      <p className="text-xs text-gray-400 mt-1">Completed</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
