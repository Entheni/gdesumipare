<template>
  <div class="max-w-4xl mx-auto p-6 space-y-6">
    <div class="surface-card p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold">Podešavanja</h1>
          <p class="muted mt-2">Profil, bezbednost, podsetnici i paket su razdvojeni po tabovima da ekran ostane pregledan.</p>
        </div>
        <PlanBadge :tier="form.subscription_tier" />
      </div>
    </div>

    <div class="surface-card p-6">
      <div class="settings-tabs mb-6">
        <button type="button" class="tab-chip" :class="{ active: activeTab === 'profil' }" @click="activeTab = 'profil'">Profil</button>
        <button type="button" class="tab-chip" :class="{ active: activeTab === 'bezbednost' }" @click="activeTab = 'bezbednost'">Bezbednost</button>
        <button type="button" class="tab-chip" :class="{ active: activeTab === 'podsetnici' }" @click="activeTab = 'podsetnici'">Podsetnici</button>
        <button type="button" class="tab-chip" :class="{ active: activeTab === 'paket' }" @click="activeTab = 'paket'">Paket</button>
        <button type="button" class="tab-chip" :class="{ active: activeTab === 'izgled' }" @click="activeTab = 'izgled'">Izgled</button>
      </div>

      <form v-if="activeTab === 'profil'" @submit.prevent="saveProfile" class="space-y-6">
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Profil</h2>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="block text-sm font-medium mb-2">Ime za prikaz</label>
              <input v-model="profileForm.display_name" class="field" />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Email</label>
              <input v-model="profileForm.email" type="email" class="field" required />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button :disabled="profileSaving" class="btn-primary">
            {{ profileSaving ? 'Čuvanje...' : 'Sačuvaj profil' }}
          </button>
        </div>
      </form>

      <form v-if="activeTab === 'bezbednost'" @submit.prevent="changePassword" class="space-y-6">
        <div class="space-y-3">
          <h2 class="text-lg font-semibold">Bezbednost</h2>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="block text-sm font-medium mb-2">Trenutna lozinka</label>
              <input v-model="passwordForm.current_password" type="password" class="field" required />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Nova lozinka</label>
              <input v-model="passwordForm.new_password" type="password" class="field" required />
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button :disabled="passwordSaving" class="btn-secondary">
            {{ passwordSaving ? 'Čuvanje...' : 'Promeni lozinku' }}
          </button>
        </div>
      </form>

      <form v-if="activeTab === 'podsetnici'" @submit.prevent="saveSettings" class="space-y-6">
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

        <div class="flex flex-wrap items-center gap-3">
          <button :disabled="saving" class="btn-primary">
            {{ saving ? 'Čuvanje...' : 'Sačuvaj podsetnike' }}
          </button>
          <button type="button" :disabled="runningReminders" class="btn-secondary" @click="runRemindersNow">
            {{ runningReminders ? 'Pokretanje...' : 'Pokreni podsetnike sada' }}
          </button>
        </div>

        <p v-if="success" class="text-sm text-emerald-600">{{ success }}</p>
        <p v-if="runResult" class="text-sm text-blue-600">{{ runResult }}</p>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      </form>

      <form v-if="activeTab === 'paket'" @submit.prevent="savePlan" class="space-y-6">
        <div class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <section class="rounded-3xl border p-5" style="border-color: var(--border)">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 class="text-lg font-semibold">Aktivni paket</h2>
                <p class="muted text-sm mt-1">Za sada je ovo interni izbor nivoa korisnika, bez payment integracije.</p>
              </div>
              <PlanBadge :tier="form.subscription_tier" />
            </div>

            <div class="mt-5 grid gap-3">
              <label
                v-for="plan in plans"
                :key="plan.value"
                class="plan-option"
                :class="{ active: form.subscription_tier === plan.value }"
              >
                <input v-model="form.subscription_tier" type="radio" :value="plan.value" class="sr-only" />
                <div class="font-medium">{{ plan.label }}</div>
                <div class="muted text-sm mt-1">{{ plan.description }}</div>
              </label>
            </div>

            <div class="flex flex-wrap items-center gap-3 mt-5">
              <button :disabled="saving" class="btn-primary">
                {{ saving ? 'Čuvanje...' : 'Sačuvaj paket' }}
              </button>
              <RouterLink to="/paketi" class="btn-secondary">Pogledaj pakete</RouterLink>
            </div>
          </section>

          <section class="rounded-3xl border p-5" style="border-color: var(--border)">
            <h2 class="text-lg font-semibold">Šta je trenutno otključano</h2>
            <div class="mt-5 space-y-3">
              <div v-for="item in capabilityList" :key="item.key" class="capability-row" :class="{ disabled: !item.enabled }">
                <div>
                  <div class="font-medium">{{ item.title }}</div>
                  <div class="muted text-sm mt-1">{{ item.description }}</div>
                </div>
                <span class="text-sm font-semibold">{{ item.enabled ? 'Dostupno' : 'Zaključano' }}</span>
              </div>
            </div>
          </section>
        </div>

        <p v-if="success" class="text-sm text-emerald-600">{{ success }}</p>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      </form>

      <form v-if="activeTab === 'izgled'" @submit.prevent="saveSettings" class="space-y-6">
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
            {{ saving ? 'Čuvanje...' : 'Sačuvaj izgled' }}
          </button>
        </div>

        <p v-if="success" class="text-sm text-emerald-600">{{ success }}</p>
        <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';
import api from '../api/client.js';
import PlanBadge from '../components/PlanBadge.vue';
import { setThemePreference } from '../theme.js';

const form = reactive({
  email: '',
  display_name: '',
  reminders_enabled: true,
  reminder_days: 3,
  theme_preference: 'system',
  subscription_tier: 'free',
});
const profileForm = reactive({
  email: '',
  display_name: '',
});
const passwordForm = reactive({
  current_password: '',
  new_password: '',
});
const capabilities = reactive({
  tier: 'free',
  can_use_current_snapshot: true,
  can_use_snapshot_history: false,
  can_use_advanced_charts: false,
  can_use_exports: false,
  can_use_household_features: false,
});
const plans = [
  {
    value: 'free',
    label: 'Free',
    description: 'Osnovni pregled troskova, prihoda i tekuci snapshot.',
  },
  {
    value: 'plus',
    label: 'Plus',
    description: 'Istorija snapshot-a, napredni grafovi i detaljniji filteri.',
  },
  {
    value: 'family',
    label: 'Family',
    description: 'Sve iz Plus paketa uz household capability za zajednicki budzet.',
  },
];

const saving = ref(false);
const profileSaving = ref(false);
const passwordSaving = ref(false);
const runningReminders = ref(false);
const error = ref('');
const success = ref('');
const runResult = ref('');
const activeTab = ref('profil');

const capabilityList = computed(() => [
  {
    key: 'snapshot',
    title: 'Istorija snapshot-a',
    description: 'Pregled i prethodnih meseci, ne samo tekuceg.',
    enabled: capabilities.can_use_snapshot_history,
  },
  {
    key: 'charts',
    title: 'Napredni grafovi i filteri',
    description: 'Vise meseci, gasenje kategorija i igranje sa prikazima.',
    enabled: capabilities.can_use_advanced_charts,
  },
  {
    key: 'exports',
    title: 'Izvoz i izvestaji',
    description: 'Priprema za PDF i napredni eksport podataka.',
    enabled: capabilities.can_use_exports,
  },
  {
    key: 'household',
    title: 'Porodicni i shared pristup',
    description: 'Capability za buduci zajednicki budzet domacinstva.',
    enabled: capabilities.can_use_household_features,
  },
]);

function applyCapabilities(nextCapabilities = {}) {
  Object.assign(capabilities, {
    tier: nextCapabilities.tier || form.subscription_tier || 'free',
    can_use_current_snapshot: nextCapabilities.can_use_current_snapshot !== false,
    can_use_snapshot_history: !!nextCapabilities.can_use_snapshot_history,
    can_use_advanced_charts: !!nextCapabilities.can_use_advanced_charts,
    can_use_exports: !!nextCapabilities.can_use_exports,
    can_use_household_features: !!nextCapabilities.can_use_household_features,
  });
}

async function loadSettings() {
  error.value = '';
  try {
    const { data } = await api.get('/api/podesavanja');
    Object.assign(form, data.settings);
    applyCapabilities(data.capabilities);
    Object.assign(profileForm, {
      email: data.settings.email || '',
      display_name: data.settings.display_name || '',
    });
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
    applyCapabilities(data.capabilities);
    setThemePreference(data.settings.theme_preference);
    success.value = 'Podešavanja su sačuvana.';
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri čuvanju podešavanja';
  } finally {
    saving.value = false;
  }
}

async function saveProfile() {
  profileSaving.value = true;
  error.value = '';
  success.value = '';
  try {
    const { data } = await api.put('/api/podesavanja/profil', {
      email: profileForm.email,
      display_name: profileForm.display_name || null,
    });
    Object.assign(form, data.settings);
    Object.assign(profileForm, {
      email: data.settings.email || '',
      display_name: data.settings.display_name || '',
    });
    success.value = 'Profil je sačuvan.';
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri čuvanju profila';
  } finally {
    profileSaving.value = false;
  }
}

async function savePlan() {
  saving.value = true;
  error.value = '';
  success.value = '';
  try {
    const { data } = await api.put('/api/podesavanja', {
      subscription_tier: form.subscription_tier,
    });
    Object.assign(form, data.settings);
    applyCapabilities(data.capabilities);
    success.value = 'Paket je sačuvan.';
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri čuvanju paketa';
  } finally {
    saving.value = false;
  }
}

async function changePassword() {
  passwordSaving.value = true;
  error.value = '';
  success.value = '';
  try {
    const { data } = await api.put('/api/podesavanja/lozinka', {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    });
    passwordForm.current_password = '';
    passwordForm.new_password = '';
    success.value = data.message || 'Lozinka je promenjena.';
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri promeni lozinke';
  } finally {
    passwordSaving.value = false;
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
