<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Pregled troškova</h1>
        <p class="muted mt-1">Pregled mesečnog opterećenja, narednih dospeća i svih aktivnih obaveza.</p>
      </div>
      <router-link to="/obaveze/dodaj" class="btn-primary">+ Nova obaveza</router-link>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <section class="surface-card p-5">
        <p class="muted text-sm">Prosečno mesečno</p>
        <p class="mt-3 text-3xl font-semibold">{{ formatCurrency(overview.total_monthly_rsd) }}</p>
      </section>
      <section class="surface-card p-5">
        <p class="muted text-sm">Mesečni prihodi</p>
        <p class="mt-3 text-3xl font-semibold text-emerald-700">{{ formatCurrency(overview.monthly_income_rsd) }}</p>
      </section>
      <section class="surface-card p-5">
        <p class="muted text-sm">Projekcija uštede</p>
        <p class="mt-3 text-3xl font-semibold" :class="overview.projected_savings_rsd >= 0 ? 'text-emerald-700' : 'text-red-700'">
          {{ formatCurrency(overview.projected_savings_rsd) }}
        </p>
        <p class="muted text-sm mt-2">Stopa: {{ Number(overview.savings_rate_percent || 0).toFixed(1) }}%</p>
      </section>
    </div>

    <section class="surface-card p-6 space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Mesecni snapshot</h2>
          <p class="muted text-sm mt-1">Jedan konkretan mesec: koliko ulazi, koliko izlazi, sta je vec placeno i koliko ostaje.</p>
        </div>
        <label class="text-sm">
          <span class="block font-medium mb-2">Mesec</span>
          <input v-model="snapshotMonth" type="month" class="field min-w-[180px]" />
        </label>
      </div>

      <div v-if="snapshotLoading" class="muted">Ucitavanje snapshot pregleda...</div>
      <div v-else-if="snapshotError" class="text-red-600">{{ snapshotError }}</div>
      <div v-else class="space-y-5">
        <div class="grid gap-4 md:grid-cols-4">
          <div class="rounded-2xl border p-4" style="border-color: var(--border)">
            <div class="muted text-sm">Planirani prihodi</div>
            <div class="mt-2 text-2xl font-semibold text-emerald-700">{{ formatCurrency(snapshot.planned_income_rsd) }}</div>
            <div class="muted text-xs mt-2">{{ snapshot.month_label || 'Izabrani mesec' }}</div>
          </div>
          <div class="rounded-2xl border p-4" style="border-color: var(--border)">
            <div class="muted text-sm">Planirani troskovi</div>
            <div class="mt-2 text-2xl font-semibold">{{ formatCurrency(snapshot.planned_expense_rsd) }}</div>
            <div class="muted text-xs mt-2">Obaveza: {{ snapshot.bills_due_count }}</div>
          </div>
          <div class="rounded-2xl border p-4" style="border-color: var(--border)">
            <div class="muted text-sm">Vec placeno</div>
            <div class="mt-2 text-2xl font-semibold text-teal-700">{{ formatCurrency(snapshot.paid_expense_rsd) }}</div>
            <div class="muted text-xs mt-2">Placeno obaveza: {{ snapshot.bills_paid_count }}</div>
          </div>
          <div class="rounded-2xl border p-4" style="border-color: var(--border)">
            <div class="muted text-sm">Projekcija ustede</div>
            <div class="mt-2 text-2xl font-semibold" :class="snapshot.projected_savings_rsd >= 0 ? 'text-emerald-700' : 'text-red-700'">
              {{ formatCurrency(snapshot.projected_savings_rsd) }}
            </div>
            <div class="muted text-xs mt-2">Stopa: {{ Number(snapshot.savings_rate_percent || 0).toFixed(1) }}%</div>
          </div>
        </div>

        <div class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section class="rounded-3xl border p-5" style="border-color: var(--border)">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="font-semibold">Obaveze u izabranom mesecu</h3>
                <p class="muted text-sm mt-1">Fokus na ono sto jos ceka uplatu.</p>
              </div>
              <div class="text-right text-sm">
                <div class="font-semibold">{{ snapshot.unpaid_bills_count }}</div>
                <div class="muted">neplacenih</div>
              </div>
            </div>

            <ul class="mt-4 space-y-3">
              <li
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
                    <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium mt-2" :class="snapshotStatusClass(item)">
                      {{ item.status_label }}
                    </span>
                  </div>
                </div>
              </li>
              <li v-if="!snapshot.due_bills.length" class="muted">Nema planiranih obaveza za ovaj mesec.</li>
            </ul>
          </section>

          <section class="rounded-3xl border p-5" style="border-color: var(--border)">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h3 class="font-semibold">Prihodi u izabranom mesecu</h3>
                <p class="muted text-sm mt-1">Oslonac za procenu koliko realno ostaje.</p>
              </div>
              <div class="text-right text-sm">
                <div class="font-semibold">{{ formatCurrency(snapshot.remaining_expense_rsd) }}</div>
                <div class="muted">jos za placanje</div>
              </div>
            </div>

            <ul class="mt-4 space-y-3">
              <li
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
              </li>
              <li v-if="!snapshot.incomes.length" class="muted">Nema planiranih prihoda za ovaj mesec.</li>
            </ul>
          </section>
        </div>
      </div>
    </section>

    <div class="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <section class="surface-card p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">Trend uplata</h2>
            <p class="muted text-sm mt-1">Koliko je stvarno plaćeno u poslednjih 6 meseci.</p>
          </div>
        </div>

        <div v-if="trendsLoading" class="muted mt-4">Učitavanje...</div>
        <div v-else-if="trendsError" class="mt-4 text-red-600">{{ trendsError }}</div>
        <div v-else class="mt-6">
          <div class="grid grid-cols-6 gap-3 items-end h-56">
            <div v-for="item in trends.monthly_paid" :key="item.key" class="flex h-full flex-col justify-end gap-2">
              <div class="rounded-t-2xl bg-teal-500/80 min-h-[8px]" :style="{ height: `${getTrendHeight(item.total_rsd)}%` }"></div>
              <div class="text-center text-xs muted">{{ item.label }}</div>
            </div>
          </div>

          <div class="mt-5 grid gap-3 md:grid-cols-3 text-sm">
            <div class="rounded-2xl border p-4" style="border-color: var(--border)">
              <div class="muted">Plaćeno ovaj mesec</div>
              <div class="mt-2 font-semibold">{{ formatCurrency(trends.latest_month_paid_rsd) }}</div>
            </div>
            <div class="rounded-2xl border p-4" style="border-color: var(--border)">
              <div class="muted">Plaćeno prošli mesec</div>
              <div class="mt-2 font-semibold">{{ formatCurrency(trends.previous_month_paid_rsd) }}</div>
            </div>
            <div class="rounded-2xl border p-4" style="border-color: var(--border)">
              <div class="muted">Planirana ušteda</div>
              <div class="mt-2 font-semibold" :class="trends.income_vs_expense.projected_savings_rsd >= 0 ? 'text-emerald-700' : 'text-red-700'">
                {{ formatCurrency(trends.income_vs_expense.projected_savings_rsd) }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="surface-card p-6">
        <h2 class="text-xl font-semibold">Najveća mesečna opterećenja</h2>
        <div v-if="statsLoading" class="muted mt-4">Učitavanje...</div>
        <div v-else-if="statsError" class="mt-4 text-red-600">{{ statsError }}</div>
        <ul v-else class="mt-6 space-y-4">
          <li
            v-for="category in topCategories"
            :key="category.category || 'uncategorized'"
            class="space-y-2"
          >
            <div class="flex items-center justify-between gap-3 text-sm">
              <span>{{ category.category || 'Ostalo' }}</span>
              <span class="font-medium">{{ formatCurrency(category.total_rsd) }}</span>
            </div>
            <div class="h-3 rounded-full bg-slate-200/60 overflow-hidden">
              <div class="h-full rounded-full bg-amber-500/80" :style="{ width: `${getCategoryWidth(category.total_rsd)}%` }"></div>
            </div>
          </li>
          <li v-if="!topCategories.length" class="muted">Još nema kategorija.</li>
        </ul>
      </section>
    </div>

    <div class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <section class="surface-card p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">Prihodi</h2>
            <p class="muted text-sm mt-1">Dodaj redovne prihode da bi projekcija uštede imala smisla.</p>
          </div>
        </div>

        <form @submit.prevent="submitIncome" class="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label class="block text-sm font-medium mb-2">Naziv prihoda</label>
            <input v-model="incomeForm.name" class="field" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Iznos</label>
            <input v-model.number="incomeForm.amount_rsd" type="number" min="0.01" step="0.01" class="field" required />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Ponavljanje</label>
            <select v-model="incomeForm.recurrence" class="field">
              <option value="monthly">mesečno</option>
              <option value="yearly">godišnje</option>
              <option value="one_time">jednokratno</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Dan / datum priliva</label>
            <input
              v-if="incomeForm.recurrence === 'monthly'"
              v-model.number="incomeForm.day_of_month"
              type="number"
              min="1"
              max="31"
              class="field"
            />
            <input
              v-else
              v-model="incomeForm.next_income_date"
              type="date"
              class="field"
            />
          </div>
          <div class="md:col-span-2 flex flex-wrap items-center gap-3">
            <button :disabled="incomeLoading" class="btn-primary">
              {{ incomeLoading ? 'Čuvanje...' : 'Dodaj prihod' }}
            </button>
            <p v-if="incomeError" class="text-sm text-red-600">{{ incomeError }}</p>
          </div>
        </form>

        <ul class="mt-6 space-y-3">
          <li
            v-for="income in incomes"
            :key="income.id"
            class="rounded-2xl border p-4"
            style="border-color: var(--border)"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div class="font-medium">{{ income.name }}</div>
                <div class="muted text-sm mt-1">{{ incomeRecurrenceLabel(income) }}</div>
              </div>
              <div class="text-right">
                <div class="font-semibold text-emerald-700">{{ formatCurrency(income.amount_rsd) }}</div>
                <button class="btn-ghost text-red-600 mt-2" @click="removeIncome(income)">Obriši</button>
              </div>
            </div>
          </li>
          <li v-if="!incomes.length" class="muted">Još nema unetih prihoda.</li>
        </ul>
      </section>

      <section class="surface-card p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">Šta traži pažnju</h2>
            <p class="muted text-sm mt-1">Brzi fokus na obaveze koje kasne ili uskoro dolaze na naplatu.</p>
          </div>
        </div>

        <div class="mt-5 space-y-3">
          <div class="rounded-2xl border p-4" style="border-color: var(--border)">
            <div class="text-sm muted">Kasni</div>
            <div class="mt-2 text-2xl font-semibold">{{ overview.overdue_bills_count }}</div>
          </div>
          <div class="rounded-2xl border p-4" style="border-color: var(--border)">
            <div class="text-sm muted">Aktivne obaveze</div>
            <div class="mt-2 text-2xl font-semibold">{{ overview.total_bills }}</div>
          </div>
          <div class="rounded-2xl border p-4" style="border-color: var(--border)">
            <div class="text-sm muted">Odmah evidentiraj uplatu ako je račun već plaćen</div>
            <div class="mt-2 muted text-sm">Time dashboard ostaje tačan, a trendovi i procena uštede postaju korisni.</div>
          </div>
        </div>
      </section>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.25fr_0.85fr]">
      <section class="surface-card p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">Sve obaveze</h2>
            <p class="muted text-sm mt-1">Izmeni ili ukloni stavku direktno iz pregleda.</p>
          </div>
        </div>

        <div v-if="loading" class="muted mt-4">Učitavanje...</div>
        <div v-else-if="error" class="mt-4 text-red-600">{{ error }}</div>
        <div v-else-if="!bills.length" class="mt-4 muted">Još nema unetih obaveza.</div>
        <div v-else class="mt-4 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left muted border-b" style="border-color: var(--border)">
                <th class="pb-3 pr-4 font-medium">Naziv</th>
                <th class="pb-3 pr-4 font-medium">Kategorija</th>
                <th class="pb-3 pr-4 font-medium">Dospeće</th>
                <th class="pb-3 pr-4 font-medium">Status</th>
                <th class="pb-3 pr-4 font-medium">Iznos</th>
                <th class="pb-3 font-medium">Akcije</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bill in bills" :key="bill.id" class="border-b align-top" style="border-color: var(--border)">
                <td class="py-4 pr-4">
                  <div class="font-medium">{{ bill.name }}</div>
                  <div class="muted text-xs mt-1">{{ recurrenceLabel(bill.recurrence) }}</div>
                </td>
                <td class="py-4 pr-4">{{ bill.category || 'Bez kategorije' }}</td>
                <td class="py-4 pr-4">
                  <div>{{ formatDate(bill.computed_next_due_date) }}</div>
                  <div class="muted text-xs mt-1">{{ dueLabel(bill.days_until_due) }}</div>
                </td>
                <td class="py-4 pr-4">
                  <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium" :class="statusClass(bill)">
                    {{ bill.status_label }}
                  </span>
                  <div v-if="bill.latest_payment_paid_at" class="muted text-xs mt-2">
                    poslednja uplata: {{ formatDateTime(bill.latest_payment_paid_at) }}
                  </div>
                </td>
                <td class="py-4 pr-4">
                  <div class="font-medium">{{ formatCurrency(bill.amount_rsd) }}</div>
                  <div class="muted text-xs mt-1">mesečno: {{ formatCurrency(bill.monthly_amount_rsd) }}</div>
                </td>
                <td class="py-4">
                  <div class="flex flex-wrap gap-3">
                    <router-link :to="`/obaveze/${bill.id}/izmeni`" class="btn-ghost">Izmeni</router-link>
                    <button class="btn-ghost text-emerald-700" @click="markAsPaid(bill)">Evidentiraj uplatu</button>
                    <button class="btn-ghost text-red-600" @click="removeBill(bill)">Obriši</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="space-y-4">
        <section class="surface-card p-6">
          <h2 class="text-xl font-semibold">Uskoro dospeva</h2>
          <div v-if="overviewLoading" class="muted mt-4">Učitavanje...</div>
          <div v-else-if="overviewError" class="mt-4 text-red-600">{{ overviewError }}</div>
          <ul v-else class="mt-4 space-y-3">
            <li v-for="bill in overview.upcoming_bills" :key="`${bill.id}-${bill.computed_next_due_date}`" class="rounded-2xl border p-4" style="border-color: var(--border)">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="font-medium">{{ bill.name }}</div>
                  <div class="muted text-sm mt-1">{{ formatDate(bill.computed_next_due_date) }} · {{ dueLabel(bill.days_until_due) }}</div>
                </div>
                <div class="text-right font-medium">{{ formatCurrency(bill.amount_rsd) }}</div>
              </div>
            </li>
            <li v-if="!overview.upcoming_bills.length" class="muted">Nema skorih dospeća.</li>
          </ul>
        </section>

        <section class="surface-card p-6">
          <h2 class="text-xl font-semibold">Kategorije</h2>
          <div v-if="statsLoading" class="muted mt-4">Učitavanje...</div>
          <div v-else-if="statsError" class="mt-4 text-red-600">{{ statsError }}</div>
          <ul v-else class="mt-4 space-y-3 text-sm">
            <li v-for="category in categories" :key="category.category || 'uncategorized'" class="flex items-center justify-between gap-3">
              <span>{{ category.category || 'Ostalo' }}</span>
              <span class="font-medium">{{ formatCurrency(category.total_rsd) }}</span>
            </li>
            <li v-if="!categories.length" class="muted">Još nema kategorija.</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import api from '../api/client.js';

