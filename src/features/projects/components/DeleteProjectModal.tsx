// src/features/projects/components/DeleteProjectModal.tsx
import React from "react";
import Modal from "../../../components/ui/Modal";
import Button from "../../../components/ui/Button";
import { AlertTriangle } from "lucide-react";

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectNo: string;
}

const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectNo,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Project">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          Delete Project
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Are you sure you want to delete project <b>{projectNo}</b>? This
          action cannot be undone.
        </p>
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete Project
        </Button>
      </div>
    </Modal>
  );
};

export default DeleteProjectModal;
