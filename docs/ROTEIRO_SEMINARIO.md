# Roteiro do seminário (Parte 2, só o back-end)

10 minutos de apresentação com demonstração ao vivo no Swagger da API publicada, e até 5 minutos de arguição sobre o código da API. O front não é apresentado.

- **API:** https://ifes-modas-api.onrender.com/swagger
- **Versão no ar:** https://ifes-modas-api.onrender.com/api/versao (o `commit` tem que ser igual ao último commit da `main` no GitHub)

## Antes de começar (10 minutos antes)

1. **Acordar a API:** abra o `/swagger` e o `/api/versao`. No plano gratuito do Render, a primeira requisição pode levar cerca de 1 minuto.
2. Confira se o `commit` do `/api/versao` é igual ao último commit da `main` (página inicial do repositório no GitHub).
3. Deixe abertas, nesta ordem: **slides (PDF)**, **Swagger**, **GitHub** (repositório + aba Actions com um run verde) e o **VS Code** com estes arquivos:
   `Program.cs`, `Controllers/UniformesController.cs`, `Dtos/UniformeDtos.cs`, `Domain/RegrasUniforme.cs`, `Services/UniformeService.cs`, `Services/AuthService.cs`, `Data/AppDbContext.cs`, `Errors/ApiExceptionHandler.cs`, `.github/workflows/ci-cd.yml`, `render.yaml`, `tests/.../AuthTests.cs`, `tests/.../UniformesTests.cs`.
4. Os JSONs abaixo ficam num bloco de notas, prontos para copiar.
5. Atenção ao **limite de 10 logins/cadastros por minuto** por IP (429). A demonstração usa só 2.

## Tempo × slide

| Tempo | Slide | O que falar |
|---|---|---|
| 0:00–0:15 | 1. Capa | Nome, projeto, a URL que vai abrir ao vivo |
| 0:15–1:00 | 2. Nicho e problema | 70% dos alunos sem informação para comprar o uniforme; aluno, loja e admin; as regras (409 e 403) |
| 1:00–1:15 | 3. Endpoints | "Este é o mapa do que vou mostrar." Verde = uniforme, a entidade principal |
| 1:15–5:00 | 4. Demonstração → **Swagger** | Os 8 passos abaixo |
| 5:00–5:40 | 5. Banco de dados | Loja 1:N Uniforme (FK `loja_id`, cascata); Endereco 1:1; Loja e Administrador são os usuários, cada um com seu papel |
| 5:40–7:20 | 6. Arquitetura → **VS Code** | O caminho de um `DELETE` (ver abaixo); depois o `ci-cd.yml` e a aba Actions |
| 7:20–8:00 | 7. Regra do 409 | O negócio proíbe, o `if` no `AuthService`, o índice único, o teste e a mutação |
| 8:00–8:40 | 8. O teste que pegou um bug | "RUA A" → "Rua a"; mutação da checagem do dono |
| 8:40–9:20 | 9. IA e aprendizados | O pedido do CNPJ; o erro do `render.yaml`/CORS; as lições |
| 9:20–10:00 | 10. Fechamento | 3 aprendizados e 3 próximos passos; "Perguntas?" |

## Demonstração ao vivo (os 8 itens que o professor marca)

### 1. Abre pela URL da Render
Abra `https://ifes-modas-api.onrender.com/swagger`. Em outra aba, `GET /api/versao` → mostre o `commitCurto` e compare com o último commit da `main` no GitHub.

### 2. Login + Authorize
`POST /api/auth/login`:
```json
{ "cnpj": "20.240.101/0001-47", "senha": "ifes2024" }
```
Copie o `token` (sem aspas) → botão **Authorize** → cole → Authorize → Close. Fale: "o token diz quem é a loja (claim `sub`) e o papel (`role: loja`), assinado com a chave do servidor".

### 3. Cria um uniforme: 201 + Location
`POST /api/uniformes`:
```json
{ "tipo": "Calca", "modelo": null, "genero": "Masculino", "tamanho": "46", "preco": 69.90 }
```
Mostre o **201** e, em *Response headers*, `location: https://ifes-modas-api.onrender.com/api/uniformes/{id}`. **Anote o id.**

