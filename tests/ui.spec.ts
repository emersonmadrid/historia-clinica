import { test, expect, Page } from '@playwright/test'

const BASE = 'http://localhost:3000'

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', 'doctor@clinica.com')
  await page.fill('input[type="password"]', 'demo1234')
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/`, { timeout: 10000 })
}

async function goToPatientWithRecords(page: Page): Promise<string> {
  await login(page)
  const res = await page.request.get(`${BASE}/api/pacientes?search=Juan&limit=1`)
  const data = await res.json()
  const patientId = data.patients?.[0]?.id
  if (!patientId) throw new Error('No se encontró paciente "Juan" en el seed')
  await page.goto(`${BASE}/pacientes/${patientId}`)
  await page.waitForLoadState('networkidle')
  return `${BASE}/pacientes/${patientId}`
}

// ─────────────────────────────────────────────
// 1. AUTENTICACIÓN
// ─────────────────────────────────────────────
test.describe('Autenticación', () => {
  test('login page se muestra correctamente', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await expect(page).toHaveTitle(/Historia Clínica/)
    await expect(page.locator('h2')).toContainText('Iniciar Sesión')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Ingresar')
    await page.screenshot({ path: 'tests/screenshots/01-login.png', fullPage: true })
  })

  test('login exitoso redirige al dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL(`${BASE}/`)
    await expect(page.locator('text=Total Pacientes')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/02-dashboard.png', fullPage: true })
  })

  test('credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', 'noexiste@test.com')
    await page.fill('input[type="password"]', 'wrongpass')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Credenciales inválidas')).toBeVisible({ timeout: 8000 })
    await page.screenshot({ path: 'tests/screenshots/03-login-error.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 2. DASHBOARD
// ─────────────────────────────────────────────
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('KPIs principales visibles', async ({ page }) => {
    await expect(page.locator('text=Total Pacientes')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/04-dashboard-kpis.png', fullPage: true })
  })

  test('navegación lateral incluye enlace a Pacientes', async ({ page }) => {
    await expect(page.locator('nav a[href="/pacientes"]').first()).toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 3. LISTA DE PACIENTES
// ─────────────────────────────────────────────
test.describe('Lista de Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/pacientes`)
    await page.waitForLoadState('networkidle')
  })

  test('tabla carga con datos', async ({ page }) => {
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('tbody tr').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/05-pacientes-lista.png', fullPage: true })
  })

  test('cabeceras de tabla correctas', async ({ page }) => {
    await expect(page.locator('th:has-text("Paciente")')).toBeVisible()
    await expect(page.locator('th:has-text("Edad")')).toBeVisible()
    await expect(page.locator('th:has-text("Última Visita")')).toBeVisible()
    await expect(page.locator('th:has-text("Próxima Cita")')).toBeVisible()
  })

  test('contador muestra total de pacientes', async ({ page }) => {
    await expect(page.locator('text=/\\d+ pacientes registrados/')).toBeVisible()
  })

  test('botón Nuevo Paciente navega al formulario', async ({ page }) => {
    await page.locator('a[href="/pacientes/nuevo"]').click()
    await expect(page).toHaveURL(`${BASE}/pacientes/nuevo`)
  })

  test('buscador filtra pacientes por nombre', async ({ page }) => {
    await page.fill('input[placeholder*="Buscar"]', 'Juan')
    await page.waitForTimeout(600)
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
    await page.screenshot({ path: 'tests/screenshots/06-busqueda.png', fullPage: true })
  })

  test('indicador semáforo de última visita visible', async ({ page }) => {
    // El punto de color (h-2 w-2 rounded-full) debe estar en la columna Última Visita
    const dot = page.locator('tbody tr').first().locator('span.rounded-full')
    await expect(dot.first()).toBeVisible()
  })

  test('click en fila navega al perfil del paciente', async ({ page }) => {
    await page.locator('tbody tr').first().click()
    await expect(page).toHaveURL(/\/pacientes\/[a-z0-9]+$/)
    await page.screenshot({ path: 'tests/screenshots/07-perfil-desde-lista.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 4. FORMULARIO NUEVO PACIENTE
// ─────────────────────────────────────────────
test.describe('Formulario Nuevo Paciente', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/pacientes/nuevo`)
    await page.waitForLoadState('networkidle')
  })

  test('formulario muestra campos obligatorios', async ({ page }) => {
    await expect(page.locator('input[name="firstName"]')).toBeVisible()
    await expect(page.locator('input[name="lastName"]')).toBeVisible()
    await expect(page.locator('input[name="documentNumber"]')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/08-nuevo-paciente.png', fullPage: true })
  })

  test('submit vacío muestra errores de validación', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=requerido').first()).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'tests/screenshots/09-nuevo-paciente-validacion.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 5. PERFIL DE PACIENTE — nueva UX
// ─────────────────────────────────────────────
test.describe('Perfil de Paciente', () => {
  test('encabezado muestra nombre, edad y datos básicos', async ({ page }) => {
    await goToPatientWithRecords(page)
    await expect(page.locator('h1').first()).toBeVisible()
    const h1 = await page.locator('h1').first().textContent()
    expect(h1?.trim().length).toBeGreaterThan(0)
    await page.screenshot({ path: 'tests/screenshots/10-perfil-header.png', fullPage: true })
  })

  test('tabs visibles: Consultas, Antecedentes, Archivos, Perfil', async ({ page }) => {
    await goToPatientWithRecords(page)
    await expect(page.locator('[role="tab"]:has-text("Consultas")')).toBeVisible()
    await expect(page.locator('[role="tab"]:has-text("Antecedentes")')).toBeVisible()
    await expect(page.locator('[role="tab"]:has-text("Archivos")')).toBeVisible()
    await expect(page.locator('[role="tab"]:has-text("Perfil")')).toBeVisible()
  })

  test('tab Resumen ya NO existe', async ({ page }) => {
    await goToPatientWithRecords(page)
    await expect(page.locator('[role="tab"]:has-text("Resumen")')).not.toBeVisible()
  })

  test('abre por defecto en tab Consultas', async ({ page }) => {
    await goToPatientWithRecords(page)
    const consultasTab = page.locator('[role="tab"]:has-text("Consultas")')
    await expect(consultasTab).toHaveAttribute('data-state', 'active')
    await page.screenshot({ path: 'tests/screenshots/11-perfil-tab-consultas.png', fullPage: true })
  })

  test('Ficha Clínica Activa visible con sección de alergias', async ({ page }) => {
    await goToPatientWithRecords(page)
    await expect(page.locator('text=Ficha Clínica Activa')).toBeVisible()
    await expect(page.getByText('Alergias Conocidas', { exact: true })).toBeVisible()
    await expect(page.getByText('Diagnósticos Activos', { exact: true })).toBeVisible()
    await expect(page.getByText('Medicación Reciente', { exact: true })).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/12-ficha-clinica.png', fullPage: true })
  })

  test('botón + para agregar alergia rápida está en Ficha Clínica Activa', async ({ page }) => {
    await goToPatientWithRecords(page)
    // QuickAddAllergyButton: botón circular con título "Agregar alergia"
    const addBtn = page.locator('button[title="Agregar alergia"]')
    await expect(addBtn).toBeVisible()
  })

  test('botón + de alergia abre dialog', async ({ page }) => {
    await goToPatientWithRecords(page)
    await page.locator('button[title="Agregar alergia"]').click()
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 })
    await expect(page.getByText('Agregar Alergia', { exact: true }).first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/13-quick-add-alergia.png', fullPage: true })
    await page.keyboard.press('Escape')
  })

  test('tab Consultas muestra historial clínico', async ({ page }) => {
    await goToPatientWithRecords(page)
    // ya está en Consultas por defecto — el tabpanel activo debe ser visible
    const tabContent = page.locator('[role="tabpanel"][data-state="active"]')
    await expect(tabContent).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/14-tab-consultas.png', fullPage: true })
  })

  test('tab Antecedentes muestra BackgroundManager y AllergyManager', async ({ page }) => {
    await goToPatientWithRecords(page)
    await page.locator('[role="tab"]:has-text("Antecedentes")').click()
    await expect(page.locator('text=Alergias Registradas')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'tests/screenshots/15-tab-antecedentes.png', fullPage: true })
  })

  test('tab Perfil muestra información personal', async ({ page }) => {
    await goToPatientWithRecords(page)
    await page.locator('[role="tab"]:has-text("Perfil")').click()
    await expect(page.locator('text=Información Personal')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'tests/screenshots/16-tab-perfil.png', fullPage: true })
  })

  test('botón Volver regresa a lista de pacientes', async ({ page }) => {
    await goToPatientWithRecords(page)
    await page.locator('a[href="/pacientes"]').first().click()
    await expect(page).toHaveURL(`${BASE}/pacientes`)
  })

  test('menú ··· incluye opciones Editar y Exportar PDF', async ({ page }) => {
    await goToPatientWithRecords(page)
    // El MoreHorizontal está en el encabezado del paciente (primer DropdownMenu del header)
    await page.locator('button[aria-haspopup="menu"]').first().click()
    await expect(page.locator('text=Editar datos')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=Exportar PDF')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/17-menu-opciones.png', fullPage: true })
    await page.keyboard.press('Escape')
  })
})

// ─────────────────────────────────────────────
// 6. BRIEFING IA
// ─────────────────────────────────────────────
test.describe('Briefing IA', () => {
  test('briefing aparece y carga para paciente con consultas', async ({ page }) => {
    await goToPatientWithRecords(page)
    // El briefing se auto-carga — esperamos que aparezca el contenido o el loader
    const briefingSection = page.locator('text=Briefing IA')
    await expect(briefingSection).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'tests/screenshots/18-briefing-ia.png', fullPage: true })
  })

  test('briefing muestra contenido después de cargar', async ({ page }) => {
    await goToPatientWithRecords(page)
    // Espera hasta 20s para que la IA responda
    await expect(page.locator('text=/Analizando|situation|Situación|última visita/i').first()).toBeVisible({ timeout: 20000 })
    await page.screenshot({ path: 'tests/screenshots/19-briefing-cargado.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 7. NAVEGACIÓN POR URL (tab params)
// ─────────────────────────────────────────────
test.describe('Navegación por URL', () => {
  test('?tab=antecedentes abre tab Antecedentes', async ({ page }) => {
    await login(page)
    const res = await page.request.get(`${BASE}/api/pacientes?search=Juan&limit=1`)
    const data = await res.json()
    const patientId = data.patients?.[0]?.id
    await page.goto(`${BASE}/pacientes/${patientId}?tab=antecedentes`)
    await page.waitForLoadState('networkidle')
    const tab = page.locator('[role="tab"]:has-text("Antecedentes")')
    await expect(tab).toHaveAttribute('data-state', 'active')
    await page.screenshot({ path: 'tests/screenshots/20-tab-url-antecedentes.png', fullPage: true })
  })

  test('?tab=archivos abre tab Archivos', async ({ page }) => {
    await login(page)
    const res = await page.request.get(`${BASE}/api/pacientes?search=Juan&limit=1`)
    const data = await res.json()
    const patientId = data.patients?.[0]?.id
    await page.goto(`${BASE}/pacientes/${patientId}?tab=archivos`)
    await page.waitForLoadState('networkidle')
    const tab = page.locator('[role="tab"]:has-text("Archivos")')
    await expect(tab).toHaveAttribute('data-state', 'active')
  })
})

// ─────────────────────────────────────────────
// 8. NUEVA CONSULTA
// ─────────────────────────────────────────────
test.describe('Nueva Consulta', () => {
  test('formulario de nueva consulta se carga', async ({ page }) => {
    await login(page)
    const res = await page.request.get(`${BASE}/api/pacientes?search=Juan&limit=1`)
    const data = await res.json()
    const patientId = data.patients?.[0]?.id
    await page.goto(`${BASE}/pacientes/${patientId}/historia/nueva-consulta`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Motivo de Consulta')).toBeVisible()
    await expect(page.locator('text=Signos Vitales')).toBeVisible()
    await expect(page.locator('text=Formato SOAP')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/21-nueva-consulta.png', fullPage: true })
  })

  test('CIE-10 input visible con indicador IA', async ({ page }) => {
    await login(page)
    const res = await page.request.get(`${BASE}/api/pacientes?search=Juan&limit=1`)
    const data = await res.json()
    const patientId = data.patients?.[0]?.id
    await page.goto(`${BASE}/pacientes/${patientId}/historia/nueva-consulta`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=IA').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/22-cie10-input.png', fullPage: true })
  })

  test('botón Generar con IA visible en SOAP', async ({ page }) => {
    await login(page)
    const res = await page.request.get(`${BASE}/api/pacientes?search=Juan&limit=1`)
    const data = await res.json()
    const patientId = data.patients?.[0]?.id
    await page.goto(`${BASE}/pacientes/${patientId}/historia/nueva-consulta`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=Generar con IA')).toBeVisible()
  })

  test('submit sin motivo muestra validación', async ({ page }) => {
    await login(page)
    const res = await page.request.get(`${BASE}/api/pacientes?search=Juan&limit=1`)
    const data = await res.json()
    const patientId = data.patients?.[0]?.id
    await page.goto(`${BASE}/pacientes/${patientId}/historia/nueva-consulta`)
    await page.waitForLoadState('networkidle')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=requerido').first()).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'tests/screenshots/23-consulta-validacion.png', fullPage: true })
  })
})
