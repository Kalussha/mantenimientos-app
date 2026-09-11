-- =====================================================
-- ESQUEMA DE BASE DE DATOS PARA SISTEMA DE MANTENIMIENTOS
-- Stack: Supabase (PostgreSQL) + Next.js + Tailwind CSS
-- =====================================================

-- Habilitar extensión UUID para IDs únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA: departamentos
-- Catálogo de departamentos de la empresa
-- =====================================================
CREATE TABLE departamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por nombre
CREATE INDEX idx_departamentos_nombre ON departamentos(nombre);
CREATE INDEX idx_departamentos_activo ON departamentos(activo);

-- Comentarios de tabla y columnas
COMMENT ON TABLE departamentos IS 'Catálogo de departamentos de la organización';
COMMENT ON COLUMN departamentos.id IS 'Identificador único del departamento (UUID)';
COMMENT ON COLUMN departamentos.nombre IS 'Nombre único del departamento';
COMMENT ON COLUMN departamentos.descripcion IS 'Descripción opcional del departamento';
COMMENT ON COLUMN departamentos.activo IS 'Indica si el departamento está activo';

-- =====================================================
-- TABLA: usuarios
-- Dueños/propietarios de los equipos
-- =====================================================
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    id_departamento UUID NOT NULL REFERENCES departamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    cargo VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_departamento ON usuarios(id_departamento);
CREATE INDEX idx_usuarios_activo ON usuarios(activo);
CREATE INDEX idx_usuarios_nombre ON usuarios(nombre_completo);

-- Comentarios
COMMENT ON TABLE usuarios IS 'Usuarios dueños/propietarios de equipos de cómputo';
COMMENT ON COLUMN usuarios.id IS 'Identificador único del usuario (UUID)';
COMMENT ON COLUMN usuarios.nombre_completo IS 'Nombre completo del usuario';
COMMENT ON COLUMN usuarios.email IS 'Correo electrónico único (login/notificaciones)';
COMMENT ON COLUMN usuarios.telefono IS 'Teléfono de contacto opcional';
COMMENT ON COLUMN usuarios.id_departamento IS 'FK hacia departamentos (RESTRICT en delete)';
COMMENT ON COLUMN usuarios.cargo IS 'Cargo o puesto del usuario';
COMMENT ON COLUMN usuarios.activo IS 'Indica si el usuario está activo en la organización';

-- =====================================================
-- TABLA: equipos
-- Equipos de cómputo asignados a usuarios
-- =====================================================
CREATE TABLE equipos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descripcion VARCHAR(200) NOT NULL,
    numero_serie VARCHAR(100) NOT NULL UNIQUE,
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    marca VARCHAR(50),
    modelo VARCHAR(100),
    tipo_equipo VARCHAR(50) CHECK (tipo_equipo IN ('Laptop', 'Desktop', 'Monitor', 'Impresora', 'Servidor', 'Otro')),
    fecha_adquisicion DATE,
    estado VARCHAR(30) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'En Mantenimiento', 'Dado de Baja', 'Prestado')),
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_equipos_numero_serie ON equipos(numero_serie);
CREATE INDEX idx_equipos_usuario ON equipos(id_usuario);
CREATE INDEX idx_equipos_estado ON equipos(estado);
CREATE INDEX idx_equipos_tipo ON equipos(tipo_equipo);

