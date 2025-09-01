import {
  Activity,
  Division,
  DrawingDescription,
  ErrorCategory,
  ErrorSubCategory,
  Product,
} from "./masters";

export interface ProjectPlanning {
  planningId: number;
  divisionId: number;
  division?: Division;
  projectNo: string;
  projectName?: string;
  productCode?: string;
  productId: number;
  product?: Product;
  customerName?: string;
  projectReceivedDate: string;
  units: number;
  systemVoltageInKV: number;
  isCompleted: boolean;
  createdBy?: string;
  modifiedBy?: string;
  createdAt?: string;
  modifiedAt?: string;
  projectActivities?: ProjectActivity[];
  planningComments?: [];
  activitesList: number[];
  completed?: boolean | string;
  projectStatus?: string;
}

export interface ProjectActivity {
  projectActivityId: number;
  activityId: number;
  activity?: Activity;
  planningId: number;
  projectPlanning?: ProjectPlanning;

  sigmaStartDate?: string;
  sigmaFinishDate?: string;

  cpPlannedStartDate?: string;
  cpPlannedFinishedDate?: string;

  cpActualStartDate?: string;
  cpActualFinishedDate?: string;

  cpPlannedQCStartDate?: string;
  plannedQCCompletionDate?: string;

  cpActualQCStartDate?: string;
  actualQCCompletionDate?: string;

  // Powell EDH Team - References to ExtraResource Master
  powellEDHManagerId?: number;
  powellEDHEngineerId?: number;
  powellEDHEngineer?: string;
  powellEDHManager?: string;

  // CP Team - References to Users Data
  cpProjectEngineerId?: number;
  cpAssignedEngineerId?: number;
  cpqcEngineerId?: number;
  cpProjectEngineer?: string;
  cpAssignedEngineer?: string;
  cpqcEngineer?: string;

  plannedHours?: number;
  actualHours?: number;
  noOfErrorsFoundByCPQCEngineer?: number;
  noOfErrorsFoundInInternalReview?: number;
  noOfErrorsFoundByCustomer?: number;
  cpComments?: string;
  activityStatus:
    | "Not Started"
    | "In Progress"
    | "Hold"
    | "Suspended"
    | "Withdrawn"
    | "Completed";
  createdBy?: string;
  modifiedBy?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface ProjectQuickNote {
  planningQuickNotesId: number;
  planningDto?: any;
  planningId: number;
  quickNotes: string;
  createdBy?: string;
  createdTime?: string;
}

export interface Clarification {
  clarificationId: number;
  planningId: number;
  projectPlanning?: ProjectPlanning | null;
  projectActivityId: number;
  projectActivity?: ProjectActivity | null;
  docReference?: string | null;
  clarificationDescription?: string | null;
  raisedById?: string | null;
  response?: string | null;
  responsesFromId?: string | null;
  status?: string | null;
  criticalityIndex?: string | null;
  dateRaised?: string | null;
  dateClosed?: string | null;
  uploadFiles?: UploadedFile[] | null;
  createdBy?: string;
  createdAt?: string;
}

interface UploadedFile {
  fileId: number;
  fileName: string;
  filePath: string;
  contentType?: string | null;
  fileSize: number;
  uploadedAt: string | Date;
  uploadedBy: string | null;
  modifiedAt?: string | Date | null;
  modifiedBy?: string | null;
  clarificationId?: number | null;
  clarification?: Clarification | null;
  datafrom: string;
}

export interface ClarificationFileUpload {
  fileId: number;
  fileName: string;
  filePath: string;
  contentType?: string | null;
  fileSize: number;
  uploadedAt: string | Date;
  uploadedBy: string;
  modifiedAt?: string | Date | null;
  modifiedBy?: string | null;
  clarificationId: number;
  clarification?: Clarification | null;
  datafrom: string;
}

export interface ClarificationQuickNotes {
  clarificationQuickNotesId: number;
  clarificationId: number;
  clarification?: Clarification;
  quickNotes?: string;
  createdBy?: string;
  createdTime?: Date;
  modifiedBy?: string;
  modifiedTime?: Date;
}

export interface Discrepancy {
  discrepancyId: number;
  planningId: number;
  projectPlanning?: ProjectPlanning | null;
  projectActivityId: number;
  projectActivity?: ProjectActivity | null;
  qcLevelId?: number | null;
  qcCycle: number;
  drawingNumber?: string | null;
  drawingDescriptionId?: number | null;
  drawingDescription?: DrawingDescription | null;
  reflectionDocumentId?: string | null;
  errorCategoryId?: number | null;
  errorCategory?: ErrorCategory | null;
  errorSubCategoryId?: number | null;
  errorSubCategory?: ErrorSubCategory | null;
  errorDescription?: string | null;
  criticalityIndex?: string | null;
  statusOfError?: string | null;
  remarks?: string | null;
  recurringIssue?: boolean | null;
  dateResolved?: string | null;
  createdBy?: string;
  modifiedBy?: string;
  createdAt?: string;
  modifiedAt?: string;
}

export interface FilterState {
  searchQuery: string;
  statusFilter: string[];
  dateRange: {
    start: string | null;
    end: string | null;
  };
  [key: string]: any;
}
