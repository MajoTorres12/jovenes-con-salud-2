// Utility to calculate health tracking streaks dynamically in Mexico Central Timezone (America/Monterrey)

function getMexicoDateString(date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Monterrey' }) // 'YYYY-MM-DD'
}

function getMexicoMonthString(date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit' }) // 'YYYY-MM'
}

function getMexicoMondayString(date) {
  const d = new Date(date)
  // Format to Mexico parts to extract year, month, day accurately
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Monterrey',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  })
  const parts = formatter.formatToParts(d)
  const p = {}
  parts.forEach(part => p[part.type] = part.value)
  
  // Create a local Date object in server timezone using Mexico date parts to calculate Monday
  const tzDate = new Date(Number(p.year), Number(p.month) - 1, Number(p.day), 12, 0, 0)
  
  const day = tzDate.getDay() // 0 = Sunday, 1 = Monday, ...
  const diff = tzDate.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(tzDate.setDate(diff))
  
  return monday.toLocaleDateString('en-CA') // YYYY-MM-DD
}

export function calculateStreaks(records) {
  if (!records || records.length === 0) {
    return {
      daily: { current: 0, max: 0 },
      weekly: { current: 0, max: 0 },
      monthly: { current: 0, max: 0 },
      yearly: { current: 0, max: 0 },
      currentWeekDays: [false, false, false, false, false, false, false]
    }
  }

  // Filter out any record with invalid dates and get unique date strings sorted descending
  const uniqueDates = Array.from(
    new Set(
      records
        .filter(r => r.recordedAt)
        .map(r => getMexicoDateString(r.recordedAt))
    )
  ).sort().reverse() // [today/latest, yesterday, ...]

  if (uniqueDates.length === 0) {
    return {
      daily: { current: 0, max: 0 },
      weekly: { current: 0, max: 0 },
      monthly: { current: 0, max: 0 },
      yearly: { current: 0, max: 0 },
      currentWeekDays: [false, false, false, false, false, false, false]
    }
  }

  const todayStr = getMexicoDateString(new Date())
  const yesterdayStr = getMexicoDateString(new Date(Date.now() - 86400000))

  // 1. Daily Streak Current
  let dailyCurrent = 0
  const isStreakActive = uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)

  if (isStreakActive) {
    const expectedDate = new Date()
    if (!uniqueDates.includes(todayStr)) {
      expectedDate.setDate(expectedDate.getDate() - 1)
    }
    while (true) {
      const expStr = getMexicoDateString(expectedDate)
      if (uniqueDates.includes(expStr)) {
        dailyCurrent++
        expectedDate.setDate(expectedDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  // Daily Streak Max
  let dailyMax = 0
  let tempDaily = 0
  let prevDate = null
  for (const dateStr of uniqueDates.slice().reverse()) {
    const currDate = new Date(dateStr + 'T12:00:00')
    if (!prevDate) {
      tempDaily = 1
    } else {
      const diffTime = Math.abs(currDate - prevDate)
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
      if (diffDays === 1) {
        tempDaily++
      } else if (diffDays > 1) {
        tempDaily = 1
      }
    }
    if (tempDaily > dailyMax) dailyMax = tempDaily
    prevDate = currDate
  }
  if (dailyCurrent > dailyMax) dailyMax = dailyCurrent

  // 2. Weekly Streak Current
  const uniqueWeeks = Array.from(
    new Set(records.filter(r => r.recordedAt).map(r => getMexicoMondayString(r.recordedAt)))
  ).sort().reverse()

  const currentWeekStr = getMexicoMondayString(new Date())
  const lastWeekStr = getMexicoMondayString(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))

  let weeklyCurrent = 0
  const isWeeklyActive = uniqueWeeks.includes(currentWeekStr) || uniqueWeeks.includes(lastWeekStr)

  if (isWeeklyActive) {
    const expectedWeek = new Date()
    if (!uniqueWeeks.includes(currentWeekStr)) {
      expectedWeek.setDate(expectedWeek.getDate() - 7)
    }
    while (true) {
      const expStr = getMexicoMondayString(expectedWeek)
      if (uniqueWeeks.includes(expStr)) {
        weeklyCurrent++
        expectedWeek.setDate(expectedWeek.getDate() - 7)
      } else {
        break
      }
    }
  }

  // Weekly Streak Max
  let weeklyMax = 0
  let tempWeekly = 0
  let prevWeekDate = null
  for (const weekStr of uniqueWeeks.slice().reverse()) {
    const currWeekDate = new Date(weekStr + 'T12:00:00')
    if (!prevWeekDate) {
      tempWeekly = 1
    } else {
      const diffTime = Math.abs(currWeekDate - prevWeekDate)
      const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7))
      if (diffWeeks === 1) {
        tempWeekly++
      } else if (diffWeeks > 1) {
        tempWeekly = 1
      }
    }
    if (tempWeekly > weeklyMax) weeklyMax = tempWeekly
    prevWeekDate = currWeekDate
  }
  if (weeklyCurrent > weeklyMax) weeklyMax = weeklyCurrent

  // 3. Monthly Streak Current
  const uniqueMonths = Array.from(
    new Set(records.filter(r => r.recordedAt).map(r => getMexicoMonthString(r.recordedAt)))
  ).sort().reverse()

  const currentMonthStr = getMexicoMonthString(new Date())
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  const lastMonthStr = getMexicoMonthString(lastMonth)

  let monthlyCurrent = 0
  const isMonthlyActive = uniqueMonths.includes(currentMonthStr) || uniqueMonths.includes(lastMonthStr)

  if (isMonthlyActive) {
    const expectedMonth = new Date()
    if (!uniqueMonths.includes(currentMonthStr)) {
      expectedMonth.setMonth(expectedMonth.getMonth() - 1)
    }
    while (true) {
      const expStr = getMexicoMonthString(expectedMonth)
      if (uniqueMonths.includes(expStr)) {
        monthlyCurrent++
        expectedMonth.setMonth(expectedMonth.getMonth() - 1)
      } else {
        break
      }
    }
  }

  // Monthly Streak Max
  let monthlyMax = 0
  let tempMonthly = 0
  let prevMonthDate = null
  for (const monthStr of uniqueMonths.slice().reverse()) {
    const [year, month] = monthStr.split('-').map(Number)
    if (!prevMonthDate) {
      tempMonthly = 1
    } else {
      const diffYears = year - prevMonthDate.getFullYear()
      const diffMonths = (month - 1) - prevMonthDate.getMonth() + (diffYears * 12)
      if (diffMonths === 1) {
        tempMonthly++
      } else if (diffMonths > 1) {
        tempMonthly = 1
      }
    }
    if (tempMonthly > monthlyMax) monthlyMax = tempMonthly
    prevMonthDate = new Date(year, month - 1, 15)
  }
  if (monthlyCurrent > monthlyMax) monthlyMax = monthlyCurrent

  // 4. Yearly Streak Current
  const uniqueYears = Array.from(
    new Set(records.filter(r => r.recordedAt).map(r => new Date(r.recordedAt).getFullYear()))
  ).sort().reverse()

  const currentYear = new Date().getFullYear()
  const lastYear = currentYear - 1

  let yearlyCurrent = 0
  const isYearlyActive = uniqueYears.includes(currentYear) || uniqueYears.includes(lastYear)

  if (isYearlyActive) {
    let expectedYear = uniqueYears.includes(currentYear) ? currentYear : lastYear
    while (true) {
      if (uniqueYears.includes(expectedYear)) {
        yearlyCurrent++
        expectedYear--
      } else {
        break
      }
    }
  }

  // Yearly Streak Max
  let yearlyMax = 0
  let tempYearly = 0
  let prevYear = null
  for (const year of uniqueYears.slice().reverse()) {
    if (!prevYear) {
      tempYearly = 1
    } else {
      if (year === prevYear + 1) {
        tempYearly++
      } else {
        tempYearly = 1
      }
    }
    if (tempYearly > yearlyMax) yearlyMax = tempYearly
    prevYear = year
  }
  if (yearlyCurrent > yearlyMax) yearlyMax = yearlyCurrent

  // 5. Current Week Days representation (Lunes a Domingo)
  const currentWeekDays = [false, false, false, false, false, false, false]
  const now = new Date()
  const currentDayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday, ...
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
  const mondayDate = new Date(now)
  mondayDate.setDate(now.getDate() + mondayOffset)

  for (let i = 0; i < 7; i++) {
    const day = new Date(mondayDate)
    day.setDate(mondayDate.getDate() + i)
    const dayStr = getMexicoDateString(day)
    if (uniqueDates.includes(dayStr)) {
      currentWeekDays[i] = true
    }
  }

  return {
    daily: { current: dailyCurrent, max: dailyMax },
    weekly: { current: weeklyCurrent, max: weeklyMax },
    monthly: { current: monthlyCurrent, max: monthlyMax },
    yearly: { current: yearlyCurrent, max: yearlyMax },
    currentWeekDays
  }
}
