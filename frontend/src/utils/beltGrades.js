// Shared belt grade definitions used across AddCompetitor, EditCompetitor, and BulkUpload.
// value = internal code used by categoryRules.js deriveBeltGroup()
// label = human-readable display + CSV column value for TMs

export const BELT_GRADES = [
  { value: '10G', label: '10th Kup (White)' },
  { value: '9G',  label: '9th Kup (White-Yellow)' },
  { value: '8G',  label: '8th Kup (Yellow)' },
  { value: '7G',  label: '7th Kup (Yellow-Green)' },
  { value: '6G',  label: '6th Kup (Green)' },
  { value: '5G',  label: '5th Kup (Green-Blue)' },
  { value: '4G',  label: '4th Kup (Blue)' },
  { value: '3G',  label: '3rd Kup (Blue-Red)' },
  { value: '2G',  label: '2nd Kup (Red)' },
  { value: '1G',  label: '1st Kup (Red-Black)' },
  { value: '1D',  label: '1st Dan (Black)' },
  { value: '2D',  label: '2nd Dan (Black)' },
  { value: '3D',  label: '3rd Dan (Black)' },
  { value: '4D',  label: '4th Dan (Black)' },
  { value: '5D',  label: '5th Dan (Black)' },
  { value: '6D',  label: '6th Dan (Black)' },
]

// Look up the code (value) from a label string — for CSV parsing
export const BELT_LABEL_MAP = Object.fromEntries(BELT_GRADES.map((b) => [b.label, b.value]))

// Look up the label from a code — for display
export const BELT_VALUE_MAP = Object.fromEntries(BELT_GRADES.map((b) => [b.value, b.label]))

// All accepted labels in the CSV template
export const BELT_LABELS = BELT_GRADES.map((b) => b.label)
