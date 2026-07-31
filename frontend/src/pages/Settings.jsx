import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  updateProfileApi,
  uploadAvatarApi,
  setPasswordApi,
  logoutAllDevicesApi,
  disableAccountApi,
  deleteAccountApi,
} from '../api/settingsApi';
import {
  HardDrive,
  User,
  Camera,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Trash2,
  AlertTriangle,
  Save,
  CheckCircle,
  Shield,
  Smartphone,
  Globe,
} from 'lucide-react';

const formatBytes = (bytes = 0) => {
  if (bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${val} ${sizes[i]}`;
};

export const Settings = () => {
  const { user, setUser, refreshUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Avatar upload
  const fileInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);

  // Action Confirmation Modals
  const [confirmDisable, setConfirmDisable] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  // Storage Calculations
  const storageUsed = user?.storageUsed || 0;
  const storageLimit = user?.storageLimit || 5368709120; // 5GB default
  const availableSpace = Math.max(0, storageLimit - storageUsed);
  const usagePercentage = Math.min(100, Math.round((storageUsed / storageLimit) * 100));

  const isNearlyFull = usagePercentage >= 80;

  // Handle Profile Name Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a valid full name.');
      return;
    }
    setUpdatingProfile(true);
    try {
      const res = await updateProfileApi(name.trim());
      if (res.success) {
        toast.success('Profile updated successfully!');
        if (res.user) setUser(res.user);
      }
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Handle Avatar Upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    const toastId = toast.loading('Uploading profile picture...');
    try {
      const res = await uploadAvatarApi(formData);
      if (res.success) {
        toast.success('Profile picture updated!', { id: toastId });
        if (res.user) setUser(res.user);
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      toast.error(err.response?.data?.message || 'Failed to upload profile picture.', { id: toastId });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle Set / Change Password
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSettingPassword(true);
    try {
      const res = await setPasswordApi(password, confirmPassword);
      if (res.success) {
        toast.success(res.message || 'Password saved successfully!');
        setPassword('');
        setConfirmPassword('');
        refreshUser();
      }
    } catch (err) {
      console.error('Set password error:', err);
      toast.error(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSettingPassword(false);
    }
  };

  // Handle Logout Current Device
  const handleLogoutCurrent = async () => {
    await logoutUser();
    navigate('/login');
  };

  // Handle Logout All Devices
  const handleLogoutAll = async () => {
    const toastId = toast.loading('Logging out from all devices...');
    try {
      await logoutAllDevicesApi();
      toast.success('Logged out from all devices.', { id: toastId });
      await logoutUser();
      navigate('/login');
    } catch (err) {
      toast.error('Failed to logout from all devices.', { id: toastId });
    }
  };

  // Handle Disable Account
  const handleDisableAccount = async () => {
    const toastId = toast.loading('Disabling your account...');
    try {
      const res = await disableAccountApi();
      if (res.success) {
        toast.success('Your account has been disabled.', { id: toastId });
        await logoutUser();
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable account.', { id: toastId });
    } finally {
      setConfirmDisable(false);
    }
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    const toastId = toast.loading('Permanently deleting your account...');
    try {
      const res = await deleteAccountApi();
      if (res.success) {
        toast.success('Your account and files have been permanently deleted.', { id: toastId });
        await logoutUser();
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account.', { id: toastId });
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 font-sans text-slate-900">
      {/* 1. Storage Usage Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Storage Usage</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-lg font-black text-slate-900">
                {formatBytes(storageUsed)} of {formatBytes(storageLimit)} used
              </span>
              {isNearlyFull && (
                <div className="flex items-center space-x-1 text-xs font-bold text-amber-600">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Storage is nearly full</span>
                </div>
              )}
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold border ${
                isNearlyFull
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {usagePercentage}% used
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isNearlyFull ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>

          {/* Used & Available Space Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Used Space</span>
              <span className="text-base font-extrabold text-slate-900">{formatBytes(storageUsed)}</span>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Available Space</span>
              <span className="text-base font-extrabold text-slate-900">{formatBytes(availableSpace)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Profile Settings Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Profile Settings</h2>
        </div>

        {/* Profile Picture Section */}
        <div className="space-y-3 border-b border-slate-100 pb-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Profile Picture</label>
          <div className="flex items-center space-x-5">
            <div className="relative">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                <span>{uploadingAvatar ? 'Uploading...' : 'Upload New Picture'}</span>
              </button>
              <p className="text-[11px] text-slate-400 font-medium">JPG, PNG or GIF. Max size 2MB.</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-blue-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-sm font-semibold cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-400 font-medium mt-1">Email cannot be changed once set.</p>
          </div>

          <button
            type="submit"
            disabled={updatingProfile}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{updatingProfile ? 'Updating Profile...' : 'Update Profile'}</span>
          </button>
        </form>
      </div>

      {/* 3. Connected Account Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-5">
        <h2 className="text-xl font-extrabold text-slate-900">Connected Account</h2>

        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Google</h3>
              <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center space-x-1">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Connected</span>
          </span>
        </div>

        <p className="text-xs text-slate-400 font-medium leading-relaxed">
          Only one social account can be connected at a time. This account is used for authentication.
        </p>
      </div>

      {/* 4. Set Password for Manual Login Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {user?.hasPassword ? 'Change Password' : 'Set Password for Manual Login'}
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-500 font-medium">
          {user?.hasPassword
            ? 'Update your account password for manual email sign in.'
            : 'Set a password to enable manual login in addition to your social login.'}
        </p>

        <form onSubmit={handleSetPassword} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-blue-500 shadow-sm pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password..."
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:border-blue-500 shadow-sm pr-11"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={settingPassword}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {settingPassword ? 'Saving Password...' : user?.hasPassword ? 'Update Password' : 'Set Password'}
          </button>
        </form>
      </div>

      {/* 5. Logout Options Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Logout Options</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Current Device</h3>
                <p className="text-xs text-slate-500">Logout from this device only</p>
              </div>
            </div>

            <button
              onClick={handleLogoutCurrent}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs shadow-md transition-all active:scale-98"
            >
              Logout
            </button>
          </div>

          <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">All Devices</h3>
                <p className="text-xs text-slate-500">Logout from all devices</p>
              </div>
            </div>

            <button
              onClick={handleLogoutAll}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-98"
            >
              Logout All
            </button>
          </div>
        </div>
      </div>

      {/* 6. Disable My Account Card */}
      <div className="bg-amber-50/40 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-sm space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Disable My Account</h2>
        </div>

        <div className="p-4 bg-amber-100/60 border border-amber-200/80 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>This action is temporary and can be reversed.</span>
          </div>
          <p className="text-xs text-amber-900/80 leading-relaxed">
            Disabling your account will hide your profile and stop all email or app notifications. Your data will be
            retained securely and can be restored anytime by contacting our support team.
          </p>
        </div>

        <button
          onClick={() => setConfirmDisable(true)}
          className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          Disable Account
        </button>
      </div>

      {/* 7. Delete My Account Card */}
      <div className="bg-rose-50/40 rounded-3xl p-6 sm:p-8 border border-rose-200/80 shadow-sm space-y-5">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Delete My Account</h2>
        </div>

        <div className="p-4 bg-rose-100/60 border border-rose-200/80 rounded-2xl space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>This action cannot be undone</span>
          </div>
          <p className="text-xs text-rose-900/80 leading-relaxed">
            Deleting your account will permanently remove all your data, files, and settings. You will lose access to
            all connected services and this action cannot be reversed.
          </p>
        </div>

        <button
          onClick={() => setConfirmDelete(true)}
          className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
        >
          Delete Account Permanently
        </button>
      </div>

      {/* Disable Account Modal */}
      {confirmDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-extrabold text-slate-900">Disable Account?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to temporarily disable your account? You can reactivate it later by contacting support.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmDisable(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableAccount}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
              >
                Yes, Disable Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-extrabold text-slate-900">Delete Account Permanently?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This action is permanent! All your files, folders, and storage data will be deleted immediately and cannot be recovered.
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