-- Comentarios
COMMENT ON TABLE equipos IS 'Equipos de cómputo registrados en la organización';
COMMENT ON COLUMN equipos.id IS 'Identificador único del equipo (UUID)';
COMMENT ON COLUMN equipos.descripcion IS 'Descripción general del equipo (ej. Laptop Dell Latitude 5420)';
COMMENT ON COLUMN equipos.numero_serie IS 'Número de serie único del fabricante';
COMMENT ON COLUMN equipos.id_usuario IS 'FK hacia usuarios - dueño actual del equipo (RESTRICT en delete)';
COMMENT ON COLUMN equipos.marca IS 'Marca del equipo';
COMMENT ON COLUMN equipos.modelo IS 'Modelo específico del equipo';
COMMENT ON COLUMN equipos.tipo_equipo IS 'Categoría del equipo (constraint CHECK)';
COMMENT ON COLUMN equipos.fecha_adquisicion IS 'Fecha de compra/adquisición del equipo';
COMMENT ON COLUMN equipos.estado IS 'Estado actual del equipo (constraint CHECK)';
COMMENT ON COLUMN equipos.observaciones IS 'Notas adicionales sobre el equipo';

-- =====================================================
-- TABLA: citas_mantenimiento
-- Registro de citas/programaciones de mantenimiento
-- =====================================================
CREATE TABLE citas_mantenimiento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    id_equipo UUID NOT NULL REFERENCES equipos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado VARCHAR(30) DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'En Proceso', 'Completado', 'Cancelado', 'Reprogramado')),
    tipo_mantenimiento VARCHAR(50) CHECK (tipo_mantenimiento IN ('Preventivo', 'Correctivo', 'Instalación', 'Actualización', 'Limpieza', 'Otro')),
    descripcion_problema TEXT,
    solucion_aplicada TEXT,
    tecnico_asignado VARCHAR(150),
    costo_estimado DECIMAL(10, 2),
    costo_final DECIMAL(10, 2),
    fecha_completado TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_citas_equipo ON citas_mantenimiento(id_equipo);
CREATE INDEX idx_citas_fecha ON citas_mantenimiento(fecha);
CREATE INDEX idx_citas_estado ON citas_mantenimiento(estado);
CREATE INDEX idx_citas_fecha_estado ON citas_mantenimiento(fecha, estado);
CREATE INDEX idx_citas_tecnico ON citas_mantenimiento(tecnico_asignado);

-- Constraint único: un equipo no puede tener dos citas en la misma fecha/hora
CREATE UNIQUE INDEX idx_citas_equipo_fecha_hora ON citas_mantenimiento(id_equipo, fecha, hora)
    WHERE estado NOT IN ('Cancelado');

-- Comentarios
COMMENT ON TABLE citas_mantenimiento IS 'Programación y registro de mantenimientos de equipos';
COMMENT ON COLUMN citas_mantenimiento.id IS 'Identificador único de la cita (UUID)';
COMMENT ON COLUMN citas_mantenimiento.id_equipo IS 'FK hacia equipos (RESTRICT en delete)';
COMMENT ON COLUMN citas_mantenimiento.fecha IS 'Fecha programada del mantenimiento';
COMMENT ON COLUMN citas_mantenimiento.hora IS 'Hora programada del mantenimiento';
COMMENT ON COLUMN citas_mantenimiento.estado IS 'Estado de la cita (constraint CHECK)';
COMMENT ON COLUMN citas_mantenimiento.tipo_mantenimiento IS 'Tipo de mantenimiento a realizar (constraint CHECK)';
COMMENT ON COLUMN citas_mantenimiento.descripcion_problema IS 'Descripción del problema o motivo del mantenimiento';
COMMENT ON COLUMN citas_mantenimiento.solucion_aplicada IS 'Detalle de la solución aplicada (al completar)';
COMMENT ON COLUMN citas_mantenimiento.tecnico_asignado IS 'Nombre del técnico responsable';
COMMENT ON COLUMN citas_mantenimiento.costo_estimado IS 'Costo estimado antes del mantenimiento';
COMMENT ON COLUMN citas_mantenimiento.costo_final IS 'Costo real final';
COMMENT ON COLUMN citas_mantenimiento.fecha_completado IS 'Timestamp real de finalización';

-- =====================================================
-- TRIGGERS PARA ACTUALIZAR updated_at AUTOMÁTICAMENTE
-- =====================================================

