// ==========================================
// ITF WEIGHT CLASSES
// ==========================================
export const ITF_WEIGHT_CLASSES = [
  // Individual 
  { id: 'itf-1', ruleset: 'ITF', format: 'Individual', ageGroup: 'U8', gender: 'M', label: 'Mini (-16kg)', min: 0, max: 16 },
  { id: 'itf-2', ruleset: 'ITF', format: 'Individual', ageGroup: 'U8', gender: 'M', label: 'Mini (16-20kg)', min: 16, max: 20 },
  { id: 'itf-3', ruleset: 'ITF', format: 'Individual', ageGroup: '9-11', gender: 'M', label: 'Cadet (-22kg)', min: 0, max: 22 },
  { id: 'itf-4', ruleset: 'ITF', format: 'Individual', ageGroup: '9-11', gender: 'M', label: 'Light (27-32kg)', min: 27, max: 32 },
  { id: 'itf-5', ruleset: 'ITF', format: 'Individual', ageGroup: '12-14', gender: 'M', label: 'Fin (-33kg)', min: 0, max: 33 },
  { id: 'itf-6', ruleset: 'ITF', format: 'Individual', ageGroup: '12-14', gender: 'M', label: 'Light (37-41kg)', min: 37, max: 41 },
  { id: 'itf-7', ruleset: 'ITF', format: 'Individual', ageGroup: '18+', gender: 'M', label: 'Welter (68-74kg)', min: 68, max: 74 },
  { id: 'itf-8', ruleset: 'ITF', format: 'Individual', ageGroup: '18+', gender: 'M', label: 'Heavy (87+kg)', min: 87, max: 999 },
  
  // Team Sparring (Open weight limits)
  { id: 'itf-team-1', ruleset: 'ITF', format: 'Team', ageGroup: '18+', gender: 'M', label: 'Male Team Sparring', min: 0, max: 999 },
  { id: 'itf-team-2', ruleset: 'ITF', format: 'Team', ageGroup: '18+', gender: 'F', label: 'Female Team Sparring', min: 0, max: 999 }
]

// ==========================================
// WT WEIGHT CLASSES
// ==========================================
export const WT_WEIGHT_CLASSES = [
  // Individual Cadet
  { id: 'wt-1', ruleset: 'WT', format: 'Individual', ageGroup: 'Cadet (12-14)', gender: 'M', label: 'Fin (-33kg)', min: 0, max: 33 },
  { id: 'wt-2', ruleset: 'WT', format: 'Individual', ageGroup: 'Cadet (12-14)', gender: 'M', label: 'Light (33-41kg)', min: 33, max: 41 },
  { id: 'wt-3', ruleset: 'WT', format: 'Individual', ageGroup: 'Cadet (12-14)', gender: 'M', label: 'Heavy (49+kg)', min: 49, max: 999 },
  { id: 'wt-4', ruleset: 'WT', format: 'Individual', ageGroup: 'Cadet (12-14)', gender: 'F', label: 'Fin (-29kg)', min: 0, max: 29 },
  
  // Individual Junior
  { id: 'wt-5', ruleset: 'WT', format: 'Individual', ageGroup: 'Junior (15-17)', gender: 'M', label: 'Fin (-45kg)', min: 0, max: 45 },
  { id: 'wt-6', ruleset: 'WT', format: 'Individual', ageGroup: 'Junior (15-17)', gender: 'M', label: 'Heavy (63+kg)', min: 63, max: 999 },
  
  // Team Kyorugi (Often Open Weight or Cumulative Weight)
  { id: 'wt-team-1', ruleset: 'WT', format: 'Team', ageGroup: 'Senior (18-35)', gender: 'M', label: 'Male Team Kyorugi', min: 0, max: 999 },
  { id: 'wt-team-2', ruleset: 'WT', format: 'Team', ageGroup: 'Senior (18-35)', gender: 'F', label: 'Female Team Kyorugi', min: 0, max: 999 }
]