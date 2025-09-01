import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { Save, Trash2, Undo } from "lucide-react";
import { toast } from "react-hot-toast";
import ClarificationDetailTabs from "./ClarificationDetailTabs";
import DeleteClarificationModal from "./DeleteClarificationModal";
import { Clarification } from "../../../types/screen";
import { clarificationService } from "../../../services/apiService";
import { useAuthStore } from "../../../store/authStore";

interface ClarificationDetailModalProps {
  clarification: Clarification | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (clarification: Clarification) => void;
  onDelete?: (clarification: Clarification) => void;
}

const ClarificationDetailModal: React.FC<ClarificationDetailModalProps> = ({
  clarification,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Clarification | null>(null);
  const [originalData, setOriginalData] = useState<Clarification | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { hasSpecificPermission } = useAuthStore();

  useEffect(() => {
    if (clarification) {
      const enrichedClarification = {
        ...clarification,
        docReference: clarification.docReference || "",
        responsesFromId: clarification.responsesFromId || "",
        response: clarification.response || "",
        uploadFiles: clarification.uploadFiles || [],
      };
      setFormData(enrichedClarification);
      setOriginalData(enrichedClarification);
      setIsEditing(false);
    }
  }, [clarification]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => {
      if (!prev) return prev;

      if (type === "checkbox") {
        const checked = (e.target as HTMLInputElement).checked;
        return {
          ...prev,
          [name]: checked,
        };
      }

      // Update age when date fields change
      if (name === "dateRaised" || name === "dateClosed") {
        const dateRaised = name === "dateRaised" ? value : prev.dateRaised;
        const dateClosed = name === "dateClosed" ? value : prev.dateClosed;
        const age = calculateAge(dateRaised, dateClosed);
        return {
          ...prev,
          [name]: value,
          age,
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
    setIsEditing(true);
  };

  const calculateAge = (dateRaised: string, dateClosed?: string): number => {
    const raised = new Date(dateRaised);
    const closed = dateClosed ? new Date(dateClosed) : new Date();
    const diffTime = Math.abs(closed.getTime() - raised.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSave = async () => {
    if (!formData) return;

    if (!hasSpecificPermission("Clarifications", "canEdit")) {
      toast.error("You do not have permission to edit clarifications");
      return;
    }

    setIsSaving(true);
    try {
      // Prepare the payload for the API
      const payload = {
        clarificationId: formData.clarificationId,
        planningId: formData.planningId,
        projectActivityId: formData.projectActivityId ?? 0,
        docReference: formData.docReference || null,
        clarificationDescription: formData.clarificationDescription,
        raisedById: formData.raisedById || null,
        response: formData.response || null,
        responsesFromId: formData.responsesFromId || null,
        status: formData.status,
        criticalityIndex: formData.criticalityIndex,
        dateRaised: formData.dateRaised
          ? new Date(formData.dateRaised).toISOString()
          : new Date().toISOString(),
        dateClosed: formData.dateClosed
          ? new Date(formData.dateClosed).toISOString()
          : null,
        createdBy: formData.createdBy ?? localStorage.getItem("userId"),
        createdAt: formData.createdAt ?? new Date().toISOString(),
        modifiedBy: localStorage.getItem("userId"),
        modifiedAt: new Date().toISOString(),
      };

      // Remove null values to clean up the payload
      const cleanedPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== null)
      );

      console.log("Updating clarification with payload:", cleanedPayload);

      // Call the update API
      const response = await clarificationService.update(
        formData.clarificationId,
        cleanedPayload
      );

      if (!response.success) {
        const errorText = await response.message;
        throw new Error(
          `Failed to update clarification: ${response.error} - ${errorText}`
        );
      }

      const updatedClarification = {
        ...formData,
      };

      onSave(updatedClarification);
      setOriginalData(updatedClarification); // Update original data after successful save
      setIsEditing(false);
      toast.success("Clarification updated successfully");
    } catch (error) {
      console.error("Error updating clarification:", error);

      const updatedClarification = {
        ...formData,
      };

      onSave(updatedClarification);
      setOriginalData(updatedClarification);
      setIsEditing(false);

      toast.error(
        `API Error: ${
          error instanceof Error ? error.message : "Failed to save to server"
        }. Updated locally instead.`
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!formData || !onDelete) return;

    if (!hasSpecificPermission("Clarifications", "canDelete")) {
      toast.error("You do not have permission to delete clarifications");
      return;
    }

    setIsDeleting(true);
    try {
      // Call the delete API
      const response = await clarificationService.delete(
        formData.clarificationId
      );

      if (!response.success) {
        throw new Error("Failed to delete clarification from server");
      }

      // Call the parent's delete handler to update the UI
      onDelete(formData);
      setShowDeleteModal(false);
      onClose();
      toast.success("Clarification deleted successfully");
    } catch (error) {
      console.error("Error deleting clarification:", error);

      // If API fails, still allow local deletion for demo purposes
      if (onDelete) {
        onDelete(formData);
        setShowDeleteModal(false);
        onClose();
        toast.success(
          "Clarification deleted (API unavailable - removed locally)"
        );
      } else {
        toast.error("Failed to delete clarification");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUndo = () => {
    if (isEditing && originalData) {
      const confirmed = window.confirm(
        "Are you sure you want to discard your changes? All unsaved changes will be lost."
      );
      if (confirmed) {
        setFormData(originalData);
        setIsEditing(false);
        toast.info("Changes discarded");
      }
    } else {
      onClose();
    }
  };

  if (!formData) return null;

  // Check if user has view permission for clarifications
  if (!hasSpecificPermission("Clarifications", "canView")) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Access Denied" size="sm">
        <div className="text-center py-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-gray-500">
            You do not have permission to view clarification details.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleUndo}
        title={
          <div className="flex items-center justify-between w-full pr-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Clarification Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {formData.projectPlanning?.projectNo} -{" "}
                {formData.criticalityIndex} Priority
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Undo className="h-4 w-4" />}
                onClick={handleUndo}
                disabled={isSaving || isDeleting}
                title="Revert unsaved changes"
              >
                Undo
              </Button>
              {onDelete &&
                hasSpecificPermission("Clarifications", "canDelete") && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={handleDelete}
                    disabled={isSaving || isDeleting}
                    title="Delete clarification"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                )}
              {hasSpecificPermission("Clarifications", "canEdit") && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Save className="h-4 w-4" />}
                  onClick={handleSave}
                  disabled={
                    !isEditing ||
                    isSaving ||
                    isDeleting ||
                    !hasSpecificPermission("Clarifications", "canEdit")
                  }
                  title="Save changes"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
          </div>
        }
        size="xl"
      >
        <div className="h-[65vh] overflow-y-auto">
          <ClarificationDetailTabs
            clarification={formData}
            onChange={handleInputChange}
          />
        </div>
      </Modal>

      <DeleteClarificationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        clarificationId={formData.clarificationId}
        projectNo={formData.projectPlanning?.projectNo ?? ""}
        isDeleting={isDeleting}
      />
    </>
  );
};

export default ClarificationDetailModal;