-- Función genérica para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers en cada tabla
CREATE TRIGGER update_departamentos_updated_at
    BEFORE UPDATE ON departamentos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipos_updated_at
    BEFORE UPDATE ON equipos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citas_mantenimiento_updated_at
    BEFORE UPDATE ON citas_mantenimiento
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- Habilitar RLS en todas las tablas
-- =====================================================
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas_mantenimiento ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según necesidades de autenticación)
-- Por ahora: permitir todo a usuarios autenticados (service_role tiene acceso total)
CREATE POLICY "Enable all for authenticated users" ON departamentos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON usuarios
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON equipos
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated users" ON citas_mantenimiento
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- FUNCIONES AUXILIARES ÚTILES
-- =====================================================

-- Función para obtener próximo número de cita por equipo
CREATE OR REPLACE FUNCTION get_proximo_mantenimiento(p_id_equipo UUID)
RETURNS TABLE (
    id UUID,
    fecha DATE,
    hora TIME,
    estado VARCHAR,
    tipo_mantenimiento VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.fecha, c.hora, c.estado, c.tipo_mantenimiento
    FROM citas_mantenimiento c
    WHERE c.id_equipo = p_id_equipo
      AND c.estado IN ('Pendiente', 'En Proceso')
      AND c.fecha >= CURRENT_DATE
    ORDER BY c.fecha ASC, c.hora ASC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para contar mantenimientos por estado
CREATE OR REPLACE FUNCTION contar_mantenimientos_por_estado()
RETURNS TABLE (
    estado VARCHAR,
    total BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.estado, COUNT(*)
    FROM citas_mantenimiento c
    GROUP BY c.estado
    ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTAS ÚTILES PARA CONSULTAS COMUNES
-- =====================================================

-- Vista: Equipos con información de su dueño y departamento
CREATE OR REPLACE VIEW vista_equipos_completa AS
SELECT
    e.id,
    e.descripcion,
    e.numero_serie,
    e.marca,
    e.modelo,
    e.tipo_equipo,
    e.estado AS estado_equipo,
    e.fecha_adquisicion,
    u.id AS usuario_id,
    u.nombre_completo AS usuario_nombre,
    u.email AS usuario_email,
    u.telefono AS usuario_telefono,
    d.id AS departamento_id,
    d.nombre AS departamento_nombre
FROM equipos e
JOIN usuarios u ON e.id_usuario = u.id
JOIN departamentos d ON u.id_departamento = d.id
WHERE e.estado != 'Dado de Baja';

-- Vista: Próximas citas de mantenimiento con detalles
CREATE OR REPLACE VIEW vista_proximas_citas AS
SELECT
    c.id,
    c.fecha,
    c.hora,
    c.estado,
    c.tipo_mantenimiento,
    c.tecnico_asignado,
    e.id AS equipo_id,
    e.descripcion AS equipo_descripcion,
    e.numero_serie AS equipo_serie,
    u.nombre_completo AS usuario_nombre,
    u.email AS usuario_email,
    d.nombre AS departamento_nombre
FROM citas_mantenimiento c
JOIN equipos e ON c.id_equipo = e.id
JOIN usuarios u ON e.id_usuario = u.id
JOIN departamentos d ON u.id_departamento = d.id
WHERE c.fecha >= CURRENT_DATE
  AND c.estado IN ('Pendiente', 'En Proceso', 'Reprogramado')
ORDER BY c.fecha ASC, c.hora ASC;

-- Vista: Historial de mantenimientos por equipo
CREATE OR REPLACE VIEW vista_historial_mantenimientos AS
SELECT
    c.id,
    c.fecha,
    c.hora,
    c.estado,
    c.tipo_mantenimiento,
    c.descripcion_problema,
    c.solucion_aplicada,
    c.tecnico_asignado,
    c.costo_final,
    c.fecha_completado,
    e.id AS equipo_id,
    e.descripcion AS equipo_descripcion,
    e.numero_serie,
    u.nombre_completo AS usuario_nombre
FROM citas_mantenimiento c
JOIN equipos e ON c.id_equipo = e.id
JOIN usuarios u ON e.id_usuario = u.id
WHERE c.estado IN ('Completado', 'Cancelado')
ORDER BY c.fecha DESC, c.hora DESC;

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL - DESCOMENTAR PARA TESTING)
-- =====================================================

/*
-- Insertar departamentos de ejemplo
INSERT INTO departamentos (nombre, descripcion) VALUES
('Tecnología de la Información', 'Departamento de TI y sistemas'),
('Recursos Humanos', 'Gestión de talento humano'),
('Finanzas', 'Contabilidad y finanzas'),
('Operaciones', 'Operaciones y logística'),
('Dirección General', 'Gerencia y dirección');

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (nombre_completo, email, telefono, id_departamento, cargo) VALUES
('María González López', 'maria.gonzalez@empresa.com', '555-0101', (SELECT id FROM departamentos WHERE nombre = 'Tecnología de la Información'), 'Desarrolladora Senior'),
('Carlos Rodríguez Pérez', 'carlos.rodriguez@empresa.com', '555-0102', (SELECT id FROM departamentos WHERE nombre = 'Recursos Humanos'), 'Gerente de RH'),
('Ana Martínez Silva', 'ana.martinez@empresa.com', '555-0103', (SELECT id FROM departamentos WHERE nombre = 'Finanzas'), 'Analista Financiera'),
('Luis Hernández Torres', 'luis.hernandez@empresa.com', '555-0104', (SELECT id FROM departamentos WHERE nombre = 'Operaciones'), 'Coordinador de Operaciones');

-- Insertar equipos de ejemplo
INSERT INTO equipos (descripcion, numero_serie, id_usuario, marca, modelo, tipo_equipo, fecha_adquisicion, estado) VALUES
('Laptop Dell Latitude 5420', 'DL5420-2024-001', (SELECT id FROM usuarios WHERE email = 'maria.gonzalez@empresa.com'), 'Dell', 'Latitude 5420', 'Laptop', '2024-01-15', 'Activo'),
('Desktop HP ProDesk 600 G9', 'HP600G9-2024-002', (SELECT id FROM usuarios WHERE email = 'carlos.rodriguez@empresa.com'), 'HP', 'ProDesk 600 G9', 'Desktop', '2024-02-20', 'Activo'),
('Monitor LG 27" 4K', 'LG27-4K-2024-003', (SELECT id FROM usuarios WHERE email = 'ana.martinez@empresa.com'), 'LG', '27UP850-W', 'Monitor', '2024-03-10', 'Activo'),
('Impresora Brother HL-L8360CDW', 'BRHL8360-2024-004', (SELECT id FROM usuarios WHERE email = 'luis.hernandez@empresa.com'), 'Brother', 'HL-L8360CDW', 'Impresora', '2024-01-25', 'Activo');

-- Insertar citas de ejemplo
INSERT INTO citas_mantenimiento (id_equipo, fecha, hora, estado, tipo_mantenimiento, descripcion_problema, tecnico_asignado) VALUES
((SELECT id FROM equipos WHERE numero_serie = 'DL5420-2024-001'), CURRENT_DATE + INTERVAL '7 days', '10:00', 'Pendiente', 'Preventivo', 'Mantenimiento preventivo trimestral', 'Técnico Juan Pérez'),
((SELECT id FROM equipos WHERE numero_serie = 'HP600G9-2024-002'), CURRENT_DATE + INTERVAL '3 days', '14:30', 'Pendiente', 'Correctivo', 'Equipo no enciende', 'Técnica María López'),
((SELECT id FROM equipos WHERE numero_serie = 'LG27-4K-2024-003'), CURRENT_DATE - INTERVAL '5 days', '09:00', 'Completado', 'Limpieza', 'Limpieza de pantalla y puertos', 'Técnico Carlos Ruiz');
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================