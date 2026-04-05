<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <section class="surface-card p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-[0.16em] muted">Ciljevi stednje</p>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight">Pretvori visak u konkretan plan</h1>
          <p class="muted mt-2">
            Ako stedis za auto, stan ili fond sigurnosti, ovde vidis koliko si daleko, koliko mesecno odvajas i kada cilj realno stize.
          </p>
        </div>
        <router-link to="/snapshot" class="btn-secondary">Vezi sa snapshot-om</router-link>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="surface-card p-5">
        <div class="muted text-sm">Ukupno sacuvano</div>
        <div class="mt-3 text-2xl font-semibold text-positive">{{ formatCurrency(summary.total_saved_rsd) }}</div>
      </article>
      <article class="surface-card p-5">
        <div class="muted text-sm">Ukupan cilj</div>
        <div class="mt-3 text-2xl font-semibold">{{ formatCurrency(summary.total_target_rsd) }}</div>
      </article>
      <article class="surface-card p-5">
        <div class="muted text-sm">Mesecno planirano</div>
        <div class="mt-3 text-2xl font-semibold text-accent">{{ formatCurrency(summary.monthly_goal_commitment_rsd) }}</div>
      </article>
      <article class="surface-card p-5">
        <div class="muted text-sm">Slobodno za raspodelu</div>
        <div class="mt-3 text-2xl font-semibold" :class="summary.unallocated_monthly_savings_rsd >= 0 ? 'text-positive' : 'text-negative'">
          {{ formatCurrency(summary.unallocated_monthly_savings_rsd) }}
        </div>
      </article>
    </section>

    <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <section class="surface-card p-6 space-y-6">
        <div>
          <h2 class="text-xl font-semibold">Dodaj cilj</h2>
          <p class="muted text-sm mt-1">Svaki cilj dobija svoju metu, tempo stednje i projekciju zavrsetka.</p>
        </div>

        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submitGoal">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Naziv cilja</label>
            <input v-model="goalForm.name" class="field" placeholder="Na primer: Ucesce za stan" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Ciljani iznos</label>
            <input v-model.number="goalForm.target_amount_rsd" type="number" min="1" step="0.01" class="field" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Vec sacuvano</label>
            <input v-model.number="goalForm.starting_amount_rsd" type="number" min="0" step="0.01" class="field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Plan mesecne uplate</label>
            <input v-model.number="goalForm.monthly_contribution_goal_rsd" type="number" min="0" step="0.01" class="field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Ciljani datum</label>
            <input v-model="goalForm.target_date" type="date" class="field" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Napomena</label>
            <textarea v-model="goalForm.note" rows="3" class="field" placeholder="Zasto ti je ovaj cilj vazan ili kako ga punis."></textarea>
          </div>
          <div class="md:col-span-2 flex flex-wrap items-center gap-3">
            <button :disabled="savingGoal" class="btn-primary">{{ savingGoal ? 'Cuvanje...' : 'Dodaj cilj' }}</button>
            <p v-if="goalError" class="message-danger">{{ goalError }}</p>
          </div>
        </form>

        <div class="panel-soft p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 class="font-semibold">Simulator tempa</h3>
              <p class="muted text-sm mt-1">Pogledaj koliko brze stizes do cilja ako promenis mesecnu uplatu ili ubacis jednokratni dodatak.</p>
            </div>
            <select v-model="simulator.goalId" class="field max-w-[260px]">
              <option value="">Izaberi cilj</option>
              <option v-for="goal in activeGoals" :key="goal.id" :value="String(goal.id)">{{ goal.name }}</option>
            </select>
          </div>

          <div v-if="selectedGoal" class="grid gap-4 mt-5 md:grid-cols-2">
            <div>
              <label class="block text-sm font-medium mb-2">Nova mesecna uplata</label>
              <input v-model.number="simulator.monthlyContribution" type="number" min="0" step="0.01" class="field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Jednokratni dodatak</label>
              <input v-model.number="simulator.oneTimeBoost" type="number" min="0" step="0.01" class="field" />
            </div>

            <div class="md:col-span-2 grid gap-3 md:grid-cols-3">
              <div class="panel-soft p-4">
                <div class="muted text-sm">Ocekivani zavrsetak</div>
                <div class="mt-2 font-semibold">{{ simulatorResult.projectedLabel }}</div>
              </div>
              <div class="panel-soft p-4">
                <div class="muted text-sm">Napredak posle dodatka</div>
                <div class="mt-2 font-semibold">{{ simulatorResult.progressPercent }}%</div>
              </div>
              <div class="panel-soft p-4">
                <div class="muted text-sm">Status prema planu</div>
                <div class="mt-2 font-semibold" :class="simulatorResult.onTrack ? 'text-positive' : 'text-negative'">
                  {{ simulatorResult.onTrack ? 'U planu' : 'Kasni za planom' }}
                </div>
              </div>
            </div>

            <div class="md:col-span-2 text-sm muted">
              {{ simulatorResult.summary }}
            </div>
          </div>
          <p v-else class="muted text-sm mt-4">Izaberi cilj da simuliras novi tempo stednje.</p>
        </div>
      </section>

      <section class="surface-card p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">Aktivni ciljevi</h2>
            <p class="muted text-sm mt-1">Detalji i uplate su iza pojedinacnih kartica da ekran ostane cist.</p>
          </div>
          <div class="text-sm muted">Aktivnih: <strong class="text-[color:var(--text)]">{{ summary.active_goals_count }}</strong></div>
        </div>

        <div v-if="loading" class="muted mt-5">Ucitavanje ciljeva...</div>
        <div v-else-if="error" class="message-danger mt-5">{{ error }}</div>
        <div v-else-if="!goals.length" class="panel-soft p-5 mt-5">
          <div class="font-medium">Jos nema ciljeva</div>
          <p class="muted text-sm mt-2">Dodaj prvi cilj i pretvori projekciju ustede u konkretan plan.</p>
        </div>
        <div v-else class="mt-5 space-y-4">
          <article v-for="goal in goals" :key="goal.id" class="panel-soft p-5 space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-lg font-semibold">{{ goal.name }}</h3>
                  <span class="status-pill" :class="goalStatusClass(goal)">{{ goalStatusLabel(goal) }}</span>
                </div>
                <p v-if="goal.note" class="muted text-sm mt-2">{{ goal.note }}</p>
              </div>
              <button class="btn-ghost text-negative" @click="removeGoal(goal)">Obrisi</button>
            </div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <div class="muted text-xs uppercase tracking-[0.14em]">Sacuvano</div>
                <div class="mt-2 font-semibold text-positive">{{ formatCurrency(goal.saved_amount_rsd) }}</div>
              </div>
              <div>
                <div class="muted text-xs uppercase tracking-[0.14em]">Preostalo</div>
                <div class="mt-2 font-semibold">{{ formatCurrency(goal.remaining_amount_rsd) }}</div>
              </div>
              <div>
                <div class="muted text-xs uppercase tracking-[0.14em]">Plan mesecno</div>
                <div class="mt-2 font-semibold text-accent">{{ formatCurrency(goal.monthly_contribution_goal_rsd) }}</div>
              </div>
              <div>
                <div class="muted text-xs uppercase tracking-[0.14em]">Forecast</div>
                <div class="mt-2 font-semibold">{{ goal.projected_completion_label || 'Nije procenjeno' }}</div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="muted">Napredak</span>
                <span class="font-medium">{{ goal.progress_percent.toFixed(1) }}%</span>
              </div>
              <div class="progress-track mt-2">
                <div class="progress-fill" :style="{ width: `${Math.min(goal.progress_percent, 100)}%` }"></div>
              </div>
            </div>

            <div class="grid gap-3 md:grid-cols-3 text-sm">
              <div>
                <div class="muted">Cilj</div>
                <div class="mt-1 font-medium">{{ formatCurrency(goal.target_amount_rsd) }}</div>
              </div>
              <div>
                <div class="muted">Potrebno mesecno</div>
                <div class="mt-1 font-medium">{{ goal.required_monthly_rsd ? formatCurrency(goal.required_monthly_rsd) : 'Nije zadato' }}</div>
              </div>
              <div>
                <div class="muted">Ciljani mesec</div>
                <div class="mt-1 font-medium">{{ goal.target_month_label || 'Bez roka' }}</div>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button class="btn-secondary" @click="toggleGoalDetails(goal.id)">
                {{ expandedGoalId === goal.id ? 'Sakrij detalje' : 'Prikazi uplate' }}
              </button>
              <span v-if="goal.projected_completion_label && goal.target_month_label" class="muted text-sm">
                {{ goal.is_on_track ? 'Trenutni tempo je u planu.' : 'Trenutni tempo kasni za planom.' }}
              </span>
            </div>

            <div v-if="expandedGoalId === goal.id" class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <form class="panel-soft p-4" @submit.prevent="submitContribution(goal)">
                <h4 class="font-semibold">Nova uplata ka cilju</h4>
                <div class="grid gap-3 mt-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">Iznos</label>
                    <input v-model.number="contributionDraft(goal.id).amount_rsd" type="number" min="0.01" step="0.01" class="field" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">Datum</label>
                    <input v-model="contributionDraft(goal.id).contribution_date" type="date" class="field" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-2">Napomena</label>
                    <input v-model="contributionDraft(goal.id).note" class="field" placeholder="Na primer: deo plate ili bonus." />
                  </div>
                  <div class="flex flex-wrap items-center gap-3">
                    <button :disabled="savingContributionId === goal.id" class="btn-primary">
                      {{ savingContributionId === goal.id ? 'Cuvanje...' : 'Evidentiraj uplatu' }}
                    </button>
                    <p v-if="contributionErrorId === goal.id && contributionError" class="message-danger">{{ contributionError }}</p>
                  </div>
                </div>
              </form>

              <div class="panel-soft p-4">
                <h4 class="font-semibold">Poslednje uplate</h4>
                <ul class="mt-4 space-y-3">
                  <li v-for="contribution in goal.recent_contributions" :key="contribution.id" class="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div class="font-medium">{{ formatCurrency(contribution.amount_rsd) }}</div>
                      <div class="muted text-sm mt-1">{{ formatDate(contribution.contribution_date) }}</div>
                      <div v-if="contribution.note" class="muted text-xs mt-1">{{ contribution.note }}</div>
                    </div>
                    <button class="btn-ghost text-negative" @click="removeContribution(contribution)">Obrisi</button>
                  </li>
                  <li v-if="!goal.recent_contributions.length" class="muted text-sm">Jos nema evidentiranih uplata.</li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import api from '../api/client.js';

