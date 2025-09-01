import config from "../config";
import { toast } from "react-hot-toast";
import { apiCache } from "../utils/performance";

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface ApiRequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

class ApiService {
  private baseURL: string;
  private defaultTimeout: number = 10000; // 10 seconds
  private requestQueue = new Map<string, Promise<any>>();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("accessToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  // Prevent duplicate requests
  private async dedupeRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    if (this.requestQueue.has(key)) {
      return this.requestQueue.get(key);
    }

    const promise = requestFn().finally(() => {
      this.requestQueue.delete(key);
    });

    this.requestQueue.set(key, promise);
    return promise;
  }

  public cleanData(data: any): any {
    if (data === undefined || data === null || data === "") {
      return undefined; // this will be skipped in parent object
    }

    if (data instanceof Date) {
      return data.toISOString(); // ✅ convert Date to ISO string
    }

    // // Handle numeric IDs - ensure they are numbers, not strings
    // if (typeof data === "string" && /^\d+$/.test(data)) {
    //   return parseInt(data, 10);
    // }

    if (Array.isArray(data)) {
      const cleanedArray = data
        .map((item) => this.cleanData(item))
        .filter((item) => item !== undefined);

      return cleanedArray.length > 0 ? cleanedArray : undefined;
    }

    if (typeof data === "object") {
      const cleanedObj: any = {};

      for (const [key, value] of Object.entries(data)) {
        const cleanedValue = this.cleanData(value);
        if (cleanedValue !== undefined) {
          cleanedObj[key] = cleanedValue;
        }
      }

      return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
    }

    return data;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE",
    data?: any,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      headers = {},
      timeout = this.defaultTimeout,
      showSuccessToast = false,
      showErrorToast = true,
      successMessage,
      errorMessage,
    } = options;

    try {
      const url = `${this.baseURL}${endpoint}`;
      const authHeaders = this.getAuthHeaders();

      const requestOptions: RequestInit = {
        method,
        headers: { ...authHeaders, ...headers },
        signal: AbortSignal.timeout(timeout),
      };

      if (data && (method === "POST" || method === "PUT")) {
        const cleanedData = this.cleanData(data);
        console.log("this call from api", cleanedData);
        requestOptions.body = JSON.stringify(cleanedData);
      }

      const response = await fetch(url, requestOptions);

      let responseData: T;
      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = (await response.text()) as unknown as T;
      }

      if (!response.ok) {
        const error =
          typeof responseData === "object" &&
          responseData &&
          "message" in responseData
            ? (responseData as any).message
            : `HTTP ${response.status}: ${response.statusText}`;

        throw new Error(error);
      }

      // Show success toast if requested
      if (showSuccessToast && successMessage) {
        toast.success(successMessage);
      }

