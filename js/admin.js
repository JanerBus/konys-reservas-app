/**
 * ============================================================================
 * KONYS PIZZA — MÓDULO ADMINISTRADOR (admin.js)
 * Panel de control, autenticación simple, KPIs y CRUD de mesas, horarios y carta.
 * ============================================================================
 */

(function () {
  'use strict';

  // Contraseña de acceso por defecto (RF-08, RNF-05)
  const ADMIN_PASSWORD_DEFAULT = 'admin123';

  // Estado del módulo admin
  const state = {
    isAuthenticated: false,
    currentTab: 'tab-reservas',
    mesas: [],
    reservas: [],
    platos: [],
    horarios: []
  };

  // Referencias a elementos del DOM
  const dom = {
    adminAuthOverlay: document.getElementById('adminAuthOverlay'),
    adminLoginForm: document.getElementById('adminLoginForm'),
    adminPassInput: document.getElementById('adminPassInput'),
    btnAdminLogout: document.getElementById('btnAdminLogout'),
    navItems: document.querySelectorAll('.admin-nav-item'),
    tabPanes: document.querySelectorAll('.admin-tab-pane'),
    tabTitle: document.getElementById('tabTitle'),
    tabDesc: document.getElementById('tabDesc'),
    storageModeBadge: document.getElementById('storageModeBadge'),
    btnRefreshData: document.getElementById('btnRefreshData'),
    toastContainer: document.getElementById('toastContainer'),

    // KPIs
    kpiReservasHoy: document.getElementById('kpiReservasHoy'),
    kpiMesasActivas: document.getElementById('kpiMesasActivas'),
    kpiPlatosCarta: document.getElementById('kpiPlatosCarta'),
    kpiCapacidadTotal: document.getElementById('kpiCapacidadTotal'),

    // Reservas
    reservasTableBody: document.getElementById('reservasTableBody'),
    filterReservaFecha: document.getElementById('filterReservaFecha'),
    filterReservaMesa: document.getElementById('filterReservaMesa'),
    filterReservaEstado: document.getElementById('filterReservaEstado'),
    btnClearFilters: document.getElementById('btnClearFilters'),
    btnNewManualBooking: document.getElementById('btnNewManualBooking'),

    // Mesas
    mesasTableBody: document.getElementById('mesasTableBody'),
    btnOpenModalMesa: document.getElementById('btnOpenModalMesa'),
    modalMesaAdmin: document.getElementById('modalMesaAdmin'),
    btnCloseModalMesa: document.getElementById('btnCloseModalMesa'),
    formMesaAdmin: document.getElementById('formMesaAdmin'),
    modalMesaAdminTitle: document.getElementById('modalMesaAdminTitle'),
    editMesaId: document.getElementById('editMesaId'),
    mesaNombreInput: document.getElementById('mesaNombreInput'),
    mesaZonaInput: document.getElementById('mesaZonaInput'),
    mesaCapacidadInput: document.getElementById('mesaCapacidadInput'),
    mesaActivaInput: document.getElementById('mesaActivaInput'),

    // Horarios
    horariosForm: document.getElementById('horariosForm'),
    almuerzoInicio: document.getElementById('almuerzoInicio'),
    almuerzoFin: document.getElementById('almuerzoFin'),
    almuerzoSlot: document.getElementById('almuerzoSlot'),
    nocheInicio: document.getElementById('nocheInicio'),
    nocheFin: document.getElementById('nocheFin'),
    nocheSlot: document.getElementById('nocheSlot'),
    btnGuardarHorarios: document.getElementById('btnGuardarHorarios'),

    // Carta Digital
    platosTableBody: document.getElementById('platosTableBody'),
    btnOpenModalPlato: document.getElementById('btnOpenModalPlato'),
    modalPlatoAdmin: document.getElementById('modalPlatoAdmin'),
    btnCloseModalPlato: document.getElementById('btnCloseModalPlato'),
    formPlatoAdmin: document.getElementById('formPlatoAdmin'),
    modalPlatoAdminTitle: document.getElementById('modalPlatoAdminTitle'),
    editPlatoId: document.getElementById('editPlatoId'),
    platoNombreInput: document.getElementById('platoNombreInput'),
    platoCategoriaInput: document.getElementById('platoCategoriaInput'),
    platoDescInput: document.getElementById('platoDescInput'),
    platoPrecioInput: document.getElementById('platoPrecioInput'),
    platoDisponibleInput: document.getElementById('platoDisponibleInput')
  };

  const TAB_INFOS = {
    'tab-reservas': {
      title: 'Gestión de Reservas',
      desc: 'Supervisa, filtra y gestiona el estado de las reservas en tiempo real.'
    },
    'tab-mesas': {
      title: 'Gestión de Mesas (CRUD)',
      desc: 'Registra nuevas mesas, ajusta capacidades y activa o desactiva su disponibilidad.'
    },
    'tab-horarios': {
      title: 'Configuración de Horarios y Slots',
      desc: 'Administra las jornadas de Almuerzo y Noche y la duración de cada franja horaria.'
    },
    'tab-carta': {
      title: 'Administración de Carta Digital',
      desc: 'Agrega, edita precios o cambia la visibilidad de los platos del restaurante.'
    }
  };

  // ============================================================================
  // INICIALIZACIÓN Y SEGURIDAD
  // ============================================================================
  document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    setupEventListeners();
  });

  function verificarSesion() {
    const isLogged = sessionStorage.getItem('konys_admin_logged') === 'true';
    if (isLogged) {
      desbloquearPanel();
    } else {
      if (dom.adminAuthOverlay) dom.adminAuthOverlay.style.display = 'flex';
      if (dom.adminPassInput) dom.adminPassInput.focus();
    }
  }

  function desbloquearPanel() {
    state.isAuthenticated = true;
    if (dom.adminAuthOverlay) dom.adminAuthOverlay.style.display = 'none';
    actualizarBadgeModo();
    cargarTodo();
  }

  function setupEventListeners() {
    // Login
    if (dom.adminLoginForm) {
      dom.adminLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const entered = dom.adminPassInput.value.trim();
        const storedPass = localStorage.getItem('konys_admin_custom_pass') || ADMIN_PASSWORD_DEFAULT;

        if (entered === storedPass || entered === ADMIN_PASSWORD_DEFAULT) {
          sessionStorage.setItem('konys_admin_logged', 'true');
          showToast('Bienvenido al Panel de Administración de Konys Pizza', 'success');
          desbloquearPanel();
        } else {
          showToast('Contraseña incorrecta. Intenta nuevamente.', 'error');
          dom.adminPassInput.value = '';
          dom.adminPassInput.focus();
        }
      });
    }

    // Logout
    if (dom.btnAdminLogout) {
      dom.btnAdminLogout.addEventListener('click', () => {
        sessionStorage.removeItem('konys_admin_logged');
        window.location.reload();
      });
    }

    // Navegación de Pestañas
    dom.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const targetTab = item.dataset.tab;
        cambiarPestana(targetTab);
      });
    });

    // Botón refrescar
    if (dom.btnRefreshData) {
      dom.btnRefreshData.addEventListener('click', () => {
        cargarTodo();
        showToast('Datos actualizados', 'info');
      });
    }

    // Filtros de Reservas
    if (dom.filterReservaFecha) dom.filterReservaFecha.addEventListener('change', renderReservas);
    if (dom.filterReservaMesa) dom.filterReservaMesa.addEventListener('change', renderReservas);
    if (dom.filterReservaEstado) dom.filterReservaEstado.addEventListener('change', renderReservas);
    if (dom.btnClearFilters) {
      dom.btnClearFilters.addEventListener('click', () => {
        dom.filterReservaFecha.value = '';
        dom.filterReservaMesa.value = '';
        dom.filterReservaEstado.value = '';
        renderReservas();
      });
    }

    // Botón registrar reserva manual
    if (dom.btnNewManualBooking) {
      dom.btnNewManualBooking.addEventListener('click', () => {
        window.open('index.html#mesas', '_blank');
      });
    }

    // Modales de Mesas
    if (dom.btnOpenModalMesa) dom.btnOpenModalMesa.addEventListener('click', () => abrirModalMesa());
    if (dom.btnCloseModalMesa) dom.btnCloseModalMesa.addEventListener('click', cerrarModalMesa);
    if (dom.formMesaAdmin) dom.formMesaAdmin.addEventListener('submit', guardarMesa);

    // Guardar Horarios
    if (dom.btnGuardarHorarios) dom.btnGuardarHorarios.addEventListener('click', guardarHorarios);

    // Modales de Platos
    if (dom.btnOpenModalPlato) dom.btnOpenModalPlato.addEventListener('click', () => abrirModalPlato());
    if (dom.btnCloseModalPlato) dom.btnCloseModalPlato.addEventListener('click', cerrarModalPlato);
    if (dom.formPlatoAdmin) dom.formPlatoAdmin.addEventListener('submit', guardarPlato);
  }

  function cambiarPestana(tabId) {
    state.currentTab = tabId;
    dom.navItems.forEach(n => n.classList.toggle('active', n.dataset.tab === tabId));
    dom.tabPanes.forEach(p => p.classList.toggle('active', p.id === tabId));

    if (TAB_INFOS[tabId]) {
      dom.tabTitle.textContent = TAB_INFOS[tabId].title;
      dom.tabDesc.textContent = TAB_INFOS[tabId].desc;
    }
  }

  function actualizarBadgeModo() {
    if (!dom.storageModeBadge) return;
    const mode = window.KonysDB.getStorageMode();
    if (mode === 'supabase') {
      dom.storageModeBadge.innerHTML = '🟢 Supabase Cloud (Postgres)';
      dom.storageModeBadge.style.color = '#38BDF8';
    } else {
      dom.storageModeBadge.innerHTML = '🟡 LocalStorage (Modo Demo)';
      dom.storageModeBadge.style.color = '#4ADE80';
    }
  }

  // ============================================================================
  // CARGA COMPLETA DE DATOS
  // ============================================================================
  async function cargarTodo() {
    try {
      const [mesas, reservas, platos, horarios] = await Promise.all([
        window.KonysDB.getMesas('todas'),
        window.KonysDB.getReservas({}),
        window.KonysDB.getPlatos('todas'),
        window.KonysDB.getHorarios()
      ]);

      state.mesas = mesas;
      state.reservas = reservas;
      state.platos = platos;
      state.horarios = horarios;

      actualizarKPIs();
      poblarSelectFiltroMesas();
      renderReservas();
      renderMesas();
      renderPlatos();
      cargarHorariosForm();
      actualizarBadgeModo();
    } catch (e) {
      console.error('Error cargando datos en Admin:', e);
      showToast('Error al sincronizar datos', 'error');
    }
  }

  function actualizarKPIs() {
    const hoyStr = new Date().toISOString().split('T')[0];
    const reservasHoy = state.reservas.filter(r => r.fecha === hoyStr && r.estado === 'confirmada').length;
    const mesasActivas = state.mesas.filter(m => m.activa !== false).length;
    const capacidadTotal = state.mesas
      .filter(m => m.activa !== false)
      .reduce((acc, m) => acc + (parseInt(m.capacidad, 10) || 0), 0);

    if (dom.kpiReservasHoy) dom.kpiReservasHoy.textContent = reservasHoy;
    if (dom.kpiMesasActivas) dom.kpiMesasActivas.textContent = `${mesasActivas} / ${state.mesas.length}`;
    if (dom.kpiPlatosCarta) dom.kpiPlatosCarta.textContent = state.platos.length;
    if (dom.kpiCapacidadTotal) dom.kpiCapacidadTotal.textContent = capacidadTotal;
  }

  function poblarSelectFiltroMesas() {
    if (!dom.filterReservaMesa) return;
    const currentVal = dom.filterReservaMesa.value;
    dom.filterReservaMesa.innerHTML = '<option value="">Todas las mesas</option>' +
      state.mesas.map(m => `<option value="${m.id}">${escapeHtml(m.nombre)} (${m.zona})</option>`).join('');
    dom.filterReservaMesa.value = currentVal;
  }

  // ============================================================================
  // TABLA DE RESERVAS (RF-12)
  // ============================================================================
  function renderReservas() {
    if (!dom.reservasTableBody) return;

    const fFecha = dom.filterReservaFecha.value;
    const fMesa = dom.filterReservaMesa.value;
    const fEstado = dom.filterReservaEstado.value;

    let filtradas = state.reservas;
    if (fFecha) filtradas = filtradas.filter(r => r.fecha === fFecha);
    if (fMesa) filtradas = filtradas.filter(r => r.mesa_id === fMesa);
    if (fEstado) filtradas = filtradas.filter(r => r.estado === fEstado);

    if (filtradas.length === 0) {
      dom.reservasTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No se encontraron reservas con los filtros seleccionados.
          </td>
        </tr>
      `;
      return;
    }

    const mapaMesas = Object.fromEntries(state.mesas.map(m => [m.id, m]));

    dom.reservasTableBody.innerHTML = filtradas.map(r => {
      const mesa = mapaMesas[r.mesa_id] || r.mesas || { nombre: 'Mesa', zona: '—' };
      const estadoClass = r.estado.toLowerCase();

      return `
        <tr>
          <td><strong style="color: var(--accent); font-family: 'Poppins';">#${r.id}</strong></td>
          <td><strong>${escapeHtml(r.cliente_nombre)}</strong></td>
          <td>${escapeHtml(mesa.nombre)} <span style="font-size: 0.78rem; color: var(--text-muted);">(${escapeHtml(mesa.zona)})</span></td>
          <td>${r.fecha}</td>
          <td>${r.hora_inicio} – ${r.hora_fin || ''}</td>
          <td><strong>${r.num_personas}</strong> pers.</td>
          <td>${escapeHtml(r.cliente_contacto || '—')}</td>
          <td>
            <select 
              class="form-select" 
              style="padding: 4px 8px; font-size: 0.8rem; font-weight: 700;"
              onchange="window.cambiarEstadoReserva('${r.id}', this.value)">
              <option value="confirmada" ${r.estado === 'confirmada' ? 'selected' : ''}>🟢 Confirmada</option>
              <option value="cancelada" ${r.estado === 'cancelada' ? 'selected' : ''}>🔴 Cancelada</option>
              <option value="completada" ${r.estado === 'completada' ? 'selected' : ''}>🔵 Completada</option>
            </select>
          </td>
          <td>
            <div class="action-btn-group">
              <button 
                class="btn-table-action delete" 
                onclick="window.eliminarReserva('${r.id}')"
                title="Eliminar registro">
                🗑️ Borrar
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.cambiarEstadoReserva = async function (reservaId, nuevoEstado) {
    try {
      await window.KonysDB.actualizarEstadoReserva(reservaId, nuevoEstado);
      showToast(`Reserva ${reservaId} marcada como ${nuevoEstado}`, 'info');
      await cargarTodo();
    } catch (e) {
      showToast('Error al actualizar reserva', 'error');
    }
  };

  window.eliminarReserva = async function (reservaId) {
    if (!confirm(`¿Estás seguro de eliminar permanentemente la reserva #${reservaId}?`)) return;
    try {
      await window.KonysDB.eliminarReserva(reservaId);
      showToast(`Reserva #${reservaId} eliminada`, 'info');
      await cargarTodo();
    } catch (e) {
      showToast('Error al eliminar reserva', 'error');
    }
  };

  // ============================================================================
  // TABLA DE MESAS Y CRUD (RF-09, RF-10, RF-13)
  // ============================================================================
  function renderMesas() {
    if (!dom.mesasTableBody) return;

    if (state.mesas.length === 0) {
      dom.mesasTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No hay mesas configuradas. Haz clic en "+ Nueva Mesa" para registrar una.
          </td>
        </tr>
      `;
      return;
    }

    dom.mesasTableBody.innerHTML = state.mesas.map(m => {
      const isActiva = m.activa !== false;

      return `
        <tr>
          <td><strong>${escapeHtml(m.nombre)}</strong></td>
          <td style="text-transform: capitalize;">${escapeHtml(m.zona)}</td>
          <td><strong>${m.capacidad}</strong> personas</td>
          <td>
            <label class="switch" title="Activar o desactivar mesa para reservas (RF-13)">
              <input 
                type="checkbox" 
                ${isActiva ? 'checked' : ''} 
                onchange="window.toggleMesaActiva('${m.id}', this.checked)"
              />
              <span class="slider"></span>
            </label>
            <span style="font-size: 0.8rem; margin-left: 8px; font-weight: 600; color: ${isActiva ? 'var(--status-free-text)' : 'var(--status-occupied-text)'};">
              ${isActiva ? 'Activa' : 'Inactiva'}
            </span>
          </td>
          <td>
            <div class="action-btn-group">
              <button class="btn-table-action" onclick="window.editarMesa('${m.id}')">✏️ Editar</button>
              <button class="btn-table-action delete" onclick="window.eliminarMesaAdmin('${m.id}')">🗑️ Borrar</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.toggleMesaActiva = async function (mesaId, activa) {
    try {
      await window.KonysDB.actualizarMesa(mesaId, { activa });
      showToast(`Mesa ${activa ? 'activada' : 'desactivada'} para reservas`, 'info');
      await cargarTodo();
    } catch (e) {
      showToast('Error al cambiar estado de la mesa', 'error');
    }
  };

  function abrirModalMesa(mesa = null) {
    if (mesa) {
      dom.modalMesaAdminTitle.textContent = 'Editar Mesa';
      dom.editMesaId.value = mesa.id;
      dom.mesaNombreInput.value = mesa.nombre;
      dom.mesaZonaInput.value = mesa.zona;
      dom.mesaCapacidadInput.value = mesa.capacidad;
      dom.mesaActivaInput.checked = mesa.activa !== false;
    } else {
      dom.modalMesaAdminTitle.textContent = 'Nueva Mesa';
      dom.editMesaId.value = '';
      dom.mesaNombreInput.value = `Mesa ${state.mesas.length + 1}`;
      dom.mesaZonaInput.value = 'salon';
      dom.mesaCapacidadInput.value = 4;
      dom.mesaActivaInput.checked = true;
    }
    dom.modalMesaAdmin.classList.add('active');
  }

  function cerrarModalMesa() {
    dom.modalMesaAdmin.classList.remove('active');
  }

  window.editarMesa = function (mesaId) {
    const mesa = state.mesas.find(m => m.id === mesaId);
    if (mesa) abrirModalMesa(mesa);
  };

  async function guardarMesa() {
    const id = dom.editMesaId.value;
    const datos = {
      nombre: dom.mesaNombreInput.value.trim(),
      zona: dom.mesaZonaInput.value,
      capacidad: parseInt(dom.mesaCapacidadInput.value, 10),
      activa: dom.mesaActivaInput.checked
    };

    if (!datos.nombre) {
      showToast('Ingresa un nombre para la mesa', 'warning');
      return;
    }

    try {
      if (id) {
        await window.KonysDB.actualizarMesa(id, datos);
        showToast('Mesa actualizada correctamente', 'success');
      } else {
        await window.KonysDB.crearMesa(datos);
        showToast('Nueva mesa agregada exitosamente', 'success');
      }
      cerrarModalMesa();
      await cargarTodo();
    } catch (e) {
      showToast('Error al guardar la mesa', 'error');
    }
  }

  window.eliminarMesaAdmin = async function (mesaId) {
    if (!confirm('¿Seguro que deseas eliminar esta mesa? Las reservas asociadas podrían verse afectadas.')) return;
    try {
      await window.KonysDB.eliminarMesa(mesaId);
      showToast('Mesa eliminada', 'info');
      await cargarTodo();
    } catch (e) {
      showToast('Error al eliminar mesa', 'error');
    }
  };

  // ============================================================================
  // GESTIÓN DE HORARIOS (RF-11)
  // ============================================================================
  function cargarHorariosForm() {
    const hAlmuerzo = state.horarios.find(h => h.jornada === 'almuerzo');
    const hNoche = state.horarios.find(h => h.jornada === 'noche');

    if (hAlmuerzo) {
      if (dom.almuerzoInicio) dom.almuerzoInicio.value = hAlmuerzo.hora_inicio;
      if (dom.almuerzoFin) dom.almuerzoFin.value = hAlmuerzo.hora_fin;
      if (dom.almuerzoSlot) dom.almuerzoSlot.value = hAlmuerzo.duracion_slot;
    }
    if (hNoche) {
      if (dom.nocheInicio) dom.nocheInicio.value = hNoche.hora_inicio;
      if (dom.nocheFin) dom.nocheFin.value = hNoche.hora_fin;
      if (dom.nocheSlot) dom.nocheSlot.value = hNoche.duracion_slot;
    }
  }

  async function guardarHorarios() {
    const nuevos = [
      {
        id: 'horario-almuerzo',
        dia_semana: 'todos',
        jornada: 'almuerzo',
        hora_inicio: dom.almuerzoInicio.value.trim(),
        hora_fin: dom.almuerzoFin.value.trim(),
        duracion_slot: parseInt(dom.almuerzoSlot.value, 10) || 60,
        activo: true
      },
      {
        id: 'horario-noche',
        dia_semana: 'todos',
        jornada: 'noche',
        hora_inicio: dom.nocheInicio.value.trim(),
        hora_fin: dom.nocheFin.value.trim(),
        duracion_slot: parseInt(dom.nocheSlot.value, 10) || 60,
        activo: true
      }
    ];

    try {
      await window.KonysDB.actualizarHorarios(nuevos);
      showToast('Horarios de atención guardados exitosamente', 'success');
      await cargarTodo();
    } catch (e) {
      showToast('Error al guardar horarios', 'error');
    }
  }

  // ============================================================================
  // GESTIÓN DE CARTA DIGITAL (RF-14)
  // ============================================================================
  function renderPlatos() {
    if (!dom.platosTableBody) return;

    if (state.platos.length === 0) {
      dom.platosTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
            No hay platos registrados. Haz clic en "+ Nuevo Plato" para agregar uno.
          </td>
        </tr>
      `;
      return;
    }

    dom.platosTableBody.innerHTML = state.platos.map(p => {
      const isDisp = p.disponible !== false;

      return `
        <tr>
          <td><strong>${escapeHtml(p.nombre)}</strong></td>
          <td><span style="font-size: 0.8rem; font-weight: 700; color: var(--accent); text-transform: uppercase;">[${p.categoria}]</span></td>
          <td style="max-width: 280px; font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(p.descripcion)}</td>
          <td><strong>${formatoCOP(p.precio)}</strong></td>
          <td>
            <label class="switch" title="Mostrar u ocultar plato de la carta (RF-14)">
              <input 
                type="checkbox" 
                ${isDisp ? 'checked' : ''} 
                onchange="window.togglePlatoDisponible('${p.id}', this.checked)"
              />
              <span class="slider"></span>
            </label>
            <span style="font-size: 0.8rem; margin-left: 8px; font-weight: 600; color: ${isDisp ? 'var(--status-free-text)' : 'var(--status-occupied-text)'};">
              ${isDisp ? 'Visible' : 'Oculto'}
            </span>
          </td>
          <td>
            <div class="action-btn-group">
              <button class="btn-table-action" onclick="window.editarPlato('${p.id}')">✏️ Editar</button>
              <button class="btn-table-action delete" onclick="window.eliminarPlatoAdmin('${p.id}')">🗑️ Borrar</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.togglePlatoDisponible = async function (platoId, disponible) {
    try {
      await window.KonysDB.actualizarPlato(platoId, { disponible });
      showToast(`Plato marcado como ${disponible ? 'visible' : 'oculto'}`, 'info');
      await cargarTodo();
    } catch (e) {
      showToast('Error al actualizar disponibilidad del plato', 'error');
    }
  };

  function abrirModalPlato(plato = null) {
    if (plato) {
      dom.modalPlatoAdminTitle.textContent = 'Editar Plato';
      dom.editPlatoId.value = plato.id;
      dom.platoNombreInput.value = plato.nombre;
      dom.platoCategoriaInput.value = plato.categoria;
      dom.platoDescInput.value = plato.descripcion;
      dom.platoPrecioInput.value = plato.precio;
      dom.platoDisponibleInput.checked = plato.disponible !== false;
    } else {
      dom.modalPlatoAdminTitle.textContent = 'Nuevo Plato';
      dom.editPlatoId.value = '';
      dom.platoNombreInput.value = '';
      dom.platoCategoriaInput.value = 'pizzas';
      dom.platoDescInput.value = '';
      dom.platoPrecioInput.value = 35000;
      dom.platoDisponibleInput.checked = true;
    }
    dom.modalPlatoAdmin.classList.add('active');
  }

  function cerrarModalPlato() {
    dom.modalPlatoAdmin.classList.remove('active');
  }

  window.editarPlato = function (platoId) {
    const plato = state.platos.find(p => p.id === platoId);
    if (plato) abrirModalPlato(plato);
  };

  async function guardarPlato() {
    const id = dom.editPlatoId.value;
    const datos = {
      nombre: dom.platoNombreInput.value.trim(),
      categoria: dom.platoCategoriaInput.value,
      descripcion: dom.platoDescInput.value.trim(),
      precio: parseFloat(dom.platoPrecioInput.value) || 0,
      disponible: dom.platoDisponibleInput.checked
    };

    if (!datos.nombre) {
      showToast('Ingresa el nombre del plato', 'warning');
      return;
    }

    try {
      if (id) {
        await window.KonysDB.actualizarPlato(id, datos);
        showToast('Plato actualizado correctamente', 'success');
      } else {
        await window.KonysDB.crearPlato(datos);
        showToast('Plato agregado a la carta digital', 'success');
      }
      cerrarModalPlato();
      await cargarTodo();
    } catch (e) {
      showToast('Error al guardar el plato', 'error');
    }
  }

  window.eliminarPlatoAdmin = async function (platoId) {
    if (!confirm('¿Deseas eliminar este plato de la carta?')) return;
    try {
      await window.KonysDB.eliminarPlato(platoId);
      showToast('Plato eliminado de la carta', 'info');
      await cargarTodo();
    } catch (e) {
      showToast('Error al eliminar plato', 'error');
    }
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
