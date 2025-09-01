import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Discrepancy } from "../../../types/screen";
import Badge from "../../../components/ui/Badge";
import {
  formatDate,
  getStatusColorCode,
  getCriticalityColorCode,
} from "../../../utils/dateUtils";
import { ColDef } from "ag-grid-community";
import { useAuthStore } from "../../../store/authStore";

interface DiscrepancyTableProps {
  discrepancies: Discrepancy[];
  onRowClick?: (discrepancy: Discrepancy) => void;
  onGridReady?: (params: any) => void;
  loading?: boolean;
}

const DiscrepancyTable: React.FC<DiscrepancyTableProps> = ({
  discrepancies,
  onRowClick,
  onGridReady,
  loading = false,
}) => {
  const { hasSpecificPermission } = useAuthStore();

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "discrepancyId",
        headerName: "ID",
        filter: "agNumberColumnFilter",
        sortable: true,
        cellClass: "font-medium text-blue-600",
        width: 80,
        hide: true,
      },
      {
        field: "planningId",
        headerName: "Planning ID",
        filter: "agNumberColumnFilter",
        sortable: true,
        cellClass: "font-medium text-purple-600",
        width: 120,
        hide: true,
      },
      {
        field: "projectActivityId",
        headerName: "Activity ID",
        filter: "agNumberColumnFilter",
        sortable: true,
        cellClass: "font-medium text-green-600",
        width: 120,
        hide: true,
      },
      {
        headerName: "Project No",
        filter: "agTextColumnFilter",
        sortable: true,
        cellClass: "font-medium text-gray-900",
        width: 130,
        valueGetter: (params: any) => {
          return params.data?.projectPlanning?.projectNo || "N/A";
        },
      },
      {
        headerName: "Activity",
        filter: "agTextColumnFilter",
        sortable: true,
        cellClass: "font-medium text-gray-900",
        width: 130,
        valueGetter: (params: any) => {
          return params.data?.projectActivity?.activity?.activityName || "N/A";
        },
      },
      {
        field: "drawingNumber",
        headerName: "Drawing No",
        filter: "agTextColumnFilter",
        sortable: true,
        cellClass: "font-medium text-gray-900",
        width: 130,
      },
      {
        field: "errorDescription",
        headerName: "Error Description",
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "N/A";
          const errorDesc = params.value;
          const truncatedName =
            errorDesc.length > 15
              ? `${errorDesc.substring(0, 15)}...`
              : errorDesc;
          return (
            <div className="truncate max-w-full" title={errorDesc}>
              {truncatedName}
            </div>
          );
        },
        width: 200,
      },
      {
        headerName: "Category",
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <div>
            <div>{params.data.errorCategory?.errorCategoryName || "N/A"}</div>
            <div className="text-xs text-gray-500">
              {params.data.errorSubCategory?.errorSubCategoryName || "N/A"}
            </div>
          </div>
        ),
        valueGetter: (params: any) =>
          `${params.data.errorCategory?.errorCategoryName || ""} ${
            params.data.errorSubCategory?.errorSubCategoryName || ""
          }`,
        width: 150,
      },
      {
        headerName: "QC Info",
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <div>
            <div>
              Level:{" "}
              {params.data.qcLevelId ? `QC${params.data.qcLevelId}` : "N/A"}
            </div>
            <div>Cycle: {params.data.qcCycle || 0}</div>
          </div>
        ),
        valueGetter: (params: any) =>
          `${params.data.qcLevelId ? `QC${params.data.qcLevelId}` : ""} ${
            params.data.qcCycle || ""
          }`,
        width: 100,
      },
      {
        field: "criticalityIndex",
        headerName: "Severity",
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <Badge
            text={params.value || "N/A"}
            className={getCriticalityColorCode(params.value)}
          />
        ),
        width: 110,
      },
      {
        field: "statusOfError",
        headerName: "Status",
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <Badge
            text={params.value || "N/A"}
            className={getStatusColorCode(params.value)}
          />
        ),
        width: 120,
      },
      {
        field: "recurringIssue",
        headerName: "Recurring",
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) =>
          params.value ? (
            <Badge text="Recurring" className="bg-red-100 text-red-800" />
          ) : (
            <span className="text-gray-500">No</span>
          ),
        width: 100,
      },
      {
        field: "drawingDescription.description",
        headerName: "Drawing Description",
        filter: "agTextColumnFilter",
        sortable: true,
        valueGetter: (params: any) =>
          params.data?.drawingDescription?.description || "N/A",
        width: 200,
        hide: true,
      },
    ],
    []
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
    suppressCellFocus: true,
    animateRows: true,
    enableRangeSelection: true,
    suppressRowClickSelection: true,
  };

  return (
    <div className="ag-theme-alpine w-full h-[600px]">
      <AgGridReact
        rowData={discrepancies}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        gridOptions={gridOptions}
        onGridReady={onGridReady}
        onRowClicked={(event) => {
          onRowClick?.(event.data);
        }}
        rowClass="cursor-pointer hover:bg-gray-50"
        loading={loading}
        loadingOverlayComponent={"Loading..."}
        loadingOverlayComponentParams={{
          loadingMessage: "Loading discrepancies...",
        }}
      />
    </div>
  );
};

export default DiscrepancyTable;
