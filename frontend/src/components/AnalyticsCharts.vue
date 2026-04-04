<template>
  <div class="grid gap-4" :class="chartView === 'rashodi' ? '' : 'xl:grid-cols-[1fr_1fr]'">
    <section v-if="chartView === 'rashodi'" class="surface-card p-5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold">Raspodela rashoda</h3>
          <p class="muted text-sm mt-1">Kategorije koje najvise pritiskaju budzet.</p>
        </div>
      </div>
      <div v-if="hasExpenseBreakdown" class="mt-4 h-[320px]">
        <Pie :data="pieData" :options="pieOptions" />
      </div>
      <p v-else class="muted mt-4">Nema dovoljno podataka za prikaz rashoda u izabranom periodu.</p>
    </section>

    <section v-else-if="chartView === 'tok'" class="surface-card p-5 xl:col-span-2">
      <div>
        <h3 class="text-lg font-semibold">Prihod / rashod / usteda</h3>
        <p class="muted text-sm mt-1">Pregled po mesecima za izabrani period.</p>
      </div>
      <div v-if="hasMonthlyTotals" class="mt-4 h-[320px]">
        <Bar :data="barData" :options="barOptions" />
      </div>
      <p v-else class="muted mt-4">Nema dovoljno podataka za uporedni tok u izabranom periodu.</p>
    </section>

    <section v-else class="surface-card p-5 xl:col-span-2">
      <div>
        <h3 class="text-lg font-semibold">Kretanje ustede</h3>
        <p class="muted text-sm mt-1">Da li ostaje vise ili manje kroz vreme.</p>
      </div>
      <div v-if="hasMonthlyTotals" class="mt-4 h-[320px]">
        <Line :data="lineData" :options="lineOptions" />
      </div>
      <p v-else class="muted mt-4">Nema dovoljno podataka za prikaz kretanja ustede.</p>
    </section>
  </div>
</template>

<script setup>
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Bar, Line, Pie } from 'vue-chartjs';

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, LineElement, PointElement, Title, Tooltip, Filler);

const props = defineProps({
  expenseBreakdown: {
    type: Array,
    default: () => [],
  },
  monthlyTotals: {
    type: Array,
    default: () => [],
  },
  chartView: {
    type: String,
    default: 'tok',
  },
});

const themeColors = ref(readThemeColors());
const hasExpenseBreakdown = computed(() => props.expenseBreakdown.some((item) => Number(item.total_rsd || 0) > 0));
const hasMonthlyTotals = computed(() => props.monthlyTotals.length > 0);

function readThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    primary: styles.getPropertyValue('--primary').trim() || '#436c9e',
    primaryStrong: styles.getPropertyValue('--primary-strong').trim() || '#355781',
    accent: styles.getPropertyValue('--accent').trim() || '#5c8a72',
    accentStrong: styles.getPropertyValue('--accent-strong').trim() || '#4d765f',
    warning: styles.getPropertyValue('--warning').trim() || '#7d8da6',
    danger: styles.getPropertyValue('--danger').trim() || '#c4584d',
    text: styles.getPropertyValue('--text').trim() || '#1b2430',
    border: styles.getPropertyValue('--border').trim() || '#d8dee6',
  };
}

function syncThemeColors() {
  themeColors.value = readThemeColors();
}

const palette = computed(() => [
  themeColors.value.primary,
  themeColors.value.accent,
  themeColors.value.warning,
  themeColors.value.primaryStrong,
  themeColors.value.accentStrong,
  themeColors.value.danger,
  '#89a8c8',
  '#91b89d',
]);

const pieData = computed(() => ({
  labels: props.expenseBreakdown.map((item) => item.category),
  datasets: [
    {
      data: props.expenseBreakdown.map((item) => Number(item.total_rsd || 0)),
      backgroundColor: props.expenseBreakdown.map((_, index) => palette.value[index % palette.value.length]),
      borderWidth: 0,
    },
  ],
}));

const barData = computed(() => ({
  labels: props.monthlyTotals.map((item) => item.label),
  datasets: [
    {
      label: 'Prihodi',
      backgroundColor: themeColors.value.accent,
      borderRadius: 8,
      data: props.monthlyTotals.map((item) => Number(item.income_rsd || 0)),
    },
    {
      label: 'Rashodi',
      backgroundColor: themeColors.value.warning,
      borderRadius: 8,
      data: props.monthlyTotals.map((item) => Number(item.expense_rsd || 0)),
    },
    {
      label: 'Usteda',
      backgroundColor: themeColors.value.primary,
      borderRadius: 8,
      data: props.monthlyTotals.map((item) => Number(item.savings_rsd || 0)),
    },
  ],
}));

const lineData = computed(() => ({
  labels: props.monthlyTotals.map((item) => item.label),
  datasets: [
    {
      label: 'Usteda',
      data: props.monthlyTotals.map((item) => Number(item.savings_rsd || 0)),
      borderColor: themeColors.value.primary,
      backgroundColor: `${themeColors.value.primary}1f`,
      tension: 0.35,
      fill: true,
      pointRadius: 4,
    },
  ],
}));

const sharedScale = computed(() => ({
  grid: {
    color: `${themeColors.value.border}88`,
  },
  ticks: {
    color: themeColors.value.text,
  },
}));

const pieOptions = computed(() => ({
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: themeColors.value.text,
      },
    },
  },
}));

const barOptions = computed(() => ({
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: themeColors.value.text,
      },
    },
  },
  scales: {
    x: sharedScale.value,
    y: sharedScale.value,
  },
}));

const lineOptions = computed(() => ({
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: themeColors.value.text,
      },
    },
  },
  scales: {
    x: sharedScale.value,
    y: sharedScale.value,
  },
}));

onMounted(() => {
  syncThemeColors();
  window.addEventListener('gsp-theme-change', syncThemeColors);
});

onBeforeUnmount(() => {
  window.removeEventListener('gsp-theme-change', syncThemeColors);
});
</script>
