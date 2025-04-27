import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/" replace/>;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace/>;
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.array,
};

export default PrivateRoute;
