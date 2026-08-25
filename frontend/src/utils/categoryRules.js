/**
 * ROAR Championship — Category derivation rules
 * Auto-derives age category, belt group, pattern format, and weight class
 * from competitor attributes.
 */

const EVENT_YEAR = 2026

/** Derive age from date of birth (uses event year) */
export function deriveAge(dob) {
  if (!dob) return null
  const birthYear = new Date(dob).getFullYear()
  return EVENT_YEAR - birthYear
}

/** Map age to age category string */
export function deriveAgeCategory(age) {
  if (age === null || age === undefined) return null
  if (age < 8) return 'U8'
  if (age <= 11) return '9-11'
  if (age <= 14) return '12-14'
  if (age <= 17) return '15-17'
  return '18+'
}

/**
 * Derive belt group from belt grade string.
 * Grade format: '10G', '9G', ... '1G' (colour belt), '1D', '2D', ... '6D' (dan)
 */
export function deriveBeltGroup(beltGrade) {
  if (!beltGrade) return null
  const grade = beltGrade.toUpperCase().trim()
  if (grade.endsWith('D')) {
    const dan = parseInt(grade)
    if (dan >= 4) return 'BB-senior' // 4th-6th Dan
    return 'BB' // 1st-3rd Dan
  }
  if (grade.endsWith('G')) {
    const g = parseInt(grade)
    if (g >= 5) return 'CB' // 8G-5G colour belt
    return 'CB-low' // 4G-1G
  }
  return null
}

/** Pattern format: Carnival if age < 12, Standard otherwise */
export function derivePatternFormat(age) {
  if (age === null || age === undefined) return null
  return age < 12 ? 'Carnival' : 'Standard'
}

/**
 * ITF Sparring weight classes by age category + gender + weight (kg)
 * Returns the weight class label or null if not determinable.
 */
export function deriveSparringWeightClass(ageCategory, gender, weightKg) {
  if (!ageCategory || !gender || weightKg == null) return null
  const w = Number(weightKg)
  if (isNaN(w)) return null
  const g = gender.toUpperCase()

  switch (ageCategory) {
    case 'U8':
      if (w < 16) return 'Mini (-16kg)'
      if (w < 20) return 'Mini (16-20kg)'
      return 'Cadet (20+kg)'

    case '9-11':
      if (g === 'F') {
        if (w < 20) return 'Cadet (-20kg)'
        if (w < 25) return 'Cadet (20-25kg)'
        if (w < 30) return 'Light (25-30kg)'
        return 'Heavy (30+kg)'
      }
      // Male
      if (w < 22) return 'Cadet (-22kg)'
      if (w < 27) return 'Cadet (22-27kg)'
      if (w < 32) return 'Light (27-32kg)'
      return 'Heavy (32+kg)'

    case '12-14':
      if (g === 'F') {
        if (w < 30) return 'Fin (-30kg)'
        if (w < 33) return 'Fin (30-33kg)'
        if (w < 37) return 'Light (33-37kg)'
        if (w < 41) return 'Welter (37-41kg)'
        if (w < 44) return 'Light (40-44kg)'
        return 'Heavy (44+kg)'
      }
      // Male
      if (w < 33) return 'Fin (-33kg)'
      if (w < 37) return 'Fin (33-37kg)'
      if (w < 41) return 'Light (37-41kg)'
      if (w < 45) return 'Welter (41-45kg)'
      if (w < 49) return 'Middle (45-49kg)'
      return 'Heavy (49+kg)'

    case '15-17':
      if (g === 'F') {
        if (w < 42) return 'Fin (-42kg)'
        if (w < 46) return 'Fin (42-46kg)'
        if (w < 49) return 'Light (46-49kg)'
        if (w < 53) return 'Welter (49-53kg)'
        if (w < 57) return 'Middle (53-57kg)'
        return 'Heavy (57+kg)'
      }
      // Male
      if (w < 45) return 'Fin (-45kg)'
      if (w < 48) return 'Fin (45-48kg)'
      if (w < 51) return 'Light (48-51kg)'
      if (w < 55) return 'Welter (51-55kg)'
      if (w < 59) return 'Middle (55-59kg)'
      if (w < 63) return 'Light-heavy (59-63kg)'
      return 'Heavy (63+kg)'

    case '18+':
      if (g === 'F') {
        if (w < 46) return 'Fin (-46kg)'
        if (w < 49) return 'Fin (46-49kg)'
        if (w < 53) return 'Welter (47-53kg)'
        if (w < 57) return 'Middle (53-57kg)'
        if (w < 62) return 'Middle (57-62kg)'
        return 'Heavy (62+kg)'
      }
      // Male
      if (w < 58) return 'Fin (-58kg)'
      if (w < 63) return 'Light (58-63kg)'
      if (w < 68) return 'Welter (63-68kg)'
      if (w < 74) return 'Welter (68-74kg)'
      if (w < 80) return 'Middle (74-80kg)'
      if (w < 87) return 'Heavy (80-87kg)'
      return 'Super-Heavy (87+kg)'

    default:
      return null
  }
}

/**
 * Full derive: given form values, return all derived fields.
 * Returns: { age, ageCategory, beltGroup, patternFormat, weightClass }
 */
export function deriveAll({ dob, beltGrade, gender, weightKg }) {
  const age = deriveAge(dob)
  const ageCategory = deriveAgeCategory(age)
  const beltGroup = deriveBeltGroup(beltGrade)
  const patternFormat = derivePatternFormat(age)
  const weightClass = deriveSparringWeightClass(ageCategory, gender, weightKg)
  return { age, ageCategory, beltGroup, patternFormat, weightClass }
}
