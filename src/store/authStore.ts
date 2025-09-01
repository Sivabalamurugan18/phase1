import { create } from "zustand";
import {
  User,
  UserRole,
  RolePermissions,
  UserPermission,
} from "../types/admin";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: RolePermissions;
  permissionsDto: UserPermission[];
  accessToken: string | null;
  refreshToken: string | null;
  expireAt: string | null;
  setUser: (user: User | null) => void;
  setAuthData: (authData: any) => void;
  logout: () => void;
  getPermissions: (role: UserRole) => RolePermissions;
  hasPagePermission: (
    pageName: string,
    action: "view" | "create" | "edit" | "delete"
  ) => boolean;
  hasSpecificPermission: (
    pageName: string,
    action: "canView" | "canCreate" | "canEdit" | "canDelete"
  ) => boolean;
  initializeFromStorage: () => void;
}

const getDefaultPermissions = (role: UserRole): RolePermissions => {
  const basePermissions: RolePermissions = {
    canCreateProject: false,
    canEditProject: false,
    canDeleteProject: false,
    canCreateClarification: true,
    canResolveClarification: false,
    canCreateDiscrepancy: false,
    canResolveDiscrepancy: false,
    canExportData: false,
    canManageUsers: false,
  };

  switch (role) {
    case "admin":
      return {
        ...basePermissions,
        canCreateProject: true,
        canEditProject: true,
        canDeleteProject: true,
        canResolveClarification: true,
        canCreateDiscrepancy: true,
        canResolveDiscrepancy: true,
        canExportData: true,
        canManageUsers: true,
      };
    case "project_manager":
      return {
        ...basePermissions,
        canCreateProject: true,
        canEditProject: true,
        canResolveClarification: true,
        canResolveDiscrepancy: true,
        canExportData: true,
      };
    case "qc":
      return {
        ...basePermissions,
        canCreateDiscrepancy: true,
        canResolveDiscrepancy: true,
        canExportData: true,
      };
    case "engineer":
      return {
        ...basePermissions,
        canCreateClarification: true,
        canCreateDiscrepancy: true,
        canExportData: true,
      };
    default:
      return basePermissions;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  permissions: getDefaultPermissions("engineer"),
  permissionsDto: [],
  accessToken: null,
  refreshToken: null,
  expireAt: null,

  setUser: (user: User | null) => {
    if (user) {
      const permissions = getDefaultPermissions(user.role);
      console.log("User Permission Loaded here", permissions);
      set({ user, isAuthenticated: true, permissions });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        permissions: getDefaultPermissions("engineer"),
      });
    }
  },

  setAuthData: (authData: any) => {
    const {
      accessToken,
      refreshToken,
      expireAt,
      userId,
      email,
      role,
      permissionsDto,
    } = authData;

    // Store in localStorage
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("expireAt", expireAt);
    localStorage.setItem("userId", userId);
    localStorage.setItem("email", email);
    localStorage.setItem("role", role);
    localStorage.setItem(
      "permissionsDto",
      JSON.stringify(permissionsDto || [])
    );

    // Create user object
    const user: User = {
      id: userId,
      email: email,
      role: role as UserRole,
      name: email.split("@")[0], // Extract name from email
      department: "Engineering", // Default department
    };

    const permissions = getDefaultPermissions(role as UserRole);

    set({
      user,
      isAuthenticated: true,
      permissions,
      permissionsDto: permissionsDto || [],
      accessToken,
      refreshToken,
      expireAt,
    });
  },

  logout: () => {
    // Clear localStorage
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expireAt");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("permissionsDto");

    set({
      user: null,
      isAuthenticated: false,
      permissions: getDefaultPermissions("engineer"),
      permissionsDto: [],
      accessToken: null,
      refreshToken: null,
      expireAt: null,
    });
  },

  getPermissions: (role: UserRole) => getDefaultPermissions(role),

  hasPagePermission: (
    pageName: string,
    action: "view" | "create" | "edit" | "delete"
  ) => {
    const { permissionsDto } = get();
    const pagePermission = permissionsDto.find(
      (p) => p.page.pageName.toLowerCase() === pageName.toLowerCase()
    );

    if (!pagePermission) {
      return false; // No permission found for this page
    }

    switch (action) {
      case "view":
        return pagePermission.canView;
      case "create":
        return pagePermission.canCreate;
      case "edit":
        return pagePermission.canEdit;
      case "delete":
        return pagePermission.canDelete;
      default:
        return false;
    }
  },

  hasSpecificPermission: (
    pageName: string,
    action: "canView" | "canCreate" | "canEdit" | "canDelete"
  ) => {
    // Special case for pagePermission check
    if (action === "pagePermission") {
      const { permissionsDto } = get();
      const pagePermission = permissionsDto.find(
        (p) => p.page && p.page.pageName.toLowerCase() === pageName.toLowerCase()
      );
      return pagePermission?.pagePermission || false;
    }

    const { permissionsDto } = get();
    const pagePermission = permissionsDto.find(
      (p) => p.page && p.page.pageName.toLowerCase() === pageName.toLowerCase()
    );

    if (!pagePermission) {
      return false; // No permission found for this page
    }

    return pagePermission[action] || false;
  },

  initializeFromStorage: () => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    const expireAt = localStorage.getItem("expireAt");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");
    const permissionsDtoStr = localStorage.getItem("permissionsDto");

    if (accessToken && userId && email && role) {
      // Check if token is expired
      if (expireAt && new Date(expireAt) > new Date()) {
        const permissionsDto = permissionsDtoStr
          ? JSON.parse(permissionsDtoStr)
          : [];

        const user: User = {
          id: userId,
          email: email,
          role: role as UserRole,
          name: email.split("@")[0],
          department: "Engineering",
        };

        const permissions = getDefaultPermissions(role as UserRole);

        set({
          user,
          isAuthenticated: true,
          permissions,
          permissionsDto,
          accessToken,
          refreshToken,
          expireAt,
        });
      } else {
        // Token expired, clear storage
        get().logout();
      }
    }
  },
}));
