import React from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { AlertTriangle } from "lucide-react";

interface DeleteClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clarificationId: number;
  projectNo: string;
  isDeleting?: boolean;
}

const DeleteClarificationModal: React.FC<DeleteClarificationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  clarificationId,
  projectNo,
  isDeleting = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={!isDeleting ? onClose : undefined}
      title="Delete Clarification"
      size="sm"
    >
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Delete Clarification
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete clarification{" "}
          <span className="font-medium text-gray-900">{clarificationId}</span>{" "}
          for project{" "}
          <span className="font-medium text-gray-900">{projectNo}</span>? This
          action cannot be undone and will permanently remove all associated
          data including responses and attachments.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Warning</h3>
              <div className="mt-1 text-sm text-red-700">
                This will permanently delete:
                <ul className="list-disc list-inside mt-1">
                  <li>All clarification details and descriptions</li>
                  <li>Response history and comments</li>
                  <li>Uploaded files and attachments</li>
                  <li>Timeline and status tracking information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button variant="outline" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Deleting...</span>
            </div>
          ) : (
            "Delete Clarification"
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteClarificationModal;