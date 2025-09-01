import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { Discrepancy } from "../../../types/screen";
import { Save, Trash2, Undo } from "lucide-react";
import { toast } from "react-hot-toast";
import DiscrepancyDetailTabs from "./DiscrepancyDetailTabs";
import DeleteDiscrepancyModal from "./DeleteDiscrepancyModal";
import { useAuthStore } from "../../../store/authStore";

interface DiscrepancyDetailModalProps {
  discrepancy: Discrepancy | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (discrepancy: Discrepancy) => void;
  onDelete: (discrepancy: Discrepancy) => void;
}

const DiscrepancyDetailModal: React.FC<DiscrepancyDetailModalProps> = ({
  discrepancy,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Discrepancy | null>(null);
  const [originalData, setOriginalData] = useState<Discrepancy | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { hasSpecificPermission } = useAuthStore();

  useEffect(() => {
    if (discrepancy) {
      setFormData(discrepancy);
      setOriginalData({ ...discrepancy });
      setIsEditing(false);
    }
  }, [discrepancy]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    console.log("DiscrepancyDetailModal - Field changed:", {
      name,
      value,
      type,
    });

    setFormData((prev) => {
      if (!prev) return prev;

      const updatedData = {
        ...prev,
        [name]:
          type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
      };

      console.log("DiscrepancyDetailModal - Updated form data:", updatedData);
      return updatedData;
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData) return;

    if (!hasSpecificPermission("Discrepancies", "canEdit")) {
      toast.error("You do not have permission to edit discrepancies");
      return;
    }

    console.log("DiscrepancyDetailModal - Saving form data:", formData);

    setIsSaving(true);
    try {
      // Prepare the payload for the API
      const payload = {
        discrepancyId: formData.discrepancyId,
        planningId: formData.planningId,
        projectActivityId: formData.projectActivityId,
        qcLevelId: formData.qcLevelId,
        qcCycle: formData.qcCycle,
        drawingNumber: formData.drawingNumber,
        drawingDescriptionId: formData.drawingDescriptionId,
        reflectionDocumentId: formData.reflectionDocumentId,
        errorCategoryId: formData.errorCategoryId,
        errorSubCategoryId: formData.errorSubCategoryId,
        errorDescription: formData.errorDescription,
        criticalityIndex: formData.criticalityIndex,
        statusOfError: formData.statusOfError,
        remarks: formData.remarks,
        recurringIssue: formData.recurringIssue,
        createdBy: formData.createdBy,

        createdAt: formData.createdAt,

        // Set modified fields

        modifiedBy:localStorage.getItem("userId"),

        modifiedAt:new Date().toISOString(),
      };

      console.log("DiscrepancyDetailModal - API payload:", payload);

      onSave(formData);
      setOriginalData(formData); // Update original data after successful save
      setIsEditing(false);
      toast.success("Discrepancy updated successfully");
    } catch (error) {
      console.error("DiscrepancyDetailModal - Save error:", error);
      toast.error("Failed to update discrepancy");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!formData) return;

    if (!hasSpecificPermission("Discrepancies", "canDelete")) {
      toast.error("You do not have permission to delete discrepancies");
      return;
    }

    try {
      onDelete(formData);
      setShowDeleteModal(false);
      onClose();
      toast.success("Discrepancy deleted successfully");
    } catch (error) {
      toast.error("Failed to delete discrepancy");
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

  // Check if user has view permission for discrepancies
  if (!hasSpecificPermission("Discrepancies", "canView")) {
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
            You do not have permission to view discrepancy details.
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
                Discrepancy Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {formData.drawingNumber} -{" "}
                {formData.errorCategory?.errorCategoryName}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                icon={<Undo className="h-4 w-4" />}
                onClick={handleUndo}
                disabled={isSaving}
                title="Revert unsaved changes"
              >
                Undo
              </Button>
              {hasSpecificPermission("Discrepancies", "canDelete") && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={handleDelete}
                  disabled={isSaving}
                  title="Delete discrepancy"
                >
                  Delete
                </Button>
              )}
              {hasSpecificPermission("Discrepancies", "canEdit") && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Save className="h-4 w-4" />}
                  onClick={handleSave}
                  disabled={
                    !isEditing ||
                    isSaving ||
                    !hasSpecificPermission("Discrepancies", "canEdit")
                  }
                  title="Save changes"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              )}
            </div>
          </div>
        }
        size="lg"
      >
        <div className="h-[65vh] overflow-y-auto">
          <DiscrepancyDetailTabs
            discrepancy={formData}
            onChange={handleInputChange}
          />
        </div>
      </Modal>

      <DeleteDiscrepancyModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        drawingNumber={formData.drawingNumber || ""}
      />
    </>
  );
};

export default DiscrepancyDetailModal;
