<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Mesecni snapshot</h1>
        <p class="muted mt-1">Jedan mesec, jedna slika: prihodi, obaveze, placeno, ostaje i projekcija ustede.</p>
      </div>
      <label class="text-sm">
        <span class="block font-medium mb-2">Mesec</span>
        <input v-model="snapshotMonth" type="month" class="field min-w-[180px]" />
      </label>
    </div>

    <section class="surface-card p-6">
      <div v-if="loading" class="muted">Ucitavanje snapshot pregleda...</div>
      <div v-else-if="error" class="text-red-600">{{ error }}</div>
      <div v-else class="space-y-6">
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
                <h2 class="text-xl font-semibold">Obaveze u izabranom mesecu</h2>
                <p class="muted text-sm mt-1">Pregled svega sto treba da se pokrije u ovom periodu.</p>
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
                    <span class="inline-flex rounded-full px-3 py-1 text-xs font-medium mt-2" :class="statusClass(item)">
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
                <h2 class="text-xl font-semibold">Prihodi u izabranom mesecu</h2>
                <p class="muted text-sm mt-1">Koliko novca ulazi i koliko prostora ostaje nakon obaveza.</p>
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
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import api from '../api/client.js';

const snapshotMonth = ref(currentMonthKey());
const loading = ref(false);
const error = ref('');
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

async function fetchSnapshot() {
  loading.value = true;
  error.value = '';
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
    error.value = e?.response?.data?.error || 'Neuspesno ucitavanje snapshot pregleda';
  } finally {
    loading.value = false;
  }
}

watch(snapshotMonth, fetchSnapshot);
onMounted(fetchSnapshot);
</script>
