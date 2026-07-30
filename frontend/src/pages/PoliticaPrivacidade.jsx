export default function PoliticaPrivacidade() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200">
        <div className="container-max px-4 py-10 md:py-14">
          <h1 className="text-3xl md:text-4xl font-bold text-[#003366]">Política de Privacidade</h1>
          <p className="mt-3 text-slate-600 max-w-3xl leading-relaxed">
            Esta Política descreve como este sistema de assistência técnica e e-commerce trata dados pessoais,
            em conformidade com a LGPD (Lei nº 13.709/2018).
          </p>
        </div>
      </section>

      <section className="container-max px-4 py-8 md:py-12">
        <article className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-sm space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">1. Introdução</h2>
            <p>
              Esta Política de Privacidade descreve como a Plataforma (sistema destinado ao gerenciamento de produtos,
              pedidos e serviços de assistência técnica.) coleta, utiliza, armazena, compartilha e protege dados
              pessoais de seus usuários, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados
              Pessoais – LGPD).
            </p>
            <p className="mt-3">Ao utilizar este sistema, você declara estar ciente das práticas descritas nesta Política.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">2. Dados coletados</h2>
            <p className="mb-3">A Plataforma pode coletar os seguintes dados pessoais, de acordo com a forma de uso do sistema:</p>

            <h3 className="text-lg font-semibold text-slate-900 mb-2">2.1. Dados de cadastro e autenticação</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nome;</li>
              <li>E-mail;</li>
              <li>Senha armazenada utilizando função de derivação criptográfica com hash seguro, não sendo armazenada em formato de texto puro.</li>
              <li>Dados necessários para autenticação e sessão (incluindo tokens JWT).</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-5 mb-2">2.2. Dados de uso de funcionalidades</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Informações relacionadas a pedidos;</li>
              <li>Informações relacionadas a agendamentos de assistência técnica;</li>
              <li>Itens adicionados ao carrinho;</li>
              <li>Itens adicionados à lista de desejos.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-5 mb-2">2.3. Dados de recuperação de senha</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>E-mail e informações necessárias para validação do processo de recuperação de acesso.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-5 mb-2">2.4. Dados de pagamento</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dados necessários para viabilizar o pagamento por meio do Mercado Pago, conforme o fluxo de checkout da Plataforma.</li>
              <li>A Plataforma não tem como finalidade armazenar dados completos de cartão; o processamento de pagamento ocorre via intermediador.</li>
              <li>O processamento de dados financeiros é realizado diretamente pelo Mercado Pago, seguindo as políticas e medidas de segurança adotadas pelo próprio provedor.</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-900 mt-5 mb-2">2.5. Cookies e tecnologias semelhantes</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Dados coletados por cookies e tecnologias correlatas, inclusive para registrar preferências de consentimento de cookies já implementadas no sistema.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">3. Finalidade do tratamento</h2>
            <p className="mb-3">Os dados pessoais são tratados para as seguintes finalidades:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Permitir cadastro, login e autenticação de clientes;</li>
              <li>Permitir login e acesso de perfis administrativos e técnicos;</li>
              <li>Executar processo de recuperação de senha;</li>
              <li>Gerenciar pedidos, carrinho e lista de desejos;</li>
              <li>Registrar e operacionalizar agendamentos;</li>
              <li>Processar e confirmar pagamentos via Mercado Pago;</li>
              <li>Manter segurança da aplicação, prevenção a fraudes e uso indevido;</li>
              <li>Cumprir obrigações legais e regulatórias aplicáveis;</li>
              <li>Armazenar e gerenciar preferências de cookies e consentimento.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">4. Base legal (LGPD)</h2>
            <p className="mb-3">O tratamento de dados pessoais poderá ocorrer com base nas seguintes hipóteses legais previstas na LGPD, conforme o caso:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Execução de contrato ou de procedimentos preliminares relacionados ao contrato (art. 7º, V);</li>
              <li>Cumprimento de obrigação legal ou regulatória (art. 7º, II);</li>
              <li>Exercício regular de direitos em processo judicial, administrativo ou arbitral (art. 7º, VI);</li>
              <li>Legítimo interesse da Plataforma, respeitados os direitos e liberdades fundamentais do titular (art. 7º, IX);</li>
              <li>Consentimento do titular, quando exigido, especialmente para finalidades específicas de cookies não essenciais (art. 7º, I).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">5. Compartilhamento de dados</h2>
            <p className="mb-3">
              A Plataforma poderá compartilhar dados pessoais estritamente quando necessário para viabilizar suas operações e funcionalidades, com:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Mercado Pago: para intermediação e processamento de pagamentos;</li>
              <li>Vercel: hospedagem da aplicação frontend;</li>
              <li>Render: hospedagem da aplicação backend;</li>
              <li>Neon: hospedagem e infraestrutura do banco de dados PostgreSQL.</li>
            </ul>
            <p className="mt-3">
              O compartilhamento é realizado dentro dos limites necessários à prestação dos serviços e com observância de medidas de segurança adequadas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">6. Cookies</h2>
            <p className="mb-3">A Plataforma utiliza cookies e tecnologias semelhantes para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Garantir o funcionamento técnico da aplicação;</li>
              <li>Registrar preferências do usuário, inclusive consentimento;</li>
              <li>Melhorar a experiência de navegação.</li>
            </ul>
            <p className="mt-3">
              Quando aplicável, o usuário pode gerenciar suas preferências por meio do mecanismo de consentimento de cookies disponível na própria Plataforma.
            </p>
            <p className="mt-3">
              As preferências de consentimento são armazenadas localmente no navegador do usuário para respeitar as escolhas realizadas no mecanismo de gerenciamento de cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">7. Segurança das informações</h2>
            <p className="mb-3">
              A Plataforma adota medidas técnicas e organizacionais para proteger dados pessoais contra acesso não autorizado, destruição, perda,
              alteração, comunicação ou difusão indevida, incluindo:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Controle de autenticação e autorização de acesso;</li>
              <li>Uso de autenticação baseada em JWT;</li>
              <li>Boas práticas de desenvolvimento e proteção de credenciais;</li>
              <li>Restrição de acesso conforme perfis de usuário (cliente, administrativo e técnico).</li>
            </ul>
            <p className="mt-3">
              Apesar dos esforços contínuos, nenhum sistema é completamente imune a riscos. Em caso de incidentes relevantes,
              serão adotadas as medidas legalmente cabíveis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">8. Tempo de retenção dos dados</h2>
            <p className="mb-3">Os dados pessoais são armazenados somente pelo tempo necessário para cumprir as finalidades desta Política, observando:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Necessidade operacional para execução das funcionalidades do sistema;</li>
              <li>Cumprimento de obrigações legais e regulatórias;</li>
              <li>Exercício regular de direitos.</li>
            </ul>
            <p className="mt-3">
              Encerrado o período de necessidade e inexistindo fundamento legal para manutenção, os dados poderão ser eliminados ou anonimizados, conforme aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">9. Direitos do titular</h2>
            <p className="mb-3">Nos termos da LGPD, o titular dos dados pode solicitar, entre outros direitos:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmação da existência de tratamento;</li>
              <li>Acesso aos dados;</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;</li>
              <li>Portabilidade dos dados, quando aplicável;</li>
              <li>Eliminação de dados tratados com consentimento, quando cabível;</li>
              <li>Informação sobre compartilhamento de dados;</li>
              <li>Informação sobre possibilidade de não fornecer consentimento e suas consequências;</li>
              <li>Revogação do consentimento, quando aplicável.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">10. Exercício dos direitos</h2>
            <p>
              Para exercer seus direitos como titular de dados pessoais, o usuário pode entrar em contato pelos canais
              informados na seção “Contato” desta Política.
            </p>
            <p className="mt-3">
              As solicitações poderão exigir validação de identidade, para proteção do próprio titular e prevenção de acessos indevidos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">11. Alterações nesta Política</h2>
            <p>
              Esta Política poderá ser atualizada a qualquer momento para refletir melhorias no sistema, adequações legais
              ou mudanças operacionais.
            </p>
            <p className="mt-3">
              A versão vigente será sempre a disponibilizada na Plataforma, com indicação da data de atualização quando aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">12. Contato</h2>
            <p>
              Para dúvidas sobre esta Política de Privacidade ou solicitações relacionadas a dados pessoais, o usuário poderá entrar em contato através do formulário ou canais de atendimento disponibilizados na área de contato da Plataforma.
            </p>
          </section>
        </article>
      </section>
    </main>
  )
}