const loading = ref(false);
const savingGoal = ref(false);
const savingContributionId = ref(null);
const expandedGoalId = ref(null);
const error = ref('');
const goalError = ref('');
const contributionError = ref('');
const contributionErrorId = ref(null);
const goals = ref([]);
const capabilities = reactive({
  tier: 'free',
  max_savings_goals: null,
});
const contributionForms = reactive({});
const summary = reactive({
  total_target_rsd: 0,
  total_saved_rsd: 0,
  total_remaining_rsd: 0,
  monthly_goal_commitment_rsd: 0,
  projected_monthly_savings_rsd: 0,
  unallocated_monthly_savings_rsd: 0,
  active_goals_count: 0,
  completed_goals_count: 0,
  on_track_goals_count: 0,
});
const goalForm = reactive({
  name: '',
  target_amount_rsd: '',
  starting_amount_rsd: 0,
  monthly_contribution_goal_rsd: '',
  target_date: '',
  note: '',
});
const simulator = reactive({
  goalId: '',
  monthlyContribution: 0,
  oneTimeBoost: 0,
});

const activeGoals = computed(() => goals.value.filter((goal) => !goal.is_completed));
const selectedGoal = computed(() => activeGoals.value.find((goal) => String(goal.id) === simulator.goalId) || null);
const simulatorResult = computed(() => {
  if (!selectedGoal.value) {
    return {
      projectedLabel: 'Nema simulacije',
      progressPercent: '0.0',
      onTrack: false,
      summary: 'Izaberi cilj da simuliras novi tempo stednje.',
    };
  }

  const goal = selectedGoal.value;
  const boost = Number(simulator.oneTimeBoost || 0);
  const monthly = Number(simulator.monthlyContribution || goal.monthly_contribution_goal_rsd || goal.monthly_projection_rsd || 0);
  const saved = Number(goal.saved_amount_rsd || 0) + boost;
  const remaining = Math.max(Number(goal.target_amount_rsd || 0) - saved, 0);
  const progress = goal.target_amount_rsd > 0 ? Math.min((saved / goal.target_amount_rsd) * 100, 100) : 0;

  let projectedLabel = 'Bez procene';
  if (remaining === 0) {
    projectedLabel = 'Cilj bi bio odmah zavrsen';
  } else if (monthly > 0) {
    const monthsToGoal = Math.ceil(remaining / monthly);
    const base = new Date();
    const projectedDate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + Math.max(monthsToGoal - 1, 0), 1));
    projectedLabel = new Intl.DateTimeFormat('sr-RS', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(projectedDate);
  }

  let onTrack = false;
  if (!goal.target_date) {
    onTrack = monthly > 0 || remaining === 0;
  } else if (remaining === 0) {
    onTrack = true;
  } else if (monthly > 0) {
    const base = new Date();
    const monthsToGoal = Math.ceil(remaining / monthly);
    const projectedDate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + Math.max(monthsToGoal - 1, 0), 1));
    const targetDate = new Date(`${goal.target_date}T00:00:00Z`);
    onTrack = projectedDate <= new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), 1));
  }

  return {
    projectedLabel,
    progressPercent: progress.toFixed(1),
    onTrack,
    summary:
      remaining === 0
        ? 'Jednokratni dodatak vec zatvara cilj.'
        : monthly > 0
          ? `Ako od sada odvajas ${formatCurrency(monthly)} mesecno, cilj bi stigao oko ${projectedLabel}.`
          : 'Bez mesecnog tempa nema pouzdane procene.',
  };
});

