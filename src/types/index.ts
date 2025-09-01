// Notification Types
export interface Notification {
  id: string;
  type: "clarification" | "discrepancy" | "project";
  title: string;
  message: string;
  status: "unread" | "read";
  createdAt: string;
  recipientId: string;
  referenceId: string;
  priority: "low" | "medium" | "high";
}

// Export Types
export interface ExportOptions {
  format: "excel" | "pdf";
  dateRange?: {
    start: string;
    end: string;
  };
  includeFields: string[];
  filters?: Record<string, any>;
}

export * from "./masters";
