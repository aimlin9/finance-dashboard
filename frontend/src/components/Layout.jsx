import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  List,
  Wallet,
  Clock,
  GitCompare,
  LogOut,
  Settings,
  Sun,
  Moon,
  HelpCircle,
  ExternalLink,
  ChevronUp,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import toast from 'react-hot-toast';

export default function Layout({ children }) {
  var { user, logout } = useAuthStore();
  var { theme, toggleTheme } = useThemeStore();
  var navigate = useNavigate();
  var [menuOpen, setMenuOpen] = useState(false);
  var menuRef = useRef(null);

  useEffect(function() {
    var handleClickOutside = function(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return function() {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  var handleLogout = function() {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  var handleToggleTheme = function() {
    toggleTheme();
    setMenuOpen(false);
    toast.success(theme === 'dark' ? 'Light mode enabled' : 'Dark mode enabled');
  };

  var linkClass = function({ isActive }) {
    return 'flex items-center gap-3 px-4 py-3 rounded-lg transition ' +
      (isActive
        ? 'bg-indigo-600 text-white'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white');
  };

  var userInitial = user && user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';
  var userName = user ? user.full_name : '';
  var userEmail = user ? user.email : '';

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
          <NavLink to="/budget" className={linkClass}>
            <Wallet size={20} />
            Budget
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            <Clock size={20} />
            History
          </NavLink>
          <NavLink to="/compare" className={linkClass}>
            <GitCompare size={20} />
            Compare
          </NavLink>
        </nav>

        <div className="relative" ref={menuRef}>
          {menuOpen && (
            <div className="absolute bottom-16 left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-50">
              <button
                onClick={function() { navigate('/settings'); setMenuOpen(false); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition text-sm"
              >
                <Settings size={16} />
                Settings
              </button>

              <button
                onClick={handleToggleTheme}
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition text-sm"
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>

              <div className="border-t border-gray-700" />

              <a
                href="https://github.com/aimlin9/finance-dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition text-sm"
              >
                <ExternalLink size={16} />
                GitHub Repo
              </a>

              <a
                href="https://dev.to/aimlin9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition text-sm"
              >
                <HelpCircle size={16} />
                Help and Resources
              </a>

              <div className="border-t border-gray-700" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-gray-700 transition text-sm"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}

          <button
            onClick={function() { setMenuOpen(!menuOpen); }}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-800 transition border-t border-gray-800 mt-2 pt-4"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
              {userInitial}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-white">{userName}</p>
              <p className="text-xs text-gray-500">{userEmail}</p>
            </div>
            <ChevronUp
              size={16}
              className={'text-gray-500 transition-transform ' + (menuOpen ? 'rotate-180' : '')}
            />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
