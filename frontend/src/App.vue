<template>
  <div class="app-shell min-h-screen">
    <nav class="app-nav border-b">
      <div class="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <router-link to="/pregled" class="text-lg font-semibold tracking-tight">GdeSuMiPare</router-link>
          <router-link v-if="!isAuthed" to="/paketi" class="nav-link">Paketi</router-link>
          <template v-if="isAuthed">
            <router-link to="/pregled" class="nav-link">Pregled</router-link>
            <router-link to="/snapshot" class="nav-link">Snapshot</router-link>
            <router-link to="/plan" class="nav-link">Plan</router-link>
            <router-link to="/ciljevi" class="nav-link">Ciljevi</router-link>
            <router-link to="/obaveze" class="nav-link">Obaveze</router-link>
            <router-link to="/prihodi" class="nav-link">Prihodi</router-link>
            <router-link to="/podesavanja" class="nav-link">Podešavanja</router-link>
          </template>
        </div>
        <div class="flex items-center gap-3">
          <router-link v-if="isAuthed" to="/obaveze/dodaj" class="btn-primary">+ Nova obaveza</router-link>
          <router-link v-if="!isAuthed" to="/prijava" class="nav-link">Prijava</router-link>
          <router-link v-if="!isAuthed" to="/registracija" class="nav-link">Registracija</router-link>
          <button v-else @click="logout" class="btn-danger">Odjava</button>
        </div>
      </div>
    </nav>
    <main class="pb-10">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import api, { clearAuthToken } from './api/client.js';
import { authToken } from './auth/session.js';
import { setThemePreference } from './theme.js';

const router = useRouter();
const isAuthed = computed(() => !!authToken.value);

function logout() {
  clearAuthToken();
  router.push('/prijava');
}

async function syncThemeFromSettings() {
  if (!authToken.value) {
    return;
  }

  try {
    const { data } = await api.get('/api/podesavanja');
    setThemePreference(data.settings.theme_preference);
  } catch {
    setThemePreference('light', { persist: false });
  }
}

onMounted(syncThemeFromSettings);
watch(authToken, (token) => {
  if (token) {
    syncThemeFromSettings();
  }
});
</script>
