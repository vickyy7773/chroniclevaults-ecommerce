import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const Toast = ({ message, isVisible, onClose, type = 'success' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[9999] animate-slideInRight max-w-[90vw] sm:max-w-md">
      <div className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-2xl border-2 ${
        type === 'success'
          ? 'bg-green-50 border-green-500 text-green-900'
          : 'bg-red-50 border-red-500 text-red-900'
      }`}>
        {type === 'success' && (
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0" />
        )}
        <p className="font-semibold text-xs sm:text-sm flex-1">{message}</p>
        <button
          onClick={onClose}
          className="ml-1 sm:ml-2 hover:opacity-70 transition-opacity flex-shrink-0"
          aria-label="Close notification"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slideInRight {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Toast;
