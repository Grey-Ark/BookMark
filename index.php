<?php
declare(strict_types=1);

// ------------------------------------------------------------
// 0. SERVIR ARCHIVOS ESTÁTICOS EN /uploads CON CORS
// ------------------------------------------------------------
// Permitir CORS y servir archivos desde uploads
$uri = $_SERVER['REQUEST_URI'];
if (preg_match('#^/uploads/(.+)$#', $uri, $matches)) {
    $filePath = __DIR__ . '/uploads/' . $matches[1];
    if (is_file($filePath)) {
        // Headers CORS
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        // Content-Type
        $mimeType = mime_content_type($filePath) ?: 'application/octet-stream';
        header("Content-Type: {$mimeType}");
        readfile($filePath);
        exit;
    } else {
        http_response_code(404);
        exit;
    }
}

require __DIR__ . '/vendor/autoload.php';
session_start();

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Factory\AppFactory;
use Slim\Psr7\Response as SlimResponse;
use Kreait\Firebase\Factory as FirebaseFactory;
use Kreait\Firebase\Database;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// ------------------------------------------------------------
// 1. INICIALIZAR SLIM
// ------------------------------------------------------------
$app = AppFactory::create();

// ------------------------------------------------------------
// 2. MIDDLEWARE DE CORS PARA API
// ------------------------------------------------------------
$app->add(function (Request $request, RequestHandler $handler) {
    $origin = $request->getHeaderLine('Origin') ?: '*';
    if (strtoupper($request->getMethod()) === 'OPTIONS') {
        $response = new SlimResponse(200);
        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true');
    }
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', $origin)
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Credentials', 'true');
});

$app->options('/{routes:.+}', function (Request $request, Response $response) {
    return $response;
});

$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$app->addErrorMiddleware(true, true, true);

// ------------------------------------------------------------
// 3. INICIALIZAR FIREBASE
// ------------------------------------------------------------
/** @var Database $database */
$firebase = (new FirebaseFactory)
    ->withServiceAccount(__DIR__ . '/serviceAccountKey.json')
    ->withDatabaseUri('https://cloudcoders-e9811-default-rtdb.firebaseio.com/');
$database = $firebase->createDatabase();

// ------------------------------------------------------------
// 4. CONFIGURACIÓN GENERAL
// ------------------------------------------------------------
$JWT_SECRET = getenv('JWT_SECRET') ?: 'mi_secreto_seguro';
function jsonResponse(Response $response, array $data, int $status = 200): Response {
    $response->getBody()->write(json_encode($data, JSON_UNESCAPED_UNICODE));
    return $response
        ->withHeader('Content-Type', 'application/json')
        ->withStatus($status);
}

// ------------------------------------------------------------
// 5. MIDDLEWARE DE AUTENTICACIÓN JWT
// ------------------------------------------------------------
$authMiddleware = function (Request $request, $handler) use ($JWT_SECRET) {
    $authHeader = $request->getHeaderLine('Authorization');
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        $res = new SlimResponse();
        return jsonResponse($res, ['error' => 'Token no proporcionado'], 401);
    }
    $token = trim(str_replace('Bearer ', '', $authHeader));
    try {
        $decoded = JWT::decode($token, new Key($JWT_SECRET, 'HS256'));
        $request = $request->withAttribute('user', $decoded);
        return $handler->handle($request);
    } catch (Exception $e) {
        $res = new SlimResponse();
        return jsonResponse($res, ['error' => 'Token inválido: ' . $e->getMessage()], 401);
    }
};

// ------------------------------------------------------------
// 6. RUTAS PÚBLICAS: registro y login
// ------------------------------------------------------------
$app->post('/registro', function (Request $request, Response $response) use ($database) {
    $datos = $request->getParsedBody();
    $email = trim($datos['email'] ?? '');
    $pass  = trim($datos['password'] ?? '');
    if (!$email || !$pass) {
        return jsonResponse($response, ['error' => 'Email y password son obligatorios'], 400);
    }
    $ref = $database->getReference('clientes');
    $exists = $ref->orderByChild('email')->equalTo($email)->getValue();
    if (is_array($exists) && count($exists)) {
        return jsonResponse($response, ['error' => 'Ya existe un cliente con ese email'], 400);
    }
    $newRef = $ref->push();
    $id = $newRef->getKey();
    $newRef->set(['email' => $email, 'password' => password_hash($pass, PASSWORD_DEFAULT)]);
    return jsonResponse($response, ['mensaje' => 'cliente registrado', 'userId' => $id], 201);
});

