const BASE_URL = "https://menudays-api-production.up.railway.app/api";

async function checkEndpoint(
  name: string,
  endpoint: string,
  options?: RequestInit
) {
  const start = Date.now();

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    const time = Date.now() - start;

    console.log(
      `${response.ok ? "✅" : "⚠️"} ${name} | ${response.status} | ${time}ms`
    );

    if (!response.ok) {
      try {
        const body = await response.json();
        console.log("   ↳", body.message ?? body);
      } catch {}
    }

    return response.ok;
  } catch (err: any) {
    console.log(`❌ ${name}`);
    console.log("   ↳", err.message);
    return false;
  }
}

export async function runApiDiagnostics() {
  console.clear();

  console.log("");
  console.log("═══════════════════════════════════════");
  console.log("🚀 MenuDays API Diagnostics");
  console.log("═══════════════════════════════════════");
  console.log(`🌐 ${BASE_URL}`);
  console.log("");

  // API
  await checkEndpoint("API", "");

  // Provincias (lee Prisma + PostgreSQL)
  await checkEndpoint("Provincias", "/locations/provincias");

  // Login
  await checkEndpoint("Login", "/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "diagnostic@test.com",
      password: "123456",
    }),
  });

  // Register (esperamos 400 si valida correctamente)
  await checkEndpoint("Register", "/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  console.log("");
  console.log("═══════════════════════════════════════");
  console.log("🏁 Diagnóstico finalizado");
  console.log("═══════════════════════════════════════");
}