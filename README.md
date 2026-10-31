# Ifes Modas API
**Nicho:** IFES MODAS - Site de Direcionamento e Compra de Uniformes Escolares · **Aluno:** Eduardo Castro Fernandes (@odraudecf)
**API no ar:** https://ifes-modas-api.onrender.com/swagger
**Saúde e versão:** https://ifes-modas-api.onrender.com/health · _(a rota `/api/versao` ainda não existe)_
**Front-end:** https://ifes-modas.onrender.com

[![CI/CD](https://github.com/odraudecf/ifes-modas/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/odraudecf/ifes-modas/actions/workflows/ci-cd.yml)

> **Primeira visita lenta?** No plano gratuito do Render a API "dorme" depois de 15 minutos sem uso e leva até ~1 minuto para acordar. O site avisa enquanto isso.

## O que a API faz

Vitrine das lojas que vendem os **uniformes do Ifes Campus de Alegre**. O aluno (sem login) vê as lojas por estado e cidade, os tamanhos e preços de cada peça (camisa padrão, camisa agropecuária, bermuda e calça) e o contato da loja. As **lojas** se cadastram pelo CNPJ (a API busca nome, telefone e endereço na Receita) e cuidam do próprio catálogo. O **administrador** altera qualquer loja e o catálogo dela, vê um painel com os números do sistema e cria usuários.

É a recriação do nosso TCC de 2024 (PHP + MySQL), com os bugs de segurança do original corrigidos (senhas em texto puro, login pela URL, SQL injection).

**Regras que devolvem 409:**
- **CNPJ repetido:** uma loja não se cadastra duas vezes (`POST /api/auth/cadastro` e `POST /api/admin/usuarios/lojas`).
- **Usuário de administrador repetido**, sem diferenciar maiúsculas (`POST /api/admin/usuarios/admins` e `PUT /api/admin/conta`).

Outras regras: a loja só altera os **próprios** uniformes (403 nos de outra loja); camisa tem tamanho PP–XGG e modelo; calça tem número de 30 a 60 e não tem modelo; o admin no primeiro acesso é obrigado a trocar usuário e senha (403 no resto até trocar); em produção o CNPJ é obrigatório.

## Recursos e endpoints

Erros em **ProblemDetails** (RFC 9457), em português. "Loja" e "admin" são os papéis gravados no JWT (`role`); um token de um papel recebe 403 nas rotas do outro.

| Verbo | Rota | Quem pode | Respostas |
|---|---|---|---|
| POST | /api/auth/cadastro | todos | 201, 400, 409, 429 |
| POST | /api/auth/login (CNPJ da loja **ou** usuário do admin) | todos | 200, 400, 401, 429 |
| GET | /api/auth/regras | todos | 200 |
| GET | /api/cnpj/{cnpj} | todos | 200, 400, 404, 429, 503 |
| GET | /api/lojas?uf= | todos | 200 |
| GET | /api/lojas/{id} | todos | 200, 404 |
| GET | /api/lojas/me | loja | 200, 401, 403 |
| PUT | /api/lojas/me | loja | 200, 400, 401, 403 |
| GET | /api/uniformes/minhas | loja | 200, 401, 403 |
| POST | /api/uniformes | loja | 201, 400, 401, 403 |
| PUT | /api/uniformes/{id} | loja dona do item | 200, 400, 401, 403, 404 |
| DELETE | /api/uniformes/{id} | loja dona do item | 204, 401, 403, 404 |
| GET | /api/admin/painel | admin | 200, 401, 403 |
| GET | /api/admin/lojas?busca= | admin | 200, 401, 403 |
| GET | /api/admin/lojas/{id} | admin | 200, 401, 403, 404 |
| PUT | /api/admin/lojas/{id} | admin | 200, 400, 401, 403, 404 |
| POST | /api/admin/lojas/{id}/uniformes | admin | 201, 400, 401, 403, 404 |
| PUT | /api/admin/lojas/{id}/uniformes/{uniformeId} | admin | 200, 400, 401, 403, 404 |
| DELETE | /api/admin/lojas/{id}/uniformes/{uniformeId} | admin | 204, 401, 403, 404 |
| GET | /api/admin/usuarios | admin | 200, 401, 403 |
| POST | /api/admin/usuarios/admins | admin | 201, 400, 401, 403, 409 |
| POST | /api/admin/usuarios/lojas | admin | 201, 400, 401, 403, 409 |
| GET | /api/admin/conta | admin (mesmo com a troca pendente) | 200, 401, 403 |
| PUT | /api/admin/conta | admin (mesmo com a troca pendente) | 200, 400, 401, 403, 409 |
| GET | /health | todos | 200 |

**Testar pelo Swagger:** `POST /api/auth/login` com uma conta abaixo → copie o `token` → botão **Authorize** → cole o token.

## Rotas para o corretor testar (sem token)
- Listagem (agrupada por estado e cidade; não é paginada): https://ifes-modas-api.onrender.com/api/lojas
- Filtro que encontra algo: https://ifes-modas-api.onrender.com/api/lojas?uf=ES · sem resultado (200 com lista vazia): https://ifes-modas-api.onrender.com/api/lojas?uf=AC
- Detalhe: https://ifes-modas-api.onrender.com/api/lojas/1 · inexistente (404): https://ifes-modas-api.onrender.com/api/lojas/9999
- Protegida (401 sem token): https://ifes-modas-api.onrender.com/api/uniformes/minhas
- Protegida do admin (401 sem token): https://ifes-modas-api.onrender.com/api/admin/painel

## Contas de teste (fictícias)
- admin: `corretor` / `ifes2026` (conta de teste: entra direto na administração, sem troca obrigatória)
- O admin de primeiro acesso (`Admin` / `123`) existe só para o grupo assumir o sistema: ele é obrigado a trocar usuário e senha logo no primeiro login, por isso não serve como conta de teste.
- loja A: CNPJ `20.240.101/0001-47` / `ifes2024` (Malharia Caparaó) · loja B: CNPJ `20.240.202/0001-18` / `ifes2024` (Uniformes Guararema)

As lojas e os catálogos do seed são inventados. **Atenção:** os números de CNPJ do seed têm dígito verificador válido e, ao consultar a Receita, descobrimos que existem (ver erro nº 13 em `docs/REGISTRO_IA.md`); trocá-los está pendente.

## Banco de dados

PostgreSQL no Neon, com EF Core 10 + Npgsql, nomes em `snake_case`. Migrations versionadas em `backend/src/IfesModas.Api/Data/Migrations` (`Inicial` e `Administradores`), aplicadas sozinhas quando a API sobe. O seed (`DbSeeder.cs`) só roda com o banco vazio.

| Entidade | Principais campos |
|---|---|
| **Loja** | `cnpj` (único, 14 caracteres, aceita o CNPJ alfanumérico), `nome`, `telefone`, `instagram`, `facebook`, `senha_hash` (BCrypt), `criado_em` |
| **Endereco** (1 para 1 com Loja) | `rua`, `numero`, `bairro`, `cidade`, `uf` (só as 27 siglas reais) |
| **Uniforme** | `tipo` (Camisa, Bermuda, Calca), `modelo` (Padrao, Agropecuaria; só camisa), `genero`, `tamanho`, `preco`, `loja_id` |
| **Administrador** | `usuario` (único), `senha_hash` (BCrypt), `deve_trocar_acesso`, `criado_em` |

**Relação 1 para N:** uma **Loja** tem muitos **Uniformes** (`uniformes.loja_id`, exclusão em cascata).

**Onde está a regra do 409:** CNPJ repetido em `AuthService.CriarLojaAsync` (com índice único em `lojas.cnpj` no banco); usuário de admin repetido em `AdminService.GarantirUsuarioLivreAsync` (índice único em `administradores.usuario`).

## Como rodar no computador

**Variáveis de ambiente da API** (os valores ficam fora do repositório):

| Variável | Para quê |
|---|---|
| `ConnectionStrings__Default` | String de conexão do Postgres (aceita a URL do Neon) |
| `Jwt__Key` | Chave do JWT, com pelo menos 32 caracteres |
| `Cors__Origins` | Endereço do front liberado no CORS |
| `Cadastro__ExigirCnpj` | Opcional (padrão `true`); `false` só no ambiente de teste |
| `RateLimit__AuthPorMinuto` | Opcional (padrão 10) |

```bash
# API (precisa de um Postgres; pode ser uma branch do Neon)
cd backend
dotnet tool install --global dotnet-ef                         # uma vez
dotnet ef database update --project src/IfesModas.Api           # opcional: a API também aplica as migrations ao subir
dotnet run --project src/IfesModas.Api --launch-profile http    # http://localhost:5112/swagger
dotnet test                                                     # 91 testes (unitários + integração)

# Front
cd ../frontend
cp .env.example .env.local                                      # VITE_API_URL=http://localhost:5112
npm install && npm run dev                                      # http://localhost:5173
```

Alternativa com Docker: `docker compose up --build` sobe Postgres + API em http://localhost:8080/swagger.

**Publicação:** cada push na `main` roda o GitHub Actions (testes xUnit, lint e build do front, build da imagem Docker) e, com tudo verde, dispara o deploy no Render pelos Deploy Hooks. A branch `Dev` faz o mesmo para um ambiente de teste separado, com outro banco e outra chave JWT: https://ifes-modas-dev.onrender.com

## Front-end

React 19 + Vite 8 + React Router, na pasta `frontend/`, publicado como Static Site no Render e consumindo a API publicada (`VITE_API_URL`).

- **Público:** início com busca por peça e tamanho; lojas com filtros por peça, tamanho e cidade, busca por texto e preço de cada loja; página da loja com WhatsApp por tamanho (mensagem pronta) e "Como chegar"; doações; sobre (equipe de cada versão).
- **Loja:** cadastro em 3 etapas a partir do CNPJ; login; visão geral; roupas (vários tamanhos de uma vez, editar, excluir); dados da loja.
- **Admin:** entra pela mesma tela de login com o usuário; painel com gráficos; lojas (alterar dados e catálogo de qualquer loja); usuários (listar e criar loja ou admin); minha conta (troca obrigatória no primeiro acesso).
- As mensagens de erro da API (ProblemDetails) aparecem na tela, inclusive por campo.

**CORS:** a API libera só a origem do front, pela variável **`Cors__Origins`** (no Render: `https://ifes-modas.onrender.com`). O nome está em inglês, e não `Cors__Origens`.

## Como usei a IA
- **IA usada:** Claude Code (Anthropic), no terminal, com acesso ao repositório, ao navegador (Claude in Chrome) e às skills de frontend design e dataviz.
- **Os 3 pedidos (prompts) que mais ajudaram:**
  1. *"Nesse diretório há arquivos de documentação e códigos de um projeto antigo que fiz com amigos. Utilize o código, a documentação e as imagens como base para que possamos recriar o sistema"*, seguido da stack obrigatória do trabalho.
  2. *"Ao cadastrar um CNPJ, ele acessa APIs de CNPJ para resgatar o restante das informações. Para teste, permita não colocar um CNPJ, mas em produção, sempre precisa de ter um CNPJ."*
  3. *"Crie o papel de admin. Permita ao admin fazer alterações nas lojas e nos seus itens. Crie uma aba de dashboards para o admin"*, com primeiro acesso `Admin`/`123` e troca de usuário e senha.
- **Um erro da IA que percebi e como corrigi:** no `render.yaml`, a IA usou `fromService` com `property: host` para preencher `Cors__Origins` e `VITE_API_URL`, achando que daria o endereço público. Isso devolve o **nome interno** do serviço (`ifes-modas-api`): o front chamava `https://ifes-modas-api` e o CORS liberava `https://ifes-modas`. Todos os testes passavam, e o erro só apareceu na verificação em produção (o preflight voltou sem `Access-Control-Allow-Origin`). A correção trocou o trecho por URLs públicas fixas (`value: https://ifes-modas.onrender.com` e `value: https://ifes-modas-api.onrender.com`). Os outros erros estão em [`docs/REGISTRO_IA.md`](docs/REGISTRO_IA.md).
- **O prompt usado para gerar o front:** o mesmo pedido inicial (recriar o sistema "no front React + Vite", a partir das telas do TCC). Depois, o layout foi refeito com *"Modernize o site, utilize layouts melhores, mais intuitivos. Melhore todas as páginas: a exibição de lojas, informação de doação, cadastro, tudo."*
- **O que aprendi:** teste automático não substitui conferir o sistema no ar (o erro do CORS passou por todos os testes); um teste só prova algo se falhar quando a regra é quebrada (por isso fizemos testes de mutação); a autorização tem que estar na API, não só na tela; e uma resposta da IA precisa ser conferida, inclusive os dados "de exemplo" que ela cria (os CNPJs "fictícios" eram reais).

Detalhes de cada etapa em [`docs/DIARIO_DE_DESENVOLVIMENTO.md`](docs/DIARIO_DE_DESENVOLVIMENTO.md).