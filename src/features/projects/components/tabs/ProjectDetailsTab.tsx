import React, { useState, useEffect } from "react";
import { ProjectPlanning } from "../../../../types/screen";
import Card from "../../../../components/ui/Card";
import Input from "../../../../components/ui/Input";
import Select from "../../../../components/ui/Select";
import {
  divisionService,
  productService,
} from "../../../../services/masterServices";

interface Division {
  divisionId: number;
  divisionName: string;
  description: string;
  isLive: boolean;
}

interface Product {
  productId: number;
  productName: string;
  description?: string;
  isLive: boolean;
}

interface ProjectDetailsTabProps {
  project: ProjectPlanning;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  canEdit: (field: string) => boolean;
}

const ProjectDetailsTab: React.FC<ProjectDetailsTabProps> = ({
  project,
  onChange,
  canEdit,
}) => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const voltageOptions = [
    { value: "1", label: " < 1 KV" },
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
      // Fetch divisions
      const divisionsResponse = await divisionService.getAll();
      if (divisionsResponse.success) {
        const transformedDivisions = (divisionsResponse.data || []).map((division: any) => ({

          ...division,

          isLive: division.isLive !== undefined ? division.isLive : division.islive

        }));

        const activeDivisions = transformedDivisions.filter(

          (d: Division) => d.isLive === true);
        setDivisions(activeDivisions);
      } else {
        setDivisions([]);
      }

      // Fetch products
      const productsResponse = await productService.getAll();
      if (productsResponse.success) {
        const activeProducts = productsResponse.data.filter(
          (p: Product) => p.isLive
        );
        setProducts(activeProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching master data:", error);
      setDivisions([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: "In Progress", label: "In Progress" },
    { value: "On Track", label: "On Track" },
    { value: "At Risk", label: "At Risk" },
    { value: "Delayed", label: "Delayed" },
    { value: "On Hold", label: "On Hold" },
    { value: "Completed", label: "Completed" },
  ];

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

  return (
    <div className="space-y-8">
      <Card title="Project Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Select
            id="divisionId"
            name="divisionId"
            label="Division"
            value={project.divisionId?.toString() || ""}
            onChange={onChange}
            options={divisionOptions}
            required
            disabled={!canEdit("divisionId") || loading}
          />

          <Input
            id="projectNo"
            name="projectNo"
            label="Project Number"
            value={project.projectNo}
            onChange={onChange}
            className="w-full"
            required
          />

          <Input
            id="projectName"
            name="projectName"
            label="Project Name"
            value={project.projectName || ""}
            onChange={onChange}
            className="w-full"
            required
          />

          <Select
            id="productId"
            name="productId"
            label="Product"
            value={project.productId?.toString() || ""}
            onChange={onChange}
            options={productOptions}
            required
          />

          {/* ✅ ADDED: Product Code field in Project Details Tab */}
          <Input
            id="productCode"
            name="productCode"
            label="Product Code"
            value={project.productCode || ""}
            onChange={onChange}
            className="w-full"
            placeholder="Enter product code"
          />

          <Input
            id="units"
            name="units"
            label="Units"
            type="number"
            value={project.units}
            onChange={onChange}
            className="w-full"
            required
            min={1}
          />

          <Input
            id="customerName"
            name="customerName"
            label="Customer Name"
            value={project.customerName || ""}
            onChange={onChange}
            className="w-full"
          />

          <Input
            id="projectReceivedDate"
            name="projectReceivedDate"
            label="Project Received Date"
            type="date"
            value={
              project.projectReceivedDate
                ? project.projectReceivedDate.split("T")[0]
                : ""
            }
            onChange={onChange}
            className="w-full"
            required
          />

          <Select
            id="systemVoltageInKV"
            name="systemVoltageInKV"
            label="System Voltage (KV)"
            value={project.systemVoltageInKV?.toString() || ""}
            onChange={onChange}
            options={[
              { value: "", label: "Select Voltage" },
              ...voltageOptions,
            ]}
            required
          />

          {/* <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="completed"
              name="completed"
              checked={
                project.completed === true || project.completed === "Yes"
              }
              onChange={(e) =>
                onChange({
                  target: {
                    name: "completed",
                    value: e.target.checked,
                  },
                } as any)
              }
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={canEdit("completed")}
            />
            <label
              htmlFor="completed"
              className="text-sm font-medium text-gray-700"
            >
              Project Completed
            </label>
          </div> */}
        </div>
      </Card>
    </div>
  );
};

export default ProjectDetailsTab;
