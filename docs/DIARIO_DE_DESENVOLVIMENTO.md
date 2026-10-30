# Diário de desenvolvimento — Ifes Modas 2.0

Este diário registra **o que foi feito, em que ordem e por quê** na recriação do Ifes Modas. Ele é a base dos slides e do "caminho no código" do seminário. Cada etapa diz o que foi feito, as decisões tomadas e como conferimos que funcionou.

---

## Etapa 0 — Entender o sistema antigo

**O que fizemos:** lemos o código PHP do TCC (2024), o script SQL, a documentação (.docx) e os prints das telas.

**O que o sistema antigo faz** (requisitos funcionais da documentação):

| RF | Nome | Situação no PHP antigo |
|---|---|---|
| RF01 | Cadastro da loja | Funcionava, mas com SQL injection e sem validar CNPJ |
| RF02 | Login da loja | Com bug: `if ($result > 0)` é sempre verdadeiro; a "sessão" ia na URL |
| RF03 | Listar lojas por estado/município | Só ES funcionava; RJ/MG reaproveitavam um resultado já consumido |
| RF04 | Encaminhar para doações | Página estática com link vazio |
| RF05–RF07 | Adicionar/alterar/excluir item | **Só HTML fixo**, sem back-end |
| RF08 | Ver informações da loja | Banner comentado no código, não usava o banco |
| RF09 | Ver itens da loja | **HTML fixo** |

**Problemas encontrados** (bom material para o slide "antes × depois"):

1. **SQL injection.** As consultas eram montadas concatenando texto: `"SELECT * FROM Lojas WHERE CNPJ = '$CNPJ'"`. Um CNPJ como `' OR '1'='1` entrava no sistema.
2. **Autenticação pela URL.** Depois do login, o site levava `?nome_loja=X&cnpj=Y` em todos os links. Bastava editar a URL para "virar" outra loja.
3. **Preço `decimal(3,2)`.** Esse tipo guarda no máximo **9,99**, então nenhum uniforme de R$ 40,00 caberia.
4. **UF "BH" no cadastro.** BH é uma cidade, não um estado.
5. **Lista de lojas** com o mesmo bloco copiado 3 vezes e loops aninhados que consultavam o banco dentro de outro loop (N×M consultas).

**Decisão:** manter o **mesmo domínio e a mesma identidade visual** (verde Ifes, Poppins, banner, cards) e corrigir todos esses problemas na nova stack.

---

## Etapa 1 — Ambiente e repositório

- Instalamos o **.NET 10 SDK** (10.0.403) e o **Docker Desktop** com `winget`. Node 25 já estava instalado.
- Criamos a pasta `ifes-modas/` como repositório Git, com `user.email` **local** apontando para a conta pessoal. O git global da máquina é de outra conta e não foi alterado.
- Criamos o repositório público `odraudecf/ifes-modas` com o GitHub CLI (`gh repo create`).
- `.gitignore` (bin/obj, node_modules, `.env`) e `.gitattributes` (Dockerfile e YAML sempre com quebra de linha LF; com CRLF, o shell do container quebra).

**Por quê:** segredos (string de conexão do Neon, chave do JWT) **nunca** vão para o Git. Eles ficam em variáveis de ambiente no Render.

---

## Etapa 2 — API em .NET 10 (camadas)

```
backend/src/IfesModas.Api/
├─ Domain/       regras puras: Loja, Endereco, Uniforme, Cnpj, Ufs, RegrasUniforme
├─ Data/         AppDbContext (EF Core), migrations, seed, conversão da URL do Neon
├─ Dtos/         o "contrato" da API (o que entra e o que sai em JSON)
├─ Services/     regras de negócio: AuthService, LojaService, UniformeService, TokenService
├─ Controllers/  camada HTTP fina: recebe, chama o serviço, devolve o status
├─ Errors/       ApiException → ProblemDetails (erros padronizados, em português)
└─ Program.cs    monta tudo: banco, JWT, CORS, rate limit, Swagger, migrations
```

**Decisões e porquês:**

