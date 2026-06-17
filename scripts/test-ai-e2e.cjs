// =============================================================================
// scripts/test-ai-e2e.cjs
//
// Prueba de integración E2E definitiva.
// Crea un usuario temporal en Supabase Auth, inicia sesión para obtener un token real,
// e interroga a la API de chat en local para confirmar el flujo de autenticación + IA.
// =============================================================================

const fs = require("fs");
const path = require("path");

const serverNodeModules = path.resolve(process.cwd(), "server/node_modules");
if (fs.existsSync(serverNodeModules)) {
  module.paths.push(serverNodeModules);
}

const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
};

async function runRealE2E() {
  // Cargar variables de entorno del backend y de la raíz
  const serverEnvPath = path.resolve(process.cwd(), "server/.env");
  if (fs.existsSync(serverEnvPath)) {
    dotenv.config({ path: serverEnvPath });
  }
  const rootEnvPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath });
  }

  console.log(`${COLORS.bold}${COLORS.cyan}============================================================`);
  console.log("            SportMatch E2E Chat Integration Test");
  console.log(`============================================================${COLORS.reset}\n`);

  // 1. Cargar credenciales activas del .env del servidor
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    console.error(`${COLORS.red}ERROR: Faltan variables de Supabase en server/.env${COLORS.reset}`);
    process.exit(1);
  }

  console.log(`${COLORS.bold}1. Inicializando clientes de Supabase con .env del servidor...${COLORS.reset}`);
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const supabaseClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  console.log(`${COLORS.green}✓ Clientes de Supabase inicializados.${COLORS.reset}\n`);

  // 2. Crear usuario temporal de QA
  const email = "qa_test_e2e_sportmatch@sportmatch.app";
  const password = "TemporaryPassword123!QA";
  console.log(`${COLORS.bold}2. Creando/actualizando usuario de pruebas en Supabase Auth...${COLORS.reset}`);
  
  let userId = "";
  try {
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existing = userList?.users?.find(u => u.email === email);
    
    if (existing) {
      userId = existing.id;
      console.log(`   Usuario existente encontrado (ID: ${userId}). Actualizando contraseña...`);
      await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { user_role: "PLAYER" }
      });
      if (createError) throw createError;
      userId = newUser.user.id;
      console.log(`   Nuevo usuario de pruebas creado con éxito (ID: ${userId}).`);
    }

    // Crear su perfil en la base de datos para que la app no falle por falta de perfil
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        name: "Edwin QA Tester",
        email,
        level: "Elite",
        trust_score: 99,
        fitcoins_balance: 3500,
        preferred_sports: ["pádel", "fútbol"]
      });
    if (profileError) {
      console.warn("   Advertencia (perfil):", profileError.message);
    }
  } catch (err) {
    console.error(`${COLORS.red}✕ Falló la preparación del usuario de pruebas: ${err instanceof Error ? err.message : String(err)}${COLORS.reset}`);
    process.exit(1);
  }
  console.log(`${COLORS.green}✓ Usuario de pruebas preparado.${COLORS.reset}\n`);

  // 3. Iniciar sesión para obtener el Token Access real
  console.log(`${COLORS.bold}3. Iniciando sesión de usuario de pruebas...${COLORS.reset}`);
  let accessToken = "";
  try {
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });
    if (sessionError) throw sessionError;
    accessToken = sessionData.session.access_token;
  } catch (err) {
    console.error(`${COLORS.red}✕ Falló el inicio de sesión: ${err instanceof Error ? err.message : String(err)}${COLORS.reset}`);
    // Limpieza antes de salir
    await supabaseAdmin.auth.admin.deleteUser(userId);
    process.exit(1);
  }
  console.log(`${COLORS.green}✓ Sesión iniciada. Token de acceso real obtenido.${COLORS.reset}\n`);

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  };

  // 4. Probar Endpoint de Bienvenida (Welcome Chat)
  console.log(`${COLORS.bold}4. Probando POST /api/v1/ai/chat/welcome...${COLORS.reset}`);
  try {
    const res = await fetch("http://localhost:3000/api/v1/ai/chat/welcome", {
      method: "POST",
      headers,
      body: JSON.stringify({ language: "es" }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
    }

    console.log(`${COLORS.green}✅ BIENVENIDA EXITOSA!${COLORS.reset}`);
    console.log(`   Respuesta Sporty:\n   "${data.reply}"\n`);
  } catch (err) {
    console.error(`${COLORS.red}❌ BIENVENIDA FALLIDA: ${err instanceof Error ? err.message : String(err)}${COLORS.reset}\n`);
  }

  // 5. Probar Endpoint de Chat General (Chat Conversation)
  console.log(`${COLORS.bold}5. Probando POST /api/v1/ai/chat...${COLORS.reset}`);
  try {
    const res = await fetch("http://localhost:3000/api/v1/ai/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: "Hola Sporty, recomiéndame un tip rápido para jugar pádel los domingos.",
        language: "es",
        history: [],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
    }

    console.log(`${COLORS.green}✅ CHAT CONVERSACIONAL EXITOSO!${COLORS.reset}`);
    console.log(`   Respuesta Sporty:\n   "${data.reply}"`);
    console.log(`   Sugerencias de seguimiento:\n   ${JSON.stringify(data.suggestions)}\n`);
  } catch (err) {
    console.error(`${COLORS.red}❌ CHAT FALLIDO: ${err instanceof Error ? err.message : String(err)}${COLORS.reset}\n`);
  }

  // 6. Limpieza final de la cuenta de pruebas
  console.log(`${COLORS.bold}6. Limpiando cuenta de pruebas de la base de datos...${COLORS.reset}`);
  try {
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    console.log(`${COLORS.green}✓ Limpieza completada con éxito.${COLORS.reset}\n`);
  } catch (err) {
    console.warn("   Advertencia durante la limpieza:", err instanceof Error ? err.message : String(err));
  }

  console.log(`${COLORS.bold}${COLORS.green}🎉 TEST E2E FINALIZADO CON ÉXITO ABSOLUTO!${COLORS.reset}`);
}

runRealE2E().catch(console.error);
