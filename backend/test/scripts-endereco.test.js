import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validarEnderecoDeEntrega } from "../src/services/resumoPedido.service.js";

// Garante que os scripts de sandbox/smoke usam um endereço de teste coerente com a cobertura de frete
// (CEP, cidade e estado do mesmo município atendido). Não executa os scripts nem acessa banco/rede.
const scripts = ["sandbox-checkout-local.js", "smoke-ledger-dev.js", "test-rest-isolated.js"];

for (const nome of scripts) {
  test(`${nome}: endereço sintético é aceito pela validação de cobertura do backend`, () => {
    const codigo = readFileSync(new URL(`../scripts/${nome}`, import.meta.url), "utf8");
    const pegar = (campo) => new RegExp(`${campo}:\\s*["']([^"']+)["']`).exec(codigo)?.[1];
    const endereco = { cep: pegar("cep"), cidade: pegar("cidade"), estado: pegar("estado") };
    assert.ok(endereco.cep && endereco.cidade && endereco.estado, "endereço de teste não encontrado no script");
    assert.doesNotThrow(() => validarEnderecoDeEntrega(endereco), `endereço ${JSON.stringify(endereco)} deveria ser coberto`);
    assert.doesNotMatch(codigo, /cep:\s*["']00000000["']/, "CEP fictício incompatível com a cobertura");
  });
}

test("scripts de sandbox/smoke não apontam para o endpoint de produção do Neon", () => {
  const PRODUCAO = "ep-rough-surf-at6q5dm9";
  for (const nome of [...scripts, "test-payment-local.js", "smoke-local.js", "verify-dev-deploy.js"]) {
    assert.ok(!readFileSync(new URL(`../scripts/${nome}`, import.meta.url), "utf8").includes(PRODUCAO), `${nome} referencia o banco de produção`);
  }
});
