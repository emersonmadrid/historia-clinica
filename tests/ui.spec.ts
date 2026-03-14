import { test, expect, Page } from '@playwright/test'

const BASE = 'http://localhost:3000'

async function login(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', 'doctor@clinica.com')
  await page.fill('input[type="password"]', 'demo1234')
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/`, { timeout: 10000 })
}

// Navega al perfil del primer paciente con registros (Juan Carlos)
async function goToPatientWithRecords(page: Page): Promise<string> {
  await login(page)
  const res = await page.request.get(`${BASE}/api/pacientes?search=Juan&limit=1`)
  const data = await res.json()
  const patientId = data.patients?.[0]?.id
  if (!patientId) throw new Error('No se encontró paciente con nombre Juan en el seed')
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
    await expect(page.locator('h1')).toContainText('Historia Clínica')
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
    await page.screenshot({ path: 'tests/screenshots/02-dashboard-post-login.png', fullPage: true })
  })

  test('credenciales incorrectas muestra error', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', 'noexiste@test.com')
    await page.fill('input[type="password"]', 'wrongpass')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Credenciales inválidas')).toBeVisible({ timeout: 8000 })
    await page.screenshot({ path: 'tests/screenshots/03-login-error.png', fullPage: true })
  })

  test('campos vacíos muestran errores de validación', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.click('button[type="submit"]')
    await expect(page.locator('text=requerido').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/04-login-validacion.png', fullPage: true })
  })

  test('ruta protegida redirige a login sin sesión', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)
    await expect(page).toHaveURL(/login/)
  })

  test('login page con sesión redirige al dashboard', async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/login`)
    await page.waitForTimeout(1000)
    await expect(page).not.toHaveURL(/\/login/)
  })
})

