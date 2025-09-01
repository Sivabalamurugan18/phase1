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
} from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToExcel } from "../../../utils/export";
import config from "../../../config";
import ActivityForm from "./components/ActivityForm";
import DeleteActivityModal from "./components/DeleteActivityModal";

interface Activity {
  activityId: number;
  activityName: string;
  order: number;
  divisionId: number;
  division?: {
    divisionId: number;
    divisionName: string;
  };
  isLive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Division {
  divisionId: number;
  divisionName: string;
  description: string;
  isLive: boolean;
}

const ActivitiesMaster: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
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
      field: "activityId",
      headerName: "ID",
      width: 80,
      filter: "agNumberColumnFilter",
      sortable: true,
      cellClass: "font-medium text-blue-600",
      hide: true,
    },
    {
      field: "activityName",
      headerName: "Activity Name",
      width: 250,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "font-semibold text-gray-900",
    },
    {
      field: "order",
      headerName: "Sequence",
      width: 150,
      filter: "agNumberColumnFilter",
      sortable: true,
      cellClass: "font-medium text-center",
    },
    {
      field: "division.divisionName",
      headerName: "Division",
      width: 150,
      filter: "agTextColumnFilter",
      sortable: true,
      cellRenderer: (params: any) => {
        console.log('Cell renderer params:', params);
        console.log('Activity data in cell:', params.data);
        
        const divisionName = params.data.division?.divisionName;
        if (divisionName) {
          return (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {divisionName}
            </span>
          );
        }
        
        // Fallback: try to find division by divisionId if division object is missing
        const division = divisions.find(d => d.divisionId === params.data.divisionId);
        if (division) {
          return (
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {division.divisionName}
            </span>
          );
        }
        
        console.log('No division found for activity:', params.data);
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            N/A
          </span>
        );
      },
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
      field: "createdAt",
      headerName: "Created",
      width: 140,
      filter: "agDateColumnFilter",
      sortable: true,
      cellRenderer: (params: any) =>
        params.value ? new Date(params.value).toLocaleDateString() : "N/A",
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
            title="Edit Activity"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.data);
            }}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Delete Activity"
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

  const fetchDivisions = async () => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/Divisions/GetAll`,
        {
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {

        const data = await response.json();
        console.log('Raw divisions data:', data);

        // Transform API data to handle both islive and isLive fields
        const transformedData = (data || []).map((division: any) => {
          console.log('Division fields:', Object.keys(division));
          console.log('Division data:', division);
          
          return {
            ...division,
            isLive: division.isLive !== undefined ? division.isLive : division.islive
          };
        });

        console.log('Transformed divisions:', transformedData);
        setDivisions(transformedData);
        return transformedData;

      }  else {
        throw new Error("Failed to fetch divisions");
      }
    } catch (error) {
      console.warn("API unavailable for divisions, no data available:", error);
      setDivisions([]);
      return [];
    }
  };

  const fetchActivities = async (divisionsData?: Division[]) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${config.API_BASE_URL}/api/Activities/GetAll`,
        {
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      
      // Transform activities data to include division information
      const divisionsToUse = divisionsData || divisions;
      console.log('Raw activities data:', data);
      console.log('Available divisions:', divisionsToUse);
      
      const transformedActivities = (data || []).map((activity: any) => {
        console.log('Activity fields:', Object.keys(activity));
        console.log('Activity data:', activity);
        
        // Check for different possible field names for divisionId
        const divisionId = activity.divisionId || activity.division_id || activity.DivisionId || activity.Division_ID;
        console.log('Found divisionId:', divisionId);
        
        const division = divisionsToUse.find(d => d.divisionId === divisionId);
        console.log(`Activity ${activity.activityId}: divisionId=${divisionId}, found division:`, division);
        
        return {
          ...activity,
          divisionId: divisionId, // Ensure consistent field name
          division: division || null
        };
      });
      
      console.log('Transformed activities:', transformedActivities);
      setActivities(transformedActivities);
      setIsOnline(true);
      setUsingMockData(false);
      toast.success("Activities loaded from server");
    } catch (error) {
      console.warn("API unavailable, no data available:", error);
      setActivities([]);
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

  const onGridReady = async (params: any) => {
    gridApi.current = params.api;
    const divisionsData = await fetchDivisions();
    await fetchActivities(divisionsData);
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (gridApi.current) {
      gridApi.current.setQuickFilter(value);
    }
  }, []);

  const handleAdd = () => {
    setSelectedActivity(null);
    setShowAddForm(true);
  };

  const handleEdit = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowEditForm(true);
  };

  const handleDelete = (activity: Activity) => {
    setSelectedActivity(activity);
    setShowDeleteModal(true);
  };

  const handleRowClick = (event: any) => {
    handleEdit(event.data);
  };

  const handleSubmit = async (formData: Omit<Activity, "activityId">) => {
    setIsSubmitting(true);

    try {
      if (usingMockData) {
        // Simulate API call for local data
        if (selectedActivity) {
          // Update existing
          const updatedActivity = { ...selectedActivity, ...formData };
          setActivities(
            activities.map((a) =>
              a.activityId === selectedActivity.activityId ? updatedActivity : a
            )
          );
          toast.success("Activity updated successfully (offline mode)");
        } else {
          // Add new
          const newActivity: Activity = {
            ...formData,
            activityId: Math.max(...activities.map((a) => a.activityId), 0) + 1,
            division: divisions.find(
              (d) => d.divisionId === formData.divisionId
            ),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          setActivities([...activities, newActivity]);
          toast.success("Activity added successfully (offline mode)");
        }
        setShowAddForm(false);
        setShowEditForm(false);
        setSelectedActivity(null);
        return;
      }

      // Real API calls
      if (selectedActivity) {
        // Update existing activity
        const response = await fetch(
          `${config.API_BASE_URL}/api/Activities/${selectedActivity.activityId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              activityId: selectedActivity.activityId,
              ...formData,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update activity");
        }

        toast.success("Activity updated successfully");
      } else {
        // Create new activity
        const response = await fetch(`${config.API_BASE_URL}/api/Activities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to create activity");
        }

        toast.success("Activity created successfully");
      }

      setShowAddForm(false);
      setShowEditForm(false);
      setSelectedActivity(null);
      await fetchActivities();
    } catch (error) {
      console.error("Error saving activity:", error);
      toast.error(
        `Failed to ${selectedActivity ? "update" : "create"} activity`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedActivity) return;

    setIsSubmitting(true);

    try {
      if (usingMockData) {
        // Simulate deletion for local data
        setActivities(
          activities.map((a) =>
            a.activityId === selectedActivity.activityId
              ? { ...a, isLive: false }
              : a
          )
        );
        toast.success("Activity deactivated successfully (offline mode)");
        setShowDeleteModal(false);
        setSelectedActivity(null);
        return;
      }

      // Real API call - set isLive to false
      const response = await fetch(
        `${config.API_BASE_URL}/api/Activities/${selectedActivity.activityId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...selectedActivity,
            isLive: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to deactivate activity");
      }

      toast.success("Activity deactivated successfully");
      setShowDeleteModal(false);
      setSelectedActivity(null);
      await fetchActivities();
    } catch (error) {
      console.error("Error deactivating activity:", error);
      toast.error("Failed to deactivate activity");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!activities.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const displayedRows = gridApi.current
        ? gridApi.current.getModel().rowsToDisplay.map((row: any) => row.data)
        : activities;

      const exportData = displayedRows.map((activity: Activity) => ({
        "Activity ID": activity.activityId,
        "Activity Name": activity.activityName,
        Order: activity.order,
        Division: activity.division?.divisionName || "N/A",
        "Division ID": activity.divisionId,
        Status: activity.isLive ? "Active" : "Inactive",
        "Created Date": activity.createdAt
          ? new Date(activity.createdAt).toLocaleDateString()
          : "N/A",
        "Updated Date": activity.updatedAt
          ? new Date(activity.updatedAt).toLocaleDateString()
          : "N/A",
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

  const handleRefresh = async () => {
    const divisionsData = await fetchDivisions();
    await fetchActivities(divisionsData);
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.activityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.division?.divisionName
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Activities Master">
      <div className="space-y-6">
        {/* Controls */}
        <Card>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search activities..."
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
                New Activity
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-100">
                Total Activities
              </p>
              <p className="mt-2 text-3xl font-semibold">{activities.length}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-green-100">Active</p>
              <p className="mt-2 text-3xl font-semibold">
                {activities.filter((a) => a.isLive).length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-red-100">Inactive</p>
              <p className="mt-2 text-3xl font-semibold">
                {activities.filter((a) => !a.isLive).length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-purple-100">Divisions</p>
              <p className="mt-2 text-3xl font-semibold">
                {divisions.filter((d) => d.isLive).length}
              </p>
            </div>
          </Card>
        </div>

        {/* Activities Table */}
        <Card
          title={`Activities (${filteredActivities.length})`}
          subtitle="Manage division-based activities and their order"
        >
          <div className="ag-theme-alpine w-full h-[600px]">
            <AgGridReact
              rowData={filteredActivities}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              onGridReady={onGridReady}
              onRowClicked={handleRowClick}
              rowClass="cursor-pointer hover:bg-gray-50"
              loading={loading}
              loadingOverlayComponent={"Loading..."}
              loadingOverlayComponentParams={{
                loadingMessage: "Loading activities...",
              }}
            />
          </div>
        </Card>

        {/* Add Activity Modal */}
        <Modal
          isOpen={showAddForm}
          onClose={() => !isSubmitting && setShowAddForm(false)}
          title={
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <span>Add New Activity</span>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          }
          size="md"
        >
          <ActivityForm
            divisions={divisions}
            onSubmit={handleSubmit}
            onCancel={() => !isSubmitting && setShowAddForm(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Edit Activity Modal */}
        <Modal
          isOpen={showEditForm}
          onClose={() => !isSubmitting && setShowEditForm(false)}
          title={
            <div className="flex items-center space-x-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              <span>Edit Activity</span>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          }
          size="md"
        >
          <ActivityForm
            activity={selectedActivity}
            divisions={divisions}
            onSubmit={handleSubmit}
            onCancel={() => !isSubmitting && setShowEditForm(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteActivityModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          activityName={selectedActivity?.activityName || ""}
          isDeleting={isSubmitting}
        />
      </div>
    </AppLayout>
  );
};

export default ActivitiesMaster;
