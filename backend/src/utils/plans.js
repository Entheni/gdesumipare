export const PLAN_ORDER = ['free', 'plus', 'family'];

export function normalizeSubscriptionTier(value) {
  return PLAN_ORDER.includes(value) ? value : 'free';
}

export function hasPlanAccess(currentTier, requiredTier) {
  return PLAN_ORDER.indexOf(normalizeSubscriptionTier(currentTier)) >= PLAN_ORDER.indexOf(normalizeSubscriptionTier(requiredTier));
}

export function getTierCapabilities(tier) {
  const normalized = normalizeSubscriptionTier(tier);
  return {
    tier: normalized,
    can_use_current_snapshot: true,
    can_use_snapshot_history: hasPlanAccess(normalized, 'plus'),
    can_use_advanced_charts: hasPlanAccess(normalized, 'plus'),
    can_use_exports: hasPlanAccess(normalized, 'plus'),
    can_use_household_features: hasPlanAccess(normalized, 'family'),
    max_savings_goals: normalized === 'free' ? 1 : null,
  };
}
