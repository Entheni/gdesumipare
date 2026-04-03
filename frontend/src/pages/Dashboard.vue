<template>
  <div class="max-w-4xl mx-auto p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold">Pregled</h1>
      <router-link to="/add-bill" class="bg-blue-600 text-white px-4 py-2 rounded">+ Nova obaveza</router-link>
    </div>
    <div class="grid md:grid-cols-2 gap-4">
      <div class="p-4 border rounded bg-white shadow-sm">
        <h2 class="font-medium mb-2">Računi / Pretplate</h2>
        <div v-if="loading">Učitavanje...</div>
        <div v-else-if="error" class="text-red-600">{{ error }}</div>
        <ul v-else class="divide-y">
          <li v-for="b in bills" :key="b.id" class="py-2 flex items-center justify-between">
            <div>
              <div class="font-medium">{{ b.name }}</div>
              <div class="text-xs text-gray-500">{{ b.category || 'Bez kategorije' }} · {{ b.recurrence }}</div>
            </div>
            <div class="text-right">
              <div class="font-semibold">{{ Number(b.amount_rsd).toFixed(2) }} RSD</div>
              <div class="text-xs text-gray-500">dan: {{ b.due_day || '-' }}</div>
            </div>
          </li>
        </ul>
      </div>

      <div class="p-4 border rounded bg-white shadow-sm">
        <h2 class="font-medium mb-2">Statistika (mesečno)</h2>
        <div v-if="statsLoading">Učitavanje...</div>
        <div v-else-if="statsError" class="text-red-600">{{ statsError }}</div>
        <ul v-else class="list-disc pl-5 text-sm">
          <li v-for="c in categories" :key="c.category">
            {{ c.category || 'Ostalo' }} - {{ Number(c.total_rsd).toFixed(2) }} RSD
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import api from '../api/client.js';

const bills = ref([]);
const loading = ref(false);
const error = ref('');

const categories = ref([]);
const statsLoading = ref(false);
const statsError = ref('');

async function fetchBills() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/api/bills');
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
    const { data } = await api.get('/api/stats/monthly');
    categories.value = data.categories || [];
  } catch (e) {
    statsError.value = e?.response?.data?.error || 'Neuspešno učitavanje statistike';
  } finally {
    statsLoading.value = false;
  }
}

onMounted(() => {
  fetchBills();
  fetchStats();
});
</script>
