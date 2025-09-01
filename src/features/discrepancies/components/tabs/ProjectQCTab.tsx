import React from "react";
import { useState, useEffect } from "react";
import { Discrepancy } from "../../../../types/screen";
import Card from "../../../../components/ui/Card";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import SearchableSelect from "../../../../components/ui/SearchableSelect";
import { projectService } from "../../../../services/apiService";
import { toast } from "react-hot-toast";
import {
  drawingDescriptionService,
  errorCategoryService,
  errorSubCategoryService,
} from "../../../../services/masterServices";
import ReactSelect, { components, OptionProps } from "react-select"; // Import components and OptionProps

interface ProjectQCTabProps {
  discrepancy: Discrepancy;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
}

const ProjectQCTab: React.FC<ProjectQCTabProps> = ({
  discrepancy,
  onChange,
}) => {
  const [projectNumber, setProjectNumber] = useState<string>("");
  const [loadingProject, setLoadingProject] = useState(false);
  const [projectActivities, setProjectActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Drawing & Documentation states
  const [drawingDescriptionOptions, setDrawingDescriptionOptions] = useState(
    []
  );
  const [loadingDescriptions, setLoadingDescriptions] = useState(true);
  const [reflectionDocumentMultiOptions, setReflectionDocumentMultiOptions] =
    useState<any[]>([]);
  const [selectedReflectionDocuments, setSelectedReflectionDocuments] =
    useState<any[]>([]);

  // Error Details & Status states
  const [errorCategoriesData, setErrorCategoriesData] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [errorSubCategoriesData, setErrorSubCategoriesData] = useState<any[]>(
    []
  );
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);

  // --- Custom Option Component for ReactSelect ---
  // This component will render each option in the dropdown
  // It checks if the option is selected and, if so, adds a tick mark.
  const CustomOption = (props: OptionProps<any, true>) => {
    return (
      <components.Option {...props}>
        <div className="flex items-center justify-between w-full">
          <span>{props.data.label}</span>
          {props.isSelected && (
            <svg
              className="w-4 h-4 text-blue-600 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          )}
        </div>
      </components.Option>
    );
  };
  // ---------------------------------------------

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

  // Fetch activities when project is selected
  const fetchProjectActivities = async (planningId: number) => {
    if (!planningId) {
      setProjectActivities([]);
      return;
    }

    try {
      setLoadingActivities(true);

      // Fetch activities for this project
      const activitiesResponse = await projectService.getActivities(planningId);
      if (activitiesResponse.success) {
        setProjectActivities(activitiesResponse.data || []);
        console.log("Project activities loaded:", activitiesResponse.data);
      } else {
        throw new Error("Failed to fetch project activities");
      }
    } catch (error) {
      console.error("Error fetching project activities:", error);
      setProjectActivities([]);
      toast.error("Failed to load project activities");
    } finally {
      setLoadingActivities(false);
    }
  };

  // Fetch drawing descriptions
  const fetchDrawingDescriptions = async () => {
    try {
      const response = await drawingDescriptionService.getAll();
      const options = (response.data || [])
        .filter((item: any) => item.isLive)
        .map((item: any) => ({
          label: item.description,
          value: item.drawingDescId,
        }));

      setDrawingDescriptionOptions(options);
      setReflectionDocumentMultiOptions(
        options.map((option: any) => ({
          value: option.value,
          label: option.label,
        }))
      );
      console.log("Drawing descriptions loaded:", options);
    } catch (error) {
      console.error("Error fetching drawing descriptions:", error);
      toast.error("Failed to load drawing descriptions");
    } finally {
      setLoadingDescriptions(false);
    }
  };

  // Fetch error categories
  const fetchErrorCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await errorCategoryService.getAll();

      if (response.success) {
        const activeCategories = (response.data || []).filter(
          (category: any) => category.isLive
        );
        setErrorCategoriesData(activeCategories);
        console.log("Error categories loaded:", activeCategories);
      } else {
        throw new Error("Failed to fetch error categories");
      }
    } catch (error) {
      console.error("Error fetching error categories:", error);
      toast.error("Failed to load error categories");
      setErrorCategoriesData([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch error sub categories
  const fetchErrorSubCategories = async () => {
    try {
      setLoadingSubCategories(true);
      const response = await errorSubCategoryService.getAll();

      if (response.success) {
        const activeSubCategories = (response.data || []).filter(
          (subCategory: any) => subCategory.isLive
        );
        setErrorSubCategoriesData(activeSubCategories);
        console.log("Error sub-categories loaded:", activeSubCategories);
      } else {
        throw new Error("Failed to fetch error sub-categories");
      }
    } catch (error) {
      console.error("Error fetching error sub-categories:", error);
      toast.error("Failed to load error sub-categories");
      setErrorSubCategoriesData([]);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchDrawingDescriptions();
    fetchErrorCategories();
    fetchErrorSubCategories();
  }, []);

  // Fetch project number and activities when discrepancy changes
  useEffect(() => {
    if (discrepancy.planningId && projects.length > 0) {
      const project = projects.find(
        (p: any) => p.planningId === discrepancy.planningId
      );
      setProjectNumber(project?.projectNo || "N/A");
      fetchProjectActivities(discrepancy.planningId);
    } else {
      setProjectNumber("");
      setProjectActivities([]);
    }
  }, [discrepancy.planningId, projects]);

  // Set selected reflection documents based on discrepancy data
  useEffect(() => {
    if (
      discrepancy.reflectionDocumentId &&
      reflectionDocumentMultiOptions.length > 0
    ) {
      let selectedIds: number[] = [];

      if (typeof discrepancy.reflectionDocumentId === "string") {
        selectedIds = discrepancy.reflectionDocumentId
          .split(",")
          .map((id) => parseInt(id.trim()))
          .filter((id) => !isNaN(id));
      } else if (Array.isArray(discrepancy.reflectionDocumentId)) {
        selectedIds = discrepancy.reflectionDocumentId;
      } else if (typeof discrepancy.reflectionDocumentId === "number") {
        selectedIds = [discrepancy.reflectionDocumentId];
      }

      const selected = reflectionDocumentMultiOptions.filter((doc: any) =>
        selectedIds.includes(doc.value)
      );
      setSelectedReflectionDocuments(selected);
    } else {
      setSelectedReflectionDocuments([]);
    }
  }, [discrepancy.reflectionDocumentId, reflectionDocumentMultiOptions]);

  // Handle reflection document multi-select change
  const handleReflectionDocumentChange = (selectedOptions: any) => {
    const selectedIds = selectedOptions
      ? selectedOptions.map((opt: any) => opt.value)
      : [];

    setSelectedReflectionDocuments(selectedOptions || []);

    const syntheticEvent = {
      target: {
        name: "reflectionDocumentId",
        value: selectedIds.join(","),
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
  };
  const handleDrawingDescriptionChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { value } = e.target;

    const selectedDescription = drawingDescriptionOptions.find(
      (option: any) => option.value.toString() === value
    );

    const syntheticEvent = {
      target: {
        name: "drawingDescriptionId",
        value: selectedDescription ? selectedDescription.value : null,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
  };

  // Handle error category selection change
  const handleErrorCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { value } = e.target;

    const selectedCategory = errorCategoriesData.find(
      (category) => category.errorCategoryName === value
    );

    const categoryEvent = {
      target: {
        name: "errorCategoryId",
        value: selectedCategory ? selectedCategory.errorCategoryId : null,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(categoryEvent);

    const subCategoryEvent = {
      target: {
        name: "errorSubCategoryId",
        value: null,
      },
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    onChange(subCategoryEvent);
  };

  // Handle error sub-category selection change
  const handleErrorSubCategoryChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const { value } = e.target;

    const selectedSubCategory = errorSubCategoriesData.find(
      (subCategory) => subCategory.errorSubCategoryName === value
    );

    const syntheticEvent = {
      target: {
        name: "errorSubCategoryId",
        value: selectedSubCategory
          ? selectedSubCategory.errorSubCategoryId
          : null,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
  };

  const qcLevelOptions = [
    { value: "1", label: "CPQC2 - Second Level" },
    { value: "2", label: "CPQC3 - Final Level" },
    { value: "3", label: "Powell Engineer" },
    { value: "4", label: "Powell Assembly" },
    { value: "5", label: "Powell Inspection" },
    { value: "6", label: "Customer Inspection" },
    { value: "7", label: "Customer Returns" },
  ];

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

  // Create project options from API data
  const projectOptions = [
    { value: "", label: "Select Project" },
    ...projects.map((project) => ({
      value: project.planningId.toString(),
      label: `${project.projectNo} - ${project.projectName || "Project"}`,
    })),
  ];

  // Create activity options from project activities
  const activitySelectOptions = [
    {
      value: "",
      label: loadingActivities
        ? "Loading activities..."
        : discrepancy.planningId
        ? "Select an activity"
        : "First select a project",
    },
    ...projectActivities.map((activity) => ({
      value: activity.projectActivityId.toString(),
      label:
        activity.activity?.activityName || `Activity ${activity.activityId}`,
    })),
  ];

  // Create category options from API data
  const categoryOptions = errorCategoriesData.map((category) => ({
    value: category.errorCategoryName,
    label: category.errorCategoryName,
  }));

  // Get the selected category to filter sub-categories
  const selectedCategory = errorCategoriesData.find(
    (category) => category.errorCategoryId === discrepancy.errorCategoryId
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

  return (
    <div className="space-y-8">
      {/* Project Information */}
      <Card title="Project Information">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-x-8 gap-y-6">
          <SearchableSelect
            id="planningId"
            name="planningId"
            label="Project"
            value={discrepancy.planningId?.toString() || ""}
            onChange={onChange}
            options={projectOptions}
            disabled={loadingProjects}
            placeholder="Search and select a project..."
            className="max-w-[400px]"
          />

          <SearchableSelect
            id="projectActivityId"
            name="projectActivityId"
            label="Activities"
            value={discrepancy.projectActivityId?.toString() || ""}
            onChange={onChange}
            options={activitySelectOptions}
            disabled={!discrepancy.planningId || loadingActivities}
            className="max-w-[400px]"
          />
        </div>
        <br />

        <div className="grid grid-cols-2 md:grid-cols-2 gap-x-8 gap-y-6">
          <SearchableSelect
            id="drawingDescription"
            name="drawingDescription"
            label="Drawing Description"
            value={discrepancy.drawingDescriptionId?.toString() || ""}
            onChange={handleDrawingDescriptionChange}
            options={[
              {
                value: "",
                label: loadingDescriptions
                  ? "Loading..."
                  : "Search drawing description",
              },
              ...drawingDescriptionOptions.map((opt: any) => ({
                value: opt.value?.toString(),
                label: opt.label,
              })),
            ]}
            required
            disabled={loadingDescriptions}
            className="max-w-[400px]"
            placeholder="Search drawing description"
          />

          <Input
            id="drawingNumber"
            name="drawingNumber"
            label="Drawing Number"
            value={discrepancy.drawingNumber || ""}
            onChange={onChange}
            className="max-w-[300px]"
            required
            placeholder="DWG-XXX-XXX"
          />
        </div>
        <br />

        <div className="grid grid-cols-3 md:grid-cols-3 gap-x-8 gap-y-6">
          <SearchableSelect
            id="qcLevelId"
            name="qcLevelId"
            label="QC Level"
            value={discrepancy.qcLevelId?.toString() || ""}
            onChange={onChange}
            options={[
              { value: "", label: "Select QC Level" },
              ...qcLevelOptions,
            ]}
            className="max-w-[400px]"
          />
          <Input
            id="qcCycle"
            name="qcCycle"
            label="QC Cycle"
            type="number"
            value={discrepancy.qcCycle || 1}
            onChange={onChange}
            className="w-[150px]"
            min={1}
            max={100}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-"].includes(e.key)) {
                e.preventDefault();
              }
            }}
            required
          />
          <Select
            id="statusOfError"
            name="statusOfError"
            label="Status of Error"
            value={discrepancy.statusOfError || ""}
            onChange={onChange}
            options={statusOptions}
            required
            className="max-w-[180px]"
          />
        </div>
        <br />

        <div className="grid grid-cols-3 md:grid-cols-3 gap-x-8 gap-y-6">
          <SearchableSelect
            id="errorCategory"
            name="errorCategory"
            label="Error Category Name"
            value={selectedCategory?.errorCategoryName || ""}
            onChange={handleErrorCategoryChange}
            options={[
              {
                value: "",
                label: loadingCategories
                  ? "Loading categories..."
                  : "Select category",
              },
              ...categoryOptions,
            ]}
            required
            disabled={loadingCategories}
            className="max-w-[250px]"
          />

          <SearchableSelect
            id="errorSubCategory"
            name="errorSubCategory"
            label="Error Sub Category Name"
            value={
              errorSubCategoriesData.find(
                (sub) =>
                  sub.errorSubCategoryId === discrepancy.errorSubCategoryId
              )?.errorSubCategoryName || ""
            }
            onChange={handleErrorSubCategoryChange}
            options={[
              {
                value: "",
                label: loadingSubCategories
                  ? "Loading sub-categories..."
                  : !discrepancy.errorCategoryId
                  ? "Select category first"
                  : subcategoryOptions.length === 0
                  ? "No sub-categories available"
                  : "Select sub-category",
              },
              ...subcategoryOptions,
            ]}
            required
            disabled={!discrepancy.errorCategoryId || loadingSubCategories}
            className="max-w-[250px]"
          />

          <Select
            id="criticalityIndex"
            name="criticalityIndex"
            label="Criticality Index"
            value={discrepancy.criticalityIndex || ""}
            onChange={onChange}
            options={[
              { value: "", label: "Select criticality" },
              ...criticalityOptions,
            ]}
            required
            className="max-w-[200px]"
          />
          <Input
            id="dateResolved"
            name="dateResolved"
            label="Date Resolved"
            type="date"
            value={discrepancy.dateResolved?.split("T")[0] || ""}
            onChange={onChange}
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="recurringIssue"
              name="recurringIssue"
              checked={discrepancy.recurringIssue || false}
              onChange={onChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label
              htmlFor="recurringIssue"
              className="text-sm font-medium text-gray-700"
            >
              This is a recurring issue
            </label>
          </div>
        </div>
        <br />

        <div className="grid grid-cols-1 md:grid-cols-1 gap-x-8 gap-y-6">
          <div className="col-span-2">
            <label
              htmlFor="reflectionDocumentId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reflection Document 
            </label>
            <ReactSelect
              isMulti
              name="reflectionDocumentId"
              options={reflectionDocumentMultiOptions}
              value={selectedReflectionDocuments}
              onChange={handleReflectionDocumentChange}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Search and select reflection documents..."
              isDisabled={loadingDescriptions}
              isSearchable={true}
              closeMenuOnSelect={false}
              hideSelectedOptions={true}
              isClearable={true}
              components={{ Option: CustomOption }}
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: "42px",
                }),
                multiValue: (provided) => ({
                  ...provided,
                  backgroundColor: "#dbeafe",
                  borderRadius: "6px",
                }),
                multiValueLabel: (provided) => ({
                  ...provided,
                  color: "#1e40af",
                  fontSize: "14px", // This sets the font size for selected items in the box
                }),
                multiValueRemove: (provided) => ({
                  ...provided,
                  color: "#1e40af",
                  ":hover": {
                    backgroundColor: "#bfdbfe",
                    color: "#1e3a8a",
                  },
                }),
                // This is the key part for the dropdown options:
                option: (provided, state) => ({
                  ...provided,
                  color: "#4b5563", // Grey color for unselected options
                  fontSize: "14px", // <--- **Directly change this line** to set the font size
                  backgroundColor: state.isFocused
                    ? "#f3f4f6"
                    : provided.backgroundColor, // Light grey background on hover
                  ":active": {
                    ...provided[":active"],
                    backgroundColor: "#e5e7eb", // Slightly darker grey on click
                  },
                }),
                // Also ensuring consistency for input and placeholder text:
                input: (provided) => ({
                  ...provided,
                  fontSize: "14px",
                }),
                placeholder: (provided) => ({
                  ...provided,
                  fontSize: "14px",
                }),
                singleValue: (provided) => ({
                  ...provided,
                  fontSize: "14px",
                }),
              }}
            />
            <p className="text-sm text-gray-500 mt-1">
              Select multiple reflection documents that are relevant to this
              discrepancy
            </p>
          </div>

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
              value={discrepancy.errorDescription || ""}
              onChange={onChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Provide a detailed description of the error or discrepancy..."
            />
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
              value={discrepancy.remarks || ""}
              onChange={onChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Additional comments or notes..."
            />
          </div>
        </div>
        <br />
      </Card>
    </div>
  );
};

export default ProjectQCTab;
