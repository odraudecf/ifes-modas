# Ifes Modas 2.0

[![CI/CD](https://github.com/odraudecf/ifes-modas/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/odraudecf/ifes-modas/actions/workflows/ci-cd.yml)

Vitrine das lojas que vendem os **uniformes do Ifes Campus de Alegre**. O aluno vê as lojas por estado e cidade, os tamanhos e preços de cada peça e o contato da loja. As lojas parceiras se cadastram e cuidam do próprio catálogo.

É a recriação do nosso TCC de 2024 (PHP + MySQL) na stack exigida pelo trabalho, com os bugs de segurança do original corrigidos.

| | Link |
|---|---|
| **Site** | https://ifes-modas.onrender.com |
| **API (Swagger)** | https://ifes-modas-api.onrender.com/swagger |
| **Health check** | https://ifes-modas-api.onrender.com/health |
| **Ambiente de teste** (branch `Dev`) | https://ifes-modas-dev.onrender.com · API: https://ifes-modas-api-dev.onrender.com/swagger |

> **Primeira visita lenta?** No plano gratuito do Render a API "dorme" depois de 15 minutos sem uso e leva até ~1 minuto para acordar. O site avisa enquanto isso.

**Login de demonstração:** CNPJ `20.240.101/0001-47`, senha `ifes2024` (loja fictícia "Malharia Caparaó").

---

## Stack

| Camada | Tecnologia |
|---|---|
| API | **.NET 10** · ASP.NET Core Web API (controllers) |
| Banco | **PostgreSQL** no **Neon** · **EF Core 10** + **Npgsql** 10 (migrations, snake_case) |
| Segurança | **JWT** (HMAC-SHA256) · **BCrypt** para senhas · rate limit no login · CORS restrito |
| Documentação da API | **Swashbuckle** 10 (Swagger UI com botão *Authorize*) |
| Testes | **xUnit** · `WebApplicationFactory` (testes de integração com a API real) |
| Front | **React 19** + **Vite 8** · React Router · ícones Lucide |
| Entrega | **Docker** (multi-stage) · **GitHub Actions** · **Render** (API em Docker + site estático) |

## O que mudou em relação ao sistema antigo

| Sistema antigo (PHP) | Agora |
|---|---|
| SQL montado concatenando texto → **SQL injection** | EF Core com consultas parametrizadas |
| "Sessão" na URL (`?cnpj=...`): editando a URL você virava outra loja | **JWT** assinado + checagem de dono (403) |
| `Preço decimal(3,2)`: máximo **R$ 9,99** | `numeric(10,2)` |
| "BH" oferecido como estado | Só as 27 UFs reais |
| Login com `if ($result > 0)`, sempre verdadeiro | Login correto, mensagem genérica, BCrypt |
| Lista de lojas com 3 blocos copiados (só o ES funcionava) | Um endpoint agrupado Estado → Cidade → Lojas |
| CRUD de roupas e página da loja eram **HTML fixo** | CRUD real e página da loja vindos do banco |
| "Alterar dados da loja" sem implementação | `PUT /api/lojas/me` + tela |
| CNPJ sem validação | Dígitos verificadores, **incluindo o CNPJ alfanumérico** (Receita, 2026) |

## Requisitos atendidos

| RF | Descrição | Onde |
|---|---|---|
| RF01 | Cadastro da loja | `POST /api/auth/cadastro` · tela Cadastro |
| RF02 | Login da loja | `POST /api/auth/login` · tela Login |
| RF03 | Listar lojas por estado e município | `GET /api/lojas` · tela Lojas |
| RF04 | Encaminhar para doações | tela Doações |
| RF05 | Adicionar item | `POST /api/uniformes` · tela Roupas |
| RF06 | Alterar item | `PUT /api/uniformes/{id}` · tela Roupas |
| RF07 | Excluir item | `DELETE /api/uniformes/{id}` · tela Roupas |
| RF08 | Ver informações da loja | `GET /api/lojas/{id}` · página da loja |
| RF09 | Ver itens da loja | `GET /api/lojas/{id}` · página da loja |

## API

As rotas de consulta são **públicas** (funcionam sem token). As de gerenciamento exigem `Authorization: Bearer <token>`.

| Método | Rota | Token | O que faz |
|---|---|---|---|
| POST | `/api/auth/cadastro` | — | Cadastra a loja e devolve o token |
| POST | `/api/auth/login` | — | Login com CNPJ e senha |
| GET | `/api/lojas?uf=ES` | — | Lojas agrupadas por estado e cidade (filtro opcional) |
| GET | `/api/lojas/{id}` | — | Dados, endereço, contatos e catálogo da loja |
| GET | `/api/lojas/me` | ✔ | Dados da loja logada |
| PUT | `/api/lojas/me` | ✔ | Altera nome, contato, redes e endereço |
| GET | `/api/uniformes/minhas` | ✔ | Catálogo da loja logada |
| POST | `/api/uniformes` | ✔ | Adiciona uniforme |
| PUT | `/api/uniformes/{id}` | ✔ dono | Altera (403 se for de outra loja) |
| DELETE | `/api/uniformes/{id}` | ✔ dono | Exclui (403 se for de outra loja) |
| GET | `/health` | — | Health check do Render |

**Testar pelo Swagger:** abra `/swagger` → `POST /api/auth/login` com o login de demonstração → copie o `token` → botão **Authorize** → cole o token.

Erros seguem o padrão **ProblemDetails** (RFC 9457), em português:

```json
{ "status": 403, "title": "Este uniforme pertence a outra loja." }
```

## Como rodar localmente

**Opção 1: Docker (tudo de uma vez)**

```bash
docker compose up --build          # Postgres + API em http://localhost:8080/swagger
cd frontend && cp .env.example .env.local
# troque VITE_API_URL para http://localhost:8080
npm install && npm run dev         # http://localhost:5173
```

**Opção 2: sem Docker** (precisa de um Postgres; pode ser um branch `dev` do Neon)

```bash
cd backend
dotnet user-secrets set "ConnectionStrings:Default" "<sua string de conexão>" --project src/IfesModas.Api
dotnet run --project src/IfesModas.Api --launch-profile http     # http://localhost:5112/swagger

cd ../frontend
npm install && npm run dev                                       # http://localhost:5173
```

As migrations e os dados de demonstração são aplicados sozinhos quando a API sobe.

**Testes**

```bash
cd backend && dotnet test        # 63 testes (unitários + integração)
cd frontend && npm run lint && npm run build
```

## Branches e ambientes

| Branch | Para quê | Publica em | Banco (Neon) | Blueprint |
|---|---|---|---|---|
| `main` | Versão oficial, a que o professor avalia | **Produção**: ifes-modas.onrender.com | branch `main` | `render.yaml` |
| `Dev` | Mudanças em andamento, para o grupo testar antes | **Teste**: ifes-modas-dev.onrender.com | branch `dev` (cópia isolada) | `render.dev.yaml` |

Fluxo: trabalhar na `Dev` → push → conferir no ambiente de teste → **Pull Request da `Dev` para a `main`** → o merge publica em produção.
O teste usa outro banco e outra chave JWT: cadastrar, editar ou excluir no teste não mexe em nada da produção.

## CI/CD: cada push na `main` (ou na `Dev`) publica sozinho

```
push na main ─► GitHub Actions
                ├─ API: build + 63 testes xUnit
                ├─ Front: lint + build
                └─ Docker: build da imagem
                        │ todos verdes?
                        ▼
                deploy: Deploy Hooks do Render ─► API (Docker) e Front (estático) no ar
```

Na `Dev` é igual, mas o deploy usa os hooks do ambiente de teste (`RENDER_DEPLOY_HOOK_API_DEV` e `RENDER_DEPLOY_HOOK_FRONT_DEV`). Cada branch só enxerga os hooks do próprio ambiente.

O auto-deploy do próprio Render fica **desligado** (`render.yaml`). Quem manda publicar é o Actions, depois dos testes. Código que quebra teste não chega à produção.

### Configuração da produção (feita uma vez)

1. **Neon:** criar o projeto na região *AWS US East 1 (N. Virginia)* e copiar a connection string.
2. **Render:** New → **Blueprint** → este repositório. Preencher `ConnectionStrings__Default` com a string do Neon (a `Jwt__Key` o Render gera sozinho).
3. Em cada serviço do Render: Settings → **Deploy Hook** → copiar a URL.
4. **GitHub** → Settings → Secrets and variables → Actions: criar `RENDER_DEPLOY_HOOK_API` e `RENDER_DEPLOY_HOOK_FRONT`.

### Configuração do ambiente de teste (feita uma vez)

1. **Neon:** no projeto, Branches → **Create branch** `dev` a partir da `main` e copiar a connection string dessa branch.
2. **Render:** New → **Blueprint** → este repositório, branch **`Dev`**, Blueprint Path **`render.dev.yaml`**. Preencher `ConnectionStrings__Default` com a string da branch `dev`.
3. Em cada serviço de teste (`ifes-modas-api-dev` e `ifes-modas-dev`): Settings → **Deploy Hook** → copiar a URL.
4. **GitHub** → Secrets: criar `RENDER_DEPLOY_HOOK_API_DEV` e `RENDER_DEPLOY_HOOK_FRONT_DEV`.

## Estrutura

```
backend/
  src/IfesModas.Api/      Domain · Data · Dtos · Services · Controllers · Errors · Program.cs
  tests/IfesModas.Tests/  Unit · Integration
  Dockerfile
frontend/
  src/                    api · auth · components · lib · pages · styles
docs/                     diário, registro de IA, arquitetura e roteiro do seminário
.github/workflows/        ci-cd.yml
render.yaml               Blueprint do Render
docker-compose.yml        ambiente local
```

## Uso de IA

O desenvolvimento usou o **Claude Code** (Anthropic) para análise do sistema antigo, planejamento, geração de código, testes, infraestrutura e documentação. Todo o código foi revisado, testado (63 testes, mais um teste de mutação) e verificado manualmente com Postgres real e no navegador.

O registro completo, com a linha do tempo, os **erros que a IA cometeu e como os pegamos**, está em [`docs/REGISTRO_IA.md`](docs/REGISTRO_IA.md). As decisões técnicas, etapa por etapa, estão em [`docs/DIARIO_DE_DESENVOLVIMENTO.md`](docs/DIARIO_DE_DESENVOLVIMENTO.md).

## Equipe (TCC original, Ifes Campus de Alegre, 2022–2024)

Davi Rodrigues Cunha · Eduardo Borges Cordeiro · Eduardo Castro Fernandes · Pedro Falleiro Mendes · Pedro Silva e Souza · Rafael José Abdalla Tiradentes Laurindo

Orientador do TCC: Prof. Athus Cavalini
