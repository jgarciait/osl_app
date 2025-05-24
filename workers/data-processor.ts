// Web Worker for heavy data processing
self.onmessage = (e) => {
  const { type, data } = e.data

  switch (type) {
    case "PROCESS_EXPRESSIONS":
      const processed = processExpressions(data)
      self.postMessage({ type: "EXPRESSIONS_PROCESSED", data: processed })
      break

    case "PARSE_DOCUMENTS":
      const parsed = parseDocuments(data)
      self.postMessage({ type: "DOCUMENTS_PARSED", data: parsed })
      break
  }
}

function processExpressions(expressions: any[]) {
  // Heavy processing logic here
  return expressions.map((expr) => ({
    ...expr,
    processedAt: Date.now(),
    // Add computed fields
  }))
}

function parseDocuments(documents: any[]) {
  // Heavy parsing logic here
  return documents.map((doc) => ({
    ...doc,
    parsedContent: extractContent(doc),
  }))
}

function extractContent(document: any) {
  // Simulate heavy parsing
  return document.content?.substring(0, 1000) || ""
}
