# Registro do uso de IA

O trabalho libera e recomenda IA. A regra é: **o código é nosso. Nós encomendamos, conferimos, testamos, corrigimos e explicamos.** Este arquivo registra como a IA foi usada, o que ela gerou, como conferimos e **onde ela errou**.

## Ferramentas

| Ferramenta | Uso |
|---|---|
| **Claude Code** (Claude Opus, Anthropic), no terminal | Ler o projeto antigo, planejar, gerar código do back e do front, testes, Dockerfile, CI/CD e documentação |
| Skill `frontend-design` (Claude Code) | Guia de design carregado antes de criar as telas React |

## Como trabalhamos com a IA

1. **Contexto primeiro:** a IA leu o código PHP, o SQL, a documentação do TCC e os prints antes de propor qualquer coisa.
2. **Plano aprovado antes do código:** a IA escreveu um plano (estrutura, endpoints, modelo de dados, CI/CD) e nós aprovamos antes da implementação.
3. **Etapas pequenas com commit:** cada etapa vira um commit. Assim dá para revisar o diff do que a IA gerou.
4. **Conferência:** todo código gerado passa por build, testes automatizados (xUnit) e teste manual no Swagger e no navegador.

## Linha do tempo

| # | Pedido à IA | O que ela entregou | Como conferimos | Correções / erros da IA |
|---|---|---|---|---|
| 1 | "Use o código, a documentação e as imagens como base para recriar o sistema na stack do trabalho" | Análise do sistema antigo, lista de bugs (SQL injection, sessão na URL, `decimal(3,2)`) e plano | Conferimos cada bug abrindo os arquivos PHP citados | — |

## Erros da IA e como foram pegos

> Seção obrigatória para o seminário ("teste e erro da IA"). Cada entrada traz: o que a IA fez de errado, como percebemos (teste, build, revisão) e a correção.

_(preenchido ao longo do desenvolvimento)_
