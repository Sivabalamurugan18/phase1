import React, { useState, useCallback, useRef } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToExcel } from "../../../utils/export";
import { errorCategoryService } from "../../../services/masterServices";
import { ErrorCategory } from "../../../types/masters";
import ErrorCategoryForm from "./components/ErrorCategoryForm";
import DeleteErrorCategoryModal from "./components/DeleteErrorCategoryModal";

const ErrorCategoriesMaster: React.FC = () => {
  const [errorCategories, setErrorCategories] = useState<ErrorCategory[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ErrorCategory | null>(null);
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
      field: "errorCategoryId",
      headerName: "ID",
      width: 80,
      filter: "agNumberColumnFilter",
      sortable: true,
      cellClass: "font-medium text-blue-600",
      hide: true,
    },
    {
      field: "errorCategoryName",
      headerName: "Category Name",
      width: 300,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "font-semibold text-gray-900",
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
            title="Edit Category"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.data);
            }}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Delete Category"
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

  const fetchErrorCategories = async () => {
    try {
      setLoading(true);
      const response = await errorCategoryService.getAll();

      if (response.success) {
        setErrorCategories(response.data || []);
        setIsOnline(true);
        setUsingMockData(false);
        toast.success("Error Categories loaded from server");
      } else {
        throw new Error("Failed to fetch error categories");
      }
    } catch (error) {
      console.warn("API unavailable, no data available:", error);
      setErrorCategories([]);
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
    params.api.sizeColumnsToFit();
    fetchErrorCategories();
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (gridApi.current) {
      gridApi.current.setQuickFilter(value);
    }
  }, []);

  const handleAdd = () => {
    setSelectedCategory(null);
    setShowAddForm(true);
  };

  const handleEdit = (category: ErrorCategory) => {
    setSelectedCategory(category);
    setShowEditForm(true);
  };

  const handleDelete = (category: ErrorCategory) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleRowClick = (event: any) => {
    handleEdit(event.data);
  };

  const handleSubmit = async (
    formData: Omit<ErrorCategory, "errorCategoryId">
  ) => {
    setIsSubmitting(true);

    try {
      if (usingMockData) {
        if (selectedCategory) {
          const updatedCategory = { ...selectedCategory, ...formData };
          setErrorCategories(
            errorCategories.map((c) =>
              c.errorCategoryId === selectedCategory.errorCategoryId
                ? updatedCategory
                : c
            )
          );
          toast.success("Error Category updated successfully (offline mode)");
        } else {
          const newCategory: ErrorCategory = {
            ...formData,
            errorCategoryId:
              Math.max(...errorCategories.map((c) => c.errorCategoryId), 0) + 1,
          };
          setErrorCategories([...errorCategories, newCategory]);
          toast.success("Error Category added successfully (offline mode)");
        }
        setShowAddForm(false);
        setShowEditForm(false);
        setSelectedCategory(null);
        return;
      }

      if (selectedCategory) {
        const response = await errorCategoryService.update(
          selectedCategory.errorCategoryId,
          {
            errorCategoryId: selectedCategory.errorCategoryId,
            ...formData,
          }
        );

        if (!response.success) {
          throw new Error("Failed to update error category");
        }

        toast.success("Error Category updated successfully");
      } else {
        const response = await errorCategoryService.create(formData);

        if (!response.success) {
          throw new Error("Failed to create error category");
        }

        toast.success("Error Category created successfully");
      }

      setShowAddForm(false);
      setShowEditForm(false);
      setSelectedCategory(null);
      fetchErrorCategories();
    } catch (error) {
      console.error("Error saving error category:", error);
      toast.error(
        `Failed to ${selectedCategory ? "update" : "create"} error category`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);

    try {
      if (usingMockData) {
        setErrorCategories(
          errorCategories.map((c) =>
            c.errorCategoryId === selectedCategory.errorCategoryId
              ? { ...c, isLive: false }
              : c
          )
        );
        toast.success("Error Category deactivated successfully (offline mode)");
        setShowDeleteModal(false);
        setSelectedCategory(null);
        return;
      }

      const response = await errorCategoryService.update(
        selectedCategory.errorCategoryId,
        {
          ...selectedCategory,
          isLive: false,
        }
      );

      if (!response.success) {
        throw new Error("Failed to deactivate error category");
      }

      toast.success("Error Category deactivated successfully");
      setShowDeleteModal(false);
      setSelectedCategory(null);
      fetchErrorCategories();
    } catch (error) {
      console.error("Error deactivating error category:", error);
      toast.error("Failed to deactivate error category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!errorCategories.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const displayedRows = gridApi.current
        ? gridApi.current.getModel().rowsToDisplay.map((row: any) => row.data)
        : errorCategories;

      const exportData = displayedRows.map((category: ErrorCategory) => ({
        "Category ID": category.errorCategoryId,
        "Category Name": category.errorCategoryName,
        Status: category.isLive ? "Active" : "Inactive",
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
    fetchErrorCategories();
  };

  const filteredCategories = errorCategories.filter((category) =>
    category.errorCategoryName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Error Categories Master">
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
              placeholder="Search error categories..."
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
                New Category
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-blue-100" />
              <p className="text-sm font-medium text-blue-100">
                Total Categories
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {errorCategories.length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-green-100" />
              <p className="text-sm font-medium text-green-100">Active</p>
              <p className="mt-2 text-3xl font-semibold">
                {errorCategories.filter((c) => c.isLive).length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-red-100" />
              <p className="text-sm font-medium text-red-100">Inactive</p>
              <p className="mt-2 text-3xl font-semibold">
                {errorCategories.filter((c) => !c.isLive).length}
              </p>
            </div>
          </Card>
        </div>

        {/* Categories Table */}
        <Card
          title={`Error Categories (${filteredCategories.length})`}
          subtitle="Manage error classification categories"
        >
          <div className="ag-theme-alpine w-full h-[600px]">
            <AgGridReact
              rowData={filteredCategories}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              onGridReady={onGridReady}
              onRowClicked={handleRowClick}
              rowClass="cursor-pointer hover:bg-gray-50"
              loading={loading}
              loadingOverlayComponent={"Loading..."}
              loadingOverlayComponentParams={{
                loadingMessage: "Loading error categories...",
              }}
            />
          </div>
        </Card>

        {/* Add Category Modal */}
        <Modal
          isOpen={showAddForm}
          onClose={() => !isSubmitting && setShowAddForm(false)}
          title={
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <span>Add New Error Category</span>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          }
          size="md"
        >
          <ErrorCategoryForm
            onSubmit={handleSubmit}
            onCancel={() => !isSubmitting && setShowAddForm(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Edit Category Modal */}
        <Modal
          isOpen={showEditForm}
          onClose={() => !isSubmitting && setShowEditForm(false)}
          title={
            <div className="flex items-center space-x-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              <span>Edit Error Category</span>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          }
          size="md"
        >
          <ErrorCategoryForm
            category={selectedCategory}
            onSubmit={handleSubmit}
            onCancel={() => !isSubmitting && setShowEditForm(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteErrorCategoryModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          categoryName={selectedCategory?.errorCategoryName || ""}
          isDeleting={isSubmitting}
        />
      </div>
    </AppLayout>
  );
};

export default ErrorCategoriesMaster;
