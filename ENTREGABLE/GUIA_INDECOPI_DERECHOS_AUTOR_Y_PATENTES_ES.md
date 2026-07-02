# MANUAL INTEGRAL DE REGISTRO DE PROPIEDAD INTELECTUAL E INVENCIÓN DE SOFTWARE (INDECOPI - PERÚ)

## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO Y RED SOCIAL CON IA EN EL BORDE**

**Manual de Directrices Técnicas, Administrativas y Legales bajo la Jurisprudencia de INDECOPI y la Decisión 486 de la Comunidad Andina**  
**Diseñado para la Certificación Académica de Proyecto Final de Carrera III**  

---

## ⚖️ 1. INTRODUCCIÓN Y MARCO CONCEPTUAL DUAL

En la República del Perú, la protección del software está regulada de manera **dual**. Esto significa que se protege la **expresión del código** a través del Derecho de Autor, y el **efecto técnico funcional** de los algoritmos de forma excepcional a través del Régimen de Propiedad Industrial (Patentes de Invención). 

```
                                  SISTEMA DE SOFTWARE
                                  [SportMatch Connect]
                                           |
                    +----------------------+----------------------+
                    |                                             |
         Vía 1: Derecho de Autor                      Vía 2: Propiedad Industrial
          (Expresión del Código)                        (Efecto Técnico del Sistema)
                    |                                             |
         [Dirección de Derecho de Autor]             [Dirección de Invenciones y Nuevas Tec.]
                    |                                             |
        Registro de Soporte Lógico                     Patente de Invención (IIO)
     (Código Fuente, Binarios y Manuales)           (Matchmaking y Moderación en el Borde)
```

Este manual proporciona las directrices detalladas de nivel docente global para guiar a los investigadores en la preparación de los expedientes de registro ante el **Instituto Nacional de Defensa de la Competencia y de la Protección de la Propiedad Intelectual (INDECOPI)**.

---

## 📂 2. GUÍA DE REGISTRO DE DERECHO DE AUTOR (SOPORTE LÓGICO)

El registro ante la **Dirección de Derecho de Autor (DDA)** protege el código fuente (legible por humanos), el código objeto (ejecutable por la máquina), la arquitectura física del software, los esquemas de bases de datos y los manuales de usuario. Evita el plagio directo del código y asegura la autoría moral e intelectual de los desarrolladores.

### 📝 2.1. Formulario de Registro F-DDA-02
El expediente debe iniciarse con la presentación del formulario **F-DDA-02 (Registro de Soporte Lógico / Programa de Ordenador)**. A continuación se detallan los campos críticos y la forma de llenado:
1.  **Datos del Solicitante:** Si los derechos patrimoniales se ceden a la universidad, se ingresa la información de la **Universidad San Ignacio de Loyola (RUC: 20143545678)**. Si los conservan los alumnos, se ingresan los nombres y datos de contacto del equipo (Edwin Flores, Paolo Andrade, Erick Espinoza, Matías Gastelu, Juan Salvatierra).
2.  **Datos de los Autores:** Es obligatorio declarar el 100% de los coautores físicos del código con sus respectivos DNI y direcciones de domicilio fiscal.
3.  **Datos del Software:**
    *   *Título:* SportMatch Connect.
    *   *Año de Finalización de la Obra:* 2026.
    *   *País de Origen:* Perú.
    *   *¿Es obra inédita o publicada?:* Inédita (si no ha sido comercializada formalmente antes del registro).
    *   *Naturaleza del Software:* Aplicación Web Progresiva (PWA) de arquitectura desacoplada para matchmaking deportivo con backend en NestJS y base de datos relacional Supabase PostgreSQL.

### 💰 2.2. Tasas y Códigos de Pago
El trámite ante INDECOPI requiere el pago previo de la tasa administrativa correspondiente. Los canales de pago habilitados son el Banco de la Nación o la plataforma virtual **Pagalo.pe**:
*   **Código de Tasa:** `203000707` (Registro de obras y software ante la Dirección de Derecho de Autor).
*   **Monto de la Tasa:** **S/. 357.70 PEN** (Trescientos cincuenta y siete con 70/100 Soles).
*   **Forma de Pago:** Tarjeta de crédito/débito o cuenta bancaria, adjuntando el voucher de pago PDF al expediente de solicitud virtual (Mesa de Partes Virtual de INDECOPI).