| Decisão | Por quê |
|---|---|
| **DTOs separados das entidades** | A entidade `Loja` tem `SenhaHash`. Se ela fosse devolvida direto, o hash vazaria no JSON. Um teste garante que a palavra "senha" nunca aparece na resposta. |
| **Serviços lançam `ApiException`** | O controller fica com uma linha só. Um handler central transforma a exceção em resposta HTTP (400/401/403/404/409). |
| **EF Core + Npgsql** | Todas as consultas são parametrizadas, o que acaba com o SQL injection do sistema antigo. |
| **Enums gravados como texto** | O banco mostra "Camisa", "Padrao", e não 0, 1, 2: fica legível sem tabela auxiliar. |
| **snake_case no Postgres** (`EFCore.NamingConventions`) | É o padrão do Postgres; evita aspas em todo SQL manual. |
| **`numeric(10,2)` no preço** | Corrige o `decimal(3,2)` antigo. |
| **CNPJ alfanumérico** | A Receita Federal começou a emitir CNPJs com letras em julho de 2026. O validador aceita os dois formatos; testamos com o exemplo oficial `12.ABC.345/01DE-35`. |
| **BCrypt** | Hash lento e com "sal" aleatório: duas lojas com a mesma senha têm hashes diferentes, e testar senhas em massa fica caro. |
| **JWT** | Substitui o `?cnpj=` na URL. O token é **assinado** com uma chave secreta; se alguém alterar o conteúdo, a assinatura não confere e a API responde 401. |
| **Autorização por dono** | Mesmo logada, uma loja não altera nem exclui uniforme de outra (403). |
| **Login com resposta igual para "CNPJ não existe" e "senha errada"** | Não revela quais CNPJs estão cadastrados. O BCrypt roda nos dois casos, para o tempo de resposta também ser parecido. |
| **Rate limit no login** (10/min por IP) | Dificulta tentar senhas em massa. Junto, `ForwardedHeaders`, porque no Render todos chegariam com o IP do proxy. |
| **Links de Instagram/Facebook só http/https** | Impede salvar `javascript:alert(1)` como link (XSS). |
| **Swagger também em produção** | O professor pode testar a API publicada direto no navegador, sem token nas rotas públicas. |
| **Migrations e seed na subida** | O Render não tem passo de "rodar migration"; a API se atualiza sozinha ao subir. O seed só roda com o banco vazio. |

**Endpoints:** veja a tabela no README.

---

## Etapa 3 — Testes (xUnit)

São **63 testes**, em duas camadas:

- **Unitários** (`tests/Unit`): CNPJ (válidos, inválidos, alfanumérico, `' OR '1'='1`), regras de tamanho/modelo/preço, conversão da URL do Neon, geração e validação do JWT, BCrypt.
- **Integração** (`tests/Integration`): o `WebApplicationFactory` sobe **a API inteira** (Program.cs real, com JWT, validação e controllers) trocando só o Postgres por um banco em memória. Testam o fluxo cadastro → login → criar/alterar/excluir uniforme → aparece na página pública, além de 401 sem token, 401 com token forjado, 403 em uniforme de outra loja, 409 com CNPJ repetido, 429 no rate limit, CORS e mensagens em português.

**Teste de mutação (a prova de que os testes servem):** desativamos de propósito a checagem de dono (`if (false && uniforme.LojaId != lojaId)`) e rodamos os testes. O teste `Loja_nao_altera_nem_exclui_uniforme_de_outra_loja` **falhou** (esperado 403, veio 200). Depois restauramos o código. Bom para a demo ao vivo.

---

## Etapa 4 — Docker e CI/CD

- **Dockerfile multi-stage:** o estágio `build` usa o SDK (~800 MB) para compilar; o estágio final leva só o runtime ASP.NET (~220 MB), roda como usuário sem privilégios (`$APP_UID`) e escuta na porta 8080. No Render, a variável `PORT` tem prioridade.
- **docker-compose.yml:** Postgres 17 + API para rodar tudo localmente com um comando.
- **GitHub Actions** (`.github/workflows/ci-cd.yml`), em todo push e PR:
  1. API: restore → build → **testes**
  2. Front: `npm ci` → lint → build
  3. Docker: `docker build` da imagem
  4. **Deploy** (só na `main` e só se os 3 passarem): chama os *Deploy Hooks* do Render. Também roda pelo botão **Run workflow** (aba Actions), útil para republicar sem precisar de commit.
- **Render Blueprint** (`render.yaml`): cria a API (Docker) e o front (site estático) com o auto-deploy do Render **desligado**. Quem manda publicar é o Actions, depois dos testes. Código que quebra teste **nunca** chega à produção.
- **Região:** Render e Neon ficam juntos em US East (Virgínia). O Render não tem região no Brasil. Com o banco em São Paulo e a API nos EUA, cada consulta cruzaria o continente.

O primeiro push já passou nos 4 jobs, inclusive no build da imagem Docker.

---

## Etapa 5 — Front-end (React + Vite)

