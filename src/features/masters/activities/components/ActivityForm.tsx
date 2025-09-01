import React, { useState, useEffect } from "react";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import Button from "../../../../components/ui/Button";
import { Save, X } from "lucide-react";

interface Activity {
  activityId: number;
  activityName: string;
  order: number;
  divisionId: number;
  isLive: boolean;
}

interface Division {
  divisionId: number;
  divisionName: string;
  description: string;
  isLive: boolean;
}

interface ActivityFormProps {
  activity?: Activity | null;
  divisions: Division[];
  onSubmit: (data: Omit<Activity, "activityId">) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const ActivityForm: React.FC<ActivityFormProps> = ({
  activity,
  divisions,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    activityName: "",
    order: 1,
    divisionId: 0,
    isLive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activity) {
      setFormData({
        activityName: activity.activityName,
        order: activity.order,
        divisionId: activity.divisionId,
        isLive: activity.isLive,
      });
    } else {
      setFormData({
        activityName: "",
        order: 1,
        divisionId: 0,
        isLive: true,
      });
    }
  }, [activity]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.activityName.trim()) {
      newErrors.activityName = "Activity name is required";
    } else if (formData.activityName.length < 2) {
      newErrors.activityName = "Activity name must be at least 2 characters";
    } else if (formData.activityName.length > 100) {
      newErrors.activityName = "Activity name must be less than 100 characters";
    }

    if (!formData.divisionId || formData.divisionId === 0) {
      newErrors.divisionId = "Division is required";
    }

    if (formData.order < 1) {
      newErrors.order = "Order must be at least 1";
    } else if (formData.order > 999) {
      newErrors.order = "Order must be less than 1000";
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

  const activeDivisions = divisions.filter((d) => d.isLive===true);
  const divisionOptions = [
    { value: 0, label: "Select Division" },
    ...activeDivisions.map((d) => ({
      value: d.divisionId.toString(),
      label: d.divisionName,
    })),
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          id="activityName"
          name="activityName"
          label="Activity Name"
          value={formData.activityName}
          onChange={handleChange}
          required
          error={errors.activityName}
          placeholder="Enter activity name (e.g., Initial Design Review)"
          disabled={isSubmitting}
          className="w-full"
        />

        <Select
          id="divisionId"
          name="divisionId"
          label="Division"
          value={formData.divisionId.toString()}
          onChange={handleChange}
          options={divisionOptions}
          required
          error={errors.divisionId}
          disabled={isSubmitting}
          className="w-full"
        />

        <Input
          id="order"
          name="order"
          label="Order"
          type="number"
          value={formData.order}
          onChange={handleChange}
          required
          error={errors.order}
          placeholder="Enter order sequence (1, 2, 3...)"
          disabled={isSubmitting}
          min={1}
          max={999}
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
            Active Activity
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
              Activity Guidelines
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use clear, descriptive names for activities</li>
                <li>
                  Order determines the sequence of activities within a division
                </li>
                <li>
                  Activities are automatically created when projects are planned
                </li>
                <li>
                  Inactive activities will be hidden from project planning
                </li>
                <li>
                  Each division can have multiple activities with different
                  orders
                </li>
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
              <span>{activity ? "Updating..." : "Creating..."}</span>
            </div>
          ) : (
            <span>{activity ? "Update Activity" : "Create Activity"}</span>
          )}
        </Button>
      </div>
    </form>
  );
};

export default ActivityForm;