### 4. Aparece na listagem pública paginada e no detalhe (sem token)
Para provar que é **sem token**, abra numa aba nova do navegador (ela não tem o token):
- `https://ifes-modas-api.onrender.com/api/uniformes?pagina=1&porPagina=5` → o item novo é o primeiro (mais recentes primeiro). Mostre `pagina`, `porPagina`, `total` e `totalPaginas`.
- `https://ifes-modas-api.onrender.com/api/uniformes/{id}` → o detalhe, com a loja que vende.

### 5. Edita (200) e exclui (204)
`PUT /api/uniformes/{id}`:
```json
{ "tipo": "Calca", "modelo": null, "genero": "Masculino", "tamanho": "46", "preco": 74.90 }
```
→ **200** com o preço novo. Depois `DELETE /api/uniformes/{id}` → **204**. Recarregue o detalhe na outra aba → **404**.

### 6. Provoca o 409: CNPJ já cadastrado
`POST /api/auth/cadastro` (o CNPJ é o da loja A, que já existe):
```json
{
  "nome": "Loja Repetida",
  "telefone": "(28) 99999-0000",
  "instagram": null,
  "facebook": null,
  "cnpj": "20.240.101/0001-47",
  "senha": "ifes2024",
  "confirmarSenha": "ifes2024",
  "endereco": { "rua": "Rua A", "numero": "10", "bairro": "Centro", "cidade": "Alegre", "uf": "ES" }
}
```
→ **409** com o ProblemDetails `"title": "Já existe uma loja cadastrada com este CNPJ."`

### 7. Provoca o 400: dados inválidos
`POST /api/uniformes` (ainda com o token da loja A):
```json
{ "tipo": "Calca", "modelo": "Padrao", "genero": "Masculino", "tamanho": "M", "preco": -5 }
```
→ **400** com o ValidationProblemDetails e três campos em `errors`: `tamanho` (calça é número de 30 a 60), `modelo` (só camisa tem modelo) e `preco`.
Alternativa rápida: `GET /api/uniformes?porPagina=500` → 400 no campo `porPagina`.

### 8. Prova de autorização (IDOR): 403 e 401
1. Ache um item **da loja B** (Uniformes Guararema, id 2): `GET /api/uniformes?lojaId=2&porPagina=1` → anote o `id`.
2. **Fale:** "agora sou um atacante: estou logado como loja A e troco o id na URL pelo de um item da loja B".
3. `DELETE /api/uniformes/{id da loja B}` → **403** `"Este uniforme pertence a outra loja."` (o `PUT` dá o mesmo).
4. **Authorize → Logout** e repita o `DELETE` → **401** `"Faça login para continuar."`
5. Bônus: com o token da loja, `GET /api/admin/painel` → **403** (a rota é do papel admin).
6. Mostre no VS Code: `UniformeService.BuscarDaLojaAsync`, a linha `if (uniforme.LojaId != lojaId)`.

## O caminho de uma requisição no código (slide 6)

Exemplo: o `DELETE /api/uniformes/{id}` do passo 8.

1. **`Program.cs`** → `UseAuthentication()`: o JwtBearer confere assinatura, emissor, público e validade. Token inválido para aqui com **401**.
2. **`Program.cs`** → políticas por papel (`Politicas.Loja`, `Politicas.Admin`): token de admin não entra nas rotas da loja, e o contrário também vale (**403**).
3. **`Controllers/UniformesController.cs`** → `Excluir(id)` lê o id da loja do token (`User.LojaId()`, claim `sub`). O id da loja **nunca** vem do corpo nem da URL.
4. **`Services/UniformeService.cs`** → `ExcluirAsync` → `BuscarDaLojaAsync`: **404** se não existe, **403** se é de outra loja.
5. **EF Core** gera `DELETE FROM uniformes WHERE id = @p0`, com parâmetro (sem SQL injection).
6. Resposta **204**. Se o serviço lançou `ApiException`, o **`Errors/ApiExceptionHandler.cs`** a transforma em ProblemDetails.

Validação (para o 400): `Dtos/UniformeDtos.cs` (`[Required]`, verificado automaticamente pelo `[ApiController]`) + `Domain/RegrasUniforme.Validar` (regras que dependem do tipo: calça é número, só camisa tem modelo).

Deploy: `git push` → **GitHub Actions** (`ci-cd.yml`: testes xUnit, build do front, build do Docker) → com tudo verde, `curl` nos **Deploy Hooks** do Render → o Render monta a imagem Docker e sobe a API → as migrations rodam na subida (`MigrateAsync`) → `/api/versao` mostra o commit.

## Testes de mutação (para a fala e a arguição)

