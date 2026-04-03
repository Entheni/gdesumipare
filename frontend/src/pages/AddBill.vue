<template>
  <div class="max-w-3xl mx-auto p-6 space-y-6">
    <div class="surface-card p-6">
      <h1 class="text-2xl font-semibold">{{ isEditing ? 'Izmeni obavezu' : 'Dodaj obavezu' }}</h1>
      <p class="muted mt-2">
        Za mesečne obaveze unesi dan u mesecu ili prvi datum dospeća. Za godišnje je potreban datum dospeća.
      </p>
    </div>

    <form @submit.prevent="submit" class="surface-card p-6 space-y-4">
      <div>
        <label class="block text-sm font-medium mb-2">Naziv</label>
        <input v-model="form.name" required class="field" />
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Kategorija</label>
        <input v-model="form.category" class="field" />
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="block text-sm font-medium mb-2">Iznos (RSD)</label>
          <input v-model.number="form.amount_rsd" type="number" min="0.01" step="0.01" required class="field" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Ponavljanje</label>
          <select v-model="form.recurrence" required class="field">
            <option value="monthly">mesečno</option>
            <option value="yearly">godišnje</option>
          </select>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <label class="block text-sm font-medium mb-2">Dan u mesecu</label>
          <input v-model.number="form.due_day" type="number" min="1" max="31" class="field" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Sledeći datum dospeća</label>
          <input v-model="form.next_due_date" type="date" class="field" />
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium mb-2">Beleške</label>
        <textarea v-model="form.notes" rows="4" class="field"></textarea>
      </div>

      <div class="flex flex-wrap gap-3">
        <button :disabled="loading" class="btn-primary">{{ loading ? 'Čuvanje...' : isEditing ? 'Sačuvaj izmene' : 'Sačuvaj' }}</button>
        <router-link to="/obaveze" class="btn-secondary">Otkaži</router-link>
      </div>

      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    </form>

    <section v-if="isEditing" class="surface-card p-6 space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Istorija uplata</h2>
          <p class="muted text-sm mt-1">Pregled svih evidentiranih uplata za ovu obavezu.</p>
        </div>
      </div>

      <form @submit.prevent="submitPayment" class="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
        <div>
          <label class="block text-sm font-medium mb-2">Iznos uplate</label>
          <input v-model.number="paymentForm.amount_rsd" type="number" min="0.01" step="0.01" class="field" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Datum dospeća koji plaćaš</label>
          <input v-model="paymentForm.due_date" type="date" class="field" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Napomena</label>
          <input v-model="paymentForm.note" class="field" />
        </div>
        <div>
          <button :disabled="paymentLoading" class="btn-primary w-full">
            {{ paymentLoading ? 'Čuvanje...' : 'Dodaj uplatu' }}
          </button>
        </div>
      </form>

      <p v-if="paymentError" class="text-red-600 text-sm">{{ paymentError }}</p>

      <div v-if="paymentsLoading" class="muted">Učitavanje uplata...</div>
      <ul v-else-if="payments.length" class="space-y-3">
        <li
          v-for="payment in payments"
          :key="payment.id"
          class="rounded-2xl border p-4"
          style="border-color: var(--border)"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="font-medium">{{ formatCurrency(payment.amount_rsd) }}</div>
              <div class="muted text-sm mt-1">plaćeno za dospeće {{ formatDate(payment.due_date) }}</div>
              <div v-if="payment.note" class="muted text-sm mt-1">{{ payment.note }}</div>
            </div>
            <div class="text-sm muted">{{ formatDateTime(payment.paid_at) }}</div>
          </div>
        </li>
      </ul>
      <div v-else class="muted">Još nema evidentiranih uplata.</div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '../api/client.js';

const route = useRoute();
const router = useRouter();
const isEditing = computed(() => Boolean(route.params.id));
const loading = ref(false);
const error = ref('');
const payments = ref([]);
const paymentsLoading = ref(false);
const paymentLoading = ref(false);
const paymentError = ref('');

const form = reactive({
  name: '',
  category: '',
  amount_rsd: 0,
  recurrence: 'monthly',
  due_day: '',
  next_due_date: '',
  notes: '',
});

const paymentForm = reactive({
  amount_rsd: 0,
  due_date: '',
  note: '',
});

function assignBill(bill) {
  form.name = bill.name || '';
  form.category = bill.category || '';
  form.amount_rsd = Number(bill.amount_rsd || 0);
  form.recurrence = bill.recurrence || 'monthly';
  form.due_day = bill.due_day || '';
  form.next_due_date = bill.next_due_date || '';
  form.notes = bill.notes || '';
  paymentForm.amount_rsd = Number(bill.amount_rsd || 0);
  paymentForm.due_date = bill.next_due_date || '';
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

async function loadPayments() {
  if (!isEditing.value) {
    return;
  }

  paymentsLoading.value = true;
  paymentError.value = '';
  try {
    const { data } = await api.get(`/api/obaveze/${route.params.id}/uplate`);
    payments.value = data.payments || [];
  } catch (e) {
    paymentError.value = e?.response?.data?.error || 'Neuspešno učitavanje uplata';
  } finally {
    paymentsLoading.value = false;
  }
}

async function loadBill() {
  if (!isEditing.value) {
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get(`/api/obaveze/${route.params.id}`);
    assignBill(data.bill);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspešno učitavanje stavke';
  } finally {
    loading.value = false;
  }
}

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const payload = {
      name: form.name,
      category: form.category || null,
      amount_rsd: form.amount_rsd,
      recurrence: form.recurrence,
      due_day: form.due_day || null,
      next_due_date: form.next_due_date || null,
      notes: form.notes || null,
    };

    if (isEditing.value) {
      await api.put(`/api/obaveze/${route.params.id}`, payload);
    } else {
      await api.post('/api/obaveze', payload);
    }

    router.push('/obaveze');
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri čuvanju';
  } finally {
    loading.value = false;
  }
}

async function submitPayment() {
  paymentLoading.value = true;
  paymentError.value = '';
  try {
    const { data } = await api.post(`/api/obaveze/${route.params.id}/uplate`, {
      amount_rsd: paymentForm.amount_rsd,
      due_date: paymentForm.due_date || null,
      note: paymentForm.note || null,
    });
    assignBill(data.bill);
    paymentForm.note = '';
    await loadPayments();
  } catch (e) {
    paymentError.value = e?.response?.data?.error || 'Neuspešno čuvanje uplate';
  } finally {
    paymentLoading.value = false;
  }
}

onMounted(async () => {
  await loadBill();
  await loadPayments();
});
</script>
