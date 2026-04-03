<template>
  <div class="max-w-3xl mx-auto p-6 space-y-6">
    <div class="surface-card p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Podešavanja</h1>
          <p class="muted mt-2">Kontroliši temu aplikacije i email podsetnike za obaveze koje uskoro dospevaju.</p>
        </div>
      </div>
    </div>

    <div class="surface-card p-6">
      <form @submit.prevent="saveSettings" class="space-y-6">
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Email podsetnici</h2>
          <label class="flex items-start gap-3">
            <input v-model="form.reminders_enabled" type="checkbox" class="mt-1 h-4 w-4 rounded border-slate-400" />
            <span>
              <span class="block font-medium">Uključi podsetnike</span>
              <span class="muted text-sm">Aplikacija može poslati email nekoliko dana pre dospeća računa.</span>
            </span>
          </label>

          <div>
            <label class="block text-sm font-medium mb-2">Koliko dana unapred</label>
            <input
              v-model.number="form.reminder_days"
              :disabled="!form.reminders_enabled"
              type="number"
              min="0"
              max="30"
              class="field w-32"
            />
          </div>
        </div>

        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Izgled</h2>
          <div>
            <label class="block text-sm font-medium mb-2">Tema</label>
            <select v-model="form.theme_preference" class="field w-full max-w-xs">
              <option value="system">Prati sistem</option>
              <option value="light">Svetla</option>
              <option value="dark">Tamna</option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button :disabled="saving" class="btn-primary">
            {{ saving ? 'Čuvanje...' : 'Sačuvaj podešavanja' }}
          </button>
          <button type="button" :disabled="runningReminders" class="btn-secondary" @click="runRemindersNow">
            {{ runningReminders ? 'Pokretanje...' : 'Pokreni podsetnike sada' }}
          </button>
        </div>

        <p v-if="success" class="text-sm text-emerald-600">{{ success }}</p>
        <p v-if="runResult" class="text-sm text-blue-600">{{ runResult }}</p>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import api from '../api/client.js';
import { setThemePreference } from '../theme.js';

const form = reactive({
  reminders_enabled: true,
  reminder_days: 3,
  theme_preference: 'system',
});

const saving = ref(false);
const runningReminders = ref(false);
const error = ref('');
const success = ref('');
const runResult = ref('');

async function loadSettings() {
  error.value = '';
  try {
    const { data } = await api.get('/api/podesavanja');
    Object.assign(form, data.settings);
    setThemePreference(data.settings.theme_preference);
  } catch (e) {
    error.value = e?.response?.data?.error || 'Neuspešno učitavanje podešavanja';
  }
}

async function saveSettings() {
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    const payload = {
      reminders_enabled: form.reminders_enabled,
      reminder_days: form.reminder_days,
      theme_preference: form.theme_preference,
    };
    const { data } = await api.put('/api/podesavanja', payload);
    Object.assign(form, data.settings);
    setThemePreference(data.settings.theme_preference);
    success.value = 'Podešavanja su sačuvana.';
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri čuvanju podešavanja';
  } finally {
    saving.value = false;
  }
}

async function runRemindersNow() {
  runningReminders.value = true;
  error.value = '';
  runResult.value = '';
  try {
    const { data } = await api.post('/api/podsetnici/pokreni');
    runResult.value = data.sent_count
      ? `Poslato podsetnika: ${data.sent_count}.`
      : 'Nema podsetnika za slanje u ovom trenutku.';
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri pokretanju podsetnika';
  } finally {
    runningReminders.value = false;
  }
}

onMounted(loadSettings);
</script>
