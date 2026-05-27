// Colocar fecha y hora local automática al cargar
document.addEventListener("DOMContentLoaded", () => {
    const ahora = new Date();
    ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
    document.getElementById('fecha_hora').value = ahora.toISOString().slice(0, 16);
    actualizarPanelSaldos();
});

// Manejo del formateador del texto enriquecido
function formato(comando) {
    document.execCommand(comando, false, null);
}

// Datos falsos estructurados para simular el comportamiento de las gráficas según la entidad
const baseSaldos = {
    "3": { saldo: "S/. 450.00", ing: "75%", egr: "30%" }, // Efectivo
    "1": { saldo: "S/. 2,890.00", ing: "90%", egr: "20%" }, // BCP
    "2": { saldo: "S/. 1,120.00", ing: "60%", egr: "55%" }, // Interbank
    "4": { saldo: "S/. 600.00", ing: "40%", egr: "10%" },  // Clases
    "5": { saldo: "S/. -300.00", ing: "15%", egr: "80%" }, // Préstamos
    "6": { saldo: "S/. 850.00", ing: "50%", egr: "25%" },  // Judy
    "7": { saldo: "S/. 1,500.00", ing: "70%", egr: "40%" }, // Casa
    "8": { saldo: "S/. 200.00", ing: "30%", egr: "90%" }   // Diversión
};

const comboVisualizacion = document.getElementById('combo-visualizacion');
comboVisualizacion.addEventListener('change', actualizarPanelSaldos);

function actualizarPanelSaldos() {
    const idEntidad = comboVisualizacion.value;
    const datos = baseSaldos[idEntidad] || { saldo: "S/. 0.00", ing: "10%", egr: "10%" };
    
    // Cambiar texto de saldo
    document.getElementById('txt-saldo-neto').innerText = datos.saldo;
    
    // Animar barras de gráficos reactivamente
    document.querySelector('.bar-in').style.height = datos.ing;
    document.querySelector('.bar-out').style.height = datos.egr;
}

// SIMULACIÓN Y GENERACIÓN DEL COMPROBANTE EN IMAGEN (VENTANA EMERGENTE IMPRIMIBLE/GUARDABLE)
document.getElementById('btn-export-img').addEventListener('click', () => {
    const monto = document.getElementById('monto').value || "0.00";
    const esIngreso = document.getElementById('switch-flujo').checked;
    const tipoFlujo = esIngreso ? "INGRESO" : "EGRESO";
    const entidadText = comboVisualizacion.options[comboVisualizacion.selectedIndex].text;
    const fecha = document.getElementById('fecha_hora').value;

    // Poblar plantilla del ticket
    document.getElementById('t-flujo').innerText = tipoFlujo;
    document.getElementById('t-monto').innerText = parseFloat(monto).toFixed(2);
    document.getElementById('t-entidad').innerText = entidadText;
    document.getElementById('t-fecha').innerText = fecha.replace("T", " ");

    // Clonar contenido y abrir ventana limpia para que el usuario guarde o capture como imagen/pdf
    const contenidoTicket = document.getElementById('ticket-auditoria').innerHTML;
    const ventanaCaptura = window.open('', '_blank', 'width=350,height=450');
    ventanaCaptura.document.write(`
        <html>
        <head>
            <title>Recibo Digital SIBET</title>
            <style>
                body { font-family: monospace; padding: 20px; text-align: left; background: #fff; color: #000; }
                h3 { text-align: center; margin-bottom: 5px; letter-spacing: 1px; }
                .ticket-slogan { text-align: center; font-size: 9px; color: #555; margin-bottom: 15px; }
                hr { border: none; border-top: 1px dashed #000; margin: 10px 0; }
                p { margin: 6px 0; font-size: 11px; }
            </style>
        </head>
        <body onload="window.print()">
            ${contenidoTicket}
        </body>
        </html>
    `);
    ventanaCaptura.document.close();
});

// Manejo del envío del formulario (Integración con AJAX/Fetch)
document.getElementById('form-finanzas').addEventListener('submit', (e) => {
    e.preventDefault();
    alert("¡Movimiento SIBET procesado con éxito localmente! Listo para enviar a crud_transacciones.php");
});