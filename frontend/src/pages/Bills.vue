<template>
  <div class="max-w-6xl mx-auto p-6 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Obaveze</h1>
        <p class="muted mt-1">Kompletan pregled svih obaveza, statusa i narednih akcija.</p>
      </div>
      <router-link to="/obaveze/dodaj" class="btn-primary">+ Nova obaveza</router-link>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <section class="surface-card p-5">
        <p class="muted text-sm">Ukupno obaveza</p>
        <p class="mt-3 text-3xl font-semibold">{{ overview.total_bills }}</p>
      </section>
      <section class="surface-card p-5">
        <p class="muted text-sm">Kasne</p>
        <p class="mt-3 text-3xl font-semibold text-negative">{{ overview.overdue_bills_count }}</p>
      </section>
      <section class="surface-card p-5">
        <p class="muted text-sm">Prosecno mesecno</p>
        <p class="mt-3 text-3xl font-semibold">{{ formatCurrency(overview.total_monthly_rsd) }}</p>
      </section>
    </div>

    <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <section class="surface-card p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">Sve obaveze</h2>
            <p class="muted text-sm mt-1">Izmeni, evidentiraj uplatu ili ukloni stavku iz jednog mesta.</p>
          </div>
        </div>

        <div v-if="loading" class="muted mt-4">Ucitavanje...</div>
        <div v-else-if="error" class="message-danger mt-4">{{ error }}</div>
        <div v-else-if="!bills.length" class="mt-4 muted">Jos nema unetih obaveza.</div>
        <div v-else class="mt-4 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="text-left muted border-b" style="border-color: var(--border)">
                <th class="pb-3 pr-4 font-medium">Naziv</th>
                <th class="pb-3 pr-4 font-medium">Kategorija</th>
                <th class="pb-3 pr-4 font-medium">Dospece</th>
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
                  <div class="muted text-xs mt-1">mesecno: {{ formatCurrency(bill.monthly_amount_rsd) }}</div>
                </td>
                <td class="py-4">
                  <div class="flex flex-wrap gap-3">
                    <router-link :to="`/obaveze/${bill.id}/izmeni`" class="btn-ghost">Izmeni</router-link>
                    <button class="btn-ghost text-positive" @click="markAsPaid(bill)">Evidentiraj uplatu</button>
                    <button class="btn-ghost text-negative" @click="removeBill(bill)">Obrisi</button>
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
          <ul class="mt-4 space-y-3">
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
        </section>

        <section class="surface-card p-6">
          <h2 class="text-xl font-semibold">Kategorije</h2>
          <div v-if="statsLoading" class="muted mt-4">Ucitavanje...</div>
          <div v-else-if="statsError" class="message-danger mt-4">{{ statsError }}</div>
          <ul v-else class="mt-4 space-y-3 text-sm">
            <li v-for="category in categories" :key="category.category || 'uncategorized'" class="flex items-center justify-between gap-3">
              <span>{{ category.category || 'Ostalo' }}</span>
              <span class="font-medium">{{ formatCurrency(category.total_rsd) }}</span>
            </li>
            <li v-if="!categories.length" class="muted">Jos nema kategorija.</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../api/client.js';

const bills = ref([]);
const categories = ref([]);
const loading = ref(false);
const statsLoading = ref(false);
const error = ref('');
const statsError = ref('');
const overview = reactive({
  total_monthly_rsd: 0,
  total_bills: 0,
  overdue_bills_count: 0,
  upcoming_bills: [],
});

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

function recurrenceLabel(recurrence) {
  return recurrence === 'yearly' ? 'Godisnje' : 'Mesecno';
}

function dueLabel(daysUntilDue) {
  if (daysUntilDue == null) return 'Bez datuma dospeca';
  if (daysUntilDue < 0) return `Kasni ${Math.abs(daysUntilDue)} dana`;
  if (daysUntilDue === 0) return 'Danas dospeva';
  if (daysUntilDue === 1) return 'Sutra dospeva';
  return `Za ${daysUntilDue} dana`;
}

function statusClass(bill) {
  if (bill.is_overdue) return 'status-pill-danger';
  if (bill.is_paid) return 'status-pill-positive';
  return 'status-pill-warning';
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

async function fetchStats() {
  statsLoading.value = true;
  statsError.value = '';
  try {
    const [monthly, view] = await Promise.all([
      api.get('/api/statistika/mesecno'),
      api.get('/api/statistika/pregled'),
    ]);
    categories.value = monthly.data.categories || [];
    Object.assign(overview, {
      total_monthly_rsd: view.data.total_monthly_rsd || 0,
      total_bills: view.data.total_bills || 0,
      overdue_bills_count: view.data.overdue_bills_count || 0,
      upcoming_bills: view.data.upcoming_bills || [],
    });
  } catch (e) {
    statsError.value = e?.response?.data?.error || 'Neuspesno ucitavanje statistike';
  } finally {
    statsLoading.value = false;
  }
}

async function removeBill(bill) {
  if (!window.confirm(`Obrisi stavku "${bill.name}"?`)) return;
  try {
    await api.delete(`/api/obaveze/${bill.id}`);
    await Promise.all([fetchBills(), fetchStats()]);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greska pri brisanju stavke';
  }
}

async function markAsPaid(bill) {
  try {
    await api.post(`/api/obaveze/${bill.id}/uplate`, {
      amount_rsd: bill.amount_rsd,
      note: 'Uplata evidentirana sa stranice obaveza',
    });
    await Promise.all([fetchBills(), fetchStats()]);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greska pri evidentiranju uplate';
  }
}

onMounted(() => {
  fetchBills();
  fetchStats();
});
</script>
