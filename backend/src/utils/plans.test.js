import test from 'node:test';
import assert from 'node:assert/strict';
import { getTierCapabilities, hasPlanAccess, normalizeSubscriptionTier } from './plans.js';

test('normalizeSubscriptionTier falls back to free', () => {
  assert.equal(normalizeSubscriptionTier('free'), 'free');
  assert.equal(normalizeSubscriptionTier('plus'), 'plus');
  assert.equal(normalizeSubscriptionTier('family'), 'family');
  assert.equal(normalizeSubscriptionTier('unknown'), 'free');
  assert.equal(normalizeSubscriptionTier(null), 'free');
});

test('hasPlanAccess respects plan hierarchy', () => {
  assert.equal(hasPlanAccess('free', 'free'), true);
  assert.equal(hasPlanAccess('plus', 'free'), true);
  assert.equal(hasPlanAccess('family', 'plus'), true);
  assert.equal(hasPlanAccess('free', 'plus'), false);
});

test('getTierCapabilities exposes correct feature flags', () => {
  assert.deepEqual(getTierCapabilities('free'), {
    tier: 'free',
    can_use_current_snapshot: true,
    can_use_snapshot_history: false,
    can_use_advanced_charts: false,
    can_use_exports: false,
    can_use_household_features: false,
  });

  assert.deepEqual(getTierCapabilities('plus'), {
    tier: 'plus',
    can_use_current_snapshot: true,
    can_use_snapshot_history: true,
    can_use_advanced_charts: true,
    can_use_exports: true,
    can_use_household_features: false,
  });

  assert.deepEqual(getTierCapabilities('family'), {
    tier: 'family',
    can_use_current_snapshot: true,
    can_use_snapshot_history: true,
    can_use_advanced_charts: true,
    can_use_exports: true,
    can_use_household_features: true,
  });
});
