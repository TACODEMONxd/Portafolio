const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const txtPath = path.join(rootDir, 'datos de tecnicas.txt');
const insumosDir = path.join(rootDir, 'Insumos');
const targetFile = path.join(rootDir, 'js', 'data.js');

if (!fs.existsSync(txtPath)) {
  console.error('Error: No se encontró el archivo "datos de tecnicas.txt".');
  process.exit(1);
}

// Escanear archivos PDF disponibles en Insumos/
let pdfFiles = [];
if (fs.existsSync(insumosDir)) {
  pdfFiles = fs.readdirSync(insumosDir).filter(f => f.toLowerCase().endsWith('.pdf'));
}

function normalize(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

function encontrarPdfParaTecnica(numero, nombre) {
  if (!pdfFiles.length) return null;
  const normTec = normalize(nombre);
  
  // 1. Coincidencia por número al inicio del archivo (ej. "01.pdf", "1 - linea.pdf", "1.pdf")
  const porNumero = pdfFiles.find(f => {
    const m = f.match(/^0*(\d+)/);
    return m && parseInt(m[1], 10) === numero;
  });
  if (porNumero) return `Insumos/${porNumero}`;

  // 2. Coincidencia por nombre (palabras clave)
  const normWords = normTec.split(/\s+/).filter(w => w.length > 2);
  const porNombre = pdfFiles.find(f => {
    const normF = normalize(f.replace(/\.pdf$/i, ''));
    if (normTec.includes(normF) || normF.includes(normTec)) return true;
    const fWords = normF.split(/\s+/).filter(w => w.length > 2);
    const overlap = fWords.filter(fw => normWords.some(nw => nw.startsWith(fw) || fw.startsWith(nw)));
    return overlap.length >= 2;
  });
  if (porNombre) return `Insumos/${porNombre}`;

  return null;
}

const content = fs.readFileSync(txtPath, 'utf8');
const lines = content.split(/\r?\n/);

const data = {
  titulo: lines[0]?.trim() || 'PORTAFOLIO DIDÁCTICO',
  tecnicas: [],
  conclusiones: [],
  referencias_generales: [
    "*Manual de estrategias didácticas*. (s. f.). [Recopilación de estrategias para la educación a distancia].",
    "*Manual de estrategias de enseñanza/aprendizaje*. (s. f.). Servicio Nacional de Aprendizaje (SENA).",
    "Murillo García, J. L. (2020). *Metodologías activas: Recursos para el aula* (3.ª ed.). Independently published.",
    "Naranjo Segura, J. C. (s. f.). *Álbum de técnicas*. [Documento de circulación interna].",
    "Peralta Lara, D. C., & Guamán Gómez, V. J. (2020). Metodologías activas para la enseñanza y aprendizaje de los estudios sociales. *Sociedad & Tecnología*, 3(2), 2–10. [https://doi.org/10.51247/st.v3i2.62](https://doi.org/10.51247/st.v3i2.62)",
    "Álvarez Navarro, B., & Solórzano Espinoza, D. (6 de septiembre de 2026). *Storytelling, narración histórica* [Diapositivas de presentación].",
    "Baltodano, C., & Díaz, I. (9 de septiembre de 2026). *La entrevista* [Diapositivas de presentación].",
    "Calvo Chaves, M., & Morales Chacón, E. (16 de septiembre de 2026). *Técnica didáctica: Periódico, revista o blog* [Diapositivas de presentación].",
    "Fajardo Madrigal, D., & Dalolio Monge, D. (2026). *Técnica didáctica: Cuaderno de viaje* [Diapositivas de presentación]. Facultad de Educación, Universidad de Costa Rica."
  ]
};

let currentCategory = 'Historia (Exposición Profesor)';
let currentTecnica = null;
let currentSection = '';
let inConclusiones = false;
let currentConclusion = null;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  if (line.includes('1. Historia')) {
    currentCategory = 'Historia (Exposición Profesor)';
    continue;
  }
  if (line.includes('2. Geografía')) {
    currentCategory = 'Geografía (Exposición Profesor)';
    continue;
  }
  if (line.includes('3. Educación Cívica')) {
    currentCategory = 'Educación Cívica (Exposición Profesor)';
    continue;
  }
  if (line.includes('4. Transversal')) {
    currentCategory = 'Transversal / Integradoras (Exposición Pares)';
    continue;
  }

  if (line.startsWith('5. Conclusiones')) {
    inConclusiones = true;
    if (currentTecnica) {
      if (!currentTecnica['Insumo PDF']) {
        currentTecnica['Insumo PDF'] = encontrarPdfParaTecnica(currentTecnica.numero, currentTecnica.nombre);
      }
      data.tecnicas.push(currentTecnica);
      currentTecnica = null;
    }
    continue;
  }

  if (inConclusiones) {
    if (line.startsWith('Lista de Técnicas')) {
      if (currentConclusion) {
        data.conclusiones.push(currentConclusion);
        currentConclusion = null;
      }
      break;
    }
    const matchAprendizaje = line.match(/^Aprendizaje\s*(\d+)\s*:\s*(.*)$/i);
    if (matchAprendizaje) {
      if (currentConclusion) {
        data.conclusiones.push(currentConclusion);
      }
      currentConclusion = {
        titulo: `Aprendizaje ${matchAprendizaje[1]}: ${matchAprendizaje[2].trim()}`,
        texto: ''
      };
      continue;
    } else if (currentConclusion) {
      currentConclusion.texto = currentConclusion.texto ? currentConclusion.texto + ' ' + line : line;
      continue;
    }
  }

  const matchTecnica = line.match(/^(\d{1,2})\.\s+([^:]+.*)$/);
  if (matchTecnica && parseInt(matchTecnica[1], 10) >= 1 && parseInt(matchTecnica[1], 10) <= 16 && !line.toLowerCase().startsWith('paso') && !line.toLowerCase().startsWith('tema:')) {
    const num = parseInt(matchTecnica[1], 10);
    if (currentTecnica) {
      if (!currentTecnica['Insumo PDF']) {
        currentTecnica['Insumo PDF'] = encontrarPdfParaTecnica(currentTecnica.numero, currentTecnica.nombre);
      }
      data.tecnicas.push(currentTecnica);
    }
    currentTecnica = {
      numero: num,
      nombre: matchTecnica[2].trim(),
      categoria: currentCategory,
      Descripción: '',
      'Aplicación de la técnica': [],
      'Recomendaciones para su ejecución': '',
      'Habilidades o competencias que desarrolla': '',
      'Contenido de Estudios Sociales o Cívica': '',
      'Modelaje / Ejemplo de aplicación': {
        tema: '',
        nivel: '',
        objetivo: '',
        instrucciones: '',
        procedimiento: '',
        producto_esperado: '',
        evaluación: ''
      },
      'Recurso didáctico': '',
      'Evidencia visual': '',
      'Insumo PDF': null,
      'Referencias utilizadas para la técnica': ''
    };
    currentSection = '';
    continue;
  }

  if (!currentTecnica) continue;

  if (line.startsWith('Descripción:')) {
    currentSection = 'descripcion';
    currentTecnica['Descripción'] = line.replace('Descripción:', '').trim();
    continue;
  }
  if (line.startsWith('Aplicación de la técnica:')) {
    currentSection = 'aplicacion';
    continue;
  }
  if (line.match(/^Paso\s*\d+\s*:/i) || line.match(/^•\s*Paso\s*\d+\s*:/i)) {
    currentSection = 'aplicacion';
    currentTecnica['Aplicación de la técnica'].push(line.replace(/^•\s*/, '').trim());
    continue;
  }
  if (line.startsWith('Recomendaciones para su ejecución:')) {
    currentSection = 'recomendaciones';
    currentTecnica['Recomendaciones para su ejecución'] = line.replace('Recomendaciones para su ejecución:', '').trim();
    continue;
  }
  if (line.startsWith('Habilidades o competencias que desarrolla:')) {
    currentSection = 'habilidades';
    currentTecnica['Habilidades o competencias que desarrolla'] = line.replace('Habilidades o competencias que desarrolla:', '').trim();
    continue;
  }
  if (line.startsWith('Contenido de Estudios Sociales o Cívica:')) {
    currentSection = 'contenido';
    currentTecnica['Contenido de Estudios Sociales o Cívica'] = line.replace('Contenido de Estudios Sociales o Cívica:', '').trim();
    continue;
  }
  if (line.startsWith('Modelaje / Ejemplo de aplicación:') || line.startsWith('Modelaje / Ejemplo de application:')) {
    currentSection = 'modelaje';
    continue;
  }
  if (line.startsWith('Tema:') || line.startsWith('• Tema:')) {
    currentSection = 'modelaje_tema';
    currentTecnica['Modelaje / Ejemplo de aplicación'].tema = line.replace(/^•?\s*Tema:\s*/, '').trim();
    continue;
  }
  if (line.startsWith('Nivel:') || line.startsWith('• Nivel:')) {
    currentSection = 'modelaje_nivel';
    currentTecnica['Modelaje / Ejemplo de aplicación'].nivel = line.replace(/^•?\s*Nivel:\s*/, '').trim();
    continue;
  }
  if (line.startsWith('Objetivo:') || line.startsWith('• Objetivo:')) {
    currentSection = 'modelaje_objetivo';
    currentTecnica['Modelaje / Ejemplo de aplicación'].objetivo = line.replace(/^•?\s*Objetivo:\s*/, '').trim();
    continue;
  }
  if (line.startsWith('Instrucciones:') || line.startsWith('• Instrucciones:')) {
    currentSection = 'modelaje_instrucciones';
    currentTecnica['Modelaje / Ejemplo de aplicación'].instrucciones = line.replace(/^•?\s*Instrucciones:\s*/, '').trim();
    continue;
  }
  if (line.startsWith('Procedimiento:') || line.startsWith('• Procedimiento:')) {
    currentSection = 'modelaje_procedimiento';
    currentTecnica['Modelaje / Ejemplo de aplicación'].procedimiento = line.replace(/^•?\s*Procedimiento:\s*/, '').trim();
    continue;
  }
  if (line.startsWith('Producto esperado:') || line.startsWith('• Producto esperado:')) {
    currentSection = 'modelaje_producto';
    currentTecnica['Modelaje / Ejemplo de aplicación'].producto_esperado = line.replace(/^•?\s*Producto esperado:\s*/, '').trim();
    continue;
  }
  if (line.startsWith('Evaluación:') || line.startsWith('• Evaluación:') || line.startsWith('Rubrica:') || line.startsWith('Rúbrica:')) {
    currentSection = 'modelaje_evaluacion';
    currentTecnica['Modelaje / Ejemplo de aplicación']['evaluación'] = line.replace(/^•?\s*(Evaluación|Rubrica|Rúbrica):\s*/, '').trim();
    continue;
  }
  if (line.startsWith('Recurso didáctico:')) {
    currentSection = 'recurso';
    currentTecnica['Recurso didáctico'] = line.replace('Recurso didáctico:', '').trim();
    continue;
  }
  if (line.startsWith('Evidencia visual:')) {
    currentSection = 'evidencia';
    currentTecnica['Evidencia visual'] = line.replace('Evidencia visual:', '')
      .replace(/\[RECORDATORIO DOCENTE:[^\]]*\]/gi, '')
      .trim();
    continue;
  }
  if (line.startsWith('Insumo PDF:') || line.startsWith('Insumo:')) {
    currentSection = 'insumo_pdf';
    currentTecnica['Insumo PDF'] = line.replace(/^(Insumo PDF|Insumo):\s*/i, '').trim();
    continue;
  }
  if (line.startsWith('Referencias utilizadas para la técnica:')) {
    currentSection = 'referencias';
    currentTecnica['Referencias utilizadas para la técnica'] = line.replace('Referencias utilizadas para la técnica:', '').trim();
    continue;
  }

  if (currentSection === 'descripcion') {
    currentTecnica['Descripción'] += ' ' + line;
  } else if (currentSection === 'recomendaciones') {
    currentTecnica['Recomendaciones para su ejecución'] += ' ' + line;
  } else if (currentSection === 'habilidades') {
    currentTecnica['Habilidades o competencias que desarrolla'] += ' ' + line;
  } else if (currentSection === 'contenido') {
    currentTecnica['Contenido de Estudios Sociales o Cívica'] += ' ' + line;
  } else if (currentSection === 'recurso') {
    currentTecnica['Recurso didáctico'] += ' ' + line;
  } else if (currentSection === 'evidencia') {
    currentTecnica['Evidencia visual'] += ' ' + line.replace(/\[RECORDATORIO DOCENTE:[^\]]*\]/gi, '').trim();
  } else if (currentSection === 'referencias') {
    currentTecnica['Referencias utilizadas para la técnica'] += ' ' + line;
  }
}

