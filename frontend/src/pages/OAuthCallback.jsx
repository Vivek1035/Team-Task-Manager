import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMe } from "../api/authApi";

/**
 * Landing page after Google OAuth redirect.
 * Backend redirects here as: /oauth/callback?token=<jwt>
 * We store the token, fetch the user profile, then go to dashboard.
 */
export default function OAuthCallback() {
  const [params]   = useSearchParams();
  const { saveAuth } = useAuth();
  const navigate   = useNavigate();

  useEffect(() => {
    let token = params.get("token");
    if (!token && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      token = hashParams.get("token");
    }

    if (!token) {
      navigate("/login");
      return;
    }

    // Temporarily store token so the axios interceptor can use it for /auth/me
    localStorage.setItem("token", token);

    getMe()
      .then((res) => {
        saveAuth(token, res.data);
        navigate("/dashboard");
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center animate-fade-in">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
