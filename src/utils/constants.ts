// Application constants for better performance and maintainability

export const CACHE_KEYS = {
  USERS: 'users',
  PROJECTS: 'projects',
  DIVISIONS: 'divisions',
  ACTIVITIES: 'activities',
  PRODUCTS: 'products',
  CLARIFICATIONS: 'clarifications',
  DISCREPANCIES: 'discrepancies',
} as const;

export const CACHE_TTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 10 * 60 * 1000,      // 10 minutes
  VERY_LONG: 30 * 60 * 1000, // 30 minutes
} as const;

export const GRID_CONFIG = {
  DEFAULT_PAGE_SIZE: 25,
  ROW_HEIGHT: 50,
  HEADER_HEIGHT: 40,
  BUFFER_SIZE: 10,
} as const;

export const DEBOUNCE_DELAYS = {
  SEARCH: 300,
  RESIZE: 150,
  SCROLL: 100,
} as const;

export const API_ENDPOINTS = {
  USERS: '/api/Account/GetAllUsersAsync',
  PROJECTS: '/api/Plannings/GetAll',
  DIVISIONS: '/api/Divisions/GetAll',
  ACTIVITIES: '/api/Activities/GetAll',
  PRODUCTS: '/api/Products/GetAll',
  CLARIFICATIONS: '/api/Clarifications/GetAll',
  DISCREPANCIES: '/api/Discrepancies/GetAll',
} as const;

export const PERMISSIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

export const STATUS_COLORS = {
  SUCCESS: 'bg-green-100 text-green-800',
  WARNING: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-red-100 text-red-800',
  INFO: 'bg-blue-100 text-blue-800',
  NEUTRAL: 'bg-gray-100 text-gray-800',
} as const;

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;