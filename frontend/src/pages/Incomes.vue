<template>
  <div class="max-w-5xl mx-auto p-6 space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">Prihodi</h1>
        <p class="muted mt-1">Posebno mesto za prihode, da projekcija ustede ne bude skrivena u dashboard-u.</p>
      </div>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <section class="surface-card p-5">
        <p class="muted text-sm">Mesecni prihodi</p>
        <p class="mt-3 text-3xl font-semibold text-positive">{{ formatCurrency(overview.monthly_income_rsd) }}</p>
      </section>
      <section class="surface-card p-5">
        <p class="muted text-sm">Prosecno mesecno troskovi</p>
        <p class="mt-3 text-3xl font-semibold">{{ formatCurrency(overview.total_monthly_rsd) }}</p>
      </section>
      <section class="surface-card p-5">
        <p class="muted text-sm">Projekcija ustede</p>
        <p class="mt-3 text-3xl font-semibold" :class="overview.projected_savings_rsd >= 0 ? 'text-positive' : 'text-negative'">
          {{ formatCurrency(overview.projected_savings_rsd) }}
        </p>
      </section>
    </div>

    <div class="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
      <section class="surface-card p-6">
        <h2 class="text-xl font-semibold">Dodaj prihod</h2>
        <p class="muted text-sm mt-1">Upisi redovne ili jednokratne prilive da bi mesecni pregled bio realan.</p>

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
              <option value="monthly">mesecno</option>
              <option value="yearly">godisnje</option>
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
              {{ incomeLoading ? 'Cuvanje...' : 'Dodaj prihod' }}
            </button>
            <p v-if="incomeError" class="message-danger">{{ incomeError }}</p>
          </div>
        </form>
      </section>

      <section class="surface-card p-6">
        <h2 class="text-xl font-semibold">Lista prihoda</h2>
        <div v-if="loading" class="muted mt-4">Ucitavanje...</div>
        <div v-else-if="error" class="message-danger mt-4">{{ error }}</div>
        <ul v-else class="mt-4 space-y-3">
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
                <div class="font-semibold text-positive">{{ formatCurrency(income.amount_rsd) }}</div>
                <button class="btn-ghost text-negative mt-2" @click="removeIncome(income)">Obrisi</button>
              </div>
            </div>
          </li>
          <li v-if="!incomes.length" class="muted">Jos nema unetih prihoda.</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../api/client.js';

const incomes = ref([]);
const loading = ref(false);
const error = ref('');
const incomeLoading = ref(false);
const incomeError = ref('');
const overview = reactive({
  total_monthly_rsd: 0,
  monthly_income_rsd: 0,
  projected_savings_rsd: 0,
});
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

function formatDate(value) {
  if (!value) return 'Nije definisano';
  return new Intl.DateTimeFormat('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function incomeRecurrenceLabel(income) {
  if (income.recurrence === 'yearly') {
    return `Godisnje · sledeci priliv ${formatDate(income.next_income_date)}`;
  }
  if (income.recurrence === 'one_time') {
    return `Jednokratno · ${formatDate(income.next_income_date)}`;
  }
  return income.day_of_month ? `Mesecno · oko ${income.day_of_month}. u mesecu` : 'Mesecno';
}

async function fetchIncomes() {
  loading.value = true;
  error.value = '';
  try {
    const [incomeData, view] = await Promise.all([
      api.get('/api/prihodi'),
      api.get('/api/statistika/pregled'),
    ]);
    incomes.value = incomeData.data.incomes || [];
    Object.assign(overview, {
      total_monthly_rsd: view.data.total_monthly_rsd || 0,
      monthly_income_rsd: view.data.monthly_income_rsd || 0,
      projected_savings_rsd: view.data.projected_savings_rsd || 0,
    });
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspesno ucitavanje prihoda';
  } finally {
    loading.value = false;
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
    await fetchIncomes();
  } catch (e) {
    incomeError.value = e?.response?.data?.error || 'Neuspesno cuvanje prihoda';
  } finally {
    incomeLoading.value = false;
  }
}

async function removeIncome(income) {
  if (!window.confirm(`Obrisi prihod "${income.name}"?`)) return;
  try {
    await api.delete(`/api/prihodi/${income.id}`);
    await fetchIncomes();
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspesno brisanje prihoda';
  }
}

onMounted(fetchIncomes);
</script>
