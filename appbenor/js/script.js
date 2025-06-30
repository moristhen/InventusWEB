document.addEventListener('DOMContentLoaded', function() {
    // Configuración inicial
    const API_URL = 'http://appbenor.test/api/clientes.php';
    let customers = [];
    
    // Elementos del DOM
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const customerForm = document.getElementById('customer-form');
    const customersTableBody = document.getElementById('customers-table-body');
    const todaySalesElement = document.getElementById('today-sales');
    const totalDebtElement = document.getElementById('total-debt');
    const currentDateElement = document.getElementById('current-date');

    // Precios
    const prices = {
        drinks: 20.00,
        cookiesWithCinnamon: 20.00,
        cookiesWithoutCinnamon: 15.00
    };

    // Inicializar la aplicación
    init();

    function init() {
        // Configurar fecha actual
        updateCurrentDate();
        // Ajustar padding para el footer
        const footer = document.querySelector('.footer');
        const footerHeight = footer.offsetHeight;
        document.body.style.paddingBottom = footerHeight + 'px';
        // Cargar datos iniciales desde servidor
        cargarClientes();
        // Configurar eventos
        setupEventListeners();
    }

    function updateCurrentDate() {
        const today = new Date();
        const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear().toString().slice(-2)}`;
        currentDateElement.textContent = formattedDate;
    }

    function setupEventListeners() {
        // Menú hamburguesa
        hamburger.addEventListener('click', toggleMenu);

        // Navegación
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                const sectionId = this.getAttribute('data-section');
                // Remover clases activas
                navLinks.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                // Mostrar sección correspondiente
                sections.forEach(section => section.classList.remove('active'));
                document.getElementById(sectionId).classList.add('active');

                // Renderizar contenido dinámico si es necesario
                if (sectionId === 'sales-history') {
                    renderSalesHistory();
                } else if (sectionId === 'debt-history') {
                    renderDebtHistory();
                }

                // Cerrar menú
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
            });
        });

        // Botones de cantidad
        document.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function () {
                const product = this.getAttribute('data-product');
                const action = this.getAttribute('data-action');
                updateQuantity(product, action);
            });
        });

        // Botones de pago
        document.querySelectorAll('.toggle-btn').forEach(button => {
            button.addEventListener('click', function () {
                document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Formulario de cliente
        customerForm.addEventListener('submit', function (e) {
            e.preventDefault();
            addCustomer();
        });
    }

    function toggleMenu() {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    }

    function updateQuantity(product, action) {
        const quantityElement = document.getElementById(`${product}-quantity`);
        let quantity = parseInt(quantityElement.textContent);
        if (action === 'increase') {
            quantity++;
        } else if (action === 'decrease' && quantity > 0) {
            quantity--;
        }
        quantityElement.textContent = quantity;
    }

    async function cargarClientes() {
        try {
            showLoading(true);
            const response = await fetch(API_URL, {
                headers: {
                    "Accept": "application/json"
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            customers = await response.json();
            renderCustomersTable();
            updateStats();
        } catch (error) {
            console.error("Error al cargar clientes:", error);
            showNotification(`⚠️ Error: ${error.message}`, 'warning');
        } finally {
            showLoading(false);
        }
    }

    function renderCustomersTable() {
        customersTableBody.innerHTML = '';
        if (customers.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="7" style="text-align: center; padding: 2rem; color: #666;">No hay clientes registrados</td>';
            customersTableBody.appendChild(row);
            return;
        }

        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.className = 'customer-row';
            row.setAttribute('data-id', customer.id);
            row.innerHTML = `
                <td>${customer.nombre}</td>
                <td>${customer.bebidas || 0}</td>
                <td>${customer.galletas || 0}</td>
                <td>${customer.tipo_galletas || '-'}</td>
                <td class="total-amount">$${parseFloat(customer.total).toFixed(2)}</td>
                <td class="status-cell">
                    <div class="status-container">
                        <span class="status-badge ${customer.estado === 'Pagado' ? 'paid' : 'unpaid'}" data-status="${customer.estado}">
                            ${customer.estado === 'Pagado' ? '✅ Pagado' : '⏳ Debe'}
                        </span>
                    </div>
                </td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" data-id="${customer.id}" title="Editar cliente">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            <span>Editar</span>
                        </button>
                        <button class="action-btn delete-btn" data-id="${customer.id}" title="Eliminar cliente">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3,6 5,6 21,6"/>
                                <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                            <span>Eliminar</span>
                        </button>
                    </div>
                </td>
            `;
            customersTableBody.appendChild(row);
        });
        setupActionButtons();
    }

    function setupActionButtons() {
        // Eventos para botones de acción
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const id = parseInt(this.getAttribute('data-id'));
                this.classList.add('loading');
                setTimeout(() => {
                    showEditModal(id);
                    this.classList.remove('loading');
                }, 300);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                const id = parseInt(this.getAttribute('data-id'));
                deleteCustomerWithConfirmation(id);
            });
        });

        // Evento para cambiar estado directamente en la tabla
        document.querySelectorAll('.status-badge').forEach(badge => {
            badge.addEventListener('click', function () {
                const row = this.closest('tr');
                const customerId = parseInt(row.getAttribute('data-id'));
                toggleCustomerStatus(customerId);
            });
        });
    }

async function toggleCustomerStatus(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    const nuevoEstado = customer.estado === 'Pagado' ? 'Debe' : 'Pagado';

    try {
        const response = await fetch(`${API_URL}?id=${id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                estado: nuevoEstado  // Solo enviamos el campo a actualizar
            })
        });

        if (response.ok) {
            // Actualización optimista: cambiamos el estado localmente sin recargar
            customer.estado = nuevoEstado;
            updateCustomerRow(customer); // Función para actualizar solo la fila modificada
            showNotification(`✅ Estado actualizado: ${customer.nombre} ahora está ${nuevoEstado}`);
        } else {
            const errorData = await response.json();
            showNotification(`⚠️ Error: ${errorData.error || 'Error al actualizar estado'}`, 'warning');
        }
    } catch (error) {
        console.error("Error al actualizar estado:", error);
        showNotification('⚠️ Error al conectar con el servidor', 'warning');
    }
}

