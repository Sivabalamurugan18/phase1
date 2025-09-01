import React, { useState, useMemo, useCallback, useEffect } from "react";
import { ProjectActivity } from "../../../../types";
import Card from "../../../../components/ui/Card";
import Button from "../../../../components/ui/Button";
import Modal from "../../../../components/ui/Modal";
import SearchableSelect from "../../../../components/ui/SearchableSelect";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import { Edit2, RefreshCw, Save, Undo } from "lucide-react";
import { formatDate, getStatusColorCode } from "../../../../utils/dateUtils";
import Badge from "../../../../components/ui/Badge";
import { toast } from "react-hot-toast";
import { projectService, userService } from "../../../../services/apiService";
import { resourceService } from "../../../../services/masterServices";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";

interface ProjectActivitiesTabProps {
  projectNo: string;
  projectName: string;
  planningId: number;
  activities: ProjectActivity[];
  onSaveActivity?: (activity: ProjectActivity) => void;
  onDeleteActivity?: (activityId: number) => void;
}

const ProjectActivitiesTab: React.FC<ProjectActivitiesTabProps> = ({
  projectNo,
  projectName,
  planningId,
  activities: initialActivities,
  onSaveActivity,
  onDeleteActivity,
}) => {
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedActivity, setSelectedActivity] =
    useState<ProjectActivity | null>(null);
  const [originalActivity, setOriginalActivity] =
    useState<ProjectActivity | null>(null);
  const [gridApi, setGridApi] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [localActivities, setLocalActivities] =
    useState<ProjectActivity[]>(initialActivities);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProjectActivity | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [engineers, setEngineers] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const [loadingEngineers, setLoadingEngineers] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);

  // Update local activities when props change
  useEffect(() => {
    setLocalActivities(initialActivities);
    fetchEngineers();
    fetchResources();
  }, [initialActivities]);

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Actions",
        width: 120,
        pinned: "left",
        cellRenderer: (params: any) => (
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="h-4 w-4" />}
              onClick={() => handleEditActivity(params.data)}
              title="Edit Activity"
            />
            {/* <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => handleDeleteActivity(params.data)}
              title="Delete Activity"
            /> */}
          </div>
        ),
      },
      {
        field: "projectActivityId",
        headerName: "Project Activity ID",
        filter: "agNumberColumnFilter",
        width: 150,
        cellClass: "font-medium text-blue-600",
        sortable: true,
        hide: true, // Hidden as requested
      },
      {
        field: "activityId",
        headerName: "Activity ID",
        filter: "agNumberColumnFilter",
        width: 120,
        cellClass: "font-medium text-purple-600",
        sortable: true,
        hide: true, // Hidden as requested
      },
      {
        field: "planningId",
        headerName: "Planning ID",
        filter: "agNumberColumnFilter",
        width: 120,
        cellClass: "font-medium text-green-600",
        sortable: true,
        hide: true, // Hidden as requested
      },
      {
        headerName: "Activity Name",
        filter: "agTextColumnFilter",
        width: 180,
        cellClass: "font-medium text-gray-900",
        sortable: true,
        valueGetter: (params: any) => {
          // Get activity name from nested activity object or fallback
          return (
            params.data.activity?.activityName ||
            params.data.activityName ||
            "N/A"
          );
        },
        cellRenderer: (params: any) => {
          const activityName =
            params.data.activity?.activityName ||
            params.data.activityName ||
            "N/A";
          const activityOrder = params.data.activity?.order;

          return (
            <div className="flex items-center space-x-2">
              <span title={activityName} className="truncate max-w-[140px]">
                {activityName}
              </span>
              {activityOrder && (
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex-shrink-0">
                  #{activityOrder}
                </span>
              )}
            </div>
          );
        },
      },
      {
        field: "cpActualStartDate",
        headerName: "CP Actual Start Date",
        filter: "agDateColumnFilter",
        width: 200,
        sortable: true,
        cellRenderer: (params: any) => formatDate(params.value),
      },
      {
        field: "cpActualFinishedDate",
        headerName: "CP Actual Finish Date",
        filter: "agDateColumnFilter",
        width: 200,
        sortable: true,
        cellRenderer: (params: any) => formatDate(params.value),
      },
      {
        field: "activityStatus",
        headerName: "Status",
        width: 130,
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <Badge
            text={params.value || "Not Started"}
            className={getStatusColorCode(params.value)}
          />
        ),
      },
      // },
      // {
      //   field: "powellEDHEngineer",
      //   headerName: "Powell EDH Engineer",
      //   filter: "agTextColumnFilter",
      //   width: 160,
      //   sortable: true,
      //   cellRenderer: (params: any) => params.value || "Not Assigned",
      // },
      // {
      //   field: "cpProjectEngineer",
      //   headerName: "CP Project Engineer",
      //   filter: "agTextColumnFilter",
      //   width: 160,
      //   sortable: true,
      //   cellRenderer: (params: any) => params.value || "Not Assigned",
      // },
      // {
      //   field: "cpAssignedEngineer",
      //   headerName: "CP Assigned Engineer",
      //   filter: "agTextColumnFilter",
      //   width: 170,
      //   sortable: true,
      //   cellRenderer: (params: any) => params.value || "Not Assigned",
      // },
      // {
      //   field: "cpqcEngineer",
      //   headerName: "CP QC Engineer",
      //   filter: "agTextColumnFilter",
      //   width: 150,
      //   sortable: true,
      //   cellRenderer: (params: any) => params.value || "Not Assigned",
      // },
    ],
    []
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: false,
    }),
    []
  );

  const gridOptions = {
    pagination: true,
    paginationPageSize: 10,
    rowHeight: 50,
    headerHeight: 40,
    animateRows: true,
    enableRangeSelection: true,
    suppressRowClickSelection: false,
    rowSelection: "single",
    suppressColumnVirtualisation: false,
    enableCellTextSelection: true,
    suppressRowHoverHighlight: false,
  };

  const onGridReady = useCallback((params: any) => {
    setGridApi(params.api);
    params.api.autoSizeAllColumns();
  }, []);

  // Fetch CP Engineers (existing API)
  const fetchEngineers = async () => {
    try {
      setLoadingEngineers(true);
      const response = await userService.getAll();

      if (response.success) {
        const engineerUsers = (response.data || []).filter(
          (user: any) => user.role === "Engineer" || user.role === "engineer"
        );
        setEngineers(engineerUsers);
        console.log("fetch engineers :", engineerUsers);
      } else {
        throw new Error("Failed to fetch engineers from API");
      }
    } catch (error) {
      console.warn("API unavailable for engineers:", error);
      setEngineers([]);
    } finally {
      setLoadingEngineers(false);
    }
  };

  // Fetch Extra Resources from ExtraResource Master API
  const fetchResources = async () => {
    try {
      setLoadingResources(true);

      const response = await resourceService.getAll();

      if (response.success) {
        // Filter only active extra resources
        const activeResources = (response.data || []).filter(
          (resource: any) => resource.isLive
        );
        setResources(activeResources);
        console.log("Extra Resources loaded from API:", activeResources);
      } else {
        throw new Error("Failed to fetch extra resources from API");
      }
    } catch (error) {
      console.warn("API unavailable for extra resources:", error);
      setResources([]);
      toast("No extra resource data available - API unavailable", {
        icon: "ℹ️",
        style: {
          background: "#3b82f6",
          color: "#ffffff",
        },
      });
    } finally {
      setLoadingResources(false);
    }
  };

  // Fetch Extra Resource Roles from ExtraResourceRole Master API

  // Fetch activities from API
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await projectService.getActivities(planningId);

      if (response.success) {
        setLocalActivities(response.data || []);
        toast.success("Activities refreshed successfully");
      } else {
        throw new Error(response.error || "Failed to fetch activities");
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to refresh activities");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchActivities();
    fetchEngineers();
    fetchResources();
  };

  const handleEditActivity = (activity: ProjectActivity) => {
    setSelectedActivity(activity);
    setOriginalActivity({ ...activity }); // Store original for undo
    setFormData({ ...activity });
    setIsEditing(false);
    setShowActivityModal(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => {
      if (!prev) return prev;

      // Handle Powell EDH team assignments (ExtraResource references)
      if (name === "powellEDHEngineer") {
        const selectedResource = resources.find(
          (r) => r.resourceId.toString() === value
        );
        return {
          ...prev,
          powellEDHEngineer: selectedResource
            ? selectedResource.resourceName
            : "",
          powellEDHEngineerId: selectedResource
            ? selectedResource.resourceId
            : 0,
        };
      }

      if (name === "powellEDHManager") {
        const selectedResource = resources.find(
          (r) => r.resourceId.toString() === value
        );
        return {
          ...prev,
          powellEDHManager: selectedResource
            ? selectedResource.resourceName
            : "",
          powellEDHManagerId: selectedResource
            ? selectedResource.resourceId
            : 0,
        };
      }

      if (name === "cpProjectEngineer") {
        const selectedEngineer = engineers.find(
          (e) => e.userId.toString() === value
        );
        return {
          ...prev,
          cpProjectEngineer: selectedEngineer.firstName,
          cpProjectEngineerId: selectedEngineer ? selectedEngineer.userId : 0,
        };
      }

      if (name === "cpAssignedEngineer") {
        const selectedEngineer = engineers.find(
          (e) => e.userId.toString() === value
        );
        return {
          ...prev,
          cpAssignedEngineer: selectedEngineer.firstName,
          cpAssignedEngineerId: selectedEngineer ? selectedEngineer.userId : 0,
        };
      }

      if (name === "cpqcEngineer") {
        const selectedEngineer = engineers.find(
          (e) => e.userId.toString() === value
        );
        return {
          ...prev,
          cpqcEngineer: selectedEngineer.firstName,
          cpqcEngineerId: selectedEngineer ? selectedEngineer.userId : 0,
        };
      }

      return {
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      };
    });
    setIsEditing(true);
  };

  const toUTC = (date: any): string | null => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const handleSave = async () => {
    console.log("formData", formData);
    if (!formData || !selectedActivity) return;
    try {
      setIsSubmitting(true);

      const activityPayload = {
        projectActivityId: formData.projectActivityId,
        activityId: formData.activityId,
        planningId: formData.planningId,
        activityStatus: formData.activityStatus,

        // Date fields - convert to UTC ISO format
        sigmaStartDate: toUTC(formData.sigmaStartDate) || null,
        sigmaFinishDate: toUTC(formData.sigmaFinishDate) || null,
        cpPlannedStartDate: toUTC(formData.cpPlannedStartDate),
        cpPlannedFinishedDate: toUTC(formData.cpPlannedFinishedDate),
        cpActualStartDate: toUTC(formData.cpActualStartDate),
        cpActualFinishedDate: toUTC(formData.cpActualFinishedDate),
        cpPlannedQCStartDate: toUTC(formData.cpPlannedQCStartDate),
        plannedQCCompletionDate: toUTC(formData.plannedQCCompletionDate),
        cpActualQCStartDate: toUTC(formData.cpActualQCStartDate),
        actualQCCompletionDate: toUTC(formData.actualQCCompletionDate),

        powellEDHManagerId: formData.powellEDHManagerId || null,
        powellEDHEngineerId: formData.powellEDHEngineerId || null,

        // CP Team assignments - Send as string names and IDs
        cpProjectEngineerId: formData.cpProjectEngineerId || null,
        cpAssignedEngineerId: formData.cpAssignedEngineerId || null,
        cpqcEngineerId: formData.cpqcEngineerId || null,
        // cpProjectEngineer: formData.cpProjectEngineer || null,
        // cpAssignedEngineer: formData.cpAssignedEngineer || null,
        // cpqcEngineer: formData.cpqcEngineer || null,

        // Hours and metrics
        plannedHours: Number(formData.plannedHours) || 0,
        actualHours: Number(formData.actualHours) || 0,
        noOfErrorsFoundByCPQCEngineer:
          Number(formData.noOfErrorsFoundByCPQCEngineer) || 0,
        noOfErrorsFoundInInternalReview:
          Number(formData.noOfErrorsFoundInInternalReview) || 0,
        noOfErrorsFoundByCustomer:
          Number(formData.noOfErrorsFoundByCustomer) || 0,
        // Comments
        cpComments: formData.cpComments || null,
        createdBy: formData.createdBy || localStorage.getItem("userId"),

        createdAt: formData.createdAt || new Date().toISOString(),

        // Set modified fields

        modifiedBy: localStorage.getItem("userId") || "system",

        modifiedAt: new Date().toISOString(),
      };

      console.log("Activity payload being sent:", activityPayload);

      const response = await projectService.updateActivity(
        formData.projectActivityId,
        activityPayload
      );

      if (response.success) {
        // Update local state
        setLocalActivities((prev) =>
          prev.map((activity) =>
            activity.projectActivityId === formData.projectActivityId
              ? formData
              : activity
          )
        );

        // Call parent callback if provided
        if (onSaveActivity) {
          console.log(onSaveActivity);
          onSaveActivity(formData);
        }

        setIsEditing(false);
        setShowActivityModal(false);
        setSelectedActivity(null);
        setFormData(null);
        toast.success("Activity updated successfully");
      } else {
        throw new Error(response.error || "Failed to update activity");
      }
    } catch (error) {
      console.error("Error updating activity:", error);

      // Fallback to local update for demo purposes
      setLocalActivities((prev) =>
        prev.map((activity) =>
          activity.projectActivityId === formData.projectActivityId
            ? formData
            : activity
        )
      );

      if (onSaveActivity) {
        onSaveActivity(formData);
      }

      setIsEditing(false);
      setShowActivityModal(false);
      setSelectedActivity(null);
      setFormData(null);

      toast.error(
        `API Error: ${
          error instanceof Error ? error.message : "Failed to save to server"
        }. Updated locally instead.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndo = () => {
    if (isEditing && originalActivity) {
      const confirmed = window.confirm(
        "Are you sure you want to discard your changes? All unsaved changes will be lost."
      );
      if (confirmed) {
        setFormData({ ...originalActivity });
        setIsEditing(false);
        toast.info("Changes discarded");
      }
    } else {
      setShowActivityModal(false);
      setSelectedActivity(null);
      setFormData(null);
      setIsEditing(false);
    }
  };

  const statusOptions = [
    { value: "Not Started", label: "Not Started" },
    { value: "In Progress", label: "In Progress" },
    { value: "Hold", label: "Hold" },
    { value: "Suspended", label: "Suspended" },
    { value: "Withdrawn", label: "Withdrawn" },
    { value: "Completed", label: "Completed" },
  ];

  // Create engineer options from API data (for CP engineers)
  // const cpEngineerOptions = [
  //   { value: "", label: "Select Engineer" },
  //   ...engineers.map((engineer) => {
  //     const fullName = `${engineer.firstName || ""} ${
  //       engineer.lastName || ""
  //     }`.trim();
  //     const displayName = fullName || engineer.userName;
  //     return {
  //       value: displayName,
  //       label: `${displayName} (${engineer.email})`,
  //     };
  //   }),
  // ];
  const cpEngineerOptions = [
    
    ...engineers.map((engineer) => {
      console.log("dropdown options :", engineer);
      const fullName = `${engineer.firstName || ""} ${
        engineer.lastName || ""
      }`.trim();
      const displayName = fullName;
      return {
        value: engineer.userId.toString(), // <-- Use userId
        label: `${displayName} (${engineer.changepondEmpId})`,
      };
    }),
  ];

  // Create Extra Resource options from ExtraResource Master API data
  // Create Engineer Extra Resource options (filtered by Engineer role)

  const engineerResourceOptions = [
    // { value: 0, label: "Select Powell EDH Engineer" },
    ...resources
      .filter((resource) => resource.resourceRoleName === "Engineer")
      .map((resource) => ({
        value: resource.resourceId.toString(),
        label: `${resource.resourceName}`,
      })),
  ];

  const managerResourceOptions = [
    // { value: 0, label: "Select Powell EDH Manager" },
    ...resources
      .filter((resource) => resource.resourceRoleName === "Manager")
      .map((resource) => ({
        value: resource.resourceId.toString(),
        label: `${resource.resourceName}`,
      })),
  ];

  return (
    <div className="space-y-6">
      <Card
        title={`Project Activities (${localActivities.length})`}
        headerRight={
          <div className="flex space-x-2">
            <Button
              variant="outline"
              icon={<RefreshCw className="h-4 w-4" />}
              onClick={fetchActivities}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Grid */}
          <div className="ag-theme-alpine w-full h-[500px]">
            <AgGridReact
              rowData={localActivities}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              gridOptions={gridOptions}
              onGridReady={onGridReady}
              rowClass="cursor-pointer hover:bg-gray-50"
              suppressColumnVirtualisation={false}
              enableCellTextSelection={true}
              suppressRowHoverHighlight={false}
              loading={loading}
              loadingOverlayComponent={"Loading..."}
              loadingOverlayComponentParams={{
                loadingMessage: "Loading activities...",
              }}
            />
          </div>

          {localActivities.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <p className="text-lg font-medium">No activities found</p>
                <p className="text-sm">
                  Activities are created automatically when the project is
                  planned based on the division's master activities.
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Activity Edit Modal */}
      <Modal
        isOpen={showActivityModal}
        onClose={() => {
          if (!isSubmitting) {
            handleUndo();
          }
        }}
        title={
          <div className="flex items-center justify-between w-full pr-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Activity
              </h2>
              <div className="text-sm text-gray-500 mt-1 space-y-1">
                <p>
                  Project Number:{" "}
                  <span className="font-mono text-blue-600">{projectNo}</span>{" "}
                  || Project Name:{projectName}
                  <span className="font-mono text-purple-600">{""}</span>
                </p>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Activity:{" "}
                <span className="font-medium">
                  {formData?.activity?.activityName ||
                    formData?.activity?.activityName ||
                    "N/A"}
                </span>
                {formData?.activity?.order && (
                  <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Sequence #{formData.activity.order}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Undo className="h-4 w-4" />}
                onClick={handleUndo}
                disabled={isSubmitting}
                title="Discard changes"
              >
                Undo
              </Button>
              {/* <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
                disabled={isSubmitting}
                title="Delete activity"
              >
                Delete
              </Button> */}
              <Button
                variant="primary"
                size="sm"
                icon={<Save className="h-4 w-4" />}
                onClick={handleSave}
                disabled={!isEditing || isSubmitting}
                title="Save changes"
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        }
        size="lg"
      >
        {formData && (
          <div className="h-[65vh] overflow-y-auto space-y-6">
            {/* Loading Status */}
            {(loadingEngineers || loadingResources) && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-blue-700">
                    Loading engineers, extra resources, and roles...
                  </span>
                </div>
              </div>
            )}

            {/* Engineer Data Status - CP Engineers */}
            {!loadingEngineers && engineers.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      No CP Engineer Data Available
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        CP Engineer assignment dropdowns will be empty as no CP
                        engineer data is available from the API.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loadingResources && resources.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      No Extra Resource or Role Data Available
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Powell EDH Engineer and Manager dropdowns will be empty
                        as no extra resource or role data is available from the
                        API.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Editable Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                id="activityStatus"
                name="activityStatus"
                label="Activity Status"
                value={formData.activityStatus || ""}
                onChange={handleInputChange}
                options={statusOptions}
                disabled={isSubmitting}
              />
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="sigmaStartDate"
                  name="sigmaStartDate"
                  label="Sigma Start Date"
                  type="date"
                  value={
                    formData.sigmaStartDate
                      ? formData.sigmaStartDate.split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <Input
                  id="sigmaFinishDate"
                  name="sigmaFinishDate"
                  label="Sigma Finish Date"
                  type="date"
                  value={
                    formData.sigmaFinishDate
                      ? formData.sigmaFinishDate.split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={!formData.sigmaStartDate || isSubmitting}
                  min={
                    formData.sigmaStartDate
                      ? formData.sigmaStartDate.split("T")[0]
                      : undefined
                  }
                />
                <Input
                  id="cpPlannedStartDate"
                  name="cpPlannedStartDate"
                  label="CP Planned Start Date"
                  type="date"
                  value={
                    formData.cpPlannedStartDate
                      ? formData.cpPlannedStartDate.split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <Input
                  id="cpPlannedFinishedDate"
                  name="cpPlannedFinishedDate"
                  label="CP Planned Finished Date"
                  type="date"
                  value={
                    formData.cpPlannedFinishedDate
                      ? formData.cpPlannedFinishedDate.split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={!formData.cpPlannedStartDate || isSubmitting}
                  min={
                    formData.cpPlannedStartDate
                      ? formData.cpPlannedStartDate.split("T")[0]
                      : undefined
                  }
                />
                <Input
                  id="cpActualStartDate"
                  name="cpActualStartDate"
                  label="CP Actual Start Date"
                  type="date"
                  value={
                    formData.cpActualStartDate
                      ? formData.cpActualStartDate.split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />

                <Input
                  id="cpActualFinishedDate"
                  name="cpActualFinishedDate"
                  label="CP Actual Finished Date"
                  type="date"
                  value={
                    formData.cpActualFinishedDate
                      ? formData.cpActualFinishedDate.split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={!formData.cpActualStartDate || isSubmitting}
                  min={
                    formData.cpActualStartDate
                      ? formData.cpActualStartDate.split("T")[0]
                      : undefined
                  }
                />
                <Input
                  id="cpPlannedQCStartDate"
                  name="cpPlannedQCStartDate"
                  label="CP Planned QC Start Date"
                  type="date"
                  value={
                    formData.cpPlannedQCStartDate
                      ? formData.cpPlannedQCStartDate.split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <Input
                  id="plannedQCCompletionDate"
                  name="plannedQCCompletionDate"
                  label="Planned QC Completion Date"
                  type="date"
                  value={
                    formData.plannedQCCompletionDate
                      ? formData.plannedQCCompletionDate.split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={!formData.cpPlannedQCStartDate || isSubmitting}
                  min={
                    formData.cpPlannedQCStartDate
                      ? formData.cpPlannedQCStartDate.split("T")[0]
                      : undefined
                  }
                />
                <Input
                  id="cpActualQCStartDate"
                  name="cpActualQCStartDate"
                  label="CP Actual QC Start  Date"
                  type="date"
                  value={
                    formData.cpActualQCStartDate
                      ? formData.cpActualQCStartDate.split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <Input
                  id="actualQCCompletionDate"
                  name="actualQCCompletionDate"
                  label="Actual QC Completion Date"
                  type="date"
                  value={
                    formData.actualQCCompletionDate
                      ? formData.actualQCCompletionDate.split("T")[0]
                      : ""
                  }
                  onChange={handleInputChange}
                  disabled={!formData.cpActualQCStartDate || isSubmitting}
                  min={
                    formData.cpActualQCStartDate
                      ? formData.cpActualQCStartDate.split("T")[0]
                      : undefined
                  }
                />
              </div>
            </div>

            {/* Team Assignment */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Team Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SearchableSelect
                  id="powellEDHEngineer"
                  name="powellEDHEngineer"
                  label="Powell Engineer"
                  value={formData.powellEDHEngineerId?.toString() || ""}
                  onChange={handleInputChange}
                  options={engineerResourceOptions}
                  disabled={isSubmitting || loadingResources}
                  placeholder="Select Powell  Engineer"
                />

                <SearchableSelect
                  id="powellEDHManager"
                  name="powellEDHManager"
                  label="Powell  Manager"
                  value={formData.powellEDHManagerId?.toString() || ""}
                  onChange={handleInputChange}
                  options={managerResourceOptions}
                  disabled={isSubmitting || loadingResources}
                  placeholder="Select Powell  Manager"
                />

                <SearchableSelect
                  id="cpProjectEngineer"
                  name="cpProjectEngineer"
                  label="CP Project Engineer"
                  value={formData.cpProjectEngineerId || ""}
                  onChange={handleInputChange}
                  options={cpEngineerOptions}
                  disabled={isSubmitting || loadingEngineers}
                  placeholder="Select Engineer"
                />

                <SearchableSelect
                  id="cpAssignedEngineer"
                  name="cpAssignedEngineer"
                  label="CP Assigned Engineer"
                  value={formData.cpAssignedEngineerId || ""}
                  onChange={handleInputChange}
                  options={cpEngineerOptions}
                  disabled={isSubmitting || loadingEngineers}
                  placeholder="Select Engineer"
                />

                <SearchableSelect
                  id="cpqcEngineer"
                  name="cpqcEngineer"
                  label="CP QC Engineer"
                  value={formData.cpqcEngineerId || ""}
                  onChange={handleInputChange}
                  options={cpEngineerOptions}
                  disabled={isSubmitting || loadingEngineers}
                  placeholder="Select Engineer"
                />
              </div>
            </div>

            {/* Hours & Quality Metrics */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Hours & Quality Metrics
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  id="plannedHours"
                  name="plannedHours"
                  label="Planned Hours"
                  type="number"
                  value={formData.plannedHours || 0}
                  onChange={handleInputChange}
                  min={0}
                  step="0.5"
                  disabled={isSubmitting}
                />
                <Input
                  id="actualHours"
                  name="actualHours"
                  label="Actual Hours"
                  type="number"
                  value={formData.actualHours || 0}
                  onChange={handleInputChange}
                  min={0}
                  step="0.5"
                  disabled={isSubmitting}
                />
              </div>

              {/* Quality Metrics Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Quality Metrics Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {formData.noOfErrorsFoundByCPQCEngineer || 0}
                    </p>
                    <p className="text-sm text-gray-600">Discrepencies @ CP</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">
                      {formData.noOfErrorsFoundInInternalReview || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      Discrepencies @ Powell
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {formData.noOfErrorsFoundByCustomer || 0}
                    </p>
                    <p className="text-sm text-gray-600">
                      {" "}
                      Discrepencies @ Customer
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label
                htmlFor="cpComments"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                CP Comments
              </label>
              <textarea
                id="cpComments"
                name="cpComments"
                rows={4}
                value={formData.cpComments || ""}
                onChange={handleInputChange}
                disabled={isSubmitting}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Enter any comments about this activity..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectActivitiesTab;
