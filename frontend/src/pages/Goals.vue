<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <section class="surface-card p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-[0.16em] muted">Ciljevi štednje</p>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight">Pretvori višak u konkretan plan</h1>
          <p class="muted mt-2">
            Ako štediš za auto, stan ili fond sigurnosti, ovde vidiš koliko si daleko, koliko mesečno odvajaš i kada cilj realno stiže.
          </p>
        </div>
        <router-link to="/snapshot" class="btn-secondary">Veži sa snapshot-om</router-link>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="surface-card p-5">
        <div class="muted text-sm">Ukupno sačuvano</div>
        <div class="mt-3 text-2xl font-semibold text-positive">{{ formatCurrency(summary.total_saved_rsd) }}</div>
      </article>
      <article class="surface-card p-5">
        <div class="muted text-sm">Ukupan cilj</div>
        <div class="mt-3 text-2xl font-semibold">{{ formatCurrency(summary.total_target_rsd) }}</div>
      </article>
      <article class="surface-card p-5">
        <div class="muted text-sm">Mesečno planirano</div>
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
      <section class="surface-card p-6">
        <div>
          <h2 class="text-xl font-semibold">Dodaj cilj</h2>
          <p class="muted text-sm mt-1">Svaki cilj dobija svoju metu, tempo štednje i projekciju završetka.</p>
        </div>

        <form class="mt-5 grid gap-4 md:grid-cols-2" @submit.prevent="submitGoal">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Naziv cilja</label>
            <input v-model="goalForm.name" class="field" placeholder="Na primer: Učešće za stan" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Ciljani iznos</label>
            <input v-model.number="goalForm.target_amount_rsd" type="number" min="1" step="0.01" class="field" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Već sačuvano</label>
            <input v-model.number="goalForm.starting_amount_rsd" type="number" min="0" step="0.01" class="field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Plan mesečne uplate</label>
            <input v-model.number="goalForm.monthly_contribution_goal_rsd" type="number" min="0" step="0.01" class="field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Ciljani datum</label>
            <input v-model="goalForm.target_date" type="date" class="field" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">Napomena</label>
            <textarea v-model="goalForm.note" rows="3" class="field" placeholder="Zašto ti je ovaj cilj važan ili kako ga puniš."></textarea>
          </div>
          <div class="md:col-span-2 flex flex-wrap items-center gap-3">
            <button :disabled="savingGoal" class="btn-primary">
              {{ savingGoal ? 'Čuvanje...' : 'Dodaj cilj' }}
            </button>
            <p v-if="goalError" class="message-danger">{{ goalError }}</p>
          </div>
        </form>

        <p v-if="capabilities.max_savings_goals === 1" class="muted text-sm mt-4">
          Free nivo trenutno podržava jedan aktivan cilj. Plus otključava više paralelnih ciljeva.
        </p>

        <div class="panel-soft p-4 mt-6">
          <div class="text-sm font-medium">Šta ovaj ekran sada radi bolje</div>
          <ul class="mt-3 space-y-2 text-sm muted">
            <li>Vidiš da li mesečna štednja pokriva tempo koji si sebi zadao.</li>
            <li>Svaki cilj ima svoj forecast umesto jednog apstraktnog broja uštede.</li>
            <li>Možeš da evidentiraš stvarne uplate bez menjanja prihoda i rashoda.</li>
          </ul>
        </div>
      </section>

      <section class="surface-card p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">Aktivni ciljevi</h2>
            <p class="muted text-sm mt-1">Detalji i uplate su iza pojedinačnih kartica da ekran ostane čist.</p>
          </div>
          <div class="text-sm muted">
            Aktivnih: <strong class="text-[color:var(--text)]">{{ summary.active_goals_count }}</strong>
          </div>
        </div>

        <div v-if="loading" class="muted mt-5">Učitavanje ciljeva...</div>
        <div v-else-if="error" class="message-danger mt-5">{{ error }}</div>
        <div v-else-if="!goals.length" class="panel-soft p-5 mt-5">
          <div class="font-medium">Još nema ciljeva</div>
          <p class="muted text-sm mt-2">Dodaj prvi cilj i pretvori projekciju uštede u konkretan plan.</p>
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
              <button class="btn-ghost text-negative" @click="removeGoal(goal)">Obriši</button>
            </div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <div class="muted text-xs uppercase tracking-[0.14em]">Sačuvano</div>
                <div class="mt-2 font-semibold text-positive">{{ formatCurrency(goal.saved_amount_rsd) }}</div>
              </div>
              <div>
                <div class="muted text-xs uppercase tracking-[0.14em]">Preostalo</div>
                <div class="mt-2 font-semibold">{{ formatCurrency(goal.remaining_amount_rsd) }}</div>
              </div>
              <div>
                <div class="muted text-xs uppercase tracking-[0.14em]">Plan mesečno</div>
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
                <div class="muted">Potrebno mesečno</div>
                <div class="mt-1 font-medium">{{ goal.required_monthly_rsd ? formatCurrency(goal.required_monthly_rsd) : 'Nije zadato' }}</div>
              </div>
              <div>
                <div class="muted">Ciljani mesec</div>
                <div class="mt-1 font-medium">{{ goal.target_month_label || 'Bez roka' }}</div>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-3">
              <button class="btn-secondary" @click="toggleGoalDetails(goal.id)">
                {{ expandedGoalId === goal.id ? 'Sakrij detalje' : 'Prikaži uplate' }}
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
                      {{ savingContributionId === goal.id ? 'Čuvanje...' : 'Evidentiraj uplatu' }}
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
                    <button class="btn-ghost text-negative" @click="removeContribution(contribution)">Obriši</button>
                  </li>
                  <li v-if="!goal.recent_contributions.length" class="muted text-sm">Još nema evidentiranih uplata.</li>
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
import { onMounted, reactive, ref } from 'vue';
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
    error.value = e?.response?.data?.error || 'Neuspešno učitavanje ciljeva';
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
    goalError.value = e?.response?.data?.error || 'Neuspešno kreiranje cilja';
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
    contributionError.value = e?.response?.data?.error || 'Neuspešno evidentiranje uplate';
    contributionErrorId.value = goal.id;
  } finally {
    savingContributionId.value = null;
  }
}

async function removeContribution(contribution) {
  if (!window.confirm('Obriši ovu uplatu ka cilju?')) return;
  try {
    const { data } = await api.delete(`/api/ciljevi/uplate/${contribution.id}`);
    applyPayload(data);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspešno brisanje uplate';
  }
}

async function removeGoal(goal) {
  if (!window.confirm(`Obriši cilj "${goal.name}"?`)) return;
  try {
    const { data } = await api.delete(`/api/ciljevi/${goal.id}`);
    applyPayload(data);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspešno brisanje cilja';
  }
}

onMounted(fetchGoals);
</script>
