import React, { useEffect } from 'react';
import { Check, AlertCircle, Info, X } from 'lucide-react';

function Toast({ message, type = 'success', darkMode = true }) {
  const [isVisible, setIsVisible] = React.useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  const icons = {
    success: <Check size={20} className="text-green-400" />,
    error: <X size={20} className="text-red-400" />,
    warning: <AlertCircle size={20} className="text-yellow-400" />,
    info: <Info size={20} className="text-blue-400" />,
  };

  const bgColors = {
    success: darkMode ? 'bg-green-900/20 border-green-600' : 'bg-green-100 border-green-300',
    error: darkMode ? 'bg-red-900/20 border-red-600' : 'bg-red-100 border-red-300',
    warning: darkMode ? 'bg-yellow-900/20 border-yellow-600' : 'bg-yellow-100 border-yellow-300',
    info: darkMode ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-100 border-blue-300',
  };

  const textColor = darkMode ? 'text-white' : 'text-gray-900';

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColors[type]} backdrop-blur-sm transition-colors duration-200`}>
        {icons[type]}
        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
      </div>
    </div>
  );
}

export default Toast;
