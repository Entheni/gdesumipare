import { createRouter, createWebHistory } from 'vue-router';
import { authToken, isTokenValid } from '../auth/session.js';

const Login = () => import('../pages/Login.vue');
const Register = () => import('../pages/Register.vue');
const Dashboard = () => import('../pages/Dashboard.vue');
const AddBill = () => import('../pages/AddBill.vue');

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login, meta: { public: true } },
  { path: '/register', component: Register, meta: { public: true } },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/add-bill', component: AddBill, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const token = authToken.value;
  const isAuthed = isTokenValid(token);
  if (to.meta.requiresAuth && !isAuthed) {
    return { path: '/login' };
  }
  if (to.meta.public && isAuthed && (to.path === '/login' || to.path === '/register')) {
    return { path: '/dashboard' };
  }
  return true;
});

export default router;
