import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import ErrorMessage from "../components/ErrorMessage";

const API_URL = import.meta.env.VITE_API_URL;

export default function Login() {
  const [mode, setMode]     = useState("login"); // "login" | "register"
  const [form, setForm]     = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const { saveAuth }        = useAuth();
  const navigate            = useNavigate();

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = mode === "login"
        ? await login({ email: form.email, password: form.password })
        : await register({ name: form.name, email: form.email, password: form.password });

      saveAuth(res.data.token, res.data.user);
      navigate("/dashboard");
    } catch (e) {
      setError(e.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-white">TaskFlow</h1>
          <p className="text-gray-500 text-sm mt-1">Team Task Manager</p>
        </div>

        <div className="card">
          {/* Mode tabs */}
          <div className="flex bg-white/5 rounded-lg p-1 mb-6">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-200 capitalize
                  ${mode === m
                    ? "bg-brand-500 text-white shadow"
                    : "text-gray-400 hover:text-gray-200"}`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div className="form-group">
                <label className="label">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="input"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="label">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder={mode === "register" ? "Min. 8 characters" : "••••••••"}
                className="input"
                required
              />
            </div>

            <ErrorMessage message={error} />

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs text-gray-500 bg-surface-900">or continue with</span>
            </div>
          </div>

          <a
            href={`${API_URL}/oauth2/authorization/google`}
            className="btn btn-ghost w-full justify-center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
            </svg>
            Continue with Google
          </a>
        </div>
      </div>
    </div>
  );
}
