-- Create a comprehensive view that includes all related data
CREATE OR REPLACE VIEW view_expresiones_complete AS
SELECT 
  e.*,
  t.nombre as tema_nombre,
  t.abreviatura as tema_abreviatura,
  -- Aggregate committee IDs
  COALESCE(
    array_agg(DISTINCT ec.comite_id) FILTER (WHERE ec.comite_id IS NOT NULL),
    ARRAY[]::uuid[]
  ) as comite_ids,
  -- Aggregate committee details
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', c.id,
      'nombre', c.nombre,
      'tipo', c.tipo
    )) FILTER (WHERE c.id IS NOT NULL),
    '[]'::json
  ) as comites,
  -- Aggregate classification IDs
  COALESCE(
    array_agg(DISTINCT ecl.clasificacion_id) FILTER (WHERE ecl.clasificacion_id IS NOT NULL),
    ARRAY[]::uuid[]
  ) as clasificacion_ids,
  -- Aggregate classification details
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', cl.id,
      'nombre', cl.nombre
    )) FILTER (WHERE cl.id IS NOT NULL),
    '[]'::json
  ) as clasificaciones,
  -- Aggregate documents
  COALESCE(
    json_agg(DISTINCT jsonb_build_object(
      'id', d.id,
      'nombre', d.nombre,
      'ruta', d.ruta,
      'tipo', d.tipo,
      'tamano', d.tamano,
      'created_at', d.created_at
    )) FILTER (WHERE d.id IS NOT NULL),
    '[]'::json
  ) as documentos,
  -- User assignment info
  p.nombre as assigned_to_name,
  p.apellido as assigned_to_apellido
FROM expresiones e
LEFT JOIN temas t ON e.tema = t.id
LEFT JOIN expresion_comites ec ON e.id = ec.expresion_id
LEFT JOIN comites c ON ec.comite_id = c.id
LEFT JOIN expresion_clasificaciones ecl ON e.id = ecl.expresion_id
LEFT JOIN clasificaciones cl ON ecl.clasificacion_id = cl.id
LEFT JOIN documentos d ON e.id = d.expresion_id
LEFT JOIN profiles p ON e.assigned_to = p.id
GROUP BY 
  e.id, e.numero, e.nombre, e.email, e.propuesta, e.tramite, e.notas, 
  e.fecha_recibido, e.respuesta, e.ano, e.mes, e.sequence, e.archivado, 
  e.tema, e.assigned_to, e.assigned_color, e.assigned_text_color, 
  e.assigned_border_color, e.created_at, e.updated_at,
  t.nombre, t.abreviatura, p.nombre, p.apellido;

-- Grant access to the view
GRANT SELECT ON view_expresiones_complete TO authenticated;
