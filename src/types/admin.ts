// User and Role Types
export interface User {
  userId: string;
  firstName?: string;
  lastName?: string;
  userName: string;
  phoneNumber?: string;
  role: string;
  changepondEmpId: number;
  email: string;
  password?: string;

  // Legacy fields for backward compatibility
  id?: string;
  name?: string;
  avatar?: string;
  department?: string;
}

export interface Role {
  id: string;
  name: string;
  normalizedName: string;
  concurrencyStamp?: string;
}

export type UserRole = "engineer" | "qc" | "project_manager" | "admin";

export interface RolePermissions {
  canCreateProject: boolean;
  canEditProject: boolean;
  canDeleteProject: boolean;
  canCreateClarification: boolean;
  canResolveClarification: boolean;
  canCreateDiscrepancy: boolean;
  canResolveDiscrepancy: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
}

export interface Page {
  pageId: number;
  parentPage: Page | null;
  childPages: Page[] | null;
  pageName: string;
  description: string;
  parentPageId: number | null;
  isLive: boolean;
}

export interface UserPermission {
  permissonId: number;
  page: Page;
  userId: string;
  pageId: number;
  pagePermission: boolean;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}
