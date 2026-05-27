/** Frontend-only mock data for kind Overzicht (Figma node 43:1125). */

export const KIND_OVERVIEW_STATS = {
  trophies: 3,
  stars: 12,
}

export const KIND_DAILY_MISSIONS = [
  {
    id: 'exercise',
    title: 'Voer één oefening uit',
    current: 1,
    total: 1,
    done: true,
    showReward: true,
  },
  {
    id: 'xp',
    title: 'Verdien 150 XP',
    current: 0,
    total: 150,
    done: false,
    showReward: false,
  },
  {
    id: 'all',
    title: 'Voltooi al je dagmissies',
    current: 1,
    total: 3,
    done: false,
    showReward: false,
  },
]

export const KIND_BADGES = [
  { id: 'first', label: 'Eerste oefening', tone: 'blue', unlocked: true, icon: 'star' },
  { id: 'streak5', label: '5 Dagen Streak', tone: 'pink', unlocked: true, icon: 'flame' },
  { id: 'ten', label: '10 Oefeningen', tone: 'green', unlocked: true, icon: 'target' },
  { id: 'week', label: 'Week Kampioen', tone: 'yellow', unlocked: true, icon: 'trophy' },
  { id: 'xp50', label: '50 XP', tone: 'gray', unlocked: false, icon: 'star' },
  { id: 'streak20', label: '20 Dagen Streak', tone: 'gray', unlocked: false, icon: 'flame' },
]

export const KIND_STREAK_DAYS = 20
