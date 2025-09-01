import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-hot-toast";
import { Lock, User, Loader2, Eye, EyeOff, Mail, Cpu, Zap, Brain, Shield, ArrowRight } from "lucide-react";
import config from "../../config";

const LoginPage: React.FC = () => {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setAuthData } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to detect if input is email or username
  const isEmail = (input: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  };

  const getInputType = (): 'email' | 'username' => {
    return isEmail(emailOrUsername) ? 'email' : 'username';
  };

  const getPlaceholderText = (): string => {
    return "Enter your email or username";
  };

  const getIconComponent = () => {
    return isEmail(emailOrUsername) ? Mail : User;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Prepare login payload - support both email and username
      const loginPayload = isEmail(emailOrUsername) 
        ? { email: emailOrUsername, password: password }
        : { username: emailOrUsername, password: password };

      // Try API login first
      const response = await fetch(`${config.API_BASE_URL}/api/account/Login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginPayload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const data = await response.json();

        // Store authentication data
        setAuthData({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expireAt: data.expireAt,
          userId: data.userId,
          email: data.email || emailOrUsername, // Use email from response or fallback to input
          role: data.role,
          permissionsDto: data.permissionsDto || [],
        });

        toast.success("Login successful!");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Invalid credentials");
      }
    } catch (error) {
      console.warn("API login failed, trying mock login:", error);

      // Fallback to mock login - support both email and username
      if (password === "Abc@123!" || password === "12345") {
        // Mock successful login data with UNIQUE page permissions
        const mockAuthData = {
          accessToken: "mock-access-token-" + Date.now(),
          refreshToken: "mock-refresh-token-" + Date.now(),
          expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
          userId: "mock-user-id-1",
          email: isEmail(emailOrUsername) ? emailOrUsername : `${emailOrUsername}@changepond.com`,
          role: "admin", // Default to admin for demo
          permissionsDto: [
            {
              page: {
                pageId: "dashboard",
                pageName: "Dashboard"
              },
              canView: true,
              canCreate: false,
              canEdit: false,
              canDelete: false,
            },
            {
              page: {
                pageId: "projects",
                pageName: "Projects"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            {
              page: {
                pageId: "clarifications",
                pageName: "Clarifications"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            {
              page: {
                pageId: "discrepancies",
                pageName: "Discrepancies"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            {
              page: {
                pageId: "time-management",
                pageName: "Time Management"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: false,
            },
            {
              page: {
                pageId: "talent-management",
                pageName: "Talent Management"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: false,
            },
            {
              page: {
                pageId: "users",
                pageName: "Users"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            // UNIQUE MASTER PAGE PERMISSIONS
            {
              page: {
                pageId: "divisions",
                pageName: "Divisions"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            {
              page: {
                pageId: "activities",
                pageName: "Activities"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            {
              page: {
                pageId: "products",
                pageName: "Products"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            // NEW MASTER PAGE PERMISSIONS
            {
              page: {
                pageId: "resource-roles",
                pageName: "Resource Roles"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            {
              page: {
                pageId: "resources",
                pageName: "Resources"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            {
              page: {
                pageId: "error-categories",
                pageName: "Error Categories"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            {
              page: {
                pageId: "error-sub-categories",
                pageName: "Error Sub Categories"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            },
            {
              page: {
                pageId: "drawing-descriptions",
                pageName: "Drawing Descriptions"
              },
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
            }
          ],
        };

        setAuthData(mockAuthData);
        toast.success("Login successful! (Using mock data - API unavailable)");
      } else {
        setError("Invalid credentials");
        toast.error("Invalid credentials");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const IconComponent = getIconComponent();

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 bg-blue-400 rounded-full opacity-20 animate-float-${i % 3}`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`,
              }}
            />
          ))}
        </div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className={`sm:mx-auto sm:w-full sm:max-w-md transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          {/* Logo with Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300 hover:rotate-3">
                <div className="relative">
                  <Brain className="h-12 w-12 text-white animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                </div>
              </div>
              {/* Floating Icons */}
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                <Cpu className="h-4 w-4 text-blue-300" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center animate-bounce" style={{ animationDelay: '1s' }}>
                <Zap className="h-4 w-4 text-purple-300" />
              </div>
            </div>
          </div>

          {/* Title with Typewriter Effect */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                POWELL CHANGEPOND
              </span>
            </h1>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-blue-400 animate-pulse" />
              <p className="text-blue-200 text-lg font-medium">
                AI-Powered Engineering QC Platform
              </p>
              <Cpu className="h-5 w-5 text-purple-400 animate-pulse" />
            </div>
            <div className="flex items-center justify-center space-x-4 text-sm text-blue-300">
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Gen AI Integrated</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>Real-time Analytics</span>
              </span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className={`mt-8 sm:mx-auto sm:w-full sm:max-w-md transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
          <div className="bg-white/10 backdrop-blur-xl py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Email/Username Input */}
              <div className="space-y-1">
                <label htmlFor="emailOrUsername" className="block text-sm font-medium text-white/90">
                  Email Address or Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IconComponent className="h-5 w-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" />
                  </div>
                  <input
                    id="emailOrUsername"
                    name="emailOrUsername"
                    type="text"
                    autoComplete="username"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                    placeholder={getPlaceholderText()}
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                {emailOrUsername && (
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-xs text-blue-200">
                      Detected as: <span className="font-medium text-blue-100">{getInputType()}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label htmlFor="password" className="block text-sm font-medium text-white/90">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-300 group-focus-within:text-blue-200 transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-sm transition-all duration-200 hover:bg-white/15"
                    placeholder="Enter your password"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-blue-300 hover:text-blue-200 focus:outline-none transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4 backdrop-blur-sm animate-shake">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <p className="text-red-200 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Examples */}
              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Authenticating...</span>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span>Access AI Platform</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Additional Features */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <Cpu className="h-6 w-6 text-blue-400 mx-auto mb-1" />
                <p className="text-xs text-blue-200">AI Analytics</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <Shield className="h-6 w-6 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-green-200">Secure Access</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <Zap className="h-6 w-6 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-purple-200">Real-time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`mt-8 text-center transition-all duration-1000 delay-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="flex items-center justify-center space-x-4 text-sm text-blue-200/80">
            <span>© {new Date().getFullYear()} Powell Changepond</span>
            <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
            <span>AI-Powered Engineering Excellence</span>
            <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
            <span>Next-Gen QC Platform</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;