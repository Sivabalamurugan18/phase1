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
  Save,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToExcel } from "../../../utils/export";
import config from "../../../config";
import DivisionForm from "./components/DivisionForm";
import DeleteDivisionModal from "./components/DeleteDivisionModal";

interface Division {
  divisionId: number;
  divisionName: string;
  description: string;
  isLive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const DivisionsMaster: React.FC = () => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(
    null
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const gridApi = useRef<any>(null);

  const columnDefs: ColDef[] = [
    {
      field: "divisionId",
      headerName: "ID",
      width: 80,
      filter: "agNumberColumnFilter",
      sortable: true,
      cellClass: "font-medium text-blue-600",
      hide: true,
    },
    {
      field: "divisionName",
      headerName: "Division Name",
      width: 200,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "font-semibold text-gray-900",
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1,
      filter: "agTextColumnFilter",
      sortable: true,
      cellRenderer: (params: any) => (
        <div className="max-w-md truncate" title={params.value}>
          {params.value}
        </div>
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
            title="Edit Division"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.data);
            }}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Delete Division"
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
      setLoading(true);

      const response = await fetch(
        `${config.API_BASE_URL}/api/Divisions/GetAll`,
        {
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch divisions");
      }

      const data = await response.json();
       // Transform API data to handle both islive and isLive fields
       const transformedData = (data || []).map((division: any) => ({
        ...division,
        isLive: division.isLive !== undefined ? division.isLive : division.islive
      }));
      setDivisions(transformedData);
      setIsOnline(true);
      toast.success("Divisions loaded from server");
    } catch (error) {
      console.warn("API unavailable, no data available:", error);
      setDivisions([]);
      setIsOnline(false);
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
    fetchDivisions();
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (gridApi.current) {
      gridApi.current.setQuickFilter(value);
    }
  }, []);

  const handleAdd = () => {
    setSelectedDivision(null);
    setShowAddForm(true);
  };

  const handleEdit = (division: Division) => {
    setSelectedDivision(division);
    setShowEditForm(true);
  };

  const handleDelete = (division: Division) => {
    setSelectedDivision(division);
    setShowDeleteModal(true);
  };

  const handleRowClick = (event: any) => {
    handleEdit(event.data);
  };

  const handleSubmit = async (formData: Omit<Division, "divisionId">) => {
    setIsSubmitting(true);

    try {
      if (selectedDivision) {
        // Update existing division
        const response = await fetch(
          `${config.API_BASE_URL}/api/Divisions/${selectedDivision.divisionId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              divisionId: selectedDivision.divisionId,
              ...formData,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update division");
        }

        toast.success("Division updated successfully");
      } else {
        // Create new division
        const response = await fetch(`${config.API_BASE_URL}/api/Divisions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error("Failed to create division");
        }

        toast.success("Division created successfully");
      }

      setShowAddForm(false);
      setShowEditForm(false);
      setSelectedDivision(null);
      fetchDivisions();
    } catch (error) {
      console.error("Error saving division:", error);
      toast.error(
        `Failed to ${selectedDivision ? "update" : "create"} division`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDivision) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/Divisions/${selectedDivision.divisionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...selectedDivision,
            isLive: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to deactivate division");
      }

      toast.success("Division deactivated successfully");
      setShowDeleteModal(false);
      setSelectedDivision(null);
      fetchDivisions();
    } catch (error) {
      console.error("Error deactivating division:", error);
      toast.error("Failed to deactivate division");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!divisions.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const displayedRows = gridApi.current
        ? gridApi.current.getModel().rowsToDisplay.map((row: any) => row.data)
        : divisions;

      const exportData = displayedRows.map((division: Division) => ({
        "Division ID": division.divisionId,
        "Division Name": division.divisionName,
        Description: division.description,
        Status: division.isLive ? "Active" : "Inactive",
        "Created Date": division.createdAt
          ? new Date(division.createdAt).toLocaleDateString()
          : "N/A",
        "Updated Date": division.updatedAt
          ? new Date(division.updatedAt).toLocaleDateString()
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

  const handleRefresh = () => {
    fetchDivisions();
  };

  const filteredDivisions = divisions.filter(
    (division) =>
      division.divisionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      division.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Divisions Master">
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search divisions..."
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
                New Division
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-100">
                Total Divisions
              </p>
              <p className="mt-2 text-3xl font-semibold">{divisions.length}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-green-100">Active</p>
              <p className="mt-2 text-3xl font-semibold">
                {divisions.filter((d) => d.isLive===true).length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-red-100">Inactive</p>
              <p className="mt-2 text-3xl font-semibold">
                {divisions.filter((d) => d.isLive===false).length}
              </p>
            </div>
          </Card>
        </div>

        {/* Divisions Table */}
        <Card
          title={`Divisions (${filteredDivisions.length})`}
          subtitle="Manage organizational divisions and their details"
        >
          <div className="ag-theme-alpine w-full h-[600px]">
            <AgGridReact
              rowData={filteredDivisions}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              onGridReady={onGridReady}
              onRowClicked={handleRowClick}
              rowClass="cursor-pointer hover:bg-gray-50"
              loading={loading}
              loadingOverlayComponent={"Loading..."}
              loadingOverlayComponentParams={{
                loadingMessage: "Loading divisions...",
              }}
            />
          </div>
        </Card>

        {/* Add Division Modal */}
        <Modal
          isOpen={showAddForm}
          onClose={() => !isSubmitting && setShowAddForm(false)}
          title={
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <span>Add New Division</span>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          }
          size="md"
        >
          <DivisionForm
            onSubmit={handleSubmit}
            onCancel={() => !isSubmitting && setShowAddForm(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Edit Division Modal */}
        <Modal
          isOpen={showEditForm}
          onClose={() => !isSubmitting && setShowEditForm(false)}
          title={
            <div className="flex items-center space-x-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              <span>Edit Division</span>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          }
          size="md"
        >
          <DivisionForm
            division={selectedDivision}
            onSubmit={handleSubmit}
            onCancel={() => !isSubmitting && setShowEditForm(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteDivisionModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          divisionName={selectedDivision?.divisionName || ""}
          isDeleting={isSubmitting}
        />
      </div>
    </AppLayout>
  );
};

export default DivisionsMaster;
