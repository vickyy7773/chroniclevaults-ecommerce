import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const FacebookAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));

        // Store token and user data in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Redirect to home page
        window.location.href = '/';
      } catch (error) {
        console.error('Error parsing user data:', error);
        navigate('/authentication?error=invalid_data');
      }
    } else {
      navigate('/authentication?error=missing_data');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Signing you in with Facebook...</p>
      </div>
    </div>
  );
};

export default FacebookAuthSuccess;
