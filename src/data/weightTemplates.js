// BACKEND: replace with fetch('/api/weight-templates') — admin can persist edits via
// PATCH /api/weight-templates/:ruleset   (body: full classes array)

export const ITF_WEIGHT_CLASSES = [
  { id: 'itf-1',  ruleset: 'ITF', ageGroup: 'U8',   gender: 'M', label: 'Mini (-16kg)',         min: 0,  max: 16,  defaultMin: 0,  defaultMax: 16  },
  { id: 'itf-2',  ruleset: 'ITF', ageGroup: 'U8',   gender: 'M', label: 'Mini (16-20kg)',        min: 16, max: 20,  defaultMin: 16, defaultMax: 20  },
  { id: 'itf-3',  ruleset: 'ITF', ageGroup: 'U8',   gender: 'F', label: 'Mini (-16kg)',          min: 0,  max: 16,  defaultMin: 0,  defaultMax: 16  },
  { id: 'itf-4',  ruleset: 'ITF', ageGroup: '9-11', gender: 'M', label: 'Cadet (-22kg)',         min: 0,  max: 22,  defaultMin: 0,  defaultMax: 22  },
  { id: 'itf-5',  ruleset: 'ITF', ageGroup: '9-11', gender: 'M', label: 'Light (27-32kg)',       min: 27, max: 32,  defaultMin: 27, defaultMax: 32  },
  { id: 'itf-6',  ruleset: 'ITF', ageGroup: '9-11', gender: 'F', label: 'Cadet (-20kg)',         min: 0,  max: 20,  defaultMin: 0,  defaultMax: 20  },
  { id: 'itf-7',  ruleset: 'ITF', ageGroup: '12-14',gender: 'M', label: 'Fin (-33kg)',           min: 0,  max: 33,  defaultMin: 0,  defaultMax: 33  },
  { id: 'itf-8',  ruleset: 'ITF', ageGroup: '12-14',gender: 'M', label: 'Light (37-41kg)',       min: 37, max: 41,  defaultMin: 37, defaultMax: 41  },
  { id: 'itf-9',  ruleset: 'ITF', ageGroup: '12-14',gender: 'M', label: 'Middle (45-49kg)',      min: 45, max: 49,  defaultMin: 45, defaultMax: 49  },
  { id: 'itf-10', ruleset: 'ITF', ageGroup: '12-14',gender: 'F', label: 'Light (33-37kg)',       min: 33, max: 37,  defaultMin: 33, defaultMax: 37  },
  { id: 'itf-11', ruleset: 'ITF', ageGroup: '15-17',gender: 'M', label: 'Fin (-45kg)',           min: 0,  max: 45,  defaultMin: 0,  defaultMax: 45  },
  { id: 'itf-12', ruleset: 'ITF', ageGroup: '15-17',gender: 'M', label: 'Middle (55-59kg)',      min: 55, max: 59,  defaultMin: 55, defaultMax: 59  },
  { id: 'itf-13', ruleset: 'ITF', ageGroup: '15-17',gender: 'F', label: 'Fin (-42kg)',           min: 0,  max: 42,  defaultMin: 0,  defaultMax: 42  },
  { id: 'itf-14', ruleset: 'ITF', ageGroup: '18+',  gender: 'M', label: 'Fin (-58kg)',           min: 0,  max: 58,  defaultMin: 0,  defaultMax: 58  },
  { id: 'itf-15', ruleset: 'ITF', ageGroup: '18+',  gender: 'M', label: 'Light (58-63kg)',       min: 58, max: 63,  defaultMin: 58, defaultMax: 63  },
  { id: 'itf-16', ruleset: 'ITF', ageGroup: '18+',  gender: 'M', label: 'Welter (68-74kg)',      min: 68, max: 74,  defaultMin: 68, defaultMax: 74  },
  { id: 'itf-17', ruleset: 'ITF', ageGroup: '18+',  gender: 'M', label: 'Super-Heavy (87+kg)',   min: 87, max: 999, defaultMin: 87, defaultMax: 999 },
  { id: 'itf-18', ruleset: 'ITF', ageGroup: '18+',  gender: 'F', label: 'Fin (-46kg)',           min: 0,  max: 46,  defaultMin: 0,  defaultMax: 46  },
  { id: 'itf-19', ruleset: 'ITF', ageGroup: '18+',  gender: 'F', label: 'Welter (47-53kg)',      min: 47, max: 53,  defaultMin: 47, defaultMax: 53  },
  { id: 'itf-20', ruleset: 'ITF', ageGroup: '18+',  gender: 'F', label: 'Heavy (62+kg)',         min: 62, max: 999, defaultMin: 62, defaultMax: 999 },
]

