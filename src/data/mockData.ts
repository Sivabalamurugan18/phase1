export const voltageOptions = [
  { value: '1', label: ' < 1 KV' },
  { value: '5', label: '5 KV' },
  { value: '15', label: '15 KV' },
  { value: '27', label: '27 KV' },
  { value: '38', label: '38 KV' }
];

// Error Categories and Subcategories
export const errorCategories = {
  'Dimensional': ['Tolerance', 'Measurement', 'Fit'],
  'Documentation': ['Missing Information', 'Incorrect Reference', 'Ambiguity'],
  'Material': ['Specification', 'Compatibility', 'Property'],
  'Visual': ['Assembly', 'Layout', 'Annotation'],
  'Reference': ['Part Number', 'Standard', 'Specification'],
  'Technical': ['Calculation', 'Performance', 'Safety']
};