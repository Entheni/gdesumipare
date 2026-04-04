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
import { computed } from 'vue';
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

const palette = ['#0f766e', '#f59e0b', '#ef4444', '#14b8a6', '#2563eb', '#84cc16', '#f97316', '#8b5cf6'];
const hasExpenseBreakdown = computed(() => props.expenseBreakdown.some((item) => Number(item.total_rsd || 0) > 0));
const hasMonthlyTotals = computed(() => props.monthlyTotals.length > 0);

const pieData = computed(() => ({
  labels: props.expenseBreakdown.map((item) => item.category),
  datasets: [
    {
      data: props.expenseBreakdown.map((item) => Number(item.total_rsd || 0)),
      backgroundColor: props.expenseBreakdown.map((_, index) => palette[index % palette.length]),
      borderWidth: 0,
    },
  ],
}));

const barData = computed(() => ({
  labels: props.monthlyTotals.map((item) => item.label),
  datasets: [
    {
      label: 'Prihodi',
      backgroundColor: '#0f766e',
      borderRadius: 8,
      data: props.monthlyTotals.map((item) => Number(item.income_rsd || 0)),
    },
    {
      label: 'Rashodi',
      backgroundColor: '#f59e0b',
      borderRadius: 8,
      data: props.monthlyTotals.map((item) => Number(item.expense_rsd || 0)),
    },
    {
      label: 'Usteda',
      backgroundColor: '#2563eb',
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
      borderColor: '#0f766e',
      backgroundColor: 'rgba(15, 118, 110, 0.12)',
      tension: 0.35,
      fill: true,
      pointRadius: 4,
    },
  ],
}));

const sharedScale = {
  grid: {
    color: 'rgba(148, 163, 184, 0.18)',
  },
  ticks: {
    color: '#64748b',
  },
};

const pieOptions = {
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
};

const barOptions = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
  scales: {
    x: sharedScale,
    y: sharedScale,
  },
};

const lineOptions = {
  maintainAspectRatio: false,
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
  scales: {
    x: sharedScale,
    y: sharedScale,
  },
};
</script>
