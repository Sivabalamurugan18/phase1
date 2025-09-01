import React, { useState, useCallback, useRef, useEffect } from "react";
import AppLayout from "../../../components/layouts/AppLayout";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import SearchBar from "../../../components/ui/SearchBar";
import Modal from "../../../components/ui/Modal";
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
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToExcel } from "../../../utils/export";
import {
  resourceService,
  resourceRoleService,
} from "../../../services/masterServices";
import { Resource, ResourceRole } from "../../../types/masters";
import ResourceForm from "./components/ResourceForm";
import DeleteResourceModal from "./components/DeleteResourceModal";

const ExtraResourcesMaster: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceRoles, setResourceRoles] = useState<ResourceRole[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const gridApi = useRef<any>(null);

  const columnDefs: ColDef[] = [
    {
      field: "resourceId",
      headerName: "ID",
      width: 80,
      filter: "agNumberColumnFilter",
      sortable: true,
      cellClass: "font-medium text-blue-600",
      hide: true,
    },
    {
      field: "resourceName",
      headerName: "Resource Name",
      width: 250,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "font-semibold text-gray-900",
    },
    {
      field: "resourceRoleName",
      headerName: "Role",
      width: 200,
      filter: "agTextColumnFilter",
      sortable: true,
      cellRenderer: (params: any) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          {params.data.resourceRoleName || "N/A"}
        </span>
      ),
    },
    {
      field: "isLive",
      headerName: "Status",
      width: 120,
      filter: "agTextColumnFilter",
      sortable: true,
      cellRenderer: (params: any) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            params.value
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {params.value ? "Active" : "Inactive"}
        </span>
      ),
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
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            title="Edit Resource"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.data);
            }}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Delete Resource"
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

  const fetchResourceRoles = async () => {
    try {
      const response = await resourceRoleService.getAll();
      if (response.success) {
        setResourceRoles(response.data || []);
      } else {
        throw new Error("Failed to fetch resource roles");
      }
    } catch (error) {
      console.warn("API unavailable for resource roles:", error);
      setResourceRoles([]);
    }
  };

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await resourceService.getAll();

      if (response.success) {
        setResources(response.data || []);
        setIsOnline(true);
        setUsingMockData(false);
        toast.success("Resources loaded from server");
      } else {
        throw new Error("Failed to fetch resources");
      }
    } catch (error) {
      console.warn("API unavailable, no data available:", error);
      setResources([]);
      setIsOnline(false);
      setUsingMockData(true);
      toast("No data available - API unavailable", {
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

  const onGridReady = (params: any) => {
    gridApi.current = params.api;
    fetchResourceRoles();
    fetchResources();
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (gridApi.current) {
      gridApi.current.setQuickFilter(value);
    }
  }, []);

  const handleAdd = () => {
    setSelectedResource(null);
    setShowAddForm(true);
  };

  const handleEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setShowEditForm(true);
  };

  const handleDelete = (resource: Resource) => {
    setSelectedResource(resource);
    setShowDeleteModal(true);
  };

  const handleRowClick = (event: any) => {
    handleEdit(event.data);
  };

  const handleSubmit = async (formData: Omit<Resource, "resourceId">) => {
    setIsSubmitting(true);

    try {
      if (usingMockData) {
        if (selectedResource) {
          const updatedResource = { ...selectedResource, ...formData };
          setResources(
            resources.map((r) =>
              r.resourceId === selectedResource.resourceId ? updatedResource : r
            )
          );
          toast.success("Resource updated successfully (offline mode)");
        } else {
          const newResource: Resource = {
            ...formData,
            resourceId: Math.max(...resources.map((r) => r.resourceId), 0) + 1,
          };
          setResources([...resources, newResource]);
          toast.success("Resource added successfully (offline mode)");
        }
        setShowAddForm(false);
        setShowEditForm(false);
        setSelectedResource(null);
        return;
      }

      if (selectedResource) {
        const response = await resourceService.update(
          selectedResource.resourceId,
          formData
        );

        if (!response.success) {
          throw new Error("Failed to update resource");
        }

        toast.success("Resource updated successfully");
      } else {
        const response = await resourceService.create(formData);

        if (!response.success) {
          throw new Error("Failed to create resource");
        }

        toast.success("Resource created successfully");
      }

      setShowAddForm(false);
      setShowEditForm(false);
      setSelectedResource(null);
      fetchResources();
    } catch (error) {
      console.error("Error saving resource:", error);
      toast.error(
        `Failed to ${selectedResource ? "update" : "create"} resource`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedResource) return;

    setIsSubmitting(true);

    try {
      if (usingMockData) {
        setResources(
          resources.map((r) =>
            r.resourceId === selectedResource.resourceId
              ? { ...r, isLive: false }
              : r
          )
        );
        toast.success("Resource deactivated successfully (offline mode)");
        setShowDeleteModal(false);
        setSelectedResource(null);
        return;
      }

      const updateData = {
        ResourceName: selectedResource.resourceName,
        ResourceRoleName: selectedResource.resourceRoleName,
        isLive: false,
      };

      const response = await resourceService.update(
        selectedResource.resourceId,
        updateData
      );

      if (!response.success) {
        throw new Error("Failed to deactivate resource");
      }

      toast.success("Resource deactivated successfully");
      setShowDeleteModal(false);
      setSelectedResource(null);
      fetchResources();
    } catch (error) {
      console.error("Error deactivating resource:", error);
      toast.error("Failed to deactivate resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!resources.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const displayedRows = gridApi.current
        ? gridApi.current.getModel().rowsToDisplay.map((row: any) => row.data)
        : resources;

      const exportData = displayedRows.map((resource: Resource) => ({
        "Resource ID": resource.resourceId,
        "Resource Name": resource.resourceName,
        Role: resource.resourceRoleName || "N/A",
        Status: resource.isLive ? "Active" : "Inactive",
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
    fetchResources();
    fetchResourceRoles();
  };

  const filteredResources = resources.filter(
    (resource) =>
      resource.resourceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (resource.resourceRoleName &&
        resource.resourceRoleName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );

  return (
    <AppLayout title="Extra Resources Master">
      <div className="space-y-6">
        {/* Status Banner */}
        {usingMockData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex items-center">
              <WifiOff className="h-5 w-5 text-yellow-400 mr-2" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Offline Mode
                </h3>
                <p className="text-sm text-yellow-700">
                  API is unavailable. No data available for demonstration.
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
              placeholder="Search resources..."
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
                icon={<Plus className="h-4 w-4" />}
                onClick={handleAdd}
              >
                New Resource
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <Users className="mx-auto h-8 w-8 mb-2 text-blue-100" />
              <p className="text-sm font-medium text-blue-100">
                Total Resources
              </p>
              <p className="mt-2 text-3xl font-semibold">{resources.length}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <Users className="mx-auto h-8 w-8 mb-2 text-green-100" />
              <p className="text-sm font-medium text-green-100">Active</p>
              <p className="mt-2 text-3xl font-semibold">
                {resources.filter((r) => r.isLive).length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="text-center">
              <Users className="mx-auto h-8 w-8 mb-2 text-red-100" />
              <p className="text-sm font-medium text-red-100">Inactive</p>
              <p className="mt-2 text-3xl font-semibold">
                {resources.filter((r) => !r.isLive).length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <Users className="mx-auto h-8 w-8 mb-2 text-purple-100" />
              <p className="text-sm font-medium text-purple-100">
                Available Roles
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {resourceRoles.filter((r) => r.isLive).length}
              </p>
            </div>
          </Card>
        </div>

        {/* Resources Table */}
        <Card
          title={`Resources (${filteredResources.length})`}
          subtitle="Manage resource assignments and roles"
        >
          <div className="ag-theme-alpine w-full h-[600px]">
            <AgGridReact
              rowData={filteredResources}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              onGridReady={onGridReady}
              onRowClicked={handleRowClick}
              rowClass="cursor-pointer hover:bg-gray-50"
              loading={loading}
              loadingOverlayComponent={"Loading..."}
              loadingOverlayComponentParams={{
                loadingMessage: "Loading resources...",
              }}
            />
          </div>
        </Card>

        {/* Add Resource Modal */}
        <Modal
          isOpen={showAddForm}
          onClose={() => !isSubmitting && setShowAddForm(false)}
          title={
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <span>Add New Resource</span>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          }
          size="md"
        >
          <ResourceForm
            roles={resourceRoles}
            onSubmit={handleSubmit}
            onCancel={() => !isSubmitting && setShowAddForm(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Edit Resource Modal */}
        <Modal
          isOpen={showEditForm}
          onClose={() => !isSubmitting && setShowEditForm(false)}
          title={
            <div className="flex items-center space-x-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              <span>Edit Resource</span>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          }
          size="md"
        >
          <ResourceForm
            resource={selectedResource}
            roles={resourceRoles}
            onSubmit={handleSubmit}
            onCancel={() => !isSubmitting && setShowEditForm(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteResourceModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          resourceName={selectedResource?.resourceName || ""}
          isDeleting={isSubmitting}
        />
      </div>
    </AppLayout>
  );
};

export default ExtraResourcesMaster;