if (currentTecnica) {
  if (!currentTecnica['Insumo PDF']) {
    currentTecnica['Insumo PDF'] = encontrarPdfParaTecnica(currentTecnica.numero, currentTecnica.nombre);
  }
  data.tecnicas.push(currentTecnica);
}
if (currentConclusion) data.conclusiones.push(currentConclusion);

const jsHeader = `/**
 * Portafolio Didáctico - Base de Datos Curricular Actualizada
 * Generada a partir de 'datos de tecnicas.txt' y 'Insumos/'
 * Didáctica de los Estudios Sociales y la Educación Cívica • MEP Costa Rica
 */
const PORTAFOLIO_DATA = `;

const jsContent = jsHeader + JSON.stringify(data, null, 2) + `;\n\nif (typeof window !== 'undefined') window.PORTAFOLIO_DATA = PORTAFOLIO_DATA;\nif (typeof globalThis !== 'undefined') globalThis.PORTAFOLIO_DATA = PORTAFOLIO_DATA;\n`;

fs.writeFileSync(targetFile, jsContent, 'utf8');
console.log(`[EXITO] Se sincronizaron ${data.tecnicas.length} técnicas y ${data.conclusiones.length} conclusiones en js/data.js`);
data.tecnicas.forEach(t => {
  if (t['Insumo PDF']) {
    console.log(`  -> Técnica ${t.numero} (${t.nombre}): ${t['Insumo PDF']}`);
  }
});
