<?php
// api/clientes.php

require_once '../db.php'; // Importa la conexión a la base de datos

// Configuración CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Manejar solicitudes OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obtener el método HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Función para obtener el cuerpo de la petición como JSON
function getRequestBody() {
    return json_decode(file_get_contents('php://input'), true);
}

// Función para enviar respuestas JSON consistentes
function sendJsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}

switch ($method) {
    case 'GET':
        // Obtener cliente específico o todos los clientes
        try {
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare('SELECT * FROM clientes WHERE id = ?');
                $stmt->execute([$_GET['id']]);
                $cliente = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($cliente) {
                    sendJsonResponse($cliente);
                } else {
                    sendJsonResponse(['error' => 'Cliente no encontrado'], 404);
                }
            } else {
                $stmt = $pdo->query('SELECT * FROM clientes');
                $clientes = $stmt->fetchAll(PDO::FETCH_ASSOC);
                sendJsonResponse($clientes);
            }
        } catch (Exception $e) {
            sendJsonResponse(['error' => 'Error al obtener los clientes: ' . $e->getMessage()], 500);
        }
        break;

    case 'POST':
        // Registrar nuevo cliente
        $data = getRequestBody();
        
        // Validación de campos requeridos
        $requiredFields = ['nombre', 'bebidas', 'galletas', 'tipo_galletas', 'total', 'estado', 'fecha_registro'];
        $missingFields = array_diff($requiredFields, array_keys($data));
        
        if (!empty($missingFields)) {
            sendJsonResponse([
                'error' => 'Faltan campos requeridos',
                'missing' => array_values($missingFields)
            ], 400);
        }

        try {
            $stmt = $pdo->prepare("
                INSERT INTO clientes 
                (nombre, bebidas, galletas, tipo_galletas, total, estado, fecha_registro)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $data['nombre'],
                intval($data['bebidas']),
                intval($data['galletas']),
                $data['tipo_galletas'],
                floatval($data['total']),
                $data['estado'],
                $data['fecha_registro']
            ]);

            $id = $pdo->lastInsertId();
            sendJsonResponse([
                'message' => 'Cliente registrado exitosamente',
                'id' => $id
            ], 201);
        } catch (Exception $e) {
            sendJsonResponse(['error' => 'Error al registrar el cliente: ' . $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        // Actualizar cliente (completo o solo estado)
        $data = getRequestBody();
        
        // Obtener ID de la URL o del cuerpo JSON
        $id = isset($_GET['id']) ? intval($_GET['id']) : (isset($data['id']) ? intval($data['id']) : null);
        
        if (!$id) {
            sendJsonResponse(['error' => 'ID del cliente no proporcionado'], 400);
        }

        // Si solo se envía el estado, hacer actualización específica
        if (count($data) === 1 && isset($data['estado'])) {
            try {
                $stmt = $pdo->prepare("UPDATE clientes SET estado = ? WHERE id = ?");
                $stmt->execute([$data['estado'], $id]);

                if ($stmt->rowCount() > 0) {
                    sendJsonResponse(['message' => 'Estado actualizado correctamente']);
                } else {
                    sendJsonResponse(['error' => 'No se encontró el cliente o no hubo cambios'], 404);
                }
            } catch (Exception $e) {
                sendJsonResponse(['error' => 'Error al actualizar el estado: ' . $e->getMessage()], 500);
            }
        } 
        // Actualización completa del cliente
        else {
            // Validación de campos requeridos
            $requiredFields = ['nombre', 'bebidas', 'galletas', 'tipo_galletas', 'total', 'estado'];
            $missingFields = [];
            
            foreach ($requiredFields as $field) {
                if (!isset($data[$field])) {
                    $missingFields[] = $field;
                }
            }
            
            if (!empty($missingFields)) {
                sendJsonResponse([
                    'error' => 'Faltan campos para actualizar',
                    'missing' => $missingFields
                ], 400);
            }

            try {
                $stmt = $pdo->prepare("
                    UPDATE clientes SET
                    nombre = ?,
                    bebidas = ?,
                    galletas = ?,
                    tipo_galletas = ?,
                    total = ?,
                    estado = ?
                    WHERE id = ?
                ");

                $stmt->execute([
                    $data['nombre'],
                    intval($data['bebidas']),
                    intval($data['galletas']),
                    $data['tipo_galletas'],
                    floatval($data['total']),
                    $data['estado'],
                    $id
                ]);

                if ($stmt->rowCount() > 0) {
                    sendJsonResponse(['message' => 'Cliente actualizado correctamente']);
                } else {
                    sendJsonResponse(['error' => 'No se encontró el cliente o no hubo cambios'], 404);
                }
            } catch (Exception $e) {
                sendJsonResponse(['error' => 'Error al actualizar el cliente: ' . $e->getMessage()], 500);
            }
        }
        break;

    case 'DELETE':
        // Eliminar cliente
        $data = getRequestBody();
        
        // Obtener ID de la URL o del cuerpo JSON
        $id = isset($_GET['id']) ? intval($_GET['id']) : (isset($data['id']) ? intval($data['id']) : null);
        
        if (!$id) {
            sendJsonResponse(['error' => 'ID del cliente no proporcionado'], 400);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM clientes WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                sendJsonResponse(['message' => 'Cliente eliminado correctamente']);
            } else {
                sendJsonResponse(['error' => 'No se encontró el cliente'], 404);
            }
        } catch (Exception $e) {
            sendJsonResponse(['error' => 'Error al eliminar el cliente: ' . $e->getMessage()], 500);
        }
        break;

    default:
        sendJsonResponse(['error' => 'Método no permitido'], 405);
        break;
}
?>