// Memoria caché de saldos globales devueltos por el motor MySQL
let cacheSaldosReales = {};
let totalIngresosGlobal = 0;
let totalEgresosGlobal = 0;

document.addEventListener("DOMContentLoaded", () => {
    console.log("¡SIBET Finanzas iniciado correctamente!");
    
    // 1. Establecer hora y fecha local automática al cargar
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    document.getElementById('fecha_hora').value = ahora.toISOString().slice(0, 16);
    
    // 2. Escuchar cambios de filtrado del combo de visualización de saldos
    document.getElementById('combo-visualizacion').addEventListener('change', renderizarMetricas);
    
    // 3. Cargar datos reales desde el backend al iniciar el ecosistema
    cargarDatosDesdeServidor();
});

// Manejador del editor de texto enriquecido
function formato(comando) {
    document.execCommand(comando, false, null);
}

// OBTENER INFORMACIÓN DE LA BD Y CALCULAR VALORES REALES
function cargarDatosDesdeServidor() {
    console.log("Consultando saldos y transacciones actuales a la Base de Datos...");
    
    fetch('crud_transacciones.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error de red HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(json => {
            console.log("Respuesta de lectura recibida desde PHP:", json);
            if (json.status === "success") {
                cacheSaldosReales = json.saldos || {};
                
                // Resetear acumuladores analíticos globales para las barras gráficas
                totalIngresosGlobal = 0;
                totalEgresosGlobal = 0;

                if (json.transacciones && Array.isArray(json.transacciones)) {
                    json.transacciones.forEach(t => {
                        if (t.tipo_flujo === 'ingreso') totalIngresosGlobal += parseFloat(t.monto);
                        if (t.tipo_flujo === 'egreso') totalEgresosGlobal += parseFloat(t.monto);
                    });
                }

                // Renderizar los saldos actualizados en pantalla
                renderizarMetricas();
            } else {
                console.error("Error devuelto por el backend SIBET:", json.message);
            }
        })
        .catch(err => {
            console.error("No se pudo conectar al backend de saldos reales o la BD está vacía:", err);
            // Si falla la conexión, forzamos que se visualice todo en cero
            renderizarMetricas();
        });
}

// RENDERIZAR MÉTRICAS Y BARRAS EN FUNCIÓN A LOS DATOS REALES DE LA BASE DE DATOS
function renderizarMetricas() {
    const idEntidad = document.getElementById('combo-visualizacion').value;
    console.log(`Renderizando métricas para la entidad ID: ${idEntidad}`);
    
    // Si la entidad no tiene transacciones en la BD, su saldo real es estrictamente 0.00
    const saldoReal = cacheSaldosReales[idEntidad] || 0.00;
    
    // Formatear e inyectar el saldo en la UI
    document.getElementById('txt-saldo-neto').innerText = `S/. ${saldoReal.toFixed(2)}`;

    // Calcular proporciones de las barras analíticas basadas en el flujo consolidado real
    const sumaTotal = totalIngresosGlobal + totalEgresosGlobal;
    const barIngreso = document.getElementById('bar-ingreso');
    const barEgreso = document.getElementById('bar-egreso');

    if (sumaTotal > 0) {
        const pctIn = (totalIngresosGlobal / sumaTotal) * 100;
        const pctOut = (totalEgresosGlobal / sumaTotal) * 100;
        if(barIngreso) barIngreso.style.height = `${pctIn}%`;
        if(barEgreso) barEgreso.style.height = `${pctOut}%`;
    } else {
        if(barIngreso) barIngreso.style.height = `0%`;
        if(barEgreso) barEgreso.style.height = `0%`;
    }
}

