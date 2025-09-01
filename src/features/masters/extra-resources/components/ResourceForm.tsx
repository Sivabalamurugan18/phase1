import React, { useState, useEffect } from "react";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import Button from "../../../../components/ui/Button";
import { Save, X } from "lucide-react";
import { Resource, ResourceRole } from "../../../../types/masters";

interface ExtraResourceFormProps {
  resource?: Resource | null;
  roles: ResourceRole[];
  onSubmit: (data: Omit<Resource, "extraResourceId" | "extraRole">) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ExtraResourceForm: React.FC<ExtraResourceFormProps> = ({
  resource,
  roles,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    resourceId: 0,
    resourceName: "",
    resourceRoleName: "",
    isLive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (resource) {
      setFormData({
        resourceId: resource.resourceId,
        resourceName: resource.resourceName,
        resourceRoleName: resource.resourceRoleName,
        isLive: resource.isLive,
      });
    } else {
      setFormData({
        resourceId: 0,
        resourceName: "",
        resourceRoleName: "",
        isLive: true,
      });
    }
  }, [resource]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "extraRoleId"
          ? Number(value)
          : value,
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

    if (!formData.resourceName.trim()) {
      newErrors.extraResourceName = "Resource name is required";
    } else if (formData.resourceName.length < 2) {
      newErrors.extraResourceName =
        "Resource name must be at least 2 characters";
    } else if (formData.resourceName.length > 100) {
      newErrors.extraResourceName =
        "Resource name must be less than 100 characters";
    }

    if (!formData.resourceRoleName || formData.resourceRoleName === "") {
      newErrors.extraRoleId = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clean the data before submitting
    const cleanedData = {
      resourceId: formData.resourceId,
      resourceName: formData.resourceName.trim(),
      resourceRoleName: formData.resourceRoleName,
      isLive: formData.isLive,
    };

    console.log("Submitting extra resource data:", cleanedData);
    onSubmit(cleanedData);
  };

  const activeRoles = roles.filter((r) => r.isLive);
  const roleOptions = [
    { value: "", label: "Select Role" },
    ...activeRoles.map((r) => ({
      value: r.resourceRoleName.toString(),
      label: r.resourceRoleName,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          id="resourceName"
          name="resourceName"
          label="Resource Name"
          value={formData.resourceName}
          onChange={handleChange}
          required
          error={errors.extraResourceName}
          placeholder="Enter resource name (e.g., John Doe)"
          disabled={isSubmitting}
          className="w-full"
        />

        <Select
          id="resourceRoleName"
          name="resourceRoleName"
          label="Role"
          value={formData.resourceRoleName.toString()}
          onChange={handleChange}
          options={roleOptions}
          required
          error={errors.extraRoleId}
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
            Active Resource
          </label>
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
              <span>{resource ? "Updating..." : "Creating..."}</span>
            </div>
          ) : (
            <span>{resource ? "Update Resource" : "Create Resource"}</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ExtraResourceForm;
