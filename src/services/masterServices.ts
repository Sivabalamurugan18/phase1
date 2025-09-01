import { apiService } from "./apiService";

export const divisionService = {
  getAll: async () => {
    const response = await apiService.get("/api/Divisions/GetAll");
    if (response.success && response.data) {
      // Transform API data to handle both islive and isLive fields
      const transformedData = response.data.map((division: any) => ({
        ...division,
        isLive: division.isLive !== undefined ? division.isLive : division.islive
      }));
      return { ...response, data: transformedData };
    }
    return response;
  },
  create: (data: any) => apiService.post("/api/Divisions", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/Divisions/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/Divisions/${id}`),
};

export const activityService = {
  getAll: () => apiService.get("/api/Activities/GetAll"),
  create: (data: any) => apiService.post("/api/Activities", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/Activities/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/Activities/${id}`),
};

export const productService = {
  getAll: () => apiService.get("/api/Products/GetAll"),
  create: (data: any) => apiService.post("/api/Products", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/Products/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/Products/${id}`),
};

export const resourceRoleService = {
  getAll: () => apiService.get("/api/ResourceRoles/GetAll"),
  create: (data: any) => apiService.post("/api/ResourceRoles", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/ResourceRoles/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/ResourceRoles/${id}`),
};

// Resources Service
export const resourceService = {
  getAll: () => apiService.get("/api/Resources/GetAll"),
  create: (data: any) => apiService.post("/api/Resources", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/Resources/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/Resources/${id}`),
};

// Error Categories Service
export const errorCategoryService = {
  getAll: () => apiService.get("/api/ErrorCategories/GetAll"),
  create: (data: any) => apiService.post("/api/ErrorCategories", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/ErrorCategories/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/ErrorCategories/${id}`),
};

// Error Sub Categories Service
export const errorSubCategoryService = {
  getAll: () => apiService.get("/api/ErrorSubCategories/GetAll"),
  create: (data: any) => apiService.post("/api/ErrorSubCategories", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/ErrorSubCategories/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/ErrorSubCategories/${id}`),
};

// Drawing Descriptions Service
export const drawingDescriptionService = {
  getAll: () => apiService.get("/api/DrawingDescriptions/GetAll"),
  create: (data: any) => apiService.post("/api/DrawingDescriptions", data),
  update: (id: number, data: any) =>
    apiService.put(`/api/DrawingDescriptions/${id}`, data),
  delete: (id: number) => apiService.delete(`/api/DrawingDescriptions/${id}`),
};
