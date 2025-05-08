-- Función para contar objetos en la carpeta expresiones del bucket documentos
CREATE OR REPLACE FUNCTION get_expresiones_document_count()
RETURNS TABLE (total_expresiones BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(CASE WHEN name LIKE 'expresiones/%' THEN 1 ELSE NULL END)::BIGINT as total_expresiones
  FROM storage.objects
  WHERE bucket_id = 'documentos';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos para ejecutar la función
GRANT EXECUTE ON FUNCTION get_expresiones_document_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_expresiones_document_count TO service_role;
