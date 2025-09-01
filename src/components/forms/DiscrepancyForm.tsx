import React, { useState, useEffect } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import SearchableSelect from "../ui/SearchableSelect";
import Button from "../ui/Button";
import { projectService } from "../../services/apiService";
import { toast } from "react-hot-toast";
import {
  drawingDescriptionService,
  errorCategoryService,
  errorSubCategoryService,
} from "../../services/masterServices";
import {
  DrawingDescription,
  ErrorCategory,
  ErrorSubCategory,
} from "../../types";
import ReactSelect from "react-select";

interface DiscrepancyFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const DiscrepancyForm: React.FC<DiscrepancyFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    discrepancyId: 0,
    planningId: 0,
    projectActivityId: 0,
    qcLevelId: null,
    qcCycle: 1,
    drawingNumber: "",
    drawingDescriptionId: null,
    reflectionDocumentId: "",
    errorCategoryId: null,
    errorSubCategoryId: null,
    errorDescription: "",
    criticalityIndex: "",
    statusOfError: "Identified",
    remarks: "",
    recurringIssue: false,
    createdBy: localStorage.getItem("userId"),
    createdAt: new Date().toISOString(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [projectActivities, setProjectActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [drawingDescriptionOptions, setDrawingDescriptionOptions] = useState(
    []
  );
  const [loadingDescriptions, setLoadingDescriptions] = useState(true);
  const [errorCategoriesData, setErrorCategoriesData] = useState<
    ErrorCategory[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorSubCategoriesData, setErrorSubCategoriesData] = useState<
    ErrorSubCategory[]
  >([]);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Store selected project and activity for reference
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // New state for drawing number multi-select functionality
  const [drawingNumberInput, setDrawingNumberInput] = useState("");
  const [drawingNumbers, setDrawingNumbers] = useState<string[]>([]);

  // Initialize drawing numbers from formData when editing
  useEffect(() => {
    if (formData.drawingNumber) {
      const numbers = formData.drawingNumber.split(',').map(num => num.trim()).filter(num => num);
      setDrawingNumbers(numbers);
    }
  }, [formData.drawingNumber]);

  // Function to add drawing number
  const addDrawingNumber = () => {
    const trimmedInput = drawingNumberInput.trim();
    if (trimmedInput && !drawingNumbers.includes(trimmedInput)) {
      const newNumbers = [...drawingNumbers, trimmedInput];
      setDrawingNumbers(newNumbers);
      setFormData(prev => ({
        ...prev,
        drawingNumber: newNumbers.join(',')
      }));
      setDrawingNumberInput("");
    }
  };

  // Function to remove drawing number
  const removeDrawingNumber = (numberToRemove: string) => {
    const newNumbers = drawingNumbers.filter(num => num !== numberToRemove);
    setDrawingNumbers(newNumbers);
    setFormData(prev => ({
      ...prev,
      drawingNumber: newNumbers.join(',')
    }));
  };

  // Function to handle drawing number input change
  const handleDrawingNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDrawingNumberInput(e.target.value);
  };

  // Function to handle drawing number input key press
  const handleDrawingNumberKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDrawingNumber();
    }
  };

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true);

      const response = await projectService.getAll();

      if (response.success) {
        setProjects(response.data || []);
        console.log("Projects loaded from API:", response.data);
      } else {
        throw new Error("Failed to fetch projects from API");
      }
    } catch (error) {
      console.warn("API unavailable for projects:", error);
      setProjects([]);
      toast("No project data available - API unavailable", {
        icon: "ℹ️",
        style: {
          background: "#3b82f6",
          color: "#ffffff",
        },
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchErrorCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await errorCategoryService.getAll();

      if (response.success) {
        // Filter only active categories
        const activeCategories = (response.data || []).filter(
          (category: ErrorCategory) => category.isLive
        );
        setErrorCategoriesData(activeCategories);
        console.log("Error categories loaded:", activeCategories);
      } else {
        throw new Error("Failed to fetch error categories");
      }
    } catch (error) {
      console.error("Error fetching error categories:", error);
      toast.error("Failed to load error categories");
      // Fallback to empty array if API fails
      setErrorCategoriesData([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchDrawingDescriptions = async () => {
    try {
      const response = await drawingDescriptionService.getAll();
      const options = (response.data || [])
        .filter((item: DrawingDescription) => item.isLive)
        .map((item: DrawingDescription) => ({
          label: item.description,
          value: item.drawingDescId,
        }));

      setDrawingDescriptionOptions(options);
      console.log("drawingdescrip", options);
    } catch (error) {
      console.error("Error fetching drawing descriptions:", error);
      toast.error("Failed to load drawing descriptions");
    } finally {
      setLoadingDescriptions(false);
    }
  };

  const fetchErrorSubCategories = async () => {
    try {
      setLoadingSubCategories(true);
      const response = await errorSubCategoryService.getAll();

      if (response.success) {
        // Filter only active sub-categories
        const activeSubCategories = (response.data || []).filter(
          (subCategory: ErrorSubCategory) => subCategory.isLive
        );
        setErrorSubCategoriesData(activeSubCategories);
        console.log("Error sub-categories loaded:", activeSubCategories);
      } else {
        throw new Error("Failed to fetch error sub-categories");
      }
    } catch (error) {
      console.error("Error fetching error sub-categories:", error);
      toast.error("Failed to load error sub-categories");
      // Fallback to empty array if API fails
      setErrorSubCategoriesData([]);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchErrorCategories();
    fetchErrorSubCategories();
    fetchDrawingDescriptions();
  }, []);

  // Fetch activities when project is selected
  const fetchProjectActivities = async (planningId: number) => {
    if (!planningId) {
      setProjectActivities([]);
      setSelectedProject(null);
      return;
    }

    try {
      setLoadingActivities(true);

      // Find the project by planning ID
      const selectedProject = projects.find(
        (p: any) => p.planningId === planningId
      );
      if (!selectedProject) {
        throw new Error("Project not found");
      }

      setSelectedProject(selectedProject);

      // Update formData with planningId and reset projectActivityId
      setFormData((prev) => ({
        ...prev,
        planningId: selectedProject.planningId,
        projectActivityId: 0,
      }));

      // Fetch activities for this project
      const activitiesResponse = await projectService.getActivities(
        selectedProject.planningId
      );
      if (activitiesResponse.success) {
        setProjectActivities(activitiesResponse.data || []);
        console.log("Project activities loaded:", activitiesResponse.data);
      } else {
        throw new Error("Failed to fetch project activities");
      }
    } catch (error) {
      console.error("Error fetching project activities:", error);
      setProjectActivities([]);
      setSelectedProject(null);
      toast.error("Failed to load project activities");
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let newValue: string | number | boolean | null = value;

    // Handle checkbox
    if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked;
    }

    // Restrict qcCycle to range 1–100
    if (name === "qcCycle") {
      const num = Number(value);
      if (isNaN(num)) {
        newValue = 1;
      } else if (num < 1) {
        newValue = 1;
      } else if (num > 100) {
        newValue = 100;
      } else {
        newValue = num;
      }
    }

    // Handle project selection - fetch activities
    if (name === "planningId") {
      const selectedPlanningId = parseInt(value) || 0;
      setFormData((prev) => ({
        ...prev,
        planningId: selectedPlanningId,
        projectActivityId: 0, // Reset activity when project changes
      }));

      // Fetch activities for the selected project
      fetchProjectActivities(selectedPlanningId);
      return; // fetchProjectActivities will handle the form update
    }

    // Handle activity selection - set projectActivityId
    else if (name === "projectActivityId") {
      setFormData((prev) => ({
        ...prev,
        projectActivityId: parseInt(value) || 0,
      }));
    }

    // Handle QC Level selection - set qcLevelId based on QC Level name
    else if (name === "qcLevel") {
      // Map QC Level names to IDs (you may need to adjust this based on your backend)
      const qcLevelMap: { [key: string]: number } = {
        QC1: 1,
        QC2: 2,
        QC3: 3,
        QC4: 4,
        QC5: 5,
        QC6: 6,
        QC7: 7,
      };

      setFormData((prev) => ({
        ...prev,
        qcLevelId: qcLevelMap[newValue as string] || null,
      }));
    }

    // Handle drawing description selection - set drawingDescriptionId
    else if (name === "drawingDescription") {
      const selectedOption = drawingDescriptionOptions.find(
        (option: any) => option.value === Number(value)
      );

      setFormData((prev) => ({
        ...prev,
        drawingDescriptionId: selectedOption ? selectedOption.value : null,
      }));
    }

    // Handle error category selection - set errorCategoryId and reset sub-category
    else if (name === "errorCategory") {
      const selectedCategory = errorCategoriesData.find(
        (category) => category.errorCategoryName === newValue
      );

      setFormData((prev) => ({
        ...prev,
        errorCategoryId: selectedCategory
          ? selectedCategory.errorCategoryId
          : null,
        errorSubCategoryId: null, // Reset sub-category when category changes
      }));
    }

    // Handle error sub-category selection - set errorSubCategoryId
    else if (name === "errorSubCategory") {
      const selectedSubCategory = errorSubCategoriesData.find(
        (subCategory) => subCategory.errorSubCategoryName === newValue
      );

      setFormData((prev) => ({
        ...prev,
        errorSubCategoryId: selectedSubCategory
          ? selectedSubCategory.errorSubCategoryId
          : null,
      }));
    }

    // Handle all other fields
    else {
      setFormData((prev) => ({
        ...prev,
        [name]: newValue,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle reflection document multi-select change
  const handleReflectionDocumentChange = (selectedOptions: any) => {
    const selectedIds = selectedOptions
      ? selectedOptions.map((opt: any) => opt.value)
      : [];

    setFormData((prev) => ({
      ...prev,
      reflectionDocumentId: selectedIds.join(","),
    }));

    // Clear error on change if valid
    if (selectedIds.length > 0) {
      setErrors((prev) => ({ ...prev, reflectionDocumentId: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedProject) {
      newErrors.planningId = "Project is required";
    }
    if (!formData.drawingNumber) {
      newErrors.drawingNumber = "Drawing Number is required";
    }
    if (!formData.errorCategoryId)
      newErrors.errorCategory = "Error Category is required";
    if (!formData.errorSubCategoryId)
      newErrors.errorSubCategory = "Error Sub Category is required";
    if (!formData.errorDescription?.trim())
      newErrors.errorDescription = "Error Description is required";
    if (!formData.criticalityIndex)
      newErrors.criticalityIndex = "Criticality Index is required";
    if (!formData.projectActivityId)
      newErrors.projectActivityId = "Activity is required";
    if (!formData.drawingDescriptionId)
      newErrors.drawingDescription = "Drawing Description is required";
    // if (
    //   !formData.reflectionDocumentId ||
    //   formData.reflectionDocumentId.length === 0
    // ) {
    //   newErrors.reflectionDocumentId =
    //     "At least one reflection document is required";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Submit the formData as is - all IDs should be properly set
    onSubmit(formData);
  };

  // Create project options from API data
  const projectOptions = [
    { value: "", label: "Select Project" },
    ...projects.map((project) => ({
      value: project.planningId.toString(),
      label: `${project.projectNo} - ${project.projectName || "Project"}${project.customerName ? " - " + project.customerName : ""}`,
    })),
  ];

  // Create category options from API data (display names, but we'll map to IDs in handleChange)
  const categoryOptions = errorCategoriesData.map((category) => ({
    value: category.errorCategoryName,
    label: category.errorCategoryName,
  }));

  // Get the selected category to filter sub-categories
  const selectedCategory = errorCategoriesData.find(
    (category) => category.errorCategoryId === formData.errorCategoryId
  );

  // Filter sub-categories based on selected category
  const filteredSubCategories = errorSubCategoriesData.filter(
    (subCategory) =>
      subCategory.errorCategoryId === selectedCategory?.errorCategoryId
  );

  // Create sub-category options from filtered API data
  const subcategoryOptions = filteredSubCategories.map((subCategory) => ({
    value: subCategory.errorSubCategoryName,
    label: subCategory.errorSubCategoryName,
  }));

  const criticalityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
  ];

  const statusOptions = [
    { value: "Identified", label: "Identified" },
    { value: "In Review", label: "In Review" },
    { value: "Corrected", label: "Corrected" },
    { value: "Ignored", label: "Ignored" },
  ];

  const qcLevelOptions = [
    { value: "QC1", label: "CPQC2 - Second Level" },
    { value: "QC2", label: "CPQC3 - Final Level" },
    { value: "QC3", label: "Powell Engineer" },
    { value: "QC4", label: "Powell Assembly" },
    { value: "QC5", label: "Powell Inspection" },
    { value: "QC6", label: "Customer Inspection" },
    { value: "QC7", label: "Customer Returns" },
  ];

  // Create activity options from project activities
  const activitySelectOptions = [
    {
      value: "",
      label: loadingActivities
        ? "Loading activities..."
        : formData.planningId
        ? "Select an activity"
        : "First select a project",
    },
    ...projectActivities.map((activity) => ({
      value: activity.projectActivityId.toString(),
      label:
        activity.activity?.activityName || `Activity ${activity.activityId}`,
    })),
  ];

  // Get current QC Level value for display
  const currentQcLevel = formData.qcLevelId ? `QC${formData.qcLevelId}` : "";

  // Get current drawing description for display
  const selectedDrawingDescription = drawingDescriptionOptions.find(
    (option: any) => option.value === formData.drawingDescriptionId
  );

  // Prepare reflection document options for multi-select (same as drawing descriptions)
  const reflectionDocumentMultiOptions = drawingDescriptionOptions.map(
    (option: any) => ({
      value: option.value,
      label: option.label,
    })
  );

  // Get selected reflection documents for display
  const selectedReflectionDocuments = reflectionDocumentMultiOptions.filter(
    (option) => {
      if (!formData.reflectionDocumentId) return false;
      const selectedIds = formData.reflectionDocumentId
        .split(",")
        .map((id) => parseInt(id.trim()))
        .filter((id) => !isNaN(id));
      return selectedIds.includes(option.value);
    }
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-h-[70vh] overflow-y-auto"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
        {/* Project Information */}
        <div className="col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Project Information
          </h3>
        </div>

        {/* Projects Loading Status */}
        {loadingProjects && (
          <div className="col-span-2 max-w-[400px]">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-700">
                  Loading projects...
                </span>
              </div>
            </div>
          </div>
        )}

        <SearchableSelect
          id="planningId"
          name="planningId"
          label="Project"
          value={formData.planningId.toString()}
          onChange={handleChange}
          options={projectOptions}
          required
          error={errors.planningId}
          disabled={loadingProjects}
          placeholder="Search and select a project..."
          className="col-span-2 max-w-[400px]"
        />

        <SearchableSelect
          id="projectActivityId"
          name="projectActivityId"
          label="Activities"
          value={formData.projectActivityId.toString()}
          onChange={handleChange}
          options={activitySelectOptions}
          required
          error={errors.projectActivityId}
          disabled={!formData.planningId || loadingActivities}
          className="max-w-[200px]"
        />

        {/* Drawing Number Multi-Select */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Drawing Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="flex">
              <input
                type="text"
                value={drawingNumberInput}
                onChange={handleDrawingNumberInputChange}
                onKeyPress={handleDrawingNumberKeyPress}
                placeholder="Enter drawing number (e.g., 100)"
                className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={addDrawingNumber}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Display selected drawing numbers */}
          {drawingNumbers.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                {drawingNumbers.map((number, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer"
                    onClick={() => {
                      setDrawingNumberInput(number);
                      removeDrawingNumber(number);
                    }}
                  >
                    {number}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDrawingNumber(number);
                      }}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Click on a drawing number to edit it
              </p>
            </div>
          )}
          
          {errors.drawingNumber && (
            <p className="mt-1 text-sm text-red-600">
              {errors.drawingNumber}
            </p>
          )}
        </div>

        <SearchableSelect
  id="drawingDescription"
  name="drawingDescription"
  label="Drawing Description"
  value={formData.drawingDescriptionId?.toString() || ""}
  onChange={handleChange}
  options={[
    ...drawingDescriptionOptions.map((opt: any) => ({
      value: opt.value.toString(),
      label: opt.label,
    })),
  ]}
  required
  error={errors.drawingDescription}
  disabled={loadingDescriptions}
  placeholder={loadingDescriptions ? "Loading..." : "Search drawing description..."}
  className="col-span-2 max-w-[400px] shadow-sm"
/>

        {/* Reflection Document Multi-Select */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reflection Document 
          </label>
          <ReactSelect
            isMulti
            name="reflectionDocumentId"
            options={reflectionDocumentMultiOptions}
            value={selectedReflectionDocuments}
            onChange={handleReflectionDocumentChange}
            placeholder="Search and select reflection documents..."
            isDisabled={loadingDescriptions}
            isSearchable
            closeMenuOnSelect={false}
            className="col-span-2 max-w-[400px] text-sm" // Same layout and font size
            styles={{
              control: (provided) => ({
                ...provided,
                minHeight: "40px",
                fontSize: "0.875rem", // Tailwind's text-sm
                borderColor: errors.reflectionDocument ? "#ef4444" : "#d1d5db", // gray-300
                borderRadius: "0.375rem", // rounded-md
                boxShadow: "none",
                padding: "2px 4px",
                "&:hover": {
                  borderColor: "#9ca3af", // gray-400
                },
              }),
              valueContainer: (provided) => ({
                ...provided,
                padding: "2px 4px",
              }),
              input: (provided) => ({
                ...provided,
                fontSize: "0.875rem", // text-sm
                margin: "0px",
              }),
              multiValue: (provided) => ({
                ...provided,
                backgroundColor: "#e5e7eb", // gray-200
                borderRadius: "0.375rem",
                padding: "2px 4px",
              }),
              multiValueLabel: (provided) => ({
                ...provided,
                color: "#374151", // gray-700
                fontSize: "0.875rem", // text-sm
              }),
              multiValueRemove: (provided) => ({
                ...provided,
                color: "#6b7280", // gray-500
                ":hover": {
                  backgroundColor: "#d1d5db", // gray-300
                  color: "#374151", // gray-700
                },
              }),
              option: (provided, state) => ({
                ...provided,
                fontSize: "0.875rem", // text-sm
                backgroundColor: state.isSelected
                  ? "#f3f4f6" // gray-100
                  : state.isFocused
                  ? "#f9fafb" // gray-50
                  : "#ffffff",
                color: "#111827", // gray-900
              }),
              menu: (provided) => ({
                ...provided,
                fontSize: "0.875rem", // text-sm
              }),
            }}
          />

          {errors.reflectionDocumentId && (
            <p className="text-sm text-red-600 mt-1">
              {errors.reflectionDocumentId}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Select multiple reflection documents that are relevant to this
            discrepancy
          </p>
        </div>

        <SearchableSelect
          id="qcLevel"
          name="qcLevel"
          label="QC Level"
          value={currentQcLevel}
          onChange={handleChange}
          options={qcLevelOptions}
          className="max-w-[300px]"
        />

        <Input
          id="qcCycle"
          name="qcCycle"
          type="number"
          label="QC Cycle"
          value={formData.qcCycle}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (["e", "E", "+", "-"].includes(e.key)) {
              e.preventDefault();
            }
          }}
          required
          min={1}
          max={100}
          className="max-w-[150px]"
        />

        <SearchableSelect
          id="errorCategory"
          name="errorCategory"
          label="Error Category Name"
          value={selectedCategory?.errorCategoryName || ""}
          onChange={handleChange}
          options={categoryOptions}
          required
          error={errors.errorCategory}
          disabled={loadingCategories}
        />

        {/* Category Loading Indicator */}
        {loadingCategories && (
          <div className="col-span-2 max-w-[400px]">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-700">
                  Loading error categories...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* No Categories Message */}
        {!loadingCategories && errorCategoriesData.length === 0 && (
          <div className="col-span-2 max-w-[400px]">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-yellow-400 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-yellow-700">
                  No error categories available. Please contact administrator to
                  set up error categories.
                </span>
              </div>
            </div>
          </div>
        )}

        <SearchableSelect
          id="errorSubCategory"
          name="errorSubCategory"
          label="Error Sub Category Name"
          value={
            errorSubCategoriesData.find(
              (sub) => sub.errorSubCategoryId === formData.errorSubCategoryId
            )?.errorSubCategoryName || ""
          }
          onChange={handleChange}
          options={[
            {
              value: "",
              label: loadingSubCategories
                ? "Loading sub-categories..."
                : !formData.errorCategoryId
                ? "Select category first"
                : subcategoryOptions.length === 0
                ? "No sub-categories available"
                : "Select sub-category",
            },
            ...subcategoryOptions,
          ]}
          required
          error={errors.errorSubCategory}
          disabled={!formData.errorCategoryId || loadingSubCategories}
        />

        {/* Sub-Category Loading Indicator */}
        {loadingSubCategories && (
          <div className="col-span-2 max-w-[400px]">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-700">
                  Loading error sub-categories...
                </span>
              </div>
            </div>
          </div>
        )}

        {/* No Sub-Categories Message */}
        {formData.errorCategoryId &&
          !loadingSubCategories &&
          subcategoryOptions.length === 0 && (
            <div className="col-span-2 max-w-[400px]">
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-yellow-400 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-yellow-700">
                    No sub-categories available for the selected category.
                    Please contact administrator to set up sub-categories.
                  </span>
                </div>
              </div>
            </div>
          )}

        <Select
          id="criticalityIndex"
          name="criticalityIndex"
          label="Criticality Index"
          value={formData.criticalityIndex}
          onChange={handleChange}
          options={[
            { value: "", label: "Select criticality" },
            ...criticalityOptions,
          ]}
          required
          error={errors.criticalityIndex}
        />

        <Select
          id="statusOfError"
          name="statusOfError"
          label="Status of Error"
          value={formData.statusOfError}
          onChange={handleChange}
          options={statusOptions}
          required
        />

        <div className="col-span-2">
          <label
            htmlFor="errorDescription"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Error Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="errorDescription"
            name="errorDescription"
            rows={3}
            value={formData.errorDescription}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Provide a detailed description of the error or discrepancy..."
          />
          {errors.errorDescription && (
            <p className="mt-1 text-sm text-red-600">
              {errors.errorDescription}
            </p>
          )}
        </div>

        <div className="col-span-2">
          <label
            htmlFor="remarks"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Remarks
          </label>
          <textarea
            id="remarks"
            name="remarks"
            rows={2}
            value={formData.remarks}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Additional comments or notes..."
          />
        </div>

        <div className="col-span-2 flex items-center space-x-2">
          <input
            type="checkbox"
            id="recurringIssue"
            name="recurringIssue"
            checked={formData.recurringIssue}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="recurringIssue"
            className="text-sm font-medium text-gray-700"
          >
            This is a recurring issue
          </label>
        </div>
      </div>

      {/* User Data Status */}
      {!loadingProjects && projects.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No Project Data Available
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  No API project data is available. Project dropdown will be
                  empty.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          Log Discrepancy
        </Button>
      </div>
    </form>
  );
};

export default DiscrepancyForm;
