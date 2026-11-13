import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

// O código e as constraints do banco precisam concordar: um tipo novo em TIPOS sem a migration correspondente
// faria o INSERT da conciliação falhar dentro da transação do webhook. Este teste lê as migrations como estão no repositório.
Object.assign(process.env, { NODE_ENV: "development", DATABASE_URL: "postgresql://fixture:fixture@127.0.0.1:1/fixture", DEV_DATABASE_HOST: "127.0.0.1" });
const { TIPOS, verificacaoDoTipo } = await import("../src/services/conciliacao.service.js");

const migrationsDir = new URL("../prisma/migrations/", import.meta.url);
const sql = readdirSync(migrationsDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
  .map(name => readFileSync(new URL(`${name}/migration.sql`, migrationsDir), "utf8")).join("\n");
// Última definição vigente da constraint (as migrations posteriores a substituem com DROP + ADD).
const lastDefinition = name => {
  const start = sql.lastIndexOf(`ADD CONSTRAINT "${name}"`);
  assert.ok(start >= 0, `constraint ${name} não encontrada nas migrations`);
  return sql.slice(start, sql.indexOf(";", start));
};

test("a constraint de tipo da conciliação aceita todos os tipos do código", () => {
  const definition = lastDefinition("pagamento_conciliacoes_tipo_check");
  for (const tipo of Object.values(TIPOS)) assert.ok(definition.includes(`'${tipo}'`), `tipo ${tipo} ausente em pagamento_conciliacoes_tipo_check`);
});
test("a constraint de classificação acompanha a verificação definida no código para cada tipo", () => {
  const definition = lastDefinition("pagamento_conciliacoes_classificacao_check");
  for (const tipo of Object.values(TIPOS)) {
    assert.ok(definition.includes(`'${tipo}'`), `tipo ${tipo} ausente em pagamento_conciliacoes_classificacao_check`);
    assert.ok(definition.includes(`'${verificacaoDoTipo(tipo)}'`), `verificação de ${tipo} ausente`);
  }
  assert.match(definition, /"tipo" = 'PAGAMENTO_DUPLICADO' AND "verificacao" = 'CONFIRMADO_PELO_PROVEDOR' AND "statusProvedor" = 'approved' AND "paymentId" IS NOT NULL/);
});
test("a migration que cria o tipo duplicado só relaxa constraints: não apaga nem altera dados", () => {
  const dir = readdirSync(migrationsDir).filter(name => name.endsWith("conciliacao_pagamento_duplicado"));
  assert.equal(dir.length, 1, "exatamente uma migration conciliacao_pagamento_duplicado");
  const text = readFileSync(new URL(`${dir[0]}/migration.sql`, migrationsDir), "utf8").replace(/--.*$/gm, "");
  assert.doesNotMatch(text, /\b(DELETE|UPDATE|INSERT|TRUNCATE|DROP\s+TABLE|DROP\s+COLUMN)\b/i);
  assert.equal((text.match(/DROP CONSTRAINT/g) || []).length, 2); assert.equal((text.match(/ADD CONSTRAINT/g) || []).length, 2);
});
