import React from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isDeleting?: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isDeleting = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={!isDeleting ? onClose : undefined}
      title="Delete User Account"
      size="sm"
    >
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Delete User Account
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete the user account for{' '}
          <span className="font-medium text-gray-900">"{userName}"</span>?
          This action cannot be undone and will permanently remove all user data and access permissions.
        </p>
        
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Warning
              </h3>
              <div className="mt-1 text-sm text-red-700">
                <ul className="list-disc list-inside">
                  <li>All user data will be permanently deleted</li>
                  <li>User will lose access to all systems immediately</li>
                  <li>Any ongoing work assignments will need to be reassigned</li>
                  <li>This action cannot be reversed</li>
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
            'Delete User'
          )}
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteConfirmationModal;