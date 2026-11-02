import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function run(code, overrides = {}) {
  return spawnSync(process.execPath, ["--input-type=module", "-e", code], {
    cwd: new URL("../", import.meta.url), encoding: "utf8",
    env: { ...process.env, RESEND_API_KEY: "", NODE_ENV: "development", EMAIL_TRANSPORT: "mock", TELEGRAM_TRANSPORT: "mock", ...overrides },
  });
}

test("development email and Telegram mocks send nothing and disclose no message or token", () => {
  const result = run(`
    globalThis.fetch = () => { throw new Error('Unexpected external request'); };
    const e = await import('./src/services/email.service.js');
    const t = await import('./src/services/telegram.service.js');
    await e.sendVerificationEmail('private-sentinel@example.invalid', 'Name', 'token-sentinel');
    await e.sendPasswordResetEmail('private-sentinel@example.invalid', 'Name', 'token-sentinel');
    const result = await e.sendAdminPaymentApprovedEmail({pedido:{id:1},payment:{}});
    if (!result.simulated || result.sent) throw new Error('Expected simulation');
    await t.sendTelegramMessage('message-sentinel');
  `);
  assert.equal(result.status, 0, "mock process must succeed without credentials");
  for (const sentinel of ["private-sentinel", "token-sentinel", "message-sentinel"]) {
    assert.ok(!(result.stdout + result.stderr).includes(sentinel));
  }
});

test("production cannot enable email mock and still requires Resend credentials", () => {
  const result = run("await import('./src/services/email.service.js')", { NODE_ENV: "production" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Missing API key/);
});

test("development database guard refuses a different database host", () => {
  const result = run("await import('./src/config/prisma.js')", {
    DEV_DATABASE_HOST: "approved.invalid", DATABASE_URL: "postgresql://other.invalid/test",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Banco recusado/);
});

test("migration helper refuses any destination outside the isolated development project", () => {
  const result = run("await import('./scripts/migrate-local.js')", {
    DEV_DATABASE_HOST: "other.invalid", DATABASE_URL: "postgresql://other.invalid/test",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Migracao recusada/);
});
