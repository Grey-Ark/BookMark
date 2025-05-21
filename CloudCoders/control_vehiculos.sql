-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 03-03-2025 a las 01:23:50
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `control_vehiculos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `administradores`
--

CREATE TABLE `administradores` (
  `id_admin` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `contraseña` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `administradores`
--

INSERT INTO `administradores` (`id_admin`, `nombre`, `correo`, `contraseña`) VALUES
(1, 'adminyahir', 'yahir@correo.buap.mx', 'admin123');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `id_estudiante` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo_personal` varchar(100) NOT NULL,
  `correo_institucional` varchar(100) NOT NULL,
  `contraseña` varchar(255) NOT NULL,
  `facultad` varchar(100) NOT NULL,
  `matricula` varchar(20) NOT NULL,
  `telefono` varchar(15) DEFAULT NULL,
  `foto_perfil` varchar(255) DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estudiantes`
--

INSERT INTO `estudiantes` (`id_estudiante`, `nombre`, `correo_personal`, `correo_institucional`, `contraseña`, `facultad`, `matricula`, `telefono`, `foto_perfil`, `fecha_registro`) VALUES
(1, 'Juan Yahir Sanchez Perez', 'yahir@gmail.com', 'juan.sanchezpe@alumno.buap.mx', '$2b$10$4GR8XZxFKTTGkijWyMZ3M.L3a6tLTgIiDZgs4p9L48Nh9MZNiMk8O', 'Ciencias de la Computación', '202159917', '2471327046', 'nohay', '2025-03-02 23:35:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `exportaciones`
--

CREATE TABLE `exportaciones` (
  `id_exportacion` int(11) NOT NULL,
  `id_admin` int(11) NOT NULL,
  `tipo_exportacion` enum('semanal','mensual') NOT NULL,
  `archivo_generado` varchar(255) NOT NULL,
  `fecha_exportacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `log_actividades`
--