const bills = ref([]);
const loading = ref(false);
const error = ref('');

const categories = ref([]);
const statsLoading = ref(false);
const statsError = ref('');
const topCategories = ref([]);

const overview = reactive({
  total_monthly_rsd: 0,
  total_bills: 0,
  overdue_bills_count: 0,
  upcoming_bills: [],
  monthly_income_rsd: 0,
  projected_savings_rsd: 0,
  savings_rate_percent: 0,
});
const overviewLoading = ref(false);
const overviewError = ref('');

const trends = reactive({
  monthly_paid: [],
  current_month_commitment_rsd: 0,
  latest_month_paid_rsd: 0,
  previous_month_paid_rsd: 0,
  income_vs_expense: {
    income_rsd: 0,
    expected_expense_rsd: 0,
    projected_savings_rsd: 0,
  },
});
const trendsLoading = ref(false);
const trendsError = ref('');
const snapshotMonth = ref(currentMonthKey());
const snapshotLoading = ref(false);
const snapshotError = ref('');
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
const incomes = ref([]);
const incomeLoading = ref(false);
const incomeError = ref('');
const incomeForm = reactive({
  name: '',
  amount_rsd: '',
  recurrence: 'monthly',
  day_of_month: 1,
  next_income_date: '',
});

function formatCurrency(value) {
  return `${Number(value || 0).toFixed(2)} RSD`;
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function recurrenceLabel(recurrence) {
  return recurrence === 'yearly' ? 'Godišnje' : 'Mesečno';
}

function incomeRecurrenceLabel(income) {
  if (income.recurrence === 'yearly') {
    return `Godišnje · sledeći priliv ${formatDate(income.next_income_date)}`;
  }
  if (income.recurrence === 'one_time') {
    return `Jednokratno · ${formatDate(income.next_income_date)}`;
  }
  return income.day_of_month ? `Mesečno · oko ${income.day_of_month}. u mesecu` : 'Mesečno';
}

function formatDate(value) {
  if (!value) return 'Nije definisano';
  return new Intl.DateTimeFormat('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) return 'Nije definisano';
  return new Intl.DateTimeFormat('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function dueLabel(daysUntilDue) {
  if (daysUntilDue == null) return 'Bez datuma dospeća';
  if (daysUntilDue < 0) return `Kasni ${Math.abs(daysUntilDue)} dana`;
  if (daysUntilDue === 0) return 'Danas dospeva';
  if (daysUntilDue === 1) return 'Sutra dospeva';
  return `Za ${daysUntilDue} dana`;
}

function statusClass(bill) {
  if (bill.is_overdue) return 'bg-red-100 text-red-700';
  if (bill.is_paid) return 'bg-emerald-100 text-emerald-700';
  return 'bg-amber-100 text-amber-700';
}

function getTrendHeight(total) {
  const max = Math.max(...trends.monthly_paid.map((item) => Number(item.total_rsd || 0)), 1);
  return Math.max(8, (Number(total || 0) / max) * 100);
}

function getCategoryWidth(total) {
  const max = Math.max(...topCategories.value.map((item) => Number(item.total_rsd || 0)), 1);
  return Math.max(12, (Number(total || 0) / max) * 100);
}

function snapshotStatusClass(item) {
  return item.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700';
}

async function fetchBills() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/api/obaveze');
    bills.value = data.bills || [];
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspešno učitavanje računa';
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  statsLoading.value = true;
  statsError.value = '';
  try {
    const { data } = await api.get('/api/statistika/mesecno');
    categories.value = data.categories || [];
    topCategories.value = [...(data.categories || [])]
      .sort((left, right) => Number(right.total_rsd) - Number(left.total_rsd))
      .slice(0, 5);
  } catch (e) {
    statsError.value = e?.response?.data?.error || 'Neuspešno učitavanje statistike';
  } finally {
    statsLoading.value = false;
  }
}

async function fetchTrends() {
  trendsLoading.value = true;
  trendsError.value = '';
  try {
    const { data } = await api.get('/api/statistika/trendovi');
    Object.assign(trends, {
      monthly_paid: data.monthly_paid || [],
      current_month_commitment_rsd: data.current_month_commitment_rsd || 0,
      latest_month_paid_rsd: data.latest_month_paid_rsd || 0,
      previous_month_paid_rsd: data.previous_month_paid_rsd || 0,
      income_vs_expense: data.income_vs_expense || {
        income_rsd: 0,
        expected_expense_rsd: 0,
        projected_savings_rsd: 0,
      },
    });
  } catch (e) {
    trendsError.value = e?.response?.data?.error || 'Neuspešno učitavanje trendova';
  } finally {
    trendsLoading.value = false;
  }
}

async function fetchSnapshot() {
  snapshotLoading.value = true;
  snapshotError.value = '';
  try {
    const { data } = await api.get('/api/statistika/snapshot', {
      params: { month: snapshotMonth.value },
    });
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
    snapshotError.value = e?.response?.data?.error || 'Neuspesno ucitavanje snapshot pregleda';
  } finally {
    snapshotLoading.value = false;
  }
}

async function fetchOverview() {
  overviewLoading.value = true;
  overviewError.value = '';
  try {
    const { data } = await api.get('/api/statistika/pregled');
    Object.assign(overview, {
      total_monthly_rsd: data.total_monthly_rsd || 0,
      total_bills: data.total_bills || 0,
      overdue_bills_count: data.overdue_bills_count || 0,
      upcoming_bills: data.upcoming_bills || [],
      monthly_income_rsd: data.monthly_income_rsd || 0,
      projected_savings_rsd: data.projected_savings_rsd || 0,
      savings_rate_percent: data.savings_rate_percent || 0,
    });
  } catch (e) {
    overviewError.value = e?.response?.data?.error || 'Neuspešno učitavanje pregleda';
  } finally {
    overviewLoading.value = false;
  }
}

async function fetchIncomes() {
  incomeError.value = '';
  try {
    const { data } = await api.get('/api/prihodi');
    incomes.value = data.incomes || [];
  } catch (e) {
    incomeError.value = e?.response?.data?.error || 'Neuspešno učitavanje prihoda';
  }
}

async function removeBill(bill) {
  if (!window.confirm(`Obriši stavku "${bill.name}"?`)) {
    return;
  }

  try {
    await api.delete(`/api/obaveze/${bill.id}`);
    await Promise.all([fetchBills(), fetchStats(), fetchOverview(), fetchSnapshot()]);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri brisanju stavke';
  }
}

async function markAsPaid(bill) {
  try {
    await api.post(`/api/obaveze/${bill.id}/uplate`, {
      amount_rsd: bill.amount_rsd,
      note: 'Uplata evidentirana sa pregleda',
    });
    await Promise.all([fetchBills(), fetchStats(), fetchOverview(), fetchTrends(), fetchSnapshot()]);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri evidentiranju uplate';
  }
}

async function submitIncome() {
  incomeLoading.value = true;
  incomeError.value = '';
  try {
    const payload = {
      name: incomeForm.name,
      amount_rsd: incomeForm.amount_rsd,
      recurrence: incomeForm.recurrence,
      day_of_month: incomeForm.recurrence === 'monthly' ? incomeForm.day_of_month : null,
      next_income_date: incomeForm.recurrence === 'monthly' ? null : incomeForm.next_income_date || null,
    };
    await api.post('/api/prihodi', payload);
    incomeForm.name = '';
    incomeForm.amount_rsd = '';
    incomeForm.recurrence = 'monthly';
    incomeForm.day_of_month = 1;
    incomeForm.next_income_date = '';
    await Promise.all([fetchIncomes(), fetchOverview(), fetchTrends(), fetchSnapshot()]);
  } catch (e) {
    incomeError.value = e?.response?.data?.error || 'Neuspešno čuvanje prihoda';
  } finally {
    incomeLoading.value = false;
  }
}

async function removeIncome(income) {
  if (!window.confirm(`Obriši prihod "${income.name}"?`)) {
    return;
  }

  try {
    await api.delete(`/api/prihodi/${income.id}`);
    await Promise.all([fetchIncomes(), fetchOverview(), fetchTrends(), fetchSnapshot()]);
  } catch (e) {
    incomeError.value = e?.response?.data?.error || 'Neuspešno brisanje prihoda';
  }
}

watch(snapshotMonth, () => {
  fetchSnapshot();
});

onMounted(() => {
  fetchBills();
  fetchStats();
  fetchOverview();
  fetchTrends();
  fetchSnapshot();
  fetchIncomes();
});
</script>
