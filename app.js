/* =================================================================
   LÓGICA INTERACTIVA PREMIUM - CITEVAL CONTROL CENTER JS
   ================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // VARIABLES DE ESTADO GLOBAL
    // -------------------------------------------------------------
    let dashboardData = null;
    let filteredInformes = [];
    let todasRegistros = [];
    let filteredRegistros = []; // Declaración global para paginación consistente
    let currentSelectedInforme = null;
    let currentTab = 'tab-ficha';

    // Paginación y referencias de gráficos
    let currentPage = 1;
    const itemsPerPage = 8;

    let chartPreval = null;
    let chartChecklist = null;
    let chartCite = null;
    let chartCadena = null;
    let chartServicio = null;
    let chartTransversales = null;

    // -------------------------------------------------------------
    // INICIALIZACIÓN DE RELOJ Y GENERALES
    // -------------------------------------------------------------
    const actualizarFecha = () => {
        const fechaSpan = document.getElementById('fecha-actual');
        if (fechaSpan) {
            const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const hoy = new Date();
            let fechaStr = hoy.toLocaleDateString('es-ES', opciones);
            // Capitalizar primera letra
            fechaStr = fechaStr.charAt(0).toUpperCase() + fechaStr.slice(1);
            fechaSpan.innerHTML = fechaStr;
        }
    };
    actualizarFecha();
    setInterval(actualizarFecha, 60000);

    // Reemplazar iconos vectoriales Lucide al cargar
    lucide.createIcons();

    // -------------------------------------------------------------
    // CARGAR DATOS DESDE JSON
    // -------------------------------------------------------------
    const cargarDatos = async () => {
        try {
            // Intentar leer el archivo JSON
            const respuesta = await fetch('datos_dashboard.json');
            if (!respuesta.ok) {
                throw new Error('No se pudo leer el archivo JSON de datos.');
            }
            dashboardData = await respuesta.json();
            filteredInformes = [...dashboardData.informes];
            
            // Construir lista plana maestra de todos los registros de servicios
            todasRegistros = [];
            dashboardData.informes.forEach(inf => {
                if (inf.empresas && inf.empresas.length > 0) {
                    inf.empresas.forEach(emp => {
                        todasRegistros.push({
                            cod_informe: inf.cod_informe,
                            cite_ut: inf.cite_ut,
                            cadena_productiva: inf.cadena_productiva,
                            tipo_serv_accion: inf.tipo_serv_accion,
                            region: inf.region,
                            estado: emp.estado || inf.estado,
                            ruc: emp.ruc,
                            razon_social: emp.razon_social,
                            obs_trans: emp.observacion_transversales || '',
                            obs_check: emp.observacion_checklist || '',
                            fecha_inicio: inf.fecha_inicio,
                            fecha_fin: inf.fecha_fin
                        });
                    });
                } else {
                    todasRegistros.push({
                        cod_informe: inf.cod_informe,
                        cite_ut: inf.cite_ut,
                        cadena_productiva: inf.cadena_productiva,
                        tipo_serv_accion: inf.tipo_serv_accion,
                        region: inf.region,
                        estado: inf.estado,
                        ruc: 'N/A',
                        razon_social: 'No especificado',
                        obs_trans: '',
                        obs_check: '',
                        fecha_inicio: inf.fecha_inicio,
                        fecha_fin: inf.fecha_fin
                    });
                }
            });
            filteredRegistros = [...todasRegistros];
            
            // Población inicial de filtros una vez cargado
            poblarFiltros();
            
            console.log('Datos del dashboard cargados con éxito:', dashboardData);
        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
            // Mostrar log de error en consola de terminal
            const consoleLogs = document.getElementById('console-logs');
            if (consoleLogs) {
                consoleLogs.innerHTML += `<div class="console-line error"><span class="prompt">></span> ERROR: No se encontró el archivo datos_dashboard.json. Ejecute primero el script src/exportar_datos_dashboard.py</div>`;
            }
        }
    };
    cargarDatos();

    // -------------------------------------------------------------
    // SIMULADOR DE PIPELINE (TERMINAL DE LANZAMIENTO)
    // -------------------------------------------------------------
    const btnIniciarAuditoria = document.getElementById('btn-iniciar-auditoria');
    const simuladorScreen = document.getElementById('simulador-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const consoleLogs = document.getElementById('console-logs');
    const progressBarWrapper = document.getElementById('progress-bar-wrapper');
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressStepText = document.getElementById('progress-step-text');

    const logList = [
        { percentage: 15, text: "[INGESTIÓN] Limpiando y unificando registros en hoja SSIPRO...", delay: 400, type: 'system' },
        { percentage: 35, text: "[EXTRACTOR] Ingestando 50 expedientes en PDF desde informes_pdf/...", delay: 600, type: 'system' },
        { percentage: 50, text: "[LÓGICA-TRANSVERSAL] Ejecutando reglas básicas y RUCs del tarifario...", delay: 500, type: 'system' },
        { percentage: 75, text: "[AGENTE-IA] Conectando con Gemini 1.5 Pro en lote de informes.txt...", delay: 800, type: 'warning' },
        { percentage: 90, text: "[SEMÁNTICA] Cruzando objetivos específicos SSIPRO con actividades de informe PDF...", delay: 700, type: 'system' },
        { percentage: 100, text: "[ORQUESTADOR] Consolidando veredictos y escribiendo reportes de salida...", delay: 500, type: 'success' }
    ];

    const ejecutarSimulacion = () => {
        if (!dashboardData) {
            alert('Los datos aún no se han cargado. Asegúrate de ejecutar el exportador de Python.');
            return;
        }

        // Ocultar botón de inicio y mostrar barra de progreso
        btnIniciarAuditoria.style.display = 'none';
        progressBarWrapper.style.display = 'block';

        let logIndex = 0;

        const procesarSiguienteLog = () => {
            if (logIndex < logList.length) {
                const etapa = logList[logIndex];
                
                // Actualizar barra de progreso y textos
                progressFill.style.width = `${etapa.percentage}%`;
                progressPercentage.innerText = `${etapa.percentage}%`;
                progressStepText.innerText = etapa.text;

                // Escribir log en la terminal
                const lineClass = etapa.type || 'system';
                consoleLogs.innerHTML += `<div class="console-line ${lineClass}"><span class="prompt">></span> ${etapa.text} [PROCESANDO]</div>`;
                consoleLogs.scrollTop = consoleLogs.scrollHeight; // Auto Scroll

                // Añadir animación de completado tras la espera
                setTimeout(() => {
                    // Reemplazar la última línea procesando por OK
                    const ultimaLinea = consoleLogs.lastElementChild;
                    if (ultimaLinea) {
                        ultimaLinea.innerHTML = `<span class="prompt">></span> ${etapa.text} <span style="color: #10b981; font-weight: bold;">[COMPLETADO]</span>`;
                    }

                    logIndex++;
                    procesarSiguienteLog();
                }, etapa.delay);
            } else {
                // Simulación Terminada
                consoleLogs.innerHTML += `<div class="console-line success"><span class="prompt">></span> SISTEMA: ¡Auditoría Finalizada! Carga de ${dashboardData ? dashboardData.informes.length : ''} informes finalizada con éxito.</div>`;
                consoleLogs.scrollTop = consoleLogs.scrollHeight;

                setTimeout(() => {
                    // Transición animada de pantallas
                    simuladorScreen.style.transition = 'opacity 0.5s ease';
                    simuladorScreen.style.opacity = '0';
                    
                    setTimeout(() => {
                        simuladorScreen.style.display = 'none';
                        dashboardScreen.style.display = 'flex';
                        dashboardScreen.style.opacity = '0';
                        dashboardScreen.style.transition = 'opacity 0.6s ease';
                        
                        // Renderizar todos los elementos del dashboard
                        renderizarTodo();
                        lucide.createIcons(); // Refrescar iconos en el nuevo DOM

                        setTimeout(() => {
                            dashboardScreen.style.opacity = '1';
                        }, 50);
                    }, 500);

                }, 800);
            }
        };

        procesarSiguienteLog();
    };

    if (btnIniciarAuditoria) {
        btnIniciarAuditoria.addEventListener('click', ejecutarSimulacion);
    }

    // Regresar al terminal desde el dashboard
    const btnReSimular = document.getElementById('btn-re-simular');
    if (btnReSimular) {
        btnReSimular.addEventListener('click', () => {
            dashboardScreen.style.display = 'none';
            simuladorScreen.style.display = 'flex';
            simuladorScreen.style.opacity = '1';
            
            // Reiniciar estado de simulación
            btnIniciarAuditoria.style.display = 'inline-flex';
            progressBarWrapper.style.display = 'none';
            progressFill.style.width = '0%';
            progressPercentage.innerText = '0%';
            progressStepText.innerText = 'Esperando comando de ejecución...';
            consoleLogs.innerHTML = `
                <div class="console-line system"><span class="prompt">></span> Iniciando núcleo de prevalidación CITEVAL IA...</div>
                <div class="console-line system"><span class="prompt">></span> Cargando registros de servicios desde SSIPRO...</div>
                <div class="console-line system"><span class="prompt">></span> Verificando reglas transversales y checklist de validación...</div>
                <div class="console-line system"><span class="prompt">></span> Preparando análisis semántico con IA...</div>
                <div class="console-line warning"><span class="prompt">></span> ESTADO: Esperando comando de ejecución del operador.</div>
            `;
        });
    }

    // -------------------------------------------------------------
    // MOTOR DE FILTRADO DINÁMICO
    // -------------------------------------------------------------
    const searchInput = document.getElementById('search-input');
    const filterFechaInicio = document.getElementById('filter-fecha-inicio');
    const filterFechaFin = document.getElementById('filter-fecha-fin');
    const filterCite = document.getElementById('filter-cite');
    const filterEstado = document.getElementById('filter-estado');
    const filterCadena = document.getElementById('filter-cadena');
    const filterTipoServicio = document.getElementById('filter-tipo-servicio');
    const btnLimpiarFiltros = document.getElementById('btn-limpiar-filters') || document.getElementById('btn-limpiar-filtros');
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');
    const pageIndicator = document.getElementById('page-indicator');

    const poblarFiltros = () => {
        if (!dashboardData) return;

        // Obtener CITEs únicos
        const cites = [...new Set(dashboardData.informes.map(inf => inf.cite_ut))].sort();
        cites.forEach(cite => {
            const opt = document.createElement('option');
            opt.value = cite;
            opt.innerText = cite;
            filterCite.appendChild(opt);
        });

        // Obtener Cadenas únicas
        const cadenas = [...new Set(dashboardData.informes.map(inf => inf.cadena_productiva))].sort();
        cadenas.forEach(cad => {
            if (cad) {
                const opt = document.createElement('option');
                opt.value = cad;
                opt.innerText = cad;
                filterCadena.appendChild(opt);
            }
        });

        // Obtener Tipos de Servicio únicos
        const servicios = [...new Set(dashboardData.informes.map(inf => inf.tipo_serv_accion))].sort();
        servicios.forEach(serv => {
            if (serv) {
                const opt = document.createElement('option');
                opt.value = serv;
                opt.innerText = serv;
                filterTipoServicio.appendChild(opt);
            }
        });
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            // DD/MM/YYYY
            return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
        return null;
    };

    const aplicarFiltros = () => {
        if (!dashboardData) return;

        const busqueda = searchInput.value.toLowerCase().trim();
        const dateStartStr = filterFechaInicio.value;
        const dateEndStr = filterFechaFin.value;
        const citeSelect = filterCite.value;
        const estadoSelect = filterEstado.value;
        const cadenaSelect = filterCadena.value;
        const servicioSelect = filterTipoServicio.value;

        const dateStart = dateStartStr ? new Date(dateStartStr) : null;
        if (dateStart) dateStart.setHours(0,0,0,0);
        const dateEnd = dateEndStr ? new Date(dateEndStr) : null;
        if (dateEnd) dateEnd.setHours(23,59,59,999);

        filteredRegistros = todasRegistros.filter(reg => {
            // Filtro de búsqueda textual seguro y robusto
            let matchTexto = true;
            if (busqueda !== '') {
                const matchCodigo = reg.cod_informe ? String(reg.cod_informe).toLowerCase().includes(busqueda) : false;
                const matchCiteStr = reg.cite_ut ? String(reg.cite_ut).toLowerCase().includes(busqueda) : false;
                const matchRegionStr = reg.region ? String(reg.region).toLowerCase().includes(busqueda) : false;
                const matchCadenaStr = reg.cadena_productiva ? String(reg.cadena_productiva).toLowerCase().includes(busqueda) : false;
                const matchRuc = reg.ruc ? String(reg.ruc).includes(busqueda) : false;
                const matchRazon = reg.razon_social ? String(reg.razon_social).toLowerCase().includes(busqueda) : false;
                matchTexto = matchCodigo || matchCiteStr || matchRegionStr || matchCadenaStr || matchRuc || matchRazon;
            }

            // Filtro por Fechas
            let matchFecha = true;
            if (dateStart || dateEnd) {
                const infDate = parseDate(reg.fecha_inicio);
                if (infDate) {
                    if (dateStart && infDate < dateStart) matchFecha = false;
                    if (dateEnd && infDate > dateEnd) matchFecha = false;
                } else {
                    matchFecha = false; // Excluir si tiene filtro de fecha pero no tiene fecha registrada
                }
            }

            // Filtros de combos robustos (inmunes a casing, espacios y acentos)
            const matchCite = (citeSelect === 'Todos' || (reg.cite_ut && String(reg.cite_ut).toUpperCase().trim() === citeSelect.toUpperCase().trim()));
            const matchEstado = (estadoSelect === 'Todos' || (reg.estado && String(reg.estado).toUpperCase().trim() === estadoSelect.toUpperCase().trim()));
            const matchCadena = (cadenaSelect === 'Todos' || (reg.cadena_productiva && String(reg.cadena_productiva).toUpperCase().trim() === cadenaSelect.toUpperCase().trim()));
            const matchServicio = (servicioSelect === 'Todos' || (reg.tipo_serv_accion && String(reg.tipo_serv_accion).toUpperCase().trim() === servicioSelect.toUpperCase().trim()));

            return matchTexto && matchFecha && matchCite && matchEstado && matchCadena && matchServicio;
        });

        // Filtrar también los informes para mantener la consistencia con el gráfico de checklist
        const codigosInformesFiltrados = new Set(filteredRegistros.map(r => r.cod_informe));
        filteredInformes = dashboardData.informes.filter(inf => codigosInformesFiltrados.has(inf.cod_informe));

        // Al cambiar filtros, resetear a página 1
        currentPage = 1;

        // Actualizar visualizaciones reactivas
        renderizarTodo();
    };

    // Eventos de Filtrado
    if (searchInput) searchInput.addEventListener('input', aplicarFiltros);
    if (filterFechaInicio) filterFechaInicio.addEventListener('change', aplicarFiltros);
    if (filterFechaFin) filterFechaFin.addEventListener('change', aplicarFiltros);
    if (filterCite) filterCite.addEventListener('change', aplicarFiltros);
    if (filterEstado) filterEstado.addEventListener('change', aplicarFiltros);
    if (filterCadena) filterCadena.addEventListener('change', aplicarFiltros);
    if (filterTipoServicio) filterTipoServicio.addEventListener('change', aplicarFiltros);
    
    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener('click', () => {
            searchInput.value = '';
            filterFechaInicio.value = '';
            filterFechaFin.value = '';
            filterCite.value = 'Todos';
            filterEstado.value = 'Todos';
            filterCadena.value = 'Todos';
            filterTipoServicio.value = 'Todos';
            aplicarFiltros();
        });
    }

    if (btnPrevPage) {
        btnPrevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderizarInbox();
                lucide.createIcons();
            }
        });
    }

    if (btnNextPage) {
        btnNextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredRegistros.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                renderizarInbox();
                lucide.createIcons();
            }
        });
    }

    // -------------------------------------------------------------
    // PROCEDIMIENTOS DE RENDERIZACIÓN DÁSHBOARD
    // -------------------------------------------------------------
    const renderizarTodo = () => {
        if (!dashboardData) return;

        renderizarKPIs();
        renderizarGraficoPrevalidacion();
        renderizarGraficoTransversales();
        renderizarGraficoChecklist();
        renderizarGraficosSegmentacion();
        renderizarInbox();
        
        lucide.createIcons(); 
    };

    // 1. KPIs Globales (5 Tarjetas Solicitadas) basados en el número de Servicios
    const renderizarKPIs = () => {
        const total = filteredRegistros.length;
        const conforme = filteredRegistros.filter(reg => reg.estado === 'CONFORME').length;
        const observado = filteredRegistros.filter(reg => reg.estado === 'OBSERVADO').length;
        const faltaInfo = filteredRegistros.filter(reg => reg.estado === 'FALTA INFORMACIÓN').length;

        const pConf = total > 0 ? ((conforme / total) * 100).toFixed(1) : "0.0";
        const pObs = total > 0 ? ((observado / total) * 100).toFixed(1) : "0.0";
        const pFi = total > 0 ? ((faltaInfo / total) * 100).toFixed(1) : "0.0";

        document.getElementById('kpi-total-servicios').innerText = total.toLocaleString();
        document.getElementById('kpi-evaluados-ia').innerText = total.toLocaleString();
        document.getElementById('kpi-evaluados-pct').innerText = total > 0 ? "100.0% de servicios" : "0% de servicios";

        document.getElementById('kpi-conformes-num').innerText = conforme.toLocaleString();
        document.getElementById('kpi-conformes-pct').innerText = `${pConf}% de servicios`;

        document.getElementById('kpi-observados-num').innerText = observado.toLocaleString();
        document.getElementById('kpi-observados-pct').innerText = `${pObs}% de servicios`;

        document.getElementById('kpi-falta-info-num').innerText = faltaInfo.toLocaleString();
        document.getElementById('kpi-falta-info-pct').innerText = `${pFi}% de servicios`;
    };

    // 2. Gráficos de Bloque 2 (Resultado de Validación) basados en el número de Servicios
    const renderizarGraficoPrevalidacion = () => {
        const conforme = filteredRegistros.filter(reg => reg.estado === 'CONFORME').length;
        const observado = filteredRegistros.filter(reg => reg.estado === 'OBSERVADO').length;
        const faltaInfo = filteredRegistros.filter(reg => reg.estado === 'FALTA INFORMACIÓN').length;

        const canvas = document.getElementById('chart-prevalidacion-bar');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        if (chartPreval) {
            chartPreval.destroy();
        }

        chartPreval = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Conforme', 'Observado', 'Falta Info'],
                datasets: [{
                    label: 'Servicios',
                    data: [conforme, observado, faltaInfo],
                    backgroundColor: [
                        '#15803d', // Verde
                        '#b45309', // Ámbar
                        '#b91c1c'  // Coral
                    ],
                    borderColor: [
                        '#166534',
                        '#92400e',
                        '#991b1b'
                    ],
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#64748b' },
                        grid: { color: '#f1f5f9' }
                    },
                    x: {
                        ticks: { color: '#64748b', font: { weight: 'bold' } },
                        grid: { display: false }
                    }
                }
            }
        });
    };

    const renderizarGraficoChecklist = () => {
        let erroresConteo = {};
        
        filteredInformes.forEach(inf => {
            if (inf.criterios) {
                inf.criterios.forEach(crit => {
                    if (!crit.aprobado) {
                        const label = crit.criterio;
                        erroresConteo[label] = (erroresConteo[label] || 0) + inf.unidades_productivas_count;
                    }
                });
            }
        });

        // Convertir a lista y ordenar de mayor a menor
        let erroresSorted = Object.keys(erroresConteo).map(key => {
            return { criterio: key, cantidad: erroresConteo[key] };
        }).sort((a, b) => b.cantidad - a.cantidad);

        const labels = erroresSorted.map(err => {
            let label = err.criterio;
            return label.length > 50 ? label.substring(0, 47) + "..." : label;
        });
        const data = erroresSorted.map(err => err.cantidad);

        const canvas = document.getElementById('chart-checklist-summary');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        if (chartChecklist) {
            chartChecklist.destroy();
        }

        chartChecklist = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['Sin observaciones'],
                datasets: [{
                    label: 'Servicios Afectados',
                    data: data.length > 0 ? data : [0],
                    backgroundColor: 'rgba(200, 16, 46, 0.85)', // Rojo ITP suave
                    borderColor: '#c8102e',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y', // Barra horizontal!
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 15,
                        right: 15
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            boxWidth: 10,
                            font: { size: 10, weight: '600' },
                            color: '#64748b',
                            padding: 8
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: '#64748b' },
                        grid: { color: '#f1f5f9' }
                    },
                    y: {
                        ticks: { color: '#64748b', font: { size: 10, weight: '500' } },
                        grid: { display: false }
                    }
                }
            }
        });
    };

    const renderizarGraficoTransversales = () => {
        let erroresConteo = {};
        
        filteredRegistros.forEach(reg => {
            let obs = reg.obs_trans || '';
            if (obs && obs !== 'Todas las reglas lógicas se cumplen.') {
                erroresConteo[obs] = (erroresConteo[obs] || 0) + 1;
            }
        });
        
        let erroresSorted = Object.keys(erroresConteo).map(key => {
            return { error: key, cantidad: erroresConteo[key] };
        }).sort((a, b) => b.cantidad - a.cantidad);
        
        // Mapeo robusto de etiquetas concisas para evitar recortes en la interfaz
        const labels = erroresSorted.map(err => {
            let label = err.error.toLowerCase();
            if (label.includes('ruc/dni no') || label.includes('no es ruc 20') || label.includes('ruc/dni no válido')) {
                return 'Estructura de RUC/DNI inválida';
            }
            if (label.includes('dni detectado') || label.includes('verificación manual')) {
                return 'DNI detectado (Control manual)';
            }
            return err.error.length > 35 ? err.error.substring(0, 32) + "..." : err.error;
        });
        const data = erroresSorted.map(err => err.cantidad);
        const fullDescriptions = erroresSorted.map(err => err.error); // Guardar descripciones completas para el tooltip
        
        const canvas = document.getElementById('chart-transversales-summary');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        if (chartTransversales) {
            chartTransversales.destroy();
        }
        
        chartTransversales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['Sin observaciones'],
                datasets: [{
                    label: 'Registros Afectados',
                    data: data.length > 0 ? data : [0],
                    backgroundColor: 'rgba(0, 47, 108, 0.85)', // Azul ITP premium suave
                    borderColor: '#002f6c',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y', // Barra horizontal!
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 25, // Aumentado para dar aire a los textos del eje Y
                        right: 15
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            boxWidth: 10,
                            font: { size: 10, weight: '600' },
                            color: '#64748b',
                            padding: 8
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let index = context.dataIndex;
                                let rawLabel = fullDescriptions[index];
                                let value = context.dataset.data[index];
                                return ` Afectados: ${value} (${rawLabel})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: { color: '#64748b', stepSize: 1 },
                        grid: { color: '#f1f5f9' }
                    },
                    y: {
                        ticks: { color: '#64748b', font: { size: 10, weight: '500' } },
                        grid: { display: false }
                    }
                }
            }
        });
    };

    // 3. Gráficos de Bloque 3 (Segmentación Apilada) basados en el número de Servicios
    const obtenerDatasetApilado = (datosAgrupados) => {
        const conformes = [];
        const observados = [];
        const faltaInfos = [];
        const labels = Object.keys(datosAgrupados);

        labels.forEach(key => {
            conformes.push(datosAgrupados[key].CONFORME || 0);
            observados.push(datosAgrupados[key].OBSERVADO || 0);
            faltaInfos.push(datosAgrupados[key]['FALTA INFORMACIÓN'] || 0);
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Conforme',
                    data: conformes,
                    backgroundColor: '#15803d',
                    borderRadius: 4,
                    barPercentage: 0.7
                },
                {
                    label: 'Observado',
                    data: observados,
                    backgroundColor: '#b45309',
                    borderRadius: 4,
                    barPercentage: 0.7
                },
                {
                    label: 'Falta Info',
                    data: faltaInfos,
                    backgroundColor: '#b91c1c',
                    borderRadius: 4,
                    barPercentage: 0.7
                }
            ]
        };
    };

    const renderizarGraficosSegmentacion = () => {
        // --- 3.1 VALIDACIÓN POR CITE ---
        const citeMap = {};
        filteredRegistros.forEach(reg => {
            if (!citeMap[reg.cite_ut]) {
                citeMap[reg.cite_ut] = { CONFORME: 0, OBSERVADO: 0, 'FALTA INFORMACIÓN': 0, total: 0 };
            }
            citeMap[reg.cite_ut][reg.estado]++;
            citeMap[reg.cite_ut].total++;
        });

        const topCites = Object.keys(citeMap)
            .map(key => ({ cite: key, ...citeMap[key] }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        const citeData = {};
        topCites.forEach(item => {
            let label = item.cite
                .replace("CITEagroindustrial", "Agroind.")
                .replace("CITEcuero y Calzado", "Cuero/Calzado")
                .replace("CITEtextil Camélidos", "Textil")
                .replace("CITEproductivo", "Prod.")
                .replace("CITEpesquero", "Pesq.")
                .replace("CITEacuícola", "Acuíc.")
                .replace("Unidad Técnica", "U.T.")
                .replace("CITE", "")
                .trim();
            if (label.length > 25) label = label.substring(0, 22) + "...";
            citeData[label] = item;
        });

        const citeStack = obtenerDatasetApilado(citeData);
        const canvasCite = document.getElementById('chart-cite-validation');
        if (canvasCite) {
            const ctxCite = canvasCite.getContext('2d');
            if (chartCite) chartCite.destroy();
            chartCite = new Chart(ctxCite, {
                type: 'bar',
                data: citeStack,
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            left: 15,
                            right: 15
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { boxWidth: 8, font: { size: 9, weight: '600' }, color: '#64748b', padding: 6 }
                        }
                    },
                    scales: {
                        x: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#f1f5f9' } },
                        y: { stacked: true, ticks: { color: '#64748b', font: { size: 9, weight: '700' }, autoSkip: false }, grid: { display: false } }
                    }
                }
            });
        }

        // --- 3.3 VALIDACIÓN POR CADENA PRODUCTIVA ---
        const cadenaMap = {};
        filteredRegistros.forEach(reg => {
            const cad = reg.cadena_productiva || 'No especificado';
            if (!cadenaMap[cad]) {
                cadenaMap[cad] = { CONFORME: 0, OBSERVADO: 0, 'FALTA INFORMACIÓN': 0, total: 0 };
            }
            cadenaMap[cad][reg.estado]++;
            cadenaMap[cad].total++;
        });

        const topCadenas = Object.keys(cadenaMap)
            .map(key => ({ cadena: key, ...cadenaMap[key] }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);

        const cadenaData = {};
        topCadenas.forEach(item => {
            let label = item.cadena;
            if (label.length > 15) label = label.substring(0, 12) + "...";
            cadenaData[label] = item;
        });

        const cadenaStack = obtenerDatasetApilado(cadenaData);
        const canvasCadena = document.getElementById('chart-cadena-validation');
        if (canvasCadena) {
            const ctxCadena = canvasCadena.getContext('2d');
            if (chartCadena) chartCadena.destroy();
            chartCadena = new Chart(ctxCadena, {
                type: 'bar',
                data: cadenaStack,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { boxWidth: 8, font: { size: 9, weight: '600' }, color: '#64748b', padding: 6 }
                        }
                    },
                    scales: {
                        x: { stacked: true, ticks: { color: '#64748b', font: { size: 10, weight: '600' } }, grid: { display: false } },
                        y: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#f1f5f9' } }
                    }
                }
            });
        }

        // --- 3.4 VALIDACIÓN POR TIPO DE SERVICIO ---
        const servicioMap = {};
        filteredRegistros.forEach(reg => {
            const serv = reg.tipo_serv_accion || 'No especificado';
            if (!servicioMap[serv]) {
                servicioMap[serv] = { CONFORME: 0, OBSERVADO: 0, 'FALTA INFORMACIÓN': 0, total: 0 };
            }
            servicioMap[serv][reg.estado]++;
            servicioMap[serv].total++;
        });

        const topServicios = Object.keys(servicioMap)
            .map(key => ({ servicio: key, ...servicioMap[key] }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);

        const servicioData = {};
        topServicios.forEach(item => {
            let label = item.servicio;
            if (label.length > 15) label = label.substring(0, 12) + "...";
            servicioData[label] = item;
        });

        const servicioStack = obtenerDatasetApilado(servicioData);
        const canvasServicio = document.getElementById('chart-servicio-validation');
        if (canvasServicio) {
            const ctxServicio = canvasServicio.getContext('2d');
            if (chartServicio) chartServicio.destroy();
            chartServicio = new Chart(ctxServicio, {
                type: 'bar',
                data: servicioStack,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: { boxWidth: 8, font: { size: 9, weight: '600' }, color: '#64748b', padding: 6 }
                        }
                    },
                    scales: {
                        x: { stacked: true, ticks: { color: '#64748b', font: { size: 10, weight: '600' } }, grid: { display: false } },
                        y: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: '#f1f5f9' } }
                    }
                }
            });
        }
    };

    // 4. Bandeja de Entrada de Servicios Paginada (Bloque 4)
    const renderizarInbox = () => {
        const inboxBody = document.getElementById('inbox-table-body');
        const filteredCountEl = document.getElementById('filtered-count');
        const totalCountEl = document.getElementById('total-count');
        
        if (!inboxBody) return;

        // Calcular total absoluto de registros en la base de datos completa
        let totalRegistros = 0;
        if (dashboardData) {
            dashboardData.informes.forEach(inf => {
                totalRegistros += (inf.empresas && inf.empresas.length > 0 ? inf.empresas.length : 1);
            });
        }

        filteredCountEl.innerText = filteredRegistros.length.toLocaleString();
        totalCountEl.innerText = totalRegistros.toLocaleString();

        if (filteredRegistros.length === 0) {
            inboxBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                        <i data-lucide="info" style="width: 24px; height: 24px; margin-bottom: 8px; display: inline-block;"></i><br>
                        No se encontraron registros de servicios con los criterios seleccionados.
                    </td>
                </tr>
            `;
            pageIndicator.innerText = "Página 1 de 1";
            btnPrevPage.disabled = true;
            btnNextPage.disabled = true;
            return;
        }

        // Paginación
        const totalPages = Math.ceil(filteredRegistros.length / itemsPerPage);
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;

        pageIndicator.innerText = `Página ${currentPage} de ${totalPages}`;
        btnPrevPage.disabled = (currentPage === 1);
        btnNextPage.disabled = (currentPage === totalPages);

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const itemsToRender = filteredRegistros.slice(startIndex, endIndex);

        // Renderizar registros en filas de tabla
        inboxBody.innerHTML = itemsToRender.map(reg => {
            let badgeClass = 'conforme';
            if (reg.estado === 'OBSERVADO') badgeClass = 'observado';
            else if (reg.estado === 'FALTA INFORMACIÓN') badgeClass = 'falta-info';

            // Observaciones Generales
            let cleanObsTrans = reg.obs_trans || '';
            if (cleanObsTrans.includes('Todas las reglas') && cleanObsTrans.includes('se cumplen')) {
                cleanObsTrans = '<span style="color: var(--state-green); font-weight: 600; font-size: 11px;">✓ Cumple reglas</span>';
            } else if (cleanObsTrans) {
                cleanObsTrans = `<span style="color: var(--state-coral); font-weight: 500; font-size: 11px;">${cleanObsTrans}</span>`;
            } else {
                cleanObsTrans = '<span style="color: var(--text-muted); font-size: 11px;">-</span>';
            }

            // Observaciones Específicas
            let cleanObsCheck = reg.obs_check || '';
            if (cleanObsCheck.includes('Cumple todos los criterios')) {
                cleanObsCheck = '<span style="color: var(--state-green); font-weight: 600; font-size: 11px;">✓ Cumple criterios</span>';
            } else if (cleanObsCheck) {
                cleanObsCheck = `<span style="color: var(--state-amber); font-weight: 500; font-size: 11px;">${cleanObsCheck}</span>`;
            } else {
                cleanObsCheck = '<span style="color: var(--text-muted); font-size: 11px;">-</span>';
            }

            return `
                <tr class="clickable-row" data-cod="${reg.cod_informe}">
                    <td style="font-family: var(--font-mono); font-size: 12.5px; font-weight: 700; color: var(--brand-blue);">${reg.cod_informe}</td>
                    <td><div class="table-cite-cell" title="${reg.cite_ut}">${reg.cite_ut}</div></td>
                    <td>
                        <div style="font-weight: 700; color: var(--brand-blue);">${reg.razon_social}</div>
                        <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); display: flex; align-items: center; gap: 4px; margin-top: 2px;">
                            <i data-lucide="hash" style="width: 10px; height: 10px;"></i> RUC: ${reg.ruc}
                        </div>
                    </td>
                    <td>${reg.cadena_productiva || 'No Esp.'}</td>
                    <td><div class="table-service-cell" title="${reg.tipo_serv_accion}">${reg.tipo_serv_accion}</div></td>
                    <td>${reg.region}</td>
                    <td>
                        <div class="table-obs-cell" title="${reg.obs_trans}" style="max-width: 220px; max-height: 60px; overflow-y: auto; font-size: 11px; line-height: 1.3;">
                            ${cleanObsTrans}
                        </div>
                    </td>
                    <td>
                        <div class="table-obs-cell" title="${reg.obs_check}" style="max-width: 280px; max-height: 60px; overflow-y: auto; font-size: 11px; line-height: 1.3;">
                            ${cleanObsCheck}
                        </div>
                    </td>
                    <td class="text-center">
                        <span class="badge-estado ${badgeClass}">${reg.estado}</span>
                    </td>
                </tr>
            `;
        }).join('');

        // Habilitar interactividad del Drawer en las filas de la tabla
        const filas = inboxBody.querySelectorAll('.clickable-row');
        filas.forEach(fila => {
            fila.addEventListener('click', () => {
                const cod = fila.getAttribute('data-cod');
                abrirDrawerAuditoria(cod);
            });
        });
    };

    // -------------------------------------------------------------
    // CAJÓN LATERAL DE DETALLE (AUDIT DRAWER)
    // -------------------------------------------------------------
    const auditDrawer = document.getElementById('audit-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');
    const drawerOverlay = document.getElementById('drawer-close-overlay');
    const drawerTabButtons = document.querySelectorAll('.drawer-tabs .tab-btn');

    const abrirDrawerAuditoria = (codInforme) => {
        if (!dashboardData) return;

        // Encontrar el informe por su código
        currentSelectedInforme = dashboardData.informes.find(inf => inf.cod_informe === codInforme);
        if (!currentSelectedInforme) return;

        console.log('Abriendo drawer para expediente:', currentSelectedInforme);

        // 1. Cargar Cabecera
        const badgeEstado = document.getElementById('drawer-estado-badge');
        const titInforme = document.getElementById('drawer-titulo-informe');
        const citeNombre = document.getElementById('drawer-cite-nombre');

        titInforme.innerText = currentSelectedInforme.cod_informe;
        citeNombre.innerText = currentSelectedInforme.cite_ut;
        
        let stateClass = 'conforme';
        if (currentSelectedInforme.estado === 'OBSERVADO') stateClass = 'observado';
        else if (currentSelectedInforme.estado === 'FALTA INFORMACIÓN') stateClass = 'falta-info';

        badgeEstado.className = `drawer-badge-estado ${stateClass}`;
        badgeEstado.innerText = currentSelectedInforme.estado;

        // 2. Cargar TAB 1 (Ficha)
        document.getElementById('drawer-ficha-tipo-servicio').innerText = currentSelectedInforme.tipo_serv_accion;
        document.getElementById('drawer-ficha-region').innerText = currentSelectedInforme.region;
        document.getElementById('drawer-ficha-horas').innerText = `${currentSelectedInforme.horas_efect.toFixed(1)} hrs`;
        
        let periodoStr = 'N/D';
        if (currentSelectedInforme.fecha_inicio && currentSelectedInforme.fecha_fin) {
            periodoStr = `${currentSelectedInforme.fecha_inicio} - ${currentSelectedInforme.fecha_fin}`;
        }
        document.getElementById('drawer-ficha-periodo').innerText = periodoStr;
        document.getElementById('drawer-ficha-cadena').innerText = currentSelectedInforme.cadena_productiva;
        document.getElementById('drawer-ficha-unidades').innerText = `${currentSelectedInforme.unidades_productivas_count} Unidades Productivas`;

        // 3. Cargar TAB 2 (Veredicto IA Checklist)
        const checklistContenedor = document.getElementById('drawer-ia-checklist');
        const recBox = document.getElementById('drawer-recommendation-box');
        const recText = document.getElementById('drawer-recommendation-text');
        
        if (checklistContenedor) {
            checklistContenedor.innerHTML = currentSelectedInforme.criterios.map(crit => {
                let critClass = 'ok';
                let critIcon = 'check-circle2';
                
                if (!crit.aprobado) {
                    critClass = 'fail';
                    critIcon = 'alert-circle';
                    
                    // Si el estado del reporte es falta de información, es un fallo crítico
                    if (currentSelectedInforme.estado === 'FALTA INFORMACIÓN') {
                        critClass = 'critical';
                        critIcon = 'x-circle';
                    }
                }

                return `
                    <div class="checklist-item ${critClass}">
                        <div class="checklist-icon">
                            <i data-lucide="${critIcon}"></i>
                        </div>
                        <div class="checklist-details">
                            <h5>${crit.criterio}</h5>
                            <p>${crit.detalle}</p>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Setear mensaje de recomendación adecuado
        if (recBox && recText) {
            recBox.className = 'glass-panel recommendation-panel'; // Limpiar clases
            
            if (currentSelectedInforme.estado === 'CONFORME') {
                recBox.classList.add('rec-green');
                recText.innerText = 'El expediente cumple de manera rigurosa con los criterios técnicos del SSIPRO y del manual de CITEs. Aprobado para control de presupuesto y registro final en cartera.';
            } else if (currentSelectedInforme.estado === 'FALTA INFORMACIÓN') {
                recBox.classList.add('rec-red');
                recText.innerText = 'ATENCIÓN: Error grave de consistencia física. No se encontró el informe técnico digitalizado o es un archivo ilegible. El proceso se detiene de inmediato. Requiere subsanación documental urgente por el CITE ejecutor.';
            } else {
                recBox.classList.add('rec-amber');
                recText.innerText = 'NOTIFICACIÓN DE OBSERVACIÓN: Se han detectado inconsistencias entre los participantes registrados y las metas de los informes de capacitación/asistencia técnica. Se recomienda retornar el expediente digital al CITE para que cargue la lista de asistencia o convocatoria y justifique las horas declaradas.';
            }
        }

        // 4. Cargar TAB 3 (Empresas)
        const empresasCountEl = document.getElementById('drawer-empresas-count');
        const empresasContenedor = document.getElementById('drawer-companies-list');
        
        empresasCountEl.innerText = currentSelectedInforme.empresas.length;
        if (empresasContenedor) {
            if (currentSelectedInforme.empresas.length === 0) {
                empresasContenedor.innerHTML = `<div style="color: var(--text-muted); font-size:13px; text-align:center; padding: 20px;">Sin unidades productivas con RUC registradas para este informe.</div>`;
            } else {
                empresasContenedor.innerHTML = currentSelectedInforme.empresas.map(emp => {
                    return `
                        <div class="company-card">
                            <span class="company-name" title="${emp.razon_social}">${emp.razon_social}</span>
                            <span class="company-ruc"><i data-lucide="hash"></i> RUC: ${emp.ruc}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        // 5. Mostrar el Drawer
        auditDrawer.classList.add('active');
        
        // Regresar a la Tab por defecto (Tab 1)
        activarTab('tab-ficha');
        
        lucide.createIcons(); // Instanciar Lucide Icons dentro del Drawer
    };

    const cerrarDrawerAuditoria = () => {
        auditDrawer.classList.remove('active');
    };

    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', cerrarDrawerAuditoria);
    if (drawerOverlay) drawerOverlay.addEventListener('click', cerrarDrawerAuditoria);


    // Lógica para cambiar de Tabs en el Drawer
    const activarTab = (tabId) => {
        currentTab = tabId;
        
        // Quitar clases activas
        drawerTabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            }
        });

        const tabContents = auditDrawer.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
            }
        });
    };

    drawerTabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            activarTab(tabId);
        });
    });

});
