// src/hooks/useBadges.js
import { useMemo } from 'react';
import { useCharity } from './useCharity';
import { useLoyaltyPoints } from './useLoyaltyPoints';

/**
 * Hook for managing user achievements/badges system
 * Calculates unlocked badges based on charity donations and other activities
 * @returns {Object} badges - Array of all badges with unlock status
 * @returns {number} unlockedCount - Number of unlocked badges
 * @returns {Object} nextBadge - Next badge to unlock (if any)
 * @returns {number} progressToNext - Progress percentage to next badge (0-100)
 */
export function useBadges() {
  const { totalDonated, donations } = useCharity();
  const { balance } = useLoyaltyPoints();

  const badgesData = useMemo(() => {
    // Define all available badges
    const allBadges = [
      {
        id: 'first_donation',
        title: 'Первое пожертвование',
        description: 'Сделайте первое пожертвование в приют',
        icon: '🥇',
        color: '#FFD700', // Gold
        threshold: 1,
        category: 'charity',
        unlocked: donations.length > 0,
        requirement: 'donation_count',
      },
      {
        id: 'charity_starter',
        title: 'Начинающий благотворитель',
        description: 'Пожертвуйте 500 Paws приютам',
        icon: '🌟',
        color: '#87CEEB', // Sky Blue
        threshold: 500,
        category: 'charity',
        unlocked: totalDonated >= 500,
        requirement: 'total_donated',
      },
      {
        id: 'charity_hero',
        title: 'Благотворитель',
        description: 'Пожертвуйте 1000 Paws приютам',
        icon: '🏆',
        color: '#FF6B6B', // Coral Red
        threshold: 1000,
        category: 'charity',
        unlocked: totalDonated >= 1000,
        requirement: 'total_donated',
      },
      {
        id: 'charity_legend',
        title: 'Легенда благотворительности',
        description: 'Пожертвуйте 5000 Paws приютам',
        icon: '💎',
        color: '#9B59B6', // Purple
        threshold: 5000,
        category: 'charity',
        unlocked: totalDonated >= 5000,
        requirement: 'total_donated',
      },
      {
        id: 'points_collector',
        title: 'Коллекционер баллов',
        description: 'Накопите 1000 Paws',
        icon: '🐾',
        color: '#4ECDC4', // Teal
        threshold: 1000,
        category: 'points',
        unlocked: balance >= 1000,
        requirement: 'current_balance',
      },
      {
        id: 'multiple_shelters',
        title: 'Друг приютов',
        description: 'Помогите 3 разным приютам',
        icon: '🏠',
        color: '#95E1D3', // Mint
        threshold: 3,
        category: 'charity',
        unlocked: false, // TODO: Calculate unique shelters
        requirement: 'unique_shelters',
      },
    ];

    // Sort badges: unlocked first, then by threshold
    const sortedBadges = [...allBadges].sort((a, b) => {
      if (a.unlocked !== b.unlocked) {
        return b.unlocked ? 1 : -1; // Unlocked first
      }
      return a.threshold - b.threshold; // Lower threshold first
    });

    // Count unlocked badges
    const unlockedCount = allBadges.filter(badge => badge.unlocked).length;

    // Find next badge to unlock (lowest threshold among locked badges)
    const lockedBadges = allBadges.filter(badge => !badge.unlocked);
    const nextBadge = lockedBadges.reduce((nearest, current) => {
      if (!nearest) return current;
      return current.threshold < nearest.threshold ? current : nearest;
    }, null);

    // Calculate progress to next badge
    let progressToNext = 0;
    if (nextBadge) {
      if (nextBadge.requirement === 'total_donated') {
        progressToNext = Math.min((totalDonated / nextBadge.threshold) * 100, 100);
      } else if (nextBadge.requirement === 'current_balance') {
        progressToNext = Math.min((balance / nextBadge.threshold) * 100, 100);
      } else if (nextBadge.requirement === 'donation_count') {
        progressToNext = Math.min((donations.length / nextBadge.threshold) * 100, 100);
      }
    }

    return {
      badges: sortedBadges,
      unlockedCount,
      totalBadges: allBadges.length,
      nextBadge,
      progressToNext: Math.round(progressToNext),
    };
  }, [totalDonated, balance, donations]);

  return badgesData;
}
