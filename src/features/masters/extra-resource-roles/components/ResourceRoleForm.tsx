import React, { useState, useEffect } from "react";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";
import { Save, X } from "lucide-react";
import { ResourceRole } from "../../../../types/masters";

interface ResourceRoleFormProps {
  role?: ResourceRole | null;
  onSubmit: (data: Omit<ResourceRole, "resourceRoleId">) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ResourceRoleForm: React.FC<ResourceRoleFormProps> = ({
  role,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    resourceRoleName: "",
    isLive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (role) {
      setFormData({
        resourceRoleName: role.resourceRoleName,
        isLive: role.isLive,
      });
    } else {
      setFormData({
        resourceRoleName: "",
        isLive: true,
      });
    }
  }, [role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.resourceRoleName.trim()) {
      newErrors.resourceRoleName = "Role name is required";
    } else if (formData.resourceRoleName.length < 2) {
      newErrors.resourceRoleName = "Role name must be at least 2 characters";
    } else if (formData.resourceRoleName.length > 100) {
      newErrors.resourceRoleName = "Role name must be less than 100 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          id="resourceRoleName"
          name="resourceRoleName"
          label="Role Name"
          value={formData.resourceRoleName}
          onChange={handleChange}
          required
          error={errors.resourceRoleName}
          placeholder="Enter role name (e.g., Manager, Supervisor)"
          disabled={isSubmitting}
          className="w-full"
        />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isLive"
            name="isLive"
            checked={formData.isLive}
            onChange={handleChange}
            disabled={isSubmitting}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isLive" className="text-sm font-medium text-gray-700">
            Active Role
          </label>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Role Guidelines
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use clear, descriptive names for roles</li>
                <li>Roles define the function of resources</li>
                <li>Inactive roles will be hidden from resource assignment</li>
                <li>Consider the impact on existing resources before deactivating</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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
              <span>{role ? "Updating..." : "Creating..."}</span>
            </div>
          ) : (
            <span>{role ? "Update Role" : "Create Role"}</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ResourceRoleForm;