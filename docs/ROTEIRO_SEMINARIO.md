# Roteiro do seminário (sugestão)

Os itens avaliados são: slides, tempo, demonstração ao vivo, caminho no código, teste e erro da IA, arguição e clareza. A sugestão é ~15 minutos; ajuste ao tempo que o professor der.

## Slides sugeridos

| # | Slide | Conteúdo | Tempo |
|---|---|---|---|
| 1 | Título | Ifes Modas 2.0, nomes, links do site e da API | 0:30 |
| 2 | O problema | 70% dos alunos tiveram dificuldade para achar o uniforme (pesquisa do TCC) | 1:00 |
| 3 | O sistema antigo | Prints do PHP + os 5 bugs (SQL injection, sessão na URL, `decimal(3,2)`, "BH", lista quebrada) | 1:30 |
| 4 | Stack nova | Tabela da stack + diagrama da arquitetura (`ARQUITETURA.md`) | 1:00 |
| 5 | Antes × depois | Tabela do README | 1:00 |
| 6 | **Demo ao vivo** | Ver roteiro abaixo | 4:00 |
| 7 | **Caminho no código** | Exclusão de um uniforme, do clique ao `DELETE` (`ARQUITETURA.md`) | 2:00 |
| 8 | Testes | 80 testes; `WebApplicationFactory`; **teste de mutação** ao vivo | 1:30 |
| 9 | CI/CD | Diagrama push → Actions → Render; mostrar um run verde | 1:00 |
| 10 | **IA: teste e erro** | Como trabalhamos + 3 erros da IA (CNPJ de empresa real, região do banco, mensagens em inglês) | 1:30 |
| 11 | Fechamento | O que aprendemos; próximos passos | 0:30 |

## Demonstração ao vivo (4 min)

> **Antes de começar (5 min antes):** abra o site e o `/health` para **acordar a API** do Render. A primeira requisição pode levar ~1 min.

1. **Site, sem login:** na busca do Início, escolher *Camisa padrão* + *G* → Ver lojas (lista do menor para o maior preço) → abrir uma loja → tocar num tamanho (abre o WhatsApp com a mensagem pronta).
2. **API sem token (Swagger):** `GET /api/lojas` funciona. `POST /api/uniformes` sem token dá **401**.
3. **Login:** Área da loja → CNPJ `20.240.101/0001-47` / `ifes2024` → Visão geral → Roupas.
4. **CRUD:** Adicionar roupas → *Calça*, *Masculino*, marcar **46 e 48** de uma vez, R$ 69,90 (os números já cadastrados aparecem riscados) → editar o preço de um deles → Ver minha página e mostrar os itens → excluir (confirmação no próprio botão).
5. **Segurança ao vivo (Swagger):** com o token da loja 1, tentar `DELETE /api/uniformes/{id de uniforme da loja 2}` dá **403**. Mostrar a linha `if (uniforme.LojaId != lojaId)` no `UniformeService.cs`.
6. **Deploy ao vivo (opcional, se o tempo deixar):** mudar um texto do front, `git push` e mostrar o Actions rodando os testes e disparando o deploy.

## Teste de mutação (para o slide 8 / arguição)

```bash
# 1. quebrar de propósito a checagem de dono
#    UniformeService.cs: if (false && uniforme.LojaId != lojaId)
# 2. rodar só o teste de segurança
dotnet test --filter "FullyQualifiedName~outra_loja"
#    → Falha: Expected: Forbidden / Actual: OK
# 3. desfazer
git checkout -- src/IfesModas.Api/Services/UniformeService.cs
```

## Perguntas prováveis na arguição

| Pergunta | Resposta curta | Onde mostrar |
|---|---|---|
| Por que JWT e não sessão? | A API não guarda estado; o token assinado prova quem é a loja, e escala com várias instâncias | `TokenService.cs`, `Program.cs` (AddJwtBearer) |
| O que impede alguém de editar o token? | A assinatura HMAC com a chave secreta. Mudou um byte, a assinatura não confere: 401 | teste `Token_forjado_devolve_401` |
| Por que BCrypt e não SHA-256? | BCrypt é lento de propósito e tem sal: atacar senhas em massa fica caro | `AuthService.cs` |
| Como evitam SQL injection? | EF Core sempre parametriza; nunca concatenamos SQL | teste com `' OR '1'='1` |
| Por que DTO e não devolver a entidade? | Para não vazar `SenhaHash` e não acoplar o JSON ao banco | teste `Detalhe_nao_expoe_hash_da_senha` |
| Por que o token fica no localStorage? | Simples para SPA; o risco é XSS, que mitigamos com React (escapa HTML) e links só http/https | `format.js` (`linkSeguro`) |
| Como as migrations rodam em produção? | `MigrateAsync()` na subida da API | `Program.cs` |
| Por que o primeiro acesso é lento? | O plano gratuito do Render dorme a API; o front avisa | `Estados.jsx` |
| Como a IA errou? | Ver `REGISTRO_IA.md` (8 erros, como pegamos cada um) | |
| Vocês entendem o código? | Cada um escolhe um arquivo e explica | o "caminho no código" acima |
