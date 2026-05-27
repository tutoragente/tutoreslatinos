<?php
require_once 'conexion.php';
header('Content-Type: application/json; charset=utf-8');

$metodo = $_SERVER['REQUEST_METHOD'];

// 1. OBTENER TRANSACCIONES Y CALCULAR SALDOS REALES
if ($metodo === 'GET') {
    try {
        // Consultar el historial completo de movimientos
        $sqlTrans = "SELECT t.id, t.fecha_hora, tp.nombre as tipo_pago, e.nombre as entidad, t.entidad_id,
                            t.tipo_flujo, t.monto, t.saldo_ajuste, t.motivo, t.imagen_comprobante
                     FROM transacciones t
                     JOIN tipos_pago tp ON t.tipo_pago_id = tp.id
                     JOIN entidades e ON t.entidad_id = e.id
                     ORDER BY t.fecha_hora DESC";
        $stmtTrans = $pdo->query($sqlTrans);
        $transacciones = $stmtTrans->fetchAll();

        // Calcular los saldos reales agregados sumando ingresos y restando egresos
        $sqlSaldos = "SELECT entidad_id, 
                             SUM(CASE WHEN tipo_flujo = 'ingreso' THEN monto ELSE -monto END) as saldo_real
                      FROM transacciones 
                      GROUP BY entidad_id";
        $stmtSaldos = $pdo->query($sqlSaldos);
        $saldosBrutos = $stmtSaldos->fetchAll();
        
        // Mapear el array para indexarlo de manera rápida por el ID de la entidad
        $saldos = [];
        foreach ($saldosBrutos as $row) {
            $saldos[$row['entidad_id']] = (float)$row['saldo_real'];
        }

        echo json_encode([
            "status" => "success", 
            "transacciones" => $transacciones, 
            "saldos" => $saldos
        ]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
}

// 2. GUARDAR REGISTROS (PERSISTENCIA REAL)
if ($metodo === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) { $input = $_POST; }

    try {
        $sql = "INSERT INTO transacciones (fecha_hora, tipo_pago_id, entidad_id, tipo_flujo, monto, saldo_ajuste, motivo, imagen_comprobante) 
                VALUES (:fecha_hora, :tipo_pago_id, :entidad_id, :tipo_flujo, :monto, :saldo_ajuste, :motivo, :imagen_comprobante)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':fecha_hora'        => $input['fecha_hora'],
            ':tipo_pago_id'      => $input['tipo_pago_id'],
            ':entidad_id'        => $input['entidad_id'],
            ':tipo_flujo'        => $input['tipo_flujo'],
            ':monto'             => $input['monto'],
            ':saldo_ajuste'      => !empty($input['saldo_ajuste']) ? $input['saldo_ajuste'] : 0.00,
            ':motivo'            => $input['motivo'] ?? null,
            ':imagen_comprobante'=> $input['imagen_comprobante'] ?? null
        ]);

        echo json_encode(["status" => "success", "message" => "Movimiento financiero SIBET insertado exitosamente."]);
    } catch (PDOException $e) {
        echo json_encode(["status" => "error", "message" => "Error al escribir en la BD: " . $e->getMessage()]);
    }
}
?>