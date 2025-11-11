import { useEffect } from 'react';
import { CheckCircle, UserCheck } from 'lucide-react';

const CenterNotification = ({ message, isVisible, onClose, type = 'welcome' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center animate-fadeIn px-4">
        {/* Notification Card */}
        <div className="animate-slideUp bg-white rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full">

          {/* Icon */}
          <div className="flex justify-center mb-4 sm:mb-5">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full p-2.5 sm:p-3">
              {type === 'welcome' ? (
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.5} />
              ) : (
                <UserCheck className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={2.5} />
              )}
            </div>
          </div>

          {/* Message */}
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {message}
            </h2>
            <p className="text-amber-600 font-semibold text-base sm:text-lg mb-1">
              Chronicle Vaults
            </p>
            {type === 'welcome' && (
              <p className="text-gray-600 text-xs sm:text-sm">
                Your journey begins now!
              </p>
            )}
            {type === 'login' && (
              <p className="text-gray-600 text-xs sm:text-sm">
                Great to see you again!
              </p>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </>
  );
};

export default CenterNotification;
