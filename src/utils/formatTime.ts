/**
 * Time formatting utilities - Convert 24-hour format to 12-hour format with AM/PM
 */

/**
 * Convert 24-hour time format (HH:MM) to 12-hour format with AM/PM
 * @param time - Time string in HH:MM or HH:MM:SS format
 * @returns Time string in 12-hour format with AM/PM (e.g., "02:30 PM")
 */
export const formatTime12Hour = (time: string): string => {
  if (!time) return ''
  
  // Handle both HH:MM and HH:MM:SS formats
  const parts = time.split(':')
  const hours = parseInt(parts[0])
  const minutes = parts[1]
  
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  
  return `${String(displayHour).padStart(2, '0')}:${minutes} ${period}`
}

/**
 * Convert 24-hour time format to 12-hour format with Arabic suffix (صباحاً/مساءً)
 * @param time - Time string in HH:MM or HH:MM:SS format
 * @returns Time string in 12-hour format with Arabic suffix (e.g., "02:30 مساءً")
 */
export const formatTime12HourArabic = (time: string): string => {
  if (!time) return ''
  
  // Handle both HH:MM and HH:MM:SS formats
  const parts = time.split(':')
  const hours = parseInt(parts[0])
  const minutes = parts[1]
  
  const period = hours >= 12 ? 'مساءً' : 'صباحاً'
  const displayHour = hours % 12 || 12
  
  return `${String(displayHour).padStart(2, '0')}:${minutes} ${period}`
}

/**
 * Convert time to display format based on language
 * @param time - Time string in HH:MM or HH:MM:SS format
 * @param lang - Language code ('ar' for Arabic, 'en' for English)
 * @returns Formatted time string
 */
export const formatTimeByLanguage = (time: string, lang: 'ar' | 'en' = 'en'): string => {
  return lang === 'ar' ? formatTime12HourArabic(time) : formatTime12Hour(time)
}
