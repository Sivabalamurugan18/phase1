import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./utils/errorBoundary";
import ProjectsPage from "./features/projects/ProjectsPage";
import ClarificationsPage from "./features/clarifications/ClarificationsPage";
import DiscrepanciesPage from "./features/discrepancies/DiscrepanciesPage";
import UsersPage from "./features/users/UsersPage";
import UserPermissionsPage from "./features/user-permissions/UserPermissionsPage";
import ProfilePage from "./features/profile/ProfilePage";
import SettingsPage from "./features/profile/SettingsPage";
import LoginPage from "./features/auth/LoginPage";
import TimeManagementPage from "./features/time-management/TimeManagementPage";
import TalentManagementPage from "./features/talent-management/TalentManagementPage";
import DivisionsMaster from "./features/masters/divisions/DivisionsMaster";
import ActivitiesMaster from "./features/masters/activities/ActivitiesMaster";
import ProductsMaster from "./features/masters/products/ProductsMaster";
import ExtraResourceRolesMaster from "./features/masters/extra-resource-roles/ExtraResourceRolesMaster";
import ExtraResourcesMaster from "./features/masters/extra-resources/ExtraResourcesMaster";
import ErrorCategoriesMaster from "./features/masters/error-categories/ErrorCategoriesMaster";
import ErrorSubCategoriesMaster from "./features/masters/error-sub-categories/ErrorSubCategoriesMaster";
import DrawingDescriptionsMaster from "./features/masters/drawing-descriptions/DrawingDescriptionsMaster";
import { useAuthStore } from "./store/authStore";

function App() {
  const { isAuthenticated, initializeFromStorage, hasSpecificPermission } =
    useAuthStore();

  const getDefaultRoute = React.useCallback(() => {
    // Always try to go to Projects first, then Clarifications, then Discrepancies
    // The individual pages will handle permission checks internally
    return "/projects";
    
    // Fallback logic if needed
    if (hasSpecificPermission("Clarifications", "canView")) return "/clarifications";
    if (hasSpecificPermission("Discrepancies", "canView")) return "/discrepancies";
    if (hasSpecificPermission("Time Management", "canView")) return "/time-management";
    if (hasSpecificPermission("Talent Management", "canView"))
      return "/talent-management";
    if (hasSpecificPermission("Users", "canView")) return "/users";
    if (hasSpecificPermission("Divisions", "canView")) return "/masters/divisions";
    if (hasSpecificPermission("Activities", "canView")) return "/masters/activities";
    if (hasSpecificPermission("Products", "canView")) return "/masters/products";
    if (hasSpecificPermission("Resource Roles", "canView"))
      return "/masters/extra-resource-roles";
    if (hasSpecificPermission("Resources", "canView"))
      return "/masters/extra-resources";
    if (hasSpecificPermission("Error Categories", "canView"))
      return "/masters/error-categories";
    if (hasSpecificPermission("Error Sub Categories", "canView"))
      return "/masters/error-sub-categories";
    if (hasSpecificPermission("Drawing Descriptions", "canView"))
      return "/masters/drawing-descriptions";
  }, [hasSpecificPermission]);

  useEffect(() => {
    initializeFromStorage();
  }, [initializeFromStorage]);

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <LoginPage />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
          }}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          {/* Default route - redirect to first available page */}
          <Route
            path="/"
            element={<Navigate to={getDefaultRoute()} replace />}
          />

          {/* Protected Routes with Permission Checks */}
          <Route path="/projects" element={<ProjectsPage />} />

          <Route path="/clarifications" element={<ClarificationsPage />} />

          <Route path="/discrepancies" element={<DiscrepanciesPage />} />

          {hasSpecificPermission("Time Management", "canView") && (
            <Route path="/time-management" element={<TimeManagementPage />} />
          )}

          {hasSpecificPermission("Talent Management", "canView") && (
            <Route
              path="/talent-management"
              element={<TalentManagementPage />}
            />
          )}

          {hasSpecificPermission("Users", "canView") && (
            <Route path="/users" element={<UsersPage />} />
          )}

          {/* User Permissions Route - Uses same permission as Users */}
          {hasSpecificPermission("Users", "canView") && (
            <Route path="/user-permissions" element={<UserPermissionsPage />} />
          )}

          {/* Masters Routes - Each with unique permission names */}
          {hasSpecificPermission("Divisions", "canView") && (
            <Route path="/masters/divisions" element={<DivisionsMaster />} />
          )}

          {hasSpecificPermission("Activities", "canView") && (
            <Route path="/masters/activities" element={<ActivitiesMaster />} />
          )}

          {hasSpecificPermission("Products", "canView") && (
            <Route path="/masters/products" element={<ProductsMaster />} />
          )}

          {hasSpecificPermission("Resource Roles", "canView") && (
            <Route
              path="/masters/extra-resource-roles"
              element={<ExtraResourceRolesMaster />}
            />
          )}

          {hasSpecificPermission("Resources", "canView") && (
            <Route
              path="/masters/extra-resources"
              element={<ExtraResourcesMaster />}
            />
          )}

          {hasSpecificPermission("Error Categories", "canView") && (
            <Route
              path="/masters/error-categories"
              element={<ErrorCategoriesMaster />}
            />
          )}

          {hasSpecificPermission("Error Sub Categories", "canView") && (
            <Route
              path="/masters/error-sub-categories"
              element={<ErrorSubCategoriesMaster />}
            />
          )}

          {hasSpecificPermission("Drawing Descriptions", "canView") && (
            <Route
              path="/masters/drawing-descriptions"
              element={<DrawingDescriptionsMaster />}
            />
          )}

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Fallback for unauthorized access */}
          <Route
            path="*"
            element={<Navigate to={getDefaultRoute()} replace />}
          />
        </Routes>
      </Router>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            style: {
              background: "#10b981",
            },
          },
          error: {
            style: {
              background: "#ef4444",
            },
          },
        }}
      />
    </ErrorBoundary>
  );
}

export default App;