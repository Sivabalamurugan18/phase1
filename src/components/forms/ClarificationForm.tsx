import React, { useState, useEffect } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SearchableSelect from "../ui/SearchableSelect";
import Button from "../ui/Button";
import { userService, projectService } from "../../services/apiService";
import { toast } from "react-hot-toast";
import { User } from "../../types/admin";

interface ClarificationFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface ActivityOption {
  value: string;
  label: string;
}

const ClarificationForm: React.FC<ClarificationFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    planningId: 0,
    projectActivityId: 0,
    docReference: "",
    clarificationDescription: "",
    raisedById: "", // Store user ID for API
    dateRaised: new Date().toISOString().split("T")[0],
    criticalityIndex: "",
    status: "Open",
    response: "",
    responsesFromId: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activities, setActivities] = useState<ActivityOption[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Mock Powell users with unique UUIDs
  const mockPowellUsers: User[] = [
    {
      userId: "1861f1c8-be04-47d2-86b7-6b2ce9e6a7d4",
      firstName: "Powell",
      lastName: "Engineer",
      userName: "powell.engineer",
      email: "powell.engineer@powell.com",
      role: "Engineer",
      changepondEmpId: 0,
    },
    {
      userId: "2f72e3d9-cf15-48e3-97c8-7c3df0f8b8e5",
      firstName: "Powell",
      lastName: "Mech Engineer",
      userName: "powell.mech.engineer",
      email: "powell.mech.engineer@powell.com",
      role: "Engineer",
      changepondEmpId: 0,
    },
    {
      userId: "3a83f4ea-d026-59f4-a8d9-8d4ef1f9c9f6",
      firstName: "Powell",
      lastName: "Project Manager",
      userName: "powell.project.manager",
      email: "powell.project.manager@powell.com",
      role: "Project Manager",
      changepondEmpId: 0,
    },
    {
      userId: "4b94f5fb-e137-6af5-b9ea-9e5ff2facaf7",
      firstName: "Powell",
      lastName: "PM/Estimation",
      userName: "powell.pm.estimation",
      email: "powell.pm.estimation@powell.com",
      role: "Project Manager",
      changepondEmpId: 0,
    },
    {
      userId: "5ca5f6fc-f248-7bf6-cafb-af6ff3fbdbf8",
      firstName: "Powell",
      lastName: "PM/Customer",
      userName: "powell.pm.customer",
      email: "powell.pm.customer@powell.com",
      role: "Project Manager",
      changepondEmpId: 0,
    },
  ];
  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);

      const response = await userService.getAll();

      if (response.success) {
        const apiUsers = response.data || [];
        setUsers(apiUsers);
        console.log("Users loaded from API:", apiUsers);
      } else {
        throw new Error("Failed to fetch users from API");
      }
    } catch (error) {
      console.warn("API unavailable for users, no data available:", error);
      // If API fails, show empty array for raised by
      setUsers([]);
      toast("No user data available - API unavailable", {
        icon: "ℹ️",
        style: {
          background: "#3b82f6",
          color: "#ffffff",
        },
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);

      const response = await projectService.getAll();

      if (response.success) {
        setProjects(response.data || []);
        console.log("Projects loaded from API:", response.data);
      } else {
        throw new Error("Failed to fetch projects from API");
      }
    } catch (error) {
      console.warn("API unavailable for projects:", error);
      setProjects([]);
      toast("No project data available - API unavailable", {
        icon: "ℹ️",
        style: {
          background: "#3b82f6",
          color: "#ffffff",
        },
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const docReferenceOptions = [
    
    { value: "IEEE-519", label: "IEEE-519 - Harmonic Control" },
    { value: "IEEE-1547", label: "IEEE-1547 - Interconnection Standards" },
    { value: "NEMA-MG1", label: "NEMA-MG1 - Motors and Generators" },
    { value: "IEC-61850", label: "IEC-61850 - Communication Protocol" },
    { value: "ANSI-C37.2", label: "ANSI-C37.2 - Device Function Numbers" },
    {
      value: "IEEE-C57.12.00",
      label: "IEEE-C57.12.00 - Transformer Standards",
    },
    { value: "NFPA-70E", label: "NFPA-70E - Electrical Safety" },
    { value: "UL-508A", label: "UL-508A - Industrial Control Panels" },
    { value: "IEC-60947", label: "IEC-60947 - Low-voltage Switchgear" },
    { value: "IEEE-242", label: "IEEE-242 - Protection and Coordination" },
    { value: "ANSI-C84.1", label: "ANSI-C84.1 - Voltage Ratings" },
    { value: "IEC-61439", label: "IEC-61439 - Low-voltage Assemblies" },
    { value: "CUSTOMER-SPEC", label: "Customer Specification Document" },
    { value: "PROJECT-SPEC", label: "Project Specification Document" },
    { value: "DESIGN-CALC", label: "Design Calculation Document" },
    { value: "OTHER", label: "Other Reference Document" },
  ];

  const fetchActivitiesByProject = async (planningId: number) => {
    if (!planningId) {
      setActivities([]);
      setFormData((prev) => ({ ...prev, planningId: 0, projectActivityId: 0 }));
      return;
    }

    try {
      setLoadingActivities(true);

      // Fetch activities for this project using planningId
      const activitiesResponse = await projectService.getActivities(planningId);

      if (activitiesResponse.success) {
        const activityOptions = (activitiesResponse.data || []).map(
          (activity: any) => ({
            value: activity.projectActivityId.toString(),
            label:
              activity.activity?.activityName ||
              `Activity ${activity.activityId}`,
          })
        );

        setActivities(activityOptions);
        console.log("Project activities loaded:", activityOptions);
      } else {
        throw new Error("Failed to fetch project activities");
      }
    } catch (error) {
      console.error("Error fetching project activities:", error);
      setActivities([]);
      toast.error("Failed to load project activities");
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle project selection - fetch activities
    if (name === "planningId") {
      const selectedPlanningId = parseInt(value) || 0;
      setFormData((prev) => ({
        ...prev,
        planningId: selectedPlanningId,
        projectActivityId: 0, // Reset activity when project changes
      }));

      // Fetch activities for the selected project
      fetchActivitiesByProject(selectedPlanningId);
    } else if (name === "projectActivityId") {
      setFormData((prev) => ({
        ...prev,
        projectActivityId: parseInt(value) || 0,
      }));
    } else if (name === "raisedById") {
      // Handle raised by user selection - store user ID
      setFormData((prev) => ({
        ...prev,
        raisedById: value, // Store the userId directly
      }));
    } else if (name === "responsesFrom") {
      // Handle response from user selection - store user ID
      setFormData((prev) => ({
        ...prev,
        responsesFromId: value, // Store the userId directly
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing or selecting
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.planningId) newErrors.planningId = "Project is required";
    if (!formData.projectActivityId)
      newErrors.projectActivityId = "Activity is required";
    if (!formData.clarificationDescription.trim())
      newErrors.clarificationDescription = "Description is required";
    if (!formData.raisedById.trim())
      newErrors.raisedById = "Raised By is required";
    if (!formData.dateRaised) newErrors.dateRaised = "Date Raised is required";
    if (!formData.criticalityIndex)
      newErrors.criticalityIndex = "Criticality Index is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toUTC = (date: string): string | null => {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Submit with IDs for API but keep names for display
    const submitData = {
      planningId: formData.planningId,
      projectActivityId: formData.projectActivityId,
      docReference: formData.docReference,
      clarificationDescription: formData.clarificationDescription,
      raisedById: formData.raisedById, // Store user ID for API
      dateRaised: toUTC(formData.dateRaised),
      criticalityIndex: formData.criticalityIndex,
      status: formData.status,
      response: formData.response,
      responsesFromId: formData.responsesFromId, // Store user ID for API
      createdBy: localStorage.getItem("userId"),

      createdAt: new Date().toISOString(),
    };
    console.log("Submit datas :", submitData);

    onSubmit(submitData);
  };

  const criticalityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ];

  const statusOptions = [
    { value: "Open", label: "Open" },
    { value: "In Review", label: "In Review" },
    { value: "Closed", label: "Closed" },
  ];

  // Create project options from API data
  const projectOptions = [
    { value: "", label: "Select Project" },
    ...projects.map((project) => ({
      value: project.planningId.toString(),
      label: `${project.projectNo} - ${project.projectName || "Project"}`,
    })),
  ];

  // Create user options from API data for "Raised By" dropdown
  const raisedByOptions = [
    
    // Only show API users for "Raised By"
    ...users
      .filter(
        (user) =>
          !mockPowellUsers.some((mockUser) => mockUser.userId === user.userId)
      )
      .map((user) => {
        const fullName = `${user.firstName || ""} ${
          user.lastName || ""
        }`.trim();
        const displayName = fullName || user.userName;
        return {
          value: user.userId,
          label: `${displayName}`,
        };
      }),
  ];

  // Create user options from API data for "Response From" dropdown
  const responseFromOptions = [
    // { value: "", label: "Select User" },
    // Show mock Powell users first (with clear labeling)
    ...mockPowellUsers.map((user) => {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      const displayName = fullName || user.userName;
      return {
        value: user.userId,
        label: `${displayName} (Powell Team)`,
      };
    }),
    // Add separator if both Powell and API users exist
    ...(mockPowellUsers.length > 0 && users.length > 0
      ? [{ value: "separator", label: "── Changepond Team ──", disabled: true }]
      : []),
    // Show API users (Changepond team)
    ...users
      .filter(
        (user) =>
          !mockPowellUsers.some((mockUser) => mockUser.userId === user.userId)
      )
      .map((user) => {
        const fullName = `${user.firstName || ""} ${
          user.lastName || ""
        }`.trim();
        const displayName = fullName || user.userName;
        return {
          value: user.userId,
          label: `${displayName} (${user.role})`,
        };
      }),
  ];

  // Create activity options for the select dropdown
  const activitySelectOptions = [
    {
      value: "",
      label: loadingActivities
        ? "Loading activities..."
        : formData.planningId
        ? "Select an activity"
        : "First select a project",
    },
    ...activities,
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* User Loading Status */}
      {loadingUsers && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">Loading users...</span>
          </div>
        </div>
      )}

      {/* Projects Loading Status */}
      {loadingProjects && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">Loading projects...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <SearchableSelect
          id="planningId"
          name="planningId"
          label="Project"
          value={formData.planningId.toString()}
          onChange={handleChange}
          options={projectOptions}
          required
          error={errors.planningId}
          disabled={isSubmitting || loadingProjects}
          placeholder="Search and select a project..."
          className="col-span-2 max-w-[400px]"
        />

        <Select
          id="projectActivityId"
          name="projectActivityId"
          label="Activities"
          value={formData.projectActivityId.toString()}
          onChange={handleChange}
          options={activitySelectOptions}
          required
          error={errors.projectActivityId}
          disabled={!formData.planningId || loadingActivities || isSubmitting}
          className="col-span-2 max-w-[400px]"
        />

        {/* Activity Loading Indicator */}
        {loadingActivities && (
          <div className="col-span-2 max-w-[400px]">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-700">
                  Loading activities for selected project...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* No Activities Message */}
        {formData.planningId &&
          !loadingActivities &&
          activities.length === 0 && (
            <div className="col-span-2 max-w-[400px]">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-yellow-400 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-yellow-700">
                    No activities found for this project. Please check if the
                    project has been set up with activities.
                  </span>
                </div>
              </div>
            </div>
          )}

        <SearchableSelect
          id="docReference"
          name="docReference"
          label="Doc Reference"
          value={formData.docReference || ""}
          onChange={handleChange}
          options={docReferenceOptions}
          required
          error={errors.docReference}
          disabled={isSubmitting}
          placeholder="Search and select document reference..."
          className="col-span-2 max-w-[400px]"
        />

        <div className="col-span-2">
          <label
            htmlFor="clarificationDescription"
            className="block text-sm font-medium text-gray-700"
          >
            Clarification Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="clarificationDescription"
            name="clarificationDescription"
            rows={4}
            value={formData.clarificationDescription}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 sm:text-sm ${
              errors.clarificationDescription
                ? "border-red-300 focus:border-red-500"
                : "border-gray-300 focus:border-indigo-500"
            } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
            placeholder="Provide a detailed description of the clarification needed..."
          />
          {errors.clarificationDescription && (
            <p className="mt-1 text-sm text-red-600">
              {errors.clarificationDescription}
            </p>
          )}
        </div>

        <SearchableSelect
          id="raisedById"
          name="raisedById"
          label="Raised By"
          value={formData.raisedById}
          onChange={handleChange}
          options={raisedByOptions}
          required
          error={errors.raisedById}
          disabled={isSubmitting || loadingUsers}
          placeholder="Search and select who raised this clarification..."
        />

        <SearchableSelect
          id="responsesFrom"
          name="responsesFrom"
          label="Response From"
          value={formData.responsesFromId}
          onChange={handleChange}
          options={responseFromOptions}
          required
          error={errors.responsesFrom}
          disabled={isSubmitting || loadingUsers}
          placeholder="Search and select who will provide the response..."
          
          
        />

        <Input
          id="dateRaised"
          name="dateRaised"
          type="date"
          label="Date Raised"
          value={formData.dateRaised}
          onChange={handleChange}
          required
          error={errors.dateRaised}
          disabled={isSubmitting}
        />

        <Select
          id="criticalityIndex"
          name="criticalityIndex"
          label="Criticality Index"
          value={formData.criticalityIndex}
          onChange={handleChange}
          options={[
            { value: "", label: "Select criticality" },
            ...criticalityOptions,
          ]}
          required
          error={errors.criticalityIndex}
          disabled={isSubmitting}
        />

        <Select
          id="status"
          name="status"
          label="Status"
          value={formData.status}
          onChange={handleChange}
          options={statusOptions}
          required
          disabled={isSubmitting}
        />

        <div className="col-span-2">
          <label
            htmlFor="response"
            className="block text-sm font-medium text-gray-700"
          >
            Response (Optional)
          </label>
          <textarea
            id="response"
            name="response"
            rows={3}
            value={formData.response}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
        </div>
      </div>

      {/* User Data Status */}
      {!loadingUsers && users.length === 0 && (
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
                No User Data Available
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  No API user data is available. "Raised By" dropdown will be
                  empty. "Response From" dropdown will show Powell team members
                  only.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </div>
          ) : (
            "Submit Clarification"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ClarificationForm;
