import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

const FacebookAuthError = () => {
  const [searchParams] = useSearchParams();
  const errorMessage = searchParams.get('message') || 'Something went wrong with Facebook Sign-In';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
        <p className="text-gray-600 mb-6">{decodeURIComponent(errorMessage)}</p>
        <div className="space-y-3">
          <Link
            to="/authentication"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </Link>
          <Link
            to="/"
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FacebookAuthError;
