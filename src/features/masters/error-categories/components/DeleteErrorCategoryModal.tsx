import React from "react";
import Modal from "../../../../components/ui/Modal";
import Button from "../../../../components/ui/Button";
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteErrorCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
  isDeleting?: boolean;
}

const DeleteErrorCategoryModal: React.FC<DeleteErrorCategoryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  isDeleting = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={!isDeleting ? onClose : undefined}
      title="Deactivate Error Category"
      size="sm"
    >
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Deactivate Error Category
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to deactivate the category{" "}
          <span className="font-medium text-gray-900">"{categoryName}"</span>?
          This will set the category status to inactive and hide it from error reporting.
        </p>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Important Notice
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <ul className="list-disc list-inside">
                  <li>Existing error records using this category will not be affected</li>
                  <li>The category will be hidden from new error reporting</li>
                  <li>You can reactivate the category later if needed</li>
                  <li>This action does not permanently delete the category</li>
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
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={isDeleting}
          icon={<Trash2 className="h-4 w-4" />}
        >
          {isDeleting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Deactivating...</span>
            </div>
          ) : (
            "Deactivate Category"
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteErrorCategoryModal;