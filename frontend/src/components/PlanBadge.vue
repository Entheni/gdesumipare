<template>
  <span class="plan-badge" :class="`plan-badge-${normalized}`">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  tier: {
    type: String,
    default: 'free',
  },
});

const normalized = computed(() => ['free', 'plus', 'family'].includes(props.tier) ? props.tier : 'free');
const label = computed(() => {
  if (normalized.value === 'plus') return 'Plus';
  if (normalized.value === 'family') return 'Family';
  return 'Free';
});
</script>