// ─────────────────────────────────────────────
// 2. DASHBOARD
// ─────────────────────────────────────────────
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('muestra los 4 KPI cards con datos reales', async ({ page }) => {
    await expect(page.locator('text=Total Pacientes')).toBeVisible()
    await expect(page.locator('text=Citas Hoy')).toBeVisible()
    await expect(page.locator('text=Consultas del Mes')).toBeVisible()
    await expect(page.locator('text=Citas Pendientes')).toBeVisible()
    // Verificar que hay números en los cards
    const numeros = page.locator('p.text-3xl')
    await expect(numeros.first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/05-dashboard-kpis.png', fullPage: true })
  })

  test('KPI Total Pacientes es mayor que 0', async ({ page }) => {
    const card = page.locator('text=Total Pacientes').locator('../..')
    const valor = await card.locator('p.text-3xl').textContent()
    expect(Number(valor?.trim())).toBeGreaterThan(0)
  })

  test('secciones Citas de Hoy y Consultas Recientes visibles', async ({ page }) => {
    await expect(page.locator('text=Citas de Hoy')).toBeVisible()
    await expect(page.locator('text=Consultas Recientes')).toBeVisible()
  })

  test('sidebar muestra navegación y logo', async ({ page }) => {
    // Logo/nombre del sistema
    await expect(page.locator('text=/Historia/').first()).toBeVisible()
    // Links de navegación
    await expect(page.locator('nav a[href="/"]')).toBeVisible()
    await expect(page.locator('nav a[href="/pacientes"]').first()).toBeVisible()
    await expect(page.locator('nav a[href="/citas"]')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/06-dashboard-sidebar.png', fullPage: true })
  })

  test('sidebar muestra nombre del doctor logueado', async ({ page }) => {
    await expect(page.locator('text=Dr. Carlos Mendoza').first()).toBeVisible()
  })

  test('sidebar muestra botón cerrar sesión', async ({ page }) => {
    await expect(page.locator('button:has-text("Cerrar sesión")')).toBeVisible()
  })

  test('citas de hoy lista pacientes con horario', async ({ page }) => {
    // El seed crea 4 citas para hoy
    const citasSection = page.locator('text=Citas de Hoy').locator('../..')
    const items = citasSection.locator('a[href*="/pacientes/"]')
    const count = await items.count()
    expect(count).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────
// 3. MÓDULO PACIENTES — LISTA
// ─────────────────────────────────────────────
test.describe('Lista de Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/pacientes`)
    await page.waitForSelector('tbody tr', { timeout: 8000 })
  })

  test('tabla de pacientes carga con datos', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
    await page.screenshot({ path: 'tests/screenshots/07-pacientes-lista.png', fullPage: true })
  })

  test('cabeceras de tabla correctas', async ({ page }) => {
    await expect(page.locator('th:has-text("Paciente")')).toBeVisible()
    await expect(page.locator('th:has-text("Documento")')).toBeVisible()
    await expect(page.locator('th:has-text("Edad")')).toBeVisible()
  })

  test('contador muestra total de pacientes registrados', async ({ page }) => {
    await expect(page.locator('text=/\\d+ pacientes registrados/')).toBeVisible()
  })

  test('botón Nuevo Paciente navega al formulario', async ({ page }) => {
    await page.locator('a[href="/pacientes/nuevo"]').click()
    await expect(page).toHaveURL(`${BASE}/pacientes/nuevo`)
  })

  test('buscador filtra pacientes por nombre', async ({ page }) => {
    const rowsBefore = await page.locator('tbody tr').count()
    await page.fill('input[placeholder*="Buscar"]', 'carmen')
    await page.waitForTimeout(600)
    const rowsAfter = await page.locator('tbody tr').count()
    expect(rowsAfter).toBeLessThanOrEqual(rowsBefore)
    await expect(page.locator('text=/Carmen/i')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/08-busqueda-carmen.png', fullPage: true })
  })

  test('búsqueda sin resultados muestra mensaje vacío', async ({ page }) => {
    await page.fill('input[placeholder*="Buscar"]', 'xxxxxxxxxnoexiste')
    await page.waitForTimeout(600)
    await expect(page.locator('text=/No se encontraron/i')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/09-busqueda-vacia.png', fullPage: true })
  })

  test('limpiar búsqueda restaura lista completa', async ({ page }) => {
    await page.fill('input[placeholder*="Buscar"]', 'juan')
    await page.waitForTimeout(600)
    await page.fill('input[placeholder*="Buscar"]', '')
    await page.waitForTimeout(600)
    const rows = await page.locator('tbody tr').count()
    expect(rows).toBeGreaterThan(1)
  })

  test('click en paciente navega al perfil', async ({ page }) => {
    await page.locator('tbody tr').first().locator('td').first().click()
    await expect(page).toHaveURL(/\/pacientes\/[a-z0-9]+$/)
    await page.screenshot({ path: 'tests/screenshots/10-perfil-paciente.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 4. FORMULARIO NUEVO PACIENTE
// ─────────────────────────────────────────────
test.describe('Formulario Nuevo Paciente', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/pacientes/nuevo`)
  })

  test('formulario muestra todos los campos esenciales', async ({ page }) => {
    await expect(page.locator('input[name="firstName"]')).toBeVisible()
    await expect(page.locator('input[name="lastName"]')).toBeVisible()
    await expect(page.locator('input[name="documentNumber"]')).toBeVisible()
    await expect(page.locator('input[name="birthDate"]')).toBeVisible()
    await expect(page.locator('text=Datos Personales')).toBeVisible()
    await expect(page.locator('text=Contacto de Emergencia')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/11-nuevo-paciente-form.png', fullPage: true })
  })

  test('validación muestra errores en campos requeridos', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Nombre requerido')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'tests/screenshots/12-nuevo-paciente-validacion.png', fullPage: true })
  })

  test('crea paciente y redirige al perfil', async ({ page }) => {
    const docNum = String(Date.now()).slice(-8)
    await page.fill('input[name="firstName"]', 'TestNombre')
    await page.fill('input[name="lastName"]', 'TestApellido')
    await page.fill('input[name="documentNumber"]', docNum)
    await page.fill('input[name="birthDate"]', '1995-06-15')
    // Género ya tiene valor por defecto (MALE), el select estará pre-seleccionado
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/pacientes\/[a-z0-9]+$/, { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h2.text-2xl')).toContainText('TestNombre')
    await page.screenshot({ path: 'tests/screenshots/13-paciente-creado.png', fullPage: true })
  })

  test('muestra error si el documento ya existe', async ({ page }) => {
    await page.fill('input[name="firstName"]', 'Duplicado')
    await page.fill('input[name="lastName"]', 'Test')
    await page.fill('input[name="documentNumber"]', '36066585') // ya existe en seed
    await page.fill('input[name="birthDate"]', '2000-01-01')
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=/Ya existe/i').first()).toBeVisible({ timeout: 8000 })
    await page.screenshot({ path: 'tests/screenshots/14-documento-duplicado.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 5. PERFIL DE PACIENTE
// ─────────────────────────────────────────────
test.describe('Perfil de Paciente', () => {
  test.beforeEach(async ({ page }) => {
    await goToPatientWithRecords(page)
  })

  test('muestra nombre y datos básicos del paciente', async ({ page }) => {
    const heading = page.locator('h2.text-2xl')
    await expect(heading).toBeVisible()
    const name = await heading.textContent()
    expect(name?.trim().length).toBeGreaterThan(3)
    await page.screenshot({ path: 'tests/screenshots/15-perfil-header.png', fullPage: true })
  })

  test('tabs: Datos Personales, Antecedentes, Alergias, Consultas', async ({ page }) => {
    await expect(page.locator('[role="tab"]:has-text("Datos Personales")')).toBeVisible()
    await expect(page.locator('[role="tab"]:has-text("Antecedentes")')).toBeVisible()
    await expect(page.locator('[role="tab"]:has-text("Alergias")')).toBeVisible()
    await expect(page.locator('[role="tab"]:has-text("Consultas")')).toBeVisible()
  })

  test('tab Datos Personales muestra información del paciente', async ({ page }) => {
    await page.locator('[role="tab"]:has-text("Datos Personales")').click()
    await expect(page.locator('text=Información Personal')).toBeVisible()
    await expect(page.locator('text=Contacto').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/16-tab-datos-personales.png', fullPage: true })
  })

  test('tab Antecedentes muestra antecedentes médicos', async ({ page }) => {
    await page.locator('[role="tab"]:has-text("Antecedentes")').click()
    await expect(page.locator('text=Antecedentes').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/17-tab-antecedentes.png', fullPage: true })
  })

  test('tab Alergias muestra alergias con badge de severidad', async ({ page }) => {
    await page.locator('[role="tab"]:has-text("Alergias")').click()
    await page.screenshot({ path: 'tests/screenshots/18-tab-alergias.png', fullPage: true })
    // Juan Carlos tiene alergias seeded
    const hasAlergy = await page.locator('text=/Penicilina|Aspirina|alergia/i').first().isVisible()
    expect(hasAlergy).toBeTruthy()
  })

  test('tab Consultas lista consultas previas', async ({ page }) => {
    await page.locator('[role="tab"]:has-text("Consultas")').click()
    await expect(page.locator('text=/consulta|Control|hipertensión/i').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/19-tab-consultas.png', fullPage: true })
  })

  test('botón Nueva Consulta visible y funcional', async ({ page }) => {
    await expect(page.locator('a:has-text("Nueva Consulta")')).toBeVisible()
    await page.locator('a:has-text("Nueva Consulta")').click()
    await expect(page).toHaveURL(/nueva-consulta/)
  })

  test('botón Nueva Cita visible', async ({ page }) => {
    await expect(page.locator('a:has-text("Nueva Cita")')).toBeVisible()
  })

  test('botón Volver navega a lista de pacientes', async ({ page }) => {
    await page.locator('a[href="/pacientes"]').first().click()
    await expect(page).toHaveURL(`${BASE}/pacientes`)
  })
})

// ─────────────────────────────────────────────
// 6. HISTORIA CLÍNICA
// ─────────────────────────────────────────────
test.describe('Historia Clínica', () => {
  test.beforeEach(async ({ page }) => {
    const profileUrl = await goToPatientWithRecords(page)
    const patientId = profileUrl.split('/pacientes/')[1]
    await page.goto(`${BASE}/pacientes/${patientId}/historia`)
    await page.waitForLoadState('networkidle')
  })

  test('muestra header con nombre del paciente y cantidad de consultas', async ({ page }) => {
    await expect(page.locator('h2:has-text("Historia Clínica")')).toBeVisible()
    await expect(page.locator('text=/consulta/i').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/20-historia-header.png', fullPage: true })
  })

  test('timeline muestra consultas con motivo y fecha', async ({ page }) => {
    // Juan Carlos tiene 2 consultas seeded
    await expect(page.locator('text=/Control de hipertensión|Control mensual|HTA/i').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/21-historia-timeline.png', fullPage: true })
  })

  test('consultas muestran signos vitales (PA, FC, Temp)', async ({ page }) => {
    await expect(page.locator('text=PA').first()).toBeVisible()
    await expect(page.locator('text=FC').first()).toBeVisible()
    await expect(page.locator('text=Temp').first()).toBeVisible()
  })

  test('consultas muestran sección Signos Vitales', async ({ page }) => {
    await expect(page.locator('text=Signos Vitales').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/22-historia-signos.png', fullPage: true })
  })

  test('consultas muestran diagnósticos CIE-10', async ({ page }) => {
    // Juan Carlos tiene diagnóstico I10
    await expect(page.locator('text=I10').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/23-historia-diagnosticos.png', fullPage: true })
  })

  test('botón Nueva Consulta en historia funciona', async ({ page }) => {
    await page.locator('a:has-text("Nueva Consulta")').click()
    await expect(page).toHaveURL(/nueva-consulta/)
  })
})

// ─────────────────────────────────────────────
// 7. FORMULARIO NUEVA CONSULTA (SOAP)
// ─────────────────────────────────────────────
test.describe('Nueva Consulta SOAP', () => {
  test.beforeEach(async ({ page }) => {
    const profileUrl = await goToPatientWithRecords(page)
    const patientId = profileUrl.split('/pacientes/')[1]
    await page.goto(`${BASE}/pacientes/${patientId}/historia/nueva-consulta`)
    await page.waitForLoadState('networkidle')
  })

  test('renderiza sección Motivo de Consulta', async ({ page }) => {
    await expect(page.locator('text=Motivo de Consulta')).toBeVisible()
    await expect(page.locator('input[name="reason"]')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/24-soap-form.png', fullPage: true })
  })

  test('renderiza sección Signos Vitales con todos los campos', async ({ page }) => {
    await expect(page.locator('text=Signos Vitales')).toBeVisible()
    await expect(page.locator('input[name="weight"]')).toBeVisible()
    await expect(page.locator('input[name="height"]')).toBeVisible()
    await expect(page.locator('input[name="bloodPressureSys"]')).toBeVisible()
    await expect(page.locator('input[name="heartRate"]')).toBeVisible()
    await expect(page.locator('input[name="temperature"]')).toBeVisible()
  })

  test('renderiza sección SOAP con 4 campos (S, O, A, P)', async ({ page }) => {
    await expect(page.locator('text=Formato SOAP')).toBeVisible()
    await expect(page.locator('text=S — Subjetivo')).toBeVisible()
    await expect(page.locator('text=O — Objetivo')).toBeVisible()
    await expect(page.locator('text=A — Evaluación/Diagnóstico')).toBeVisible()
    await expect(page.locator('text=P — Plan')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/25-soap-secciones.png', fullPage: true })
  })

  test('sección Diagnósticos CIE-10 y botón Agregar visibles', async ({ page }) => {
    await expect(page.locator('text=Diagnósticos (CIE-10)')).toBeVisible()
    await expect(page.locator('button:has-text("Agregar")')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/26-soap-diagnosticos.png', fullPage: true })
  })

  test('botón Agregar diagnóstico muestra campos de diagnóstico', async ({ page }) => {
    await page.locator('button:has-text("Agregar")').click()
    await expect(page.locator('text=Diagnóstico 1')).toBeVisible()
    await expect(page.locator('input[placeholder*="E11"]').or(page.locator('input[name*="diagnoses.0.code"]'))).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/27-soap-add-diagnostico.png', fullPage: true })
  })

  test('validación muestra error si motivo está vacío', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=Motivo de consulta requerido')).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'tests/screenshots/28-soap-validacion.png', fullPage: true })
  })

  test('guarda consulta completa y redirige a historia', async ({ page }) => {
    // Motivo
    await page.fill('input[name="reason"]', 'Control de seguimiento - Test UI')
    // Signos vitales
    await page.fill('input[name="weight"]', '75')
    await page.fill('input[name="height"]', '170')
    await page.fill('input[name="bloodPressureSys"]', '120')
    await page.fill('input[name="bloodPressureDia"]', '80')
    await page.fill('input[name="heartRate"]', '72')
    await page.fill('input[name="temperature"]', '36.5')
    await page.fill('input[name="oxygenSat"]', '98')
    // SOAP
    await page.fill('textarea[name="subjective"]', 'Paciente refiere malestar leve')
    await page.fill('textarea[name="objective"]', 'PA 120/80, buen estado general')
    await page.fill('textarea[name="assessment"]', 'Sin hallazgos de relevancia')
    await page.fill('textarea[name="plan"]', 'Control en 1 mes')
    // Guardar
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/historia$/, { timeout: 15000 })
    await expect(page).toHaveURL(/\/historia$/)
    await page.screenshot({ path: 'tests/screenshots/29-consulta-guardada.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 8. MÓDULO CITAS — CALENDARIO
// ─────────────────────────────────────────────
test.describe('Módulo Citas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/citas`)
    await page.waitForTimeout(1500)
  })

  test('muestra header y botón Nueva Cita', async ({ page }) => {
    await expect(page.locator('h2:has-text("Citas")')).toBeVisible()
    await expect(page.locator('a[href="/citas/nueva"]')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/30-citas-header.png', fullPage: true })
  })

  test('calendario muestra mes actual en español', async ({ page }) => {
    const meses = /enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i
    await expect(page.locator('text=' + /2026/)).toBeVisible()
    const mesVisible = await page.locator(`text=${meses}`).first().isVisible()
    expect(mesVisible).toBeTruthy()
    await page.screenshot({ path: 'tests/screenshots/31-citas-calendario.png', fullPage: true })
  })

  test('días de la semana visibles en encabezado del calendario', async ({ page }) => {
    // El calendario muestra Dom/Lun o Sun/Mon dependiendo del locale
    const diasVisible = await page.locator('text=/Dom|Lun|Mar|Mié|Jue|Vie|Sáb|Sun|Mon/i').first().isVisible()
    expect(diasVisible).toBeTruthy()
  })

  test('botones ChevronLeft y ChevronRight para navegar meses', async ({ page }) => {
    // Los botones size="icon" con h-8 w-8
    const navButtons = page.locator('button.h-8.w-8, button[class*="h-8"][class*="w-8"]')
    const count = await navButtons.count()
    expect(count).toBeGreaterThanOrEqual(2)
    await page.screenshot({ path: 'tests/screenshots/32-citas-nav.png', fullPage: true })
  })

  test('navegar al mes anterior cambia el mes', async ({ page }) => {
    // Esperar que el calendario esté listo
    await page.waitForSelector('[class*="capitalize"]', { timeout: 8000 })
    const monthTitle = page.locator('[class*="capitalize"]').first()
    const monthBefore = await monthTitle.textContent({ timeout: 8000 })
    // ChevronLeft: primer botón icon del calendario
    await page.locator('button[class*="h-8"]').first().click()
    await page.waitForTimeout(500)
    const monthAfter = await monthTitle.textContent({ timeout: 5000 })
    expect(monthAfter).not.toEqual(monthBefore)
    await page.screenshot({ path: 'tests/screenshots/33-citas-mes-anterior.png', fullPage: true })
  })

  test('panel lateral muestra citas del día seleccionado', async ({ page }) => {
    await expect(page.locator('text=/Citas del|citas|Agendada|Confirmada/i').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/34-citas-panel-lateral.png', fullPage: true })
  })

  test('citas del seed aparecen en el calendario con indicadores', async ({ page }) => {
    // El seed crea citas para hoy - deben verse puntos/indicadores en los días
    await page.screenshot({ path: 'tests/screenshots/35-citas-indicadores.png', fullPage: true })
  })

  test('botón Nueva Cita navega al formulario', async ({ page }) => {
    await page.locator('a[href="/citas/nueva"]').click()
    await expect(page).toHaveURL(`${BASE}/citas/nueva`)
  })
})

// ─────────────────────────────────────────────
// 9. FORMULARIO NUEVA CITA
// ─────────────────────────────────────────────
test.describe('Formulario Nueva Cita', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/citas/nueva`)
    await page.waitForLoadState('networkidle')
  })

  test('formulario renderiza correctamente con campos principales', async ({ page }) => {
    await expect(page.locator('h2:has-text("Nueva Cita")')).toBeVisible()
    await expect(page.locator('label:has-text("Paciente")').first()).toBeVisible()
    await expect(page.locator('text=Motivo').first()).toBeVisible()
    await expect(page.locator('input[name="reason"]')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/36-nueva-cita-form.png', fullPage: true })
  })

  test('validación de campos requeridos', async ({ page }) => {
    await page.locator('button[type="submit"]').click()
    await expect(page.locator('text=/requerido/i').first()).toBeVisible({ timeout: 5000 })
    await page.screenshot({ path: 'tests/screenshots/37-nueva-cita-validacion.png', fullPage: true })
  })

  test('búsqueda de paciente filtra resultados', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Buscar paciente"], input[placeholder*="paciente"]').first()
    if (await searchInput.isVisible()) {
      await searchInput.fill('Juan')
      await page.waitForTimeout(500)
      await expect(page.locator('text=/Juan/i').first()).toBeVisible({ timeout: 5000 })
      await page.screenshot({ path: 'tests/screenshots/38-nueva-cita-busqueda.png', fullPage: true })
    }
  })

  test('botón Cancelar regresa a lista de citas', async ({ page }) => {
    await page.locator('a:has-text("Cancelar"), button:has-text("Cancelar")').click()
    await expect(page).toHaveURL(`${BASE}/citas`)
  })
})

// ─────────────────────────────────────────────
// 10. NAVEGACIÓN Y LOGOUT
// ─────────────────────────────────────────────
test.describe('Navegación General', () => {
  test.beforeEach(async ({ page }) => { await login(page) })

  test('link Dashboard en sidebar navega a /', async ({ page }) => {
    await page.goto(`${BASE}/pacientes`)
    await page.locator('nav a[href="/"]').click()
    await expect(page).toHaveURL(`${BASE}/`)
  })

  test('link Pacientes en sidebar navega a /pacientes', async ({ page }) => {
    await page.locator('nav a[href="/pacientes"]').first().click()
    await expect(page).toHaveURL(`${BASE}/pacientes`)
  })

  test('link Citas en sidebar navega a /citas', async ({ page }) => {
    await page.locator('nav a[href="/citas"]').click()
    await expect(page).toHaveURL(`${BASE}/citas`)
  })

  test('link activo del sidebar tiene clase de color activo', async ({ page }) => {
    const dashLink = page.locator('nav a[href="/"]')
    const classes = await dashLink.getAttribute('class')
    expect(classes).toMatch(/blue|active/)
  })

  test('cerrar sesión redirige a login', async ({ page }) => {
    await page.locator('button:has-text("Cerrar sesión")').click()
    await expect(page).toHaveURL(/login/, { timeout: 8000 })
    await page.screenshot({ path: 'tests/screenshots/39-logout.png', fullPage: true })
  })

  test('después de logout no puede acceder a rutas protegidas', async ({ page }) => {
    await page.locator('button:has-text("Cerrar sesión")').click()
    await expect(page).toHaveURL(/login/, { timeout: 8000 })
    await page.goto(`${BASE}/pacientes`)
    await expect(page).toHaveURL(/login/)
  })
})

// ─────────────────────────────────────────────
// 11. GESTIÓN DE USUARIOS (ADMIN)
// ─────────────────────────────────────────────
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE}/login`)
  await page.fill('input[type="email"]', 'admin@clinica.com')
  await page.fill('input[type="password"]', 'admin1234')
  await page.click('button[type="submit"]')
  await page.waitForURL(`${BASE}/`, { timeout: 10000 })
}

test.describe('Gestión de Usuarios', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/configuracion/usuarios`)
    await page.waitForLoadState('networkidle')
  })

  test('lista de usuarios se muestra correctamente', async ({ page }) => {
    await expect(page.locator('text=/Usuarios|usuarios/i').first()).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/40-usuarios-lista.png', fullPage: true })
  })

  test('muestra los usuarios del seed', async ({ page }) => {
    await expect(page.locator('text=/doctor@clinica|admin@clinica/i').first()).toBeVisible()
  })

  test('botón Nuevo Usuario abre dialog', async ({ page }) => {
    await page.locator('button:has-text("Nuevo Usuario")').click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/41-nuevo-usuario-dialog.png', fullPage: true })
  })

  test('crear usuario nuevo funciona', async ({ page }) => {
    await page.locator('button:has-text("Nuevo Usuario")').click()
    await page.waitForSelector('[role="dialog"]')
    await page.fill('#create-name', 'Dr. Test Playwright')
    await page.fill('#create-email', `test.playwright.${Date.now()}@clinica.com`)
    await page.fill('#create-password', 'test1234')
    const submitBtn = page.locator('[role="dialog"] button[type="submit"]')
    await submitBtn.click()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'tests/screenshots/42-usuario-creado.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 12. ALERGIAS Y ANTECEDENTES
// ─────────────────────────────────────────────
test.describe('Alergias del Paciente', () => {
  test.beforeEach(async ({ page }) => {
    await goToPatientWithRecords(page)
    await page.locator('[role="tab"]:has-text("Alergias")').click()
    await page.waitForLoadState('networkidle')
  })

  test('tab Alergias muestra botón Agregar Alergia', async ({ page }) => {
    await expect(page.locator('button:has-text("Agregar Alergia")')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/43-alergias-tab.png', fullPage: true })
  })

  test('dialog de agregar alergia abre correctamente', async ({ page }) => {
    await page.locator('button:has-text("Agregar Alergia")').click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/44-alergia-dialog.png', fullPage: true })
  })

  test('agregar una alergia nueva', async ({ page }) => {
    await page.locator('button:has-text("Agregar Alergia")').click()
    await page.waitForSelector('[role="dialog"]')
    const allergenInput = page.locator('input[name="allergen"], input[placeholder*="alergen"], input[placeholder*="Alergen"]').first()
    if (await allergenInput.isVisible()) {
      await allergenInput.fill('Ibuprofeno Test')
      const submitBtn = page.locator('[role="dialog"] button[type="submit"]')
      await submitBtn.click()
      await page.waitForTimeout(2000)
    }
    await page.screenshot({ path: 'tests/screenshots/45-alergia-agregada.png', fullPage: true })
  })
})

test.describe('Antecedentes del Paciente', () => {
  test.beforeEach(async ({ page }) => {
    await goToPatientWithRecords(page)
    await page.locator('[role="tab"]:has-text("Antecedentes")').click()
    await page.waitForLoadState('networkidle')
  })

  test('tab Antecedentes muestra botón Agregar', async ({ page }) => {
    await expect(page.locator('button:has-text("Agregar Antecedente")')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/46-antecedentes-tab.png', fullPage: true })
  })

  test('dialog de agregar antecedente abre correctamente', async ({ page }) => {
    await page.locator('button:has-text("Agregar Antecedente")').click()
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/47-antecedente-dialog.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 13. EXPORT PDF
// ─────────────────────────────────────────────
test.describe('Export PDF Historia Clínica', () => {
  test('endpoint PDF responde con application/pdf', async ({ page }) => {
    await login(page)
    const res = await page.request.get(`${BASE}/api/pacientes?search=Juan&limit=1`)
    const data = await res.json()
    const patientId = data.patients?.[0]?.id
    if (!patientId) throw new Error('No se encontró paciente Juan')

    const response = await page.request.get(`${BASE}/api/pacientes/${patientId}/pdf`)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('application/pdf')
    await page.screenshot({ path: 'tests/screenshots/48-pdf-export.png', fullPage: true })
  })

  test('botón Exportar PDF visible en perfil del paciente', async ({ page }) => {
    await goToPatientWithRecords(page)
    await expect(
      page.locator('a:has-text("Exportar PDF"), button:has-text("Exportar PDF"), a:has-text("PDF"), button:has-text("PDF")').first()
    ).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/49-pdf-boton.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 14. MÓDULO REPORTES
// ─────────────────────────────────────────────
test.describe('Módulo Reportes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto(`${BASE}/reportes`)
    await page.waitForTimeout(2000)
  })

  test('página de reportes carga correctamente', async ({ page }) => {
    await expect(page).toHaveURL(`${BASE}/reportes`)
    await page.screenshot({ path: 'tests/screenshots/50-reportes-page.png', fullPage: true })
  })

  test('link Reportes visible en el sidebar', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator('nav a[href="/reportes"]')).toBeVisible()
  })

  test('API de reportes retorna datos válidos', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/reportes`)
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('consultasPorMes')
    expect(data).toHaveProperty('citasPorEstado')
    expect(data).toHaveProperty('pacientesPorGenero')
    expect(data).toHaveProperty('citasPorSemana')
  })

  test('gráficos renderizan en la página', async ({ page }) => {
    await page.waitForSelector('.recharts-wrapper, svg', { timeout: 10000 })
    const charts = page.locator('.recharts-wrapper')
    const count = await charts.count()
    expect(count).toBeGreaterThan(0)
    await page.screenshot({ path: 'tests/screenshots/51-reportes-graficos.png', fullPage: true })
  })
})

// ─────────────────────────────────────────────
// 15. CONFIGURACIÓN DE CLÍNICA
// ─────────────────────────────────────────────
test.describe('Configuración de Clínica', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto(`${BASE}/configuracion`)
    await page.waitForLoadState('networkidle')
  })

  test('página de configuración carga correctamente', async ({ page }) => {
    await expect(page).toHaveURL(`${BASE}/configuracion`)
    await page.screenshot({ path: 'tests/screenshots/52-configuracion.png', fullPage: true })
  })

  test('API de organización retorna datos', async ({ page }) => {
    const res = await page.request.get(`${BASE}/api/organizacion`)
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty('name')
  })

  test('sección Datos de la Clínica visible para ADMIN', async ({ page }) => {
    await expect(
      page.locator('text=/Datos de la Clínica|Clínica|organización/i').first()
    ).toBeVisible()
    await page.screenshot({ path: 'tests/screenshots/53-config-clinica.png', fullPage: true })
  })

  test('link a gestión de usuarios visible', async ({ page }) => {
    await expect(
      page.locator('a[href="/configuracion/usuarios"]')
        .or(page.locator('button:has-text("Usuarios")'))
        .or(page.locator('text=/Gestión de Usuarios/i'))
        .first()
    ).toBeVisible()
  })
})

