import React, { useState, useCallback, useRef, useEffect } from "react";
import AppLayout from "../../components/layouts/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef } from "ag-grid-community";
import {
  Plus,
  RefreshCw,
  FileDown,
  Edit2,
  Trash2,
  Shield,
  Users,
  Settings,
  Eye,
  UserCheck,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Check,
  X,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToExcel } from "../../utils/export";
import { User, UserPermission, Page } from "../../types";
import Badge from "../../components/ui/Badge";
import { userService } from "../../services/apiService";

interface PermissionRow {
  pageId: number;
  pageName: string;
  description?: string;
  canView: boolean;
  canAdd: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  hasPermission: boolean; // Whether user has any permission for this page
}

const UserPermissionsPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [permissionRows, setPermissionRows] = useState<PermissionRow[]>([]);
  const [originalPermissionRows, setOriginalPermissionRows] = useState<
    PermissionRow[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [permissionSearchQuery, setPermissionSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<
    "view" | "create" | "edit" | "delete" | null
  >(null);
  const usersGridApi = useRef<any>(null);

  // Mock data for demonstration - Enhanced with more realistic data
  const mockUsers: User[] = [
    {
      userId: "1",
      firstName: "John",
      lastName: "Doe",
      userName: "john.doe",
      email: "john.doe@changepond.com",
      role: "Admin",
      changepondEmpId: 1001,
      phoneNumber: "1234567890",
    },
    {
      userId: "2",
      firstName: "Jane",
      lastName: "Smith",
      userName: "jane.smith",
      email: "jane.smith@changepond.com",
      role: "Engineer",
      changepondEmpId: 1002,
      phoneNumber: "1234567891",
    },
    {
      userId: "3",
      firstName: "Mike",
      lastName: "Johnson",
      userName: "mike.johnson",
      email: "mike.johnson@changepond.com",
      role: "Project Manager",
      changepondEmpId: 1003,
      phoneNumber: "1234567892",
    },
    {
      userId: "4",
      firstName: "Sarah",
      lastName: "Wilson",
      userName: "sarah.wilson",
      email: "sarah.wilson@changepond.com",
      role: "QC",
      changepondEmpId: 1004,
      phoneNumber: "1234567893",
    },
    {
      userId: "5",
      firstName: "David",
      lastName: "Brown",
      userName: "david.brown",
      email: "david.brown@changepond.com",
      role: "Engineer",
      changepondEmpId: 1005,
      phoneNumber: "1234567894",
    },
    {
      userId: "6",
      firstName: "Lisa",
      lastName: "Davis",
      userName: "lisa.davis",
      email: "lisa.davis@changepond.com",
      role: "QC",
      changepondEmpId: 1006,
      phoneNumber: "1234567895",
    },
  ];

  const mockPages: Page[] = [
    {
      pageId: 1,
      pageName: "Projects",
      description: "Project Management",
      isActive: true,
    },
    {
      pageId: 2,
      pageName: "Clarifications",
      description: "Clarification Management",
      isActive: true,
    },
    {
      pageId: 3,
      pageName: "Discrepancies",
      description: "Discrepancy Tracking",
      isActive: true,
    },
    {
      pageId: 4,
      pageName: "Users",
      description: "User Management",
      isActive: true,
    },
    {
      pageId: 5,
      pageName: "Time Management",
      description: "Time Tracking",
      isActive: true,
    },
    {
      pageId: 6,
      pageName: "Talent Management",
      description: "Talent Management",
      isActive: true,
    },
    {
      pageId: 7,
      pageName: "Divisions",
      description: "Division Master",
      isActive: true,
    },
    {
      pageId: 8,
      pageName: "Activities",
      description: "Activity Master",
      isActive: true,
    },
    {
      pageId: 9,
      pageName: "Products",
      description: "Product Master",
      isActive: true,
    },
    {
      pageId: 11,
      pageName: "Extra Resource Roles",
      description: "Extra Resource Roles Master",
      isActive: true,
    },
    {
      pageId: 12,
      pageName: "Resources",
      description: "Extra Resources Master",
      isActive: true,
    },
    {
      pageId: 13,
      pageName: "Error Categories",
      description: "Error Categories Master",
      isActive: true,
    },
    {
      pageId: 14,
      pageName: "Error Sub Categories",
      description: "Error Sub Categories Master",
      isActive: true,
    },
    {
      pageId: 15,
      pageName: "Drawing Descriptions",
      description: "Drawing Descriptions Master",
      isActive: true,
    },
  ];

  const mockUserPermissions: UserPermission[] = [
    // Admin - Full access to most pages
    {
      permissionId: 1,
      userId: "1",
      pageId: 1,
      pageName: "Projects",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: true,
    },
    {
      permissionId: 2,
      userId: "1",
      pageId: 2,
      pageName: "Clarifications",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: true,
    },
    {
      permissionId: 3,
      userId: "1",
      pageId: 3,
      pageName: "Discrepancies",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: true,
    },
    {
      permissionId: 4,
      userId: "1",
      pageId: 4,
      pageName: "Users",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: true,
    },
    {
      permissionId: 5,
      userId: "1",
      pageId: 7,
      pageName: "Divisions",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: true,
    },
    {
      permissionId: 6,
      userId: "1",
      pageId: 8,
      pageName: "Activities",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: true,
    },
    {
      permissionId: 7,
      userId: "1",
      pageId: 9,
      pageName: "Products",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: true,
    },

    // Engineer - Limited access
    {
      permissionId: 8,
      userId: "2",
      pageId: 1,
      pageName: "Projects",
      canAdd: false,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },
    {
      permissionId: 9,
      userId: "2",
      pageId: 2,
      pageName: "Clarifications",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },
    {
      permissionId: 10,
      userId: "2",
      pageId: 5,
      pageName: "Time Management",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },

    // Project Manager - Moderate access
    {
      permissionId: 11,
      userId: "3",
      pageId: 1,
      pageName: "Projects",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: true,
    },
    {
      permissionId: 12,
      userId: "3",
      pageId: 2,
      pageName: "Clarifications",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },
    {
      permissionId: 13,
      userId: "3",
      pageId: 3,
      pageName: "Discrepancies",
      canAdd: false,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },
    {
      permissionId: 14,
      userId: "3",
      pageId: 5,
      pageName: "Time Management",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },
    {
      permissionId: 15,
      userId: "3",
      pageId: 6,
      pageName: "Talent Management",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },

    // QC - Quality focused access
    {
      permissionId: 16,
      userId: "4",
      pageId: 3,
      pageName: "Discrepancies",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },
    {
      permissionId: 17,
      userId: "4",
      pageId: 1,
      pageName: "Projects",
      canAdd: false,
      canUpdate: false,
      canView: true,
      canDelete: false,
    },
    {
      permissionId: 18,
      userId: "4",
      pageId: 2,
      pageName: "Clarifications",
      canAdd: false,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },

    // Additional Engineer
    {
      permissionId: 19,
      userId: "5",
      pageId: 1,
      pageName: "Projects",
      canAdd: false,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },
    {
      permissionId: 20,
      userId: "5",
      pageId: 2,
      pageName: "Clarifications",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },

    // Additional QC
    {
      permissionId: 21,
      userId: "6",
      pageId: 3,
      pageName: "Discrepancies",
      canAdd: true,
      canUpdate: true,
      canView: true,
      canDelete: false,
    },
    {
      permissionId: 22,
      userId: "6",
      pageId: 1,
      pageName: "Projects",
      canAdd: false,
      canUpdate: false,
      canView: true,
      canDelete: false,
    },
  ];

  // Users Grid Column Definitions
  const usersColumnDefs: ColDef[] = [
    {
      field: "changepondEmpId",
      headerName: "Emp ID",
      width: 100,
      filter: "agNumberColumnFilter",
      sortable: true,
      cellClass: "font-medium text-purple-600",
    },
    {
      headerName: "Name",
      width: 200,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "font-semibold text-gray-900",
      valueGetter: (params: any) => {
        const firstName = params.data.firstName || "";
        const lastName = params.data.lastName || "";
        return `${firstName} ${lastName}`.trim() || params.data.userName;
      },
      cellRenderer: (params: any) => {
        const firstName = params.data.firstName || "";
        const lastName = params.data.lastName || "";
        const fullName = `${firstName} ${lastName}`.trim();
        const displayName = fullName || params.data.userName;

        return (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-medium">{displayName}</span>
          </div>
        );
      },
    },
    {
      field: "userName",
      headerName: "Username",
      width: 150,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "font-medium text-gray-700",
    },
    {
      field: "email",
      headerName: "Email",
      width: 220,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "text-gray-600",
    },
    {
      field: "role",
      headerName: "Role",
      width: 130,
      filter: "agTextColumnFilter",
      sortable: true,
      cellRenderer: (params: any) => {
        const role = params.value || "No Role";
        return (
          <Badge
            text={role}
            className={`text-xs ${
              role === "Admin"
                ? "bg-red-100 text-red-800"
                : role === "Project Manager"
                ? "bg-purple-100 text-purple-800"
                : role === "QC"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          />
        );
      },
    },
    {
      headerName: "Permissions",
      width: 120,
      cellRenderer: (params: any) => {
        const userPerms = userPermissions.filter(
          (p) => p.userId === params.data.userId
        );
        const isSelected = selectedUser?.userId === params.data.userId;
        return (
          <div className="flex items-center space-x-2">
            <Badge
              text={`${userPerms.length} pages`}
              className={
                isSelected
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }
            />
            {isSelected && <CheckCircle className="h-4 w-4 text-green-500" />}
          </div>
        );
      },
    },
  ];

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: false,
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
    rowHeight: 60,
    headerHeight: 48,
    suppressCellFocus: true,
    animateRows: true,
    enableRangeSelection: true,
    suppressRowClickSelection: true,
  };

  // Fetch data from API with fallback to mock data
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();

      if (response.success) {
        const transformedUsers = (response.data || []).map((user: any) => ({
          ...user,
          role:
            Array.isArray(user.roles) && user.roles.length > 0
              ? user.roles[0]
              : user.role || "No Role",
        }));

        setUsers(transformedUsers);
        setIsOnline(true);
        toast.success("Users loaded from server");
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (error) {
      console.warn("API unavailable, using mock data:", error);
      setUsers(mockUsers);
      setIsOnline(false);
      toast("Using offline data - API unavailable", {
        icon: "ℹ️",
        style: {
          background: "#3b82f6",
          color: "#ffffff",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchUsers();
    setPages(mockPages);
    setUserPermissions(mockUserPermissions);
    setSelectedUser(mockUsers[0]); // Select first user by default
  }, []);

  // Update permission rows when user or permissions change
  useEffect(() => {
    if (selectedUser) {
      const userPerms = userPermissions.filter(
        (p) => p.userId === selectedUser.userId
      );
      const rows: PermissionRow[] = pages.map((page) => {
        const permission = userPerms.find((p) => p.pageId === page.pageId);
        return {
          pageId: page.pageId,
          pageName: page.pageName,
          description: page.description,
          canView: permission?.canView || false,
          canAdd: permission?.canAdd || false,
          canUpdate: permission?.canUpdate || false,
          canDelete: permission?.canDelete || false,
          hasPermission: !!permission,
        };
      });
      setPermissionRows(rows);
      setOriginalPermissionRows(JSON.parse(JSON.stringify(rows)));
      setHasChanges(false);
      setSelectedRows(new Set());
    }
  }, [selectedUser, userPermissions, pages]);

  const onUsersGridReady = (params: any) => {
    usersGridApi.current = params.api;
    params.api.sizeColumnsToFit();
  };

  const handleUsersSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (usersGridApi.current) {
      usersGridApi.current.setQuickFilter(value);
    }
  }, []);

  const handleUserRowClick = (event: any) => {
    if (hasChanges) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to switch users? All unsaved changes will be lost."
      );
      if (!confirmed) return;
    }

    setSelectedUser(event.data);
    toast.success(
      `Selected user: ${event.data.firstName} ${event.data.lastName}`.trim() ||
        event.data.userName
    );
  };

  const handlePermissionToggle = (
    pageId: number,
    permissionType: "canView" | "canAdd" | "canUpdate" | "canDelete"
  ) => {
    setPermissionRows((prev) => {
      const updated = prev.map((row) => {
        if (row.pageId === pageId) {
          const newRow = { ...row, [permissionType]: !row[permissionType] };
          // Update hasPermission flag
          newRow.hasPermission =
            newRow.canView ||
            newRow.canAdd ||
            newRow.canUpdate ||
            newRow.canDelete;
          return newRow;
        }
        return row;
      });
      return updated;
    });
    setHasChanges(true);
  };

  const handleRowSelection = (pageId: number, isSelected: boolean) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(pageId);
      } else {
        newSet.delete(pageId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedRows(new Set(filteredPermissionRows.map((row) => row.pageId)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleBulkPermissionToggle = (
    permissionType: "canView" | "canAdd" | "canUpdate" | "canDelete",
    enable: boolean
  ) => {
    if (selectedRows.size === 0) {
      toast.error("Please select at least one page first");
      return;
    }

    setPermissionRows((prev) => {
      const updated = prev.map((row) => {
        if (selectedRows.has(row.pageId)) {
          const newRow = { ...row, [permissionType]: enable };
          // Update hasPermission flag
          newRow.hasPermission =
            newRow.canView ||
            newRow.canAdd ||
            newRow.canUpdate ||
            newRow.canDelete;
          return newRow;
        }
        return row;
      });
      return updated;
    });
    setHasChanges(true);
    toast.success(
      `${enable ? "Enabled" : "Disabled"} ${permissionType.replace(
        "can",
        ""
      )} permission for ${selectedRows.size} page(s)`
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedUser || !hasChanges) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update the userPermissions state
      const updatedPermissions = userPermissions.filter(
        (p) => p.userId !== selectedUser.userId
      );
      const newPermissions = permissionRows
        .filter((row) => row.hasPermission)
        .map((row, index) => ({
          permissionId:
            Math.max(...userPermissions.map((p) => p.permissionId), 0) +
            index +
            1,
          userId: selectedUser.userId,
          pageId: row.pageId,
          pageName: row.pageName,
          canAdd: row.canAdd,
          canUpdate: row.canUpdate,
          canView: row.canView,
          canDelete: row.canDelete,
          createdAt: new Date().toISOString(),
        }));

      setUserPermissions([...updatedPermissions, ...newPermissions]);
      setOriginalPermissionRows(JSON.parse(JSON.stringify(permissionRows)));
      setHasChanges(false);
      setSelectedRows(new Set());
      toast.success("Permissions updated successfully");
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Failed to save permissions");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscardChanges = () => {
    if (!hasChanges) return;

    const confirmed = window.confirm(
      "Are you sure you want to discard all changes?"
    );
    if (confirmed) {
      setPermissionRows(JSON.parse(JSON.stringify(originalPermissionRows)));
      setHasChanges(false);
      setSelectedRows(new Set());
      toast.info("Changes discarded");
    }
  };

  const handleExport = () => {
    if (!userPermissions.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const exportData = userPermissions.map((permission: UserPermission) => {
        const user = users.find((u) => u.userId === permission.userId);
        return {
          "User ID": permission.userId,
          "User Name": user
            ? `${user.firstName} ${user.lastName}`.trim() || user.userName
            : "Unknown",
          Email: user?.email || "Unknown",
          Role: user?.role || "Unknown",
          "Page ID": permission.pageId,
          "Page Name": permission.pageName,
          "Can View": permission.canView ? "Yes" : "No",
          "Can Add": permission.canAdd ? "Yes" : "No",
          "Can Update": permission.canUpdate ? "Yes" : "No",
          "Can Delete": permission.canDelete ? "Yes" : "No",
          "Created At": permission.createdAt || "Unknown",
        };
      });

      exportToExcel(exportData, {
        format: "excel",
        includeFields: Object.keys(exportData[0] || {}),
      });

      toast.success("Export successful");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const handleRefresh = () => {
    fetchUsers();
    toast.success("Data refreshed");
  };

  const getUserDisplayName = (user: User) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return fullName || user.userName;
  };

  // Filter permission rows based on search
  const filteredPermissionRows = permissionRows.filter(
    (row) =>
      row.pageName
        .toLowerCase()
        .includes(permissionSearchQuery.toLowerCase()) ||
      (row.description &&
        row.description
          .toLowerCase()
          .includes(permissionSearchQuery.toLowerCase()))
  );

  // Calculate statistics
  const totalPermissions = userPermissions.length;
  const usersWithPermissions = new Set(userPermissions.map((p) => p.userId))
    .size;
  const averagePermissionsPerUser =
    usersWithPermissions > 0
      ? (totalPermissions / usersWithPermissions).toFixed(1)
      : "0";

  const selectedUserPermissionCount = selectedUser
    ? permissionRows.filter((row) => row.hasPermission).length
    : 0;

  const allSelected =
    selectedRows.size === filteredPermissionRows.length &&
    filteredPermissionRows.length > 0;
  const someSelected =
    selectedRows.size > 0 && selectedRows.size < filteredPermissionRows.length;

  return (
    <AppLayout title="User Permissions">
      <div className="space-y-6">
        {/* Status Banner */}
        {!isOnline && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center">
              <WifiOff className="h-5 w-5 text-yellow-400 mr-2" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Offline Mode
                </h3>
                <p className="text-sm text-yellow-700">
                  API is unavailable. Using mock data for demonstration. Changes
                  will not persist.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={handleRefresh}
              >
                Retry Connection
              </Button>
            </div>
          </div>
        )}

        {/* Header Info */}
        <Card>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  User Permission Management System
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Manage granular user permissions for different pages and
                    actions. Select a user from the list below to view and
                    manage their specific permissions in a tabular format.
                  </p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>
                        <strong>View:</strong> Read-only access to page content
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4 text-blue-600" />
                      <span>
                        <strong>Create:</strong> Add new items or records
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Edit2 className="h-4 w-4 text-yellow-600" />
                      <span>
                        <strong>Edit:</strong> Modify existing items
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trash2 className="h-4 w-4 text-red-600" />
                      <span>
                        <strong>Delete:</strong> Remove items permanently
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isOnline ? (
                        <Wifi className="h-4 w-4 text-green-600" />
                      ) : (
                        <WifiOff className="h-4 w-4 text-yellow-600" />
                      )}
                      <span>
                        <strong>Status:</strong>{" "}
                        {isOnline ? "Connected to API" : "Using mock data"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <Users className="mx-auto h-8 w-8 mb-2 text-blue-100" />
              <p className="text-sm font-medium text-blue-100">Total Users</p>
              <p className="mt-2 text-3xl font-semibold">{users.length}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <Shield className="mx-auto h-8 w-8 mb-2 text-green-100" />
              <p className="text-sm font-medium text-green-100">
                Total Permissions
              </p>
              <p className="mt-2 text-3xl font-semibold">{totalPermissions}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <Settings className="mx-auto h-8 w-8 mb-2 text-purple-100" />
              <p className="text-sm font-medium text-purple-100">
                Available Pages
              </p>
              <p className="mt-2 text-3xl font-semibold">{pages.length}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="text-center">
              <Eye className="mx-auto h-8 w-8 mb-2 text-orange-100" />
              <p className="text-sm font-medium text-orange-100">
                Avg Permissions
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {averagePermissionsPerUser}
              </p>
            </div>
          </Card>
        </div>

        {/* Users List */}
        <Card
          title={`Users (${users.length})`}
          subtitle="Select a user to manage their permissions"
          headerRight={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <SearchBar
              value={searchQuery}
              onChange={handleUsersSearchChange}
              placeholder="Search users by name, email, or role..."
              className="max-w-md"
            />

            <div className="ag-theme-alpine w-full h-[300px]">
              <AgGridReact
                rowData={users}
                columnDefs={usersColumnDefs}
                defaultColDef={defaultColDef}
                gridOptions={gridOptions}
                onGridReady={onUsersGridReady}
                onRowClicked={handleUserRowClick}
                rowClass="cursor-pointer hover:bg-gray-50"
                loading={loading}
                loadingOverlayComponent={"Loading..."}
                loadingOverlayComponentParams={{
                  loadingMessage: "Loading users...",
                }}
              />
            </div>
          </div>
        </Card>

        {/* Selected User Info */}
        {selectedUser && (
          <Card>
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {getUserDisplayName(selectedUser).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-green-800">
                      Managing Permissions for:{" "}
                      {getUserDisplayName(selectedUser)}
                    </h3>
                    <p className="text-sm text-green-700">
                      {selectedUser.email} • {selectedUser.role} • Employee ID:{" "}
                      {selectedUser.changepondEmpId} •{" "}
                      {selectedUserPermissionCount} permissions
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge
                    text={selectedUser.role}
                    className={`${
                      selectedUser.role === "Admin"
                        ? "bg-red-100 text-red-800"
                        : selectedUser.role === "Project Manager"
                        ? "bg-purple-100 text-purple-800"
                        : selectedUser.role === "QC"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  />
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Permissions Table */}
        {selectedUser && (
          <Card
            title={`Permissions for ${getUserDisplayName(
              selectedUser
            )} (${selectedUserPermissionCount}/${pages.length})`}
            subtitle="Toggle permissions for each page and action type"
            headerRight={
              <div className="flex items-center space-x-2">
                {hasChanges && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<RotateCcw className="h-4 w-4" />}
                      onClick={handleDiscardChanges}
                      disabled={isSubmitting}
                    >
                      Discard
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={<Save className="h-4 w-4" />}
                      onClick={handleSaveChanges}
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    >
                      {isSubmitting ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  icon={<FileDown className="h-4 w-4" />}
                  onClick={handleExport}
                >
                  Export
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              {/* Search and Bulk Actions */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <SearchBar
                  value={permissionSearchQuery}
                  onChange={setPermissionSearchQuery}
                  placeholder="Search pages by name..."
                  className="max-w-md"
                />

                {/* Bulk Actions */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedRows.size > 0 && `${selectedRows.size} selected`}
                  </span>
                  {selectedRows.size > 0 && (
                    <>
                      <div className="w-px h-4 bg-gray-300" />
                      <span className="text-sm font-medium text-gray-700">
                        Bulk Actions:
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleBulkPermissionToggle("canView", true)
                        }
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        Enable View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleBulkPermissionToggle("canAdd", true)
                        }
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Enable Create
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleBulkPermissionToggle("canUpdate", true)
                        }
                        className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                      >
                        Enable Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleBulkPermissionToggle("canDelete", true)
                        }
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        Enable Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Permissions Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(input) => {
                              if (input) input.indeterminate = someSelected;
                            }}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Page Name</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center justify-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center justify-center space-x-1">
                          <Plus className="h-4 w-4" />
                          <span>Create</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center justify-center space-x-1">
                          <Edit2 className="h-4 w-4" />
                          <span>Edit</span>
                        </div>
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center justify-center space-x-1">
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPermissionRows.map((row) => (
                      <tr
                        key={row.pageId}
                        className={`hover:bg-gray-50 transition-colors ${
                          selectedRows.has(row.pageId) ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedRows.has(row.pageId)}
                              onChange={(e) =>
                                handleRowSelection(row.pageId, e.target.checked)
                              }
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {row.pageName}
                              </span>
                              {row.hasPermission && (
                                <div
                                  className="w-2 h-2 bg-green-500 rounded-full"
                                  title="Has permissions"
                                />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {row.description || "No description"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={row.canView}
                              onChange={() =>
                                handlePermissionToggle(row.pageId, "canView")
                              }
                              className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={row.canAdd}
                              onChange={() =>
                                handlePermissionToggle(row.pageId, "canAdd")
                              }
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={row.canUpdate}
                              onChange={() =>
                                handlePermissionToggle(row.pageId, "canUpdate")
                              }
                              className="h-5 w-5 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                            />
                          </label>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={row.canDelete}
                              onChange={() =>
                                handlePermissionToggle(row.pageId, "canDelete")
                              }
                              className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Bulk Disable Actions */}
              {selectedRows.size > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedRows.size} page(s) selected
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        Bulk Disable:
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleBulkPermissionToggle("canView", false)
                        }
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      >
                        Disable View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleBulkPermissionToggle("canAdd", false)
                        }
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      >
                        Disable Create
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleBulkPermissionToggle("canUpdate", false)
                        }
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      >
                        Disable Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleBulkPermissionToggle("canDelete", false)
                        }
                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                      >
                        Disable Delete
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* No Results */}
              {filteredPermissionRows.length === 0 && (
                <div className="text-center py-12">
                  <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No pages found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search criteria
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* No User Selected */}
        {!selectedUser && (
          <Card>
            <div className="text-center py-12">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Select a User
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a user from the list above to manage their permissions
              </p>
            </div>
          </Card>
        )}

        {/* Changes Indicator */}
        {hasChanges && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Unsaved Changes
                  </p>
                  <p className="text-xs text-yellow-700">
                    You have unsaved permission changes
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardChanges}
                    disabled={isSubmitting}
                  >
                    Discard
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={isSubmitting}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default UserPermissionsPage;
