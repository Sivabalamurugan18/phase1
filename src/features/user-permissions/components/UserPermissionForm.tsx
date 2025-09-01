import React, { useState, useEffect } from "react";
import Modal from "../../../components/ui/Modal";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Button from "../../../components/ui/Button";
import { User, UserPermission, Page } from "../../../types";
import { Save, X, Shield } from "lucide-react";

interface UserPermissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<UserPermission, "permissionId">) => void;
  onCancel: () => void;
  user: User | null;
  permission?: UserPermission | null;
  pages: Page[];
  existingPermissions: UserPermission[];
  isSubmitting?: boolean;
}

const UserPermissionForm: React.FC<UserPermissionFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onCancel,
  user,
  permission,
  pages,
  existingPermissions,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    pageId: 0,
    pageName: "",
    canAdd: false,
    canUpdate: false,
    canView: true, // Default to true
    canDelete: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (permission) {
      setFormData({
        pageId: permission.pageId,
        pageName: permission.pageName,
        canAdd: permission.canAdd,
        canUpdate: permission.canUpdate,
        canView: permission.canView,
        canDelete: permission.canDelete,
      });
    } else {
      setFormData({
        pageId: 0,
        pageName: "",
        canAdd: false,
        canUpdate: false,
        canView: true,
        canDelete: false,
      });
    }
    setErrors({});
  }, [permission, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === "pageId") {
      const pageId = Number(value);
      const selectedPage = pages.find(p => p.pageId === pageId);
      setFormData(prev => ({
        ...prev,
        pageId,
        pageName: selectedPage?.pageName || "",
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.pageId || formData.pageId === 0) {
      newErrors.pageId = "Page is required";
    }

    // Check if permission already exists for this user and page (only for new permissions)
    if (!permission) {
      const existingPermission = existingPermissions.find(p => p.pageId === formData.pageId);
      if (existingPermission) {
        newErrors.pageId = "Permission for this page already exists";
      }
    }

    // At least one permission must be granted
    if (!formData.canAdd && !formData.canUpdate && !formData.canView && !formData.canDelete) {
      newErrors.permissions = "At least one permission must be granted";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit({
      userId: user!.userId,
      pageId: formData.pageId,
      pageName: formData.pageName,
      canAdd: formData.canAdd,
      canUpdate: formData.canUpdate,
      canView: formData.canView,
      canDelete: formData.canDelete,
    });
  };

  const getUserDisplayName = (user: User) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    return fullName || user.userName;
  };

  // Filter out pages that already have permissions (only for new permissions)
  const availablePages = permission 
    ? pages // For editing, show all pages
    : pages.filter(page => 
        !existingPermissions.some(perm => perm.pageId === page.pageId)
      );

  const pageOptions = [
    { value: "0", label: "Select a page" },
    ...availablePages.map(page => ({
      value: page.pageId.toString(),
      label: page.pageName
    }))
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title=""
      size="md"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {permission ? "Edit Permission" : "Add New Permission"}
            </h2>
            <p className="text-sm text-gray-500">
              {user ? `Managing permissions for ${getUserDisplayName(user)}` : "No user selected"}
            </p>
          </div>
        </div>

        {!user && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-700">
              No user selected. Please select a user from the users list first.
            </p>
          </div>
        )}

        {user && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getUserDisplayName(user).charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    User: {getUserDisplayName(user)}
                  </h3>
                  <p className="text-sm text-blue-700">
                    {user.email} • {user.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Page Selection */}
            <div>
              <Select
                id="pageId"
                name="pageId"
                label="Page"
                value={formData.pageId.toString()}
                onChange={handleChange}
                options={pageOptions}
                error={errors.pageId}
                required
                disabled={isSubmitting || !!permission} // Disable for editing
              />
              {permission && (
                <p className="mt-1 text-sm text-gray-500">
                  Page cannot be changed when editing an existing permission
                </p>
              )}
            </div>

            {/* Permissions */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="canView"
                      name="canView"
                      checked={formData.canView}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="canView" className="text-sm font-medium text-gray-700">
                      Can View
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="canAdd"
                      name="canAdd"
                      checked={formData.canAdd}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <label htmlFor="canAdd" className="text-sm font-medium text-gray-700">
                      Can Add
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="canUpdate"
                      name="canUpdate"
                      checked={formData.canUpdate}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <label htmlFor="canUpdate" className="text-sm font-medium text-gray-700">
                      Can Update
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="canDelete"
                      name="canDelete"
                      checked={formData.canDelete}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="canDelete" className="text-sm font-medium text-gray-700">
                      Can Delete
                    </label>
                  </div>
                </div>

                {errors.permissions && (
                  <p className="text-sm text-red-600">{errors.permissions}</p>
                )}
              </div>
            </div>

            {/* Permission Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Permission Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className={`flex items-center space-x-2 ${formData.canView ? 'text-green-700' : 'text-gray-500'}`}>
                  <span>{formData.canView ? '✓' : '✗'}</span>
                  <span>View access</span>
                </div>
                <div className={`flex items-center space-x-2 ${formData.canAdd ? 'text-green-700' : 'text-gray-500'}`}>
                  <span>{formData.canAdd ? '✓' : '✗'}</span>
                  <span>Create new items</span>
                </div>
                <div className={`flex items-center space-x-2 ${formData.canUpdate ? 'text-green-700' : 'text-gray-500'}`}>
                  <span>{formData.canUpdate ? '✓' : '✗'}</span>
                  <span>Edit existing items</span>
                </div>
                <div className={`flex items-center space-x-2 ${formData.canDelete ? 'text-green-700' : 'text-gray-500'}`}>
                  <span>{formData.canDelete ? '✓' : '✗'}</span>
                  <span>Delete items</span>
                </div>
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Permission Guidelines
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>At least one permission must be granted</li>
                      <li>View permission is typically required for other permissions to be meaningful</li>
                      <li>Delete permission should be granted carefully</li>
                      <li>Each user can have only one permission record per page</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                icon={<X className="h-4 w-4" />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                icon={<Save className="h-4 w-4" />}
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{permission ? "Updating..." : "Creating..."}</span>
                  </div>
                ) : (
                  <span>{permission ? "Update Permission" : "Create Permission"}</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default UserPermissionForm;