function today() {
  return new Date().toISOString().slice(0, 10);
}

function contributionDraft(goalId) {
  if (!contributionForms[goalId]) {
    contributionForms[goalId] = {
      amount_rsd: '',
      contribution_date: today(),
      note: '',
    };
  }
  return contributionForms[goalId];
}

function resetGoalForm() {
  goalForm.name = '';
  goalForm.target_amount_rsd = '';
  goalForm.starting_amount_rsd = 0;
  goalForm.monthly_contribution_goal_rsd = '';
  goalForm.target_date = '';
  goalForm.note = '';
}

function applyPayload(payload) {
  goals.value = payload.goals || [];
  Object.assign(capabilities, {
    tier: payload.capabilities?.tier || 'free',
    max_savings_goals: payload.capabilities?.max_savings_goals ?? null,
  });
  Object.assign(summary, {
    total_target_rsd: payload.summary?.total_target_rsd || 0,
    total_saved_rsd: payload.summary?.total_saved_rsd || 0,
    total_remaining_rsd: payload.summary?.total_remaining_rsd || 0,
    monthly_goal_commitment_rsd: payload.summary?.monthly_goal_commitment_rsd || 0,
    projected_monthly_savings_rsd: payload.summary?.projected_monthly_savings_rsd || 0,
    unallocated_monthly_savings_rsd: payload.summary?.unallocated_monthly_savings_rsd || 0,
    active_goals_count: payload.summary?.active_goals_count || 0,
    completed_goals_count: payload.summary?.completed_goals_count || 0,
    on_track_goals_count: payload.summary?.on_track_goals_count || 0,
  });

  if (!selectedGoal.value && activeGoals.value.length) {
    simulator.goalId = String(activeGoals.value[0].id);
    simulator.monthlyContribution = Number(activeGoals.value[0].monthly_contribution_goal_rsd || activeGoals.value[0].monthly_projection_rsd || 0);
  }
}

