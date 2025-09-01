import React, { useState } from "react";
import { ProjectPlanning, ProjectActivity } from "../../../types/screen";
import {
  Info,
  Activity,
  Check,
  Undo,
  Trash2,
  MessageSquare,
} from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import ProjectDetailsTab from "./tabs/ProjectDetailsTab";
import ProjectActivitiesTab from "./tabs/ProjectActivitiesTab";
import QuickNotesTab from "./tabs/QuickNotesTab";
import DeleteProjectModal from "./DeleteProjectModal";
import { toast } from "react-hot-toast";
import { projectService } from "../../../services/apiService";
import { useAuthStore } from "../../../store/authStore";

interface ProjectDetailTabsProps {
  project: ProjectPlanning;
  activities: ProjectActivity[];
  quickNotes: any[];
  loadingQuickNotes: boolean;
  onRefreshQuickNotes: () => void;
  onSave: (updatedProject: ProjectPlanning) => void;
  onSaveActivity: (updatedActivity: ProjectActivity) => void;
  onDeleteActivity: (activityId: number) => void;
  onDelete?: (project: ProjectPlanning) => void;
}

const ProjectDetailTabs: React.FC<ProjectDetailTabsProps> = ({
  project,
  activities,
  quickNotes,
  loadingQuickNotes,
  onRefreshQuickNotes,
  onSave,
  onSaveActivity,
  onDeleteActivity,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState<ProjectPlanning>(project);
  const { permissions, hasSpecificPermission } = useAuthStore();

  // Calculate project status based on activities
  const getProjectStatus = () => {
    if (!activities || activities.length === 0) {
      return { status: "Not Started", className: "bg-gray-100 text-gray-800" };
    }

    // Check if all activities have cpActualFinishedDate (all completed)
    const allCompleted = activities.every(
      (activity) =>
        activity.cpActualFinishedDate &&
        activity.cpActualFinishedDate.trim() !== ""
    );

    if (allCompleted) {
      return { status: "Completed", className: "bg-green-100 text-green-800" };
    }

    // Check if any activity has cpActualStartDate (at least one started)
    const anyStarted = activities.some(
      (activity) =>
        activity.cpActualStartDate && activity.cpActualStartDate.trim() !== ""
    );

    if (anyStarted) {
      return { status: "In Progress", className: "bg-blue-100 text-blue-800" };
    }

    // No activities started
    return { status: "Not Started", className: "bg-gray-100 text-gray-800" };
  };

  const projectStatus = getProjectStatus();

  const tabs = [
    { id: "details", label: "Project Details", icon: Info },
    { id: "activities", label: "Activities", icon: Activity },
    { id: "notes", label: "Quick Notes", icon: MessageSquare },
  ];

  const toUTC = (date: any): string | null => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value,
    }));
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!hasSpecificPermission("Projects", "canEdit")) {
      toast.error("You do not have permission to edit projects");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        planningId: formData.planningId,
        divisionId: formData.divisionId,
        projectNo: formData.projectNo,
        projectName: formData.projectName,
        productCode: formData.productCode,
        productId: formData.productId,
        customerName: formData.customerName,
        projectReceivedDate: toUTC(formData.projectReceivedDate),
        units: formData.units,
        systemVoltageInKV: formData.systemVoltageInKV,
        isCompleted: formData.isCompleted || formData.completed === true,
        createdBy: project.createdBy,
        createdAt: project.createdAt,
        // Set modified fields
        modifiedBy: localStorage.getItem("userId"),
        modifiedAt: new Date().toISOString(),
      };

      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== null)
      );

      const response = await projectService.update(
        formData.planningId,
        cleanedPayload
      );

      if (response.success) {
        toast.success("Project updated successfully");
        setIsEditing(false);
        onSave({
          ...formData,
          isCompleted: payload.isCompleted,
          completed: payload.isCompleted,
          projectStatus: payload.isCompleted ? "Completed" : "In Progress",
        });
      } else {
        throw new Error(response.error || "Failed to update project");
      }
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!hasSpecificPermission("Projects", "canDelete")) {
      toast.error("You do not have permission to delete projects");
      return;
    }
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) {
      toast.error("Delete functionality not available");
      return;
    }

    try {
      onDelete(formData);
      setShowDeleteModal(false);
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      const confirmed = window.confirm(
        "Are you sure you want to discard your changes?"
      );
      if (confirmed) {
        setFormData(project);
        setIsEditing(false);
        toast.info("Changes discarded");
      }
    } else {
      setFormData(project);
      setIsEditing(false);
    }
  };

  const canEdit = (field: string): boolean => {
    if (!hasSpecificPermission("Projects", "canEdit")) return false;
    if (permissions.canManageUsers) return true;
    const restrictedFields = ["projectStatus"];
    return !restrictedFields.includes(field);
  };

  const canDelete = (): boolean => {
    return (
      hasSpecificPermission("Projects", "canDelete") ||
      permissions.canManageUsers
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {project.projectName || project.projectNo}
            </h2>
            <div className="mt-1 flex items-center space-x-4">
              <span className="text-sm text-gray-500">{project.projectNo}</span>
              <Badge
                text={projectStatus.status}
                className={projectStatus.className}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Undo className="h-4 w-4" />}
              onClick={handleCancel}
              disabled={isSaving}
              title="Discard changes"
            >
              Undo
            </Button>
            {/* ✅ FIXED: Delete button now visible and functional */}
            {canDelete() && onDelete && (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
                disabled={isSaving}
                title="Delete this project"
              >
                Delete
              </Button>
            )}
            {hasSpecificPermission("Projects", "canEdit") && (
              <Button
                variant="primary"
                size="sm"
                icon={<Check className="h-4 w-4" />}
                onClick={handleSave}
                disabled={!isEditing || isSaving}
                title="Save all changes"
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
              // ✅ FIXED: Tabs are no longer disabled
              disabled={false}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "details" && (
          <ProjectDetailsTab
            project={formData}
            onChange={handleInputChange}
            canEdit={canEdit}
          />
        )}
        {activeTab === "activities" && (
          <ProjectActivitiesTab
            projectNo={formData.projectNo}
            projectName={formData.projectName}
            planningId={formData.planningId}
            activities={activities}
            onSaveActivity={onSaveActivity}
            onDeleteActivity={onDeleteActivity}
          />
        )}
        {activeTab === "notes" && (
          <QuickNotesTab
            projectNo={formData.projectNo}
            projectName={formData.projectName || ""}
            planningId={formData.planningId}
            quickNotes={quickNotes}
            loadingQuickNotes={loadingQuickNotes}
            onRefreshQuickNotes={onRefreshQuickNotes}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteProjectModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        projectNo={project.projectNo}
      />
    </div>
  );
};

export default ProjectDetailTabs;