```
frontend/src/
├─ api/client.js       fetch + token + tradução de erros (ProblemDetails)
├─ auth/               AuthProvider (token no localStorage), useAuth, RotaProtegida
├─ components/         Topo, Rodape, Hero, Campo, CamposLoja, Estados (carregando/erro/vazio)
├─ lib/                formatação (preço, telefone, CNPJ), regras dos uniformes, useApi
├─ pages/              Inicio, Lojas, Loja, Doacoes, Sobre, Login, Cadastro,
│                      Gerenciamento, MinhasRoupas, EditarLoja
└─ styles/             base.css (tokens: cores e fontes) + components.css
```

**Decisões:**
- **Mesma identidade do TCC:** verde `#00420c`/`#2F9E42`, Poppins, foto do campus com cartão branco. Seguimos a skill `frontend-design` (a mesma convenção do projeto BroTime): o briefing manda, então mantivemos a identidade e investimos o "elemento marcante" na **grade de quadrados da logo do Ifes**, que vira marcador das listas e o indicador de carregamento.
- **Página da loja melhorada:** o original repetia a mesma foto em cada tamanho. Agora há uma foto por grupo (ex.: camisa padrão masculina) com a **grade de tamanhos e preços**, que facilita comparar.
- **Regra do `script.js` antigo mantida:** calça → tamanho numérico e sem modelo; camisa → modelo obrigatório. O back-end valida de novo, porque o front pode ser burlado.
- **"Alterar dados da loja"**, que era só um botão sem função no PHP, agora funciona.
- **Aviso de "servidor acordando":** no plano gratuito, a API do Render dorme depois de 15 min sem uso e leva até ~1 min para voltar. A tela avisa isso em vez de parecer travada.
- **Imagens em WebP:** de ~10 MB para ~420 KB no total.
- **Acessibilidade:** rótulos visíveis nos campos (o original só tinha placeholder), foco visível, link "pular para o conteúdo" e `prefers-reduced-motion`.

---

## Etapa 6 — Teste ponta a ponta local

Sem Docker (o WSL ainda não estava instalado), subimos um Postgres 17 temporário com o pacote `embedded-postgres`, fora do repositório.

- A API aplicou a migration no Postgres real e o seed criou 5 lojas.
- Testamos com `curl`: login, criar uniforme, **403** em uniforme de outra loja, **401** sem token e acentos em UTF-8 ("Caparaó").
- No navegador (Chrome): home, página da loja, login com máscara de CNPJ, CRUD de roupas (calça 44 adicionada) e console sem erros.

---

## Etapa 7 — Primeiro deploy (Neon + Render)

O grupo criou o projeto no Neon e aplicou o Blueprint no Render. Verificação feita pela IA com `curl`:

| Verificação | Resultado |
|---|---|
| `GET /health` | 200 `Healthy` |
| `GET /api/lojas` sem token | 200: lojas do seed vindas do **Neon** (a migration rodou na subida) |
| Swagger em produção | 200 |
| Front e rota `/lojas` (rewrite da SPA) | 200 |
| Login demo → JWT → `GET /api/lojas/me` | 200 com token, 401 sem token |
| **CORS** a partir do site | ❌ sem `Access-Control-Allow-Origin` |
| **URL da API dentro do JS do front** | ❌ `https://ifes-modas-api` (nome interno) |

**Causa:** no Blueprint, `fromService.property: host` devolve o hostname **interno** da rede privada do Render, não o `.onrender.com`. **Correção:** URLs públicas fixas no `render.yaml`. O `VITE_API_URL` é lido no build, então o front precisa de um novo deploy.

### Deploy automático ligado (30/10)

1. Variáveis corrigidas no Render: CORS passou a liberar `https://ifes-modas.onrender.com` e o JS do front passou a apontar para `https://ifes-modas-api.onrender.com`.
2. O grupo copiou o **Deploy Hook** de cada serviço do Render e criou os secrets `RENDER_DEPLOY_HOOK_API` e `RENDER_DEPLOY_HOOK_FRONT` no GitHub.
3. O job de deploy passou a rodar também pelo botão **Run workflow**, para republicar sem commit.
4. Primeira execução com os secrets: os 4 jobs ficaram verdes e o log mostrou "Deploy da API solicitado." e "Deploy do front solicitado.". Depois do deploy, `/health`, `/api/lojas`, Swagger, 401 sem token, CORS, site e `/lojas` responderam corretamente.

A partir daqui, todo push na `main` com testes verdes publica a API e o front sozinho.

