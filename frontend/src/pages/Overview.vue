<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Pregled</h1>
        <p class="muted mt-1">Akcioni ekran za danas: sta kasni, sta uskoro dolazi i gde treba da ides dalje.</p>
      </div>
      <router-link to="/snapshot" class="btn-secondary">Otvori snapshot</router-link>
    </div>

    <div class="grid gap-4 md:grid-cols-4">
      <section class="surface-card p-5">
        <p class="muted text-sm">Mesecni troskovi</p>
        <p class="mt-3 text-3xl font-semibold">{{ formatCurrency(overview.total_monthly_rsd) }}</p>
      </section>
      <section class="surface-card p-5">
        <p class="muted text-sm">Mesecni prihodi</p>
        <p class="mt-3 text-3xl font-semibold text-positive">{{ formatCurrency(overview.monthly_income_rsd) }}</p>
      </section>
      <section class="surface-card p-5">
        <p class="muted text-sm">Projekcija ustede</p>
        <p class="mt-3 text-3xl font-semibold" :class="overview.projected_savings_rsd >= 0 ? 'text-positive' : 'text-negative'">
          {{ formatCurrency(overview.projected_savings_rsd) }}
        </p>
      </section>
      <section class="surface-card p-5">
        <p class="muted text-sm">Kasne</p>
        <p class="mt-3 text-3xl font-semibold text-negative">{{ overdueBills.length }}</p>
      </section>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <section class="surface-card p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">Sta trazi paznju</h2>
            <p class="muted text-sm mt-1">Prvo resi stavke koje kasne, pa one koje uskoro dolaze.</p>
          </div>
        </div>

        <div v-if="loading" class="muted mt-4">Ucitavanje...</div>
        <div v-else-if="error" class="message-danger mt-4">{{ error }}</div>
        <div v-else class="mt-4 space-y-6">
          <div>
            <div class="flex items-center justify-between gap-3">
              <h3 class="font-semibold">Kasne obaveze</h3>
              <router-link to="/obaveze" class="btn-ghost">Sve obaveze</router-link>
            </div>
            <ul class="mt-3 space-y-3">
              <li v-for="bill in overdueBills" :key="bill.id" class="rounded-2xl border p-4" style="border-color: var(--border)">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="font-medium">{{ bill.name }}</div>
                    <div class="muted text-sm mt-1">{{ formatDate(bill.computed_next_due_date) }} · {{ dueLabel(bill.days_until_due) }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-semibold">{{ formatCurrency(bill.amount_rsd) }}</div>
                    <button class="btn-ghost text-positive mt-2" @click="markAsPaid(bill)">Evidentiraj uplatu</button>
                  </div>
                </div>
              </li>
              <li v-if="!overdueBills.length" class="muted">Nema stavki koje kasne.</li>
            </ul>
          </div>

          <div>
            <h3 class="font-semibold">Uskoro dospeva</h3>
            <ul class="mt-3 space-y-3">
              <li v-for="bill in overview.upcoming_bills" :key="`${bill.id}-${bill.computed_next_due_date}`" class="rounded-2xl border p-4" style="border-color: var(--border)">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="font-medium">{{ bill.name }}</div>
                    <div class="muted text-sm mt-1">{{ formatDate(bill.computed_next_due_date) }} · {{ dueLabel(bill.days_until_due) }}</div>
                  </div>
                  <div class="text-right font-medium">{{ formatCurrency(bill.amount_rsd) }}</div>
                </div>
              </li>
              <li v-if="!overview.upcoming_bills.length" class="muted">Nema skorih dospeca.</li>
            </ul>
          </div>
        </div>
      </section>

      <div class="space-y-4">
        <section class="surface-card p-6">
          <h2 class="text-xl font-semibold">Brze akcije</h2>
          <div class="mt-4 grid gap-3">
            <router-link to="/obaveze/dodaj" class="quick-link">
              <span class="font-medium">Dodaj novu obavezu</span>
              <span class="muted text-sm">Unesi racun ili pretplatu bez trazenja po meniju.</span>
            </router-link>
            <router-link to="/snapshot" class="quick-link">
              <span class="font-medium">Otvori mesecni snapshot</span>
              <span class="muted text-sm">Jedan ekran za planirano, placeno i procenu ustede.</span>
            </router-link>
            <router-link to="/ciljevi" class="quick-link">
              <span class="font-medium">Dodaj cilj stednje</span>
              <span class="muted text-sm">Pretvori visak iz meseca u plan za auto, stan ili fond.</span>
            </router-link>
            <router-link to="/prihodi" class="quick-link">
              <span class="font-medium">Azuriraj prihode</span>
              <span class="muted text-sm">Projekcija ustede nema smisla bez ispravnih priliva.</span>
            </router-link>
            <router-link to="/podesavanja" class="quick-link">
              <span class="font-medium">Podesavanja i profil</span>
              <span class="muted text-sm">Tema, podsetnici, email i lozinka na jednom mestu.</span>
            </router-link>
          </div>
        </section>

        <section class="surface-card p-6">
          <h2 class="text-xl font-semibold">Signal ovog meseca</h2>
          <div v-if="trendsLoading" class="muted mt-4">Ucitavanje...</div>
          <div v-else-if="trendsError" class="message-danger mt-4">{{ trendsError }}</div>
          <div v-else class="mt-4 grid gap-3">
            <div class="panel-soft p-4">
              <div class="muted text-sm">Placeno ovog meseca</div>
              <div class="mt-2 text-xl font-semibold text-accent">{{ formatCurrency(trends.latest_month_paid_rsd) }}</div>
            </div>
            <div class="panel-soft p-4">
              <div class="muted text-sm">Placeno proslog meseca</div>
              <div class="mt-2 text-xl font-semibold">{{ formatCurrency(trends.previous_month_paid_rsd) }}</div>
            </div>
            <div class="panel-soft p-4">
              <div class="muted text-sm">Planirana usteda</div>
              <div class="mt-2 text-xl font-semibold" :class="trends.income_vs_expense.projected_savings_rsd >= 0 ? 'text-positive' : 'text-negative'">
                {{ formatCurrency(trends.income_vs_expense.projected_savings_rsd) }}
              </div>
            </div>
          </div>
        </section>

        <section class="surface-card p-6">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold">Ciljevi stednje</h2>
              <p class="muted text-sm mt-1">Najvazniji signali bez ulaska u detaljnu analitiku.</p>
            </div>
            <router-link to="/ciljevi" class="btn-ghost">Svi ciljevi</router-link>
          </div>

          <div v-if="goalsLoading" class="muted mt-4">Ucitavanje...</div>
          <div v-else-if="goalsError" class="message-danger mt-4">{{ goalsError }}</div>
          <div v-else class="mt-4 space-y-3">
            <div class="panel-soft p-4">
              <div class="muted text-sm">Mesečno slobodno za ciljeve</div>
              <div class="mt-2 text-xl font-semibold" :class="goalsSummary.unallocated_monthly_savings_rsd >= 0 ? 'text-positive' : 'text-negative'">
                {{ formatCurrency(goalsSummary.unallocated_monthly_savings_rsd) }}
              </div>
              <div class="muted text-xs mt-2">Planirano za ciljeve: {{ formatCurrency(goalsSummary.monthly_goal_commitment_rsd) }}</div>
            </div>

            <div v-for="goal in topGoals" :key="goal.id" class="panel-soft p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="font-medium">{{ goal.name }}</div>
                  <div class="muted text-sm mt-1">{{ goal.projected_completion_label || 'Nema forecast-a jos' }}</div>
                </div>
                <div class="text-right">
                  <div class="font-semibold">{{ goal.progress_percent.toFixed(1) }}%</div>
                  <div class="muted text-xs mt-1">{{ formatCurrency(goal.saved_amount_rsd) }}</div>
                </div>
              </div>
              <div class="progress-track mt-3">
                <div class="progress-fill" :style="{ width: `${Math.min(goal.progress_percent, 100)}%` }"></div>
              </div>
            </div>

            <p v-if="!topGoals.length" class="muted text-sm">Jos nema ciljeva stednje.</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api from '../api/client.js';

const bills = ref([]);
const loading = ref(false);
const error = ref('');
const overview = reactive({
  total_monthly_rsd: 0,
  total_bills: 0,
  overdue_bills_count: 0,
  upcoming_bills: [],
  monthly_income_rsd: 0,
  projected_savings_rsd: 0,
});
const trends = reactive({
  latest_month_paid_rsd: 0,
  previous_month_paid_rsd: 0,
  income_vs_expense: {
    projected_savings_rsd: 0,
  },
});
const trendsLoading = ref(false);
const trendsError = ref('');
const goalsLoading = ref(false);
const goalsError = ref('');
const goalsSummary = reactive({
  total_target_rsd: 0,
  total_saved_rsd: 0,
  total_remaining_rsd: 0,
  monthly_goal_commitment_rsd: 0,
  projected_monthly_savings_rsd: 0,
  unallocated_monthly_savings_rsd: 0,
  active_goals_count: 0,
});
const goals = ref([]);

const overdueBills = computed(() => bills.value.filter((bill) => bill.is_overdue).slice(0, 5));
const topGoals = computed(() => goals.value.filter((goal) => !goal.is_completed).slice(0, 3));

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

function dueLabel(daysUntilDue) {
  if (daysUntilDue == null) return 'Bez datuma dospeca';
  if (daysUntilDue < 0) return `Kasni ${Math.abs(daysUntilDue)} dana`;
  if (daysUntilDue === 0) return 'Danas dospeva';
  if (daysUntilDue === 1) return 'Sutra dospeva';
  return `Za ${daysUntilDue} dana`;
}

async function fetchBills() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/api/obaveze');
    bills.value = data.bills || [];
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspesno ucitavanje obaveza';
  } finally {
    loading.value = false;
  }
}

