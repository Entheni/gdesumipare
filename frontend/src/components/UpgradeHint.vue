<template>
  <div class="upgrade-hint rounded-2xl border p-4" style="border-color: var(--border)">
    <div class="font-medium">{{ title }}</div>
    <p class="muted text-sm mt-2">{{ description }}</p>
    <router-link to="/paketi" class="btn-secondary mt-4 inline-flex">{{ ctaLabel }}</router-link>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: 'Otključaj napredne funkcije',
  },
  description: {
    type: String,
    default: 'Pređi na Plus paket za više istorije, filtera i detaljnijih uvida.',
  },
  ctaLabel: {
    type: String,
    default: 'Pogledaj pakete',
  },
});
</script>
