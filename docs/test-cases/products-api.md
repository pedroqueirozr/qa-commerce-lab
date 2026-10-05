# Testes manuais — Products API

Este documento registra os testes manuais executados no endpoint `POST /api/products` antes da refatoração estrutural do backend.

## Ambiente e convenções

- Endpoint: `POST /api/products`
- Content-Type: `application/json`
- API: Express + TypeScript
- Banco: PostgreSQL
- Logs operacionais: `backend/logs/app.log`
- Validações rejeitadas devem gerar `WARN`, não `ERROR DATABASE`.
- Falhas inesperadas de banco devem gerar `ERROR DATABASE`.
- Strings de `name`, `description` e `sku` são normalizadas com `trim()` quando aplicável.

---

## CT-PROD-A — Cadastro válido

**Objetivo:** validar a criação de um produto com todos os dados obrigatórios corretos.

**Entrada utilizada:**
```json
{
  "name": "Teclado Mecânico QA",
  "description": "Produto criado no teste do caso A",
  "price": 249.90,
  "stock": 10,
  "sku": "TEST-A-001"
}
```

**Esperado:**
- HTTP `201 Created`
- Produto persistido
- Sem `WARN` ou `ERROR` decorrente da operação

**Obtido:**
- HTTP `201 Created`
- Produto criado com `id: 15`
- `price` retornado como `"249.90"`

**Status:** APROVADO

---

## CT-PROD-B — Nome ausente

**Objetivo:** impedir cadastro sem `name`.

**Entrada:** payload sem a propriedade `name`.

**Esperado:**
- HTTP `400 Bad Request`
- `{"error":"Product name is required"}`
- Log `WARN VALIDATION Product creation rejected: missing or invalid name`

**Obtido:** conforme esperado.

**Status:** APROVADO

---

## CT-PROD-C — Preço negativo

**Objetivo:** impedir preço negativo.

**Entrada relevante:**
```json
"price": -100
```

**Esperado:**
- HTTP `400 Bad Request`
- `{"error":"The value cannot be negative or written out in words"}`
- Log `WARN VALIDATION Product creation rejected: invalid price`

**Obtido:** conforme esperado.

**Status:** APROVADO

---

## CT-PROD-D — Estoque negativo

**Objetivo:** impedir quantidade de estoque negativa.

**Entrada relevante:**
```json
"stock": -5
```

**Esperado:**
- HTTP `400 Bad Request`
- `{"error":"The stock must be a non-negative integer or cannot written out in words"}`
- Log `WARN VALIDATION Product creation rejected: invalid stock`

**Obtido:** conforme esperado.

**Status:** APROVADO

---

## CT-PROD-E — SKU duplicado

**Objetivo:** impedir cadastro de SKU já existente.

**Esperado:**
- PostgreSQL identifica violação da constraint `products_sku_key` (`23505`)
- HTTP `409 Conflict`
- `{"error":"Product SKU already exists"}`
- Log `WARN PRODUCT Product creation rejected: duplicate SKU`
- Não classificar conflito conhecido como `ERROR DATABASE`

**Obtido:** conforme esperado.

**Status:** APROVADO

---

## CT-PROD-F — Preço enviado como texto

**Objetivo:** impedir preço que não seja do tipo `number`.

**Entrada relevante:**
```json
"price": "cem reais"
```

**Esperado:**
- HTTP `400 Bad Request`
- `{"error":"The value cannot be negative or written out in words"}`
- Log `WARN VALIDATION Product creation rejected: invalid price`

**Obtido:** conforme esperado.

**Status:** APROVADO

---

## CT-PROD-G — Nome somente com espaços

**Objetivo:** impedir nome vazio após normalização.

**Entrada relevante:**
```json
"name": "   "
```

**Esperado:**
- HTTP `400 Bad Request`
- `{"error":"Product name entered incorrectly"}`
- Log `WARN VALIDATION Product creation rejected: empty name`

**Obtido:** conforme esperado.

**Status:** APROVADO

---

## CT-PROD-H — Estoque decimal

**Objetivo:** garantir que estoque aceite somente números inteiros não negativos.

**Entrada relevante:**
```json
"stock": 5.5
```

**Esperado:**
- HTTP `400 Bad Request`
- `{"error":"The stock must be a non-negative integer or cannot written out in words"}`
- Log `WARN VALIDATION Product creation rejected: invalid stock`

**Obtido:** conforme esperado.

**Status:** APROVADO