      return {
        data: responseData,
        success: true,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An unexpected error occurred";

      // Show error toast if requested
      if (showErrorToast) {
        const displayMessage = errorMessage || errorMsg;
        toast.error(displayMessage);
      }

      return {
        data: null as unknown as T,
        success: false,
        error: errorMsg,
      };
    }
  }

  // GET request
  async get<T>(
    endpoint: string,
    options?: ApiRequestOptions & { useCache?: boolean; cacheTTL?: number }
  ): Promise<ApiResponse<T>> {
    const {
      useCache = false,
      cacheTTL = 5 * 60 * 1000,
      ...requestOptions
    } = options || {};

    // Check cache first
    if (useCache) {
      const cached = apiCache.get(endpoint);
      if (cached) {
        return { data: cached, success: true };
      }
    }

    // Dedupe identical requests
    const requestKey = `GET:${endpoint}`;
    const response = await this.dedupeRequest(requestKey, () =>
      this.makeRequest<T>(endpoint, "GET", undefined, requestOptions)
    );

    // Cache successful responses
    if (useCache && response.success) {
      apiCache.set(endpoint, response.data, cacheTTL);
    }

    return response;
  }

  // POST request
  async post<T>(
    endpoint: string,
    data: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    const response = await this.makeRequest<T>(endpoint, "POST", data, {
      showSuccessToast: true,
      successMessage: "Data saved successfully",
      ...options,
    });

    // Invalidate related cache entries on successful POST
    if (response.success) {
      apiCache.clear(); // Simple cache invalidation
    }

    return response;
  }

  // PUT request
  async put<T>(
    endpoint: string,
    data: any,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    var newData = this.cleanData(data);
    const response = await this.makeRequest<T>(endpoint, "PUT", newData, {
      showSuccessToast: true,
      successMessage: "Data updated successfully",
      ...options,
    });

    // Invalidate related cache entries on successful PUT
    if (response.success) {
      apiCache.clear(); // Simple cache invalidation
    }

    return response;
  }

  // DELETE request
  async delete<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<ApiResponse<T>> {
    const response = await this.makeRequest<T>(endpoint, "DELETE", undefined, {
      showSuccessToast: true,
      successMessage: "Data deleted successfully",
      ...options,
    });

    // Invalidate related cache entries on successful DELETE
    if (response.success) {
      apiCache.clear(); // Simple cache invalidation
    }

    return response;
  }

  // Utility method for handling API responses with fallback to mock data
  async getWithFallback<T>(
    endpoint: string,
    mockData: T,
    options?: ApiRequestOptions & {
      onlineCallback?: (data: T) => void;
      offlineCallback?: (data: T) => void;
    }
  ): Promise<{ data: T; isOnline: boolean }> {
    const response = await this.get<T>(endpoint, {
      ...options,
      showErrorToast: false,
    });

    if (response.success) {
      options?.onlineCallback?.(response.data);
      return { data: response.data, isOnline: true };
    } else {
      console.warn(
        `API unavailable for ${endpoint}, using mock data:`,
        response.error
      );
      options?.offlineCallback?.(mockData);
      toast("Using offline data - API unavailable", {
        icon: "ℹ️",
        style: {
          background: "#3b82f6",
          color: "#ffffff",
        },
      });
      return { data: mockData, isOnline: false };
    }
  }

  // Utility method for POST with fallback
  async postWithFallback<T>(
    endpoint: string,
    data: any,
    fallbackHandler: (data: any) => T,
    options?: ApiRequestOptions
  ): Promise<{ data: T; isOnline: boolean }> {
    const response = await this.post<T>(endpoint, data, options);

    if (response.success) {
      return { data: response.data, isOnline: true };
    } else {
      const fallbackData = fallbackHandler(data);
      toast.error(`API Error: ${response.error}. Saved locally instead.`);
      return { data: fallbackData, isOnline: false };
    }
  }

  // Utility method for PUT with fallback
  async putWithFallback<T>(
    endpoint: string,
    data: any,
    fallbackHandler: (data: any) => T,
    options?: ApiRequestOptions
  ): Promise<{ data: T; isOnline: boolean }> {
    const response = await this.put<T>(endpoint, data, options);

    if (response.success) {
      return { data: response.data, isOnline: true };
    } else {
      const fallbackData = fallbackHandler(data);
      toast.error(`API Error: ${response.error}. Updated locally instead.`);
      return { data: fallbackData, isOnline: false };
    }
  }

  // Utility method for DELETE with fallback
  async deleteWithFallback<T>(
    endpoint: string,
    fallbackHandler: () => T,
    options?: ApiRequestOptions
  ): Promise<{ data: T; isOnline: boolean }> {
    const response = await this.delete<T>(endpoint, options);

    if (response.success) {
      return { data: response.data, isOnline: true };
    } else {
      const fallbackData = fallbackHandler();
      toast.success("Deleted locally (API unavailable)");
      return { data: fallbackData, isOnline: false };
    }
  }
}

// Create and export the API service instance
export const apiService = new ApiService(config.API_BASE_URL);

