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
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { exportToExcel } from "../../../utils/export";
import {
  errorSubCategoryService,
  errorCategoryService,
} from "../../../services/masterServices";
import { ErrorSubCategory, ErrorCategory } from "../../../types/masters";
import ErrorSubCategoryForm from "./components/ErrorSubCategoryForm";
import DeleteErrorSubCategoryModal from "./components/DeleteErrorSubCategoryModal";

const ErrorSubCategoriesMaster: React.FC = () => {
  const [errorSubCategories, setErrorSubCategories] = useState<
    ErrorSubCategory[]
  >([]);
  const [errorCategories, setErrorCategories] = useState<ErrorCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<ErrorSubCategory | null>(null);
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
      field: "errorSubCategoryId",
      headerName: "ID",
      width: 80,
      filter: "agNumberColumnFilter",
      sortable: true,
      cellClass: "font-medium text-blue-600",
      hide: true,
    },
    {
      field: "errorSubCategoryName",
      headerName: "Sub Category Name",
      width: 250,
      filter: "agTextColumnFilter",
      sortable: true,
      cellClass: "font-semibold text-gray-900",
    },
    {
      field: "errorCategory.errorCategoryName",
      headerName: "Parent Category",
      width: 200,
      filter: "agTextColumnFilter",
      sortable: true,
      cellRenderer: (params: any) => {
        const category = errorCategories.find(
          (c) => c.errorCategoryId === params.data.errorCategoryId
        );
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {category?.errorCategoryName || "N/A"}
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
            title="Edit Sub Category"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.data);
            }}
            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Delete Sub Category"
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
      const response = await errorCategoryService.getAll();
      if (response.success) {
        setErrorCategories(response.data || []);
      } else {
        throw new Error("Failed to fetch error categories");
      }
    } catch (error) {
      console.warn("API unavailable for error categories:", error);
      setErrorCategories([]);
    }
  };

  const fetchErrorSubCategories = async () => {
    try {
      setLoading(true);
      const response = await errorSubCategoryService.getAll();

      if (response.success) {
        setErrorSubCategories(response.data || []);
        setIsOnline(true);
        setUsingMockData(false);
        toast.success("Error Sub Categories loaded from server");
      } else {
        throw new Error("Failed to fetch error sub categories");
      }
    } catch (error) {
      console.warn("API unavailable, no data available:", error);
      setErrorSubCategories([]);
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
    fetchErrorCategories();
    fetchErrorSubCategories();
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (gridApi.current) {
      gridApi.current.setQuickFilter(value);
    }
  }, []);

  const handleAdd = () => {
    setSelectedSubCategory(null);
    setShowAddForm(true);
  };

  const handleEdit = (subCategory: ErrorSubCategory) => {
    setSelectedSubCategory(subCategory);
    setShowEditForm(true);
  };

  const handleDelete = (subCategory: ErrorSubCategory) => {
    setSelectedSubCategory(subCategory);
    setShowDeleteModal(true);
  };

  const handleRowClick = (event: any) => {
    handleEdit(event.data);
  };

  const handleSubmit = async (
    formData: Omit<ErrorSubCategory, "errorSubCategoryId">
  ) => {
    setIsSubmitting(true);

    try {
      if (usingMockData) {
        if (selectedSubCategory) {
          const updatedSubCategory = { ...selectedSubCategory, ...formData };
          setErrorSubCategories(
            errorSubCategories.map((sc) =>
              sc.errorSubCategoryId === selectedSubCategory.errorSubCategoryId
                ? updatedSubCategory
                : sc
            )
          );
          toast.success(
            "Error Sub Category updated successfully (offline mode)"
          );
        } else {
          const newSubCategory: ErrorSubCategory = {
            ...formData,
            errorSubCategoryId:
              Math.max(
                ...errorSubCategories.map((sc) => sc.errorSubCategoryId),
                0
              ) + 1,
            errorCategory: errorCategories.find(
              (c) => c.errorCategoryId === formData.errorCategoryId
            ),
          };
          setErrorSubCategories([...errorSubCategories, newSubCategory]);
          toast.success("Error Sub Category added successfully (offline mode)");
        }
        setShowAddForm(false);
        setShowEditForm(false);
        setSelectedSubCategory(null);
        return;
      }

      if (selectedSubCategory) {
        const response = await errorSubCategoryService.update(
          selectedSubCategory.errorSubCategoryId,
          {
            errorSubCategoryId: selectedSubCategory.errorSubCategoryId,
            ...formData,
          }
        );

        if (!response.success) {
          throw new Error("Failed to update error sub category");
        }

        toast.success("Error Sub Category updated successfully");
      } else {
        const response = await errorSubCategoryService.create(formData);

        if (!response.success) {
          throw new Error("Failed to create error sub category");
        }

        toast.success("Error Sub Category created successfully");
      }

      setShowAddForm(false);
      setShowEditForm(false);
      setSelectedSubCategory(null);
      fetchErrorSubCategories();
    } catch (error) {
      console.error("Error saving error sub category:", error);
      toast.error(
        `Failed to ${
          selectedSubCategory ? "update" : "create"
        } error sub category`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSubCategory) return;

    setIsSubmitting(true);

    try {
      if (usingMockData) {
        setErrorSubCategories(
          errorSubCategories.map((sc) =>
            sc.errorSubCategoryId === selectedSubCategory.errorSubCategoryId
              ? { ...sc, isLive: false }
              : sc
          )
        );
        toast.success(
          "Error Sub Category deactivated successfully (offline mode)"
        );
        setShowDeleteModal(false);
        setSelectedSubCategory(null);
        return;
      }

      const response = await errorSubCategoryService.update(
        selectedSubCategory.errorSubCategoryId,
        {
          ...selectedSubCategory,
          isLive: false,
        }
      );

      if (!response.success) {
        throw new Error("Failed to deactivate error sub category");
      }

      toast.success("Error Sub Category deactivated successfully");
      setShowDeleteModal(false);
      setSelectedSubCategory(null);
      fetchErrorSubCategories();
    } catch (error) {
      console.error("Error deactivating error sub category:", error);
      toast.error("Failed to deactivate error sub category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    if (!errorSubCategories.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const displayedRows = gridApi.current
        ? gridApi.current.getModel().rowsToDisplay.map((row: any) => row.data)
        : errorSubCategories;

      const exportData = displayedRows.map((subCategory: ErrorSubCategory) => {
        const category = errorCategories.find(
          (c) => c.errorCategoryId === subCategory.errorCategoryId
        );
        return {
          "Sub Category ID": subCategory.errorSubCategoryId,
          "Sub Category Name": subCategory.errorSubCategoryName,
          "Parent Category": category?.errorCategoryName || "N/A",
          "Category ID": subCategory.errorCategoryId,
          Status: subCategory.isLive ? "Active" : "Inactive",
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
    fetchErrorSubCategories();
    fetchErrorCategories();
  };

  const filteredSubCategories = errorSubCategories.filter((subCategory) =>
    subCategory.errorSubCategoryName
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Error Sub Categories Master">
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
              placeholder="Search error sub categories..."
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
                New Sub Category
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-blue-100" />
              <p className="text-sm font-medium text-blue-100">
                Total Sub Categories
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {errorSubCategories.length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-green-100" />
              <p className="text-sm font-medium text-green-100">Active</p>
              <p className="mt-2 text-3xl font-semibold">
                {errorSubCategories.filter((sc) => sc.isLive).length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-red-100" />
              <p className="text-sm font-medium text-red-100">Inactive</p>
              <p className="mt-2 text-3xl font-semibold">
                {errorSubCategories.filter((sc) => !sc.isLive).length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-purple-100" />
              <p className="text-sm font-medium text-purple-100">
                Parent Categories
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {errorCategories.filter((c) => c.isLive).length}
              </p>
            </div>
          </Card>
        </div>

        {/* Sub Categories Table */}
        <Card
          title={`Error Sub Categories (${filteredSubCategories.length})`}
          subtitle="Manage detailed error classification sub categories"
        >
          <div className="ag-theme-alpine w-full h-[600px]">
            <AgGridReact
              rowData={filteredSubCategories}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              onGridReady={onGridReady}
              onRowClicked={handleRowClick}
              rowClass="cursor-pointer hover:bg-gray-50"
              loadingOverlayComponent={"Loading..."}
              loadingOverlayComponentParams={{
                loadingMessage: "Loading error sub categories...",
              }}
            />
          </div>
        </Card>

        {/* Add Sub Category Modal */}
        <Modal
          isOpen={showAddForm}
          onClose={() => !isSubmitting && setShowAddForm(false)}
          title={
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <span>Add New Error Sub Category</span>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          }
          size="md"
        >
          <ErrorSubCategoryForm
            categories={errorCategories}
            onSubmit={handleSubmit}
            onCancel={() => !isSubmitting && setShowAddForm(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Edit Sub Category Modal */}
        <Modal
          isOpen={showEditForm}
          onClose={() => !isSubmitting && setShowEditForm(false)}
          title={
            <div className="flex items-center space-x-2">
              <Edit2 className="h-5 w-5 text-blue-600" />
              <span>Edit Error Sub Category</span>
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
            </div>
          }
          size="md"
        >
          <ErrorSubCategoryForm
            subCategory={selectedSubCategory}
            categories={errorCategories}
            onSubmit={handleSubmit}
            onCancel={() => !isSubmitting && setShowEditForm(false)}
            isSubmitting={isSubmitting}
          />
        </Modal>

        {/* Delete Confirmation Modal */}
        <DeleteErrorSubCategoryModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          subCategoryName={selectedSubCategory?.errorSubCategoryName || ""}
          isDeleting={isSubmitting}
        />
      </div>
    </AppLayout>
  );
};

export default ErrorSubCategoriesMaster;
