<template>
  <div class="max-w-md mx-auto p-6">
    <div class="surface-card p-8">
      <p class="text-sm font-semibold uppercase tracking-[0.16em] muted">Registracija</p>
      <h1 class="text-3xl font-semibold tracking-tight mt-3">Postavi sistem za obaveze i štednju</h1>
      <p class="muted mt-2 text-sm">Napravite nalog i odmah dobijate pregled rashoda, prihoda i ciljeva na jednom mestu.</p>

      <form @submit.prevent="submit" class="space-y-4 mt-6">
        <div>
          <label class="block text-sm font-medium mb-2">Email</label>
          <input v-model="email" type="email" required class="field" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Lozinka</label>
          <input v-model="password" type="password" required class="field" />
        </div>
        <button :disabled="loading" class="btn-primary w-full justify-center">
          {{ loading ? 'Kreiranje...' : 'Kreiraj nalog' }}
        </button>
        <p v-if="error" class="message-danger">{{ error }}</p>
      </form>

      <div class="space-y-2 text-sm mt-6">
        <p>Već imate nalog? <router-link to="/prijava" class="text-accent font-medium">Prijavite se</router-link></p>
        <p>Pre registracije pogledajte <router-link to="/paketi" class="text-accent font-medium">pakete i poređenje opcija</router-link>.</p>
      </div>
    </div>
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
    await api.post('/api/autentikacija/registracija', {
      email: email.value,
      password: password.value,
    });
    const { data } = await api.post('/api/autentikacija/prijava', {
      email: email.value,
      password: password.value,
    });
    setAuthToken(data.token);
    router.push('/pregled');
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri registraciji';
  } finally {
    loading.value = false;
  }
}
</script>
