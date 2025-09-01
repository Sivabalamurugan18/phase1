// Calculate the age of a clarification in days
export const calculateClarificationAge = (dateRaised: string, dateClosed?: string): number => {
  const raised = new Date(dateRaised);
  const closed = dateClosed ? new Date(dateClosed) : new Date();
  
  // Return difference in days
  const diffTime = Math.abs(closed.getTime() - raised.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Format date to locale string
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get color code based on age
export const getAgeColorCode = (age: number): string => {
  if (age <= 3) return 'bg-green-100 text-green-800'; // Good
  if (age <= 7) return 'bg-yellow-100 text-yellow-800'; // Warning
  return 'bg-red-100 text-red-800'; // Critical
};

// Get color code based on criticality
export const getCriticalityColorCode = (criticality: string): string => {
  switch (criticality) {
    case 'Low':
      return 'bg-blue-100 text-blue-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'High':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get color code based on status
export const getStatusColorCode = (status: string): string => {
  switch (status) {
    case 'Completed':
    case 'Closed':
    case 'Fixed':
    case 'Verified':
      return 'bg-green-100 text-green-800';
    case 'In Progress':
    case 'In Review':
    case 'Under Review':
      return 'bg-blue-100 text-blue-800';
    case 'Not Started':
    case 'Identified':
      return 'bg-gray-100 text-gray-800';
    case 'At Risk':
      return 'bg-yellow-100 text-yellow-800';
    case 'Delayed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Convert YYYY-MM-DD to human-readable date
export const humanReadableDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};