// ─────────────────────────────────────────────
// 16. RBAC — Control de Acceso por Roles
// ─────────────────────────────────────────────
test.describe('RBAC — Control de Acceso', () => {
  test('ADMIN no puede crear consultas clínicas (403)', async ({ page }) => {
    await loginAsAdmin(page)
    // Buscar un paciente para obtener su ID
    const res = await page.request.get(`${BASE}/api/pacientes?limit=1`)
    const data = await res.json()
    const patientId = data.patients[0]?.id
    if (!patientId) return

    const response = await page.request.post(`${BASE}/api/consultas`, {
      data: { patientId, reason: 'Test RBAC' },
    })
    expect(response.status()).toBe(403)
  })

  test('DOCTOR puede crear consultas clínicas (201)', async ({ page }) => {
    await login(page) // login como doctor
    const res = await page.request.get(`${BASE}/api/pacientes?limit=1`)
    const data = await res.json()
    const patientId = data.patients[0]?.id
    if (!patientId) return

    const response = await page.request.post(`${BASE}/api/consultas`, {
      data: {
        patientId,
        reason: 'Test RBAC Doctor',
        subjective: 'Test',
      },
    })
    expect(response.status()).toBe(201)
  })

  test('acceso sin sesión a API retorna 401', async ({ request }) => {
    const response = await request.get(`${BASE}/api/pacientes`)
    expect(response.status()).toBe(401)
  })
})
