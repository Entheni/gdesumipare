<template>
  <div>
    <nav class="border-b bg-white">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <router-link to="/dashboard" class="font-semibold">GdeSuMiPare</router-link>
          <router-link to="/dashboard" class="text-sm text-gray-700">Pregled</router-link>
          <router-link to="/add-bill" class="text-sm text-gray-700">Dodaj</router-link>
        </div>
        <div class="flex items-center gap-3">
          <router-link v-if="!isAuthed" to="/login" class="text-sm text-blue-700">Prijava</router-link>
          <router-link v-if="!isAuthed" to="/register" class="text-sm text-blue-700">Registracija</router-link>
          <button v-else @click="logout" class="text-sm text-red-700">Odjava</button>
        </div>
      </div>
    </nav>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { clearAuthToken } from './api/client.js';

const router = useRouter();
const isAuthed = computed(() => !!localStorage.getItem('token'));
function logout() {
  clearAuthToken();
  router.push('/login');
}
</script>

<style scoped></style>
