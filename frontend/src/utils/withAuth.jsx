import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

/**
 * Higher-order component for protected routes.
 *
 * Checks BOTH the AuthContext state AND the localStorage token.
 * Waits for the auth initialization to complete (isLoading) before
 * deciding whether to redirect — prevents flash-to-login on refresh.
 *
 * Redirects unauthenticated users to /auth.
 */
const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const router = useNavigate();
    const { userData, isLoading } = useContext(AuthContext);

    useEffect(() => {
      // Only redirect after auth check is complete to avoid false redirects
      if (!isLoading && !userData && !localStorage.getItem("token")) {
        router("/auth");
      }
    }, [isLoading, userData, router]);

    // Show nothing while auth is being initialized
    if (isLoading) return null;

    // If no user data but token exists, render and let session restore handle it
    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;