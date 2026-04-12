import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Upload, List, LogOut, User } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
      isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col">
        <h1 className="text-xl font-bold text-white mb-1">🇬🇭 FinTrack</h1>
        <p className="text-xs text-gray-500 mb-8">Personal Finance Dashboard</p>

        <nav className="flex-1 space-y-2">
          <NavLink to="/dashboard" className={linkClass}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/upload" className={linkClass}>
            <Upload size={20} />
            Upload
          </NavLink>
          <NavLink to="/transactions" className={linkClass}>
            <List size={20} />
            Transactions
          </NavLink>
        </nav>

        <div className="border-t border-gray-800 pt-4 mt-4">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <User size={18} className="text-gray-500" />
            <div>
              <p className="text-sm text-white">{user?.full_name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-red-400 transition w-full"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}