function formatCurrency(value) {
  return `${Number(value || 0).toFixed(2)} RSD`;
}

function formatDate(value) {
  if (!value) return 'Nije definisano';
  return new Intl.DateTimeFormat('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function goalStatusClass(goal) {
  if (goal.is_completed) return 'status-pill-positive';
  if (goal.target_date && !goal.is_on_track) return 'status-pill-danger';
  if (goal.target_date) return 'status-pill-warning';
  return 'status-pill-neutral';
}

function goalStatusLabel(goal) {
  if (goal.is_completed) return 'Ostvaren';
  if (goal.target_date && goal.is_on_track) return 'U planu';
  if (goal.target_date && !goal.is_on_track) return 'Kasni za planom';
  return 'Bez roka';
}

function toggleGoalDetails(goalId) {
  expandedGoalId.value = expandedGoalId.value === goalId ? null : goalId;
  contributionError.value = '';
  contributionErrorId.value = null;
}

async function fetchGoals() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/api/ciljevi');
    applyPayload(data);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspesno ucitavanje ciljeva';
  } finally {
    loading.value = false;
  }
}

async function submitGoal() {
  savingGoal.value = true;
  goalError.value = '';
  try {
    const { data } = await api.post('/api/ciljevi', {
      name: goalForm.name,
      target_amount_rsd: goalForm.target_amount_rsd,
      starting_amount_rsd: goalForm.starting_amount_rsd || 0,
      monthly_contribution_goal_rsd: goalForm.monthly_contribution_goal_rsd || null,
      target_date: goalForm.target_date || null,
      note: goalForm.note || null,
    });
    applyPayload(data);
    resetGoalForm();
  } catch (e) {
    goalError.value = e?.response?.data?.error || 'Neuspesno kreiranje cilja';
  } finally {
    savingGoal.value = false;
  }
}

