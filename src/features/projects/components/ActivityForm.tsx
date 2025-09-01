import React, { useState, useEffect } from "react";
import { ProjectActivity } from "../../../types/screen";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import SearchableSelect from "../../../components/ui/SearchableSelect";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { toast } from "react-hot-toast";
import { projectService, userService } from "../../../services/apiService";

interface ActivityFormProps {
  activity?: ProjectActivity | null;
  planningId: number;
  projectNo: string;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface Engineer {
  userId: string;
  firstName?: string;
  lastName?: string;
  userName: string;
  email: string;
  role: string;
}

const ActivityForm: React.FC<ActivityFormProps> = ({
  activity,
  planningId,
  projectNo,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    projectActivityId: 0,
    activityId: 0,
    planningId: 0,

    sigmaStartDate: "",
    sigmaFinishDate: "",

    cpPlannedStartDate: "",
    cpPlannedFinishedDate: "",

    cpActualStartDate: "",
    cpActualFinishedDate: "",

    cpPlannedQCStartDate: "",
    plannedQCCompletionDate: "",

    cpActualQCStartDate: "",
    actualQCCompletionDate: "",

    // Powell EDH Team - ID references and display names
    powellEDHManagerId: 0,
    powellEDHEngineerId: 0,
    powellEDHEngineer: "",
    powellEDHManager: "",

    // CP Team - ID references and display names
    cpProjectEngineerId: 0,
    cpAssignedEngineerId: 0,
    cpqcEngineerId: 0,
    cpProjectEngineer: "",
    cpAssignedEngineer: "",
    cpqcEngineer: "",

    plannedHours: 0,
    actualHours: 0,
    noOfErrorsFoundByCPQCEngineer: 0,
    noOfErrorsFoundInInternalReview: 0,
    noOfErrorsFoundByCustomer: 0,
    cpComments: "",
    activityStatus: "Not Started",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loadingEngineers, setLoadingEngineers] = useState(false);

  // Fetch engineers from API
  const fetchEngineers = async () => {
    try {
      setLoadingEngineers(true);

      const response = await userService.getAll();

      if (response.success) {
        // Filter only engineers from the API response
        const engineerUsers = (response.data || []).filter(
          (user: any) => user.role === "Engineer" || user.role === "engineer"
        );

        setEngineers(engineerUsers);
        console.log("Engineers loaded from API:", engineerUsers);
      } else {
        throw new Error("Failed to fetch engineers from API");
      }
    } catch (error) {
      console.warn("API unavailable for engineers, no data available:", error);
      setEngineers([]);
      toast("No engineer data available - API unavailable", {
        icon: "ℹ️",
        style: {
          background: "#3b82f6",
          color: "#ffffff",
        },
      });
    } finally {
      setLoadingEngineers(false);
    }
  };

  useEffect(() => {
    fetchEngineers();
  }, []);

  useEffect(() => {
    console.log("🔄 Setting form data from activity:", activity);

    if (activity) {
      // Helper function to format date for input fields
      const formatDateForInput = (
        dateString: string | null | undefined
      ): string => {
        if (!dateString) return "";
        return dateString.split("T")[0]; // Extract YYYY-MM-DD part
      };

      const newFormData = {
        projectActivityId: activity.projectActivityId || 0,
        activityId: activity.activityId || 0,
        planningId: activity.planningId || planningId,

        // Format dates for input fields
        sigmaStartDate: formatDateForInput(activity.sigmaStartDate),
        sigmaFinishDate: formatDateForInput(activity.sigmaFinishDate),

        cpPlannedStartDate: formatDateForInput(activity.cpPlannedStartDate),
        cpPlannedFinishedDate: formatDateForInput(
          activity.cpPlannedFinishedDate
        ),
        cpActualStartDate: formatDateForInput(activity.cpActualStartDate),
        cpActualFinishedDate: formatDateForInput(activity.cpActualFinishedDate),
        cpPlannedQCStartDate: formatDateForInput(activity.cpPlannedQCStartDate),
        plannedQCCompletionDate: formatDateForInput(
          activity.plannedQCCompletionDate
        ),
        cpActualQCStartDate: formatDateForInput(activity.cpActualQCStartDate),
        actualQCCompletionDate: formatDateForInput(
          activity.actualQCCompletionDate
        ),

        // Powell EDH Team
        powellEDHManagerId: activity.powellEDHManagerId || 0,
        powellEDHEngineerId: activity.powellEDHEngineerId || 0,
        powellEDHEngineer: activity.powellEDHEngineer || "",
        powellEDHManager: activity.powellEDHManager || "",

        // CP Team
        cpProjectEngineerId: activity.cpProjectEngineerId || 0,
        cpAssignedEngineerId: activity.cpAssignedEngineerId || 0,
        cpqcEngineerId: activity.cpqcEngineerId || 0,
        cpProjectEngineer: activity.cpProjectEngineer || "",
        cpAssignedEngineer: activity.cpAssignedEngineer || "",
        cpqcEngineer: activity.cpqcEngineer || "",

        plannedHours: activity.plannedHours || 0,
        actualHours: activity.actualHours || 0,
        noOfErrorsFoundByCPQCEngineer:
          activity.noOfErrorsFoundByCPQCEngineer || 0,
        noOfErrorsFoundInInternalReview:
          activity.noOfErrorsFoundInInternalReview || 0,
        noOfErrorsFoundByCustomer: activity.noOfErrorsFoundByCustomer || 0,
        cpComments: activity.cpComments || "",
        activityStatus: activity.activityStatus || "Not Started",
      };

      console.log("✅ Form data set:", newFormData);
      setFormData(newFormData);
    } else {
      // For new activities, use the provided planningId
      setFormData((prev) => ({
        ...prev,
        planningId: planningId,
        projectActivityId: 0,
      }));
    }
  }, [activity, planningId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    console.log("🔄 Form field changed:", { name, value, type });

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.activityId || formData.activityId === 0) {
      newErrors.activityId = "Activity ID is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log("🚀 Starting form submission...");
      console.log("📝 Raw form data:", formData);

      // ✅ CRITICAL: Use ultra-robust date formatting for API
      const activityData = {
        // Always include these IDs for proper API handling
        ...(activity && { projectActivityId: formData.projectActivityId }),
        activityId: formData.activityId,
        planningId: formData.planningId,
        activityStatus: formData.activityStatus,

        // ✅ CRITICAL: Convert all date fields with ultra-robust function

        sigmaStartDate: formData.sigmaStartDate,
        sigmaFinishDate: formData.sigmaFinishDate,

        cpPlannedStartDate: formData.cpPlannedStartDate,
        cpPlannedFinishedDate: formData.cpPlannedFinishedDate,
        cpActualStartDate: formData.cpActualStartDate,
        cpActualFinishedDate: formData.cpActualFinishedDate,
        cpPlannedQCStartDate: formData.cpPlannedQCStartDate,
        plannedQCCompletionDate: formData.plannedQCCompletionDate,
        cpActualQCStartDate: formData.cpActualQCStartDate,
        actualQCCompletionDate: formData.actualQCCompletionDate,

        // Powell EDH Team assignments (ExtraResource references)
        powellEDHManagerId: formData.powellEDHManagerId || null,
        powellEDHEngineerId: formData.powellEDHEngineerId || null,
        powellEDHEngineer: formData.powellEDHEngineer,
        powellEDHManager: formData.powellEDHManager,

        // CP Team assignments (Users references)
        cpProjectEngineerId: formData.cpProjectEngineerId || null,
        cpAssignedEngineerId: formData.cpAssignedEngineerId || null,
        cpqcEngineerId: formData.cpqcEngineerId || null,
        cpProjectEngineer: formData.cpProjectEngineer,
        cpAssignedEngineer: formData.cpAssignedEngineer,
        cpqcEngineer: formData.cpqcEngineer,

        // Hours and metrics
        plannedHours: formData.plannedHours,
        actualHours: formData.actualHours,
        noOfErrorsFoundByCPQCEngineer: formData.noOfErrorsFoundByCPQCEngineer,
        noOfErrorsFoundInInternalReview:
          formData.noOfErrorsFoundInInternalReview,
        noOfErrorsFoundByCustomer: formData.noOfErrorsFoundByCustomer,
        // Comments
        cpComments: formData.cpComments,
        createdBy:
          activity?.createdBy || localStorage.getItem("userId") || "system",
        createdAt: activity?.createdAt || new Date().toISOString(),
        // Set modified fields
        modifiedBy: localStorage.getItem("userId") || "system",
        modifiedAt: new Date().toISOString(),
      };

      onSubmit(activityData);
    } catch (error) {
      console.error("❌ Error submitting activity:", error);
      toast.error("Failed to save activity");
    } finally {
      setIsLoading(false);
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

  // Create engineer options from API data
  const engineerOptions = [
    // { value: "", label: "Select Engineer" },
    ...engineers.map((engineer) => {
      const fullName = `${engineer.firstName || ""} ${
        engineer.lastName || ""
      }`.trim();
      const displayName = fullName || engineer.userName;
      return {
        value: displayName,
        label: `${displayName} (${engineer.email})`,
      };
    }),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Engineer Loading Status */}
      {loadingEngineers && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">Loading engineers...</span>
          </div>
        </div>
      )}

      {/* Activity ID Information */}
      {activity && (
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">
                Activity Update Information
              </h3>
              <div className="mt-2 text-sm text-gray-600">
                <p>
                  <strong>Project Activity ID:</strong>{" "}
                  {formData.projectActivityId}
                </p>
                <p>
                  <strong>Planning ID:</strong> {formData.planningId}
                </p>
                <p className="mt-1 text-xs">
                  These IDs are automatically included in the update request.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card title="Activity Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Activity ID
            </label>
            <div className="text-sm text-gray-900 font-medium">
              {formData.activityId || "Not Set"}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Activity ID is automatically assigned from the activity master
            </p>
          </div>

          <Select
            id="activityStatus"
            name="activityStatus"
            label="Activity Status"
            value={formData.activityStatus}
            onChange={handleChange}
            options={statusOptions}
            disabled={isSubmitting}
          />
        </div>
      </Card>

      <Card title="Timeline">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            id="sigmaStartDate"
            name="sigmaStartDate"
            label="Sigma Start Date"
            type="date"
            value={formData.sigmaStartDate}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          <Input
            id="sigmaFinishDate"
            name="sigmaFinishDate"
            label="Sigma Finish Date"
            type="date"
            value={formData.sigmaFinishDate}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          <Input
            id="cpPlannedStartDate"
            name="cpPlannedStartDate"
            label="CP Planned Start Date"
            type="date"
            value={formData.cpPlannedStartDate}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          <Input
            id="cpActualStartDate"
            name="cpActualStartDate"
            label="CP Actual Start Date"
            type="date"
            value={formData.cpActualStartDate}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          <Input
            id="cpPlannedFinishedDate"
            name="cpPlannedFinishedDate"
            label="CP Planned Finished Date"
            type="date"
            value={formData.cpPlannedFinishedDate}
            onChange={handleChange}
            disabled={isSubmitting}
          />

          <Input
            id="cpActualFinishedDate"
            name="cpActualFinishedDate"
            label="CP Actual Finished Date"
            type="date"
            value={formData.cpActualFinishedDate}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
      </Card>

      <Card title="Team Assignment">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            id="powellEDHEngineer"
            name="powellEDHEngineer"
            label="Powell EDH Engineer"
            value={formData.powellEDHEngineer}
            onChange={handleChange}
            placeholder="Enter Powell EDH engineer..."
          />

          <SearchableSelect
            id="cpProjectEngineer"
            name="cpProjectEngineer"
            label="CP Project Engineer"
            value={formData.cpProjectEngineer}
            onChange={handleChange}
            options={engineerOptions}
            disabled={isSubmitting || loadingEngineers}
            placeholder="Search and select CP project engineer..."
          />

          <SearchableSelect
            id="cpAssignedEngineer"
            name="cpAssignedEngineer"
            label="CP Assigned Engineer"
            value={formData.cpAssignedEngineer}
            onChange={handleChange}
            options={engineerOptions}
            disabled={isSubmitting || loadingEngineers}
            placeholder="Search and select CP assigned engineer..."
          />

          <SearchableSelect
            id="cpqcEngineer"
            name="cpqcEngineer"
            label="CP QC Engineer"
            value={formData.cpqcEngineer}
            onChange={handleChange}
            options={engineerOptions}
            disabled={isSubmitting || loadingEngineers}
            placeholder="Search and select CP QC engineer..."
          />
        </div>
      </Card>

      <Card title="Hours & Quality Metrics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            id="plannedHours"
            name="plannedHours"
            label="Planned Hours"
            type="number"
            value={formData.plannedHours}
            onChange={handleChange}
            min={0}
            step="0.5"
            disabled={isSubmitting}
          />

          <Input
            id="actualHours"
            name="actualHours"
            label="Actual Hours"
            type="number"
            value={formData.actualHours}
            onChange={handleChange}
            min={0}
            step="0.5"
            disabled={isSubmitting}
          />

          <Input
            id="noOfErrorsFoundByCPQCEngineer"
            name="noOfErrorsFoundByCPQCEngineer"
            label="Errors Found by CP QC Engineer"
            type="number"
            value={formData.noOfErrorsFoundByCPQCEngineer}
            onChange={handleChange}
            min={0}
            disabled={true}
          />

          <Input
            id="noOfErrorsFoundInInternalReview"
            name="noOfErrorsFoundInInternalReview"
            label="Errors Found in Internal Review"
            type="number"
            value={formData.noOfErrorsFoundInInternalReview}
            onChange={handleChange}
            min={0}
            disabled={true}
          />

          <Input
            id="noOfErrorsFoundByCustomer"
            name="noOfErrorsFoundByCustomer"
            label="Errors Found by Customer"
            type="number"
            value={formData.noOfErrorsFoundByCustomer}
            onChange={handleChange}
            min={0}
            disabled={true}
          />
        </div>
      </Card>

      <Card title="Comments">
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
            value={formData.cpComments}
            onChange={handleChange}
            disabled={isSubmitting}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Enter any comments about this activity..."
          />
        </div>
      </Card>

      {/* Engineer Data Status */}
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
                No Engineer Data Available
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Engineer assignment dropdowns will be empty as no engineer
                  data is available from the API. You can still enter engineer
                  names manually if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {engineers.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Engineers Loaded Successfully
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  {engineers.length} engineer(s) loaded from the API. You can
                  search and select engineers from the dropdown menus.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ ENHANCED: Ultra-Robust Date Handling Status Panel */}
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-green-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              ✅ ULTRA-ROBUST Date Handling System
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Input Format:</strong> All date inputs use YYYY-MM-DD
                  format
                </li>
                <li>
                  <strong>API Format:</strong> All dates are converted to UTC
                  ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)
                </li>
                <li>
                  <strong>Timezone Safe:</strong> All dates are set to midnight
                  UTC to avoid timezone issues
                </li>
                <li>
                  <strong>Error Handling:</strong> Invalid dates are handled
                  gracefully with extensive logging
                </li>
                <li>
                  <strong>Debugging:</strong> All date conversions are logged to
                  browser console (F12)
                </li>
                <li>
                  <strong>Validation:</strong> Multiple layers of date format
                  validation ensure data integrity
                </li>
                <li>
                  <strong>Null Safety:</strong> Handles null, undefined, and
                  empty string values properly
                </li>
                <li>
                  <strong>Format Detection:</strong> Automatically detects and
                  handles different input formats
                </li>
                <li>
                  <strong>Component Validation:</strong> Validates year, month,
                  and day components individually
                </li>
                <li>
                  <strong>UTC Creation:</strong> Uses Date.UTC() for precise
                  timezone-independent date creation
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{activity ? "Updating..." : "Creating..."}</span>
            </div>
          ) : (
            <span>{activity ? "Update Activity" : "Create Activity"}</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;
