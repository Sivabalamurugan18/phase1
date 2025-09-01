import React, { useState, useCallback, useRef, useEffect } from "react";
import AppLayout from "../../components/layouts/AppLayout";
import OptimizedSearchBar from "../../components/ui/OptimizedSearchBar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef } from "ag-grid-community";
import {
  Plus,
  RefreshCw,
  FileDown,
  Wifi,
  WifiOff,
  Edit2,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  Shield,
  Brain,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToExcel } from "../../utils/export";
import { userService } from "../../services/apiService";
import { User, Role } from "../../types";
import UserModal from "./components/UserModal";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import Badge from "../../components/ui/Badge";
import SearchBar from "../../components/ui/SearchBar";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const gridApi = useRef<any>(null);

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (user.firstName && user.firstName.toLowerCase().includes(query)) ||
      (user.lastName && user.lastName.toLowerCase().includes(query)) ||
      user.userName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  const columnDefs: ColDef[] = [
    {
      field: "userId",
      headerName: "User ID",
      width: 120,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "font-medium text-blue-600",
      hide: true,
    },
    {
      field: "changepondEmpId",
      headerName: "Emp ID",
      width: 100,
      filter: "agNumberColumnFilter",
      sortable: true,
      cellClass: "font-medium text-purple-600",
      valueGetter: (params: any) => {
        const empId = params.data.changepondEmpId;
        console.log('Employee ID for user:', params.data.userName, 'Value:', empId, 'Type:', typeof empId);
        return empId;
      },
      cellRenderer: (params: any) => {
        const empId = params.data.changepondEmpId;
        console.log('Rendering Emp ID:', empId, 'Type:', typeof empId);
        return empId && empId !== 0 ? empId.toString() : "Not Set";
      },
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
      width: 180,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "font-medium text-gray-700",
    },
    {
      field: "email",
      headerName: "Email",
      width: 250,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "text-gray-600",
    },
    {
      field: "phoneNumber",
      headerName: "Phone",
      width: 140,
      filter: "agTextColumnFilter",
      sortable: true,
      cellRenderer: (params: any) => params.value || "Not provided",
    },
    {
      field: "role",
      headerName: "Role",
      width: 150,
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
      headerName: "Actions",
      width: 120,
      cellRenderer: (params: any) => (
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(params.data);
            }}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Edit User"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.data);
            }}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
            title="Delete User"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 25,
    rowHeight: 60,
    headerHeight: 48,
    suppressCellFocus: true,
    animateRows: true,
    enableRangeSelection: true,
    suppressRowClickSelection: true,
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const response = await userService.getAll();

      if (response.success) {
        // Transform API response to ensure consistent role format
        const transformedUsers = (response.data || []).map((user: any) => ({
          ...user,
          // Convert roles array to single role if needed
          role: Array.isArray(user.roles) && user.roles.length > 0 
            ? user.roles[0] 
            : user.role || "No Role"
        }));
        
        setUsers(transformedUsers);
        setIsOnline(true);
        toast.success("Users loaded from server");
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
      setIsOnline(false);
      toast.error("Failed to load users from server");
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await userService.getRoles();

      if (response.success) {
        setRoles(response.data || []);
      } else {
        throw new Error("Failed to fetch roles");
      }
    } catch (error) {
      console.error("Failed to fetch roles:", error);
      setRoles([]);
      toast.error("Failed to load roles from server");
    }
  };

  const onGridReady = (params: any) => {
    gridApi.current = params.api;
    params.api.sizeColumnsToFit();
    fetchUsers();
    fetchRoles();
  };

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (gridApi.current) {
        gridApi.current.setQuickFilter(value);
      }
    },
    []
  );

  const handleAdd = () => {
    setSelectedUser(null);
    setShowAddModal(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleRowClick = (event: any) => {
    handleEdit(event.data);
  };

  const handleSubmit = async (formData: Omit<User, "userId">) => {
    setIsSubmitting(true);

    try {
      // Ensure changepondEmpId is properly converted to number
      const userData = {
        ...formData,
        changepondEmpId: typeof formData.changepondEmpId === 'string' 
          ? parseInt(formData.changepondEmpId) || 0 
          : formData.changepondEmpId
      };

      if (selectedUser) {
        // Update existing user
        const response = await userService.update(selectedUser.userId, userData);

        if (!response.success) {
          throw new Error("Failed to update user");
        }

        toast.success("User updated successfully");
      } else {
        // Create new user
        const response = await userService.register(userData);

        if (!response.success) {
          throw new Error("Failed to create user");
        }

        toast.success("User registered successfully");
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error(
        `Failed to ${selectedUser ? "update" : "create"} user: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);

    try {
      const response = await userService.delete(selectedUser.userId);

      if (!response.success) {
        throw new Error("Failed to delete user");
      }

      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!users.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const displayedRows = gridApi.current
        ? gridApi.current.getModel().rowsToDisplay.map((row: any) => row.data)
        : users;

      const exportData = displayedRows.map((user: User) => ({
        "User ID": user.userId,
        "Employee ID": user.changepondEmpId,
        "First Name": user.firstName || "",
        "Last Name": user.lastName || "",
        "Username": user.userName,
        "Email": user.email,
        "Phone Number": user.phoneNumber || "",
        "Role": user.role,
      }));

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
    fetchRoles();
  };

  const getUserDisplayName = (user: User) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return fullName || user.userName;
  };

  return (
    <AppLayout title="User Management">
      <div className="space-y-6">
        {/* Status Banner */}
        {!isOnline && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <WifiOff className="h-5 w-5 text-red-400 mr-2" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  API Connection Failed
                </h3>
                <p className="text-sm text-red-700">
                  Unable to connect to the server. Please check your connection and try again.
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

        {/* Controls */}
        <Card>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search users..."
              className="sm:w-1/3"
            />
            <div className="flex-grow"></div>
            <div className="flex items-center space-x-2">
              {isOnline && (
                <div className="flex items-center text-green-600 text-sm">
                  <Wifi className="h-4 w-4 mr-1" />
                  Online
                </div>
              )}
              <Button
                variant="outline"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={handleRefresh}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                icon={<FileDown className="h-4 w-4" />}
                onClick={handleExport}
              >
                Export
              </Button>
              <Button
                variant="primary"
                icon={<UserPlus className="h-4 w-4" />}
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Add User
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <UsersIcon className="mx-auto h-8 w-8 mb-2 text-blue-100" />
              <p className="text-sm font-medium text-blue-100">Total Users</p>
              <p className="mt-2 text-3xl font-semibold">{users.length}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <Shield className="mx-auto h-8 w-8 mb-2 text-purple-100" />
              <p className="text-sm font-medium text-purple-100">Admins</p>
              <p className="mt-2 text-3xl font-semibold">
                {users.filter((u) => u.role === "Admin").length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <Brain className="mx-auto h-8 w-8 mb-2 text-green-100" />
              <p className="text-sm font-medium text-green-100">Engineers</p>
              <p className="mt-2 text-3xl font-semibold">
                {users.filter((u) => u.role === "Engineer").length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="text-center">
              <UsersIcon className="mx-auto h-8 w-8 mb-2 text-orange-100" />
              <p className="text-sm font-medium text-orange-100">Active Roles</p>
              <p className="mt-2 text-3xl font-semibold">{roles.length}</p>
            </div>
          </Card>
        </div>

        {/* Users Table */}
        <Card
          title={`Users (${filteredUsers.length})`}
          subtitle="Manage user accounts and permissions"
        >
          <div className="ag-theme-alpine w-full h-[600px]">
            <AgGridReact
              rowData={filteredUsers}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              onGridReady={onGridReady}
              onRowClicked={handleRowClick}
              rowClass="cursor-pointer hover:bg-gray-50"
              loading={loading}
              loadingOverlayComponent={"Loading..."}
              loadingOverlayComponentParams={{
                loadingMessage: "Loading users...",
              }}
            />
          </div>
        </Card>

        {/* Add User Modal */}
        <UserModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleSubmit}
          onCancel={() => !isSubmitting && setShowAddModal(false)}
          roles={roles}
          isSubmitting={isSubmitting}
        />

        {/* Edit User Modal */}
        <UserModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleSubmit}
          onCancel={() => !isSubmitting && setShowEditModal(false)}
          user={selectedUser}
          roles={roles}
          isSubmitting={isSubmitting}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          userName={selectedUser ? getUserDisplayName(selectedUser) : ""}
          isDeleting={isSubmitting}
        />
      </div>
    </AppLayout>
  );
};

export default UsersPage;