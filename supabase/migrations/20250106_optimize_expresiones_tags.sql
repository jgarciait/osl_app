-- Optimize expresiones table queries
-- Create indexes for faster filtering and joining

-- Index on expresiones.archivado for filtering active/archived
CREATE INDEX IF NOT EXISTS idx_expresiones_archivado ON expresiones(archivado);

-- Index on expresiones.created_at for sorting
CREATE INDEX IF NOT EXISTS idx_expresiones_created_at ON expresiones(created_at DESC);

-- Index on documentos.expresion_id for joining
CREATE INDEX IF NOT EXISTS idx_documentos_expresion_id ON documentos(expresion_id);

-- Index on documento_etiquetas.documento_id for joining
CREATE INDEX IF NOT EXISTS idx_documento_etiquetas_documento_id ON documento_etiquetas(documento_id);

-- Composite index on documento_etiquetas for better join performance
CREATE INDEX IF NOT EXISTS idx_documento_etiquetas_doc_etiq ON documento_etiquetas(documento_id, etiqueta_id);

-- Drop existing functions if they exist (to allow type changes)
DROP FUNCTION IF EXISTS get_expresiones_with_tags(boolean, integer, integer);
DROP FUNCTION IF EXISTS get_all_expresiones_with_tags();

-- Create RPC function to get expresiones with their document tags efficiently
CREATE OR REPLACE FUNCTION get_expresiones_with_tags(
  p_archivado BOOLEAN DEFAULT FALSE,
  p_limit INT DEFAULT NULL,
  p_offset INT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  email TEXT,
  numero TEXT,
  ano INTEGER,
  mes INTEGER,
  archivado BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  assigned_to UUID,
  assigned_color TEXT,
  assigned_text_color TEXT,
  assigned_border_color TEXT,
  tema TEXT,
  fecha_recibido DATE,
  propuesta TEXT,
  tramite TEXT,
  respuesta TEXT,
  notas TEXT,
  borrador BOOLEAN,
  sequence INTEGER,
  document_tags JSONB,
  document_tag_names JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH expresion_docs AS (
    SELECT 
      e.id as expresion_id,
      d.id as documento_id
    FROM expresiones e
    LEFT JOIN documentos d ON d.expresion_id = e.id
    WHERE e.archivado = p_archivado
  ),
  expresion_tags AS (
    SELECT 
      ed.expresion_id,
      COALESCE(jsonb_agg(DISTINCT de.etiqueta_id) FILTER (WHERE de.etiqueta_id IS NOT NULL), '[]'::jsonb) as tag_ids,
      COALESCE(jsonb_agg(DISTINCT et.nombre) FILTER (WHERE et.nombre IS NOT NULL), '[]'::jsonb) as tag_names
    FROM expresion_docs ed
    LEFT JOIN documento_etiquetas de ON de.documento_id = ed.documento_id
    LEFT JOIN etiquetas et ON et.id = de.etiqueta_id
    GROUP BY ed.expresion_id
  )
  SELECT 
    e.id,
    e.nombre,
    e.email,
    e.numero,
    e.ano,
    e.mes,
    e.archivado,
    e.created_at,
    e.updated_at,
    e.assigned_to,
    e.assigned_color,
    e.assigned_text_color,
    e.assigned_border_color,
    e.tema,
    e.fecha_recibido,
    e.propuesta,
    e.tramite,
    e.respuesta,
    e.notas,
    e.borrador,
    e.sequence,
    COALESCE(et.tag_ids, '[]'::jsonb) as document_tags,
    COALESCE(et.tag_names, '[]'::jsonb) as document_tag_names
  FROM expresiones e
  LEFT JOIN expresion_tags et ON et.expresion_id = e.id
  WHERE e.archivado = p_archivado
  ORDER BY e.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_expresiones_with_tags TO authenticated;

-- Create a simpler version that returns all expresiones (both active and archived)
CREATE OR REPLACE FUNCTION get_all_expresiones_with_tags()
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  email TEXT,
  numero TEXT,
  ano INTEGER,
  mes INTEGER,
  archivado BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  assigned_to UUID,
  assigned_color TEXT,
  assigned_text_color TEXT,
  assigned_border_color TEXT,
  tema TEXT,
  fecha_recibido DATE,
  propuesta TEXT,
  tramite TEXT,
  respuesta TEXT,
  notas TEXT,
  borrador BOOLEAN,
  sequence INTEGER,
  document_tags JSONB,
  document_tag_names JSONB
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH expresion_docs AS (
    SELECT 
      e.id as expresion_id,
      d.id as documento_id
    FROM expresiones e
    LEFT JOIN documentos d ON d.expresion_id = e.id
  ),
  expresion_tags AS (
    SELECT 
      ed.expresion_id,
      COALESCE(jsonb_agg(DISTINCT de.etiqueta_id) FILTER (WHERE de.etiqueta_id IS NOT NULL), '[]'::jsonb) as tag_ids,
      COALESCE(jsonb_agg(DISTINCT et.nombre) FILTER (WHERE et.nombre IS NOT NULL), '[]'::jsonb) as tag_names
    FROM expresion_docs ed
    LEFT JOIN documento_etiquetas de ON de.documento_id = ed.documento_id
    LEFT JOIN etiquetas et ON et.id = de.etiqueta_id
    GROUP BY ed.expresion_id
  )
  SELECT 
    e.id,
    e.nombre,
    e.email,
    e.numero,
    e.ano,
    e.mes,
    e.archivado,
    e.created_at,
    e.updated_at,
    e.assigned_to,
    e.assigned_color,
    e.assigned_text_color,
    e.assigned_border_color,
    e.tema,
    e.fecha_recibido,
    e.propuesta,
    e.tramite,
    e.respuesta,
    e.notas,
    e.borrador,
    e.sequence,
    COALESCE(et.tag_ids, '[]'::jsonb) as document_tags,
    COALESCE(et.tag_names, '[]'::jsonb) as document_tag_names
  FROM expresiones e
  LEFT JOIN expresion_tags et ON et.expresion_id = e.id
  ORDER BY e.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_all_expresiones_with_tags TO authenticated;
