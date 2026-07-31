import { Link } from 'react-router-dom';
import { Cloud, ArrowRight, ShieldCheck, Upload, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 py-4">
      {/* Hero Section - Storemystuff Theme */}
      <section className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure JWT & Google OAuth Storage Platform</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Store, Manage & Share Your Files with <span className="text-blue-600">Storemystuff</span>
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            Upload files, create directories, connect with Google Drive, and access your cloud storage from anywhere.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to={user ? "/dashboard" : "/login"}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition-all"
            >
              <span>{user ? "Open Workspace" : "Get Started Now"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 font-bold">
            <Upload className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Fast File Uploads</h3>
          <p className="text-xs text-slate-500">
            Drag and drop files or create organized directories with instant metadata persistence.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 font-bold">
            <HardDrive className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">MongoDB & Redis Stack</h3>
          <p className="text-xs text-slate-500">
            Full-stack containerized backend with MongoDB session storage and Redis cache.
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4 font-bold">
            <Cloud className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Google OAuth Sync</h3>
          <p className="text-xs text-slate-500">
            Seamlessly log in with Google OAuth or email authentication with secure HTTP-only cookies.
          </p>
        </div>
      </section>
    </div>
  );
};

