# Arquitetura

## Visão geral

```
┌──────────────────────┐   HTTPS + JSON    ┌────────────────────────────┐   TCP/SSL   ┌──────────────┐
│ Navegador            │ ────────────────► │ API .NET 10 (Docker)       │ ──────────► │ PostgreSQL   │
│ React + Vite         │ ◄──────────────── │ Render · US East           │ ◄────────── │ Neon·US East │
│ Render (site estát.) │   Bearer <JWT>    │ Controllers → Services → EF│             └──────────────┘
└──────────────────────┘                   └────────────────────────────┘
```

## Modelo de dados

```
lojas                         enderecos (1:1)                uniformes (1:N)
─────────────                 ───────────────                ───────────────
id            PK              id          PK                 id          PK
cnpj          UNIQUE (14)     loja_id     FK → lojas         loja_id     FK → lojas
nome                          rua                            tipo        Camisa|Bermuda|Calca
telefone      (só dígitos)    numero      (texto: "S/N")     modelo      Padrao|Agropecuaria|null
instagram?                    bairro                         genero      Masculino|Feminino
facebook?                     cidade                         tamanho     PP..XGG | 30..60
senha_hash    (BCrypt)        uf          char(2)            preco       numeric(10,2)
criado_em                     INDEX (uf, cidade)
```

Exclusão em cascata: ao apagar a loja, o endereço e os uniformes vão junto.

## Caminho de uma requisição (para o "caminho no código")

Exemplo: a loja exclui um uniforme.

1. **Front:** `pages/MinhasRoupas.jsx` → `excluir(item)` → `api('/api/uniformes/7', { method: 'DELETE', auth: true })`
2. **`api/client.js`** pega o token do `localStorage` e envia `Authorization: Bearer eyJ...`
3. **`Program.cs`** → `UseAuthentication()`: o middleware JwtBearer confere **assinatura, emissor, público e validade**. Token inválido para aqui com 401.
4. **`Controllers/UniformesController.cs`** → `Excluir(id)` lê o id da loja do token (`User.LojaId()`, claim `sub`)
5. **`Services/UniformeService.cs`** → `ExcluirAsync` → `BuscarDaLojaAsync`: 404 se não existe, **403 se é de outra loja**
6. **EF Core** gera `DELETE FROM uniformes WHERE id = @p0` (parametrizado: sem SQL injection)
7. Resposta **204**. O front tira o item da lista e mostra "Calça 44 excluída."

Se algo der errado no passo 5, o serviço lança `ApiException`. O **`Errors/ApiExceptionHandler.cs`** transforma a exceção em ProblemDetails e o front mostra o `title` na tela.

## Fluxo do JWT

```
Login (CNPJ + senha)
  └─► AuthService: BCrypt.Verify(senha, senha_hash)
        └─► TokenService: cria o JWT { sub: id, name: nome, cnpj, exp: +8h } assinado com Jwt__Key
              └─► front guarda o token e o envia em toda rota protegida
                    └─► API confere a assinatura a cada requisição (sem sessão no servidor)
```

O front **lê** o payload do token só para mostrar o nome da loja e saber a validade. Quem **confia** no token é apenas a API, que tem a chave para verificar a assinatura.

## Configuração (variáveis de ambiente)

| Variável | Exemplo | Onde |
|---|---|---|
| `ConnectionStrings__Default` | `postgresql://user:senha@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require` | Render (secreta). A API converte a URL do Neon para o formato do Npgsql. |
| `Jwt__Key` | (gerada pelo Render, 256 bits) | Render |
| `Cors__Origins` | `ifes-modas.onrender.com` | Render (vem do Blueprint) |
| `VITE_API_URL` | `ifes-modas-api.onrender.com` | Render, no front, em tempo de build |
| `PORT` | 10000 | Render define sozinho |