---

## CT-PROD-I — SKU ausente

**Objetivo:** impedir cadastro sem SKU.

**Entrada:** payload sem a propriedade `sku`.

**Esperado:**
- HTTP `400 Bad Request`
- `{"error":"Product SKU is required"}`
- Log `WARN VALIDATION Product creation rejected: missing or invalid SKU`

**Obtido:** conforme esperado.

**Status:** APROVADO

---

## CT-PROD-J — SKU somente com espaços

**Objetivo:** impedir SKU vazio após `trim()`.

**Entrada relevante:**
```json
"sku": "     "
```

**Esperado:**
- HTTP `400 Bad Request`
- `{"error":"SKU entered incorrectly"}`
- Log `WARN VALIDATION Product creation rejected: empty SKU`

**Obtido:** conforme esperado.

**Status:** APROVADO

---

## CT-PROD-K — Normalização de strings

**Objetivo:** confirmar remoção de espaços externos antes da persistência.

**Entrada utilizada:**
```json
{
  "name": "   Mouse QA   ",
  "description": "   Produto para testar normalização   ",
  "price": 150.50,
  "stock": 5,
  "sku": "   TEST-K-001   "
}
```

**Esperado:**
- HTTP `201 Created`
- `name`: `"Mouse QA"`
- `description`: `"Produto para testar normalização"`
- `sku`: `"TEST-K-001"`
- Sem `WARN` ou `ERROR`

**Obtido:**
- HTTP `201 Created`
- Produto criado com `id: 16`
- Todos os campos de texto normalizados conforme esperado

**Status:** APROVADO

---

## CT-PROD-L — Descrição ausente

**Objetivo:** confirmar que `description` é opcional.

**Entrada:** payload sem `description`.

**Esperado:**
- HTTP `201 Created`
- `description: null`
- Sem `WARN` ou `ERROR`

**Obtido:**
- HTTP `201 Created`
- Produto criado com `id: 17`
- `description: null`

**Status:** APROVADO

---

## CT-PROD-M — Descrição com tipo inválido

**Objetivo:** impedir descrição fornecida em tipo diferente de string.

**Entrada relevante:**
```json
"description": 12345
```

**Esperado:**
- HTTP `400 Bad Request`
- `{"error":"Invalid description format"}`
- Log `WARN VALIDATION Product creation rejected: invalid description`

**Obtido:** conforme esperado.

**Status:** APROVADO

---

## CT-PROD-N — Descrição somente com espaços

**Objetivo:** confirmar que uma descrição vazia após `trim()` é tratada como ausência de descrição.

**Entrada relevante:**
```json
"description": "     "
```

**Esperado:**
- HTTP `201 Created`
- `description: null`
- Sem `WARN` ou `ERROR`

**Obtido:**
- HTTP `201 Created`
- Produto criado com `id: 18`
- `description: null`

**Status:** APROVADO

---

## Resumo da execução

| Caso | Cenário | HTTP esperado | Resultado |
|---|---|---:|---|
| A | Cadastro válido | 201 | APROVADO |
| B | Nome ausente | 400 | APROVADO |
| C | Preço negativo | 400 | APROVADO |
| D | Estoque negativo | 400 | APROVADO |
| E | SKU duplicado | 409 | APROVADO |
| F | Preço como texto | 400 | APROVADO |
| G | Nome somente espaços | 400 | APROVADO |
| H | Estoque decimal | 400 | APROVADO |
| I | SKU ausente | 400 | APROVADO |
| J | SKU somente espaços | 400 | APROVADO |
| K | Normalização com `trim()` | 201 | APROVADO |
| L | Descrição ausente | 201 | APROVADO |
| M | Descrição com tipo inválido | 400 | APROVADO |
| N | Descrição somente espaços | 201 | APROVADO |

**Resultado geral:** 14/14 casos aprovados.

## Observações técnicas

1. O PostgreSQL utiliza UTC (`Etc/UTC`).
2. O `app.log` é apresentado em `America/Sao_Paulo`, atualmente `-03:00`.
3. O header HTTP `Date` é apresentado em GMT/UTC, conforme comportamento padrão HTTP.
4. O campo PostgreSQL `NUMERIC(10,2)` é retornado pelo driver `pg` como string, por exemplo `"249.90"`. A definição do contrato definitivo da API para valores monetários fica como decisão futura.
5. Este documento deve ser reutilizado como checklist de regressão após a reorganização do backend em camadas.
