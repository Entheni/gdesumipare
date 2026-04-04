<template>
  <div class="max-w-sm mx-auto p-6">
    <h1 class="text-2xl font-semibold mb-4">Prijava</h1>
    <form @submit.prevent="submit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Email</label>
        <input v-model="email" type="email" required class="w-full border rounded p-2" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">Lozinka</label>
        <input v-model="password" type="password" required class="w-full border rounded p-2" />
      </div>
      <button :disabled="loading" class="w-full bg-blue-600 text-white rounded p-2 disabled:opacity-50">
        {{ loading ? 'Prijavljivanje...' : 'Prijavi se' }}
      </button>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    </form>
    <p class="text-sm mt-4">Nemate nalog? <router-link to="/registracija" class="text-blue-700">Registrujte se</router-link></p>
    <p class="text-sm mt-2">Želite da vidite pakete? <router-link to="/paketi" class="text-blue-700">Pogledajte poređenje</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api, { setAuthToken } from '../api/client.js';

const router = useRouter();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.post('/api/autentikacija/prijava', {
      email: email.value,
      password: password.value,
    });
    setAuthToken(data.token);
    router.push('/pregled');
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri prijavi';
  } finally {
    loading.value = false;
  }
}
</script>