---

**Falso alarme investigado (Etapa 6):** na primeira subida apareceu `fail: Failed executing DbCommand ... FROM "__EFMigrationsHistory"`. É o EF tentando ler o histórico antes de criar a tabela, num banco vazio; só acontece no primeiro boot. Não exigiu correção.

---

## Etapa 8 — Novo layout

A primeira versão do front copiava o visual do TCC. Agora o grupo pediu um layout novo, mais moderno e fácil de usar, em todas as páginas.

**Identidade visual**
- Cores da logo do Ifes: o verde em detalhes, um verde-escuro ("mata") para títulos e faixas, e o vermelho só para marcar a página atual, erros e exclusão.
- Uma única fonte, **Archivo**: títulos na largura condensada (como etiqueta de roupa) e texto na largura normal.
- Elemento próprio: a **etiqueta**, com borda de pesponto tracejado, usada em tamanhos, filtros e preços (`.etiqueta` em `base.css`).

**O que mudou para quem compra**
- **Início:** o primeiro bloco é uma busca: escolher a peça (camisa padrão, agropecuária, bermuda ou calça) e o tamanho leva direto às lojas que têm.
- **Lojas:** filtros por peça, tamanho e cidade, busca por nome, bairro ou cidade, e o preço de cada loja; com uma peça escolhida, a lista vem do menor para o maior preço. Os filtros ficam na URL (`/lojas?peca=bermuda&tamanho=G`), então dá para compartilhar o link.
- **Página da loja:** botões de WhatsApp, ligar e "Como chegar" (Google Maps). Cada tamanho é uma etiqueta que abre o WhatsApp com a mensagem pronta: *"Vi no Ifes Modas: Camisa padrão masculina, tamanho M, por R$ 40,00. Ainda tem?"*.
- **Doações:** dois caminhos (doar e receber) em passos, contato com o campus e perguntas frequentes.
- **Sobre:** história das duas versões, o dado da pesquisa do TCC e a equipe.

**O que mudou para a loja**
- **Cadastro em 3 etapas** (loja, endereço, acesso), com conferência antes de avançar e foco no primeiro campo errado. Se a API recusar algum campo, o formulário volta à etapa dele.
- **Área da loja** com menu lateral (abas no celular): visão geral com o que falta preencher e o resumo do catálogo, roupas e dados da loja.
- **Roupas:** um painel lateral para adicionar **vários tamanhos de uma vez** com o mesmo preço. Tamanhos já cadastrados aparecem riscados, o que evita item repetido.
- Mostrar/ocultar senha, e uma barra fixa para salvar os dados da loja.

**Decisão técnica:** a listagem da API (RF03) traz só nome e bairro. Para mostrar preços na página de lojas, o front busca a página de cada loja em paralelo (`useLojasComCatalogo.js`). Com poucas lojas isso é rápido. Se o número crescer, o caminho é um endpoint de busca na API.

**Como testamos:** API e Postgres locais (sem tocar no banco de produção) e todas as telas no Chrome, no computador e num iframe de 390px simulando o celular: busca, filtros, WhatsApp com mensagem pronta, login, cadastro completo, adicionar 3 tamanhos de uma vez, editar, excluir e alterar dados. Lint e build sem avisos.

---

## Etapa 9 — Branch `Dev` e ambiente de teste

Até aqui, todo push ia direto para a `main`, e a `main` publica em produção. Para mudanças maiores, como o layout novo, o grupo quis **ver o resultado no ar antes** de mexer no site oficial.

- **Branch `Dev`:** onde o trabalho acontece. O layout novo foi o primeiro commit dela.
- **Ambiente de teste completo**, separado da produção:
  - **Banco:** uma *branch* do Neon chamada `dev`. É uma cópia do banco de produção no momento da criação, mas o que se grava nela não volta para a produção.
  - **Render:** um segundo Blueprint (`render.dev.yaml`) com `ifes-modas-api-dev` e `ifes-modas-dev`, os dois apontando para a branch `Dev`. A chave JWT é outra, então um token do teste não vale na produção.
- **CI/CD:** o mesmo workflow roda na `Dev` (testes, lint, Docker) e, se tudo passar, chama os hooks de teste (`*_DEV`). A expressão que escolhe o hook só devolve o hook de produção quando a branch é `main`. Assim, um push na `Dev` nunca publica em produção.
- **Para ir para produção:** Pull Request da `Dev` para a `main`. O CI roda de novo no PR e o merge dispara o deploy oficial.

