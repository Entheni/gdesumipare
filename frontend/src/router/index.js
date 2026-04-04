import { createRouter, createWebHistory } from 'vue-router';
import { authToken, isTokenValid } from '../auth/session.js';

const Login = () => import('../pages/Login.vue');
const Register = () => import('../pages/Register.vue');
const Pricing = () => import('../pages/Pricing.vue');
const Overview = () => import('../pages/Overview.vue');
const Snapshot = () => import('../pages/Snapshot.vue');
const Goals = () => import('../pages/Goals.vue');
const Bills = () => import('../pages/Bills.vue');
const Incomes = () => import('../pages/Incomes.vue');
const AddBill = () => import('../pages/AddBill.vue');
const Settings = () => import('../pages/Settings.vue');
const ThemePreview = () => import('../pages/ThemePreview.vue');

const routes = [
  { path: '/', redirect: '/pregled' },
  { path: '/prijava', component: Login, meta: { public: true } },
  { path: '/registracija', component: Register, meta: { public: true } },
  { path: '/paketi', component: Pricing, meta: { public: true } },
  { path: '/preview-teme', component: ThemePreview, meta: { requiresAuth: true } },
  { path: '/pregled', component: Overview, meta: { requiresAuth: true } },
  { path: '/snapshot', component: Snapshot, meta: { requiresAuth: true } },
  { path: '/ciljevi', component: Goals, meta: { requiresAuth: true } },
  { path: '/obaveze', component: Bills, meta: { requiresAuth: true } },
  { path: '/prihodi', component: Incomes, meta: { requiresAuth: true } },
  { path: '/obaveze/dodaj', component: AddBill, meta: { requiresAuth: true } },
  { path: '/obaveze/:id/izmeni', component: AddBill, meta: { requiresAuth: true } },
  { path: '/podesavanja', component: Settings, meta: { requiresAuth: true } },
  { path: '/login', redirect: '/prijava' },
  { path: '/register', redirect: '/registracija' },
  { path: '/pricing', redirect: '/paketi' },
  { path: '/dashboard', redirect: '/pregled' },
  { path: '/snapshot-view', redirect: '/snapshot' },
  { path: '/goals', redirect: '/ciljevi' },
  { path: '/bills', redirect: '/obaveze' },
  { path: '/incomes', redirect: '/prihodi' },
  { path: '/add-bill', redirect: '/obaveze/dodaj' },
  { path: '/bills/:id/edit', redirect: (to) => `/obaveze/${to.params.id}/izmeni` },
  { path: '/settings', redirect: '/podesavanja' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = authToken.value;
  const isAuthed = isTokenValid(token);
  if (to.meta.requiresAuth && !isAuthed) {
    return { path: '/prijava' };
  }
  if (to.meta.public && isAuthed && (to.path === '/prijava' || to.path === '/registracija')) {
    return { path: '/pregled' };
  }
  return true;
});

export default router;
