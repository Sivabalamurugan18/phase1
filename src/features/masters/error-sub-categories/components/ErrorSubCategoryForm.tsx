import React, { useState, useEffect } from "react";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import Button from "../../../../components/ui/Button";
import { Save, X } from "lucide-react";
import { ErrorSubCategory, ErrorCategory } from "../../../../types/masters";

interface ErrorSubCategoryFormProps {
  subCategory?: ErrorSubCategory | null;
  categories: ErrorCategory[];
  onSubmit: (data: Omit<ErrorSubCategory, "errorSubCategoryId">) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ErrorSubCategoryForm: React.FC<ErrorSubCategoryFormProps> = ({
  subCategory,
  categories,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    errorSubCategoryName: "",
    errorCategoryId: 0,
    isLive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (subCategory) {
      setFormData({
        errorSubCategoryName: subCategory.errorSubCategoryName,
        errorCategoryId: subCategory.errorCategoryId,
        isLive: subCategory.isLive,
      });
    } else {
      setFormData({
        errorSubCategoryName: "",
        errorCategoryId: 0,
        isLive: true,
      });
    }
  }, [subCategory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" 
        ? (e.target as HTMLInputElement).checked 
        : name === "errorCategoryId" 
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

    if (!formData.errorSubCategoryName.trim()) {
      newErrors.errorSubCategoryName = "Sub category name is required";
    } else if (formData.errorSubCategoryName.length < 2) {
      newErrors.errorSubCategoryName = "Sub category name must be at least 2 characters";
    } else if (formData.errorSubCategoryName.length > 100) {
      newErrors.errorSubCategoryName = "Sub category name must be less than 100 characters";
    }

    if (!formData.errorCategoryId || formData.errorCategoryId === 0) {
      newErrors.errorCategoryId = "Parent category is required";
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

  const activeCategories = categories.filter(c => c.isLive);
  const categoryOptions = [
    { value: "0", label: "Select Parent Category" },
    ...activeCategories.map(c => ({
      value: c.errorCategoryId.toString(),
      label: c.errorCategoryName
    }))
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          id="errorSubCategoryName"
          name="errorSubCategoryName"
          label="Sub Category Name"
          value={formData.errorSubCategoryName}
          onChange={handleChange}
          required
          error={errors.errorSubCategoryName}
          placeholder="Enter error sub category name (e.g., Tolerance, Measurement)"
          disabled={isSubmitting}
          className="w-full"
        />

        <Select
          id="errorCategoryId"
          name="errorCategoryId"
          label="Parent Category"
          value={formData.errorCategoryId.toString()}
          onChange={handleChange}
          options={categoryOptions}
          required
          error={errors.errorCategoryId}
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
            Active Sub Category
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
              Sub Category Guidelines
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use specific, descriptive names for sub categories</li>
                <li>Sub categories provide detailed classification under parent categories</li>
                <li>Inactive sub categories will be hidden from error reporting</li>
                <li>Consider the impact on existing error records before deactivating</li>
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
              <span>{subCategory ? "Updating..." : "Creating..."}</span>
            </div>
          ) : (
            <span>{subCategory ? "Update Sub Category" : "Create Sub Category"}</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ErrorSubCategoryForm;