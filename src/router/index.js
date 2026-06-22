import { createRouter, createWebHashHistory } from 'vue-router'  // ← เปลี่ยน
import employees         from '../pages/employeesPage.vue'
import users             from '../pages/usersPage.vue'
import Formemployees     from '../pages/FormemployeesPage.vue'
import officersPage      from '../pages/officersPage.vue'
import documentPage      from '../pages/documentPage.vue'
import incidentPage      from '../pages/incidentPage.vue'
import PenaltyPage       from '../pages/PenaltyPage.vue'
import casesPage         from '../pages/casesPage.vue'
import FormcasesPage     from '../pages/FormcasesPage.vue'
import EmployeeSignatures from '../pages/EmployeeSignatures.vue'
import formwarning       from '../pages/formwarningPage.vue'
import verbaWarningPage  from '../pages/verbal_warningPage.vue'
import DashboardPage     from '../pages/dashboardPage.vue'
import LoginPage         from '../pages/LoginPage.vue'
import RegulationType    from '../pages/RegulationType.vue'
import AminViewLayout    from '../pages/Admin/Layouts/AminViewLayout.vue'
import CompanyPage       from '../pages/Admin/view/CompanyWithdrawal.vue'
import CompanyWithdrawalShow from '../pages/Admin/view/CompanyWithdrawalShow.vue'
import WelfareRequestShow from '../pages/Admin/view/WelfareRequestShow.vue'
import DashboardAdmin      from '../pages/Admin/view/DashboardView.vue'
import AssetRequestPage  from '../pages/Admin/view/vue_asset_requests.vue'
import WelfareRequestPage from '../pages/Admin/view/vue_welfare_requests.vue'
import EmployeeSignaturePage from '../pages/Admin/view/vue_employee_signatures.vue'
import SupervisorSignaturePage from '../pages/Admin/view/vue_supervisors.vue'
import UserLayout        from '../layouts/UserLayout.vue'

const router = createRouter({
  history: createWebHashHistory(),  // ← เปลี่ยน
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginPage,
      meta: { public: true }
    },
    // ── ระบบหลัก (ERHR) ─────────────────────────────────
    {
      path: '/',
      component: UserLayout,
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: DashboardPage
        },
        {
          path: 'employees',
          name: 'employees',
          component: employees
        },
        {
          path: 'users',
          name: 'users',
          component: users
        },
        {
          path: 'Formemp',
          name: 'Formemp',
          component: Formemployees
        },
        {
          path: 'officers',
          name: 'officers',
          component: officersPage
        },
        {
          path: 'document',
          name: 'document',
          component: documentPage
        },
        {
          path: 'incident',
          name: 'inciment',
          component: incidentPage
        },
        {
          path: 'warning-penalty',
          name: 'penalty',
          component: PenaltyPage
        },
        {
          path: 'warning-history',
          name: 'warning-history',
          component: casesPage
        },
        {
          path: 'EmpSignatures',
          name: 'EmpSignatures',
          component: EmployeeSignatures,
        },
        {
          path: 'form-discipline',
          name: 'FormcasesPage',
          component: FormcasesPage
        },
        {
          path: 'form-verbal-warning',
          name: 'formwarning',
          component: formwarning
        },
        {
          path: 'verbaWarningPage',
          name: 'verbaWarningPage',
          component: verbaWarningPage
        },
        {
          path: 'regulation-type',
          name: 'RegulationType',
          component: RegulationType
        },
      ]
    },
    // ── ระบบเบิกทรัพย์สิน (Asset Management) ───────────────
    {
      path: '/admin',
      component: AminViewLayout,
      children: [
        {
          path: 'asset-management',
          name: 'AssetManagement',
          component: DashboardAdmin
        },
        {
          path: 'company-withdrawal',
          name: 'CompanyWithdrawal',
          component: CompanyPage
        },
        {
          path: 'company-withdrawal-show',
          name: 'CompanyWithdrawalShow',
          component: CompanyWithdrawalShow
        },
        {
          path: 'welfare-request',
          name: 'WelfareRequest',
          component: () => import('../pages/Admin/view/WelfareRequest.vue')
        },
        {
          path: 'welfare-request-show',
          name: 'WelfareRequestShow',
          component: WelfareRequestShow
        },
        {
          path: 'regulation-type-asset',
          name: 'AdminRegulationAsset',
          component: AssetRequestPage
        },
        {
          path: 'regulation-type-welfare',
          name: 'AdminRegulationWelfare',
          component: WelfareRequestPage
        },
        {
          path: 'form-verbal-warning',
          name: 'AdminFormVerbalWarning',
          component: formwarning
        },
        {
          path: 'document',
          name: 'AdminDocument',
          component: SupervisorSignaturePage
        },
        {
          path: 'EmpSignatures',
          name: 'AdminEmpSignatures',
          component: EmployeeSignaturePage
        },
      ]
    },
    // ✅ catch-all → redirect ไป Dashboard
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

// ✅ Navigation Guard — ใช้ return แทน next() (แก้ Vue Router warning)
router.beforeEach((to) => {
  const SESSION_KEY = 'clinic_tdl_token'
  const raw = localStorage.getItem(SESSION_KEY)

  let session
  try {
    session = raw ? JSON.parse(raw) : null
    // ✅ Check expiration
    if (session && (!session.expireAt || Date.now() > session.expireAt)) {
      localStorage.removeItem(SESSION_KEY)
      session = null
    }
  } catch {
    session = null
  }

  const isLoggedIn = !!session && session.status === 'user'

  // หน้า public (login) → ถ้า login แล้วให้ redirect ไป Dashboard
  if (to.meta.public) {
    if (isLoggedIn) return { name: 'Dashboard' }
    return true
  }

  // หน้าอื่นๆ → ถ้ายังไม่ login ให้ไปหน้า Login
  if (!isLoggedIn) return { name: 'Login' }

  return true
})

export default router