import React, { useState } from 'react';
import { User, Lock, LogIn, Eye, EyeOff, Plus, UserPlus, Shield, X } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginFormProps {
  onLogin: (username: string, rights: string) => void;
  users: UserType[];
  onAddUser: (user: Omit<UserType, 'id' | 'createdAt'>) => void;
  onUpdateUser: (userId: string, updates: Partial<UserType>) => void;
  onDeleteUser?: (userId: string) => void;
  currentUser?: string | null;
  currentUserRights?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin, users, onAddUser, onUpdateUser, onDeleteUser, currentUser, currentUserRights }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedUserForPasswordChange, setSelectedUserForPasswordChange] = useState<UserType | null>(null);
  const [newUserData, setNewUserData] = useState({
    username: '',
    password: '',
    rights: 'Stage 1 rights' as UserType['rights']
  });
  const [passwordChangeData, setPasswordChangeData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [addUserErrors, setAddUserErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Check if current user can add new users
  const canAddUsers = () => {
    return currentUser && (
      currentUser.toLowerCase() === 'admin' || 
      currentUserRights === 'Top Level Rights'
    );
  };

  // Check if current user can delete users (Admin only)
  const canDeleteUsers = () => {
    return currentUser && currentUser.toLowerCase() === 'admin';
  };

  const handleDeleteUser = (userToDelete: UserType) => {
    if (!canDeleteUsers()) {
      alert('Access denied. Only Admin can delete users.');
      return;
    }

    if (userToDelete.username.toLowerCase() === 'admin') {
      alert('Cannot delete the Admin user.');
      return;
    }

    const confirmed = window.confirm(`Are you sure you want to delete user "${userToDelete.username}"? This action cannot be undone.`);
    if (confirmed && onDeleteUser) {
      onDeleteUser(userToDelete.id);
      alert('User deleted successfully!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if users array is empty or doesn't have admin, create default admin
    if (users.length === 0 || !users.find(u => u.username.toLowerCase() === 'admin')) {
      const defaultAdmin = {
        id: '1',
        username: 'admin',
        password: 'admin123',
        rights: 'Top Level Rights' as UserType['rights'],
        createdAt: new Date().toISOString()
      };
      onAddUser(defaultAdmin);
    }

    // Find user with case-insensitive username but exact password match
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase() && 
      u.password === password
    ) || (username.toLowerCase() === 'admin' && password === 'admin123' ? {
      id: '1',
      username: 'admin',
      password: 'admin123',
      rights: 'Top Level Rights' as UserType['rights'],
      createdAt: new Date().toISOString()
    } : null);

    if (user) {
      onLogin(user.username, user.rights);
    } else {
      setError('Invalid username or password');
    }

    setIsLoading(false);
  };

  const validateAddUser = () => {
    const errors: Record<string, string> = {};
    
    if (!newUserData.username.trim()) {
      errors.username = 'Username is required';
    } else if (users.some(u => u.username.toLowerCase() === newUserData.username.toLowerCase())) {
      errors.username = 'Username already exists';
    }
    
    if (!newUserData.password.trim()) {
      errors.password = 'Password is required';
    } else if (newUserData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    setAddUserErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Double-check permissions
    if (!canAddUsers()) {
      alert('Access denied. Only Admin or users with Top Level Rights can add new users.');
      return;
    }
    
    if (!validateAddUser()) return;
    
    onAddUser({
      username: newUserData.username.trim(),
      password: newUserData.password,
      rights: newUserData.rights,
      createdBy: currentUser || 'System Admin'
    });
    
    setNewUserData({
      username: '',
      password: '',
      rights: 'Stage 1 rights'
    });
    setAddUserErrors({});
    setShowAddUser(false);
    alert('User added successfully!');
  };

  const validatePasswordChange = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordChangeData.currentPassword.trim()) {
      errors.currentPassword = 'Current password is required';
    } else if (selectedUserForPasswordChange && selectedUserForPasswordChange.password !== passwordChangeData.currentPassword) {
      errors.currentPassword = 'Current password is incorrect';
    }
    
    if (!passwordChangeData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (passwordChangeData.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters';
    }
    
    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserForPasswordChange) return;
    if (!validatePasswordChange()) return;
    
    onUpdateUser(selectedUserForPasswordChange.id, {
      password: passwordChangeData.newPassword
    });
    
    setPasswordChangeData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setShowChangePassword(false);
    setSelectedUserForPasswordChange(null);
    alert('Password updated successfully!');
  };

  const startPasswordChange = (user: UserType) => {
    setSelectedUserForPasswordChange(user);
    setShowChangePassword(true);
    setPasswordChangeData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Firm Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-indigo-600 mb-2">
              Welcome to
            </h1>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              G M C A & CO.
            </h2>
            <p className="text-lg text-gray-700 font-medium">
              Chartered Accountants
            </p>
          </div>

          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Welcome Back</h3>
            <p className="text-gray-600 mt-2">Tax Audit Practice Management System</p>
          </div>

          {(!showAddUser && !showChangePassword) ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white transition-colors ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          ) : showAddUser ? (
            <form onSubmit={handleAddUser} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">Add New User</h3>
              
              {/* Access Control Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-blue-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Restricted Access</p>
                    <p className="text-xs text-blue-700">Only Admin can add new users</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, username: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      addUserErrors.username ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter username"
                    required
                  />
                </div>
                {addUserErrors.username && (
                  <p className="mt-1 text-sm text-red-600">{addUserErrors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      addUserErrors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter password"
                    required
                  />
                </div>
                {addUserErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{addUserErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Rights
                </label>
                <select
                  value={newUserData.rights}
                  onChange={(e) => setNewUserData(prev => ({ ...prev, rights: e.target.value as UserType['rights'] }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                >
                  <option value="Stage 1 rights">Stage 1 Rights - Basic Tasks Only (No Special Tasks, No Client Edit/Delete)</option>
                  <option value="Stage 2 rights">Stage 2 Rights - All Tasks except Level 1 Approval</option>
                  <option value="Top Level Rights">Top Level Rights - Full Access</option>
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUserData({
                      username: '',
                      password: '',
                      rights: 'Stage 1 rights'
                    });
                    setAddUserErrors({});
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Add User
                </button>
              </div>
            </form>
          ) : showChangePassword && selectedUserForPasswordChange ? (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Change Password for {selectedUserForPasswordChange.username}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwordChangeData.currentPassword}
                    onChange={(e) => setPasswordChangeData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter current password"
                    required
                  />
                </div>
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwordChangeData.newPassword}
                    onChange={(e) => setPasswordChangeData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter new password"
                    required
                  />
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwordChangeData.confirmPassword}
                    onChange={(e) => setPasswordChangeData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
                      passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setSelectedUserForPasswordChange(null);
                    setPasswordChangeData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                    setPasswordErrors({});
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <Lock className="h-5 w-5 mr-2" />
                  Update Password
                </button>
              </div>
            </form>
          ) : null}

          {!showAddUser && !showChangePassword && (
            <div className="text-center">
              <div className="flex flex-col space-y-2 mt-4">
                {canAddUsers() && (
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New User
                  </button>
                )}
                
                {/* Change Password Options */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Change Password:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {users.map(user => (
                      <button
                        key={user.id}
                        onClick={() => startPasswordChange(user)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                      >
                        <Lock className="h-3 w-3 mr-1" />
                        {user.username}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delete User Options - Admin Only */}
                {canDeleteUsers() && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Delete User:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {users.filter(user => user.username.toLowerCase() !== 'admin').map(user => (
                        <button
                          key={user.id}
                          onClick={() => handleDeleteUser(user)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {user.username}
                        </button>
                      ))}
                    </div>
                    {users.filter(user => user.username.toLowerCase() !== 'admin').length === 0 && (
                      <p className="text-xs text-gray-500 text-center">No users available to delete</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {!showAddUser && !showChangePassword && !canAddUsers() && currentUser && (
            <div className="text-center mt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center justify-center">
                  <Shield className="h-4 w-4 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Only Admin can add new users
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Developer Credit */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Developed by{' '}
            <span className="font-semibold text-indigo-600">
              CA Mitt S. Patel, Partner
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;