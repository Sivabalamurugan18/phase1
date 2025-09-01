import React, { useState, useCallback, useRef } from "react";
import AppLayout from "../../components/layouts/AppLayout";
import SearchBar from "../../components/ui/SearchBar";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Modal from "../../components/ui/Modal";
import ProjectForm from "../../components/forms/ProjectForm";
import ProjectDetailModal from "./components/ProjectDetailModal";
import DeleteProjectModal from "./components/DeleteProjectModal";
import { Plus, FileDown, RefreshCw, Wifi, WifiOff } from "lucide-react";
import ProjectTable from "./components/ProjectTable";
import { toast } from "react-hot-toast";
import { exportToExcel } from "../../utils/export";
import { useProjectStore } from "../../store/projectStore";
import { projectService, apiService } from "../../services/apiService";
import { ProjectPlanning } from "../../types/screen";

import { useAuthStore } from "../../store/authStore";

const ProjectsPage: React.FC = () => {
  const { hasSpecificPermission } = useAuthStore();
  const [selectedProject, setSelectedProject] =
    useState<ProjectPlanning | null>(null);
  const [projectToDelete, setProjectToDelete] =
    useState<ProjectPlanning | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectPlanning[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const gridApi = useRef<any>(null);

  // Check if user has page permission - if not, show access denied
  if (
    !hasSpecificPermission("Projects", "pagePermission") ||
    !hasSpecificPermission("Project", "pagePermission")
  ) {
    return (
      <AppLayout title="Project Management">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              You are in Project Area
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              You don't have rights or permission to see this content. Please
              navigate to another page where you have access.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 max-w-md mx-auto">
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
                    Navigation Suggestion
                  </h3>
                  <div className="mt-1 text-sm text-yellow-700">
                    <p>
                      Please use the navigation menu to access pages where you
                      have permissions, or contact your administrator to request
                      access to the Projects area.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Filter projects based on search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.projectNo.toLowerCase().includes(query) ||
      (project.projectName &&
        project.projectName.toLowerCase().includes(query)) ||
      (project.customerName &&
        project.customerName.toLowerCase().includes(query))
    );
  });

  const projectStore = useProjectStore();

  const fetchProjects = async () => {
    setLoading(true);

    const transformApiData = (
      apiData: ProjectPlanning[]
    ): ProjectPlanning[] => {
      return apiData.map((project: ProjectPlanning) => ({
        ...project,
        // Ensure all required fields are present
        planningId: project.planningId,
        divisionId: project.divisionId,
        projectNo: project.projectNo,
        projectName: project.projectName || "",
        productCode: project.productCode || "",
        productId: project.productId,
        customerName: project.customerName || "",
        // Keep the original ISO date format for the detail modal
        projectReceivedDate: project.projectReceivedDate,
        units: project.units || 1,
        systemVoltageInKV: project.systemVoltageInKV || 0,
        isCompleted: project.isCompleted || false,

        // Computed properties for backward compatibility
        completed: project.isCompleted,
        projectStatus: project.isCompleted ? "Completed" : "In Progress",
      }));
    };

    try {
      const response = await apiService.get("/api/Plannings/GetAll");

      if (response.success) {
        const transformedData = transformApiData(response.data || []);
        setProjects(transformedData);
        projectStore.setProjects(transformedData);
        setIsOnline(true);
        toast.success("Projects loaded from server");
      } else {
        throw new Error("Failed to fetch projects");
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjects([]);
      projectStore.setProjects([]);
      setIsOnline(false);
      toast.error("Failed to load projects from server");
    } finally {
      setLoading(false);
    }
  };

  const onGridReady = (params: any) => {
    gridApi.current = params.api;
    params.api.sizeColumnsToFit();
    fetchProjects();
  };

  const handleRowClick = useCallback((project: ProjectPlanning) => {
    setSelectedProject(project);
    setShowDetailModal(true);
  }, []);

  const handleProjectSubmit = async (data: any) => {
    if (!hasSpecificPermission("Projects", "canCreate")) {
      toast.error("You do not have permission to create projects");
      return;
    }

    // Prepare data for API
    const apiData = {
      divisionId: Number(data.divisionId),
      projectNo: data.projectNo,
      projectName: data.projectName,
      productCode: data.productCode || "",
      productId: Number(data.productId),
      customerName: data.customerName,
      projectReceivedDate: data.projectReceivedDate,
      units: Number(data.units),
      systemVoltageInKV: Number(data.systemVoltageInKV),
      isCompleted: false,
      activitiesList: data.activitiesList,
      createdBy: localStorage.getItem("userId"),
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await projectService.create(apiData);

      if (response.success) {
        projectStore.addProject(response.data);
        setShowAddForm(false);
        fetchProjects();
        toast.success("Project created successfully");
      } else {
        throw new Error(response.error || "Failed to create project");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(
        `Failed to create project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteClick = (project: ProjectPlanning) => {
    if (!hasSpecificPermission("Projects", "canDelete")) {
      toast.error("You do not have permission to delete projects");
      return;
    }
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleProjectDelete = async (project: ProjectPlanning) => {
    if (!hasSpecificPermission("Projects", "canDelete")) {
      toast.error("You do not have permission to delete projects");
      return;
    }

    try {
      const response = await projectService.delete(project.planningId);

      if (response.success) {
        setProjects(
          projects.filter((p) => p.planningId !== project.planningId)
        );
        projectStore.removeProject(project.planningId);
        fetchProjects();
        toast.success("Project deleted successfully");
      } else {
        throw new Error(response.error || "Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(
        `Failed to delete project: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    if (gridApi.current) {
      gridApi.current.setQuickFilter(value);
    }
  }, []);

  const handleExport = () => {
    if (!hasSpecificPermission("Projects", "canView")) {
      toast.error("You do not have permission to export data");
      return;
    }

    if (!projects.length) {
      toast.error("No data to export");
      return;
    }

    try {
      const displayedRows = gridApi.current
        ? gridApi.current.getModel().rowsToDisplay.map((row: any) => row.data)
        : projects;

      const exportData = displayedRows.map((project: ProjectPlanning) => ({
        "Planning ID": project.planningId,
        "Division ID": project.divisionId,
        "Project No": project.projectNo,
        "Project Name": project.projectName || "",
        "Product Code": project.productCode || "",
        "Product ID": project.productId,
        "Customer Name": project.customerName || "",
        "Project Received Date": project.projectReceivedDate
          ? new Date(project.projectReceivedDate).toLocaleDateString()
          : "",
        Units: project.units,
        "System Voltage (KV)": project.systemVoltageInKV,
        "Is Completed": project.isCompleted ? "Yes" : "No",
        "Project Status": project.projectStatus || "In Progress",
        "Created At": project.createdAt || "",
        "Modified At": project.modifiedAt || "",
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

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;

    await handleProjectDelete(projectToDelete);
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const handleRefresh = () => {
    fetchProjects();
  };

  const handleProjectSave = (updatedProject: ProjectPlanning) => {
    projectStore.updateProject(updatedProject);
    setShowDetailModal(false);
    setSelectedProject(null);
    fetchProjects();
  };

  return (
    <AppLayout title="Project Management">
      <div className="space-y-6">
        {/* Status Banner */}
        {!isOnline && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <WifiOff className="h-5 w-5 text-red-400 mr-2" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  API Connection Failed
                </h3>
                <p className="text-sm text-red-700">
                  Unable to connect to the server. Please check your connection
                  and try again.
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
              onChange={handleSearch}
              placeholder="Search projects..."
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-blue-100">
                Total Projects
              </p>
              <p className="mt-2 text-3xl font-semibold">{projects.length}</p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-green-100">Completed</p>
              <p className="mt-2 text-3xl font-semibold">
                {projects.filter((p) => p.isCompleted).length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-yellow-100">In Progress</p>
              <p className="mt-2 text-3xl font-semibold">
                {projects.filter((p) => !p.isCompleted).length}
              </p>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="text-center">
              <p className="text-sm font-medium text-purple-100">Total Units</p>
              <p className="mt-2 text-3xl font-semibold">
                {projects.reduce((sum, p) => sum + (p.units || 0), 0)}
              </p>
            </div>
          </Card>
        </div>

        {/* Project Table */}
        <Card
          title={`Projects (${projects.length})`}
          headerRight={
            hasSpecificPermission("Projects", "canCreate") && (
              <Button
                variant="success"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowAddForm(true)}
              >
                Add Project
              </Button>
            )
          }
        >
          <ProjectTable
            projects={filteredProjects}
            onRowClick={handleRowClick}
            onGridReady={onGridReady}
            onDeleteClick={
              hasSpecificPermission("Projects", "canDelete")
                ? handleDeleteClick
                : undefined
            }
            loading={loading}
          />
        </Card>

        {/* Modals */}
        {hasSpecificPermission("Projects", "canCreate") && (
          <Modal
            isOpen={showAddForm}
            onClose={() => setShowAddForm(false)}
            title="Add New Project"
            size="md"
          >
            <ProjectForm
              onSubmit={handleProjectSubmit}
              onCancel={() => setShowAddForm(false)}
            />
          </Modal>
        )}

        <ProjectDetailModal
          project={selectedProject}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProject(null);
          }}
          onSave={handleProjectSave}
          onDelete={
            hasSpecificPermission("Projects", "canDelete")
              ? handleProjectDelete
              : undefined
          }
        />

        <DeleteProjectModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setProjectToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          projectNo={projectToDelete?.projectNo || ""}
        />
      </div>
    </AppLayout>
  );
};

export default ProjectsPage;