async function fetchOverview() {
  try {
    const { data } = await api.get('/api/statistika/pregled');
    Object.assign(overview, {
      total_monthly_rsd: data.total_monthly_rsd || 0,
      total_bills: data.total_bills || 0,
      overdue_bills_count: data.overdue_bills_count || 0,
      upcoming_bills: data.upcoming_bills || [],
      monthly_income_rsd: data.monthly_income_rsd || 0,
      projected_savings_rsd: data.projected_savings_rsd || 0,
    });
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspesno ucitavanje pregleda';
  }
}

async function fetchTrends() {
  trendsLoading.value = true;
  trendsError.value = '';
  try {
    const { data } = await api.get('/api/statistika/trendovi');
    Object.assign(trends, {
      latest_month_paid_rsd: data.latest_month_paid_rsd || 0,
      previous_month_paid_rsd: data.previous_month_paid_rsd || 0,
      income_vs_expense: data.income_vs_expense || { projected_savings_rsd: 0 },
    });
  } catch (e) {
    trendsError.value = e?.response?.data?.error || 'Neuspesno ucitavanje trendova';
  } finally {
    trendsLoading.value = false;
  }
}

async function fetchGoals() {
  goalsLoading.value = true;
  goalsError.value = '';
  try {
    const { data } = await api.get('/api/ciljevi');
    goals.value = data.goals || [];
    Object.assign(goalsSummary, {
      total_target_rsd: data.summary?.total_target_rsd || 0,
      total_saved_rsd: data.summary?.total_saved_rsd || 0,
      total_remaining_rsd: data.summary?.total_remaining_rsd || 0,
      monthly_goal_commitment_rsd: data.summary?.monthly_goal_commitment_rsd || 0,
      projected_monthly_savings_rsd: data.summary?.projected_monthly_savings_rsd || 0,
      unallocated_monthly_savings_rsd: data.summary?.unallocated_monthly_savings_rsd || 0,
      active_goals_count: data.summary?.active_goals_count || 0,
    });
  } catch (e) {
    goalsError.value = e?.response?.data?.error || 'Neuspesno ucitavanje ciljeva stednje';
  } finally {
    goalsLoading.value = false;
  }
}

async function markAsPaid(bill) {
  try {
    await api.post(`/api/obaveze/${bill.id}/uplate`, {
      amount_rsd: bill.amount_rsd,
      note: 'Uplata evidentirana sa pregleda',
    });
    await Promise.all([fetchBills(), fetchOverview(), fetchTrends()]);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greska pri evidentiranju uplate';
  }
}

onMounted(() => {
  fetchBills();
  fetchOverview();
  fetchTrends();
  fetchGoals();
});
</script>
