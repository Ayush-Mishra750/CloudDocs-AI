import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  getAdminStatsApi,
  getAllUsersApi,
  updateUserRoleApi,
  updateUserQuotaApi,
  deleteUserApi,
  getUserVaultFilesApi,
} from '../api/adminApi';
import {
  Cloud,
  Film,
  Share2,
  Users,
  FileText,
  HardDrive,
  ShieldCheck,
  Search,
  RefreshCw,
  Trash2,
  Sliders,
  Crown,
  ArrowLeft,
  Folder,
  Eye,
  Home,
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user: currentUser } = useAuth();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Quota modal state
  const [quotaUser, setQuotaUser] = useState(null);
  const [newQuotaGB, setNewQuotaGB] = useState(5);

  // Delete user modal state
  const [deleteUserModal, setDeleteUserModal] = useState(null);

  // Single User Data Inspection State (Image 1)
  const [inspectUser, setInspectUser] = useState(null);
  const [inspectFolder, setInspectFolder] = useState(null);
  const [inspectFolderStack, setInspectFolderStack] = useState([]);
  const [vaultDirectories, setVaultDirectories] = useState([]);
  const [vaultFiles, setVaultFiles] = useState([]);
  const [vaultLoading, setVaultLoading] = useState(false);

  // Fetch Stats & User List
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes] = await Promise.all([
        getAdminStatsApi(),
        getAllUsersApi({ search, page, limit: 10 }),
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      if (usersRes.success) {
        setUsers(usersRes.users || []);
        setTotalPages(usersRes.pages || 1);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
      toast.error('Failed to load administrative control data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [search, page]);

  // Fetch target user's uploaded files & directories (Image 1)
  const fetchUserVault = async (userId, folderId = null) => {
    try {
      setVaultLoading(true);
      const res = await getUserVaultFilesApi(userId, folderId);
      if (res.success) {
        setVaultDirectories(res.directories || []);
        setVaultFiles(res.files || []);
      }
    } catch (err) {
      console.error('Failed to fetch user uploaded data:', err);
      toast.error('Failed to load user uploaded files & directories.');
    } finally {
      setVaultLoading(false);
    }
  };

  // Open Single User View when user clicked
  const handleInspectUser = (targetUser) => {
    setInspectUser(targetUser);
    setInspectFolder(null);
    setInspectFolderStack([]);
    fetchUserVault(targetUser._id, null);
  };

  // Open folder inside Single User View
  const handleInspectFolderClick = (folder) => {
    setInspectFolderStack((prev) => [...prev, inspectFolder].filter(Boolean));
    setInspectFolder(folder);
    fetchUserVault(inspectUser._id, folder._id);
  };

  // Handle Role Toggle
  const handleToggleRole = async (userItem) => {
    const newRole = userItem.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await updateUserRoleApi(userItem._id, newRole);
      if (res.success) {
        toast.success(res.message);
        setUsers((prev) =>
          prev.map((u) => (u._id === userItem._id ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user role');
    }
  };

  // Handle Quota Update
  const handleQuotaSubmit = async (e) => {
    e.preventDefault();
    if (!quotaUser || newQuotaGB <= 0) return;

    try {
      const res = await updateUserQuotaApi(quotaUser._id, newQuotaGB);
      if (res.success) {
        toast.success(res.message);
        setQuotaUser(null);
        fetchAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update storage quota');
    }
  };

  // Handle Delete User Account
  const handleConfirmDeleteUser = async () => {
    if (!deleteUserModal) return;

    try {
      const res = await deleteUserApi(deleteUserModal._id);
      if (res.success) {
        toast.success(res.message);
        setDeleteUserModal(null);
        fetchAdminData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // Render User Avatar
  const renderAvatar = (u, size = 'w-9 h-9') => {
    if (u?.avatar) {
      return (
        <img
          src={u.avatar}
          alt={u.name}
          className={`${size} rounded-full object-cover shrink-0 border border-slate-200`}
        />
      );
    }
    const initial = u?.name ? u.name.charAt(0).toUpperCase() : 'U';
    const bgColors = [
      'bg-indigo-600',
      'bg-blue-600',
      'bg-emerald-600',
      'bg-rose-600',
      'bg-purple-600',
      'bg-amber-600',
    ];
    const charCode = (u?.name || 'U').charCodeAt(0);
    const colorClass = bgColors[charCode % bgColors.length];

    return (
      <div
        className={`${size} rounded-full ${colorClass} text-white font-bold flex items-center justify-center shrink-0 uppercase shadow-sm`}
      >
        {initial}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">


      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* SINGLE USER VIEW (Image 1) */}
        {inspectUser ? (
          <div className="space-y-6">
            {/* User Sub-Header Bar Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm flex items-center justify-between">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Panel</span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-sm">{inspectUser.name}</p>
                  <p className="text-xs text-slate-400 font-medium">{inspectUser.email}</p>
                </div>
                {renderAvatar(inspectUser, 'w-10 h-10')}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 uppercase border border-purple-200">
                  {inspectUser.role || 'User'}
                </span>
              </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setInspectFolder(null);
                  setInspectFolderStack([]);
                  fetchUserVault(inspectUser._id, null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-blue-600 text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Root</span>
              </button>
              {inspectFolder && (
                <>
                  <span className="text-slate-400 text-xs">/</span>
                  <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                    {inspectFolder.name}
                  </span>
                </>
              )}
            </div>

            {/* Main Uploaded Files & Directories Box */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 min-h-[400px]">
              {vaultLoading ? (
                <div className="py-20 text-center text-slate-400 text-sm">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
                  <span>Loading target user's uploaded data...</span>
                </div>
              ) : (
                <>
                  {/* Directories Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2.5">
                      <Folder className="w-5 h-5 text-blue-600 fill-blue-50" />
                      <h3 className="font-bold text-slate-900 text-base">Directories</h3>
                    </div>

                    {vaultDirectories.length === 0 ? (
                      <p className="text-xs text-slate-400 italic pl-7">No directories uploaded in this folder.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {vaultDirectories.map((dir) => (
                          <div
                            key={dir._id}
                            onClick={() => handleInspectFolderClick(dir)}
                            className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex items-center space-x-3.5 group"
                          >
                            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition-transform">
                              <Folder className="w-6 h-6 fill-current" />
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-slate-900 text-sm truncate">{dir.name}</p>
                              <p className="text-[11px] text-slate-400 font-medium">Directory</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Files Section */}
                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <FileText className="w-5 h-5 text-slate-700" />
                      <h3 className="font-bold text-slate-900 text-base">Files</h3>
                    </div>

                    {vaultFiles.length === 0 ? (
                      <p className="text-xs text-slate-400 italic pl-7">No files uploaded in this folder.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {vaultFiles.map((file) => (
                          <div
                            key={file._id}
                            className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center space-x-3.5"
                          >
                            <div className="p-3 rounded-xl bg-slate-50 text-slate-600 border border-slate-100">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div className="truncate">
                              <p className="font-bold text-slate-900 text-sm truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[11px] text-slate-400 font-medium">
                                {file.formattedSize || '0 Bytes'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* MAIN ADMIN USER LIST VIEW */
          <div className="space-y-8 pb-12">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1">
                  <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/20">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Admin Control Center</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight">System & User Analytics</h1>
                  <p className="text-slate-300 text-xs md:text-sm">
                    Click on any user to view their uploaded files & directories in the Single User View.
                  </p>
                </div>

                <button
                  onClick={fetchAdminData}
                  className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Analytics</span>
                </button>
              </div>
            </div>

            {/* Admin Stats Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Users */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Users</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">{stats?.totalUsers || 0}</p>
                <p className="text-[11px] text-slate-400 font-medium">Registered SaaS Accounts</p>
              </div>

              {/* Total Storage Used */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vault Storage</span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <HardDrive className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">{stats?.formattedTotalStorageUsed || '0 Bytes'}</p>
                <p className="text-[11px] text-slate-400 font-medium">Aggregated Cloud Disk Usage</p>
              </div>

              {/* Total Files Stored */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Files</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">{stats?.totalFiles || 0}</p>
                <p className="text-[11px] text-slate-400 font-medium">Uploaded Documents & Media</p>
              </div>

              {/* Public Shares */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Public Shares</span>
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-2xl font-black text-slate-900">{stats?.totalPublicShares || 0}</p>
                <p className="text-[11px] text-slate-400 font-medium">Active Share Links</p>
              </div>
            </div>

            {/* Users Management Table */}
            <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm overflow-hidden space-y-4">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">User Management</h2>
                  <p className="text-xs text-slate-500">Click on any user row to view their uploaded files and directories</p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {loading ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <span>Fetching user records...</span>
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-y border-slate-100">
                        <th className="py-3.5 px-6">User (Click to View Files)</th>
                        <th className="py-3.5 px-4">Auth Provider</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Storage Usage</th>
                        <th className="py-3.5 px-4">Joined</th>
                        <th className="py-3.5 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {users.map((u) => {
                        const usedPerc = Math.min(
                          100,
                          Math.round((u.storageUsed / (u.storageLimit || 5368709120)) * 100)
                        );
                        return (
                          <tr
                            key={u._id}
                            className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                            onClick={() => handleInspectUser(u)}
                          >
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                {renderAvatar(u, 'w-9 h-9')}
                                <div className="truncate max-w-xs">
                                  <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                    {u.name}
                                  </p>
                                  <p className="text-slate-500 text-[11px] truncate">{u.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded ${u.authProvider === 'google'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-slate-100 text-slate-700'
                                  }`}
                              >
                                {u.authProvider === 'google' ? 'GOOGLE OAuth' : 'EMAIL / LOCAL'}
                              </span>
                            </td>

                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${u.role === 'admin'
                                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  : 'bg-slate-100 text-slate-600'
                                  }`}
                              >
                                {u.role === 'admin' && <Crown className="w-3 h-3 text-amber-500" />}
                                <span className="uppercase">{u.role}</span>
                              </span>
                            </td>

                            <td className="py-4 px-4 min-w-[160px]">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[11px] text-slate-600">
                                  <span className="font-semibold">{u.formattedUsed}</span>
                                  <span className="text-slate-400">/ {u.formattedLimit}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${usedPerc}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-4 text-slate-400">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>

                            <td
                              className="py-4 px-6 text-right space-x-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* View Data Button */}
                              <button
                                onClick={() => handleInspectUser(u)}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                                title="View User Data"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Data</span>
                              </button>

                              {/* Toggle Role Button */}
                              <button
                                onClick={() => handleToggleRole(u)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors"
                                title="Toggle Admin Role"
                              >
                                {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                              </button>

                              {/* Adjust Quota Button */}
                              <button
                                onClick={() => {
                                  setQuotaUser(u);
                                  setNewQuotaGB(Math.round(u.storageLimit / (1024 * 1024 * 1024)) || 5);
                                }}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Adjust Storage Quota"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>

                              {/* Delete User Account Button */}
                              <button
                                onClick={() => setDeleteUserModal(u)}
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete User Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Footer */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <div className="space-x-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Adjust Storage Quota Modal */}
      {quotaUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Update Quota for "{quotaUser.name}"
            </h3>
            <form onSubmit={handleQuotaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Storage Limit (in GB)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={newQuotaGB}
                  onChange={(e) => setNewQuotaGB(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuotaUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md"
                >
                  Save Quota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete User Modal */}
      {deleteUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Purge Account & Files?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-800">{deleteUserModal.email}</strong>? All their stored files and directories will be completely purged from S3 storage.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteUserModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md"
              >
                Purge Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
