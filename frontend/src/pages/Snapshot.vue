<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <section class="surface-card p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-3xl font-semibold tracking-tight">Snapshot</h1>
            <PlanBadge :tier="capabilities.tier" />
          </div>
          <p class="muted mt-2">
            Analiticki ekran za jedan pogled na prihode, rashode i ustedu, bez gomilanja nepotrebnih blokova.
          </p>
        </div>
        <label class="text-sm">
          <span class="block font-medium mb-2">Mesec snapshot-a</span>
          <input v-model="snapshotMonth" type="month" class="field min-w-[180px]" />
        </label>
      </div>
    </section>

    <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article class="surface-card p-5">
        <div class="muted text-sm">Planirani prihodi</div>
        <div class="mt-3 text-2xl font-semibold text-emerald-700">{{ formatCurrency(snapshot.planned_income_rsd) }}</div>
        <div class="muted text-xs mt-2">{{ snapshot.month_label || 'Izabrani mesec' }}</div>
      </article>
      <article class="surface-card p-5">
        <div class="muted text-sm">Planirani rashodi</div>
        <div class="mt-3 text-2xl font-semibold">{{ formatCurrency(snapshot.planned_expense_rsd) }}</div>
        <div class="muted text-xs mt-2">Obaveza: {{ snapshot.bills_due_count }}</div>
      </article>
      <article class="surface-card p-5">
        <div class="muted text-sm">Vec placeno</div>
        <div class="mt-3 text-2xl font-semibold text-teal-700">{{ formatCurrency(snapshot.paid_expense_rsd) }}</div>
        <div class="muted text-xs mt-2">Placeno obaveza: {{ snapshot.bills_paid_count }}</div>
      </article>
      <article class="surface-card p-5">
        <div class="muted text-sm">Projekcija ustede</div>
        <div class="mt-3 text-2xl font-semibold" :class="snapshot.projected_savings_rsd >= 0 ? 'text-emerald-700' : 'text-red-700'">
          {{ formatCurrency(snapshot.projected_savings_rsd) }}
        </div>
        <div class="muted text-xs mt-2">Stopa: {{ Number(snapshot.savings_rate_percent || 0).toFixed(1) }}%</div>
      </article>
    </section>

    <section class="surface-card p-6 space-y-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-2xl">
          <h2 class="text-2xl font-semibold">Analitika</h2>
          <p class="muted mt-2 text-sm">
            Menjaj period, pali i gasi kategorije i drzi fokus samo na onome sto ti sada treba.
          </p>
        </div>
        <div class="analytics-toolbar">
          <div>
            <div class="text-xs font-semibold uppercase tracking-[0.14em] muted mb-2">Period</div>
            <div class="settings-tabs">
              <button
                v-for="months in periodOptions"
                :key="months"
                type="button"
                class="tab-chip"
                :class="{ active: analyticsMonths === months }"
                :disabled="!canUseMonths(months)"
                @click="setAnalyticsMonths(months)"
              >
                {{ months }} {{ months === 1 ? 'mesec' : 'meseci' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="analyticsLoading" class="muted">Ucitavanje analitike...</div>
      <div v-else-if="analyticsError" class="text-red-600">{{ analyticsError }}</div>
      <div v-else class="space-y-6">
        <div class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <section class="rounded-3xl border p-5" style="border-color: var(--border)">
            <div>
              <h3 class="text-lg font-semibold">Filteri</h3>
              <p class="muted text-sm mt-1">Sakrij ono sto ti smeta i ostavi samo bitne kategorije.</p>
            </div>

            <div class="mt-5 space-y-5">
              <div>
                <div class="text-sm font-medium mb-3">Rashodi po kategorijama</div>
                <div class="analytics-chip-grid">
                  <label
                    v-for="category in analytics.available_expense_categories"
                    :key="category"
                    class="filter-chip"
                    :class="{ active: selectedExpenseCategories.includes(category), disabled: !capabilities.can_use_advanced_charts }"
                  >
                    <input
                      :checked="selectedExpenseCategories.includes(category)"
                      :disabled="!capabilities.can_use_advanced_charts"
                      type="checkbox"
                      class="sr-only"
                      @change="toggleExpenseCategory(category)"
                    />
                    {{ category }}
                  </label>
                </div>
              </div>

              <div>
                <div class="text-sm font-medium mb-3">Prihodi po izvoru</div>
                <div class="analytics-chip-grid">
                  <label
                    v-for="source in analytics.available_income_sources"
                    :key="source"
                    class="filter-chip"
                    :class="{ active: selectedIncomeSources.includes(source), disabled: !capabilities.can_use_advanced_charts }"
                  >
                    <input
                      :checked="selectedIncomeSources.includes(source)"
                      :disabled="!capabilities.can_use_advanced_charts"
                      type="checkbox"
                      class="sr-only"
                      @change="toggleIncomeSource(source)"
                    />
                    {{ source }}
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section class="rounded-3xl border p-5" style="border-color: var(--border)">
            <div class="grid gap-4 md:grid-cols-3">
              <div>
                <div class="muted text-sm">Prikazani prihodi</div>
                <div class="mt-2 text-xl font-semibold text-emerald-700">{{ formatCurrency(analyticsSummary.income_rsd) }}</div>
              </div>
              <div>
                <div class="muted text-sm">Prikazani rashodi</div>
                <div class="mt-2 text-xl font-semibold">{{ formatCurrency(analyticsSummary.expense_rsd) }}</div>
              </div>
              <div>
                <div class="muted text-sm">Prikazana usteda</div>
                <div class="mt-2 text-xl font-semibold" :class="analyticsSummary.savings_rsd >= 0 ? 'text-emerald-700' : 'text-red-700'">
                  {{ formatCurrency(analyticsSummary.savings_rsd) }}
                </div>
              </div>
            </div>

            <p class="muted text-sm mt-4">
              Fokus je na {{ filteredMonthlyTotals.length ? filteredMonthlyTotals[filteredMonthlyTotals.length - 1].label : 'izabranom periodu' }}.
              Ako sklonis kategoriju, graf i zbir se odmah prilagodjavaju.
            </p>

            <UpgradeHint
              v-if="!capabilities.can_use_advanced_charts"
              class="mt-5"
              title="Napredna analitika je ukljucena od Plus paketa"
              description="Free prikazuje tekuci mesec i osnovni graf. Plus otkljucava vise meseci i slobodno filtriranje kategorija."
            />
          </section>
        </div>

        <div class="settings-tabs">
          <button type="button" class="tab-chip" :class="{ active: chartView === 'rashodi' }" @click="chartView = 'rashodi'">Rashodi</button>
          <button type="button" class="tab-chip" :class="{ active: chartView === 'tok' }" @click="chartView = 'tok'">Prihod vs rashod</button>
          <button type="button" class="tab-chip" :class="{ active: chartView === 'usteda' }" @click="chartView = 'usteda'">Usteda</button>
        </div>

        <AnalyticsCharts
          :chart-view="chartView"
          :expense-breakdown="filteredExpenseBreakdown"
          :monthly-totals="filteredMonthlyTotals"
        />
      </div>
    </section>

    <section class="surface-card p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-2xl font-semibold">Detalji meseca</h2>
          <p class="muted mt-2 text-sm">Detaljne liste su iza tabova da snapshot ostane pregledan.</p>
        </div>
        <div class="settings-tabs">
          <button type="button" class="tab-chip" :class="{ active: detailsTab === 'obaveze' }" @click="detailsTab = 'obaveze'">Obaveze</button>
          <button type="button" class="tab-chip" :class="{ active: detailsTab === 'prihodi' }" @click="detailsTab = 'prihodi'">Prihodi</button>
          <button type="button" class="tab-chip" :class="{ active: detailsTab === 'sazetak' }" @click="detailsTab = 'sazetak'">Sazetak</button>
        </div>
      </div>

      <div v-if="loading" class="muted mt-5">Ucitavanje snapshot pregleda...</div>
      <div v-else-if="error" class="text-red-600 mt-5">{{ error }}</div>
      <div v-else class="mt-5">
        <div v-if="detailsTab === 'obaveze'" class="space-y-3">
          <article
            v-for="item in snapshot.due_bills"
            :key="`${item.id}-${item.due_date}`"
            class="rounded-2xl border p-4"
            style="border-color: var(--border)"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="font-medium">{{ item.name }}</div>
                <div class="muted text-sm mt-1">
                  {{ formatDate(item.due_date) }}<span v-if="item.category"> · {{ item.category }}</span>
                </div>
                <div v-if="!item.is_paid" class="muted text-xs mt-2">
                  Ostalo za uplatu: {{ formatCurrency(item.remaining_amount_rsd) }}
                </div>
              </div>
              <div class="text-right">
                <div class="font-semibold">{{ formatCurrency(item.amount_rsd) }}</div>
                <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium mt-2" :class="statusClass(item)">
                  {{ item.status_label }}
                </span>
              </div>
            </div>
          </article>
          <p v-if="!snapshot.due_bills.length" class="muted">Nema planiranih obaveza za ovaj mesec.</p>
        </div>

        <div v-else-if="detailsTab === 'prihodi'" class="space-y-3">
          <article
            v-for="income in snapshot.incomes"
            :key="`${income.id}-${income.income_date}`"
            class="rounded-2xl border p-4"
            style="border-color: var(--border)"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="font-medium">{{ income.name }}</div>
                <div class="muted text-sm mt-1">{{ formatDate(income.income_date) }}</div>
              </div>
              <div class="font-semibold text-emerald-700">{{ formatCurrency(income.amount_rsd) }}</div>
            </div>
          </article>
          <p v-if="!snapshot.incomes.length" class="muted">Nema planiranih prihoda za ovaj mesec.</p>
        </div>

        <div v-else class="grid gap-4 md:grid-cols-3">
          <div class="rounded-2xl border p-4" style="border-color: var(--border)">
            <div class="muted text-sm">Neplacene obaveze</div>
            <div class="mt-2 text-xl font-semibold">{{ snapshot.unpaid_bills_count }}</div>
          </div>
          <div class="rounded-2xl border p-4" style="border-color: var(--border)">
            <div class="muted text-sm">Jos za placanje</div>
            <div class="mt-2 text-xl font-semibold">{{ formatCurrency(snapshot.remaining_expense_rsd) }}</div>
          </div>
          <div class="rounded-2xl border p-4" style="border-color: var(--border)">
            <div class="muted text-sm">Izabrani paket</div>
            <div class="mt-3">
              <PlanBadge :tier="capabilities.tier" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import api from '../api/client.js';
import AnalyticsCharts from '../components/AnalyticsCharts.vue';
import PlanBadge from '../components/PlanBadge.vue';
import UpgradeHint from '../components/UpgradeHint.vue';

const periodOptions = [1, 3, 6, 12];
const snapshotMonth = ref(currentMonthKey());
const analyticsMonths = ref(1);
const chartView = ref('tok');
const detailsTab = ref('sazetak');
const loading = ref(false);
const analyticsLoading = ref(false);
const error = ref('');
const analyticsError = ref('');
const snapshot = reactive({
  month: '',
  month_label: '',
  planned_income_rsd: 0,
  planned_expense_rsd: 0,
  paid_expense_rsd: 0,
  remaining_expense_rsd: 0,
  projected_savings_rsd: 0,
  savings_rate_percent: 0,
  bills_due_count: 0,
  bills_paid_count: 0,
  unpaid_bills_count: 0,
  due_bills: [],
  incomes: [],
});
const capabilities = reactive({
  tier: 'free',
  can_use_current_snapshot: true,
  can_use_snapshot_history: false,
  can_use_advanced_charts: false,
  can_use_exports: false,
  can_use_household_features: false,
});
const analytics = reactive({
  available_expense_categories: [],
  available_income_sources: [],
  expense_series_by_category: {},
  income_series_by_source: {},
  monthly_totals: [],
});
const selectedExpenseCategories = ref([]);
const selectedIncomeSources = ref([]);

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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

function statusClass(item) {
  return item.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
}

function applyCapabilities(nextCapabilities = {}) {
  Object.assign(capabilities, {
    tier: nextCapabilities.tier || 'free',
    can_use_current_snapshot: nextCapabilities.can_use_current_snapshot !== false,
    can_use_snapshot_history: !!nextCapabilities.can_use_snapshot_history,
    can_use_advanced_charts: !!nextCapabilities.can_use_advanced_charts,
    can_use_exports: !!nextCapabilities.can_use_exports,
    can_use_household_features: !!nextCapabilities.can_use_household_features,
  });
}

function canUseMonths(months) {
  return capabilities.can_use_advanced_charts || months === 1;
}

function setAnalyticsMonths(months) {
  if (!canUseMonths(months)) {
    return;
  }
  analyticsMonths.value = months;
}

function syncSelectedFilters() {
  selectedExpenseCategories.value = capabilities.can_use_advanced_charts
    ? selectedExpenseCategories.value.filter((item) => analytics.available_expense_categories.includes(item))
    : [];
  selectedIncomeSources.value = capabilities.can_use_advanced_charts
    ? selectedIncomeSources.value.filter((item) => analytics.available_income_sources.includes(item))
    : [];

  if (!selectedExpenseCategories.value.length) {
    selectedExpenseCategories.value = [...analytics.available_expense_categories];
  }
  if (!selectedIncomeSources.value.length) {
    selectedIncomeSources.value = [...analytics.available_income_sources];
  }
}

function toggleExpenseCategory(category) {
  if (!capabilities.can_use_advanced_charts) return;
  if (selectedExpenseCategories.value.includes(category)) {
    if (selectedExpenseCategories.value.length === 1) return;
    selectedExpenseCategories.value = selectedExpenseCategories.value.filter((item) => item !== category);
    return;
  }
  selectedExpenseCategories.value = [...selectedExpenseCategories.value, category];
}

function toggleIncomeSource(source) {
  if (!capabilities.can_use_advanced_charts) return;
  if (selectedIncomeSources.value.includes(source)) {
    if (selectedIncomeSources.value.length === 1) return;
    selectedIncomeSources.value = selectedIncomeSources.value.filter((item) => item !== source);
    return;
  }
  selectedIncomeSources.value = [...selectedIncomeSources.value, source];
}

const filteredMonthlyTotals = computed(() => {
  if (!analytics.monthly_totals.length) return [];

  return analytics.monthly_totals.map((month) => {
    const expenseRsd = selectedExpenseCategories.value.reduce((sum, category) => {
      const items = analytics.expense_series_by_category?.[category] || [];
      const match = items.find((item) => item.key === month.key);
      return sum + Number(match?.total_rsd || 0);
    }, 0);

    const incomeRsd = selectedIncomeSources.value.reduce((sum, source) => {
      const items = analytics.income_series_by_source?.[source] || [];
      const match = items.find((item) => item.key === month.key);
      return sum + Number(match?.total_rsd || 0);
    }, 0);

    return {
      key: month.key,
      label: month.label,
      income_rsd: Number(incomeRsd.toFixed(2)),
      expense_rsd: Number(expenseRsd.toFixed(2)),
      savings_rsd: Number((incomeRsd - expenseRsd).toFixed(2)),
    };
  });
});

const filteredExpenseBreakdown = computed(() =>
  selectedExpenseCategories.value
    .map((category) => {
      const items = analytics.expense_series_by_category?.[category] || [];
      const total = items.reduce((sum, item) => sum + Number(item.total_rsd || 0), 0);
      return {
        category,
        total_rsd: Number(total.toFixed(2)),
      };
    })
    .filter((item) => item.total_rsd > 0)
    .sort((left, right) => right.total_rsd - left.total_rsd),
);

const analyticsSummary = computed(() =>
  filteredMonthlyTotals.value.reduce(
    (sum, item) => ({
      income_rsd: Number((sum.income_rsd + Number(item.income_rsd || 0)).toFixed(2)),
      expense_rsd: Number((sum.expense_rsd + Number(item.expense_rsd || 0)).toFixed(2)),
      savings_rsd: Number((sum.savings_rsd + Number(item.savings_rsd || 0)).toFixed(2)),
    }),
    { income_rsd: 0, expense_rsd: 0, savings_rsd: 0 },
  ),
);

async function fetchSnapshot() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/api/statistika/snapshot', {
      params: { month: snapshotMonth.value },
    });
    applyCapabilities(data.capabilities);
    Object.assign(snapshot, {
      month: data.month || '',
      month_label: data.month_label || '',
      planned_income_rsd: data.planned_income_rsd || 0,
      planned_expense_rsd: data.planned_expense_rsd || 0,
      paid_expense_rsd: data.paid_expense_rsd || 0,
      remaining_expense_rsd: data.remaining_expense_rsd || 0,
      projected_savings_rsd: data.projected_savings_rsd || 0,
      savings_rate_percent: data.savings_rate_percent || 0,
      bills_due_count: data.bills_due_count || 0,
      bills_paid_count: data.bills_paid_count || 0,
      unpaid_bills_count: data.unpaid_bills_count || 0,
      due_bills: data.due_bills || [],
      incomes: data.incomes || [],
    });
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspesno ucitavanje snapshot pregleda';
  } finally {
    loading.value = false;
  }
}

async function fetchAnalytics() {
  analyticsLoading.value = true;
  analyticsError.value = '';
  try {
    const { data } = await api.get('/api/statistika/analitika', {
      params: { months: analyticsMonths.value },
    });
    applyCapabilities(data.capabilities);
    Object.assign(analytics, {
      available_expense_categories: data.available_expense_categories || [],
      available_income_sources: data.available_income_sources || [],
      expense_series_by_category: data.expense_series_by_category || {},
      income_series_by_source: data.income_series_by_source || {},
      monthly_totals: data.monthly_totals || [],
    });
    syncSelectedFilters();
  } catch (e) {
    analyticsError.value = e?.response?.data?.error || 'Neuspesno ucitavanje analitike';
  } finally {
    analyticsLoading.value = false;
  }
}

watch(snapshotMonth, fetchSnapshot);
watch(analyticsMonths, fetchAnalytics);

onMounted(async () => {
  await Promise.all([fetchSnapshot(), fetchAnalytics()]);
});
</script>
