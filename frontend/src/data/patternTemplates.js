// ==========================================
// ITF PATTERN (TUL) TEMPLATES
// ==========================================
export const ITF_PATTERN_CLASSES = [
  // Individual
  { id: 'itf-pat-m-u12', eventType: 'Individual', label: 'Male Pattern - Under 12', gender: 'M', ageGroup: 'Under 12', beltGroup: 'Black Belt', requiredPattern: 'Chon-Ji' },
  { id: 'itf-pat-f-u12', eventType: 'Individual', label: 'Female Pattern - Under 12', gender: 'F', ageGroup: 'Under 12', beltGroup: 'Black Belt', requiredPattern: 'Dan-Gun' },
  { id: 'itf-pat-m-12-14', eventType: 'Individual', label: 'Male Pattern - 12-14 Years', gender: 'M', ageGroup: '12-14', beltGroup: 'Black Belt', requiredPattern: 'Do-San' },
  { id: 'itf-pat-f-12-14', eventType: 'Individual', label: 'Female Pattern - 12-14 Years', gender: 'F', ageGroup: '12-14', beltGroup: 'Black Belt', requiredPattern: 'Won-Hyo' },
  { id: 'itf-pat-m-15-17', eventType: 'Individual', label: 'Male Pattern - 15-17 Years', gender: 'M', ageGroup: '15-17', beltGroup: 'Black Belt', requiredPattern: 'Yul-Gok' },
  { id: 'itf-pat-f-15-17', eventType: 'Individual', label: 'Female Pattern - 15-17 Years', gender: 'F', ageGroup: '15-17', beltGroup: 'Black Belt', requiredPattern: 'Joong-Gun' },
  { id: 'itf-pat-m-18-35', eventType: 'Individual', label: 'Male Pattern - 18-35 Years', gender: 'M', ageGroup: '18-35', beltGroup: 'Black Belt', requiredPattern: 'Toi-Gye' },
  { id: 'itf-pat-f-18-35', eventType: 'Individual', label: 'Female Pattern - 18-35 Years', gender: 'F', ageGroup: '18-35', beltGroup: 'Black Belt', requiredPattern: 'Hwa-Rang' },
  
  // Team (ITF only uses Team, no Pair)
  { id: 'itf-pat-team-m', eventType: 'Team', label: 'Male Team Pattern - Senior', gender: 'M', ageGroup: '18-35', beltGroup: 'Black Belt', requiredPattern: 'Choong-Moo' },
  { id: 'itf-pat-team-f', eventType: 'Team', label: 'Female Team Pattern - Senior', gender: 'F', ageGroup: '18-35', beltGroup: 'Black Belt', requiredPattern: 'Kwang-Gae' }
];

// ==========================================
// WT POOMSAE TEMPLATES
// ==========================================
export const WT_POOMSAE_CLASSES = [
  // Individual
  { id: 'wt-poom-m-u12', eventType: 'Individual', label: 'Male Poomsae - Under 12', gender: 'M', ageGroup: 'Under 12', beltGroup: 'Black Belt', requiredPattern: 'Taegeuk 4 Jang' },
  { id: 'wt-poom-f-u12', eventType: 'Individual', label: 'Female Poomsae - Under 12', gender: 'F', ageGroup: 'Under 12', beltGroup: 'Black Belt', requiredPattern: 'Taegeuk 4 Jang' },
  { id: 'wt-poom-m-12-14', eventType: 'Individual', label: 'Male Poomsae - Cadet (12-14)', gender: 'M', ageGroup: '12-14', beltGroup: 'Black Belt', requiredPattern: 'Taegeuk 6 Jang' },
  { id: 'wt-poom-f-12-14', eventType: 'Individual', label: 'Female Poomsae - Cadet (12-14)', gender: 'F', ageGroup: '12-14', beltGroup: 'Black Belt', requiredPattern: 'Taegeuk 6 Jang' },
  
  // Pair (WT Specific)
  { id: 'wt-poom-pair-cadet', eventType: 'Pair', label: 'Mixed Pair Poomsae - Cadet', gender: 'Mixed', ageGroup: '12-14', beltGroup: 'Black Belt', requiredPattern: 'Taegeuk 8 Jang' },
  { id: 'wt-poom-pair-junior', eventType: 'Pair', label: 'Mixed Pair Poomsae - Junior', gender: 'Mixed', ageGroup: '15-17', beltGroup: 'Black Belt', requiredPattern: 'Koryo' },
  
  // Team
  { id: 'wt-poom-team-m', eventType: 'Team', label: 'Male Team Poomsae - Senior', gender: 'M', ageGroup: '18-35', beltGroup: 'Black Belt', requiredPattern: 'Keumgang' },
  { id: 'wt-poom-team-f', eventType: 'Team', label: 'Female Team Poomsae - Senior', gender: 'F', ageGroup: '18-35', beltGroup: 'Black Belt', requiredPattern: 'Taebaek' }
];

export const WT_PATTERN_CLASSES = WT_POOMSAE_CLASSES;