// Export specific service instances for different modules
export const projectService = {
  getAll: () =>
    apiService.get("/api/Plannings/GetAll", {
      useCache: true,
      cacheTTL: 2 * 60 * 1000,
    }),
  create: (data: any) =>
    apiService.post("/api/Plannings/CreatePlanningWithActivities", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/Plannings/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/Plannings/${id}`),

  getActivities: (planningId: number) =>
    apiService.get(`/api/Plannings/${planningId}/ProjectActivities`),
  createActivity: (data: any) =>
    apiService.post("/api/ProjectActivities", data),
  updateActivity: (id: number, data: any) =>
    apiService.put(`/api/ProjectActivities/${id}`, data),
  deleteActivity: (id: number) =>
    apiService.delete(`/api/ProjectActivities/${id}`),

  // Quick Notes API endpoints
  getQuickNotes: (planningId: number) =>
    apiService.get(
      `/api/ProjectQuickNotes/GetProjectQuickNotesWithPlanningId/${planningId}`,
      { useCache: false }
    ),
  createQuickNote: (data: any) =>
    apiService.post("/api/ProjectQuickNotes", data),
  updateQuickNote: (id: number, data: any) =>
    apiService.put(`/api/ProjectQuickNotes/${id}`, data),
  deleteQuickNote: (id: number) =>
    apiService.delete(`/api/ProjectQuickNotes/${id}`),
};

export const clarificationService = {
  getAll: () => apiService.get("/api/Clarifications/GetAll"),
  get: (id: number) =>
    apiService.get(`/api/Clarifications/GetClarification/${id}`),
  create: (data: any) => apiService.post("/api/Clarifications", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/Clarifications/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/Clarifications/${id}`),

  // Quick Notes API endpoints
  getQuickNotes: (clarificationId: number) =>
    apiService.get(
      `/api/ClarificationQuickNotes/GetClarificationQuickNotesWithClarificationId/${clarificationId}`,
      { useCache: false }
    ),
  createQuickNote: (data: any) =>
    apiService.post("/api/ClarificationQuickNotes", data),
  updateQuickNote: (id: number, data: any) =>
    apiService.put(`/api/ClarificationQuickNotes/${id}`, data),
  deleteQuickNote: (id: number) =>
    apiService.delete(`/api/ClarificationQuickNotes/${id}`),

  // File Upload API endpoints
  getFiles: (clarificationId: number) =>
    apiService.get(
      `/api/ClarificationFileUploads/GetClarificationFileUploadWithClarificationId/${clarificationId}`,
      { useCache: false }
    ),

  uploadFile: async (
    clarificationId: number,
    file: File,
    metadata?: {
      uploadedBy?: string;
      uploadedAt?: string;
      modifiedBy?: string;
      modifiedAt?: string;
    }
  ) => {
    const formData = new FormData();
    formData.append("File", file);
    formData.append("ClarificationId", clarificationId.toString());

    // Add metadata if provided
    if (metadata) {
      if (metadata.uploadedBy) {
        formData.append("UploadedBy", metadata.uploadedBy);
      }
      if (metadata.uploadedAt) {
        formData.append("UploadedAt", metadata.uploadedAt);
      }
      if (metadata.modifiedBy) {
        formData.append("ModifiedBy", metadata.modifiedBy);
      }
      if (metadata.modifiedAt) {
        formData.append("ModifiedAt", metadata.modifiedAt);
      }
    }

    // Add default values if not provided
    const currentUserId = localStorage.getItem("userId") || "system";
    const currentTimestamp = new Date().toISOString();

    if (!metadata?.uploadedBy) {
      formData.append("UploadedBy", currentUserId);
    }
    if (!metadata?.uploadedAt) {
      formData.append("UploadedAt", currentTimestamp);
    }
    if (!metadata?.modifiedBy) {
      formData.append("ModifiedBy", currentUserId);
    }
    if (!metadata?.modifiedAt) {
      formData.append("ModifiedAt", currentTimestamp);
    }

    // Add data source identifier
    formData.append("DataFrom", "clarification_attachments");

    try {
      console.log("Uploading file with enhanced metadata:", {
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        clarificationId,
        uploadedBy: metadata?.uploadedBy || currentUserId,
        uploadedAt: metadata?.uploadedAt || currentTimestamp,
        modifiedBy: metadata?.modifiedBy || currentUserId,
        modifiedAt: metadata?.modifiedAt || currentTimestamp,
      });

      const response = await fetch(
        `${config.API_BASE_URL}/api/ClarificationFileUploads`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            // No Content-Type header for multipart/form-data - browser sets it automatically
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const result = await response.json();
      console.log("File upload successful:", result);
      return result;
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  },

  deleteFile: (fileId: number) =>
    apiService.delete(`/api/ClarificationFileUploads/${fileId}`),
};

export const discrepancyService = {
  getAll: () =>
    apiService.get("/api/Discrepancies/GetAll", {
      useCache: true,
      cacheTTL: 1 * 60 * 1000,
    }),
  create: (data: any) => apiService.post("/api/Discrepancies", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/Discrepancies/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/Discrepancies/${id}`),
};

export const authService = {
  login: (credentials: {
    email?: string;
    username?: string;
    password: string;
  }) =>
    apiService.post("/api/account/Login", credentials, {
      showSuccessToast: true,
      successMessage: "Login successful!",
    }),
  logout: () => apiService.post("/api/account/Logout", {}),
  refreshToken: (refreshToken: string) =>
    apiService.post("/api/account/RefreshToken", { refreshToken }),
};

// User Management Services - Updated for consistent single role format
export const userService = {
  getAll: () =>
    apiService.get("/api/Account/GetAllUsersAsync", {
      useCache: true,
      cacheTTL: 5 * 60 * 1000,
    }),
  register: (data: any) => {
    // Ensure single role format for registration
    const registrationData = {
      ...data,
      // Use single role field only
      role: data.role,
    };

    return apiService.post("/api/Account/register", registrationData, {
      showSuccessToast: true,
      successMessage: "User registered successfully!",
    });
  },
  update: (userId: string, data: any) => {
    // Ensure single role format for update
    const updateData = {
      ...data,
      // Use single role field only
      role: data.role,
    };

    return apiService.put(`/api/Account/users/${userId}`, updateData);
  },
  delete: (userId: string) => apiService.delete(`/api/Account/users/${userId}`),
  getRoles: () => apiService.get("/api/Account/GetAllRolesAsync"),
};