export const WT_WEIGHT_CLASSES = [
  // Cadet (12–14)
  { id: 'wt-1',  ruleset: 'WT', ageGroup: 'Cadet',  gender: 'M', label: 'Fin (-33kg)',           min: 0,  max: 33,  defaultMin: 0,  defaultMax: 33  },
  { id: 'wt-2',  ruleset: 'WT', ageGroup: 'Cadet',  gender: 'M', label: 'Light (33-41kg)',        min: 33, max: 41,  defaultMin: 33, defaultMax: 41  },
  { id: 'wt-3',  ruleset: 'WT', ageGroup: 'Cadet',  gender: 'M', label: 'Middle (41-49kg)',       min: 41, max: 49,  defaultMin: 41, defaultMax: 49  },
  { id: 'wt-4',  ruleset: 'WT', ageGroup: 'Cadet',  gender: 'M', label: 'Heavy (49+kg)',          min: 49, max: 999, defaultMin: 49, defaultMax: 999 },
  { id: 'wt-5',  ruleset: 'WT', ageGroup: 'Cadet',  gender: 'F', label: 'Fin (-29kg)',            min: 0,  max: 29,  defaultMin: 0,  defaultMax: 29  },
  { id: 'wt-6',  ruleset: 'WT', ageGroup: 'Cadet',  gender: 'F', label: 'Light (29-37kg)',        min: 29, max: 37,  defaultMin: 29, defaultMax: 37  },
  { id: 'wt-7',  ruleset: 'WT', ageGroup: 'Cadet',  gender: 'F', label: 'Middle (37-44kg)',       min: 37, max: 44,  defaultMin: 37, defaultMax: 44  },
  { id: 'wt-8',  ruleset: 'WT', ageGroup: 'Cadet',  gender: 'F', label: 'Heavy (44+kg)',          min: 44, max: 999, defaultMin: 44, defaultMax: 999 },
  // Junior (15–17)
  { id: 'wt-9',  ruleset: 'WT', ageGroup: 'Junior', gender: 'M', label: 'Fin (-45kg)',            min: 0,  max: 45,  defaultMin: 0,  defaultMax: 45  },
  { id: 'wt-10', ruleset: 'WT', ageGroup: 'Junior', gender: 'M', label: 'Light (45-55kg)',        min: 45, max: 55,  defaultMin: 45, defaultMax: 55  },
  { id: 'wt-11', ruleset: 'WT', ageGroup: 'Junior', gender: 'M', label: 'Middle (55-63kg)',       min: 55, max: 63,  defaultMin: 55, defaultMax: 63  },
  { id: 'wt-12', ruleset: 'WT', ageGroup: 'Junior', gender: 'M', label: 'Heavy (63+kg)',          min: 63, max: 999, defaultMin: 63, defaultMax: 999 },
  { id: 'wt-13', ruleset: 'WT', ageGroup: 'Junior', gender: 'F', label: 'Fin (-42kg)',            min: 0,  max: 42,  defaultMin: 0,  defaultMax: 42  },
  { id: 'wt-14', ruleset: 'WT', ageGroup: 'Junior', gender: 'F', label: 'Light (42-49kg)',        min: 42, max: 49,  defaultMin: 42, defaultMax: 49  },
  { id: 'wt-15', ruleset: 'WT', ageGroup: 'Junior', gender: 'F', label: 'Middle (49-57kg)',       min: 49, max: 57,  defaultMin: 49, defaultMax: 57  },
  { id: 'wt-16', ruleset: 'WT', ageGroup: 'Junior', gender: 'F', label: 'Heavy (57+kg)',          min: 57, max: 999, defaultMin: 57, defaultMax: 999 },
  // Senior (18+)
  { id: 'wt-17', ruleset: 'WT', ageGroup: 'Senior', gender: 'M', label: 'Fin (-58kg)',            min: 0,  max: 58,  defaultMin: 0,  defaultMax: 58  },
  { id: 'wt-18', ruleset: 'WT', ageGroup: 'Senior', gender: 'M', label: 'Fly (58-68kg)',          min: 58, max: 68,  defaultMin: 58, defaultMax: 68  },
  { id: 'wt-19', ruleset: 'WT', ageGroup: 'Senior', gender: 'M', label: 'Light (68-80kg)',        min: 68, max: 80,  defaultMin: 68, defaultMax: 80  },
  { id: 'wt-20', ruleset: 'WT', ageGroup: 'Senior', gender: 'M', label: 'Heavy (80+kg)',          min: 80, max: 999, defaultMin: 80, defaultMax: 999 },
  { id: 'wt-21', ruleset: 'WT', ageGroup: 'Senior', gender: 'F', label: 'Fin (-49kg)',            min: 0,  max: 49,  defaultMin: 0,  defaultMax: 49  },
  { id: 'wt-22', ruleset: 'WT', ageGroup: 'Senior', gender: 'F', label: 'Fly (49-57kg)',          min: 49, max: 57,  defaultMin: 49, defaultMax: 57  },
  { id: 'wt-23', ruleset: 'WT', ageGroup: 'Senior', gender: 'F', label: 'Light (57-67kg)',        min: 57, max: 67,  defaultMin: 57, defaultMax: 67  },
  { id: 'wt-24', ruleset: 'WT', ageGroup: 'Senior', gender: 'F', label: 'Heavy (67+kg)',          min: 67, max: 999, defaultMin: 67, defaultMax: 999 },
  // Veteran (45+)
  { id: 'wt-25', ruleset: 'WT', ageGroup: 'Veteran', gender: 'M', label: 'Light (-75kg)',         min: 0,  max: 75,  defaultMin: 0,  defaultMax: 75  },
  { id: 'wt-26', ruleset: 'WT', ageGroup: 'Veteran', gender: 'M', label: 'Heavy (75+kg)',         min: 75, max: 999, defaultMin: 75, defaultMax: 999 },
  { id: 'wt-27', ruleset: 'WT', ageGroup: 'Veteran', gender: 'F', label: 'Light (-65kg)',         min: 0,  max: 65,  defaultMin: 0,  defaultMax: 65  },
  { id: 'wt-28', ruleset: 'WT', ageGroup: 'Veteran', gender: 'F', label: 'Heavy (65+kg)',         min: 65, max: 999, defaultMin: 65, defaultMax: 999 },
]
