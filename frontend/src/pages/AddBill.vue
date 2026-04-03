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
        <router-link to="/pregled" class="btn-secondary">Otkaži</router-link>
      </div>

      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    </form>
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

const form = reactive({
  name: '',
  category: '',
  amount_rsd: 0,
  recurrence: 'monthly',
  due_day: '',
  next_due_date: '',
  notes: '',
});

function assignBill(bill) {
  form.name = bill.name || '';
  form.category = bill.category || '';
  form.amount_rsd = Number(bill.amount_rsd || 0);
  form.recurrence = bill.recurrence || 'monthly';
  form.due_day = bill.due_day || '';
  form.next_due_date = bill.next_due_date || '';
  form.notes = bill.notes || '';
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

    router.push('/pregled');
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri čuvanju';
  } finally {
    loading.value = false;
  }
}

onMounted(loadBill);
</script>