| Regra | Mutação | Teste que falhou |
|---|---|---|
| Dono do uniforme (403) | `if (false && uniforme.LojaId != lojaId)` | `Loja_nao_altera_nem_exclui_uniforme_de_outra_loja`: Expected Forbidden / Actual OK |
| CNPJ repetido (409) | `if (false && await db.Lojas.AnyAsync(...))` | `Cadastro_com_cnpj_repetido_devolve_409`: Expected Conflict / Actual Created |
| Paginação | sem o `.Skip(...)` | `Listagem_publica_e_paginada_...`: Collections differ |

Ao vivo, se o professor pedir: faça a mutação, rode `dotnet test --filter "FullyQualifiedName~outra_loja"` e desfaça com **Ctrl+Z** no editor. Não use `git checkout --`, que apaga outras mudanças ainda não commitadas (erro nº 14).

## Perguntas prováveis na arguição

| Pergunta | Resposta curta | Onde mostrar |
|---|---|---|
| **O cliente A consegue alterar ou excluir o uniforme do B? Prove.** | Não. O id da loja vem do token assinado, e o serviço compara com o dono do item: 403. Faça o passo 8 ao vivo | `UniformeService.BuscarDaLojaAsync` + teste `Loja_nao_altera_nem_exclui_...` |
| E se eu editar o token e trocar o `sub`? | A assinatura HMAC deixa de conferir: 401 | teste `Token_forjado_devolve_401`, `Program.cs` (`TokenValidationParameters`) |
| Uma loja consegue usar a rota do admin? | Não: a política `Admin` exige `role = admin`. Token de loja dá 403 | `Program.cs` (`AddAuthorizationBuilder`), `AdminTests` |
| Por que 403 e não 404 no item de outra loja? | Escolha: 403 deixa claro que é permissão. O 404 esconderia que o id existe, mas os ids já são públicos na listagem | `BuscarDaLojaAsync` |
| Por que JWT e não sessão? | A API não guarda estado; o token assinado prova quem é a loja e vale em qualquer instância | `TokenService.cs` |
| Por que BCrypt e não SHA-256? | BCrypt é lento de propósito e tem sal: atacar muitas senhas fica caro | `AuthService.cs` |
| O login revela se um CNPJ existe? | Não: mesma mensagem nos dois casos, e o BCrypt roda mesmo quando a loja não existe (`HashFalso`), então o tempo de resposta é igual | `AuthService.LoginAsync` |
| Como evitam SQL injection? | EF Core sempre usa parâmetros; não há SQL concatenado | qualquer consulta LINQ |
| Por que DTO e não a entidade? | Para não vazar o `senha_hash` e não amarrar o JSON ao banco | teste `Detalhe_nao_expoe_hash_da_senha` |
| O que é o CORS e como está configurado? | O navegador só deixa o front chamar a API se a API liberar aquela origem. `Cors__Origins` = `https://ifes-modas.onrender.com`. Não protege a API contra curl ou Swagger: quem protege é o JWT | `Program.cs` (`AddCors`), `render.yaml`, `CorsTests` |
| Como funciona a paginação? | `pagina` e `porPagina` (1 a 50, `[Range]`); `CountAsync` + `Skip/Take` viram `COUNT` e `LIMIT/OFFSET`: só a página sai do banco | `UniformeService.ListarPublicoAsync` |
| De onde vem o commit do `/api/versao`? | O Render preenche a variável `RENDER_GIT_COMMIT` em cada deploy | `VersaoController.cs` |
| Como as migrations rodam em produção? | `MigrateAsync()` quando a API sobe | `Program.cs` |
| Onde ficam os segredos? | No painel do Render (`ConnectionStrings__Default`, `Jwt__Key`). Nunca no Git nem no chat | `render.yaml` (`sync: false`, `generateValue`) |
| E se um teste falhar? | O job de deploy depende dos 3 jobs (`needs`): não publica | `ci-cd.yml` |
| O que é o 429? | Limite de 10 logins/cadastros por minuto por IP, contra força bruta | `RateLimitPolicies.cs`, `Program.cs` |
| Os testes usam o Postgres? | Não: a API inteira sobe com banco em memória (`ApiFactory`). Limitação: ele não confere o índice único. Próximo passo: Testcontainers | `ApiFactory.cs` |
| Onde a IA errou? | `docs/REGISTRO_IA.md` (18 erros e como cada um foi pego) | |
