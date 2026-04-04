<template>
  <div class="theme-preview-page max-w-7xl mx-auto p-6 space-y-6">
    <section class="surface-card p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="max-w-3xl">
          <p class="theme-preview-kicker">Vizuelni pravac</p>
          <h1 class="text-3xl font-semibold tracking-tight">Preview svetle i tamne teme</h1>
          <p class="muted mt-2">Isti proizvod, dva kandidata, i za svaki po svetla i tamna varijanta.</p>
        </div>
        <router-link to="/pregled" class="btn-secondary">Nazad na aplikaciju</router-link>
      </div>
    </section>

    <section class="space-y-4">
      <div>
        <p class="theme-preview-kicker">Kandidat 1</p>
        <h2 class="text-2xl font-semibold">Paper + Ink</h2>
      </div>
      <div class="grid gap-6 xl:grid-cols-2">
        <article class="theme-preview-shell paper-ink-light">
          <header class="theme-preview-hero"><div><p class="theme-preview-label">Svetla tema</p><h3>Paper + Ink</h3><p>Papirna osnova, tinta-plava hijerarhija i hladni akcenti.</p></div><div class="theme-preview-badge">Svetla</div></header>
          <div class="theme-preview-grid">
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Mesecna usteda</span><strong>148.778 RSD</strong><span class="theme-preview-metric-note positive">Ritam stednje je zdrav i odrziv</span></article>
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Troskovi ovog meseca</span><strong>99.400 RSD</strong><span class="theme-preview-metric-note">Najveci pritisak: kirija, hrana i racuni</span></article>
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Sledece dospece</span><strong>Infostan · 8.900 RSD</strong><span class="theme-preview-metric-note warning">Za 2 dana</span></article>
          </div>
        </article>
        <article class="theme-preview-shell paper-ink-dark">
          <header class="theme-preview-hero"><div><p class="theme-preview-label">Tamna tema</p><h3>Paper + Ink</h3><p>Mirna tamna podloga sa ozbiljnim, citljivim kontrastom.</p></div><div class="theme-preview-badge">Tamna</div></header>
          <div class="theme-preview-grid">
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Mesecna usteda</span><strong>148.778 RSD</strong><span class="theme-preview-metric-note positive">Ritam stednje je zdrav i odrziv</span></article>
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Troskovi ovog meseca</span><strong>99.400 RSD</strong><span class="theme-preview-metric-note">Najveci pritisak: kirija, hrana i racuni</span></article>
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Sledece dospece</span><strong>Infostan · 8.900 RSD</strong><span class="theme-preview-metric-note warning">Za 2 dana</span></article>
          </div>
        </article>
      </div>
    </section>

    <section class="space-y-4">
      <div>
        <p class="theme-preview-kicker">Kandidat 2</p>
        <h2 class="text-2xl font-semibold">Slate + Sage</h2>
      </div>
      <div class="grid gap-6 xl:grid-cols-2">
        <article class="theme-preview-shell slate-sage-light">
          <header class="theme-preview-hero"><div><p class="theme-preview-label">Svetla tema</p><h3>Slate + Sage</h3><p>Cist i svetao prikaz sa vise modernog fintech tona.</p></div><div class="theme-preview-badge">Svetla</div></header>
          <div class="theme-preview-grid">
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Mesecna usteda</span><strong>148.778 RSD</strong><span class="theme-preview-metric-note positive">Ritam stednje je zdrav i odrziv</span></article>
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Troskovi ovog meseca</span><strong>99.400 RSD</strong><span class="theme-preview-metric-note">Najveci pritisak: kirija, hrana i racuni</span></article>
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Sledece dospece</span><strong>Infostan · 8.900 RSD</strong><span class="theme-preview-metric-note warning">Za 2 dana</span></article>
          </div>
        </article>
        <article class="theme-preview-shell slate-sage-dark">
          <header class="theme-preview-hero"><div><p class="theme-preview-label">Tamna tema</p><h3>Slate + Sage</h3><p>Tamna varijanta koja deluje moderno, ali ne agresivno.</p></div><div class="theme-preview-badge">Tamna</div></header>
          <div class="theme-preview-grid">
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Mesecna usteda</span><strong>148.778 RSD</strong><span class="theme-preview-metric-note positive">Ritam stednje je zdrav i odrziv</span></article>
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Troskovi ovog meseca</span><strong>99.400 RSD</strong><span class="theme-preview-metric-note">Najveci pritisak: kirija, hrana i racuni</span></article>
            <article class="theme-preview-card"><span class="theme-preview-metric-label">Sledece dospece</span><strong>Infostan · 8.900 RSD</strong><span class="theme-preview-metric-note warning">Za 2 dana</span></article>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.theme-preview-page { color: #1f2937; }
.theme-preview-kicker { font-size: .78rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--muted); }
.theme-preview-shell { border-radius: 2rem; padding: 1.5rem; border: 1px solid transparent; box-shadow: 0 22px 60px rgba(15, 23, 42, .08); min-height: 100%; }
.theme-preview-hero { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
.theme-preview-hero h3 { font-size: 2rem; line-height: 1.1; font-weight: 700; }
.theme-preview-hero p { margin-top: .75rem; max-width: 36rem; line-height: 1.6; }
.theme-preview-label { font-size: .78rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; opacity: .7; }
.theme-preview-badge { border-radius: 9999px; padding: .45rem .8rem; font-size: .8rem; font-weight: 700; white-space: nowrap; }
.theme-preview-grid { display: grid; gap: 1rem; margin-top: 1.5rem; }
.theme-preview-card { border-radius: 1.5rem; padding: 1.1rem 1.15rem; }
.theme-preview-metric-label { display: block; font-size: .85rem; opacity: .72; }
.theme-preview-card strong { display: block; margin-top: .6rem; font-size: 1.45rem; line-height: 1.2; }
.theme-preview-metric-note { display: inline-block; margin-top: .75rem; font-size: .85rem; font-weight: 600; }
.paper-ink-light { background: #f8f5ef; color: #1c2430; border-color: #d9d4cb; }
.paper-ink-light .theme-preview-card { background: #fffdfc; border: 1px solid #d9d4cb; }
.paper-ink-light .theme-preview-badge { background: rgba(47,93,140,.12); color: #2f5d8c; }
.paper-ink-light .theme-preview-metric-note { color: #66727d; }
.paper-ink-light .theme-preview-metric-note.positive { color: #2f8f6b; }
.paper-ink-light .theme-preview-metric-note.warning { color: #72839a; }
.paper-ink-dark { background: #10161c; color: #edf3f7; border-color: #2a3946; box-shadow: 0 22px 60px rgba(2,6,23,.4); }
.paper-ink-dark .theme-preview-card { background: #172029; border: 1px solid #2a3946; }
.paper-ink-dark .theme-preview-badge { background: rgba(118,167,216,.16); color: #76a7d8; }
.paper-ink-dark .theme-preview-metric-note { color: #97a6b2; }
.paper-ink-dark .theme-preview-metric-note.positive { color: #48b58a; }
.paper-ink-dark .theme-preview-metric-note.warning { color: #8da0b8; }
.slate-sage-light { background: #f6f7f5; color: #1b2430; border-color: #d8dee6; }
.slate-sage-light .theme-preview-card { background: #ffffff; border: 1px solid #d8dee6; }
.slate-sage-light .theme-preview-badge { background: rgba(67,108,158,.12); color: #436c9e; }
.slate-sage-light .theme-preview-metric-note { color: #6b7785; }
.slate-sage-light .theme-preview-metric-note.positive { color: #5c8a72; }
.slate-sage-light .theme-preview-metric-note.warning { color: #8fa1b8; }
.slate-sage-dark { background: #11161c; color: #edf2f7; border-color: #2a3642; box-shadow: 0 22px 60px rgba(2,6,23,.4); }
.slate-sage-dark .theme-preview-card { background: #182029; border: 1px solid #2a3642; }
.slate-sage-dark .theme-preview-badge { background: rgba(122,166,216,.16); color: #7aa6d8; }
.slate-sage-dark .theme-preview-metric-note { color: #98a5b3; }
.slate-sage-dark .theme-preview-metric-note.positive { color: #78b091; }
.slate-sage-dark .theme-preview-metric-note.warning { color: #97a8bc; }
</style>
