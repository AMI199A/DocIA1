document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('openSidebarBtn');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const btnNewChat = document.getElementById('btnNewChat');
    const searchReportsInput = document.getElementById('searchReportsInput');
    const recentReportsList = document.getElementById('recent-reports-list');
    const recentsCount = document.getElementById('recentsCount');

    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    const topLiveStatus = document.getElementById('topLiveStatus');

    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const generateBtn = document.getElementById('generateBtn');
    const formatSelect = document.getElementById('formatSelect');

    const resultSection = document.getElementById('resultSection');
    const loader = document.getElementById('loader');
    const resultContent = document.getElementById('resultContent');
    const reportViewer = document.getElementById('reportViewer');
    const downloadBtn = document.getElementById('downloadBtn');
    const newReportBtn = document.getElementById('newReportBtn');
    const resultReportTitle = document.getElementById('resultReportTitle');
    const resultReportDate = document.getElementById('resultReportDate');

    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');
    const retryBtn = document.getElementById('retryBtn');

    const apiStatusDot = document.getElementById('apiStatusDot');
    const apiStatusText = document.getElementById('apiStatusText');

    // Dashboard Elements
    const metricReportesEl = document.getElementById('metricReportes');
    const metricDocumentosEl = document.getElementById('metricDocumentos');
    const metricPlantillasEl = document.getElementById('metricPlantillas');
    const metricVelocidadEl = document.getElementById('metricVelocidad');

    // RAG Elements
    const btnUploadRAG = document.getElementById('btn-upload-rag');
    const inputFileRAG = document.getElementById('input-file-rag');
    const searchRAG = document.getElementById('search-rag');
    const ragTableBody = document.getElementById('rag-table-body');
    let cachedRAGDocs = [];

    let actividadChartInstance = null;
    let tendenciaChartInstance = null;
    let cachedRecientes = [];

    let currentFile = null;
    let extractedText = "";

    // --- Auth & Session Elements ---
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabRegisterBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginUserInput = document.getElementById('login-user');
    const loginPassInput = document.getElementById('login-pass');
    const regNameInput = document.getElementById('reg-name');
    const regUserInput = document.getElementById('reg-user');
    const regPassInput = document.getElementById('reg-pass');
    const loginSubmitBtn = document.getElementById('login-submit-btn');
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const loginErrorMsg = document.getElementById('login-error-msg');
    const registerErrorMsg = document.getElementById('register-error-msg');
    const registerSuccessMsg = document.getElementById('register-success-msg');
    const fillDemoCredentialsBtn = document.getElementById('fillDemoCredentialsBtn');
    const loginDemoBox = document.getElementById('loginDemoBox');
    const switchToRegisterWrap = document.getElementById('switchToRegisterWrap');
    const switchToLoginWrap = document.getElementById('switchToLoginWrap');
    const linkToRegister = document.getElementById('linkToRegister');
    const linkToLogin = document.getElementById('linkToLogin');
    const btnLogoutSidebar = document.getElementById('btnLogoutSidebar');
    const btnLogoutTop = document.getElementById('btnLogoutTop');
    const userNameDisplay = document.getElementById('userNameDisplay');
    const userAvatar = document.getElementById('userAvatar');

    let dashboardInterval = null;
    let healthInterval = null;
    let isAppInitialized = false;

    // API URL
    const API_URL = window.location.origin.startsWith('http') ? window.location.origin : 'http://localhost:8000';

    // PDF.js configuration
    if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
    }

    // --- Mobile & Desktop Sidebar Toggle ---
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const btnExpandSidebar = document.getElementById('btn-expand-sidebar');

    function openSidebar() {
        if (sidebar) sidebar.classList.add('open');
        if (sidebarBackdrop) sidebarBackdrop.classList.add('active');
    }

    function closeSidebar() {
        if (sidebar) sidebar.classList.remove('open');
        if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    }

    function setSidebarCollapsed(collapsed) {
        if (sidebar) {
            if (collapsed) {
                sidebar.classList.add('collapsed');
            } else {
                sidebar.classList.remove('collapsed');
            }
        }
        if (btnExpandSidebar) {
            if (collapsed) {
                btnExpandSidebar.classList.remove('hidden');
            } else {
                btnExpandSidebar.classList.add('hidden');
            }
        }

        try {
            localStorage.setItem("sidebar_collapsed", collapsed ? "true" : "false");
        } catch (e) {
            console.warn("No se pudo guardar la preferencia del sidebar:", e);
        }

        // Reajustar gráficos al ancho completo disponible
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
            if (actividadChartInstance) actividadChartInstance.resize();
            if (tendenciaChartInstance) tendenciaChartInstance.resize();
        }, 320);
    }

    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            const isCurrentlyCollapsed = sidebar ? sidebar.classList.contains('collapsed') : false;
            setSidebarCollapsed(!isCurrentlyCollapsed);
        });
    }

    if (btnExpandSidebar) {
        btnExpandSidebar.addEventListener('click', () => {
            setSidebarCollapsed(false);
        });
    }

    // Cargar preferencia guardada del sidebar al iniciar
    try {
        const savedSidebarState = localStorage.getItem("sidebar_collapsed");
        if (savedSidebarState === "true") {
            setSidebarCollapsed(true);
        }
    } catch (e) {
        console.warn("Error leyendo preferencia del sidebar:", e);
    }

    if (openSidebarBtn) openSidebarBtn.addEventListener('click', openSidebar);
    if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeSidebar);

    // --- Tab Switcher ---
    const tabButtons = document.querySelectorAll('.sidebar-nav-item, .nav-tab-btn, [data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetTabId) {
        tabButtons.forEach(b => {
            if (b.getAttribute('data-tab') === targetTabId) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });

        tabContents.forEach(content => {
            if (content.id === targetTabId) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });

        if (targetTabId === 'sec-dashboard') {
            if (pageTitle) pageTitle.textContent = "Dashboard & Métricas";
            if (pageSubtitle) pageSubtitle.textContent = "Monitoreo en tiempo real del motor IA y generación de reportes";
            fetchDashboardStats();
        } else if (targetTabId === 'sec-generator') {
            if (pageTitle) pageTitle.textContent = "Generador de Reportes";
            if (pageSubtitle) pageSubtitle.textContent = "Sube documentos y genera reportes ejecutivos estructurados";
        } else if (targetTabId === 'sec-rag') {
            if (pageTitle) pageTitle.textContent = "Gestor de Documentos (RAG)";
            if (pageSubtitle) pageSubtitle.textContent = "Gestiona tus documentos, plantillas y reportes generados";
            cargarDocumentosRAG();
        }

        closeSidebar();
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTabId = btn.getAttribute('data-tab');
            if (targetTabId) {
                switchTab(targetTabId);
            }
        });
    });

    // "Nueva conversación" / "Nuevo Reporte" Button
    if (btnNewChat) {
        btnNewChat.addEventListener('click', () => {
            resetFile();
            switchTab('sec-generator');
        });
    }

    // --- Initialize Dashboard Charts ---
    function initCharts() {
        if (typeof Chart === 'undefined') return;

        Chart.defaults.color = '#a1a1aa';
        Chart.defaults.font.family = "'Inter', sans-serif";

        const ctxActividad = document.getElementById('actividadChart');
        if (ctxActividad && !actividadChartInstance) {
            const actCtx = ctxActividad.getContext('2d');
            const bgGradient = actCtx.createLinearGradient(0, 0, 0, 180);
            bgGradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
            bgGradient.addColorStop(1, 'rgba(16, 185, 129, 0.25)');

            actividadChartInstance = new Chart(actCtx, {
                type: 'bar',
                data: {
                    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                    datasets: [{
                        label: 'Reportes',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: bgGradient,
                        borderRadius: 6,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#18181b',
                            titleColor: '#f4f4f5',
                            bodyColor: '#a1a1aa',
                            borderColor: '#27272a',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: false
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11 }, color: '#71717a' }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.04)' },
                            ticks: { stepSize: 1, font: { size: 11 }, color: '#71717a' }
                        }
                    }
                }
            });
        }

        const ctxTendencia = document.getElementById('tendenciaChart');
        if (ctxTendencia && !tendenciaChartInstance) {
            const tenCtx = ctxTendencia.getContext('2d');
            const lineGradient = tenCtx.createLinearGradient(0, 0, 0, 180);
            lineGradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
            lineGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

            tendenciaChartInstance = new Chart(tenCtx, {
                type: 'line',
                data: {
                    labels: ['09:00', '12:00', '15:00', '18:00', '21:00', '00:00'],
                    datasets: [{
                        label: 'Tokens procesados',
                        data: [1200, 2400, 1800, 3200, 2900, 3500],
                        borderColor: '#10b981',
                        backgroundColor: lineGradient,
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#34d399',
                        pointBorderColor: '#09090b',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#18181b',
                            titleColor: '#f4f4f5',
                            bodyColor: '#a1a1aa',
                            borderColor: '#27272a',
                            borderWidth: 1,
                            padding: 10,
                            displayColors: false
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { font: { size: 11 }, color: '#71717a' }
                        },
                        y: {
                            grid: { color: 'rgba(255, 255, 255, 0.04)' },
                            ticks: { font: { size: 11 }, color: '#71717a' }
                        }
                    }
                }
            });
        }
    }

    // --- Render Recent Reports List in Sidebar ---
    function renderRecentReports(recientes, query = "") {
        if (!recentReportsList) return;

        let filtered = recientes;
        if (query.trim()) {
            const q = query.toLowerCase();
            filtered = recientes.filter(r =>
                (r.nombre && r.nombre.toLowerCase().includes(q)) ||
                (r.archivo && r.archivo.toLowerCase().includes(q)) ||
                (r.preview && r.preview.toLowerCase().includes(q))
            );
        }

        if (recentsCount) {
            recentsCount.textContent = filtered.length;
        }

        if (!filtered || filtered.length === 0) {
            recentReportsList.innerHTML = `
                <div class="recents-empty">
                    <span>${query ? 'No hay coincidencias' : 'No hay reportes aún'}</span>
                </div>
            `;
            return;
        }

        recentReportsList.innerHTML = filtered.map(item => `
            <div class="recent-item" data-id="${item.id}" data-file="${item.archivo}">
                <span class="recent-item-badge ${item.formato === 'pdf' ? 'badge-pdf' : 'badge-docx'}">${item.formato.toUpperCase()}</span>
                <div class="recent-item-info">
                    <span class="recent-item-title" title="${item.nombre}">${item.nombre}</span>
                    <span class="recent-item-date">${item.fecha} • ${item.tamano_kb} KB</span>
                </div>
                <div class="recent-item-actions">
                    <a href="${API_URL}${item.url_descarga}" class="recent-item-action" title="Descargar" download onclick="event.stopPropagation()">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </a>
                    <button class="recent-item-action btn-delete-report" title="Eliminar reporte" data-file="${item.archivo}" aria-label="Eliminar reporte">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
            </div>
        `).join('');

        // Add Click Handler for each recent item to preview
        recentReportsList.querySelectorAll('.recent-item').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.recent-item-action')) return;
                const file = el.getAttribute('data-file');
                const matched = cachedRecientes.find(r => r.archivo === file);
                if (matched) {
                    openRecentReport(matched);
                }
            });
        });

        // Add Click Handler for delete button
        recentReportsList.querySelectorAll('.btn-delete-report').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();

                const filename = btn.getAttribute('data-file');
                if (!filename) return;

                const confirmed = confirm(`¿Estás seguro de que deseas eliminar este reporte?`);
                if (!confirmed) return;

                try {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    const res = await fetch(`${API_URL}/api/v1/reportes/${encodeURIComponent(filename)}`, {
                        method: 'DELETE'
                    });

                    if (res.ok) {
                        // Limpiar visualizador si el reporte eliminado estaba activo en pantalla
                        const activeItem = document.querySelector(`.recent-item[data-file="${filename}"]`);
                        if (activeItem && activeItem.classList.contains('active')) {
                            if (resultSection) resultSection.classList.add('hidden');
                        }

                        await cargarReportesRecientes();
                        await actualizarDashboard();
                    } else {
                        const err = await res.json().catch(() => ({}));
                        alert(err.detail || "No se pudo eliminar el archivo.");
                    }
                } catch (error) {
                    console.error("Error al eliminar reporte:", error);
                    alert("Error de conexión al eliminar el reporte.");
                }
            });
        });
    }

    // Open & View a selected recent report
    function openRecentReport(report) {
        switchTab('sec-generator');

        resultSection.classList.remove('hidden');
        loader.classList.add('hidden');
        errorContainer.classList.add('hidden');
        resultContent.classList.remove('hidden');

        if (resultReportTitle) resultReportTitle.textContent = report.nombre;
        if (resultReportDate) resultReportDate.textContent = `${report.fecha} (${report.tamano_kb} KB)`;

        if (report.contenido) {
            reportViewer.textContent = report.contenido;
        } else if (report.preview) {
            reportViewer.textContent = report.preview + "\n\n[Documento físico guardado en el servidor. Descárgalo abajo para ver el formato completo]";
        } else {
            reportViewer.textContent = "Reporte Ejecutivo generado por DocIA.\nHaz clic en el botón inferior para descargar el archivo.";
        }

        const fullDownloadUrl = `${API_URL}${report.url_descarga}`;
        downloadBtn.href = fullDownloadUrl;
        downloadBtn.setAttribute('download', '');
        downloadBtn.onclick = (e) => {
            e.preventDefault();
            window.open(fullDownloadUrl, '_blank');
        };

        // Highlight selected recent item in sidebar
        document.querySelectorAll('.recent-item').forEach(i => i.classList.remove('active'));
        const activeItem = document.querySelector(`.recent-item[data-file="${report.archivo}"]`);
        if (activeItem) activeItem.classList.add('active');
    }

    // Search input listener
    if (searchReportsInput) {
        searchReportsInput.addEventListener('input', (e) => {
            renderRecentReports(cachedRecientes, e.target.value);
        });
    }

    // --- Cargar Reportes Recientes ---
    async function cargarReportesRecientes() {
        try {
            const response = await fetch(`${API_URL}/api/v1/reportes/recientes`, {
                cache: 'no-store'
            });
            if (!response.ok) return;
            const recientes = await response.json();
            cachedRecientes = recientes;
            const query = searchReportsInput ? searchReportsInput.value : "";
            renderRecentReports(cachedRecientes, query);
        } catch (error) {
            console.error("Error al cargar reportes recientes:", error);
        }
    }

    // --- Actualizar Dashboard ---
    async function actualizarDashboard(animate = false) {
        await fetchDashboardStats(animate);
    }

    // --- Fetch Dashboard Stats from Backend (Live Polling) ---
    async function fetchDashboardStats(animate = false) {
        try {
            const response = await fetch(`${API_URL}/api/v1/dashboard/stats`, {
                cache: 'no-store'
            });
            if (!response.ok) return;
            const data = await response.json();

            // Update Metrics Cards
            if (metricReportesEl && data.reportes_generados !== undefined) {
                metricReportesEl.textContent = data.reportes_generados;
                if (animate) {
                    metricReportesEl.style.transition = 'transform 0.3s ease';
                    metricReportesEl.style.transform = 'scale(1.2)';
                    setTimeout(() => { metricReportesEl.style.transform = 'scale(1)'; }, 300);
                }
            }
            if (metricDocumentosEl && data.documentos_rag !== undefined) {
                metricDocumentosEl.textContent = data.documentos_rag;
            }
            if (metricPlantillasEl && data.plantillas_activas !== undefined) {
                metricPlantillasEl.textContent = data.plantillas_activas;
            }
            if (metricVelocidadEl && data.velocidad_promedio !== undefined) {
                metricVelocidadEl.textContent = data.velocidad_promedio;
            }

            // Update Activity Chart
            if (actividadChartInstance && data.actividad_semanal) {
                if (data.actividad_semanal.dias) {
                    actividadChartInstance.data.labels = data.actividad_semanal.dias;
                }
                if (data.actividad_semanal.valores) {
                    actividadChartInstance.data.datasets[0].data = data.actividad_semanal.valores;
                }
                actividadChartInstance.update();
            }

            // Update Token Trend Chart
            if (tendenciaChartInstance && data.tendencia_uso) {
                if (data.tendencia_uso.horas) {
                    tendenciaChartInstance.data.labels = data.tendencia_uso.horas;
                }
                if (data.tendencia_uso.tokens) {
                    tendenciaChartInstance.data.datasets[0].data = data.tendencia_uso.tokens;
                }
                tendenciaChartInstance.update();
            }

            // Update Recents List
            if (data.recientes) {
                cachedRecientes = data.recientes;
                const query = searchReportsInput ? searchReportsInput.value : "";
                renderRecentReports(cachedRecientes, query);
            }

        } catch (error) {
            console.error("Error consultando estadísticas del dashboard:", error);
        }
    }

    function iniciarPolling() {
        if (!dashboardInterval) {
            fetchDashboardStats(false);
            dashboardInterval = setInterval(() => {
                fetchDashboardStats(false);
            }, 5000);
        }
        if (!healthInterval) {
            checkApiStatus();
            healthInterval = setInterval(checkApiStatus, 3000);
        }
    }

    function detenerPolling() {
        if (dashboardInterval) {
            clearInterval(dashboardInterval);
            dashboardInterval = null;
        }
        if (healthInterval) {
            clearInterval(healthInterval);
            healthInterval = null;
        }
    }

    // --- Gestor de Documentos RAG ---
    async function cargarDocumentosRAG(query = "") {
        if (!ragTableBody) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/rag/documentos`, { cache: 'no-store' });
            if (!res.ok) throw new Error("Error obteniendo documentos RAG");
            cachedRAGDocs = await res.json();
            renderDocumentosRAG(cachedRAGDocs, query || (searchRAG ? searchRAG.value : ""));
        } catch (error) {
            console.error("Error al cargar documentos RAG:", error);
            ragTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="rag-empty-cell">
                        <span class="text-muted">Error al cargar documentos RAG</span>
                    </td>
                </tr>
            `;
        }
    }

    function renderDocumentosRAG(docs, query = "") {
        if (!ragTableBody) return;

        let filtered = docs;
        if (query.trim()) {
            const q = query.toLowerCase();
            filtered = docs.filter(d =>
                (d.nombre && d.nombre.toLowerCase().includes(q)) ||
                (d.fecha_subida && d.fecha_subida.toLowerCase().includes(q))
            );
        }

        if (!filtered || filtered.length === 0) {
            ragTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="rag-empty-cell">
                        <div class="rag-empty-box">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span>${query ? 'No se encontraron documentos coincidentes' : 'No hay documentos cargados en el contexto RAG'}</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        ragTableBody.innerHTML = filtered.map(doc => {
            const ext = (doc.formato || (doc.nombre.split('.').pop() || '')).toLowerCase();
            const badgeClass = ext === 'pdf' ? 'badge-pdf' : (ext === 'docx' ? 'badge-docx' : 'badge-txt');
            return `
                <tr class="rag-row" data-file="${doc.nombre}">
                    <td class="rag-filename-cell">
                        <div class="rag-doc-info">
                            <div class="rag-doc-icon ${badgeClass}">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            </div>
                            <div class="rag-doc-names">
                                <span class="rag-doc-title" title="${doc.nombre}">${doc.nombre}</span>
                                <span class="rag-doc-meta">${doc.tamano || ''}</span>
                            </div>
                        </div>
                    </td>
                    <td class="rag-date-cell">
                        <span class="rag-date-text">${doc.fecha_subida}</span>
                    </td>
                    <td class="rag-actions-cell text-right">
                        <button class="btn-delete-rag" title="Eliminar documento RAG" data-file="${doc.nombre}" aria-label="Eliminar documento">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Wire up delete buttons
        ragTableBody.querySelectorAll('.btn-delete-rag').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const filename = btn.getAttribute('data-file');
                if (!filename) return;

                const confirmed = confirm(`¿Estás seguro de que deseas eliminar "${filename}" del contexto RAG?`);
                if (!confirmed) return;

                try {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    const res = await fetch(`${API_URL}/api/v1/rag/documentos/${encodeURIComponent(filename)}`, {
                        method: 'DELETE'
                    });

                    if (res.ok) {
                        await cargarDocumentosRAG();
                        await fetchDashboardStats(true);
                    } else {
                        const err = await res.json().catch(() => ({}));
                        alert(err.detail || "Error al eliminar el documento RAG.");
                    }
                } catch (err) {
                    console.error("Error al eliminar documento RAG:", err);
                    alert("Error de conexión al eliminar el documento.");
                }
            });
        });
    }

    // Subir documento RAG
    if (btnUploadRAG && inputFileRAG) {
        btnUploadRAG.addEventListener('click', () => {
            inputFileRAG.click();
        });

        inputFileRAG.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files || files.length === 0) return;

            btnUploadRAG.disabled = true;
            const originalHTML = btnUploadRAG.innerHTML;
            btnUploadRAG.innerHTML = `<span>Subiendo...</span>`;

            try {
                for (let i = 0; i < files.length; i++) {
                    const formData = new FormData();
                    formData.append('file', files[i]);

                    const res = await fetch(`${API_URL}/api/v1/rag/upload`, {
                        method: 'POST',
                        body: formData
                    });

                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        throw new Error(err.detail || `Error al subir ${files[i].name}`);
                    }
                }

                inputFileRAG.value = "";
                await cargarDocumentosRAG();
                await fetchDashboardStats(true);
            } catch (error) {
                console.error("Error al subir archivo RAG:", error);
                alert(error.message || "Error al subir documento RAG.");
            } finally {
                btnUploadRAG.disabled = false;
                btnUploadRAG.innerHTML = originalHTML;
            }
        });
    }

    // Buscador RAG
    if (searchRAG) {
        searchRAG.addEventListener('input', (e) => {
            renderDocumentosRAG(cachedRAGDocs, e.target.value);
        });
    }

    // --- API Health Check ---
    async function checkApiStatus() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2500);
            const res = await fetch(`${API_URL}/api/v1/health`, {
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                apiStatusDot.classList.add('online');
                apiStatusDot.classList.remove('offline');
                apiStatusText.textContent = "API Conectada";
                if (topLiveStatus) topLiveStatus.textContent = "Sistema activo";
            } else {
                throw new Error("API not ok");
            }
        } catch (error) {
            apiStatusDot.classList.add('offline');
            apiStatusDot.classList.remove('online');
            apiStatusText.textContent = "API Desconectada";
            if (topLiveStatus) topLiveStatus.textContent = "API Desconectada";
        }
    }

    // --- Drag and Drop File Handlers ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        if (dropZone) dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        if (dropZone) {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            }, false);
        }
    });

    ['dragleave', 'drop'].forEach(eventName => {
        if (dropZone) {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            }, false);
        }
    });

    if (dropZone) {
        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            handleFiles(files);
        }, false);

        dropZone.addEventListener('click', (e) => {
            if (e.target !== browseBtn && e.target !== removeFileBtn) {
                fileInput.click();
            }
        });
    }

    if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', function () {
            handleFiles(this.files);
        });
    }

    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            resetFile();
        });
    }

    // --- File Processing ---
    function handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        const validExtensions = ['text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const extension = file.name.split('.').pop().toLowerCase();

        if (!validExtensions.includes(file.type) && !['txt', 'pdf', 'docx'].includes(extension)) {
            showError("Tipo de archivo no soportado. Usa .txt, .pdf o .docx");
            return;
        }

        currentFile = file;
        fileName.textContent = file.name;
        fileInfo.classList.remove('hidden');
        generateBtn.disabled = true;
        generateBtn.querySelector('span').textContent = "Procesando documento...";

        extractTextFromFile(file);
    }

    function resetFile() {
        currentFile = null;
        extractedText = "";
        if (fileInput) fileInput.value = "";
        if (fileInfo) fileInfo.classList.add('hidden');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.querySelector('span').textContent = "Generar Reporte Maestro";
        }

        if (resultSection) resultSection.classList.add('hidden');
        if (resultContent) resultContent.classList.add('hidden');
        if (errorContainer) errorContainer.classList.add('hidden');

        // Desmarcar elementos activos en la lista de recientes
        document.querySelectorAll('.recent-item').forEach(i => i.classList.remove('active'));
    }

    async function extractTextFromFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();

        try {
            if (extension === 'txt') {
                const text = await file.text();
                finishExtraction(text);
            }
            else if (extension === 'pdf') {
                if (!window.pdfjsLib) throw new Error("Librería PDF.js no cargada");

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    const strings = content.items.map(item => item.str);
                    fullText += strings.join(" ") + "\n";
                }
                finishExtraction(fullText);
            }
            else if (extension === 'docx') {
                if (!window.mammoth) throw new Error("Librería Mammoth no cargada");

                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                finishExtraction(result.value);
            }
        } catch (error) {
            console.error("Error extrayendo texto:", error);
            showError("No se pudo extraer el texto del archivo: " + error.message);
            resetFile();
        }
    }

    function finishExtraction(text) {
        if (!text.trim()) {
            showError("El archivo parece estar vacío o no contiene texto extraíble.");
            resetFile();
            return;
        }
        extractedText = text;
        generateBtn.disabled = false;
        generateBtn.querySelector('span').textContent = "Generar Reporte Maestro";
    }

    // --- Report Generation Flow ---
    let pollingInterval = null;

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            if (!extractedText) return;

            const formato = formatSelect.value;

            resultSection.classList.remove('hidden');
            loader.classList.remove('hidden');
            resultContent.classList.add('hidden');
            errorContainer.classList.add('hidden');
            generateBtn.disabled = true;
            document.querySelector('.loader-text').textContent = "Iniciando proceso con Ollama...";

            try {
                const response = await fetch(`${API_URL}/api/v1/reportes/generar`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        texto: extractedText,
                        formato: formato
                    })
                });

                if (!response.ok) {
                    const rawText = await response.text();
                    let detail = "Error en el servidor";
                    try {
                        const errData = JSON.parse(rawText);
                        detail = errData.detail || detail;
                    } catch (e) { }

                    if (response.status === 401 || (detail && detail.toLowerCase().includes("conectando con ollama"))) {
                        throw new Error(`Error ${response.status}: Asegúrate de que Ollama esté iniciado en el puerto 11434. (${detail})`);
                    }
                    throw new Error(detail);
                }

                const data = await response.json();

                if (data.task_id) {
                    pollTaskStatus(data.task_id, formato);
                }

            } catch (error) {
                showError(error.message);
                loader.classList.add('hidden');
                generateBtn.disabled = false;
            }
        });
    }

    function pollTaskStatus(taskId, formato) {
        if (pollingInterval) clearInterval(pollingInterval);

        document.querySelector('.loader-text').textContent = "IA generando reporte ejecutivo (puede tardar unos momentos)...";

        pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/api/v1/reportes/estado/${taskId}`, {
                    cache: 'no-store'
                });
                if (!response.ok) throw new Error("Error consultando estado de la tarea");

                const data = await response.json();

                if (data.status === "completed") {
                    clearInterval(pollingInterval);
                    loader.classList.add('hidden');
                    generateBtn.disabled = false;
                    fetchDashboardStats(true);
                    showResult(data, formato);
                } else if (data.status === "error") {
                    clearInterval(pollingInterval);
                    throw new Error(data.detail || "Error interno procesando el reporte");
                }
            } catch (error) {
                clearInterval(pollingInterval);
                showError(error.message);
                loader.classList.add('hidden');
                generateBtn.disabled = false;
            }
        }, 3000);
    }

    function showResult(data, formato) {
        resultContent.classList.remove('hidden');
        if (resultReportTitle) resultReportTitle.textContent = "Reporte Generado Exitosamente";
        if (resultReportDate) resultReportDate.textContent = `Formato: ${formato.toUpperCase()} • Recién generado`;

        reportViewer.textContent = data.contenido_ia || "No se recibió contenido.";

        if (data.ruta_archivo) {
            const fileName = data.ruta_archivo.split(/[/\\]/).pop();
            const downloadUrl = `${API_URL}/api/v1/reportes/descargar/${fileName}`;
            downloadBtn.href = downloadUrl;
            downloadBtn.setAttribute('download', '');
            downloadBtn.onclick = (e) => {
                e.preventDefault();
                window.open(downloadUrl, '_blank');
            };
        }
    }

    function showError(message) {
        resultSection.classList.remove('hidden');
        errorContainer.classList.remove('hidden');
        loader.classList.add('hidden');
        resultContent.classList.add('hidden');
        errorMessage.textContent = message;
    }

    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            errorContainer.classList.add('hidden');
            generateBtn.click();
        });
    }

    if (newReportBtn) {
        newReportBtn.addEventListener('click', () => {
            resetFile();
        });
    }

    // ==========================================================================
    // LÓGICA DE AUTENTICACIÓN / SESIÓN / REGISTRO / LOCALSTORAGE
    // ==========================================================================

    function switchAuthTab(targetTab) {
        if (loginErrorMsg) loginErrorMsg.classList.add('hidden');
        if (registerErrorMsg) registerErrorMsg.classList.add('hidden');
        if (registerSuccessMsg) registerSuccessMsg.classList.add('hidden');

        if (targetTab === 'register') {
            if (tabLoginBtn) tabLoginBtn.classList.remove('active');
            if (tabRegisterBtn) tabRegisterBtn.classList.add('active');

            if (loginForm) loginForm.classList.add('hidden');
            if (registerForm) {
                registerForm.classList.remove('hidden');
                registerForm.classList.remove('tab-anim');
                void registerForm.offsetWidth; // Trigger reflow for animation
                registerForm.classList.add('tab-anim');
            }

            if (authTitle) authTitle.textContent = "Crear Cuenta";
            if (authSubtitle) authSubtitle.textContent = "Únete a tu espacio de trabajo inteligente";

            if (loginDemoBox) loginDemoBox.classList.add('hidden');
            if (switchToRegisterWrap) switchToRegisterWrap.classList.add('hidden');
            if (switchToLoginWrap) switchToLoginWrap.classList.remove('hidden');

            if (regNameInput) regNameInput.focus();
        } else {
            if (tabRegisterBtn) tabRegisterBtn.classList.remove('active');
            if (tabLoginBtn) tabLoginBtn.classList.add('active');

            if (registerForm) registerForm.classList.add('hidden');
            if (loginForm) {
                loginForm.classList.remove('hidden');
                loginForm.classList.remove('tab-anim');
                void loginForm.offsetWidth; // Trigger reflow
                loginForm.classList.add('tab-anim');
            }

            if (authTitle) authTitle.textContent = "Iniciar Sesión";
            if (authSubtitle) authSubtitle.textContent = "Ingresa a tu espacio de trabajo inteligente";

            if (loginDemoBox) loginDemoBox.classList.remove('hidden');
            if (switchToLoginWrap) switchToLoginWrap.classList.add('hidden');
            if (switchToRegisterWrap) switchToRegisterWrap.classList.remove('hidden');

            if (loginUserInput) loginUserInput.focus();
        }
    }

    if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchAuthTab('login'));
    if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchAuthTab('register'));
    if (linkToRegister) linkToRegister.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('register'); });
    if (linkToLogin) linkToLogin.addEventListener('click', (e) => { e.preventDefault(); switchAuthTab('login'); });

    function mostrarLogin() {
        detenerPolling();
        if (appContainer) appContainer.classList.add('hidden');
        if (loginContainer) loginContainer.classList.remove('hidden');
        switchAuthTab('login');
    }

    function mostrarErrorLogin(mensaje) {
        if (!loginErrorMsg) return;
        loginErrorMsg.textContent = mensaje;
        loginErrorMsg.classList.remove('hidden');
    }

    function mostrarErrorRegister(mensaje) {
        if (!registerErrorMsg) return;
        registerErrorMsg.textContent = mensaje;
        registerErrorMsg.classList.remove('hidden');
    }

    function iniciarApp(sessionData) {
        if (loginContainer) loginContainer.classList.add('hidden');
        if (appContainer) appContainer.classList.remove('hidden');

        // Actualizar información del usuario en UI
        const username = sessionData.name || sessionData.user || "Usuario";
        if (userNameDisplay) userNameDisplay.textContent = username;
        if (userAvatar) userAvatar.textContent = username.charAt(0).toUpperCase();

        // Inicializar componentes la primera vez que se ingresa
        if (!isAppInitialized) {
            initCharts();
            isAppInitialized = true;
        }

        // Cargar datos
        cargarReportesRecientes();
        cargarDocumentosRAG();
        iniciarPolling();
    }

    function cerrarSesion() {
        try {
            localStorage.removeItem("docia_session");
        } catch (e) {
            console.error("Error limpiando localStorage:", e);
        }

        if (loginUserInput) loginUserInput.value = "";
        if (loginPassInput) loginPassInput.value = "";
        if (regNameInput) regNameInput.value = "";
        if (regUserInput) regUserInput.value = "";
        if (regPassInput) regPassInput.value = "";

        mostrarLogin();
    }

    // Auto-completar credenciales demo
    if (fillDemoCredentialsBtn) {
        fillDemoCredentialsBtn.addEventListener('click', () => {
            switchAuthTab('login');
            if (loginUserInput) loginUserInput.value = "admin";
            if (loginPassInput) loginPassInput.value = "admin123";
            if (loginErrorMsg) loginErrorMsg.classList.add('hidden');
            if (loginUserInput) loginUserInput.focus();
        });
    }

    // Manejar envío de formulario de Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginUserInput ? loginUserInput.value.trim() : "";
            const password = loginPassInput ? loginPassInput.value.trim() : "";

            if (!username || !password) {
                mostrarErrorLogin("Por favor, ingresa tu usuario y contraseña.");
                return;
            }

            if (loginSubmitBtn) {
                loginSubmitBtn.disabled = true;
                loginSubmitBtn.innerHTML = `<span>Ingresando...</span>`;
            }
            if (loginErrorMsg) loginErrorMsg.classList.add('hidden');

            try {
                let token = "demo-token-" + Date.now();
                let userDisplayName = username;

                // Llamada al endpoint de autenticación en backend (si está disponible)
                try {
                    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        token = data.token || token;
                        userDisplayName = data.name || data.user || username;
                    } else {
                        const err = await response.json().catch(() => ({}));
                        throw new Error(err.detail || "Usuario o contraseña inválidos.");
                    }
                } catch (apiErr) {
                    if (apiErr.message && !apiErr.message.includes("fetch")) {
                        throw apiErr;
                    }
                    console.warn("Backend auth offline, utilizando fallback de sesión:", apiErr);
                }

                // Guardar en LocalStorage
                const sessionData = {
                    user: username,
                    name: userDisplayName,
                    token: token,
                    loggedAt: new Date().toISOString()
                };
                localStorage.setItem("docia_session", JSON.stringify(sessionData));

                // Iniciar la app
                iniciarApp(sessionData);

            } catch (err) {
                console.error("Error durante login:", err);
                mostrarErrorLogin(err.message || "Ocurrió un error al iniciar sesión.");
            } finally {
                if (loginSubmitBtn) {
                    loginSubmitBtn.disabled = false;
                    loginSubmitBtn.innerHTML = `
                        <span>Ingresar al Sistema</span>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    `;
                }
            }
        });
    }

    // Manejar envío de formulario de Registro
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = regNameInput ? regNameInput.value.trim() : "";
            const username = regUserInput ? regUserInput.value.trim() : "";
            const password = regPassInput ? regPassInput.value.trim() : "";

            if (!name || !username || !password) {
                mostrarErrorRegister("Por favor completa todos los campos.");
                return;
            }

            if (registerSubmitBtn) {
                registerSubmitBtn.disabled = true;
                registerSubmitBtn.innerHTML = `<span>Creando cuenta...</span>`;
            }
            if (registerErrorMsg) registerErrorMsg.classList.add('hidden');
            if (registerSuccessMsg) registerSuccessMsg.classList.add('hidden');

            try {
                let token = "demo-token-" + Date.now();
                let registeredName = name;

                try {
                    const response = await fetch(`${API_URL}/api/v1/auth/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, username, password })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        token = data.token || token;
                        registeredName = data.name || name;
                    } else {
                        const err = await response.json().catch(() => ({}));
                        throw new Error(err.detail || "No se pudo completar el registro.");
                    }
                } catch (apiErr) {
                    if (apiErr.message && !apiErr.message.includes("fetch")) {
                        throw apiErr;
                    }
                    console.warn("Backend register offline, utilizando fallback local:", apiErr);
                }

                // Guardar en LocalStorage y auto-loguear
                const sessionData = {
                    user: username,
                    name: registeredName,
                    token: token,
                    loggedAt: new Date().toISOString()
                };
                localStorage.setItem("docia_session", JSON.stringify(sessionData));

                // Mensaje de éxito visual y transición suave
                if (registerSuccessMsg) {
                    registerSuccessMsg.textContent = "¡Cuenta creada con éxito! Ingresando...";
                    registerSuccessMsg.classList.remove('hidden');
                }

                setTimeout(() => {
                    iniciarApp(sessionData);
                }, 600);

            } catch (err) {
                console.error("Error durante registro:", err);
                mostrarErrorRegister(err.message || "Error al registrar el usuario. Intenta de nuevo.");
            } finally {
                if (registerSubmitBtn) {
                    registerSubmitBtn.disabled = false;
                    registerSubmitBtn.innerHTML = `
                        <span>Registrarse</span>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    `;
                }
            }
        });
    }

    // Botones de Cerrar Sesión
    if (btnLogoutSidebar) {
        btnLogoutSidebar.addEventListener('click', (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    }

    if (btnLogoutTop) {
        btnLogoutTop.addEventListener('click', (e) => {
            e.preventDefault();
            cerrarSesion();
        });
    }

    // Verificar sesión inicial al cargar la página
    function verificarSesionInicial() {
        try {
            const rawSession = localStorage.getItem("docia_session");
            if (rawSession) {
                const sessionData = JSON.parse(rawSession);
                if (sessionData && (sessionData.user || sessionData.name)) {
                    iniciarApp(sessionData);
                    return;
                }
            }
        } catch (e) {
            console.warn("Error leyendo sesión almacenada:", e);
        }
        mostrarLogin();
    }

    verificarSesionInicial();
});