### 📄 2.3. Estructura de la Memoria Descriptiva Técnica
La Memoria Descriptiva es el corazón del registro y debe detallar la funcionalidad íntima del sistema sin revelar secretos industriales críticos. Debe organizarse de la siguiente manera:
1.  **Título de la Obra:** Identificación formal de la plataforma.
2.  **Objetivo del Software:** Problema logístico y deportivo que soluciona.
3.  **Estructura de Archivos y Directorios:** Un mapa de los archivos principales del proyecto respetando la convención de Feature-Sliced Design (FSD).
4.  **Flujogramas del Sistema:** Diagramas de flujo de datos y secuencia que describan detalladamente la autenticación, la geolocalización PostGIS, la creación de reservas mediante Stripe y la consulta conversacional de Sporty AI.
5.  **Entorno de Hardware y Software Requerido:** Stack mínimo para desarrollo y ejecución (Node.js v20+, PostgreSQL 15+, navegadores modernos con soporte PWA).

### 💾 2.4. Reglas del Depósito de Código Fuente Representativo
Para otorgar el registro, INDECOPI requiere un depósito físico o digital del código fuente para su custodia en el archivo nacional de obras.
*   **Regla de Extracción:** Se exige entregar las **primeras 10 páginas y las últimas 10 páginas** impresas o en formato PDF inmutable dentro de un soporte digital (CD-ROM o memoria USB no regrabable).
*   **Contenido Seleccionado:** Para SportMatch Connect, las primeras 10 páginas corresponden a la definición de persistencia (`server/prisma/schema.prisma`) y las últimas 10 páginas corresponden a la lógica matemática del matchmaking (`server/src/matches/matches.service.ts`), asegurando que la arquitectura de datos y la innovación algorítmica queden formalmente registradas en el depósito.
*   **Manual de Usuario:** Debe adjuntarse obligatoriamente un archivo en PDF que contenga capturas de pantalla de la interfaz de usuario en Sleek Dark Mode, guiando al evaluador sobre cómo registrarse, geolocalizar complejos en el mapa Leaflet, pagar con Stripe y chatear por voz con Sporty.

---

## 🔬 3. GUÍA DE REGISTRO DE PATENTE (INVENCIONES IMPLEMENTADAS POR ORDENADOR - IIO)

El registro ante la **Dirección de Invenciones y Nuevas Tecnologías (DIN)** es un proceso altamente exigente enfocado en patentar un sistema o método que produce un **efecto técnico novedoso en el mundo físico**.

### ⚙️ 3.1. Requisitos Globales de Patentabilidad
Para obtener una patente de invención, SportMatch Connect debe pasar un examen de fondo de tres requisitos:
1.  **Novedad Mundial:** Que no exista a nivel global ningún sistema idéntico publicado en patentes, artículos científicos o plataformas comerciales antes de la fecha de presentación.
2.  **Nivel Inventivo:** Que la solución no sea obvia para un ingeniero de sistemas promedio o una persona con conocimientos técnicos ordinarios en la materia.
3.  **Aplicación Industrial:** Que el sistema pueda ser fabricado, reproducido o utilizado de manera constante en cualquier tipo de industria o sector económico (cumplido con su despliegue comercial B2B/B2C).

### 💡 3.2. ¿Qué es una Invención Implementada por Ordenador (IIO)?
Según las directrices de examen de la DIN de INDECOPI, un programa de ordenador por sí mismo no es patentable. No obstante, cuando el software forma parte de un **método o sistema que se integra con hardware para realizar transformaciones técnicas o interactuar con variables físicas**, califica como una IIO.
*   *Efecto Técnico en SportMatch Connect:* La invención reivindica la interacción física del dispositivo del usuario (coordenadas GPS de latitud y longitud procesadas mediante algoritmos de Haversine y Elo) integrada con un sistema de transacciones seguras de Stripe y pre-moderación visual en el borde con TensorFlow.js. Esto optimiza el consumo de recursos de computación y reduce la latición en las redes físicas de telecomunicaciones.

### 📝 3.3. Estructura del Expediente y Tasas de Patente
El expediente de patente debe redactarse con rigor científico y legal extremo, estructurándose en:
1.  **Memoria Descriptiva (Descripción Técnica):** Descripción detallada del estado del arte, deficiencias de los sistemas actuales, descripción detallada del invento y referencia a figuras.
2.  **Pliego de Reivindicaciones:** Las cláusulas legales que definen el límite de lo que el inventor se apropia.
3.  **Resumen de la Invención:** Síntesis técnica de máximo 150 palabras.
4.  **Figuras/Dibujos:** Planos C4 Container, flujogramas de secuencia y esquemas de base de datos indexados espacialmente.
5.  **Tasas de Presentación y Examen de Fondo (DIN):**
    *   *Tasa de Presentación de Solicitud:* Código **202000627** (Monto: **S/. 396.00 PEN**).
    *   *Tasa de Examen de Fondo de Patente:* Código **202000628** (Monto: **S/. 324.00 PEN**).
    *   *Forma de Pago:* A través de la plataforma virtual **Pagalo.pe** o ventanilla física del Banco de la Nación.

