import { createRouter, createWebHistory } from 'vue-router';
import { authToken, isTokenValid } from '../auth/session.js';

const Login = () => import('../pages/Login.vue');
const Register = () => import('../pages/Register.vue');
const Dashboard = () => import('../pages/Dashboard.vue');
const AddBill = () => import('../pages/AddBill.vue');
const Settings = () => import('../pages/Settings.vue');

const routes = [
  { path: '/', redirect: '/pregled' },
  { path: '/prijava', component: Login, meta: { public: true } },
  { path: '/registracija', component: Register, meta: { public: true } },
  { path: '/pregled', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/obaveze/dodaj', component: AddBill, meta: { requiresAuth: true } },
  { path: '/obaveze/:id/izmeni', component: AddBill, meta: { requiresAuth: true } },
  { path: '/podesavanja', component: Settings, meta: { requiresAuth: true } },
  { path: '/login', redirect: '/prijava' },
  { path: '/register', redirect: '/registracija' },
  { path: '/dashboard', redirect: '/pregled' },
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
