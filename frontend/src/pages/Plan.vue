<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <section class="surface-card p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-[0.16em] muted">Plan</p>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight">Budzet, tok novca i izvoz na jednom mestu</h1>
          <p class="muted mt-2">
            Ovaj ekran je namerno tabovan da ostane miran: prvo planiras limite, zatim pratis kretanje kroz mesec, pa tek onda izvozis podatke.
          </p>
        </div>
        <label class="text-sm">
          <span class="block font-medium mb-2">Mesec</span>
          <input v-model="selectedMonth" type="month" class="field min-w-[180px]" />
        </label>
      </div>
    </section>

    <section class="surface-card p-6">
      <div class="settings-tabs">
        <button type="button" class="tab-chip" :class="{ active: activeTab === 'budzet' }" @click="activeTab = 'budzet'">Budzet</button>
        <button type="button" class="tab-chip" :class="{ active: activeTab === 'tok' }" @click="activeTab = 'tok'">Tok novca</button>
        <button type="button" class="tab-chip" :class="{ active: activeTab === 'izvoz' }" @click="activeTab = 'izvoz'">Izvoz</button>
      </div>

      <div v-if="activeTab === 'budzet'" class="mt-6 space-y-6">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article class="surface-card p-5">
            <div class="muted text-sm">Ukupni limit</div>
            <div class="mt-3 text-2xl font-semibold">{{ formatCurrency(budgetSummary.total.monthly_limit_rsd) }}</div>
          </article>
          <article class="surface-card p-5">
            <div class="muted text-sm">Trenutni trosak</div>
            <div class="mt-3 text-2xl font-semibold">{{ formatCurrency(budgetSummary.total.spent_rsd) }}</div>
          </article>
          <article class="surface-card p-5">
            <div class="muted text-sm">Preostalo</div>
            <div class="mt-3 text-2xl font-semibold" :class="budgetSummary.total.remaining_rsd >= 0 ? 'text-positive' : 'text-negative'">
              {{ formatCurrency(budgetSummary.total.remaining_rsd) }}
            </div>
          </article>
          <article class="surface-card p-5">
            <div class="muted text-sm">Kategorije preko limita</div>
            <div class="mt-3 text-2xl font-semibold text-negative">{{ budgetSummary.over_limit_categories.length }}</div>
          </article>
        </div>

        <div class="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <section class="panel-soft p-5">
            <div>
              <h2 class="text-xl font-semibold">Dodaj ili izmeni budzet</h2>
              <p class="muted text-sm mt-1">Prazna kategorija znaci ukupan mesecni limit. Ostalo su limiti po kategoriji.</p>
            </div>

            <form class="mt-5 grid gap-4 md:grid-cols-2" @submit.prevent="saveBudget">
              <div>
                <label class="block text-sm font-medium mb-2">Kategorija</label>
                <input v-model="budgetForm.category" class="field" placeholder="Prazno = ukupni budzet" />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Mesecni limit</label>
                <input v-model.number="budgetForm.monthly_limit_rsd" type="number" min="1" step="0.01" class="field" required />
              </div>
              <div class="md:col-span-2 flex flex-wrap items-center gap-3">
                <button :disabled="budgetSaving" class="btn-primary">{{ budgetSaving ? 'Cuvanje...' : 'Sacuvaj budzet' }}</button>
                <p v-if="budgetError" class="message-danger">{{ budgetError }}</p>
              </div>
            </form>
          </section>

          <section class="panel-soft p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-xl font-semibold">Stanje po kategorijama</h2>
                <p class="muted text-sm mt-1">Ako kategorija nema limit, vidi se potrosnja bez crvenog alarma.</p>
              </div>
            </div>

            <div class="mt-5 space-y-3">
              <article v-for="item in budgetSummary.categories" :key="item.category" class="rounded-2xl border p-4" style="border-color: var(--border)">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="font-medium">{{ item.category }}</div>
                    <div class="muted text-sm mt-1">
                      Limit: {{ item.monthly_limit_rsd == null ? 'nije postavljen' : formatCurrency(item.monthly_limit_rsd) }}
                    </div>
                  </div>
                  <button v-if="item.id" class="btn-ghost text-negative" @click="removeBudget(item)">Obrisi</button>
                </div>

                <div class="grid gap-3 mt-4 md:grid-cols-3 text-sm">
                  <div>
                    <div class="muted">Potroseno</div>
                    <div class="mt-1 font-medium">{{ formatCurrency(item.spent_rsd) }}</div>
                  </div>
                  <div>
                    <div class="muted">Preostalo</div>
                    <div class="mt-1 font-medium" :class="item.remaining_rsd == null ? '' : item.remaining_rsd >= 0 ? 'text-positive' : 'text-negative'">
                      {{ item.remaining_rsd == null ? 'bez limita' : formatCurrency(item.remaining_rsd) }}
                    </div>
                  </div>
                  <div>
                    <div class="muted">Status</div>
                    <div class="mt-1">
                      <span class="status-pill" :class="item.is_over_limit ? 'status-pill-danger' : item.monthly_limit_rsd ? 'status-pill-warning' : 'status-pill-neutral'">
                        {{ item.is_over_limit ? 'Prekoracen' : item.monthly_limit_rsd ? 'U okviru plana' : 'Bez limita' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="item.monthly_limit_rsd" class="progress-track mt-4">
                  <div
                    class="progress-fill"
                    :class="{ 'progress-fill-warning': item.is_over_limit }"
                    :style="{ width: `${Math.min(item.progress_percent || 0, 100)}%` }"
                  ></div>
                </div>
              </article>
              <p v-if="!budgetSummary.categories.length" class="muted text-sm">Jos nema kategorija za pracenje budzeta.</p>
            </div>
          </section>
        </div>
      </div>

      <div v-else-if="activeTab === 'tok'" class="mt-6 space-y-6">
        <div class="grid gap-4 md:grid-cols-3">
          <article class="surface-card p-5">
            <div class="muted text-sm">Planirani prilivi</div>
            <div class="mt-3 text-2xl font-semibold text-positive">{{ formatCurrency(cashflowTotals.income_rsd) }}</div>
          </article>
          <article class="surface-card p-5">
            <div class="muted text-sm">Planirani odlivi</div>
            <div class="mt-3 text-2xl font-semibold">{{ formatCurrency(cashflowTotals.expense_rsd + cashflowTotals.goal_rsd) }}</div>
          </article>
          <article class="surface-card p-5">
            <div class="muted text-sm">Neto signal</div>
            <div class="mt-3 text-2xl font-semibold" :class="cashflowNetRsd >= 0 ? 'text-positive' : 'text-negative'">{{ formatCurrency(cashflowNetRsd) }}</div>
          </article>
        </div>

        <div v-if="cashflowLoading" class="muted">Ucitavanje toka novca...</div>
        <div v-else-if="cashflowError" class="message-danger">{{ cashflowError }}</div>
        <div v-else class="space-y-6">
          <div class="grid gap-3 md:grid-cols-7">
            <article
              v-for="day in calendarDays"
              :key="day.key"
              class="panel-soft p-3 min-h-[150px]"
              :class="{ 'opacity-55': !day.inMonth }"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="text-sm font-semibold">{{ day.label }}</div>
                <div class="text-xs muted">{{ day.short }}</div>
              </div>
              <div class="mt-3 space-y-2">
                <div v-for="item in day.items.slice(0, 3)" :key="`${day.key}-${item.kind}-${item.title}`" class="rounded-xl border px-2 py-2 text-xs" style="border-color: var(--border)">
                  <div class="font-medium">{{ item.title }}</div>
                  <div class="muted mt-1">{{ item.subtitle }}</div>
                  <div class="mt-1" :class="item.kind === 'income' ? 'text-positive' : 'text-negative'">
                    {{ item.kind === 'income' ? '+' : '-' }}{{ formatCurrency(item.amount_rsd) }}
                  </div>
                </div>
                <div v-if="day.items.length > 3" class="text-xs muted">+ jos {{ day.items.length - 3 }} stavki</div>
              </div>
            </article>
          </div>

          <section class="panel-soft p-5">
            <h2 class="text-xl font-semibold">Lista dana</h2>
            <div class="mt-4 space-y-3">
              <article v-for="day in cashflowDays" :key="day.date" class="rounded-2xl border p-4" style="border-color: var(--border)">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="font-medium">{{ formatDate(day.date) }}</div>
                    <div class="muted text-sm mt-1">
                      Prihodi {{ formatCurrency(day.income_rsd) }} | Odlivi {{ formatCurrency(day.expense_rsd + day.goal_rsd) }}
                    </div>
                  </div>
                  <div class="font-semibold" :class="day.net_rsd >= 0 ? 'text-positive' : 'text-negative'">{{ formatCurrency(day.net_rsd) }}</div>
                </div>
              </article>
              <p v-if="!cashflowDays.length" class="muted text-sm">Nema planiranih dogadjaja u ovom mesecu.</p>
            </div>
          </section>
        </div>
      </div>

      <div v-else class="mt-6 space-y-6">
        <section class="panel-soft p-5">
          <h2 class="text-xl font-semibold">Izvoz podataka</h2>
          <p class="muted text-sm mt-1">Skini CSV za dalje analize, backup ili deljenje sa racunovodjom/partnerom.</p>

          <div class="grid gap-3 mt-5 md:grid-cols-2 xl:grid-cols-4">
            <button v-for="item in exportOptions" :key="item.type" class="quick-link text-left" @click="downloadExport(item)">
              <span class="font-medium">{{ item.label }}</span>
              <span class="muted text-sm">{{ item.description }}</span>
            </button>
          </div>

          <p v-if="exportError" class="message-danger mt-4">{{ exportError }}</p>
          <p v-if="exportSuccess" class="message-success mt-4">{{ exportSuccess }}</p>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import api from '../api/client.js';

const activeTab = ref('budzet');
const selectedMonth = ref(currentMonthKey());
const budgetSaving = ref(false);
const budgetError = ref('');
const cashflowLoading = ref(false);
const cashflowError = ref('');
const exportError = ref('');
const exportSuccess = ref('');
const budgetForm = reactive({
  category: '',
  monthly_limit_rsd: '',
});
const budgetSummary = reactive({
  total: {
    monthly_limit_rsd: 0,
    spent_rsd: 0,
    remaining_rsd: 0,
    is_over_limit: false,
    progress_percent: 0,
  },
  categories: [],
  over_limit_categories: [],
});
const budgetTargets = ref([]);
const cashflowDays = ref([]);
const cashflowTotals = reactive({
  income_rsd: 0,
  expense_rsd: 0,
  goal_rsd: 0,
});

const exportOptions = [
  { type: 'obaveze', label: 'Izvezi obaveze', description: 'Nazivi, kategorije, iznosi i datumi dospeca.' },
  { type: 'prihodi', label: 'Izvezi prihode', description: 'Sve redovne i jednokratne prilive.' },
  { type: 'uplate', label: 'Izvezi uplate', description: 'Istorija evidentiranih placanja obaveza.' },
  { type: 'ciljevi', label: 'Izvezi ciljeve', description: 'Ciljevi stednje i njihove mete.' },
];

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

function applyBudgetPayload(payload) {
  budgetTargets.value = payload.targets || [];
  Object.assign(budgetSummary, {
    total: payload.summary?.total || {
      monthly_limit_rsd: 0,
      spent_rsd: 0,
      remaining_rsd: 0,
      is_over_limit: false,
      progress_percent: 0,
    },
    categories: payload.summary?.categories || [],
    over_limit_categories: payload.summary?.over_limit_categories || [],
  });
}

const cashflowNetRsd = computed(() =>
  Number((cashflowTotals.income_rsd - cashflowTotals.expense_rsd - cashflowTotals.goal_rsd).toFixed(2)),
);

const calendarDays = computed(() => {
  const [year, month] = selectedMonth.value.split('-').map(Number);
  if (!year || !month) return [];
  const first = new Date(Date.UTC(year, month - 1, 1));
  const last = new Date(Date.UTC(year, month, 0));
  const firstWeekday = (first.getUTCDay() + 6) % 7;
  const totalDays = last.getUTCDate();
  const cashflowMap = new Map(cashflowDays.value.map((day) => [day.date, day]));
  const days = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    days.push({ key: `blank-${i}`, label: '', short: '', items: [], inMonth: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const key = `${selectedMonth.value}-${String(day).padStart(2, '0')}`;
    const date = new Date(`${key}T00:00:00Z`);
    const weekday = new Intl.DateTimeFormat('sr-RS', { weekday: 'short', timeZone: 'UTC' }).format(date);
    const items = cashflowMap.get(key)?.items || [];
    days.push({
      key,
      label: day,
      short: weekday,
      items,
      inMonth: true,
    });
  }

  return days;
});

async function fetchBudgets() {
  const { data } = await api.get('/api/budzeti');
  applyBudgetPayload(data);
}

async function fetchCashflow() {
  cashflowLoading.value = true;
  cashflowError.value = '';
  try {
    const { data } = await api.get('/api/plan/tok', {
      params: { month: selectedMonth.value },
    });
    cashflowDays.value = data.days || [];
    Object.assign(cashflowTotals, data.totals || { income_rsd: 0, expense_rsd: 0, goal_rsd: 0 });
  } catch (e) {
    cashflowError.value = e?.response?.data?.error || 'Neuspesno ucitavanje toka novca';
  } finally {
    cashflowLoading.value = false;
  }
}

async function saveBudget() {
  budgetSaving.value = true;
  budgetError.value = '';
  try {
    const { data } = await api.post('/api/budzeti', {
      category: budgetForm.category || null,
      monthly_limit_rsd: budgetForm.monthly_limit_rsd,
    });
    applyBudgetPayload(data);
    budgetForm.category = '';
    budgetForm.monthly_limit_rsd = '';
  } catch (e) {
    budgetError.value = e?.response?.data?.error || 'Neuspesno cuvanje budzeta';
  } finally {
    budgetSaving.value = false;
  }
}

async function removeBudget(item) {
  if (!item.id || !window.confirm(`Obrisi budzet za "${item.category}"?`)) return;
  try {
    const { data } = await api.delete(`/api/budzeti/${item.id}`);
    applyBudgetPayload(data);
  } catch (e) {
    budgetError.value = e?.response?.data?.error || 'Neuspesno brisanje budzeta';
  }
}

async function downloadExport(item) {
  exportError.value = '';
  exportSuccess.value = '';
  try {
    const response = await api.get('/api/plan/izvoz', {
      params: { type: item.type },
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${item.type}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    exportSuccess.value = `CSV za "${item.label}" je spreman.`;
  } catch (e) {
    exportError.value = e?.response?.data?.error || 'Neuspesan izvoz podataka';
  }
}

watch(selectedMonth, fetchCashflow);

onMounted(async () => {
  await Promise.all([fetchBudgets(), fetchCashflow()]);
});
</script>

