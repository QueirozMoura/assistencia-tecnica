import test from "node:test";
import assert from "node:assert/strict";
import {
  calcularFrete,
  normalizarCep,
  reaisParaCentavos,
  FRETE_FIXO_CENTAVOS,
  MOTIVO_CEP_INVALIDO,
  MOTIVO_SUBTOTAL_INVALIDO,
  MOTIVO_ENTREGA_INDISPONIVEL,
} from "../src/services/frete.service.js";
import { FAIXAS_CEP_ATENDIDAS } from "../src/config/freteCobertura.js";

// Cobertura SINTÉTICA usada só nestes testes (não representa a cobertura real da JFQ).
const faixas = [{ inicio: "01000000", fim: "01099999" }, { inicio: "02000000", fim: "02000000" }];
const CEP_ATENDIDO = "01050-000";

test("cobertura real: limites inclusivos das faixas dos 5 municípios atendidos", () => {
  const casos = [
    ["01000-000", "São Paulo (capital)"], ["05999-999", "São Paulo (capital)"],
    ["08000-000", "São Paulo (capital)"], ["08499-999", "São Paulo (capital)"],
    ["06000-000", "Osasco"], ["06299-999", "Osasco"],
    ["06750-000", "Taboão da Serra"], ["06799-999", "Taboão da Serra"],
    ["06800-000", "Embu das Artes"], ["06849-999", "Embu das Artes"],
    ["09000-000", "Santo André"], ["09299-999", "Santo André"],
  ];
  for (const [cep, municipio] of casos) {
    const r = calcularFrete({ cep, subtotal: 100 });
    assert.equal(r.ok, true, cep);
    assert.equal(r.municipio, municipio, cep);
  }
});

test("cobertura real: CEPs imediatamente fora das faixas e de outros municípios não são atendidos", () => {
  const fora = [
    "00999-999", // antes da capital
    "06300-000", // após Osasco (Carapicuíba)
    "06749-999", // antes de Taboão da Serra
    "06850-000", // após Embu das Artes
    "07000-000", "07999-999", // entre as duas faixas da capital (Guarulhos etc.)
    "08500-000", "08999-999", // Itaquaquecetuba, Ferraz etc. (depois da capital leste)
    "09300-000", // Mauá
    "09600-000", // São Bernardo do Campo
    "13000-000", // Campinas
    "20000-000", // Rio de Janeiro
  ];
  for (const cep of fora) {
    assert.deepEqual(calcularFrete({ cep, subtotal: 100 }), { ok: false, motivo: MOTIVO_ENTREGA_INDISPONIVEL }, cep);
  }
});

test("a lista de cobertura só contém faixas bem formadas e sem sobreposição", () => {
  const ordenadas = [...FAIXAS_CEP_ATENDIDAS].sort((a, b) => a.inicio.localeCompare(b.inicio));
  for (const f of ordenadas) {
    assert.match(f.inicio, /^\d{8}$/);
    assert.match(f.fim, /^\d{8}$/);
    assert.ok(f.inicio <= f.fim, f.municipio);
    assert.ok(f.municipio);
  }
  for (let i = 1; i < ordenadas.length; i += 1) assert.ok(ordenadas[i - 1].fim < ordenadas[i].inicio, "faixas sobrepostas");
  assert.deepEqual([...new Set(FAIXAS_CEP_ATENDIDAS.map((f) => f.municipio))].sort(),
    ["Embu das Artes", "Osasco", "Santo André", "São Paulo (capital)", "Taboão da Serra"]);
});

test("subtotal abaixo de R$ 799,00 cobra frete fixo de R$ 50,00", () => {
  const r = calcularFrete({ cep: CEP_ATENDIDO, subtotal: 798.99, faixas });
  assert.equal(r.ok, true);
  assert.equal(r.valorCentavos, FRETE_FIXO_CENTAVOS);
  assert.equal(r.valor, 50);
  assert.equal(r.gratis, false);
  assert.equal(r.faltaParaGratisCentavos, 2); // precisa passar de R$ 799,00 -> faltam R$ 0,02
});

test("subtotal exatamente R$ 799,00 ainda cobra frete (grátis só acima)", () => {
  for (const subtotal of [799, 799.0, "799.00"]) {
    const r = calcularFrete({ cep: CEP_ATENDIDO, subtotal, faixas });
    assert.equal(r.valorCentavos, 5000);
    assert.equal(r.gratis, false);
    assert.equal(r.faltaParaGratisCentavos, 1);
  }
});

test("subtotal acima de R$ 799,00 tem frete grátis", () => {
  for (const subtotal of [799.01, 800, "1499.99"]) {
    const r = calcularFrete({ cep: CEP_ATENDIDO, subtotal, faixas });
    assert.equal(r.ok, true);
    assert.equal(r.valorCentavos, 0);
    assert.equal(r.gratis, true);
    assert.equal(r.faltaParaGratisCentavos, 0);
  }
});

test("usa centavos sem erro de ponto flutuante", () => {
  assert.equal(reaisParaCentavos(0.1 + 0.2), 30);
  assert.equal(reaisParaCentavos(799.01), 79901);
  assert.equal(reaisParaCentavos("19.9"), 1990);
  assert.equal(calcularFrete({ cep: CEP_ATENDIDO, subtotal: 799.0 + 0.001 - 0.001, faixas }).gratis, false);
});

test("rejeita CEP com formato inválido", () => {
  for (const cep of ["", "1234", "01310-10", "0131010000", "abcde-fgh", "01310_100", null, undefined, 1310100]) {
    assert.deepEqual(calcularFrete({ cep, subtotal: 100, faixas }), { ok: false, motivo: MOTIVO_CEP_INVALIDO }, String(cep));
  }
  assert.equal(normalizarCep("01310-100"), "01310100");
  assert.equal(normalizarCep(" 01310100 "), "01310100");
});

test("rejeita subtotal inválido", () => {
  for (const subtotal of [-1, NaN, Infinity, "abc", "10,50", null, undefined, {}]) {
    assert.deepEqual(calcularFrete({ cep: CEP_ATENDIDO, subtotal, faixas }), { ok: false, motivo: MOTIVO_SUBTOTAL_INVALIDO }, String(subtotal));
  }
});

test("CEP válido fora da cobertura retorna entrega indisponível", () => {
  assert.deepEqual(calcularFrete({ cep: "09000-000", subtotal: 100, faixas }), { ok: false, motivo: MOTIVO_ENTREGA_INDISPONIVEL });
  assert.deepEqual(calcularFrete({ cep: "01100-000", subtotal: 100, faixas }), { ok: false, motivo: MOTIVO_ENTREGA_INDISPONIVEL });
});

test("limites da faixa são inclusivos e faixa de CEP único funciona", () => {
  for (const cep of ["01000-000", "01099-999", "02000-000"]) {
    assert.equal(calcularFrete({ cep, subtotal: 100, faixas }).ok, true, cep);
  }
  assert.equal(calcularFrete({ cep: "02000-001", subtotal: 100, faixas }).ok, false);
});

test("frete indisponível não depende do valor da compra", () => {
  assert.equal(calcularFrete({ cep: "09000-000", subtotal: 5000, faixas }).motivo, MOTIVO_ENTREGA_INDISPONIVEL);
});
