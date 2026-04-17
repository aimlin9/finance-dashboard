import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  List,
  Wallet,
  Clock,
  GitCompare,
  Target,
  LogOut,
  Settings,
  Sun,
  Moon,
  HelpCircle,
  ExternalLink,
  ChevronUp,
  X,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import Logo from './Logo';
import GlobalSearch from './GlobalSearch';
import Notifications from './Notifications';
import toast from 'react-hot-toast';

function HamburgerIcon({ isOpen, onClick }) {
  return (
    <div
      onClick={onClick}
      className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 cursor-pointer relative w-10 h-10 flex items-center justify-center"
    >
      <div className="w-5 h-4 relative">
        <span
          className="absolute left-0 w-full h-0.5 bg-current transition-all duration-300 ease-in-out"
          style={{
            top: isOpen ? '7px' : '0px',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        />
        <span
          className="absolute left-0 w-full h-0.5 bg-current transition-all duration-300 ease-in-out"
          style={{
            top: '7px',
            opacity: isOpen ? 0 : 1,
            transform: isOpen ? 'translateX(-8px)' : 'translateX(0)',
          }}
        />
        <span
          className="absolute left-0 w-full h-0.5 bg-current transition-all duration-300 ease-in-out"
          style={{
            top: isOpen ? '7px' : '14px',
            transform: isOpen ? 'rotate(-45deg)' : 'rotate(0deg)',
          }}
        />
      </div>
    </div>
  );
}

function Sidebar({ onNavigate }) {
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
    if (onNavigate) onNavigate();
  };

  var handleToggleTheme = function() {
    toggleTheme();
    setMenuOpen(false);
    toast.success(theme === 'dark' ? 'Light mode enabled' : 'Dark mode enabled');
  };

  var goTo = function(path) {
    navigate(path);
    setMenuOpen(false);
    if (onNavigate) onNavigate();
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
    <>
      <nav className="flex-1 space-y-2">
        <NavLink to="/dashboard" className={linkClass} onClick={onNavigate}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/upload" className={linkClass} onClick={onNavigate}>
          <Upload size={20} />
          Upload
        </NavLink>
        <NavLink to="/transactions" className={linkClass} onClick={onNavigate}>
          <List size={20} />
          Transactions
        </NavLink>
        <NavLink to="/budget" className={linkClass} onClick={onNavigate}>
          <Wallet size={20} />
          Budget
        </NavLink>
        <NavLink to="/history" className={linkClass} onClick={onNavigate}>
          <Clock size={20} />
          History
        </NavLink>
        <NavLink to="/compare" className={linkClass} onClick={onNavigate}>
          <GitCompare size={20} />
          Compare
        </NavLink>
        <NavLink to="/savings" className={linkClass} onClick={onNavigate}>
          <Target size={20} />
          Savings Goals
        </NavLink>
       
      </nav>

      <div className="relative" ref={menuRef}>
        {menuOpen && (
          <div className="absolute bottom-16 left-0 right-0 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-[100]">
            <div
              onClick={function() { goTo('/settings'); }}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition text-sm cursor-pointer"
            >
              <Settings size={16} />
              <span>Settings</span>
            </div>

            <div
              onClick={handleToggleTheme}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition text-sm cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </div>

            <div className="border-t border-gray-700" />

            <a
              href="https://github.com/aimlin9/finance-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition text-sm cursor-pointer"
            >
              <ExternalLink size={16} />
              <span>GitHub Repo</span>
            </a>

            <a
              href="https://dev.to/aimlin9"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 hover:bg-gray-700 transition text-sm cursor-pointer"
            >
              <HelpCircle size={16} />
              <span>Help and Resources</span>
            </a>

            <div className="border-t border-gray-700" />

            <div
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-gray-700 transition text-sm cursor-pointer"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </div>
          </div>
        )}

        <div
          onClick={function() { setMenuOpen(!menuOpen); }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-gray-800 transition border-t border-gray-800 mt-2 pt-4 cursor-pointer"
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
        </div>
      </div>
    </>
  );
}

  useEffect(function() {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(function() {
    var handleTouchStart = function(e) {
      touchStartX.current = e.changedTouches[0].screenX;
    };
    var handleTouchEnd = function(e) {
      touchEndX.current = e.changedTouches[0].screenX;
      var diff = touchEndX.current - touchStartX.current;
      if (diff > 80 && touchStartX.current < 50) {
        setMobileOpen(true);
      }
      if (diff < -80 && mobileOpen) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    return function() {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [mobileOpen]);

  var closeMobile = function() {
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-gray-900 border-r border-gray-800 p-6 flex-col fixed h-full overflow-visible">
        <div className="flex items-center gap-3 mb-1">
          <Logo size={28} />
          <h1 className="text-xl font-bold text-white">FinTrack</h1>
        </div>
        <p className="text-xs text-gray-500 mb-8">Personal Finance Dashboard</p>
        <Sidebar />
      </aside>

      {/* Mobile Overlay */}
      <div
        className={'lg:hidden fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ' + (mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')}
        onClick={closeMobile}
      />

      {/* Mobile Sidebar */}
      <aside className={'lg:hidden fixed top-0 left-0 h-full w-72 bg-gray-900 border-r border-gray-800 p-6 flex flex-col z-50 transition-transform duration-300 ease-in-out ' + (mobileOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size={28} />
            <div>
              <h1 className="text-xl font-bold text-white">FinTrack</h1>
              <p className="text-xs text-gray-500">Personal Finance Dashboard</p>
            </div>
          </div>
          <div
            onClick={closeMobile}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 cursor-pointer"
          >
            <X size={20} />
          </div>
        </div>
        <Sidebar onNavigate={closeMobile} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Desktop Top Bar */}
        <div className="hidden lg:flex items-center gap-4 px-8 py-4 border-b border-gray-800 sticky top-0 bg-gray-950 z-20">
          <div className="flex-1 max-w-md">
            <GlobalSearch />
          </div>
          <Notifications />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
          <HamburgerIcon
            isOpen={mobileOpen}
            onClick={function() { setMobileOpen(!mobileOpen); }}
          />
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <h1 className="text-lg font-bold text-white">FinTrack</h1>
          </div>
          <Notifications />
        </div>

        <main className="p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