async function submitContribution(goal) {
  savingContributionId.value = goal.id;
  contributionError.value = '';
  contributionErrorId.value = null;
  try {
    const draft = contributionDraft(goal.id);
    const { data } = await api.post(`/api/ciljevi/${goal.id}/uplate`, draft);
    applyPayload(data);
    contributionForms[goal.id] = {
      amount_rsd: '',
      contribution_date: today(),
      note: '',
    };
  } catch (e) {
    contributionError.value = e?.response?.data?.error || 'Neuspesno evidentiranje uplate';
    contributionErrorId.value = goal.id;
  } finally {
    savingContributionId.value = null;
  }
}

async function removeContribution(contribution) {
  if (!window.confirm('Obrisi ovu uplatu ka cilju?')) return;
  try {
    const { data } = await api.delete(`/api/ciljevi/uplate/${contribution.id}`);
    applyPayload(data);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspesno brisanje uplate';
  }
}

watch(selectedGoal, (goal) => {
  if (!goal) return;
  simulator.monthlyContribution = Number(goal.monthly_contribution_goal_rsd || goal.monthly_projection_rsd || 0);
  simulator.oneTimeBoost = 0;
});

async function removeGoal(goal) {
  if (!window.confirm(`Obrisi cilj "${goal.name}"?`)) return;
  try {
    const { data } = await api.delete(`/api/ciljevi/${goal.id}`);
    applyPayload(data);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspesno brisanje cilja';
  }
}

onMounted(fetchGoals);
</script>

