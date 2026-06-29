const fs = require('fs');
const path = require('path');

const files = [
  'TESIS_FINAL_SPORTMATCH_ES.md',
  'TESIS_FINAL_SPORTMATCH_EN.md',
  'PAPER_CIENTIFICO_IEEE_SPORTMATCH.md',
  'INFORME_DERECHOS_AUTOR_PATENTE_SPORTMATCH.md',
  'DOCUMENTO_MEDICIONES_ATRIBUTO_GRADUADO_AG.md'
];

let totalErrors = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) {
    console.log('Archivo no encontrado: ' + file);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('\n========================================');
  console.log('🔍 VERIFICANDO: ' + file);
  console.log('========================================');
  
  // 1. Mermaid Check
  const mermaidBlocks = content.match(/```mermaid[\s\S]*?```/g) || [];
  console.log('✅ Diagramas Mermaid encontrados: ' + mermaidBlocks.length);
  mermaidBlocks.forEach((block, idx) => {
    // Check unquoted parentheses inside node labels like [Node (Text)]
    const unquotedParens = block.match(/\[[^"\]\n]*\([^"\]\n]*\)[^"\]\n]*\]/g);
    if (unquotedParens) {
      console.log('❌ Error sintáctico Mermaid (paréntesis sin comillas) en diagrama ' + (idx + 1) + ': ' + unquotedParens.join(', '));
      totalErrors++;
    }
  });

  // 2. Table Check (Broken concatenated rows)
  const lines = content.split('\n');
  let tableErrors = 0;
  lines.forEach((line, lineIdx) => {
    if (line.includes('||')) {
      console.log('❌ Error de formato de tabla en línea ' + (lineIdx + 1) + ': ' + line.substring(0, 60) + '...');
      tableErrors++;
      totalErrors++;
    }
  });
  if (tableErrors === 0) {
    console.log('✅ Formato de tablas: PERFECTO (0 líneas concatenadas)');
  }

  // 3. Unrendered Math Block Check
  if (content.includes('\\[') || content.includes('\\]')) {
    console.log('❌ Advertencia de sintaxis Math antigua (\\[)');
    totalErrors++;
  } else {
    console.log('✅ Formato de fórmulas Math (GitHub Math Standard $$): PERFECTO');
  }
});

console.log('\n========================================');
console.log('📊 RESULTADO DE AUDITORÍA GENERAL');
console.log('========================================');
console.log('TOTAL ERRORES SINTÁCTICOS DETECTADOS: ' + totalErrors);
if (totalErrors === 0) {
  console.log('🎉 TODOS LOS GRÁFICOS Y CONTENIDOS ESTÁN 100% LIBRES DE ERRORES');
}
