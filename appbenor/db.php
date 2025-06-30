<?php
// db.php

// Variables de entorno (puedes usar .env o definirlas directamente aquí)
$host = 'localhost';
$user = 'root'; // 
$password = ''; // (vancia)
$database = 'inventus_benor';

try {
    // Conexión a la base de datos
    $pdo = new PDO("mysql:host=$host;dbname=$database", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error de conexión a la base de datos: " . $e->getMessage());
}

// Exportamos la conexión para usarla en otros archivos
return $pdo;
?>