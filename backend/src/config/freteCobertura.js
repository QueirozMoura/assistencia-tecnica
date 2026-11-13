/**
 * Cobertura de entrega própria da JFQ (CEPs atendidos).
 *
 * Formato de cada faixa: CEP com 8 dígitos, sem hífen, limites inclusivos.
 *   { inicio: "01000000", fim: "05999999", municipio: "São Paulo (capital)" }
 * Para um CEP único, use inicio igual a fim.
 * `cidade` e `uf` identificam o município da faixa e são usados para conferir o endereço informado
 * no pedido (cidade/estado precisam corresponder ao CEP). `aliases` (opcional) lista grafias
 * alternativas comuns do município; a comparação ignora acentos, maiúsculas e pontuação.
 * Isto é a ÚNICA fonte de verdade da cobertura: consultas externas de CEP (ViaCEP) só ajudam o
 * preenchimento no frontend e nunca autorizam entrega.
 *
 * MUNICÍPIOS ATENDIDOS (confirmados pela JFQ): São Paulo (capital), Osasco,
 * Taboão da Serra, Embu das Artes e Santo André. Nenhum outro município
 * (nem o restante da Grande São Paulo) deve ser incluído sem confirmação.
 *
 * FONTES DAS FAIXAS (consultadas em 11/11/2026; as faixas são as faixas de CEP
 * de cada município definidas pelos Correios):
 *  - Lista "Lista de municípios de São Paulo por CEP" (Wikipédia, pt):
 *      Osasco 06000-001 a 06299-999; Taboão da Serra 06750-001 a 06799-999;
 *      Embu das Artes 06800-001 a 06849-999; Santo André 09000-001 a 09299-999;
 *      São Paulo (capital) coberto por várias sub-faixas entre 01000-001 e 08499-999.
 *  - Infobox dos artigos de cada município na Wikipédia (pt): Osasco 06000-000 a 06299-000,
 *      Taboão da Serra 06750-000 a 06799-999, Embu das Artes 06800-000 a 06849-999.
 *  - oportunidados.com.br ("Lista de CEP completa do Brasil", atualizada em 21/10/2026,
 *      conferida pelo autor na busca oficial dos Correios em 16/10/2026): capital em
 *      01000-001 a 05999-999 e 08000-000 a 08499-999.
 *  - aletp.com.br (faixas por zona de São Paulo): capital 01000 a 05899 (zonas listadas) e
 *      08000 a 08499; Osasco 06000 a 06299; Taboão da Serra 06750 a 06799;
 *      Embu 06800 a 06849; Santo André 09000 a 09299.
 *
 * Intervalos usados abaixo = os que coincidem em todas as fontes (limite inicial incluindo
 * o CEP "-000" do início de cada faixa).
 *
 * VERIFICAÇÃO INDEPENDENTE (Etapa 4.4, 11/11/2026): 12.287 CEPs reais obtidos do ViaCEP (base dos Correios) para
 * os 5 municípios atendidos e 25 municípios vizinhos (Carapicuíba, Barueri, Cotia, Itapecerica da Serra, Vargem Grande
 * Paulista, Mauá, São Caetano do Sul, São Bernardo do Campo, Ferraz de Vasconcelos, Guarulhos etc.), confrontados com
 * estas faixas: 0 CEPs de município atendido fora da faixa, 0 CEPs de outro município dentro da faixa, 0 divergências de
 * nome. Bordas observadas: capital 01001-900 a 08490-552; Osasco 06010-040 a 06298-190 (Carapicuíba começa em 06310);
 * Taboão da Serra 06753-005 a 06795-006 (Vargem Grande Paulista termina em 06742); Embu das Artes 06803-000 a 06846-830
 * (Itapecerica começa em 06850); Santo André 09010-010 a 09291-280 (Mauá começa em 09310). O bloco 05900-05999 da capital
 * não tem nenhum CEP no ViaCEP (0 de 500 sondados; no bloco de controle 05800-05810 houve resposta): é seguro mantê-lo,
 * pois não contém endereços reais. A amostra não é exaustiva e o ViaCEP não é a fonte oficial: a conferência final
 * continua sendo a "Busca CEP > Faixa de CEP" dos Correios (formulário que não pode ser automatizado).
 *
 * PENDÊNCIAS / CUIDADOS (não resolvidos, deixados de fora de propósito):
 *  1. Conferir as faixas na busca oficial dos Correios ("Busca CEP > Faixa de CEP"), pois
 *     as fontes consultadas são secundárias e a consulta oficial é um formulário que não pôde
 *     ser automatizado aqui.
 *  2. Capital: a lista aletp só detalha as zonas até 05899; as fontes oportunidados e Wikipédia
 *     cobrem até 05999-999. Foi adotado 01000-000 a 05999-999 (duas fontes). Conferir 05900-05999.
 *  3. Faixas por município podem conter CEPs de grandes usuários/caixas postais; para fins de
 *     entrega própria isso não afeta o cálculo, mas o endereço informado é validado só pelo CEP.
 *  4. Não há cobertura configurada para Carapicuíba, Barueri, Cotia, São Caetano do Sul,
 *     São Bernardo do Campo, Mauá, Diadema etc.: seus CEPs retornam "entrega indisponível".
 *  5. Bairros/ruas específicos que a JFQ eventualmente NÃO atenda dentro desses municípios
 *     precisariam ser removidos ou excluídos aqui (não há informação sobre isso).
 */
export const FAIXAS_CEP_ATENDIDAS = [
  { inicio: "01000000", fim: "05999999", municipio: "São Paulo (capital)", cidade: "São Paulo", uf: "SP" },
  { inicio: "08000000", fim: "08499999", municipio: "São Paulo (capital)", cidade: "São Paulo", uf: "SP" },
  { inicio: "06000000", fim: "06299999", municipio: "Osasco", cidade: "Osasco", uf: "SP" },
  { inicio: "06750000", fim: "06799999", municipio: "Taboão da Serra", cidade: "Taboão da Serra", uf: "SP" },
  { inicio: "06800000", fim: "06849999", municipio: "Embu das Artes", cidade: "Embu das Artes", uf: "SP", aliases: ["Embu"] },
  { inicio: "09000000", fim: "09299999", municipio: "Santo André", cidade: "Santo André", uf: "SP" },
];
