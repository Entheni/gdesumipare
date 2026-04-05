import { formatDateOnly, parseDateOnly } from './billing.js';

function normalizeNumber(value) {
  return Number(Number(value || 0).toFixed(2));
}

function currentMonthStart(referenceDate = new Date()) {
  return new Date(Date.UTC(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth(), 1));
}

function addMonths(date, months) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('sr-RS', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function monthsUntilTarget(targetDate, referenceDate = new Date()) {
  if (!targetDate) return null;
  const start = currentMonthStart(referenceDate);
  const target = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1));
  const diff = (target.getUTCFullYear() - start.getUTCFullYear()) * 12 + (target.getUTCMonth() - start.getUTCMonth());
  return Math.max(diff + 1, 1);
}

function calculateRecentMonthlyPace(contributions, referenceDate = new Date()) {
  if (!contributions.length) {
    return 0;
  }

  const start = addMonths(currentMonthStart(referenceDate), -5);
  const total = contributions.reduce((sum, contribution) => {
    const contributionDate = parseDateOnly(contribution.contribution_date);
    if (!contributionDate || contributionDate < start) {
      return sum;
    }
    return sum + Number(contribution.amount_rsd || 0);
  }, 0);

  return normalizeNumber(total / 6);
}

export function buildGoalProjection(goal, contributions = [], { referenceDate = new Date() } = {}) {
  const startingAmount = normalizeNumber(goal.starting_amount_rsd);
  const targetAmount = normalizeNumber(goal.target_amount_rsd);
  const savedFromContributions = normalizeNumber(
    contributions.reduce((sum, contribution) => sum + Number(contribution.amount_rsd || 0), 0),
  );
  const savedAmount = normalizeNumber(startingAmount + savedFromContributions);
  const remainingAmount = normalizeNumber(Math.max(targetAmount - savedAmount, 0));
  const progressPercent = targetAmount > 0 ? Number(Math.min((savedAmount / targetAmount) * 100, 100).toFixed(1)) : 0;
  const monthlyCommitment = normalizeNumber(goal.monthly_contribution_goal_rsd);
  const recentPace = calculateRecentMonthlyPace(contributions, referenceDate);
  const monthlyProjection = monthlyCommitment > 0 ? monthlyCommitment : recentPace;
  const targetDate = parseDateOnly(goal.target_date);
  const requiredMonths = monthsUntilTarget(targetDate, referenceDate);
  const requiredMonthly = requiredMonths ? normalizeNumber(remainingAmount / requiredMonths) : 0;

  let projectedCompletionMonth = null;
  let projectedCompletionLabel = null;
  if (remainingAmount === 0) {
    projectedCompletionMonth = formatDateOnly(currentMonthStart(referenceDate));
    projectedCompletionLabel = 'Cilj je vec ostvaren';
  } else if (monthlyProjection > 0) {
    const monthsToGoal = Math.ceil(remainingAmount / monthlyProjection);
    const projectedDate = addMonths(currentMonthStart(referenceDate), Math.max(monthsToGoal - 1, 0));
    projectedCompletionMonth = formatDateOnly(projectedDate);
    projectedCompletionLabel = formatMonthLabel(projectedDate);
  }

  const isOnTrack = !!targetDate && remainingAmount === 0
    ? true
    : !!targetDate && monthlyProjection > 0 && projectedCompletionMonth
      ? parseDateOnly(projectedCompletionMonth) <= new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1))
      : false;

  return {
    id: goal.id,
    name: goal.name,
    note: goal.note || null,
    target_amount_rsd: targetAmount,
    starting_amount_rsd: startingAmount,
    monthly_contribution_goal_rsd: monthlyCommitment,
    target_date: goal.target_date ? formatDateOnly(parseDateOnly(goal.target_date)) : null,
    target_month_label: targetDate ? formatMonthLabel(targetDate) : null,
    saved_amount_rsd: savedAmount,
    saved_from_contributions_rsd: savedFromContributions,
    remaining_amount_rsd: remainingAmount,
    progress_percent: progressPercent,
    monthly_projection_rsd: monthlyProjection,
    recent_monthly_pace_rsd: recentPace,
    required_monthly_rsd: requiredMonthly,
    projected_completion_month: projectedCompletionMonth,
    projected_completion_label: projectedCompletionLabel,
    is_completed: remainingAmount === 0,
    is_on_track: isOnTrack,
    recent_contributions: contributions
      .slice()
      .sort((left, right) => String(right.contribution_date).localeCompare(String(left.contribution_date)))
      .slice(0, 4)
      .map((contribution) => ({
        id: contribution.id,
        amount_rsd: normalizeNumber(contribution.amount_rsd),
        contribution_date: contribution.contribution_date ? formatDateOnly(parseDateOnly(contribution.contribution_date)) : null,
        note: contribution.note || null,
      })),
  };
}

export function buildGoalsSummary(goals = [], contributions = [], { projectedMonthlySavingsRsd = 0, referenceDate = new Date() } = {}) {
  const contributionsByGoal = new Map();
  for (const contribution of contributions) {
    const current = contributionsByGoal.get(contribution.goal_id) || [];
    current.push(contribution);
    contributionsByGoal.set(contribution.goal_id, current);
  }

  const goalSummaries = goals.map((goal) =>
    buildGoalProjection(goal, contributionsByGoal.get(goal.id) || [], { referenceDate }),
  );

  const activeGoals = goalSummaries.filter((goal) => !goal.is_completed);
  const summary = {
    total_target_rsd: normalizeNumber(goalSummaries.reduce((sum, goal) => sum + goal.target_amount_rsd, 0)),
    total_saved_rsd: normalizeNumber(goalSummaries.reduce((sum, goal) => sum + goal.saved_amount_rsd, 0)),
    total_remaining_rsd: normalizeNumber(goalSummaries.reduce((sum, goal) => sum + goal.remaining_amount_rsd, 0)),
    monthly_goal_commitment_rsd: normalizeNumber(
      activeGoals.reduce((sum, goal) => sum + Number(goal.monthly_contribution_goal_rsd || 0), 0),
    ),
    projected_monthly_savings_rsd: normalizeNumber(projectedMonthlySavingsRsd),
    unallocated_monthly_savings_rsd: normalizeNumber(
      Number(projectedMonthlySavingsRsd || 0) -
        activeGoals.reduce((sum, goal) => sum + Number(goal.monthly_contribution_goal_rsd || 0), 0),
    ),
    active_goals_count: activeGoals.length,
    completed_goals_count: goalSummaries.filter((goal) => goal.is_completed).length,
    on_track_goals_count: activeGoals.filter((goal) => goal.is_on_track).length,
  };

  return {
    summary,
    goals: goalSummaries.sort((left, right) => {
      if (left.is_completed !== right.is_completed) {
        return left.is_completed ? 1 : -1;
      }
      if (left.target_date && right.target_date) {
        return left.target_date.localeCompare(right.target_date);
      }
      if (left.target_date) return -1;
      if (right.target_date) return 1;
      return right.progress_percent - left.progress_percent;
    }),
  };
}