$app->post('/login', function (Request $request, Response $response) use ($database, $JWT_SECRET) {
    $datos = $request->getParsedBody();
    $email = trim($datos['email'] ?? '');
    $pass  = trim($datos['password'] ?? '');
    if (!$email || !$pass) {
        return jsonResponse($response, ['error' => 'Email y password son obligatorios'], 400);
    }
    $ref = $database->getReference('clientes');
    $users = $ref->orderByChild('email')->equalTo($email)->getValue();
    if (!is_array($users) || !count($users)) {
        return jsonResponse($response, ['error' => 'Credenciales incorrectas'], 401);
    }
    $data = array_values($users)[0];
    if (!password_verify($pass, $data['password'] ?? '')) {
        return jsonResponse($response, ['error' => 'Credenciales incorrectas'], 401);
    }
    $payload = ['userId' => array_keys($users)[0], 'email' => $data['email']];
    $jwt = JWT::encode($payload, $JWT_SECRET, 'HS256');
    return jsonResponse($response, ['mensaje' => 'Login exitoso', 'token'   => $jwt]);
});

// ------------------------------------------------------------
// 7. RUTAS PROTEGIDAS
// ------------------------------------------------------------
$app->get('/catalogo', function (Request $request, Response $response) {
    $API = 'http://localhost:4000/catalogo';
    $q   = http_build_query($request->getQueryParams());
    $out = @file_get_contents($API . ($q ? "?{$q}" : ''));
    if ($out === false) {
        return jsonResponse($response, ['error' => 'No se pudo conectar al backend'], 502);
    }
    $response->getBody()->write($out);
    return $response->withHeader('Content-Type','application/json');
})->add($authMiddleware);

$app->get('/catalogo/titulo/{titulo}', function (Request $request, Response $response, array $args) {
    $API = 'http://localhost:4000/catalogo';
    $out = @file_get_contents("{$API}/titulo/" . urlencode($args['titulo']));
    if ($out === false) {
        return jsonResponse($response, ['error' => 'No se pudo conectar al backend'], 502);
    }
    $response->getBody()->write($out);
    return $response->withHeader('Content-Type','application/json');
})->add($authMiddleware);

$app->post('/catalogo/{id}/leer', function (Request $request, Response $response, array $args) use ($database) {
    $d = $request->getAttribute('user');
    $db= $database;
    $db->getReference("leidos/{$d->userId}/{$args['id']}")
       ->set(['fecha'=>date('c')]);
    return jsonResponse($response,['mensaje'=>"Contenido {$args['id']} marcado como leído"],200);
})->add($authMiddleware);

$app->get('/catalogo/filtro', function (Request $request, Response $response) {
    $API = 'http://localhost:4000/catalogo';
    $q   = http_build_query($request->getQueryParams());
    $out = @file_get_contents($API . ($q ? "?{$q}" : ''));
    if ($out===false) {
        return jsonResponse($response,['error'=>'No se pudo conectar al backend'],502);
    }
    $response->getBody()->write($out);
    return $response->withHeader('Content-Type','application/json');
})->add($authMiddleware);

// ------------------------------------------------------------
// 8. NUEVA RUTA: LEÍDOS DEL USUARIO
// ------------------------------------------------------------
$app->get('/leidos', function (Request $request, Response $response) use ($database) {
    $d = $request->getAttribute('user');
    $vals = $database->getReference("leidos/{$d->userId}")->getValue();
    $out= [];
    if (is_array($vals)) foreach($vals as $cid=>$info){
        $out[]= ['contenidoId'=>$cid,'fecha'=>$info['fecha']];
    }
    return jsonResponse($response,['leidos'=>$out],200);
})->add($authMiddleware);

$app->run();
