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
    <div className="fixed top-20 right-4 z-50 animate-slideInRight">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border-2 ${
        type === 'success'
          ? 'bg-green-50 border-green-500 text-green-900'
          : 'bg-red-50 border-red-500 text-red-900'
      }`}>
        {type === 'success' && (
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
        )}
        <p className="font-semibold text-sm">{message}</p>
        <button
          onClick={onClose}
          className="ml-2 hover:opacity-70 transition-opacity"
          aria-label="Close notification"
        >
          <X className="w-5 h-5" />
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