// PROCESAR GUARDADO REAL EN BASE DE DATOS (MÉTODO POST VIA FETCH)
document.getElementById('form-finanzas').addEventListener('submit', function(e) {
    e.preventDefault();
    console.log("Formulario enviado. Procesando payload...");

    const fechaHora = document.getElementById('fecha_hora').value;
    const monto = document.getElementById('monto').value;
    const tipoPagoId = document.getElementById('tipo_pago').value;
    const entidadId = document.getElementById('entidad').value;
    const saldoAjuste = document.getElementById('saldo_ajuste').value;
    const esIngreso = document.getElementById('switch-flujo').checked;
    const tipoFlujo = esIngreso ? 'ingreso' : 'egreso';
    const motivo = document.getElementById('editor-motivo').innerHTML;
    const archivoImg = document.getElementById('imagen_comprobante').files[0];

    // Preparar el empaquetado seguro de los datos para PHP
    const payload = {
        fecha_hora: fechaHora.replace("T", " ") + ":00",
        monto: parseFloat(monto),
        tipo_pago_id: parseInt(tipoPagoId),
        entidad_id: parseInt(entidadId),
        saldo_ajuste: saldoAjuste ? parseFloat(saldoAjuste) : 0.00,
        tipo_flujo: tipoFlujo,
        motivo: motivo,
        imagen_comprobante: null
    };

    if (archivoImg) {
        console.log("Detectado archivo de imagen, convirtiendo a Base64...");
        const lector = new FileReader();
        lector.onloadend = function() {
            payload.imagen_comprobante = lector.result; 
            enviarPayload(payload);
        };
        lector.readAsDataURL(archivoImg);
    } else {
        enviarPayload(payload);
    }
});

function enviarPayload(payload) {
    console.log("Enviando el siguiente objeto JSON al backend PHP:", payload);

    fetch('crud_transacciones.php', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload)
    })
    .then(res => {
        if (!res.ok) {
            throw new Error(`Error en el servidor PHP: ${res.status}`);
        }
        return res.json();
    })
    .then(json => {
        console.log("Respuesta del servidor al guardar:", json);
        if (json.status === "success") {
            // PRIMERO lanzamos el aviso de éxito
            alert("¡Movimiento SIBET guardado con éxito en la Base de Datos!");
            
            // SEGUNDO limpiamos los campos del formulario de manera segura
            document.getElementById('monto').value = '';
            document.getElementById('saldo_ajuste').value = '';
            document.getElementById('editor-motivo').innerHTML = '';
            document.getElementById('imagen_comprobante').value = '';
            
            // TERCERO recargamos la información financiera mandando a llamar la función CORRECTA
            cargarDatosDesdeServidor();
        } else {
            alert("Atención del Servidor: " + json.message);
        }
    })
    .catch(err => {
        alert("Fallo crítico de comunicación backend. Revisa la consola de desarrollador.");
        console.error("Error exacto detectado en la petición Fetch:", err);
    });
}

// GENERADOR DE CONSTANCIAS EN IMAGEN/TICKET IMPRIMIBLE
document.getElementById('btn-export-img').addEventListener('click', () => {
    const monto = document.getElementById('monto').value || "0.00";
    const esIngreso = document.getElementById('switch-flujo').checked;
    const tipoFlujo = esIngreso ? "INGRESO" : "EGRESO";
    const combo = document.getElementById('entidad');
    const entidadText = combo.options[combo.selectedIndex].text;
    const fecha = document.getElementById('fecha_hora').value;

    document.getElementById('t-flujo').innerText = tipoFlujo;
    document.getElementById('t-monto').innerText = parseFloat(monto).toFixed(2);
    document.getElementById('t-entidad').innerText = entidadText;
    document.getElementById('t-fecha').innerText = fecha.replace("T", " ");

    const ticketHtml = document.getElementById('ticket-auditoria').innerHTML;
    const ventana = window.open('', '_blank', 'width=340,height=460');
    ventana.document.write(`
        <html>
        <head>
            <title>Voucher SIBET</title>
            <style>
                body { font-family: monospace; padding: 25px; background: #fff; color: #000; }
                h3 { text-align: center; margin-bottom: 3px; }
                .ticket-slogan { text-align: center; font-size: 10px; color: #666; margin-bottom: 12px; }
                hr { border: none; border-top: 1px dashed #000; margin: 12px 0; }
                p { margin: 8px 0; font-size: 12px; }
            </style>
        </head>
        <body onload="window.print(); window.close();">
            \${ticketHtml}
        </body>
        </html>
    `);
    ventana.document.close();
});