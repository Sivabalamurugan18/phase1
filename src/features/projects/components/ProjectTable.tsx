import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import Badge from "../../../components/ui/Badge";
import { ColDef } from "ag-grid-community";
import { ProjectPlanning } from "../../../types/screen";
import { useAuthStore } from "../../../store/authStore";

interface ProjectTableProps {
  projects: ProjectPlanning[];
  onRowClick?: (project: ProjectPlanning) => void;
  onGridReady?: (params: any) => void;
  onDeleteClick?: (project: ProjectPlanning) => void;
  loading?: boolean;
}

const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  onRowClick,
  onGridReady,
  onDeleteClick,
  loading = false,
}) => {
  const { hasSpecificPermission } = useAuthStore();

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "planningId",
        headerName: "Planning ID",
        width: 120,
        filter: "agNumberColumnFilter",
        sortable: true,
        cellClass: "font-medium text-blue-600",
        hide: true,
      },
      {
        field: "projectNo",
        headerName: "Project No",
        filter: "agTextColumnFilter",
        width: 180,
        cellClass: "font-medium text-blue-600",
      },
      {
        field: "projectName",
        headerName: "Project Name",
        filter: "agTextColumnFilter",
        width: 250,
        cellClass: "font-medium text-gray-900",
        cellRenderer: (params: any) => {
          if (!params.value) return "N/A";
          const projectName = params.value;
          const truncatedName =
            projectName.length > 15
              ? `${projectName.substring(0, 15)}...`
              : projectName;
          return (
            <div className="truncate max-w-full" title={projectName}>
              {truncatedName}
            </div>
          );
        },
      },
      {
        field: "divisionId",
        headerName: "Division ID",
        filter: "agNumberColumnFilter",
        width: 120,
        type: "numericColumn",
        hide: true,
      },
      {
        field: "productId",
        headerName: "Product ID",
        filter: "agNumberColumnFilter",
        width: 120,
        type: "numericColumn",
        hide: true,
      },
      {
        field: "productCode",
        headerName: "Product Code",
        filter: "agTextColumnFilter",
        width: 140,
        cellRenderer: (params: any) => {
          if (!params.value) return "N/A";
          const productCode = params.value;
          const truncatedName =
            productCode.length > 15
              ? `${productCode.substring(0, 15)}...`
              : productCode;
          return (
            <div className="truncate max-w-full" title={productCode}>
              {truncatedName}
            </div>
          );
        },
      },
      {
        field: "customerName",
        headerName: "Customer",
        filter: "agTextColumnFilter",
        width: 180,
        cellRenderer: (params: any) => {
          if (!params.value) return "N/A";
          const customerName = params.value;
          const truncatedName =
            customerName.length > 15
              ? `${customerName.substring(0, 15)}...`
              : customerName;
          return (
            <div className="truncate max-w-full" title={customerName}>
              {truncatedName}
            </div>
          );
        },
      },
      {
        field: "units",
        headerName: "Units",
        filter: "agNumberColumnFilter",
        width: 120,
        type: "numericColumn",
      },
      {
        field: "projectReceivedDate",
        headerName: "Received Date",
        filter: "agDateColumnFilter",
        width: 150,
        cellRenderer: (params: any) => {
          if (!params.value) return "N/A";
          try {
            // Handle both ISO date strings and already formatted dates
            const date = new Date(params.value);
            return isNaN(date.getTime())
              ? params.value
              : date.toLocaleDateString();
          } catch (error) {
            return params.value;
          }
        },
      },
      {
        field: "systemVoltageInKV",
        headerName: "Voltage (kV)",
        filter: "agNumberColumnFilter",
        width: 120,
        type: "numericColumn",
      },
      {
        field: "isCompleted",
        headerName: "Completed",
        width: 120,
        filter: "agTextColumnFilter",
        cellRenderer: (params: any) => (
          <Badge
            text={params.value ? "Yes" : "No"}
            className={
              params.value
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }
          />
        ),
      },
      {
        field: "projectStatus",
        headerName: "Status",
        width: 130,
        filter: "agTextColumnFilter",
        cellRenderer: (params: any) => (
          <Badge
            text={
              params.value ||
              (params.data.isCompleted ? "Completed" : "In Progress")
            }
            className={
              params.value === "Completed" || params.data.isCompleted
                ? "bg-green-100 text-green-800"
                : params.value === "At Risk"
                ? "bg-yellow-100 text-yellow-800"
                : params.value === "Delayed"
                ? "bg-red-100 text-red-800"
                : "bg-blue-100 text-blue-800"
            }
          />
        ),
        hide: true,
      },
    ],
    [onDeleteClick]
  );

  const defaultColDef = useMemo(
    () => ({
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: true,
    }),
    []
  );

  const gridOptions = {
    pagination: true,
    paginationPageSize: 25,
    rowHeight: 65,
    headerHeight: 48,
    animateRows: true,
    enableRangeSelection: true,
    suppressRowClickSelection: true,
    rowSelection: "multiple",
  };

  return (
    <div className="ag-theme-alpine w-full h-[600px]">
      <AgGridReact
        rowData={projects}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
        onGridReady={onGridReady}
        rowModelType="clientSide"
        onRowClicked={(event) => {
          const clickedElement = event.event?.target as HTMLElement;

          if (
            clickedElement.closest("button") ||
            clickedElement.closest(".ag-cell")?.querySelector("button")
          ) {
            return;
          }
          
          onRowClick?.(event.data);
        }}
        rowClass="cursor-pointer hover:bg-gray-50"
        loading={loading}
        loadingOverlayComponent={"Loading..."}
        loadingOverlayComponentParams={{
          loadingMessage: "Loading projects...",
        }}
        suppressColumnVirtualisation={false}
        enableCellTextSelection={true}
        suppressRowHoverHighlight={false}
      />
    </div>
  );
};

export default ProjectTable;
