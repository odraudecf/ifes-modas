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

**O que fizemos:**
- Instalamos o **.NET 10 SDK** e o **Docker Desktop** com `winget` (Node 25 já estava instalado).
- Criamos a pasta `ifes-modas/` como repositório Git, com `user.email` **local** apontando para a conta pessoal. O git global da máquina é de outra conta e não foi alterado.
- Adicionamos `.gitignore` (bin/obj, node_modules, `.env`) e `.gitattributes` (Dockerfile e YAML sempre com quebra de linha LF; com CRLF, o shell do container quebra).

**Por quê:** segredos (string de conexão do Neon, chave do JWT) **nunca** vão para o Git. Eles ficam em variáveis de ambiente no Render e em `dotnet user-secrets` localmente.
