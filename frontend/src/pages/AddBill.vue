<template>
  <div class="max-w-md mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">Dodaj obavezu</h1>
    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Naziv</label>
        <input v-model="name" required class="w-full border rounded p-2" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Kategorija</label>
        <input v-model="category" class="w-full border rounded p-2" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Iznos (RSD)</label>
          <input v-model.number="amount_rsd" type="number" min="0" step="0.01" required class="w-full border rounded p-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Ponavljanje</label>
          <select v-model="recurrence" required class="w-full border rounded p-2">
            <option value="monthly">mesečno</option>
            <option value="yearly">godišnje</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Dan u mesecu</label>
          <input v-model.number="due_day" type="number" min="1" max="31" class="w-full border rounded p-2" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Sledeći datum dospeća</label>
          <input v-model="next_due_date" type="date" class="w-full border rounded p-2" />
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Beleške</label>
        <textarea v-model="notes" rows="3" class="w-full border rounded p-2"></textarea>
      </div>
      <button :disabled="loading" class="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50">Sačuvaj</button>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api/client.js';

const router = useRouter();
const name = ref('');
const category = ref('');
const amount_rsd = ref(0);
const recurrence = ref('monthly');
const due_day = ref('');
const next_due_date = ref('');
const notes = ref('');
const loading = ref(false);
const error = ref('');

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await api.post('/api/bills', {
      name: name.value,
      category: category.value || null,
      amount_rsd: amount_rsd.value,
      recurrence: recurrence.value,
      due_day: due_day.value || null,
      next_due_date: next_due_date.value || null,
      notes: notes.value || null,
    });
    router.push('/dashboard');
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri čuvanju';
  } finally {
    loading.value = false;
  }
}
</script>

