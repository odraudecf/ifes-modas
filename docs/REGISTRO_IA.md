# Registro do uso de IA

O trabalho libera e recomenda IA. A regra é: **o código é nosso. Nós encomendamos, conferimos, testamos, corrigimos e explicamos.** Este arquivo registra como a IA foi usada, o que ela gerou, como conferimos e **onde ela errou**.

## Ferramentas

| Ferramenta | Uso |
|---|---|
| **Claude Code** (modelo Claude Opus, da Anthropic), no terminal | Ler o projeto antigo, planejar, gerar código do back e do front, testes, Dockerfile, CI/CD e documentação |
| Skill `frontend-design` (Claude Code) | Guia de design seguido antes de criar as telas React |
| Claude in Chrome | A IA abriu o site local no navegador para conferir as telas e o fluxo de login/CRUD |

## Como trabalhamos com a IA

1. **Contexto primeiro:** a IA leu o código PHP, o SQL, a documentação do TCC e os prints antes de propor qualquer coisa.
2. **Plano aprovado antes do código:** a IA escreveu um plano (estrutura, endpoints, modelo de dados, CI/CD), nós fizemos perguntas, decidimos (conta do GitHub, Docker, dados de demonstração) e aprovamos.
3. **Etapas pequenas, um commit por etapa:** assim dá para revisar o diff de cada coisa que a IA gerou (`git log`).
4. **Conferência em quatro níveis:** compilação → testes automatizados (91) → teste manual com Postgres real (`curl`) → teste no navegador.
5. **Nada de segredo no chat:** a string de conexão do Neon e a chave do JWT vão direto para o painel do Render, nunca para a conversa nem para o Git.

## Linha do tempo

| # | Pedido à IA | O que ela entregou | Como conferimos |
|---|---|---|---|
| 1 | Recriar o sistema a partir do código, da documentação e das imagens, na stack do trabalho | Análise do sistema antigo, lista de bugs e plano | Abrimos os arquivos PHP citados e confirmamos cada bug |
| 2 | Criar repositório e ambiente | .NET 10 SDK, Docker Desktop, repo no GitHub | `dotnet --list-sdks`, `gh repo view` |
| 3 | API com EF Core, JWT, BCrypt e Swagger | Domínio, serviços, controllers, migration | Build + revisão da migration (tipos, índices) |
| 4 | Testes xUnit | 60 testes (hoje 91) | Rodaram verdes **e** fizemos o teste de mutação (ver abaixo) |
| 5 | Docker + GitHub Actions + Render | Dockerfile, compose, workflow, `render.yaml` | Primeiro push com os 4 jobs verdes |
| 6 | Front em React | Telas, cliente HTTP, autenticação | Lint, build e navegação real no Chrome |
| 7 | Documentar para o seminário | Este registro, o diário, o README e o roteiro | Leitura e revisão do grupo |
| 9 | Cadastro pelo CNPJ (dados da Receita), CNPJ opcional só no teste, navbar verde | Endpoint de consulta com 3 APIs em sequência, regra por ambiente, cadastro reorganizado | 17 testes novos (APIs externas simuladas), teste de mutação e teste no Chrome nos dois modos |
| 10 | Papel de admin, painel com gráficos, usuários e troca de acesso | Tabela de administradores, papéis no JWT, rotas de admin, dashboard com a skill de dataviz | 10 testes novos + teste de mutação da troca obrigatória + teste no Chrome (computador e celular) |
| 8 | Refazer o layout inteiro, mais moderno e intuitivo | Nova identidade visual, busca por peça e tamanho, cadastro em etapas, painel da loja | Teste de cada tela no Chrome (computador e celular de 390px) com a API e um banco locais |

## Erros da IA e como foram pegos

> Para o seminário ("teste e erro da IA"). Cada linha diz o que a IA fez de errado, como percebemos e como foi corrigido.

