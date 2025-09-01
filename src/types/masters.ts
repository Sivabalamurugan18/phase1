export interface Division {
  divisionId: number;
  divisionName: string;
  description: string;
  isLive: boolean;
}

export interface Activity {
  activityId: number;
  activityName: string;
  order: number;
  divisionId: number;
  division?: Division | null;
  isLive: boolean;
}

export interface Product {
  productId: number;
  productName: string;
  description?: string;
  isLive: boolean;
}

export interface ResourceRole {
  resourceRoleId: number;
  resourceRoleName: string;
  isLive: boolean;
  Resource?: Resource[] | null;
}

export interface Resource {
  resourceId: number;
  resourceName: string;
  resourceRoleName: string;
  isLive: boolean;
}

export interface ErrorCategory {
  errorCategoryId: number;
  errorCategoryName: string;
  isLive: boolean;
}

export interface ErrorSubCategory {
  errorSubCategoryId: number;
  errorSubCategoryName: string;
  errorCategoryId: number;
  errorCategory?: ErrorCategory | null;
  isLive: boolean;
}

export interface DrawingDescription {
  drawingDescId: number;
  description: string;
  isLive: boolean;
}
