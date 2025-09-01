import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { Clarification } from "../../../types";
import Badge from "../../../components/ui/Badge";
import {
  formatDate,
  getStatusColorCode,
  getCriticalityColorCode,
  getAgeColorCode,
} from "../../../utils/dateUtils";
import { ColDef } from "ag-grid-community";
import { useAuthStore } from "../../../store/authStore";

interface ClarificationTableProps {
  clarifications: Clarification[];
  onRowClick?: (clarification: Clarification) => void;
  onGridReady?: (params: any) => void;
  loading?: boolean;
}

const ClarificationTable: React.FC<ClarificationTableProps> = ({
  clarifications,
  onRowClick,
  onGridReady,
  loading = false,
}) => {
  const { hasSpecificPermission } = useAuthStore();

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "clarificationId",
        headerName: "ID",
        filter: "agNumberColumnFilter",
        sortable: true,
        cellClass: "font-medium text-blue-600",
        width: 80,
        hide: true,
      },
      {
        headerName: "Project No",
        filter: "agTextColumnFilter",
        sortable: true,
        width: 130,
        valueGetter: (params) => params.data?.projectPlanning?.projectNo ?? "",
        cellClass: "font-medium text-gray-900",
      },

      {
        headerName: "Activity",
        filter: "agTextColumnFilter",
        sortable: true,
        width: 130,
        valueGetter: (params) =>
          params.data?.projectActivity?.activity.activityName ?? "",
        cellClass: "font-medium text-gray-900",
      },
      {
        field: "clarificationDescription",
        headerName: "Description",
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => {
          if (!params.value) return "N/A";
          const clarificationDesc = params.value;
          const truncatedName =
            clarificationDesc.length > 15
              ? `${clarificationDesc.substring(0, 15)}...`
              : clarificationDesc;
          return (
            <div className="truncate max-w-full" title={clarificationDesc}>
              {truncatedName}
            </div>
          );
        },
        width: 200,
      },
      {
        field: "docReference",
        headerName: "Doc Reference",
        filter: "agTextColumnFilter",
        sortable: true,
        width: 140,
      },
      {
        field: "dateRaised",
        headerName: "Date Raised",
        filter: "agDateColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => formatDate(params.value),
        width: 120,
      },
      {
        field: "dateClosed",
        headerName: "Date Closed",
        filter: "agDateColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => formatDate(params.value),
        width: 120,
      },
      {
        field: "criticalityIndex",
        headerName: "Criticality",
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <Badge
            text={params.value}
            className={getCriticalityColorCode(params.value)}
          />
        ),
        width: 120,
      },
      {
        field: "status",
        headerName: "Status",
        filter: "agTextColumnFilter",
        sortable: true,
        cellRenderer: (params: any) => (
          <Badge
            text={params.value}
            className={getStatusColorCode(params.value)}
          />
        ),
        width: 110,
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
        rowData={clarifications}
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
          loadingMessage: "Loading clarifications...",
        }}
      />
    </div>
  );
};

export default ClarificationTable;