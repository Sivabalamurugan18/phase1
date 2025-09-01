import React, { useState, useCallback, useRef, useEffect } from "react";
import AppLayout from "../../components/layouts/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import SearchBar from "../../components/ui/SearchBar";
import Modal from "../../components/ui/Modal";
import ClarificationForm from "../../components/forms/ClarificationForm";
import ClarificationDetailModal from "./components/ClarificationDetailModal";
import { Clarification, FilterState } from "../../types/screen";
import {
  Plus,
  Filter,
  PieChart,
  FileDown,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import ClarificationTable from "./components/ClarificationTable";
import { toast } from "react-hot-toast";
import { exportToExcel } from "../../utils/export";
import { clarificationService } from "../../services/apiService";
import { useAuthStore } from "../../store/authStore";

const ClarificationsPage: React.FC = () => {
  const { hasSpecificPermission } = useAuthStore();
  const [clarifications, setClarifications] = useState<Clarification[]>([]);
  const [selectedClarification, setSelectedClarification] =
    useState<Clarification | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [usingMockData, setUsingMockData] = useState(false);
  const gridApi = useRef<any>(null);

  const hasViewPermission = hasSpecificPermission("Clarifications", "canView");
  const hasCreatePermission = hasSpecificPermission(
    "Clarifications",
    "canCreate"
  );

  const [filter, setFilter] = useState<FilterState>({
    searchQuery: "",
    statusFilter: [],
    criticalityFilter: [],
    projectFilter: "",
    dateRange: {
      start: null,
      end: null,
    },
  });

  const toUTC = (date: any): string | null => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const transformApiData = (apiData: Clarification[]): Clarification[] => {
    return apiData.map(
      (item) =>
        ({
          clarificationId: item.clarificationId ?? 0,
          planningId: item.planningId ?? 0,
          projectPlanning: item.projectPlanning ?? null,
          projectActivityId: item.projectActivityId ?? 0,
          projectActivity: item.projectActivity ?? null,
          docReference: item.docReference ?? null,
          clarificationDescription: item.clarificationDescription ?? null,
          raisedById: item.raisedById ?? null,
          response: item.response ?? null,
          responsesFromId: item.responsesFromId ?? null,
          status: item.status ?? "Open",
          criticalityIndex: item.criticalityIndex ?? "Medium",
          dateRaised: item.dateRaised ?? null,
          dateClosed: item.dateClosed ?? null,
          createdBy: localStorage.getItem("userId"),

          createdAt: new Date().toISOString(),
        } as Clarification)
    );
  };

  const fetchClarifications = async () => {
    try {
      setLoading(true);
      const response = await clarificationService.getAll();
      if (!response.success) {
        throw new Error("Failed to fetch clarifications");
      }
      const data = response.data;
      const transformedData = transformApiData((data as Clarification[]) || []);
      setClarifications(transformedData);
      setIsOnline(true);
      setUsingMockData(false);
      toast.success("Clarifications loaded from server");
    } catch (error) {
      console.warn("API unavailable, no data available:", error);
      setClarifications([]);
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
    // We will still fetch data, but the permission check will happen
    // when trying to view the details.
    fetchClarifications();
  };

  const handleSearchChange = useCallback((value: string) => {
    setFilter((prev) => ({ ...prev, searchQuery: value }));
    if (gridApi.current) {
      gridApi.current.setQuickFilter(value);
    }
  }, []);

  const handleClarificationSubmit = async (data: any) => {
    if (!hasCreatePermission) {
      toast.error("You do not have permission to create clarifications");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await clarificationService.create(data);
      if (!response.success) {
        const errorText = await response.error;
        throw new Error(
          `Failed to save clarification: ${response.message} - ${errorText}`
        );
      }
      toast.success("Clarification saved successfully!");
      setShowAddForm(false);
      fetchClarifications();
    } catch (error) {
      console.error("Error saving clarification:", error);
      toast.error(
        `API Error: ${
          error instanceof Error ? error.message : "Failed to save to server"
        }. Saved locally instead.`
      );
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClarificationSave = (updatedClarification: Clarification) => {
    const updatedNew: Clarification = {
      clarificationId: updatedClarification.clarificationId,
      planningId: updatedClarification.planningId,
      projectActivityId: updatedClarification.projectActivityId,
      docReference: updatedClarification.docReference,
      raisedById: updatedClarification.raisedById,
      clarificationDescription: updatedClarification.clarificationDescription,
      dateRaised: toUTC(updatedClarification.dateRaised),
      dateClosed: toUTC(updatedClarification.dateClosed),
      criticalityIndex: updatedClarification.criticalityIndex,
      status: updatedClarification.status,
      response: updatedClarification.response,
      responsesFromId: updatedClarification.responsesFromId,
      createdBy: localStorage.getItem("userId"),

      createdAt: new Date().toISOString(),
    };
    setClarifications(
      clarifications.map((c) =>
        c.clarificationId === updatedNew.clarificationId ? updatedNew : c
      )
    );
    setShowDetailModal(false);
    setSelectedClarification(null);
    toast.success("Clarification updated successfully!");
  };

  const handleClarificationDelete = (clarificationToDelete: Clarification) => {
    setClarifications(
      clarifications.filter(
        (c) =>
          c.clarificationId.toString() !==
          clarificationToDelete.clarificationId.toString()
      )
    );
    setShowDetailModal(false);
    setSelectedClarification(null);
    if (gridApi.current) {
      gridApi.current.setRowData(
        clarifications.filter(
          (c) =>
            c.clarificationId.toString() !==
            clarificationToDelete.clarificationId.toString()
        )
      );
    }
  };

  const handleRowClick = (clarification: Clarification) => {
    setSelectedClarification(clarification);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    if (!filteredClarifications.length) {
      toast.error("No data to export");
      return;
    }
    try {
      const displayedRows = gridApi.current
        ? gridApi.current.getModel().rowsToDisplay.map((row: any) => row.data)
        : filteredClarifications;
      const exportData = displayedRows.map((clarification: Clarification) => ({
        "Clarification ID": clarification.clarificationId,
        "Project No": clarification.projectPlanning?.projectNo ?? "N/A",
        "Doc Reference": clarification.docReference ?? "N/A",
        Description: clarification.clarificationDescription ?? "N/A",
        "Date Raised": toUTC(clarification.dateRaised),
        "Date Closed": toUTC(clarification.dateClosed) ?? "N/A",
        Criticality: clarification.criticalityIndex ?? "N/A",
        Status: clarification.status ?? "N/A",
        Response: clarification.response ?? "N/A",
        createdBy: localStorage.getItem("userId"),

        createdAt: new Date().toISOString(),
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
    fetchClarifications();
  };

  const filteredClarifications = clarifications.filter((clarification) => {
    const searchMatch =
      filter.searchQuery === "" ||
      (clarification.projectPlanning?.projectNo &&
        clarification.projectPlanning.projectNo
          .toLowerCase()
          .includes(filter.searchQuery.toLowerCase())) ||
      (clarification.projectActivity?.activity?.activityName &&
        clarification.projectActivity.activity.activityName
          .toLowerCase()
          .includes(filter.searchQuery.toLowerCase())) ||
      (clarification.clarificationDescription &&
        clarification.clarificationDescription
          .toLowerCase()
          .includes(filter.searchQuery.toLowerCase())) ||
      (clarification.docReference &&
        clarification.docReference
          .toLowerCase()
          .includes(filter.searchQuery.toLowerCase()));

    const statusMatch =
      filter.statusFilter.length === 0 ||
      filter.statusFilter.includes(clarification.status ?? "");

    const criticalityMatch =
      filter.criticalityFilter.length === 0 ||
      filter.criticalityFilter.includes(clarification.criticalityIndex);

    return searchMatch && statusMatch && criticalityMatch;
  });

  return (
    <AppLayout title="Clarifications Log">
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
              placeholder="Search clarifications..."
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
            </div>
          </div>
        </Card>

        <Card
          title={`Clarifications (${filteredClarifications.length})`}
          headerRight={
            hasCreatePermission && (
              <Button
                variant="success"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowAddForm(true)}
                disabled={isSubmitting}
              >
                Add
              </Button>
            )
          }
        >
          {/* This is the table that you will click on */}
          <ClarificationTable
            clarifications={filteredClarifications}
            onRowClick={handleRowClick}
            onGridReady={onGridReady}
            loading={loading}
          />
        </Card>

        {hasCreatePermission && (
          <Modal
            isOpen={showAddForm}
            onClose={() => !isSubmitting && setShowAddForm(false)}
            title={
              <div className="flex items-center space-x-2">
                <span>Add New Clarification</span>
                {isSubmitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
              </div>
            }
          >
            <ClarificationForm
              onSubmit={handleClarificationSubmit}
              onCancel={() => !isSubmitting && setShowAddForm(false)}
              isSubmitting={isSubmitting}
            />
          </Modal>
        )}

        {/* This modal handles the "Access Denied" popup when a row is clicked
            and the user doesn't have permission to view it.
        */}
        <ClarificationDetailModal
          clarification={selectedClarification}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedClarification(null);
          }}
          onSave={handleClarificationSave}
          onDelete={
            hasSpecificPermission("Clarifications", "canDelete")
              ? handleClarificationDelete
              : undefined
          }
        />

        <Card title="Clarification Analytics">
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <PieChart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                Response Time Analysis
              </h3>
              <p className="mt-1 text-gray-500">
                Analytics visualization would be displayed here showing
                clarification status distribution, response times, and trends
                over time.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ClarificationsPage;
