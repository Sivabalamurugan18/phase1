import React from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { AlertTriangle, Trash2 } from "lucide-react";
import { UserPermission, User } from "../../../types";

interface DeletePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  permission: UserPermission | null;
  user: User | null;
  isDeleting?: boolean;
}

const DeletePermissionModal: React.FC<DeletePermissionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  permission,
  user,
  isDeleting = false,
}) => {
  const getUserDisplayName = (user: User) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return fullName || user.userName;
  };

  if (!permission || !user) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={!isDeleting ? onClose : undefined}
      title="Delete Permission"
      size="sm"
    >
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Delete Permission
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete the{" "}
          <span className="font-medium text-gray-900">"{permission.pageName}"</span>{" "}
          permission for user{" "}
          <span className="font-medium text-gray-900">"{getUserDisplayName(user)}"</span>?
          This action cannot be undone and will immediately revoke access to this page.
        </p>

        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Permission Details
              </h3>
              <div className="mt-1 text-sm text-red-700">
                <p><strong>User:</strong> {getUserDisplayName(user)} ({user.email})</p>
                <p><strong>Page:</strong> {permission.pageName}</p>
                <p><strong>Current Access:</strong></p>
                <ul className="list-disc list-inside mt-1 ml-2">
                  {permission.canView && <li>View access</li>}
                  {permission.canAdd && <li>Create new items</li>}
                  {permission.canUpdate && <li>Edit existing items</li>}
                  {permission.canDelete && <li>Delete items</li>}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Impact Warning
              </h3>
              <div className="mt-1 text-sm text-yellow-700">
                <ul className="list-disc list-inside">
                  <li>User will immediately lose access to the {permission.pageName} page</li>
                  <li>Any ongoing work on this page should be completed first</li>
                  <li>This permission can be re-added later if needed</li>
                  <li>User will need to be notified of this change</li>
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
              <span>Deleting...</span>
            </div>
          ) : (
            "Delete Permission"
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default DeletePermissionModal;