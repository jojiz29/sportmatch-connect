# PLAN DE PROYECTO FINAL DE CARRERA (PLAN DE TESIS)

## **SPORTMATCH CONNECT: PLATAFORMA INTEGRAL DE MATCHMAKING DEPORTIVO Y RESERVAS CON INTELIGENCIA ARTIFICIAL EN EL BORDE**

**Plan de Tesis para la Aprobación del Tema de Investigación de Proyecto Final de Carrera III**  
**Universidad San Ignacio de Loyola (USIL) — Facultad de Ingeniería**  

---

## 📋 CAPÍTULO I: PLANTEAMIENTO DEL PROBLEMA

### 1.1. Descripción de la Realidad Problemática
En Lima Metropolitana, el 72% de la población adulta realiza actividad física insuficiente (MINSA 2024), lo que agrava problemas de salud pública como el sedentarismo y las enfermedades cardiovasculares. A pesar de la existencia de campos deportivos y una alta demanda de recreación amateur (fútbol, pádel, baloncesto), no existe un canal unificado para la organización de encuentros. La coordinación se realiza mediante grupos informales de mensajería (WhatsApp/Telegram) donde la información se dispersa, no se filtran participantes por nivel de destreza, los organizadores asumen deudas financieras individuales para reservar canchas y la recaudación mediante billeteras móviles genera morosidad.

### 1.2. Formulación del Problema
*   **Problema General:** ¿De qué manera el diseño e implementación de una plataforma informática basada en matchmaking predictivo e inteligencia artificial influye en la eficiencia de la coordinación y en la continuidad de la práctica deportiva recreativa en jóvenes adultos en Lima Metropolitana durante el periodo 2026?

### 1.3. Objetivos de la Investigación
*   **Objetivo General:** Desarrollar e implementar la plataforma "SportMatch Connect", un sistema de matchmaking deportivo geolocalizado con economía gamificada y asistente inteligente para unificar y optimizar la práctica del deporte amateur en Lima.
*   **Objetivos Específicos:**
    1.  Diseñar un algoritmo predictivo multivariable para nivelación de jugadores.
    2.  Implementar búsquedas y reservas geoespaciales integradas con base de datos PostGIS.
    3.  Construir un sistema de cobros compartidos basado en FitCoins y pasarela Stripe.
    4.  Diseñar un asistente conversacional de voz multimodal (Gemini AI).

---

## 📚 CAPÍTULO II: MARCO TEÓRICO Y ESTADO DEL ARTE

### 2.1. Antecedentes de la Investigación
*   *Playtomic (España):* Referente en la automatización de reservas de pádel, con un enfoque transaccional pero limitado en algoritmos predictivos adaptados y gamificación financiera en la región andina.
*   *CourtSide (USA):* Enfoque centrado en emparejamientos estáticos, sin soporte conversacional en tiempo real ni moderación en el borde.

### 2.2. Bases Teóricas
*   **Algoritmo de Haversine:** Para calcular distancias esféricas sobre la superficie terrestre dadas la longitud y latitud.
*   **Sistema de Calificación Elo:** Modelo matemático para estimar la habilidad relativa de jugadores de manera dinámica tras cada confrontación.
*   **Feature-Sliced Design (FSD):** Metodología de arquitectura de frontend que divide la aplicación en capas estructuradas (app, routes, widgets, features, entities, shared).

---

## 🛠️ CAPÍTULO III: METODOLOGÍA Y PLAN DE TRABAJO

### 3.1. Tipo de Investigación
Investigación tecnológica y aplicada, orientada al diseño e implementación de un artefacto de software funcional para resolver un problema de coordinación logística.

### 3.2. Metodología de Desarrollo
Se utiliza el marco ágil **Scrum**, planificado en 8 sprints bi-semanales con control de historias de usuario en Jira Cloud.

### 3.3. Presupuesto Estimado
| Recurso | Cantidad | Costo Unitario (PEN) | Costo Total (PEN) |
|---|---|---|---|
| Hardware de Desarrollo | 5 laptops | S/. 3,700.00 | S/. 18,500.00 |
| Hosting & Cloud Compute (Render) | 12 meses | S/. 150.00 | S/. 1,800.00 |
| Servicios DB Supabase & APIs IA | 12 meses | S/. 200.00 | S/. 2,400.00 |
| Licencias de Software | 5 licencias | S/. 240.00 | S/. 1,200.00 |
| Gastos Operativos | Global | S/. 5,300.00 | S/. 5,300.00 |
| **Total General** | | | **S/. 29,200.00** |
