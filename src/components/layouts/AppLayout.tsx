import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Clipboard,
  ClipboardList,
  AlertTriangle,
  User,
  Users,
  Settings,
  LogOut,
  Menu,
  HelpCircle,
  Clock,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Activity,
  Package,
  Brain,
  Zap,
  Shield,
  Cpu,
  UserPlus,
  FileText,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { toast } from "react-hot-toast";
import DigitalClock from "../ui/DigitalClock";
import { useMemo } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
  title: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, hasPagePermission, hasSpecificPermission, permissionsDto } = useAuthStore();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  // Build navigation dynamically from permissions
  const navigation = React.useMemo(() => {
    if (!permissionsDto || permissionsDto.length === 0) {
      return [];
    }

    // Get all parent pages (parentPageId is null) with pagePermission: true
    const parentPages = permissionsDto.filter(
      (perm) => perm.page && perm.page.parentPageId === null && perm.pagePermission === true
    );

    // Build navigation structure
    const navigationItems = parentPages.map((parentPerm) => {
      const parentPage = parentPerm.page;
      
      // Get child pages for this parent where both parent and child have pagePermission: true
      const childPages = permissionsDto.filter(
        (perm) => 
          perm.page && perm.page.parentPageId === parentPage.pageId && 
          perm.pagePermission === true
      );

      // Map page names to icons and paths
      const getPageIcon = (pageName: string) => {
        switch (pageName.toLowerCase()) {
          case 'admin': return User;
          case 'masters': return Settings;
          case 'project': return Clipboard;
          case 'users': return Users;
          case 'userspermission': return Shield;
          case 'divisions': return Clipboard;
          case 'activities': return Activity;
          case 'products': return Package;
          case 'resource roles': return UserPlus;
          case 'resources': return Users;
          case 'error categories': return AlertTriangle;
          case 'error sub categories': return AlertTriangle;
          case 'drawing descriptions': return FileText;
          case 'projects': return Clipboard;
          case 'clarifications': return ClipboardList;
          case 'discrepancies': return AlertTriangle;
          case 'time management': return Clock;
          case 'talent management': return UserCheck;
          default: return FileText;
        }
      };

      const getPagePath = (pageName: string, parentPageName?: string) => {
        switch (pageName.toLowerCase()) {
          case 'users': return '/users';
          case 'userspermission': return '/user-permissions';
          case 'divisions': return '/masters/divisions';
          case 'activities': return '/masters/activities';
          case 'products': return '/masters/products';
          case 'resource roles': return '/masters/extra-resource-roles';
          case 'resources': return '/masters/extra-resources';
          case 'error categories': return '/masters/error-categories';
          case 'error sub categories': return '/masters/error-sub-categories';
          case 'drawing descriptions': return '/masters/drawing-descriptions';
          case 'projects': return '/projects';
          case 'clarifications': return '/clarifications';
          case 'discrepancies': return '/discrepancies';
          case 'time management': return '/time-management';
          case 'talent management': return '/talent-management';
          default: return '#';
        }
      };

      // If this parent has children, create a parent with children structure
      if (childPages.length > 0) {
        return {
          name: parentPage.pageName,
          icon: getPageIcon(parentPage.pageName),
          children: childPages.map((childPerm) => ({
            name: childPerm.page.pageName,
            path: getPagePath(childPerm.page.pageName, parentPage.pageName),
            icon: getPageIcon(childPerm.page.pageName),
            permission: childPerm.page.pageName,
          })),
        };
      } else {
        // This is a standalone parent page (like Time Management, Talent Management)
        return {
          name: parentPage.pageName,
          path: getPagePath(parentPage.pageName),
          icon: getPageIcon(parentPage.pageName),
          permission: parentPage.pageName,
        };
      }
    });

    return navigationItems;
  }, [permissionsDto]);

  const handleLogout = React.useCallback(() => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  }, [logout, navigate]);

  const handleHelpClick = React.useCallback(() => {
    toast.success("Help documentation coming soon!");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 flex flex-col transition-all duration-300 z-30 ${
          sidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="flex flex-col bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 flex-1 shadow-2xl backdrop-blur-xl border-r border-white/10">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 bg-gradient-to-r from-blue-900/90 to-purple-900/90 backdrop-blur-xl border-b border-white/10">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">
                  POWELL
                </span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-white hover:text-blue-200 transition-colors p-2 rounded-lg hover:bg-white/10"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* AI Status Indicator */}
          {!sidebarCollapsed && (
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center space-x-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-200">AI Online</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Cpu className="h-3 w-3 text-blue-300" />
                  <span className="text-blue-200">Gen AI</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-purple-300" />
                  <span className="text-purple-200">Secure</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path;
              const isExpandable = !!item.children;
              const isExpanded = expandedSections.includes(item.name);

              return (
                <div key={item.name}>
                  <button
                    onClick={() =>
                      isExpandable
                        ? toggleSection(item.name)
                        : item.path && navigate(item.path)
                    }
                    className={`group flex items-center w-full px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }`}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive ? "text-white" : "text-blue-300"
                      }`}
                      aria-hidden="true"
                    />
                    {!sidebarCollapsed && (
                      <span className="flex-1 text-left">{item.name}</span>
                    )}
                    {isExpandable && !sidebarCollapsed && (
                      <div className="ml-auto">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-blue-300" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-blue-300" />
                        )}
                      </div>
                    )}
                  </button>

                  {/* Render children if expanded */}
                  {!sidebarCollapsed &&
                    isExpandable &&
                    isExpanded &&
                    item.children?.map((child) => {
                      const isChildActive = location.pathname === child.path;
                      
                      // Check if user has permission for this child page

                      return (
                        <button
                          key={child.name}
                          onClick={() => navigate(child.path)}
                          className={`ml-6 group flex w-full items-center px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                            isChildActive
                              ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white shadow-md border border-blue-400/30"
                              : "text-blue-200 hover:bg-white/5 hover:text-white"
                          }`}
                          title={child.name}
                        >
                          <child.icon
                            className={`mr-3 h-4 w-4 transition-colors ${
                              isChildActive ? "text-blue-300" : "text-blue-400"
                            }`}
                            aria-hidden="true"
                          />
                          {child.name}
                        </button>
                      );
                    }).filter(Boolean)}
                </div>
              );
            })}
          </nav>

          {/* Settings & Profile */}
          <div className="flex flex-col border-t border-white/10 p-2">
            <button
              onClick={() => navigate("/settings")}
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                location.pathname === "/settings"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "text-blue-100 hover:bg-white/10 hover:text-white"
              }`}
              title={sidebarCollapsed ? "Settings" : undefined}
            >
              <Settings className="mr-3 h-5 w-5 text-blue-300" />
              {!sidebarCollapsed && "Settings"}
            </button>

            <div className="p-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-white">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-blue-200 mb-2">
                      {user?.role?.replace("_", " ") || "Role"}
                    </p>
                    <button
                      onClick={handleLogout}
                      className="text-xs text-blue-200 hover:text-blue-100 flex items-center transition-colors group"
                    >
                      <LogOut className="h-3 w-3 mr-1 group-hover:translate-x-0.5 transition-transform" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "pl-20" : "pl-64"
        }`}
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-20">
          <div className="flex h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
            <div className="flex-1 flex items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {title}
                  </h1>
                </div>
                {/* AI Status in Header */}
                <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700">
                    AI Assistant Active
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <DigitalClock />
                <button
                  onClick={handleHelpClick}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-xl hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                  title="Need Help?"
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 relative">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;