// Función para actualizar solo una fila de la tabla
function updateCustomerRow(customer) {
    const row = document.querySelector(`tr[data-id="${customer.id}"]`);
    if (row) {
        // Actualizar el estado en la tabla
        const statusBadge = row.querySelector('.status-badge');
        statusBadge.textContent = customer.estado === 'Pagado' ? '✅ Pagado' : '⏳ Debe';
        statusBadge.className = `status-badge ${customer.estado === 'Pagado' ? 'paid' : 'unpaid'}`;
        
        // Actualizar otras celdas si es necesario
        row.querySelector('.total-amount').textContent = `$${parseFloat(customer.total).toFixed(2)}`;
    }
}
    function calcularTotal(bebidas, galletas, tipo) {
        const precioGalleta = tipo === 'Con Canela' ? prices.cookiesWithCinnamon : prices.cookiesWithoutCinnamon;
        return (bebidas * prices.drinks) + (galletas * precioGalleta);
    }

    async function addCustomer() {
        const name = document.getElementById('customer-name').value.trim();
        const drinks = parseInt(document.getElementById('drinks-quantity').textContent);
        const cookies = parseInt(document.getElementById('cookies-quantity').textContent);
        const type = document.querySelector('input[name="cookie-type"]:checked').value;
        const isPaid = document.querySelector('.toggle-btn.active').getAttribute('data-status') === 'paid';
        const today = new Date().toISOString().split('T')[0];
        const total = calcularTotal(drinks, cookies, type);

        // Validación básica
        if (!name || name.length < 2) {
            showNotification('⚠️ Por favor ingrese un nombre válido', 'warning');
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    nombre: name,
                    bebidas: drinks,
                    galletas: cookies,
                    tipo_galletas: type,
                    total: total.toFixed(2),
                    estado: isPaid ? 'Pagado' : 'Debe',
                    fecha_registro: today
                })
            });

            if (response.ok) {
                showNotification(`✅ Cliente agregado: ${name}`, 'success');
                resetForm();
                await cargarClientes();
            } else {
                const errorData = await response.json();
                showNotification(`⚠️ Error: ${errorData.message || 'Error al agregar cliente'}`, 'warning');
            }
        } catch (error) {
            console.error("Error al guardar cliente:", error);
            showNotification('⚠️ Error al conectar con el servidor', 'warning');
        }
    }

    function resetForm() {
        customerForm.reset();
        document.getElementById('customer-name').value = '';
        document.getElementById('drinks-quantity').textContent = '0';
        document.getElementById('cookies-quantity').textContent = '0';
        document.querySelector('input[value="Con Canela"]').checked = true;
        document.querySelector('.toggle-btn[data-status="paid"]').classList.add('active');
        document.querySelector('.toggle-btn[data-status="unpaid"]').classList.remove('active');
    }

    function showEditModal(id) {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;

        const modal = document.createElement('div');
        modal.className = 'edit-modal-overlay';
        modal.innerHTML = `
            <div class="edit-modal">
                <div class="modal-header">
                    <h3>✏️ Editar Cliente</h3>
                    <button class="close-modal" type="button">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-form">
                        <div class="form-group">
                            <label for="edit-name">Nombre</label>
                            <input type="text" id="edit-name" value="${customer.nombre}" required>
                        </div>
                        <div class="form-group">
                            <label>Cantidad</label>
                            <div class="quantity-controls">
                                <div class="quantity-group">
                                    <span>Bebidas:</span>
                                    <div class="quantity-selector">
                                        <button type="button" class="quantity-btn decrease" data-product="edit-drinks">-</button>
                                        <span id="edit-drinks-quantity" class="quantity">${customer.bebidas || 0}</span>
                                        <button type="button" class="quantity-btn increase" data-product="edit-drinks">+</button>
                                    </div>
                                </div>
                                <div class="quantity-group">
                                    <span>Galletas:</span>
                                    <div class="quantity-selector">
                                        <button type="button" class="quantity-btn decrease" data-product="edit-cookies">-</button>
                                        <span id="edit-cookies-quantity" class="quantity">${customer.galletas || 0}</span>
                                        <button type="button" class="quantity-btn increase" data-product="edit-cookies">+</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Tipo de Galletas</label>
                            <div class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="edit-cookie-type" value="Con Canela" ${customer.tipo_galletas === 'Con Canela' ? 'checked' : ''}>
                                    <span>Con Canela (+$${prices.cookiesWithCinnamon})</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="edit-cookie-type" value="Sin Canela" ${customer.tipo_galletas === 'Sin Canela' ? 'checked' : ''}>
                                    <span>Sin Canela (+$${prices.cookiesWithoutCinnamon})</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Estado de Pago</label>
                            <div class="toggle-group">
                                <button type="button" class="toggle-btn ${customer.estado === 'Pagado' ? 'active' : ''}" data-status="paid">Pagado</button>
                                <button type="button" class="toggle-btn ${customer.estado === 'Debe' ? 'active' : ''}" data-status="unpaid">Debe</button>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Total Calculado</label>
                            <div id="edit-total" class="total-display">$${customer.total}</div>
                        </div>
                    </form>
                </div>
                <div class="modal-actions">
                    <button class="cancel-edit" type="button">
                        <span>Cancelar</span>
                    </button>
                    <button class="confirm-edit" type="button" data-id="${customer.id}">
                        <span>💾 Guardar Cambios</span>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        setTimeout(() => modal.classList.add('show'), 10);

        // Configurar eventos del modal
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) document.body.removeChild(modal);
            }, 300);
        };

        // Botones de cantidad dentro del modal
        modal.querySelectorAll('.quantity-btn').forEach(button => {
            button.addEventListener('click', function () {
                const product = this.getAttribute('data-product');
                const action = this.classList.contains('increase') ? 'increase' : 'decrease';
                updateEditQuantity(product, action);
                updateEditTotal();
            });
        });

        // Botones de tipo de galleta
        modal.querySelectorAll('input[name="edit-cookie-type"]').forEach(radio => {
            radio.addEventListener('change', updateEditTotal);
        });

        // Botones de estado de pago
        modal.querySelectorAll('.toggle-btn').forEach(button => {
            button.addEventListener('click', function () {
                modal.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Botones del modal
        modal.querySelector('.cancel-edit').addEventListener('click', closeModal);
        modal.querySelector('.close-modal').addEventListener('click', closeModal);
        modal.querySelector('.confirm-edit').addEventListener('click', function () {
            updateCustomer(parseInt(this.getAttribute('data-id')));
            closeModal();
        });

        // Cerrar con ESC
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);

        // Cerrar al hacer clic fuera del modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function updateEditQuantity(product, action) {
        const quantityElement = document.getElementById(`${product}-quantity`);
        let quantity = parseInt(quantityElement.textContent);
        if (action === 'increase') quantity++;
        else if (action === 'decrease' && quantity > 0) quantity--;
        quantityElement.textContent = quantity;
    }

    function updateEditTotal() {
        const drinks = parseInt(document.getElementById('edit-drinks-quantity').textContent);
        const cookies = parseInt(document.getElementById('edit-cookies-quantity').textContent);
        const type = document.querySelector('input[name="edit-cookie-type"]:checked').value;
        const cookiesPrice = type === 'Con Canela' ? prices.cookiesWithCinnamon : prices.cookiesWithoutCinnamon;
        const total = (drinks * prices.drinks) + (cookies * cookiesPrice);
        document.getElementById('edit-total').textContent = `$${total.toFixed(2)}`;
    }

async function updateCustomer(id) {
    const modal = document.querySelector('.edit-modal-overlay');
    if (!modal) return;

    const name = modal.querySelector('#edit-name').value.trim();
    const drinks = parseInt(modal.querySelector('#edit-drinks-quantity').textContent);
    const cookies = parseInt(modal.querySelector('#edit-cookies-quantity').textContent);
    const type = modal.querySelector('input[name="edit-cookie-type"]:checked').value;
    const isPaid = modal.querySelector('.toggle-btn.active').getAttribute('data-status') === 'paid';
    const total = calcularTotal(drinks, cookies, type);

    // Validación básica
    if (!name || name.length < 2) {
        showNotification('⚠️ Por favor ingrese un nombre válido', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}?id=${id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                nombre: name,
                bebidas: drinks,
                galletas: cookies,
                tipo_galletas: type,
                total: total.toFixed(2),
                estado: isPaid ? 'Pagado' : 'Debe'
            })
        });

        if (response.ok) {
            showNotification(`✅ Cliente actualizado: ${name}`, 'success');
            await cargarClientes();
        } else {
            const errorData = await response.json();
            showNotification(`⚠️ Error: ${errorData.error || 'Error al actualizar cliente'}`, 'warning');
        }
    } catch (error) {
        console.error("Error al actualizar cliente:", error);
        showNotification('⚠️ Error al conectar con el servidor', 'warning');
    }
}

async function deleteCustomer(id) {
    try {
        const response = await fetch(`${API_URL}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                id: id
            })
        });

        if (response.ok) {
            const found = customers.find(c => c.id === id);
            showDeleteNotification(found ? found.nombre : 'Cliente');
            await cargarClientes();
        } else {
            const errorData = await response.json();
            showNotification(`⚠️ Error: ${errorData.error || 'Error al eliminar cliente'}`, 'warning');
        }
    } catch (error) {
        console.error("Error al eliminar cliente:", error);
        showNotification('⚠️ Error al conectar con el servidor', 'warning');
    }
}
    function deleteCustomerWithConfirmation(id) {
        const customer = customers.find(c => c.id === id);
        if (!customer) return;

        const modal = createConfirmationModal(customer);
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);

        const confirmBtn = modal.querySelector('.confirm-delete');
        const cancelBtn = modal.querySelector('.cancel-delete');
        const closeBtn = modal.querySelector('.close-modal');

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                if (modal.parentNode) document.body.removeChild(modal);
            }, 300);
        };

        confirmBtn.addEventListener('click', () => {
            deleteCustomer(id);
            closeModal();
            showDeleteNotification(customer.nombre);
        });

        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);

        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function createConfirmationModal(customer) {
        const modal = document.createElement('div');
        modal.className = 'delete-modal-overlay';
        modal.innerHTML = `
            <div class="delete-modal">
                <div class="modal-header">
                    <h3>⚠️ Confirmar Eliminación</h3>
                    <button class="close-modal" type="button">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="customer-info">
                        <p>¿Estás seguro que deseas eliminar a:</p>
                        <div class="customer-details">
                            <strong>${customer.nombre}</strong>
                            <div class="customer-summary">
                                <span>📅 ${customer.fecha_registro}</span>
                                <span>💰 $${customer.total}</span>
                                <span class="status-${customer.estado === 'Pagado' ? 'paid' : 'unpaid'}">
                                    ${customer.estado === 'Pagado' ? '✅ Pagado' : '⏳ Pendiente'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <p class="warning-text"><strong>Esta acción no se puede deshacer.</strong></p>
                </div>
                <div class="modal-actions">
                    <button class="cancel-delete" type="button"><span>Cancelar</span></button>
                    <button class="confirm-delete" type="button"><span>🗑️ Eliminar</span></button>
                </div>
            </div>
        `;
        return modal;
    }

    function showDeleteNotification(customerName) {
        showNotification(`🗑️ Cliente eliminado: ${customerName}`, 'success');
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.classList.add('show'), 10);
        const autoHide = setTimeout(() => hideNotification(notification), 4000);
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(autoHide);
            hideNotification(notification);
        });
    }

    function hideNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) document.body.removeChild(notification);
        }, 300);
    }

    function showLoading(show) {
        const loadingElement = document.getElementById('loading-indicator') || createLoadingElement();
        loadingElement.style.display = show ? 'flex' : 'none';
    }

    function createLoadingElement() {
        const loading = document.createElement('div');
        loading.id = 'loading-indicator';
        loading.style.display = 'none';
        loading.style.position = 'fixed';
        loading.style.top = '0';
        loading.style.left = '0';
        loading.style.right = '0';
        loading.style.bottom = '0';
        loading.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loading.style.justifyContent = 'center';
        loading.style.alignItems = 'center';
        loading.style.zIndex = '1000';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <p style="color: white; margin-top: 1rem;">Cargando...</p>
        `;
        document.body.appendChild(loading);
        return loading;
    }

    function renderSalesHistory() {
        const salesSection = document.getElementById('sales-history');
        if (!salesSection) return;

        if (!salesSection.querySelector('.table-container')) {
            salesSection.innerHTML = `
                <div class="history-header"><h2>Historial de Ventas Semanal</h2></div>
                <div class="history-actions">
                    <div class="search-container"><input type="text" id="sales-search" placeholder="Buscar cliente..."></div>
                    <button id="export-sales" class="export-btn">Exportar a Excel</button>
                </div>
                <div class="table-container">
                    <div class="table-scroll">
                        <table id="sales-table">
                            <thead><tr><th>Cliente</th><th>Total</th><th>Detalle</th></tr></thead>
                            <tbody id="sales-table-body"></tbody>
                        </table>
                    </div>
                </div>
            `;
            document.getElementById('sales-search').addEventListener('input', filterSales);
            document.getElementById('export-sales').addEventListener('click', exportSalesToExcel);
        }

        const salesTableBody = document.getElementById('sales-table-body');
        salesTableBody.innerHTML = '';
        const paidCustomers = customers.filter(c => c.estado === 'Pagado');

        if (paidCustomers.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" style="text-align: center;">No hay ventas registradas</td>';
            salesTableBody.appendChild(row);
            return;
        }

        paidCustomers.forEach(customer => {
            const row = document.createElement('tr');
            const detailsRow = document.createElement('tr');
            detailsRow.className = 'details-row';
            detailsRow.style.display = 'none';
            row.innerHTML = `
                <td>${customer.nombre}</td>
                <td>$${parseFloat(customer.total).toFixed(2)}</td>
                <td><button class="details-btn" data-id="${customer.id}">Ver Detalles</button></td>
            `;
            detailsRow.innerHTML = `
                <td colspan="3">
                    <div class="details-content">
                        <p><strong>Fecha:</strong> ${customer.fecha_registro}</p>
                        <p><strong>Bebidas:</strong> ${customer.bebidas || 0}</p>
                        <p><strong>Galletas:</strong> ${customer.galletas || 0} (${customer.tipo_galletas || '-'})</p>
                        <p><strong>Total:</strong> $${parseFloat(customer.total).toFixed(2)}</p>
                    </div>
                </td>
            `;
            salesTableBody.appendChild(row);
            salesTableBody.appendChild(detailsRow);

            row.querySelector('.details-btn').addEventListener('click', function () {
                const detailsRow = this.closest('tr').nextElementSibling;
                const isHidden = detailsRow.style.display === 'none';
                detailsRow.style.display = isHidden ? 'table-row' : 'none';
                this.textContent = isHidden ? 'Ocultar Detalles' : 'Ver Detalles';
            });
        });
    }

    function renderDebtHistory() {
        const debtSection = document.getElementById('debt-history');
        if (!debtSection) return;

        if (!debtSection.querySelector('.table-container')) {
            debtSection.innerHTML = `
                <div class="history-header"><h2>Historial de Deudas</h2></div>
                <div class="history-actions">
                    <div class="search-container"><input type="text" id="debt-search" placeholder="Buscar cliente..."></div>
                    <button id="export-debt" class="export-btn">Exportar a Excel</button>
                </div>
                <div class="table-container">
                    <div class="table-scroll">
                        <table id="debt-table">
                            <thead><tr><th>Cliente</th><th>Total</th><th>Detalle</th></tr></thead>
                            <tbody id="debt-table-body"></tbody>
                        </table>
                    </div>
                </div>
            `;
            document.getElementById('debt-search').addEventListener('input', filterDebt);
            document.getElementById('export-debt').addEventListener('click', exportDebtToExcel);
        }

        const debtTableBody = document.getElementById('debt-table-body');
        debtTableBody.innerHTML = '';
        const unpaidCustomers = customers.filter(c => c.estado === 'Debe');

        if (unpaidCustomers.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" style="text-align: center;">No hay deudas registradas</td>';
            debtTableBody.appendChild(row);
            return;
        }

        unpaidCustomers.forEach(customer => {
            const row = document.createElement('tr');
            const detailsRow = document.createElement('tr');
            detailsRow.className = 'details-row';
            detailsRow.style.display = 'none';
            row.innerHTML = `
                <td>${customer.nombre}</td>
                <td>$${parseFloat(customer.total).toFixed(2)}</td>
                <td><button class="details-btn" data-id="${customer.id}">Ver Detalles</button></td>
            `;
            detailsRow.innerHTML = `
                <td colspan="3">
                    <div class="details-content">
                        <p><strong>Fecha:</strong> ${customer.fecha_registro}</p>
                        <p><strong>Bebidas:</strong> ${customer.bebidas || 0}</p>
                        <p><strong>Galletas:</strong> ${customer.galletas || 0} (${customer.tipo_galletas || '-'})</p>
                        <p><strong>Total:</strong> $${parseFloat(customer.total).toFixed(2)}</p>
                    </div>
                </td>
            `;
            debtTableBody.appendChild(row);
            debtTableBody.appendChild(detailsRow);

            row.querySelector('.details-btn').addEventListener('click', function () {
                const detailsRow = this.closest('tr').nextElementSibling;
                const isHidden = detailsRow.style.display === 'none';
                detailsRow.style.display = isHidden ? 'table-row' : 'none';
                this.textContent = isHidden ? 'Ocultar Detalles' : 'Ver Detalles';
            });
        });
    }

    function filterSales() {
        const searchTerm = document.getElementById('sales-search').value.toLowerCase();
        const rows = document.querySelectorAll('#sales-table-body tr:not(.details-row)');
        rows.forEach(row => {
            const name = row.querySelector('td:first-child').textContent.toLowerCase();
            const isVisible = name.includes(searchTerm);
            row.style.display = isVisible ? '' : 'none';
            const detailsRow = row.nextElementSibling;
            if (detailsRow && detailsRow.classList.contains('details-row')) {
                detailsRow.style.display = isVisible ? 'table-row' : 'none';
            }
        });
    }

    function filterDebt() {
        const searchTerm = document.getElementById('debt-search').value.toLowerCase();
        const rows = document.querySelectorAll('#debt-table-body tr:not(.details-row)');
        rows.forEach(row => {
            const name = row.querySelector('td:first-child').textContent.toLowerCase();
            const isVisible = name.includes(searchTerm);
            row.style.display = isVisible ? '' : 'none';
            const detailsRow = row.nextElementSibling;
            if (detailsRow && detailsRow.classList.contains('details-row')) {
                detailsRow.style.display = isVisible ? 'table-row' : 'none';
            }
        });
    }

    function exportSalesToExcel() {
        const paidCustomers = customers.filter(c => c.estado === 'Pagado');
        exportToExcel(paidCustomers, 'Ventas_Semanales');
    }

    function exportDebtToExcel() {
        const unpaidCustomers = customers.filter(c => c.estado === 'Debe');
        exportToExcel(unpaidCustomers, 'Deudas_Pendientes');
    }

    function exportToExcel(data, fileName) {
        let csvContent = "Nombre,Fecha,Bebidas,Galletas,Tipo,Total,Estado\n";
        data.forEach(customer => {
            csvContent += `"${customer.nombre}",${customer.fecha_registro},${customer.bebidas || 0},${customer.galletas || 0},"${customer.tipo_galletas || '-'}",${parseFloat(customer.total).toFixed(2)},"${customer.estado}"\n`;
        });
        const encodedUri = encodeURI(`data:text/csv;charset=utf-8,${csvContent}`);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${fileName}_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function updateStats() {
        const todaySales = customers
            .filter(c => c.estado === 'Pagado')
            .reduce((sum, customer) => sum + parseFloat(customer.total), 0);
        const totalDebt = customers
            .filter(c => c.estado === 'Debe')
            .reduce((sum, customer) => sum + parseFloat(customer.total), 0);
        todaySalesElement.textContent = `$${todaySales.toFixed(2)}`;
        totalDebtElement.textContent = `$${totalDebt.toFixed(2)}`;
    }
});