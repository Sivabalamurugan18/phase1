import React, { useState, useCallback, useRef } from "react";
import AppLayout from "../../components/layouts/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import Modal from "../../components/ui/Modal";
import DiscrepancyForm from "../../components/forms/DiscrepancyForm";
import DiscrepancyDetailModal from "./components/DiscrepancyDetailModal";
import { errorCategories } from "../../data/mockData";
import { FilterState } from "../../types/screen";
import { Discrepancy } from "../../types/screen";
import {
  Plus,
  Filter,
  BarChart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
  FileDown,
} from "lucide-react";
import DiscrepancyTable from "./components/DiscrepancyTable";
import { toast } from "react-hot-toast";
import { exportToExcel } from "../../utils/export";
import { discrepancyService } from "../../services/apiService";
import { useAuthStore } from "../../store/authStore";

const DiscrepanciesPage: React.FC = () => {
  const { hasSpecificPermission } = useAuthStore();
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [selectedDiscrepancy, setSelectedDiscrepancy] =
    useState<Discrepancy | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDashboardCard, setSelectedDashboardCard] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const gridApi = useRef<any>(null);

  const hasCreatePermission = hasSpecificPermission(
    "Discrepancies",
    "canCreate"
  );

  const [filter, setFilter] = useState<FilterState>({
    searchQuery: "",
    statusFilter: [],
    severityFilter: [],
    categoryFilter: "",
    recurringFilter: "",
    dateRange: {
      start: null,
      end: null,
    },
  });

  const toUTC = (date: string): string | null => {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const statusOptions = [
    { value: "Identified", label: "Identified" },
    { value: "In Review", label: "In Review" },
    { value: "Fixed", label: "Fixed" },
    { value: "Verified", label: "Verified" },
    { value: "Corrected", label: "Corrected" },
  ];

  const severityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ];

  const categoryOptions = Object.keys(errorCategories).map((category) => ({
    value: category,
    label: category,
  }));

  const transformApiData = (apiData: any[]): Discrepancy[] => {
    return apiData.map((item) => ({
      discrepancyId: item.discrepancyId ?? 0,
      planningId: item.planningId ?? 0,
      projectPlanning: item.projectPlanning ?? null,
      projectActivityId: item.projectActivityId ?? 0,
      projectActivity: item.projectActivity ?? null,
      qcLevelId: item.qcLevelId ?? null,
      qcCycle: item.qcCycle ?? 1,
      drawingNumber: item.drawingNumber ?? "",
      drawingDescriptionId: item.drawingDescriptionId ?? null,
      drawingDescription: item.drawingDescription ?? null,
      reflectionDocumentId: item.reflectionDocumentId ?? "",
      errorCategoryId: item.errorCategoryId ?? null,
      errorCategory: item.errorCategory ?? null,
      errorSubCategoryId: item.errorSubCategoryId ?? null,
      errorSubCategory: item.errorSubCategory ?? null,
      errorDescription: item.errorDescription ?? "",
      criticalityIndex: item.criticalityIndex ?? "Medium",
      statusOfError: item.statusOfError ?? "Identified",
      remarks: item.remarks ?? "",
      recurringIssue: item.recurringIssue ?? false,
      dateResolved: item.dateResolved ?? null,
      createdBy: localStorage.getItem("userId"),

      createdAt: new Date().toISOString(),
    }));
  };

  const fetchDiscrepancies = async () => {
    try {
      setLoading(true);

      const response = await discrepancyService.getAll();

      if (!response.success) {
        throw new Error("Failed to fetch discrepancies");
      }

      const transformedData = transformApiData(response.data || []);
      setDiscrepancies(transformedData);
      setIsOnline(true);
      setUsingMockData(false);
      toast.success("Discrepancies loaded from server");
    } catch (error) {
      console.warn("API unavailable, no data available:", error);

      setDiscrepancies([]);
      setIsOnline(false);
      setUsingMockData(true);
      toast.info("No data available - API unavailable");
    } finally {
      setLoading(false);
    }
  };

  const onGridReady = (params: any) => {
    gridApi.current = params.api;
    fetchDiscrepancies();
  };

  const handleSearchChange = useCallback((value: string) => {
    setFilter((prev) => ({ ...prev, searchQuery: value }));
    setSelectedDashboardCard(null);
    if (gridApi.current) {
      gridApi.current.setQuickFilter(value);
    }
  }, []);

  const handleStatusFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFilter((prev) => ({
      ...prev,
      statusFilter: value ? [value] : [],
    }));
    setSelectedDashboardCard(null);
  };

  const handleSeverityFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const value = e.target.value;
    setFilter((prev) => ({
      ...prev,
      severityFilter: value ? [value] : [],
    }));
    setSelectedDashboardCard(null);
  };

  const handleDashboardCardClick = (cardType: string) => {
    if (selectedDashboardCard === cardType) {
      setSelectedDashboardCard(null);
      setFilter((prev) => ({
        ...prev,
        statusFilter: [],
        severityFilter: [],
        recurringFilter: "",
      }));
      return;
    }

    setSelectedDashboardCard(cardType);

    switch (cardType) {
      case "open":
        setFilter((prev) => ({
          ...prev,
          statusFilter: ["Identified", "In Review"],
          severityFilter: [],
          recurringFilter: "",
        }));
        break;
      case "fixed":
        setFilter((prev) => ({
          ...prev,
          statusFilter: ["Fixed", "Verified", "Corrected"],
          severityFilter: [],
          recurringFilter: "",
        }));
        break;
      case "highSeverity":
        setFilter((prev) => ({
          ...prev,
          statusFilter: [],
          severityFilter: ["High"],
          recurringFilter: "",
        }));
        break;
      case "recurring":
        setFilter((prev) => ({
          ...prev,
          statusFilter: [],
          severityFilter: [],
          recurringFilter: "true",
        }));
        break;
      default:
        break;
    }
  };

  const handleDiscrepancySubmit = async (data: any) => {
    if (!hasSpecificPermission("Discrepancies", "canCreate")) {
      toast.error("You do not have permission to create discrepancies");
      return;
    }
    try {
      // Prepare the payload with metadata

      const payload = {
        ...data,

        createdBy: localStorage.getItem("userId"),

        createdAt: new Date().toISOString(),
      };
      console.log("Sending discrepancy payload:", payload);
      const response = await discrepancyService.create(payload);
      if (!response.success) {
        throw new Error(`Failed to save discrepancy: ${response.error}`);
      }
      toast.success("Discrepancy saved successfully!");
      setShowAddForm(false);
      fetchDiscrepancies();
    } catch (error) {
      console.error("Error saving discrepancy:", error);
      toast.error(
        `API Error: ${
          error instanceof Error ? error.message : "Failed to save to server"
        }. Saved locally instead.`
      );
      setShowAddForm(false);
    }
  };

  const handleDiscrepancySave = async (updatedDiscrepancy: Discrepancy) => {
    try {
      console.log("before convert :", updatedDiscrepancy);
      const updateDataDiscrepancy = {
        discrepancyId: updatedDiscrepancy.discrepancyId,
        planningId: updatedDiscrepancy.planningId,
        projectActivityId: updatedDiscrepancy.projectActivityId,
        qcLevelId: updatedDiscrepancy.qcLevelId ?? 0,
        qcCycle: updatedDiscrepancy.qcCycle ?? 0,
        drawingNumber: updatedDiscrepancy.drawingNumber ?? null,
        drawingDescriptionId: updatedDiscrepancy.drawingDescriptionId ?? 0,
        reflectionDocumentId: updatedDiscrepancy.reflectionDocumentId ?? null,
        errorCategoryId: updatedDiscrepancy.errorCategoryId ?? 0,
        errorSubCategoryId: updatedDiscrepancy.errorSubCategoryId ?? 0,
        errorDescription: updatedDiscrepancy.errorDescription ?? null,
        criticalityIndex: updatedDiscrepancy.criticalityIndex ?? null,
        statusOfError: updatedDiscrepancy.statusOfError ?? null,
        remarks: updatedDiscrepancy.remarks ?? null,
        recurringIssue: updatedDiscrepancy.recurringIssue ?? false,
        modifiedBy: localStorage.getItem("userId"),
        modifiedAt: new Date().toISOString(),
        dateResolved: toUTC(updatedDiscrepancy.dateResolved) ?? null,
        // ✅ Preserve original created info

        ...(updatedDiscrepancy.createdAt && {
          createdAt: updatedDiscrepancy.createdAt,
        }),

        ...(updatedDiscrepancy.createdBy && {
          createdBy: updatedDiscrepancy.createdBy,
        }),
      };
      console.log("after convert :", updateDataDiscrepancy);
      const response = await discrepancyService.update(
        updatedDiscrepancy.discrepancyId,
        updateDataDiscrepancy
      );

      if (!response.success) {
        throw new Error(`Failed to update discrepancy: ${response.error}`);
      }
      toast.success("Discrepancy updated successfully!");
      setShowDetailModal(false);
      setSelectedDiscrepancy(null);
      fetchDiscrepancies();
    } catch (error) {
      console.error("Error updating discrepancy:", error);
      toast.error(
        `API Error: ${
          error instanceof Error ? error.message : "Failed to save to server"
        }. Updated locally instead.`
      );
      setDiscrepancies(
        discrepancies.map((d) =>
          d.discrepancyId === updatedDiscrepancy.discrepancyId
            ? updatedDiscrepancy
            : d
        )
      );
      setShowDetailModal(false);
      setSelectedDiscrepancy(null);
    }
  };

  const handleDiscrepancyDelete = async (discrepancyToDelete: Discrepancy) => {
    try {
      const response = await discrepancyService.delete(
        discrepancyToDelete.discrepancyId
      );
      if (!response.success) {
        throw new Error("Failed to delete discrepancy from server");
      }
      setDiscrepancies(
        discrepancies.filter(
          (d) => d.discrepancyId !== discrepancyToDelete.discrepancyId
        )
      );
      setShowDetailModal(false);
      setSelectedDiscrepancy(null);
      toast.success("Discrepancy deleted successfully");
    } catch (error) {
      console.error("Error deleting discrepancy:", error);
      setDiscrepancies(
        discrepancies.filter(
          (d) => d.discrepancyId !== discrepancyToDelete.discrepancyId
        )
      );
      setShowDetailModal(false);
      setSelectedDiscrepancy(null);
      toast.success("Discrepancy deleted (API unavailable - removed locally)");
    }
  };

  const handleRowClick = (discrepancy: Discrepancy) => {
    setSelectedDiscrepancy(discrepancy);
    setShowDetailModal(true);
  };

  const handleClearFilters = () => {
    setSelectedDashboardCard(null);
    setFilter({
      searchQuery: "",
      statusFilter: [],
      severityFilter: [],
      categoryFilter: "",
      recurringFilter: "",
      dateRange: {
        start: null,
        end: null,
      },
    });
    if (gridApi.current) {
      gridApi.current.setQuickFilter("");
    }
    toast.success("Filters cleared");
  };

  const handleExport = () => {
    if (!filteredDiscrepancies.length) {
      toast.error("No data to export");
      return;
    }
    try {
      const displayedRows = gridApi.current
        ? gridApi.current.getModel().rowsToDisplay.map((row: any) => row.data)
        : filteredDiscrepancies;
      const exportData = displayedRows.map((discrepancy: Discrepancy) => ({
        "Discrepancy ID": discrepancy.discrepancyId,
        "Project Number": discrepancy.projectPlanning?.projectNo || "N/A",
        "Drawing Number": discrepancy.drawingNumber || "N/A",
        "Drawing Description":
          discrepancy.drawingDescription?.description || "N/A",
        "QC Level": discrepancy.qcLevelId
          ? `QC${discrepancy.qcLevelId}`
          : "N/A",
        "QC Cycle": discrepancy.qcCycle || 0,
        "Error Category": discrepancy.errorCategory?.errorCategoryName || "N/A",
        "Error Sub Category":
          discrepancy.errorSubCategory?.errorSubCategoryName || "N/A",
        "Error Description": discrepancy.errorDescription || "N/A",
        "Criticality Index": discrepancy.criticalityIndex || "N/A",
        Status: discrepancy.statusOfError || "N/A",
        "Is Recurring": discrepancy.recurringIssue ? "Yes" : "No",
        Remarks: discrepancy.remarks || "N/A",
        DateResolved: discrepancy.dateResolved || "N/A",
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
    fetchDiscrepancies();
  };

  const filteredDiscrepancies = discrepancies.filter((discrepancy) => {
    const searchMatch =
      filter.searchQuery === "" ||
      (discrepancy.projectPlanning?.projectNo &&
        discrepancy.projectPlanning.projectNo
          .toLowerCase()
          .includes(filter.searchQuery.toLowerCase())) ||
      (discrepancy.projectActivity?.activity?.activityName &&
        discrepancy.projectActivity.activity.activityName
          .toLowerCase()
          .includes(filter.searchQuery.toLowerCase())) ||
      (discrepancy.drawingNumber &&
        discrepancy.drawingNumber
          .toLowerCase()
          .includes(filter.searchQuery.toLowerCase())) ||
      (discrepancy.errorDescription &&
        discrepancy.errorDescription
          .toLowerCase()
          .includes(filter.searchQuery.toLowerCase()));

    const statusMatch =
      filter.statusFilter.length === 0 ||
      filter.statusFilter.includes(discrepancy.statusOfError || "");

    const severityMatch =
      filter.severityFilter.length === 0 ||
      filter.severityFilter.includes(discrepancy.criticalityIndex || "");

    const recurringMatch =
      filter.recurringFilter === "" ||
      (filter.recurringFilter === "true" && discrepancy.recurringIssue) ||
      (filter.recurringFilter === "false" && !discrepancy.recurringIssue);

    return searchMatch && statusMatch && severityMatch && recurringMatch;
  });

  const highSeverityCount = filteredDiscrepancies.filter(
    (d) => d.criticalityIndex === "High"
  ).length;
  const recurringCount = filteredDiscrepancies.filter(
    (d) => d.recurringIssue
  ).length;
  const openCount = filteredDiscrepancies.filter(
    (d) => d.statusOfError === "Identified" || d.statusOfError === "In Review"
  ).length;
  const fixedCount = filteredDiscrepancies.filter(
    (d) =>
      d.statusOfError === "Fixed" ||
      d.statusOfError === "Verified" ||
      d.statusOfError === "Corrected"
  ).length;

  const totalHighSeverity = discrepancies.filter(
    (d) => d.criticalityIndex === "High"
  ).length;
  const totalRecurring = discrepancies.filter((d) => d.recurringIssue).length;
  const totalOpen = discrepancies.filter(
    (d) => d.statusOfError === "Identified" || d.statusOfError === "In Review"
  ).length;
  const totalFixed = discrepancies.filter(
    (d) =>
      d.statusOfError === "Fixed" ||
      d.statusOfError === "Verified" ||
      d.statusOfError === "Corrected"
  ).length;

  const discrepanciesByCategory = filteredDiscrepancies.reduce((acc, d) => {
    const category = d.errorCategory?.errorCategoryName || "Unknown";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getDashboardCardClasses = (cardType: string, baseClasses: string) => {
    const isSelected = selectedDashboardCard === cardType;
    return `${baseClasses} cursor-pointer transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
      isSelected
        ? "ring-4 ring-blue-300 shadow-xl scale-105"
        : "hover:shadow-md"
    }`;
  };

  return (
    <AppLayout title="Discrepancy Tracking">
      <div className="space-y-6">
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

        <Card>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <SearchBar
              value={filter.searchQuery}
              onChange={handleSearchChange}
              placeholder="Search discrepancies..."
              className="lg:col-span-2"
            />
            <div className="flex items-center space-x-2">
              {isOnline && (
                <div className="flex items-center text-green-600 text-sm">
                  <Wifi className="h-4 w-4 mr-1" />
                  Online
                </div>
              )}
            </div>
            <div className="flex-grow"></div>
            <div className="flex items-end space-x-2">
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
            </div>
          </div>

          {selectedDashboardCard && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Active Filter:{" "}
                    {selectedDashboardCard === "open"
                      ? "Open Discrepancies"
                      : selectedDashboardCard === "fixed"
                      ? "Fixed/Verified"
                      : selectedDashboardCard === "highSeverity"
                      ? "High Severity"
                      : selectedDashboardCard === "recurring"
                      ? "Recurring Issues"
                      : ""}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDashboardCard(null)}
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className={getDashboardCardClasses(
              "open",
              "bg-gradient-to-br from-red-50 to-red-100 border-red-200"
            )}
            onClick={() => handleDashboardCardClick("open")}
          >
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-red-200 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-red-700 mb-1">
                Open Discrepancies
              </p>
              <p className="text-3xl font-bold text-red-800">{totalOpen}</p>
            </div>
          </Card>

          <Card
            className={getDashboardCardClasses(
              "fixed",
              "bg-gradient-to-br from-green-50 to-green-100 border-green-200"
            )}
            onClick={() => handleDashboardCardClick("fixed")}
          >
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-green-200 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-green-700 mb-1">
                Fixed/Verified
              </p>
              <p className="text-3xl font-bold text-green-800">{totalFixed}</p>
            </div>
          </Card>

          <Card
            className={getDashboardCardClasses(
              "highSeverity",
              "bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200"
            )}
            onClick={() => handleDashboardCardClick("highSeverity")}
          >
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-yellow-200 rounded-full">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-yellow-700 mb-1">
                High Severity
              </p>
              <p className="text-3xl font-bold text-yellow-800">
                {totalHighSeverity}
              </p>
            </div>
          </Card>

          <Card
            className={getDashboardCardClasses(
              "recurring",
              "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
            )}
            onClick={() => handleDashboardCardClick("recurring")}
          >
            <div className="text-center p-2">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-blue-200 rounded-full">
                  <RefreshCw className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm font-medium text-blue-700 mb-1">
                Recurring Issues
              </p>
              <p className="text-3xl font-bold text-blue-800">
                {totalRecurring}
              </p>
            </div>
          </Card>
        </div>

        <Card
          title={`Discrepancies(${discrepancies.length})`}
          headerRight={
            hasSpecificPermission("Discrepancies", "canCreate") && (
              <Button
                variant="success"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowAddForm(true)}
              >
                Add
              </Button>
            )
          }
        >
          <DiscrepancyTable
            discrepancies={filteredDiscrepancies}
            onRowClick={handleRowClick}
            onGridReady={onGridReady}
            loading={loading}
          />
        </Card>

        {hasSpecificPermission("Discrepancies", "canCreate") && (
          <Modal
            isOpen={showAddForm}
            onClose={() => setShowAddForm(false)}
            title="Add New Discrepancy"
          >
            <DiscrepancyForm
              onSubmit={handleDiscrepancySubmit}
              onCancel={() => setShowAddForm(false)}
            />
          </Modal>
        )}

        {/* This modal handles the "Access Denied" popup when a row is clicked
            and the user doesn't have permission to view it.
        */}
        <DiscrepancyDetailModal
          discrepancy={selectedDiscrepancy}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDiscrepancy(null);
          }}
          onSave={handleDiscrepancySave}
          onDelete={
            hasSpecificPermission("Discrepancies", "canDelete")
              ? handleDiscrepancyDelete
              : undefined
          }
        />

        <Card title="Error Category Summary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Errors by Category
              </h3>
              <div className="space-y-4">
                {Object.entries(discrepanciesByCategory).map(
                  ([category, count]) => (
                    <div key={category} className="flex items-center">
                      <div className="w-32 font-medium">{category}</div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                (count / filteredDiscrepancies.length) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 text-right font-medium">{count}</div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="text-center">
                <BarChart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  Error Trends
                </h3>
                <p className="mt-1 text-gray-500">
                  Error trend analysis by month and category would be displayed
                  here.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DiscrepanciesPage;
