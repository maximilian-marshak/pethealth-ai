// utils/activityHelpers.js

/**
 * Форматирование даты на английском
 */
export const formatEnglishDate = (date) => {
    const today = new Date();
    const compareDate = new Date(date);
    
    today.setHours(0, 0, 0, 0);
    compareDate.setHours(0, 0, 0, 0);
    
    const diffTime = today - compareDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    
    const options = { month: 'short', day: 'numeric' };
    return compareDate.toLocaleDateString('en-US', options);
  };
  
  /**
   * Расчёт текущего streak (серии дней подряд)
   */
  export const calculateStreak = (activities) => {
    if (!activities || activities.length === 0) return 0;
  
    // Сортируем по дате (новые первыми)
    const sorted = [...activities].sort((a, b) => 
      new Date(b.activity_date) - new Date(a.activity_date)
    );
  
    // Получаем уникальные даты (один день = одна активность для streak)
    const uniqueDates = [...new Set(sorted.map(a => a.activity_date))];
  
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
  
    for (let i = 0; i < uniqueDates.length; i++) {
      const activityDate = new Date(uniqueDates[i]);
      activityDate.setHours(0, 0, 0, 0);
  
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);
  
      if (activityDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break; // Прерываем серию
      }
    }
  
    return streak;
  };
  
  /**
   * Получение бейджа по количеству дней streak
   */
  export const getStreakBadge = (streak) => {
    if (streak >= 30) return { emoji: '🏆', title: 'Champion' };
    if (streak >= 14) return { emoji: '🔥', title: 'On Fire' };
    if (streak >= 7) return { emoji: '⚡', title: 'Great' };
    if (streak >= 3) return { emoji: '✨', title: 'Good' };
    return { emoji: '🌟', title: 'Start' };
  };
  
  /**
   * Статистика за последние 7 дней
   */
  export const getWeeklyStats = (activities) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);
  
    const weeklyActivities = activities.filter(activity => {
      const activityDate = new Date(activity.activity_date);
      return activityDate >= sevenDaysAgo;
    });
  
    const totalCount = weeklyActivities.length;
    const totalDuration = weeklyActivities.reduce((sum, a) => sum + (a.duration || 0), 0);
    const totalDistance = weeklyActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
  
    return {
      count: totalCount,
      duration: totalDuration,
      distance: totalDistance.toFixed(1)
    };
  };
  
  /**
   * Данные активности по дням недели (последние 7 дней)
   */
  export const getDailyActivityData = (activities) => {
    const days = [];
    const today = new Date();
  
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
  
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  
      const hasActivity = activities.some(activity => 
        activity.activity_date === dateString
      );
  
      days.push({
        date: dateString,
        dayName,
        hasActivity,
        isToday: i === 0
      });
    }
  
    return days;
  };  