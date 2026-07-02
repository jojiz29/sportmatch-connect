# 📖 Guía para Agentes AI: Redacción y Modificación de Entregables Académicos

Este documento sirve como manual de referencia e instrucciones para **cualquier agente de Inteligencia Artificial** (o desarrollador) que deba redactar, revisar, auditar o realizar modificaciones a los entregables académicos del proyecto **SportMatch Connect**.

Todos los documentos de referencia institucionales y ejemplos de éxito se encuentran almacenados en la carpeta:
👉 [DOCUMENTOS DE GUIA/](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/DOCUMENTOS%20DE%20GUIA/)

---

## 📂 Relación de Documentos de Guía y su Aplicación

### 1. Guía del Trabajo Final (Tesis)
*   **Archivos:** `(10-26-1) 1 Guía-Trabajo Final.pdf` y `(10-26-1) 1 Guía-Trabajo Final.docx`
*   **Propósito:** Define la estructura oficial, el formato de capítulos y los requisitos de contenido para el informe de tesis de Proyecto Final de Carrera III (USIL).
*   **Instrucción para el Agente:** 
    *   Cualquier edición en [TESIS_FINAL_SPORTMATCH_ES.md](file:///c:/Users/ejuni/OneDrive%20-%20SEIDOR%20SOLUTIONS%20S.L/Documentos/GitHub/sportmatch-connect/ENTREGABLE/1.%20Trabajo%20Final/TESIS_FINAL_SPORTMATCH_ES.md) debe mantener estrictamente la estructura de capítulos del Capítulo I al Capítulo VIII.
    *   Verificar que la redacción use un lenguaje académico impersonal en español neutro, y que las figuras y tablas sigan el formato de numeración e indexación institucional.

### 2. Rúbrica e Instrumento de Calificación
*   **Archivo:** `(10-26-1) 2 Instrumento de Evaluación.xlsx`
*   **Propósito:** Contiene las métricas, ponderaciones y escalas de logro para calificar el Informe Escrito, la Exposición y la Calidad del Software.
*   **Instrucción para el Agente:**
    *   Antes de finalizar cualquier iteración en el código o en el informe, validar que se cumplan las directrices para alcanzar la escala "Logrado/Avanzado" en cada uno de los 22 criterios descritos en el plan de auditoría.
    *   Asegurar que no se introduzcan dependencias con vulnerabilidades ni fallos en la suite de pruebas unitarias/E2E (541 tests en total).

### 3. Plantilla de Artículo Científico (IEEE)
*   **Archivo:** `(10-26-2) 3 Modelo de Paper.pdf`
*   **Propósito:** Plantilla oficial en formato de doble columna de la IEEE para la publicación de artículos de investigación y desarrollo tecnológico.
*   **Instrucción para el Agente:**
    *   Al modificar los artículos científicos en `2. Paper/` (`PAPER_CIENTIFICO_IEEE_SPORTMATCH.md`), asegurar que la diagramación en Markdown represente el formato de doble columna mediante tablas o delimitadores visuales.
    *   Verificar que contenga las secciones obligatorias: *Abstract/Resumen, Keywords, Introducción, Metodología (Arquitectura), Resultados, Discusión, Conclusiones y Referencias*.
    *   Las referencias en el texto deben numerarse consecutivamente entre corchetes (ej. `[1]`, `[2]`).

### 4. Guía de Medición de Atributos de Graduado (AG)
*   **Archivo:** `10-26-1) Medición AG.docx`
*   **Propósito:** Define los lineamientos académicos e individuales para evaluar las competencias de graduado del estudiante en PFC III.
*   **Instrucción para el Agente:**
    *   Garantizar que los documentos en `3. Medición AG - Personal/` incluyan las reflexiones individuales estructuradas bajo los códigos **AG-C05** (Gestión de Proyectos), **AG-C08** (Análisis de Problemas) y **AG-C11** (Uso de Herramientas Modernas y Especialidad).
    *   Las reflexiones de cada integrante (Edwin, Paolo, Erick, Matías, Juan) deben estar alineadas con evidencias concretas de sus contribuciones en Jira Cloud.

### 5. Guía de Solicitud de Derecho de Autor e INDECOPI
*   **Archivo:** `251011 Informe de Derechos Autor.docx`
*   **Propósito:** Especifica la estructura y secciones requeridas para registrar la autoría del código fuente y del manual técnico ante INDECOPI bajo la coordinación de la universidad.
*   **Instrucción para el Agente:**
    *   Al redactar los informes de autoría de software en `4. Informe de Derechos de Autor/`, estructurar obligatoriamente la descripción funcional del software, el modelo lógico de base de datos (Prisma schema), el diagrama de clases del backend y frontend, y los manuales de usuario.

### 6. Ficha de Evaluación de Propuestas de Software
*   **Archivo:** `Ficha de Evaluación Soft. 2025-02.docx`
*   **Propósito:** Formulario oficial para registrar los datos del equipo desarrollador, líneas de investigación institucionales e innovación técnica de la propuesta.
*   **Instrucción para el Agente:**
    *   Utilizar esta estructura como plantilla base para rellenar la ficha en `5. Fichas de Evaluación/Ficha de Evaluacion Software_SportMatch Connect_Grupo 01.md`.

### 7. Ejemplo de Éxito de Atributos de Graduado (Referencia Real)
*   **Archivo:** `AG-C05_ Gestión de Proyectos_Vera_de_la_Cruz_Nilton_Alonso.pdf`
*   **Propósito:** Documento de medición real de un egresado que obtuvo calificación sobresaliente en la competencia AG-C05.
*   **Instrucción para el Agente:**
    *   Utilizar este archivo PDF como el estándar de calidad de referencia para el nivel de detalle de las respuestas, la redacción académica y la presentación de capturas de pantalla de la velocidad de sprints y flujos de trabajo de Git/Jira.

---

## 🚨 Reglas Críticas para la IA antes de Editar
1.  **Validar Formato:** Cada vez que se realicen modificaciones en el informe o en el paper, ejecutar la auditoría de sintaxis para evitar que se rompan diagramas Mermaid o fórmulas LaTeX.
2.  **No Modificar las Guías:** Los archivos dentro de `DOCUMENTOS DE GUIA/` son fuentes de verdad inmutables provistas por la institución; **nunca** deben ser sobrescritos o alterados por el agente.
3.  **Sincronización:** Si se realiza un cambio estructural en la tesis en español (`TESIS_FINAL_SPORTMATCH_ES.md`), este debe propagarse a la versión en inglés (`TESIS_FINAL_SPORTMATCH_EN.md`) para mantener consistencia idiomática absoluta.