CREATE TABLE `log_actividades` (
  `id_log` int(11) NOT NULL,
  `usuario` varchar(100) NOT NULL,
  `tipo_usuario` enum('vigilante','administrador') NOT NULL,
  `accion` text NOT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `prestamos`
--

CREATE TABLE `prestamos` (
  `id_prestamo` int(11) NOT NULL,
  `id_vehiculo` int(11) NOT NULL,
  `id_duenio` int(11) NOT NULL,
  `id_autorizado` int(11) NOT NULL,
  `fecha_autorizacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `registros_acceso`
--

CREATE TABLE `registros_acceso` (
  `id_registro` int(11) NOT NULL,
  `id_vehiculo` int(11) NOT NULL,
  `id_estudiante` int(11) NOT NULL,
  `id_vigilante` int(11) NOT NULL,
  `tipo_acceso` enum('entrada','salida') NOT NULL,
  `acceso` varchar(50) NOT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT current_timestamp(),
  `metodo_salida` enum('normal','vehiculo','ciclovia') NOT NULL DEFAULT 'normal',
  `foto_validacion` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_incidentes`
--

CREATE TABLE `reportes_incidentes` (
  `id_reporte` int(11) NOT NULL,
  `id_estudiante` int(11) NOT NULL,
  `id_vehiculo` int(11) NOT NULL,
  `tipo_incidente` enum('robo','daño','intento de robo') NOT NULL,
  `descripcion` text NOT NULL,
  `ubicacion` varchar(255) NOT NULL,
  `foto_incidente` varchar(255) DEFAULT NULL,
  `fecha_reporte` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculos`
--

CREATE TABLE `vehiculos` (
  `id_vehiculo` int(11) NOT NULL,
  `id_estudiante` int(11) NOT NULL,
  `tipo` enum('bicicleta','moto','scooter') NOT NULL,
  `marca` varchar(50) NOT NULL,
  `color` varchar(50) NOT NULL,
  `caracteristicas` text DEFAULT NULL,
  `numero_serie` varchar(50) NOT NULL,
  `foto_frontal` varchar(255) DEFAULT NULL,
  `foto_lateral_izq` varchar(255) DEFAULT NULL,
  `foto_lateral_der` varchar(255) DEFAULT NULL,
  `foto_posterior` varchar(255) DEFAULT NULL,
  `qr_code` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vigilantes`
--

CREATE TABLE `vigilantes` (
  `id_vigilante` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `contraseña` varchar(255) NOT NULL,
  `acceso` varchar(50) NOT NULL,
  `clave` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `administradores`
--
ALTER TABLE `administradores`
  ADD PRIMARY KEY (`id_admin`),
  ADD UNIQUE KEY `correo` (`correo`);

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id_estudiante`),
  ADD UNIQUE KEY `correo_personal` (`correo_personal`),
  ADD UNIQUE KEY `correo_institucional` (`correo_institucional`),
  ADD UNIQUE KEY `matricula` (`matricula`);

--
-- Indices de la tabla `exportaciones`
--
ALTER TABLE `exportaciones`
  ADD PRIMARY KEY (`id_exportacion`),
  ADD KEY `id_admin` (`id_admin`);

--
-- Indices de la tabla `log_actividades`
--
ALTER TABLE `log_actividades`
  ADD PRIMARY KEY (`id_log`);

--
-- Indices de la tabla `prestamos`
--
ALTER TABLE `prestamos`
  ADD PRIMARY KEY (`id_prestamo`),
  ADD KEY `id_vehiculo` (`id_vehiculo`),
  ADD KEY `id_duenio` (`id_duenio`),
  ADD KEY `id_autorizado` (`id_autorizado`);

--
-- Indices de la tabla `registros_acceso`
--
ALTER TABLE `registros_acceso`
  ADD PRIMARY KEY (`id_registro`),
  ADD KEY `id_vehiculo` (`id_vehiculo`),
  ADD KEY `id_estudiante` (`id_estudiante`),
  ADD KEY `id_vigilante` (`id_vigilante`);

--
-- Indices de la tabla `reportes_incidentes`
--
ALTER TABLE `reportes_incidentes`
  ADD PRIMARY KEY (`id_reporte`),
  ADD KEY `id_estudiante` (`id_estudiante`),
  ADD KEY `id_vehiculo` (`id_vehiculo`);

--
-- Indices de la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  ADD PRIMARY KEY (`id_vehiculo`),
  ADD UNIQUE KEY `numero_serie` (`numero_serie`),
  ADD UNIQUE KEY `qr_code` (`qr_code`),
  ADD KEY `id_estudiante` (`id_estudiante`);

--
-- Indices de la tabla `vigilantes`
--
ALTER TABLE `vigilantes`
  ADD PRIMARY KEY (`id_vigilante`),
  ADD UNIQUE KEY `clave` (`clave`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `administradores`
--
ALTER TABLE `administradores`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  MODIFY `id_estudiante` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `exportaciones`
--
ALTER TABLE `exportaciones`
  MODIFY `id_exportacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `log_actividades`
--
ALTER TABLE `log_actividades`
  MODIFY `id_log` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `prestamos`
--
ALTER TABLE `prestamos`
  MODIFY `id_prestamo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `registros_acceso`
--
ALTER TABLE `registros_acceso`
  MODIFY `id_registro` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `reportes_incidentes`
--
ALTER TABLE `reportes_incidentes`
  MODIFY `id_reporte` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  MODIFY `id_vehiculo` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `vigilantes`
--
ALTER TABLE `vigilantes`
  MODIFY `id_vigilante` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `exportaciones`
--
ALTER TABLE `exportaciones`
  ADD CONSTRAINT `exportaciones_ibfk_1` FOREIGN KEY (`id_admin`) REFERENCES `administradores` (`id_admin`) ON DELETE CASCADE;

--
-- Filtros para la tabla `prestamos`
--
ALTER TABLE `prestamos`
  ADD CONSTRAINT `prestamos_ibfk_1` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculos` (`id_vehiculo`) ON DELETE CASCADE,
  ADD CONSTRAINT `prestamos_ibfk_2` FOREIGN KEY (`id_duenio`) REFERENCES `estudiantes` (`id_estudiante`) ON DELETE CASCADE,
  ADD CONSTRAINT `prestamos_ibfk_3` FOREIGN KEY (`id_autorizado`) REFERENCES `estudiantes` (`id_estudiante`) ON DELETE CASCADE;

--
-- Filtros para la tabla `registros_acceso`
--
ALTER TABLE `registros_acceso`
  ADD CONSTRAINT `registros_acceso_ibfk_1` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculos` (`id_vehiculo`) ON DELETE CASCADE,
  ADD CONSTRAINT `registros_acceso_ibfk_2` FOREIGN KEY (`id_estudiante`) REFERENCES `estudiantes` (`id_estudiante`) ON DELETE CASCADE,
  ADD CONSTRAINT `registros_acceso_ibfk_3` FOREIGN KEY (`id_vigilante`) REFERENCES `vigilantes` (`id_vigilante`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reportes_incidentes`
--
ALTER TABLE `reportes_incidentes`
  ADD CONSTRAINT `reportes_incidentes_ibfk_1` FOREIGN KEY (`id_estudiante`) REFERENCES `estudiantes` (`id_estudiante`) ON DELETE CASCADE,
  ADD CONSTRAINT `reportes_incidentes_ibfk_2` FOREIGN KEY (`id_vehiculo`) REFERENCES `vehiculos` (`id_vehiculo`) ON DELETE CASCADE;

--
-- Filtros para la tabla `vehiculos`
--
ALTER TABLE `vehiculos`
  ADD CONSTRAINT `vehiculos_ibfk_1` FOREIGN KEY (`id_estudiante`) REFERENCES `estudiantes` (`id_estudiante`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