| # | Erro da IA | Como foi pego | Correção |
|---|---|---|---|
| 1 | No seed, usou **CNPJs de empresas reais** (ex.: 33.000.167/0001-01) como "lojas fictícias" | Revisão do código do seed antes do commit | Geramos CNPJs fictícios válidos (`20.240.101/0001-47`...) com o mesmo algoritmo e conferimos contra o exemplo oficial da Receita |
| 2 | O plano sugeria o banco Neon **em São Paulo**, mas o Render **não tem região no Brasil** | Ao escrever o `render.yaml`, conferindo as regiões disponíveis | API e banco juntos em US East (Virgínia); senão, cada consulta cruzaria o continente |
| 3 | As respostas automáticas do ASP.NET saíam **em inglês** ("One or more validation errors occurred.", "Unauthorized") | Ao ligar o front na API: a mensagem apareceria em inglês na tela | Classe `MensagensPadrao` traduz os títulos padrão + 2 testes que garantem português |
| 4 | O logo do Ifes no banner ficou **achatado** | Screenshot no navegador | O `<img>` tinha `height` fixo no HTML e largura variável no CSS; `height: auto` global |
| 5 | Três componentes React chamavam `setState` dentro de `useEffect` (renderização em cascata no React 19) | Lint (`oxlint`) com 3 avisos | Refatoração: o estado "carregando" passou a ser **derivado**; o menu fecha comparando a página atual |
| 6 | O componente `Campo` aceitava `children`, e aí o `<label>` apontaria para um id inexistente | Revisão do próprio código antes do build | Removemos a opção (não era usada) |
| 7 | O script do Postgres temporário montou o caminho a partir da URL do arquivo **sem decodificar** ("Eduardo%20Castro") | O `initdb` falhou com "Permission denied" | `fileURLToPath()` + forçar UTF-8 (o padrão do Windows seria WIN1252) |
| 8 | No PowerShell 5.1, `git config ... ""` perdeu o argumento vazio | Erro "wrong number of arguments" | O mesmo comando no Bash |
| 9 | No `render.yaml`, a IA usou `fromService → property: host` achando que daria o endereço público. Na verdade é o **nome interno** do serviço (`ifes-modas-api`): o front chamava `https://ifes-modas-api` e o CORS liberava `https://ifes-modas` | **Verificação em produção** depois do primeiro deploy: o preflight CORS voltou sem `Access-Control-Allow-Origin` e o JS publicado tinha a URL errada. Todos os testes locais passavam, porque o erro estava só na configuração da nuvem | URLs públicas fixas no `render.yaml` + novo deploy. Lição: teste de produção é obrigatório, não só o CI |
| 10 | Ao montar de novo o Postgres temporário (para testar o layout), a IA **repetiu o erro nº 7**: caminho sem decodificar ("Eduardo%20Castro") | O `initdb` falhou de novo com "Permission denied" | A mesma correção (`fileURLToPath`). Lição: o registro de erros só ajuda se for consultado antes de repetir a tarefa |
| 11 | No celular, a área da loja ficava **mais larga que a tela** (dava para arrastar para o lado) | Teste num iframe de 390px no Chrome, medindo `scrollWidth` | A coluna da grade era `1fr`, que cresce até caber a linha de abas sem quebra; trocamos por `minmax(0, 1fr)` em todas as grades de uma coluna |
| 12 | Guardou o "último formulário de roupa" numa variável fora do componente e a alterava durante o uso | Aviso do `oxlint` (`react(globals)`) | O valor passou a ser estado do componente pai |
| 13 | Os CNPJs do seed, descritos no erro nº 1 como "fictícios", **existem na Receita**. O de demonstração (`20.240.101/0001-47`) é de um microempreendedor individual, com a empresa encerrada. A IA também usou nos testes locais um CNPJ "de exemplo" (`11.222.333/0001-81`) que é de uma entidade real | Ao testar as APIs de CNPJ: a consulta devolveu dados de verdade | Testes automáticos agora usam CNPJs gerados e APIs **simuladas** (nunca consultam a internet); o banco local com o CNPJ real foi apagado. Trocar o CNPJ de demonstração está **pendente de decisão do grupo**. Lição: um CNPJ com dígito verificador certo não é "fictício"; a Receita emite os números em sequência |
| 14 | Para desfazer um teste de mutação, a IA usou `git checkout -- arquivo`, que voltou o arquivo para o último commit e **apagou também as mudanças ainda não commitadas** do `AuthService` | O `git diff` ficou vazio logo depois | A IA tinha feito uma cópia antes da mutação e restaurou a partir dela; 80 testes verdes de novo. Lição: desfazer mutação com a cópia, não com o git |
| 15 | A conversão dos nomes da Receita (maiúsculas → "Nome Próprio") deixava artigos em minúsculo, e "RUA A" virou "Rua a" | Teste de integração com uma resposta simulada da BrasilAPI | Artigos só ficam minúsculos no meio do nome; novo caso de teste "RUA A" |
| 16 | Na tela "Criar usuário", a IA escreveu que a loja troca a senha provisória "quando quiser", mas a área da loja **não tem** tela de troca de senha | Revisão da tela no navegador | Texto corrigido para o que o sistema faz; a troca de senha da loja ficou registrada como melhoria possível |
| 17 | No painel, os nomes longos dos gráficos ("Cachoeiro de Itapemirim", "Camisa agropecuária") apareciam **cortados com reticências**, o que a própria skill de dataviz proíbe | Screenshot do painel | Os rótulos passaram a quebrar a linha |

### Os testes provam alguma coisa? (teste de mutação)

Teste que nunca falhou não prova nada. Por isso, **quebramos de propósito** a regra de dono do uniforme:

```csharp
if (false && uniforme.LojaId != lojaId)   // checagem desativada de propósito
```

Resultado: o teste de integração falhou com `Expected: Forbidden / Actual: OK`. Ou seja, se alguém (ou a IA) apagar essa linha no futuro, o CI barra o deploy. Depois o código foi restaurado.

### O que a IA **não** decidiu sozinha

- Qual conta do GitHub usar, se instalaria Docker e se haveria dados de demonstração: perguntamos e decidimos.
- Criar contas (Neon, Render) e colar segredos: feito por nós, direto nos painéis.
- Commits sem coautoria da IA: pedido nosso. O uso da IA está documentado aqui.
