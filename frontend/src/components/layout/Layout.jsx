import { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Cloud, Share2, Video, LogOut, ShieldCheck, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import toast from 'react-hot-toast';

export const Layout = () => {
  const { user, refreshUser, logoutUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const userName = user?.name || 'User';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* Navigation Header - Storemystuff Theme */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                <Cloud className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">
                CloudDocs <span className="text-blue-600">AI</span>
              </span>
            </Link>

            {/* Header Actions & Profile */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {user && (
                <>
                  <Link
                    to="/dashboard"
                    className="hidden sm:flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <Cloud className="w-4 h-4 text-blue-600" />
                    <span>My Storage</span>
                  </Link>

                  <Link
                    to="/share"
                    className="hidden sm:flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <Share2 className="w-4 h-4 text-blue-600" />
                    <span>Share</span>
                  </Link>

                  <Link
                    to="/subscription"
                    className="hidden sm:flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                  >
                    <Video className="w-4 h-4 text-emerald-600" />
                    <span>Upgrade Plan</span>
                  </Link>
                </>
              )}

              {/* Admin Link if role === 'admin' */}
              {user?.role?.toLowerCase() === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center space-x-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* User Profile & Verification Status */}
              {user ? (
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Email Verification Status Badge */}
                  {user.isVerified ? (
                    <span className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  ) : (
                    <Link
                      to="/verify-otp"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Verify Email</span>
                    </Link>
                  )}

                  <Link
                    to="/settings"
                    className="flex items-center space-x-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors"
                    title="Account Settings"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={userName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="hidden sm:flex flex-col text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800 leading-tight">
                          {userName}
                        </span>
                        {user?.role?.toLowerCase() === 'admin' && (
                          <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase tracking-wider">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 leading-tight truncate max-w-[110px]">
                        {userEmail}
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                  >
                    Sign In
                  </Link>

                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

