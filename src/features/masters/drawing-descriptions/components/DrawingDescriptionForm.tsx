import React, { useState, useEffect } from "react";
import Input from "../../../../components/ui/Input";
import Button from "../../../../components/ui/Button";
import { Save, X } from "lucide-react";
import { DrawingDescription } from "../../../../types/masters";

interface DrawingDescriptionFormProps {
  description?: DrawingDescription | null;
  onSubmit: (data: Omit<DrawingDescription, "drawingDescId">) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const DrawingDescriptionForm: React.FC<DrawingDescriptionFormProps> = ({
  description,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    description: "",
    isLive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (description) {
      setFormData({
        description: description.description,
        isLive: description.isLive,
      });
    } else {
      setFormData({
        description: "",
        isLive: true,
      });
    }
  }, [description]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length < 3) {
      newErrors.description = "Description must be at least 3 characters";
    } else if (formData.description.length > 200) {
      newErrors.description = "Description must be less than 200 characters";
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
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 sm:text-sm ${
              errors.description
                ? "border-red-300 focus:border-red-500"
                : "border-gray-300 focus:border-blue-500"
            } ${isSubmitting ? "bg-gray-100 cursor-not-allowed" : ""}`}
            placeholder="Enter drawing description (e.g., Specification Sheet, Front Elevation, SLD)"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.description.length}/200 characters
          </p>
        </div>

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
            Active Description
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
              Description Guidelines
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use clear, standardized descriptions for drawing types</li>
                <li>Common examples: Specification Sheet, Front Elevation, SLD, TLD, Control Schematic</li>
                <li>Inactive descriptions will be hidden from drawing classification</li>
                <li>Consider the impact on existing drawings before deactivating</li>
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
              <span>{description ? "Updating..." : "Creating..."}</span>
            </div>
          ) : (
            <span>{description ? "Update Description" : "Create Description"}</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default DrawingDescriptionForm;