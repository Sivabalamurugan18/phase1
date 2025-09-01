import React, { useState, useEffect } from "react";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import {
  activityService,
  divisionService,
  productService,
} from "../../services/masterServices";
import { toast } from "react-hot-toast";
import ReactSelect from "react-select";
import { useProjectStore } from "../../store/projectStore";
import { Activity, Division, Product } from "../../types/masters";

interface ProjectFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    divisionId: "",
    projectNo: "",
    projectName: "",
    customerName: "",
    productId: "",
    productCode: "",
    units: 1,
    projectReceivedDate: "",
    systemVoltageInKV: "",
    projectActivities: [],
    activitiesList: [] as number[],
  });

  const [divisions, setDivisions] = useState<Division[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { getProjectOptions } = useProjectStore();

  const voltageOptions = [
    { value: "1", label: "< 1 KV" },
    { value: "5", label: "5 KV" },
    { value: "15", label: "15 KV" },
    { value: "27", label: "27 KV" },
    { value: "38", label: "38 KV" },
  ];

  useEffect(() => {
    fetchMasterData();
  }, []);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [divisionsRes, productsRes, activitiesRes] = await Promise.all([
        divisionService.getAll(),
        productService.getAll(),
        activityService.getAll(),
      ]);

      if (divisionsRes.success) {

        // Transform API data to handle both islive and isLive fields

        const transformedDivisions = (divisionsRes.data || []).map((division: any) => ({

          ...division,

          isLive: division.isLive !== undefined ? division.isLive : division.islive

        }));

        setDivisions(transformedDivisions.filter((d: Division) => d.isLive === true));

      }
      if (productsRes.success) {
        setProducts(productsRes.data.filter((p: Product) => p.isLive));
      }
      if (activitiesRes) {
        setAllActivities(activitiesRes.data.filter((a: Activity) => a.isLive));
      }
    } catch (err) {
      toast.error("Failed to load master data");
    } finally {
      setLoading(false);
    }
  };

  const toUTC = (date: string): string | null => {
    if (!date) return null;
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const validateProjectNo = (projectNo: string): boolean => {
    if (!projectNo.trim()) return false;
    const existingProjects = getProjectOptions();
    const isDuplicate = existingProjects.some(
      (project) => project.projectNo === projectNo
    );
    return !isDuplicate;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === "divisionId") {
      const selectedId = parseInt(value);
      const divisionActivities = allActivities
        .filter((a) => a.divisionId === selectedId)
        .map((a) => a.activityId);

      setFormData((prev) => ({
        ...prev,
        divisionId: value,
        activitiesList: divisionActivities,
      }));

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
      return;
    }

    if (name === "projectNo") {
      setFormData((prev) => ({
        ...prev,

        [name]: value,
      }));

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }

      const projectNoPattern = /^\d{6}-\d{2}$/;

      if (value && projectNoPattern.test(value)) {
        if (!validateProjectNo(value)) {
          setErrors((prev) => ({
            ...prev,

            [name]:
              "This project number already exists. Please use a different number.",
          }));
        }
      }

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.divisionId) newErrors.divisionId = "Division is required";
    if (!formData.projectNo.trim())
      newErrors.projectNo = "Project No is required";
    if (!formData.projectName.trim())
      newErrors.projectName = "Project Name is required";
    if (!formData.customerName.trim())
      newErrors.customerName = "Customer Name is required";
    if (!formData.productId) newErrors.productId = "Product is required";
    if (!formData.units || formData.units < 1)
      newErrors.units = "Units must be at least 1";
    if (!formData.projectReceivedDate)
      newErrors.projectReceivedDate = "Received Date is required";
    if (!formData.systemVoltageInKV)
      newErrors.systemVoltageInKV = "System Voltage is required";

    const projectNoPattern = /^\d{6}-\d{2}$/;
    if (formData.projectNo && !projectNoPattern.test(formData.projectNo)) {
      newErrors.projectNo = "Project No must be in format: 123456-01";
    } else if (formData.projectNo && !validateProjectNo(formData.projectNo)) {
      newErrors.activitiesList =
        "This project number already exists. Please use a different number.";
    }

    if (formData.activitiesList.length === 0) {
      newErrors.activitiesList = "Please Select Atleast 1 Activity.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const processedData = {
      divisionId: Number(formData.divisionId),
      projectNo: formData.projectNo,
      projectName: formData.projectName,
      customerName: formData.customerName,
      productId: Number(formData.productId),
      productCode: formData.productCode,
      units: Number(formData.units),
      projectReceivedDate: toUTC(formData.projectReceivedDate),
      systemVoltageInKV: Number(formData.systemVoltageInKV),
      activitiesList: formData.activitiesList, // contains activityIds now
    };

    console.log("Final submitted data from Project Creation:", processedData);
    onSubmit(processedData);
  };

  const divisionOptions = [
    { value: "", label: "Select Division" },
    ...divisions.map((d) => ({
      value: d.divisionId.toString(),
      label: d.divisionName,
    })),
  ];

  const productOptions = [
    { value: "", label: "Select Product" },
    ...products.map((p) => ({
      value: p.productId.toString(),
      label: p.productName,
    })),
  ];

  const currentActivityOptions = allActivities
    .filter((a) => a.divisionId === parseInt(formData.divisionId))
    .map((a) => ({ value: a.activityId, label: a.activityName }));

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 max-h-[70vh] overflow-y-auto px-1"
    >
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700">
              Loading master data...
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Select
          id="divisionId"
          name="divisionId"
          label="Division"
          value={formData.divisionId}
          onChange={handleChange}
          options={divisionOptions}
          required
          error={errors.divisionId}
          disabled={loading}
        />

        <Input
          id="projectNo"
          name="projectNo"
          label="Project No"
          value={formData.projectNo}
          onChange={handleChange}
          placeholder="e.g. 123456-01"
          pattern="\d{6}-\d{2}"
          title="Format: 6 digits, hyphen, 2 digits (e.g. 123456-01)"
          required
          error={errors.projectNo}
        />

        <Input
          id="projectName"
          name="projectName"
          label="Project Name"
          value={formData.projectName}
          onChange={handleChange}
          required
          error={errors.projectName}
        />

        <Input
          id="customerName"
          name="customerName"
          label="Customer Name"
          value={formData.customerName}
          onChange={handleChange}
          required
          error={errors.customerName}
        />

        <Select
          id="productId"
          name="productId"
          label="Product"
          value={formData.productId}
          onChange={handleChange}
          options={productOptions}
          required
          error={errors.productId}
          disabled={loading}
        />

        <Input
          id="productCode"
          name="productCode"
          label="Product Code"
          value={formData.productCode}
          onChange={handleChange}
        />

        <Input
          id="units"
          name="units"
          label="Units"
          type="number"
          value={formData.units}
          onChange={handleChange}
          min={1}
          max={100}
          required
          error={errors.units}
        />

        <Input
          id="projectReceivedDate"
          name="projectReceivedDate"
          label="Received Date"
          type="date"
          value={formData.projectReceivedDate?.split("T")[0] || ""}
          onChange={handleChange}
          required
          error={errors.projectReceivedDate}
        />

        <Select
          id="systemVoltageInKV"
          name="systemVoltageInKV"
          label="System Voltage (KV)"
          value={formData.systemVoltageInKV}
          onChange={handleChange}
          options={[{ value: "", label: "Select Voltage" }, ...voltageOptions]}
          required
          error={errors.systemVoltageInKV}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Activities
          </label>
          <ReactSelect
            isMulti
            name="activitiesList"
            options={currentActivityOptions}
            value={currentActivityOptions.filter((opt) =>
              formData.activitiesList.includes(opt.value)
            )}
            onChange={(selectedOptions) => {
              const selectedIds = selectedOptions.map((opt) => opt.value);
              setFormData((prev) => ({
                ...prev,
                activitiesList: selectedIds,
              }));
              // Clear error on change if valid
              if (selectedIds.length > 0) {
                setErrors((prev) => ({ ...prev, activitiesList: "" }));
              }
            }}
            className="basic-multi-select"
            classNamePrefix="select"
          />
          {errors.activitiesList && (
            <p className="text-sm text-red-600 mt-1">{errors.activitiesList}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={loading}>
          Save Project
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
