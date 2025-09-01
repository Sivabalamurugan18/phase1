import React from "react";
import { useState, useEffect } from "react";
import Card from "../../../../components/ui/Card";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import SearchableSelect from "../../../../components/ui/SearchableSelect";
import Badge from "../../../../components/ui/Badge";
import { Clarification } from "../../../../types/screen";
import { userService, projectService } from "../../../../services/apiService";
import { User } from "../../../../types/admin";
import {
  getStatusColorCode,
  getCriticalityColorCode,
} from "../../../../utils/dateUtils";

interface ClarificationDetailsTabProps {
  clarification: Clarification;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
}

interface ActivityOption {
  value: string;
  label: string;
}
const ClarificationDetailsTab: React.FC<ClarificationDetailsTabProps> = ({
  clarification,
  onChange,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [activities, setActivities] = useState<ActivityOption[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Mock Powell users with unique UUIDs (same as Add form)
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

  // Fetch users from API (same as Add form)
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
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch projects from API (same as Add form)
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
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchActivitiesByProject = async (planningId: number) => {
    if (!planningId) {
      setActivities([]);
      return;
    }

    try {
      setLoadingActivities(true);

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
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProjects();

    // Fetch activities for current project if available
    if (clarification.planningId) {
      fetchActivitiesByProject(clarification.planningId);
    }
  }, [clarification.planningId]);

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

  // Predefined options for Document References
  const docReferenceOptions = [
    { value: "", label: "Select Document Reference" },
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

  // Create project options from API data (same as Add form)
  const projectOptions = [
    { value: "", label: "Select Project" },
    ...projects.map((project) => ({
      value: project.planningId.toString(),
      label: `${project.projectNo} - ${project.projectName || "Project"}`,
    })),
  ];

  // Create user options from API data for "Raised By" dropdown (same as Add form)
  const raisedByOptions = [
    { value: "", label: "Select User" },
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

  // Create user options from API data for "Response From" dropdown (same as Add form)
  const responseFromOptions = [
    { value: "", label: "Select User" },
    ...mockPowellUsers.map((user) => {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      const displayName = fullName || user.userName;
      return {
        value: user.userId,
        label: `${displayName} (Powell Team)`,
      };
    }),
    ...(mockPowellUsers.length > 0 && users.length > 0
      ? [{ value: "separator", label: "── Changepond Team ──", disabled: true }]
      : []),
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

  // Create activity options for the select dropdown (same as Add form)
  const activitySelectOptions = [
    {
      value: "",
      label: loadingActivities
        ? "Loading activities..."
        : clarification.planningId
        ? "Select an activity"
        : "First select a project",
    },
    ...activities,
  ];

  return (
    <div className="space-y-8">
      {/* Loading Status */}
      {(loadingUsers || loadingProjects) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">Loading data...</span>
          </div>
        </div>
      )}

      <Card title="Project Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <SearchableSelect
            id="planningId"
            name="planningId"
            label="Project"
            value={clarification.planningId?.toString() || ""}
            onChange={onChange}
            options={projectOptions}
            disabled={loadingProjects}
            placeholder="Search and select a project..."
            className="max-w-[500px]"
          />

          <SearchableSelect
            id="projectActivityId"
            name="projectActivityId"
            label="Activities"
            value={clarification.projectActivityId?.toString() || ""}
            onChange={onChange}
            options={activitySelectOptions}
            disabled={!clarification.planningId || loadingActivities}
            placeholder="Search and select a Activity"
            className="max-w-[500px]"
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
        </div>
        <br />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <SearchableSelect
            id="raisedById"
            name="raisedById"
            label="Raised By"
            value={clarification.raisedById || ""}
            onChange={onChange}
            options={raisedByOptions}
            disabled={loadingUsers}
            placeholder="Search and select who raised this clarification..."
            className="max-w-[500px]"
          />

          <SearchableSelect
            id="responsesFromId"
            name="responsesFromId"
            label="Response From"
            value={clarification.responsesFromId || ""}
            onChange={onChange}
            options={responseFromOptions}
            disabled={loadingUsers}
            placeholder="Search and select who will provide the response..."
            className="max-w-[500px]"
          />
        </div>
        <br />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <SearchableSelect
            id="docReference"
            name="docReference"
            label="Doc Reference"
            value={clarification.docReference || ""}
            onChange={onChange}
            options={docReferenceOptions}
            placeholder="Search and select document reference..."
            className="max-w-[500px]"
          />
          <Select
            id="criticalityIndex"
            name="criticalityIndex"
            label="Criticality Index"
            value={clarification.criticalityIndex || ""}
            onChange={onChange}
            options={[
              { value: "", label: "Select criticality" },
              ...criticalityOptions,
            ]}
            className="max-w-[200px]"
            required
          />
        </div>
        <br />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
          <Select
            id="status"
            name="status"
            label="Status"
            value={clarification.status || ""}
            onChange={onChange}
            options={statusOptions}
            required
            className="max-w-[200px]"
          />
          <Input
            id="dateRaised"
            name="dateRaised"
            label="Date Raised"
            type="date"
            value={
              clarification.dateRaised
                ? clarification.dateRaised.split("T")[0]
                : ""
            }
            onChange={onChange}
            className="w-[200px]"
            required
          />

          <Input
            id="dateClosed"
            name="dateClosed"
            label="Date Closed"
            type="date"
            value={
              clarification.dateClosed
                ? clarification.dateClosed.split("T")[0]
                : ""
            }
            onChange={onChange}
            className="w-[200px]"
            disabled={clarification.status !== "Closed"}
          />
        </div>
        <br />

        <div className="grid grid-cols-1 md:grid-cols-1 gap-x-10 gap-y-6">
          <div>
            <label
              htmlFor="clarificationDescription"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Clarification Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="clarificationDescription"
              name="clarificationDescription"
              rows={3}
              value={clarification.clarificationDescription || ""}
              onChange={onChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Provide a detailed description of the clarification needed..."
            />
          </div>
          <div>
            <label
              htmlFor="response"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Response (Optional)
            </label>
            <textarea
              id="response"
              name="response"
              rows={3}
              value={clarification.response || ""}
              onChange={onChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Enter response details..."
            />
          </div>
        </div>
      </Card>

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
    </div>
  );
};

export default ClarificationDetailsTab;