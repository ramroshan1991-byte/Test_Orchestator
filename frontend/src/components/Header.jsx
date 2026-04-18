import React from 'react';
import { Bell, User, Moon, Sun, AlertCircle } from 'lucide-react';

function Header({ demoMode, darkMode, setDarkMode, liveUrl }) {
  const [notifications, setNotifications] = React.useState([
    { id: 1, message: 'Test plan generated', time: '5 min ago', unread: true },
    { id: 2, message: 'Code generation complete', time: '15 min ago', unread: true },
  ]);
  const [showNotifications, setShowNotifications] = React.useState(false);

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className={`h-16 border-b px-8 flex items-center justify-between transition-colors duration-200 ${
      darkMode
        ? 'bg-slate-900 border-slate-700'
        : 'bg-gray-100 border-gray-200'
    }`}>
      {/* Left side - Title & Live URL */}
      <div>
        <h2 className={`text-xl font-bold transition-colors duration-200 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>Test Orchestrator</h2>
        {liveUrl && (
          <p className={`text-xs transition-colors duration-200 ${
            darkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>🔗 {liveUrl}</p>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              darkMode
                ? 'hover:bg-slate-800'
                : 'hover:bg-gray-200'
            }`}
          >
            <Bell size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg z-50 border transition-colors duration-200 ${
              darkMode
                ? 'bg-slate-800 border-slate-700'
                : 'bg-white border-gray-200'
            }`}>
              <div className={`p-4 border-b transition-colors duration-200 ${
                darkMode ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <h3 className={`font-semibold transition-colors duration-200 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}>Notifications ({unreadCount})</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="space-y-2 p-2">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-lg transition-colors ${
                          notif.unread 
                            ? darkMode
                              ? 'bg-blue-900/20 border-l-2 border-blue-500'
                              : 'bg-blue-100/50 border-l-2 border-blue-500'
                            : darkMode
                              ? 'hover:bg-slate-700/50'
                              : 'hover:bg-gray-100'
                        }`}
                      >
                        <p className={`text-sm transition-colors duration-200 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>{notif.message}</p>
                        <p className={`text-xs mt-1 transition-colors duration-200 ${
                          darkMode ? 'text-gray-500' : 'text-gray-600'
                        }`}>{notif.time}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-8 text-center transition-colors duration-200 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <p className="text-sm">No notifications</p>
                  </div>
                )}
              </div>
              <div className={`p-3 border-t text-center transition-colors duration-200 ${
                darkMode ? 'border-slate-700' : 'border-gray-200'
              }`}>
                <button className={`text-xs transition-colors duration-200 ${
                  darkMode
                    ? 'text-blue-400 hover:text-blue-300'
                    : 'text-blue-600 hover:text-blue-500'
                }`}>
                  View All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg transition-all duration-200 ${
            darkMode
              ? 'hover:bg-slate-800'
              : 'hover:bg-gray-200'
          }`}
          title="Toggle dark mode"
        >
          {darkMode ? (
            <Sun size={20} className="text-yellow-400" />
          ) : (
            <Moon size={20} className="text-gray-600" />
          )}
        </button>

        {/* User Avatar */}
        <div className={`flex items-center gap-3 pl-4 border-l transition-colors duration-200 ${
          darkMode
            ? 'border-slate-700'
            : 'border-gray-200'
        }`}>
          <div className="text-right">
            <p className={`text-sm font-medium transition-colors duration-200 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>Admin User</p>
            <p className={`text-xs transition-colors duration-200 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Connected</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User size={20} className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
