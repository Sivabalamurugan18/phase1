import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import ProjectDetailTabs from "./ProjectDetailTabs";
import { ProjectPlanning, ProjectActivity } from "../../../types/screen";
import { toast } from "react-hot-toast";
import config from "../../../config";
import { useAuthStore } from "../../../store/authStore";

interface ProjectDetailModalProps {
  project: ProjectPlanning | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: ProjectPlanning) => void;
  onDelete?: (project: ProjectPlanning) => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const { hasSpecificPermission } = useAuthStore();
  const [projectActivities, setProjectActivities] = useState<ProjectActivity[]>(
    []
  );
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [projectQuickNotes, setProjectQuickNotes] = useState<any[]>([]);
  const [loadingQuickNotes, setLoadingQuickNotes] = useState(false);

  // Fetch activities when project changes or modal opens
  useEffect(() => {
    if (project && isOpen && project.planningId) {
      fetchProjectActivities(project.planningId);
      fetchProjectQuickNotes(project.planningId);
    }
  }, [project, isOpen]);

  const fetchProjectActivities = async (planningId: number) => {
    try {
      setLoadingActivities(true);

      const response = await fetch(
        `${config.API_BASE_URL}/api/Plannings/${planningId}/ProjectActivities`,
        {
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const activities = await response.json();
        setProjectActivities(activities || []);
        console.log("Activities loaded from API:", activities);
      } else {
        throw new Error("API not available");
      }
    } catch (error) {
      console.warn("Failed to fetch project activities from API:", error);
      setProjectActivities([]);
      toast.error("Failed to load activities");
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchProjectQuickNotes = async (planningId: number) => {
    try {
      setLoadingQuickNotes(true);

      const response = await fetch(
        `${config.API_BASE_URL}/api/ProjectQuickNotes/GetProjectQuickNotesWithPlanningId/${planningId}`,
        {
          signal: AbortSignal.timeout(5000),
        }
      );

      if (response.ok) {
        const quickNotes = await response.json();
        setProjectQuickNotes(quickNotes || []);
        console.log("Quick Notes loaded from API:", quickNotes);
      } else {
        throw new Error("API not available");
      }
    } catch (error) {
      console.warn("Failed to fetch project quick notes from API:", error);
      setProjectQuickNotes([]);
      toast.error("Failed to load quick notes");
    } finally {
      setLoadingQuickNotes(false);
    }
  };
  const handleSaveActivity = async (updatedActivity: ProjectActivity) => {
    updatedActivity;
  };

  const handleDeleteActivity = async (activityId: number) => {
    try {
      const response = await fetch(
        `${config.API_BASE_URL}/api/ProjectActivities/${activityId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setProjectActivities((prev) =>
          prev.filter((activity) => activity.activityId !== activityId)
        );
        toast.success("Activity deleted successfully");
      } else {
        throw new Error("Failed to delete activity");
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("Failed to delete activity");
    }
  };

  const handleDelete = (projectToDelete: ProjectPlanning) => {
    if (onDelete) {
      onDelete(projectToDelete);
      onClose();
    }
  };

  if (!project) return null;

  // Check if user has view permission for projects
  if (!hasSpecificPermission("Projects", "canView")) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Access Denied" size="sm">
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-gray-500">
            You do not have permission to view project details.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="h-[75vh] overflow-y-auto">
        <ProjectDetailTabs
          project={project}
          activities={projectActivities}
          quickNotes={projectQuickNotes}
          loadingQuickNotes={loadingQuickNotes}
          onRefreshQuickNotes={() => fetchProjectQuickNotes(project.planningId)}
          onSave={onSave}
          onSaveActivity={handleSaveActivity}
          onDeleteActivity={handleDeleteActivity}
          onDelete={handleDelete}
        />
      </div>
    </Modal>
  );
};

export default ProjectDetailModal;
