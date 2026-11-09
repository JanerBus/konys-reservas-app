/**
 * ============================================================================
 * KONYS PIZZA — MÓDULO CLIENTE (cliente.js)
 * Manejo del DOM, renderizado de mesas, carta digital, modal y reservas.
 * ============================================================================
 */

(function () {
  'use strict';

  // Estado del flujo de cliente
  const state = {
    mesas: [],
    platos: [],
    horarios: [],
    filtroZona: 'todas',
    filtroCarta: 'todas',
    // Mesa seleccionada actualmente para reservar
    mesaSeleccionada: null,
    fechaSeleccionada: '',
    slotSeleccionado: null,
    // Reservas existentes para la fecha y mesa seleccionada
    reservasDelDia: []
  };

  // Franjas horarias oficiales de Konys Pizza
  // Lun a Vier: 12:00 md a 2:30 pm y 5:00 pm a 10:30 pm
  // Sáb y Dom: 12:00 md a 2:30 pm y 5:00 pm a 11:00 pm
  const SLOTS_CONFIG = {
    almuerzo: ['12:00', '12:30', '13:00', '13:30'],
    noche_semana: [
      '17:00', '17:30', '18:00', '18:30',
      '19:00', '19:30', '20:00', '20:30',
      '21:00', '21:30'
    ],
    noche_fin_semana: [
      '17:00', '17:30', '18:00', '18:30',
      '19:00', '19:30', '20:00', '20:30',
      '21:00', '21:30', '22:00'
    ]
  };

  // Referencias a elementos del DOM
  const dom = {
    tablesGrid: document.getElementById('tablesGrid'),
    menuGrid: document.getElementById('menuGrid'),
    countTodas: document.getElementById('countTodas'),
    countTerraza: document.getElementById('countTerraza'),
    countSalon: document.getElementById('countSalon'),
    zoneButtons: document.querySelectorAll('[data-zone]'),
    menuButtons: document.querySelectorAll('[data-cat]'),
    btnMobileNav: document.getElementById('btnMobileNav'),
    mainNav: document.getElementById('mainNav'),
    toastContainer: document.getElementById('toastContainer'),

    // Modal
    bookingModal: document.getElementById('bookingModal'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    modalMesaTitle: document.getElementById('modalMesaTitle'),
    modalMesaSubtitle: document.getElementById('modalMesaSubtitle'),
    bookingFlowContainer: document.getElementById('bookingFlowContainer'),
    voucherContainer: document.getElementById('voucherContainer'),
    bookingDateInput: document.getElementById('bookingDateInput'),
    lunchSlotsGrid: document.getElementById('lunchSlotsGrid'),
    dinnerSlotsGrid: document.getElementById('dinnerSlotsGrid'),
    clientNameInput: document.getElementById('clientNameInput'),
    clientPhoneInput: document.getElementById('clientPhoneInput'),
    clientGuestsInput: document.getElementById('clientGuestsInput'),
    capacityWarning: document.getElementById('capacityWarning'),
    btnConfirmBooking: document.getElementById('btnConfirmBooking'),
    stepIndicator1: document.getElementById('stepIndicator1'),
    stepIndicator2: document.getElementById('stepIndicator2'),
    stepIndicator3: document.getElementById('stepIndicator3'),

    // Resumen
    summaryMesa: document.getElementById('summaryMesa'),
    summaryZona: document.getElementById('summaryZona'),
    summaryFecha: document.getElementById('summaryFecha'),
    summaryHora: document.getElementById('summaryHora'),
    summaryPersonas: document.getElementById('summaryPersonas'),
    summaryBadge: document.getElementById('summaryBadge'),

    // Comprobante
    voucherCode: document.getElementById('voucherCode'),
    voucherClient: document.getElementById('voucherClient'),
    voucherMesa: document.getElementById('voucherMesa'),
    voucherFecha: document.getElementById('voucherFecha'),
    voucherHora: document.getElementById('voucherHora'),
    voucherGuests: document.getElementById('voucherGuests'),
    btnPrintVoucher: document.getElementById('btnPrintVoucher'),
    btnNewBooking: document.getElementById('btnNewBooking')
  };

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================
  document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    setupDatePicker();
    await cargarDatos();
  });

  function setupEventListeners() {
    // Navegación móvil
    if (dom.btnMobileNav && dom.mainNav) {
      dom.btnMobileNav.addEventListener('click', () => {
        dom.mainNav.classList.toggle('mobile-open');
      });
      // Cerrar al hacer clic en enlaces
      dom.mainNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => dom.mainNav.classList.remove('mobile-open'));
      });
    }

    // Filtros de zona de mesas
    dom.zoneButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        dom.zoneButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.filtroZona = e.currentTarget.dataset.zone;
        renderMesas();
      });
    });

    // Filtros de carta digital
    dom.menuButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        dom.menuButtons.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        state.filtroCarta = e.currentTarget.dataset.cat;
        renderCarta();
      });
    });

    // Cerrar modal
    if (dom.btnCloseModal) {
      dom.btnCloseModal.addEventListener('click', cerrarModal);
    }
    if (dom.bookingModal) {
      dom.bookingModal.addEventListener('click', (e) => {
        if (e.target === dom.bookingModal) cerrarModal();
      });
    }

    // Cambio de fecha en el modal
    if (dom.bookingDateInput) {
      dom.bookingDateInput.addEventListener('change', async (e) => {
        state.fechaSeleccionada = e.target.value;
        state.slotSeleccionado = null;
        actualizarIndicadoresPasos(1);
        await refrescarHorariosDisponibles();
        actualizarResumen();
      });
    }

    // Cambios en inputs de cliente
    if (dom.clientNameInput) {
      dom.clientNameInput.addEventListener('input', actualizarResumen);
    }
    if (dom.clientGuestsInput) {
      dom.clientGuestsInput.addEventListener('change', actualizarResumen);
    }

    // Botón confirmar reserva
    if (dom.btnConfirmBooking) {
      dom.btnConfirmBooking.addEventListener('click', procesarReserva);
    }

    // Botón imprimir / guardar comprobante PDF
    if (dom.btnPrintVoucher) {
      dom.btnPrintVoucher.addEventListener('click', (e) => {
        e.preventDefault();
        window.imprimirComprobante();
      });
    }

    // Botón hacer otra reserva desde el comprobante
    if (dom.btnNewBooking) {
      dom.btnNewBooking.addEventListener('click', () => {
        cerrarModal();
        const mesasSec = document.getElementById('mesas');
        if (mesasSec) mesasSec.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Cerrar con tecla Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dom.bookingModal && dom.bookingModal.classList.contains('active')) {
        cerrarModal();
      }
    });
  }

  function setupDatePicker() {
    if (!dom.bookingDateInput) return;
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];
    dom.bookingDateInput.min = hoyStr;

    // Máximo 30 días adelante
    const maxFecha = new Date();
    maxFecha.setDate(maxFecha.getDate() + 30);
    dom.bookingDateInput.max = maxFecha.toISOString().split('T')[0];

    // Por defecto hoy
    dom.bookingDateInput.value = hoyStr;
    state.fechaSeleccionada = hoyStr;
  }

  // ============================================================================
  // CARGA DE DATOS DESDE KONYS_DB
  // ============================================================================
  async function cargarDatos() {
    try {
      const [mesas, platos, horarios] = await Promise.all([
        window.KonysDB.getMesas('todas'),
        window.KonysDB.getPlatos('todas'),
        window.KonysDB.getHorarios()
      ]);

      state.mesas = mesas;
      state.platos = platos;
      state.horarios = horarios;

      actualizarContadoresMesas();
      renderMesas();
      renderCarta();
    } catch (err) {
      console.error('Error cargando datos en cliente:', err);
      showToast('Error al conectar con la base de datos', 'error');
    }
  }

  function actualizarContadoresMesas() {
    const total = state.mesas.length;
    const terraza = state.mesas.filter(m => m.zona.toLowerCase() === 'terraza').length;
    const salon = state.mesas.filter(m => m.zona.toLowerCase() === 'salon').length;

    if (dom.countTodas) dom.countTodas.textContent = total;
    if (dom.countTerraza) dom.countTerraza.textContent = terraza;
    if (dom.countSalon) dom.countSalon.textContent = salon;
  }

  // ============================================================================
  // RENDERIZADO DE MESAS (RF-01, RF-02)
  // ============================================================================
  function renderMesas() {
    if (!dom.tablesGrid) return;

    let filtradas = state.mesas;
    if (state.filtroZona !== 'todas') {
      filtradas = state.mesas.filter(m => m.zona.toLowerCase() === state.filtroZona.toLowerCase());
    }

    if (filtradas.length === 0) {
      dom.tablesGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted); background: #FFFFFF; border-radius: var(--radius-lg); border: 1px dashed var(--border);">
          <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 6px;">No hay mesas registradas en esta zona</p>
          <p style="font-size: 0.85rem;">Prueba seleccionando otra categoría o consulta en el panel administrador.</p>
        </div>
      `;
      return;
    }

    dom.tablesGrid.innerHTML = filtradas.map(mesa => {
      const isActiva = mesa.activa !== false;
      const estadoBadge = isActiva
        ? '<span class="status-badge libre">Libre</span>'
        : '<span class="status-badge inactiva">Mantenimiento</span>';

      return `
        <article class="table-card" id="card-${mesa.id}">
          <div class="table-visual">
            ${generarSvgMesa(mesa)}
            <div class="table-pill-zone">${mesa.zona}</div>
            <div class="table-pill-capacity">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>${mesa.capacidad} pers.</span>
            </div>
          </div>
          <div class="table-body">
            <div class="table-head">
              <h3 class="table-name">${escapeHtml(mesa.nombre)}</h3>
              ${estadoBadge}
            </div>
            <p class="table-details">
              Zona ${escapeHtml(mesa.zona)} · Capacidad máxima ${mesa.capacidad} personas.
            </p>
            <button 
              class="btn-select-table" 
              onclick="window.abrirModalReserva('${mesa.id}')"
              ${!isActiva ? 'disabled' : ''}>
              <span>${isActiva ? 'Ver horarios / Reservar' : 'No disponible'}</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  // Genera una ilustración SVG elegante de la mesa según su zona y capacidad
  function generarSvgMesa(mesa) {
    const isTerraza = mesa.zona.toLowerCase() === 'terraza';
    const bgCol = isTerraza ? '#113A3B' : '#142533';
    const accentCol = isTerraza ? '#F28C28' : '#38BDF8';
    const cap = parseInt(mesa.capacidad, 10) || 4;

    return `
      <svg viewBox="0 0 280 160" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <rect width="280" height="160" fill="${bgCol}"/>
        <!-- Guirnalda de luces ambiente superior -->
        <path d="M 10 24 Q 140 46 270 24" fill="none" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="1.5"/>
        <circle cx="50" cy="30" r="3" fill="#FDE047"/>
        <circle cx="100" cy="35" r="3" fill="#FDE047"/>
        <circle cx="140" cy="36" r="3" fill="#FDE047"/>
        <circle cx="180" cy="35" r="3" fill="#FDE047"/>
        <circle cx="230" cy="30" r="3" fill="#FDE047"/>

        <!-- Sillas alrededor de la mesa central -->
        <circle cx="95" cy="88" r="10" fill="#F8FAFC" stroke="#0F2B3D" stroke-width="2"/>
        <circle cx="185" cy="88" r="10" fill="#F8FAFC" stroke="#0F2B3D" stroke-width="2"/>
        ${cap >= 4 ? `
          <circle cx="115" cy="62" r="9" fill="#F8FAFC" stroke="#0F2B3D" stroke-width="2"/>
          <circle cx="165" cy="62" r="9" fill="#F8FAFC" stroke="#0F2B3D" stroke-width="2"/>
        ` : ''}
        ${cap >= 6 ? `
          <circle cx="115" cy="114" r="9" fill="#F8FAFC" stroke="#0F2B3D" stroke-width="2"/>
          <circle cx="165" cy="114" r="9" fill="#F8FAFC" stroke="#0F2B3D" stroke-width="2"/>
        ` : ''}

        <!-- Tablero de la Mesa -->
        <rect x="105" y="72" width="70" height="34" rx="8" fill="#FFFBEB" stroke="${accentCol}" stroke-width="2.5"/>
        <!-- Plato con Pizza servida al centro -->
        <circle cx="140" cy="89" r="12" fill="#FDE68A" stroke="#F28C28" stroke-width="1.5"/>
        <circle cx="140" cy="89" r="8" fill="#EA580C"/>
        <circle cx="137" cy="87" r="1.5" fill="#FEF08A"/>
        <circle cx="143" cy="91" r="1.5" fill="#FEF08A"/>
      </svg>
    `;
  }

  // ============================================================================
  // RENDERIZADO DE CARTA DIGITAL (RF-07)
  // ============================================================================
  function renderCarta() {
    if (!dom.menuGrid) return;

    let platos = state.platos.filter(p => p.disponible !== false);
    if (state.filtroCarta !== 'todas') {
      platos = platos.filter(p => p.categoria.toLowerCase() === state.filtroCarta.toLowerCase());
    }

    if (platos.length === 0) {
      dom.menuGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          No hay platos disponibles en esta categoría.
        </div>
      `;
      return;
    }

    dom.menuGrid.innerHTML = platos.map(plato => `
      <div class="dish-card">
        <div class="dish-cat-pill">[${plato.categoria}]</div>
        <h3 class="dish-name">${escapeHtml(plato.nombre)}</h3>
        <p class="dish-desc">${escapeHtml(plato.descripcion)}</p>
        <div class="dish-footer">
          <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Precio</span>
          <span class="dish-price">${formatoCOP(plato.precio)}</span>
        </div>
      </div>
    `).join('');
  }

  // ============================================================================
  // FLUJO MODAL DE RESERVA EN 3 PASOS (RF-03, RF-04, RF-05, RF-06)
  // ============================================================================
  window.abrirModalReserva = async function (mesaId) {
    const mesa = state.mesas.find(m => m.id === mesaId);
    if (!mesa) return;

    state.mesaSeleccionada = mesa;
    state.slotSeleccionado = null;

    // Configurar encabezado del modal
    if (dom.modalMesaTitle) dom.modalMesaTitle.textContent = `Reservar ${mesa.nombre}`;
    if (dom.modalMesaSubtitle) dom.modalMesaSubtitle.textContent = `Zona ${mesa.zona} · Capacidad máxima: ${mesa.capacidad} personas`;

    // Resetear vistas: mostrar formulario, ocultar comprobante
    if (dom.bookingFlowContainer) dom.bookingFlowContainer.style.display = 'grid';
    if (dom.voucherContainer) {
      dom.voucherContainer.style.display = 'none';
      dom.voucherContainer.classList.remove('active');
    }

    // Configurar selector de cantidad de personas (1 hasta capacidad máxima)
    if (dom.clientGuestsInput) {
      dom.clientGuestsInput.innerHTML = '<option value="">Selecciona la cantidad...</option>' +
        Array.from({ length: mesa.capacidad }, (_, i) => i + 1)
          .map(num => `<option value="${num}">${num} ${num === 1 ? 'persona' : 'personas'}</option>`)
          .join('');
      // Seleccionar por defecto la capacidad o 2
      const defaultGuests = Math.min(2, mesa.capacidad);
      dom.clientGuestsInput.value = defaultGuests;
    }

    if (dom.capacityWarning) {
      dom.capacityWarning.textContent = `Máximo ${mesa.capacidad} personas permitidas en esta mesa.`;
    }

    // Refrescar fecha y slots
    setupDatePicker();
    actualizarIndicadoresPasos(1);
    await refrescarHorariosDisponibles();
    actualizarResumen();

    // Abrir modal con animación
    if (dom.bookingModal) {
      dom.bookingModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  };

  function cerrarModal() {
    if (dom.bookingModal) {
      dom.bookingModal.classList.remove('active');
      document.body.style.overflow = '';
    }
    state.slotSeleccionado = null;
  }

  // Consulta reservas en la base de datos para la mesa y fecha seleccionadas
  async function refrescarHorariosDisponibles() {
    if (!state.mesaSeleccionada || !state.fechaSeleccionada) return;

    try {
      const reservas = await window.KonysDB.getReservas({
        mesa_id: state.mesaSeleccionada.id,
        fecha: state.fechaSeleccionada,
        estado: 'confirmada'
      });
      state.reservasDelDia = reservas;
      renderSlotsGrid();
    } catch (err) {
      console.error('Error obteniendo reservas:', err);
    }
  }

  // Renderiza los botones de slots para Almuerzo y Noche
  function renderSlotsGrid() {
    const horasOcupadas = new Set(state.reservasDelDia.map(r => r.hora_inicio));

    // Determinar si la fecha seleccionada es fin de semana (Sábado = 6, Domingo = 0)
    let esFinde = false;
    if (state.fechaSeleccionada) {
      const partes = state.fechaSeleccionada.split('-').map(Number);
      const fechaObj = new Date(partes[0], partes[1] - 1, partes[2]);
      const dia = fechaObj.getDay();
      esFinde = (dia === 0 || dia === 6);
    }

    const dinnerShiftLabel = document.getElementById('dinnerShiftLabel');
    if (dinnerShiftLabel) {
      dinnerShiftLabel.textContent = esFinde
        ? '🌙 Jornada Noche (5:00 p.m. – 11:00 p.m.)'
        : '🌙 Jornada Noche (5:00 p.m. – 10:30 p.m.)';
    }

    const nightSlots = esFinde ? SLOTS_CONFIG.noche_fin_semana : SLOTS_CONFIG.noche_semana;

    // 1. Jornada Almuerzo (12:00 md a 2:30 pm)
    if (dom.lunchSlotsGrid) {
      dom.lunchSlotsGrid.innerHTML = SLOTS_CONFIG.almuerzo.map(slot => {
        const ocupado = horasOcupadas.has(slot);
        const seleccionado = state.slotSeleccionado === slot;
        return `
          <button 
            type="button" 
            class="slot-btn ${seleccionado ? 'selected' : ''}" 
            ${ocupado ? 'disabled' : ''}
            onclick="window.seleccionarSlot('${slot}')"
            title="${ocupado ? 'Horario ya ocupado' : 'Disponible para reserva'}">
            ${slot}
          </button>
        `;
      }).join('');
    }

    // 2. Jornada Noche
    if (dom.dinnerSlotsGrid) {
      dom.dinnerSlotsGrid.innerHTML = nightSlots.map(slot => {
        const ocupado = horasOcupadas.has(slot);
        const seleccionado = state.slotSeleccionado === slot;
        return `
          <button 
            type="button" 
            class="slot-btn ${seleccionado ? 'selected' : ''}" 
            ${ocupado ? 'disabled' : ''}
            onclick="window.seleccionarSlot('${slot}')"
            title="${ocupado ? 'Horario ya ocupado' : 'Disponible para reserva'}">
            ${slot}
          </button>
        `;
      }).join('');
    }
  }

  // Selecciona una franja horaria
  window.seleccionarSlot = function (hora) {
    state.slotSeleccionado = hora;
    actualizarIndicadoresPasos(2);
    renderSlotsGrid();
    actualizarResumen();
  };

  // Actualiza los datos en la tarjeta de resumen del modal
  function actualizarResumen() {
    if (!state.mesaSeleccionada) return;

    if (dom.summaryMesa) dom.summaryMesa.textContent = state.mesaSeleccionada.nombre;
    if (dom.summaryZona) dom.summaryZona.textContent = state.mesaSeleccionada.zona.toUpperCase();
    if (dom.summaryFecha) dom.summaryFecha.textContent = formatearFechaLegible(state.fechaSeleccionada);

    if (state.slotSeleccionado) {
      const horaFin = window.KonysDB.calcularHoraFin(state.slotSeleccionado, 60);
      if (dom.summaryHora) dom.summaryHora.textContent = `${state.slotSeleccionado} – ${horaFin} (60 min)`;
    } else {
      if (dom.summaryHora) dom.summaryHora.textContent = 'Elige un horario';
    }

    const personas = dom.clientGuestsInput ? dom.clientGuestsInput.value : '';
    if (dom.summaryPersonas) dom.summaryPersonas.textContent = personas ? `${personas} personas` : '—';

    // Validación para habilitar el botón de confirmar
    const nombre = dom.clientNameInput ? dom.clientNameInput.value.trim() : '';
    const esValido = Boolean(state.slotSeleccionado && nombre && personas);

    if (dom.btnConfirmBooking) {
      dom.btnConfirmBooking.disabled = !esValido;
    }

    if (esValido) {
      actualizarIndicadoresPasos(3);
    }
  }

  // Actualiza visualmente el stepper de 3 pasos
  function actualizarIndicadoresPasos(paso) {
    [dom.stepIndicator1, dom.stepIndicator2, dom.stepIndicator3].forEach((el, idx) => {
      if (!el) return;
      el.classList.remove('active', 'completed');
      if (idx + 1 === paso) {
        el.classList.add('active');
      } else if (idx + 1 < paso) {
        el.classList.add('completed');
      }
    });
  }

  // ============================================================================
  // PROCESAMIENTO Y CREACIÓN DE RESERVA (RF-05, RF-06)
  // ============================================================================
  async function procesarReserva() {
    if (!state.mesaSeleccionada || !state.slotSeleccionado) {
      showToast('Por favor selecciona una fecha y horario', 'warning');
      return;
    }

    const hoyStr = new Date().toISOString().split('T')[0];
    if (state.fechaSeleccionada < hoyStr) {
      showToast('No es posible realizar reservas en fechas pasadas', 'warning');
      return;
    }

    const nombre = dom.clientNameInput.value.trim();
    const contacto = dom.clientPhoneInput.value.trim();
    const personas = parseInt(dom.clientGuestsInput.value, 10);

    if (!nombre) {
      showToast('Por favor ingresa tu nombre completo', 'warning');
      dom.clientNameInput.focus();
      return;
    }

    if (!personas || personas < 1 || personas > state.mesaSeleccionada.capacidad) {
      showToast(`La cantidad de personas debe ser entre 1 y ${state.mesaSeleccionada.capacidad}`, 'warning');
      return;
    }

    // Deshabilitar botón durante el envío para evitar doble clic
    dom.btnConfirmBooking.disabled = true;
    dom.btnConfirmBooking.innerHTML = `<span>Confirmando...</span>`;

    try {
      const nuevaReserva = await window.KonysDB.crearReserva({
        mesa_id: state.mesaSeleccionada.id,
        cliente_nombre: nombre,
        cliente_contacto: contacto,
        num_personas: personas,
        fecha: state.fechaSeleccionada,
        hora_inicio: state.slotSeleccionado
      });

      showToast('¡Reserva confirmada con éxito!', 'success');
      mostrarComprobante(nuevaReserva);
    } catch (err) {
      console.error('Error al procesar reserva:', err);
      showToast(err.message || 'Error al procesar la reserva', 'error');
      // Recargar slots por si fue tomada por otro cliente en ese instante
      await refrescarHorariosDisponibles();
    } finally {
      dom.btnConfirmBooking.disabled = false;
      dom.btnConfirmBooking.innerHTML = `
        <span>Confirmar Reserva</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
      `;
    }
  }

  // Muestra la pantalla del comprobante de confirmación (RF-06)
  function mostrarComprobante(reserva) {
    if (dom.bookingFlowContainer) dom.bookingFlowContainer.style.display = 'none';

    if (dom.voucherCode) dom.voucherCode.textContent = `#${reserva.id}`;
    if (dom.voucherClient) dom.voucherClient.textContent = reserva.cliente_nombre;
    if (dom.voucherMesa) dom.voucherMesa.textContent = `${state.mesaSeleccionada.nombre} (${state.mesaSeleccionada.zona.toUpperCase()})`;
    if (dom.voucherFecha) dom.voucherFecha.textContent = formatearFechaLegible(reserva.fecha);
    if (dom.voucherHora) dom.voucherHora.textContent = `${reserva.hora_inicio} – ${reserva.hora_fin} (60 min)`;
    if (dom.voucherGuests) dom.voucherGuests.textContent = `${reserva.num_personas} ${reserva.num_personas === 1 ? 'persona' : 'personas'}`;

    if (dom.voucherContainer) {
      dom.voucherContainer.style.display = 'block';
      dom.voucherContainer.classList.add('active');
    }
  }

  // Manejo optimizado para impresión de comprobante / guardar PDF en 1 sola página limpia
  window.imprimirComprobante = function () {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'visible';

    const restaurar = () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('afterprint', restaurar);
    };

    window.addEventListener('afterprint', restaurar);
    window.print();

    // Fallback de restauración por si el navegador no dispara afterprint
    setTimeout(() => {
      document.body.style.overflow = prevOverflow;
    }, 1200);
  };

  // ============================================================================
  // UTILIDADES
  // ============================================================================
  function formatoCOP(valor) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor);
  }

  function formatearFechaLegible(fechaStr) {
    if (!fechaStr) return '—';
    const partes = fechaStr.split('-');
    if (partes.length !== 3) return fechaStr;
    const d = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
    return d.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function showToast(mensaje, tipo = 'info') {
    if (!dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    if (tipo === 'error') toast.style.borderLeftColor = 'var(--status-occupied-text)';
    if (tipo === 'success') toast.style.borderLeftColor = 'var(--status-free-text)';

    toast.textContent = mensaje;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  window.showToast = showToast;
})();
