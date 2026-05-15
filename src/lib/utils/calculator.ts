export type UomType = 'min' | 'max' | 'timeline' | 'zero'

export function calculateProgressScore(
  uomType: UomType,
  targetValue: number | null,
  actualValue: number | null,
  targetDate: string | null,
  actualDate: string | null
): number {
  let score = 0

  switch (uomType) {
    case 'min':
      // score = (actual / target) * 100
      if (targetValue && targetValue !== 0 && actualValue !== null) {
        score = (actualValue / targetValue) * 100
      }
      break
    case 'max':
      // score = (target / actual) * 100
      if (actualValue && actualValue !== 0 && targetValue !== null) {
        score = (targetValue / actualValue) * 100
      }
      break
    case 'timeline':
      // score = actual_date <= target_date ? 100 : 0
      if (targetDate && actualDate) {
        score = new Date(actualDate) <= new Date(targetDate) ? 100 : 0
      }
      break
    case 'zero':
      // score = actual_value === 0 ? 100 : 0
      if (actualValue !== null) {
        score = actualValue === 0 ? 100 : 0
      }
      break
  }

  // Cap score at 100% and ensure it's not negative
  return Math.min(Math.max(score, 0), 100)
}

export function getCurrentQuarter(): string {
  const month = new Date().getMonth() + 1 // 1-12
  if (month >= 7 && month <= 9) return 'Q1'
  if (month >= 10 && month <= 12) return 'Q2'
  if (month === 1) return 'Q3'
  if (month >= 3 && month <= 4) return 'Q4'
  return 'Q1' // Default/Fallback
}

export function isQuarterlyWindowActive(quarter: string): boolean {
  const now = new Date()
  const month = now.getMonth() + 1
  
  // Q1: July | Q2: October | Q3: January | Q4: March–April
  switch (quarter) {
    case 'Q1': return month === 7
    case 'Q2': return month === 10
    case 'Q3': return month === 1
    case 'Q4': return month === 3 || month === 4
    default: return false
  }
}
