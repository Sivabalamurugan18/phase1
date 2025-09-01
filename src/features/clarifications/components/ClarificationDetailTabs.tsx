import React, { useState } from "react";
import { FileText, MessageSquare, Upload } from "lucide-react";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import ClarificationDetailsTab from "./tabs/ClarificationDetailsTab";
import AttachmentsTab from "./tabs/AttachmentsTab";
import QuickNotesTab from "./tabs/QuickNotesTab";
import {
  getCriticalityColorCode,
  getStatusColorCode,
} from "../../../utils/dateUtils";
import { Clarification } from "../../../types/screen";

interface ClarificationDetailTabsProps {
  clarification: Clarification;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
}

const ClarificationDetailTabs: React.FC<ClarificationDetailTabsProps> = ({
  clarification,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
  };

  const handleFileRemove = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const tabs = [
    { id: "details", label: "Clarification Details", icon: FileText },
    { id: "attachments", label: "Attachments", icon: Upload },
    { id: "notes", label: "Quick Notes", icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              {clarification.projectPlanning?.projectNo}
            </h3>
            <p className="text-sm text-gray-500 mt-1 max-w-2xl">
              {clarification.clarificationDescription}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              text={clarification.criticalityIndex ?? ""}
              className={getCriticalityColorCode(
                clarification.criticalityIndex || ""
              )}
            />
            <Badge
              text={clarification.status ?? ""}
              className={getStatusColorCode(clarification.status || "")}
            />
          </div>
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
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
        {activeTab === "details" && (
          <ClarificationDetailsTab
            clarification={clarification}
            onChange={onChange}
          />
        )}
        {activeTab === "attachments" && (
          <AttachmentsTab
            clarification={clarification}
            onFileUpload={handleFileUpload}
            onFileRemove={handleFileRemove}
            uploadedFiles={uploadedFiles}
          />
        )}
        {activeTab === "notes" && (
          <QuickNotesTab
            clarificationId={clarification.clarificationId}
            projectNo={clarification.projectPlanning?.projectNo || "N/A"}
            clarificationDescription={
              clarification.clarificationDescription || ""
            }
          />
        )}
      </div>
    </div>
  );
};

export default ClarificationDetailTabs;