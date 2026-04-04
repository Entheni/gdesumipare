import test from 'node:test';
import assert from 'node:assert/strict';
import { buildGoalProjection, buildGoalsSummary } from './goals.js';

test('buildGoalProjection calculates progress and projection', () => {
  const goal = {
    id: 1,
    name: 'Učešće za stan',
    target_amount_rsd: 1200000,
    starting_amount_rsd: 200000,
    monthly_contribution_goal_rsd: 50000,
    target_date: '2026-12-01',
  };

  const contributions = [
    { id: 1, amount_rsd: 50000, contribution_date: '2026-03-10' },
    { id: 2, amount_rsd: 50000, contribution_date: '2026-04-10' },
  ];

  const projection = buildGoalProjection(goal, contributions, {
    referenceDate: new Date('2026-04-04T12:00:00Z'),
  });

  assert.equal(projection.saved_amount_rsd, 300000);
  assert.equal(projection.remaining_amount_rsd, 900000);
  assert.equal(projection.progress_percent, 25);
  assert.equal(projection.monthly_projection_rsd, 50000);
  assert.equal(projection.projected_completion_month, '2027-09-01');
});

test('buildGoalsSummary aggregates goal commitments and savings capacity', () => {
  const result = buildGoalsSummary(
    [
      {
        id: 1,
        name: 'Auto',
        target_amount_rsd: 600000,
        starting_amount_rsd: 100000,
        monthly_contribution_goal_rsd: 20000,
        target_date: '2027-06-01',
      },
      {
        id: 2,
        name: 'Fond',
        target_amount_rsd: 300000,
        starting_amount_rsd: 50000,
        monthly_contribution_goal_rsd: 10000,
        target_date: null,
      },
    ],
    [
      { id: 1, goal_id: 1, amount_rsd: 20000, contribution_date: '2026-03-01' },
      { id: 2, goal_id: 2, amount_rsd: 10000, contribution_date: '2026-03-01' },
    ],
    {
      projectedMonthlySavingsRsd: 45000,
      referenceDate: new Date('2026-04-04T12:00:00Z'),
    },
  );

  assert.equal(result.summary.total_target_rsd, 900000);
  assert.equal(result.summary.total_saved_rsd, 180000);
  assert.equal(result.summary.monthly_goal_commitment_rsd, 30000);
  assert.equal(result.summary.unallocated_monthly_savings_rsd, 15000);
  assert.equal(result.summary.active_goals_count, 2);
});
