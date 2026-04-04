<template>
  <div class="max-w-6xl mx-auto p-6 space-y-8">
    <section class="surface-card p-8">
      <div class="max-w-3xl">
        <p class="text-sm font-semibold tracking-[0.18em] uppercase muted">Paketi</p>
        <h1 class="mt-3 text-4xl font-semibold tracking-tight">Izaberi nivo kontrole koji ti odgovara</h1>
        <p class="muted mt-3 text-base">
          Osnovni pregled troskova ostaje dostupan svima. Napredni uvidi, duza istorija i zajednicko vodjenje
          kucnih finansija idu kroz placene pakete.
        </p>
      </div>
    </section>

    <section class="grid gap-4 lg:grid-cols-3">
      <article
        v-for="plan in plans"
        :key="plan.name"
        class="surface-card p-6 flex flex-col"
        :class="plan.highlight ? 'pricing-card-highlight' : ''"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-2xl font-semibold">{{ plan.name }}</h2>
            <p class="muted mt-2 text-sm">{{ plan.tagline }}</p>
          </div>
          <span v-if="plan.highlight" class="pricing-badge">Preporuka</span>
        </div>

        <div class="mt-6">
          <div class="text-4xl font-semibold">{{ plan.price }}</div>
          <div class="muted text-sm mt-2">{{ plan.billing }}</div>
        </div>

        <ul class="mt-6 space-y-3 text-sm">
          <li v-for="item in plan.bullets" :key="item" class="flex gap-3">
            <span class="text-positive font-semibold">+</span>
            <span>{{ item }}</span>
          </li>
        </ul>

        <div class="mt-8 pt-6 border-t" style="border-color: var(--border)">
          <router-link :to="plan.ctaTo" class="btn-primary w-full text-center block">{{ plan.ctaLabel }}</router-link>
        </div>
      </article>
    </section>

    <section class="surface-card p-6">
      <div class="max-w-2xl">
        <h2 class="text-2xl font-semibold">Poredjenje funkcija</h2>
        <p class="muted mt-2 text-sm">
          Free uvodi red. Plus prodaje dublju kontrolu. Family prodaje zajednicko upravljanje kucnim finansijama.
        </p>
      </div>

      <div class="mt-6 overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left border-b muted" style="border-color: var(--border)">
              <th class="pb-4 pr-4 font-medium">Funkcija</th>
              <th class="pb-4 pr-4 font-medium">Free</th>
              <th class="pb-4 pr-4 font-medium">Plus</th>
              <th class="pb-4 font-medium">Family</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="feature in features"
              :key="feature.name"
              class="border-b"
              style="border-color: var(--border)"
            >
              <td class="py-4 pr-4">
                <div class="font-medium">{{ feature.name }}</div>
                <div v-if="feature.note" class="muted text-xs mt-1">{{ feature.note }}</div>
              </td>
              <td class="py-4 pr-4">{{ formatCell(feature.free) }}</td>
              <td class="py-4 pr-4">{{ formatCell(feature.plus) }}</td>
              <td class="py-4">{{ formatCell(feature.family) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
const plans = [
  {
    name: 'Free',
    tagline: 'Za pojedinca koji tek uvodi red u troskove, obaveze i osnovne ciljeve stednje.',
    price: '0 RSD',
    billing: 'zauvek besplatno',
    bullets: [
      'osnovni pregled prihoda i rashoda',
      'pracenje obaveza i podsetnici',
      'snapshot samo za tekuci mesec',
      'osnovni dashboard, kategorije i jedan aktivan cilj stednje',
    ],
    ctaLabel: 'Kreni besplatno',
    ctaTo: '/registracija',
  },
  {
    name: 'Plus',
    tagline: 'Za korisnika koji hoce dublju kontrolu, istoriju i ozbiljnije uvide.',
    price: '399 RSD',
    billing: 'mesecno ili 3.990 RSD godisnje',
    bullets: [
      'puna istorija snapshot-a i trendova',
      'napredni uvidi po kategorijama, mesecima i vise ciljeva stednje',
      'izvoz podataka i PDF izvestaji',
      'premium reminder i analitika sloj',
    ],
    ctaLabel: 'Izaberi Plus',
    ctaTo: '/registracija',
    highlight: true,
  },
  {
    name: 'Family',
    tagline: 'Za parove i porodice koje vode zajednicki kucni budzet.',
    price: '799 RSD',
    billing: 'mesecno ili 7.990 RSD godisnje',
    bullets: [
      'sve iz Plus paketa',
      'vise clanova domacinstva',
      'family capability spreman za shared budzet',
      'porodicni pregled troskova, ustede i buducih zajednickih ciljeva',
    ],
    ctaLabel: 'Izaberi Family',
    ctaTo: '/registracija',
  },
];

const features = [
  { name: 'Pracenje prihoda i rashoda', free: true, plus: true, family: true },
  { name: 'Obaveze i email podsetnici', free: true, plus: true, family: true },
  { name: 'Snapshot pregled', note: 'mesecni pregled planirano / placeno / ostaje', free: 'samo tekuci mesec', plus: 'puna istorija', family: 'puna istorija' },
  { name: 'Trendovi i istorija', note: 'uporedni pregled vise meseci', free: 'osnovno', plus: 'napredno', family: 'napredno' },
  { name: 'Ciljevi stednje', note: 'pracenje progresa i forecast za auto, stan ili fond', free: '1 cilj', plus: 'vise ciljeva', family: 'vise ciljeva + shared spremnost' },
  { name: 'Kategorije i analitika', free: 'osnovno', plus: 'napredno', family: 'napredno' },
  { name: 'PDF izvestaji i izvoz', free: false, plus: true, family: true },
  { name: 'Dugorocna istorija podataka', free: 'poslednja 3 meseca', plus: 'neograniceno', family: 'neograniceno' },
  { name: 'Deljeni pristup', note: 'vise korisnika u istom domacinstvu', free: false, plus: false, family: true },
  { name: 'Zajednicki budzet', free: false, plus: false, family: true },
  { name: 'AI i pametne preporuke', note: 'buduci premium sloj', free: false, plus: 'kasnije ukljuceno', family: 'kasnije ukljuceno' },
];

function formatCell(value) {
  if (value === true) return 'Da';
  if (value === false) return 'Ne';
  return value;
}
</script>
