import React, { useState } from "react";
import { Discrepancy } from "../../../types/screen";
import { Settings } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import ProjectQCTab from "./tabs/ProjectQCTab";
import {
  getStatusColorCode,
  getCriticalityColorCode,
} from "../../../utils/dateUtils";

interface DiscrepancyDetailTabsProps {
  discrepancy: Discrepancy;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
}

const DiscrepancyDetailTabs: React.FC<DiscrepancyDetailTabsProps> = ({
  discrepancy,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState("project"); // Keep for consistency, but only one tab now

  const tabs = [
    {
      id: "project",
      label: "Project & QC Information",
      icon: Settings,
      description:
        "Complete discrepancy information including project, QC, drawing, documentation, error details and status",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {discrepancy.drawingNumber}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {discrepancy.errorDescription}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              text={discrepancy.criticalityIndex || "N/A"}
              className={getCriticalityColorCode(discrepancy.criticalityIndex)}
            />
            <Badge
              text={discrepancy.statusOfError || "N/A"}
              className={getStatusColorCode(discrepancy.statusOfError)}
            />
            {discrepancy.recurringIssue && (
              <Badge text="Recurring" className="bg-red-100 text-red-800" />
            )}
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200" style={{ display: "none" }}>
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <tab.icon
                className={`
                  -ml-0.5 mr-2 h-5 w-5
                  ${
                    activeTab === tab.id
                      ? "text-blue-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }
                `}
              />
              <div className="text-left">
                <div>{tab.label}</div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        <ProjectQCTab discrepancy={discrepancy} onChange={onChange} />
      </div>
    </div>
  );
};

export default DiscrepancyDetailTabs;
