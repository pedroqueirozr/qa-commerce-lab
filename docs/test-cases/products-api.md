# Testes manuais — Products API

## Ambiente e convenções

- Endpoint: `POST /api/products`
- Content-Type: `application/json`
- API: Express + TypeScript; banco PostgreSQL, coluna `price NUMERIC(10,2)`.
- Logs: `backend/logs/app.log`, fuso `America/Sao_Paulo`.
- Validações rejeitadas: `WARN VALIDATION`; SKU duplicado: `WARN PRODUCT`; falhas inesperadas: `ERROR DATABASE`.
- `name`, `description` e `sku` recebem `trim()` quando aplicável.
- Preço em BRL: número JSON, ponto decimal, sem separador de milhar; intervalo de `0` a `999999.99`, inclusive, com até duas casas decimais. Entradas inválidas não são arredondadas.
- O driver `pg` retorna valores `NUMERIC` como strings, por exemplo `"249.90"`.

## Histórico anterior à Issue #4

A suíte original CT-PROD-A a CT-PROD-N foi executada antes das alterações de validação de preço, com **14/14 casos aprovados**. Os IDs históricos de cadastros bem-sucedidos incluem A = 15, K = 16, L = 17 e N = 18. Na versão anterior, os casos C e F retornavam a mensagem `The value cannot be negative or written out in words` e o log `invalid price`. Esses resultados pertencem à implementação antiga e não devem ser confundidos com a regressão atual.

## Regressão após as alterações da Issue #4

**Execução:** 12/10/2026, horário local `-03:00` (cabeçalhos HTTP `Date` apresentados em UTC em 13/10/2026).

**Escopo:** reexecução manual dos 14 cenários funcionais da suíte original, usando `curl -i`, respostas HTTP e, nos cenários negativos, logs fornecidos durante a execução. Os dados dos cadastros positivos foram adaptados com novos SKUs para evitar conflitos de unicidade. Os casos C e F foram reexecutados com entradas equivalentes para as mesmas classes de validação (`-1` e string numérica, respectivamente), não necessariamente com os valores literais históricos.

| Caso | Cenário e entrada relevante | HTTP | Evidência obtida | Resultado |
|---|---|---:|---|---|
| CT-PROD-A | Cadastro válido | 201 | ID 31; `price: "249.90"`; `stock: 10`; SKU `TEST-REG-A-001` | APROVADO |
| CT-PROD-B | Nome ausente | 400 | `Product name is required`; `WARN VALIDATION` / `missing or invalid name` | APROVADO |
| CT-PROD-C | Preço negativo (`-1`) | 400 | `Product price cannot be negative`; `WARN VALIDATION` / `negative price` | APROVADO |
| CT-PROD-D | Estoque negativo (`-5`) | 400 | Erro de estoque inválido; `WARN VALIDATION` / `invalid stock` | APROVADO |
| CT-PROD-E | SKU duplicado (`TEST-REG-A-001`) | 409 | `Product SKU already exists`; `WARN PRODUCT` / `duplicate SKU` | APROVADO |
| CT-PROD-F | Preço como texto (`"1499.99"`) | 400 | `Product price must be a finite number`; `WARN VALIDATION` / `invalid price type` | APROVADO |
| CT-PROD-G | Nome somente com espaços | 400 | `Product name entered incorrectly`; `WARN VALIDATION` / `empty name` | APROVADO |
| CT-PROD-H | Estoque decimal (`5.5`) | 400 | Erro de estoque inválido; `WARN VALIDATION` / `invalid stock` | APROVADO |
| CT-PROD-I | SKU ausente | 400 | `Product SKU is required`; `WARN VALIDATION` / `missing or invalid SKU` | APROVADO |
| CT-PROD-J | SKU somente com espaços | 400 | `SKU entered incorrectly`; `WARN VALIDATION` / `empty SKU` | APROVADO |
| CT-PROD-K | `trim()` em nome, descrição e SKU | 201 | ID 30; `Produto Normalizado`, `Descricao de teste`, `TEST-REG-TRIM-001` | APROVADO |
| CT-PROD-L | Descrição ausente | 201 | ID 28; `description: null` | APROVADO |
| CT-PROD-M | Descrição numérica (`12345`) | 400 | `Invalid description format`; `WARN VALIDATION` / `invalid description` | APROVADO |
| CT-PROD-N | Descrição somente com espaços | 201 | ID 29; `description: null` | APROVADO |

**Resultado da regressão funcional: 14/14 APROVADOS.**

Os resultados acima confirmam os contratos HTTP e os campos retornados apresentados. Não houve, nesta rodada, consulta independente ao banco para comprovar ausência de persistência em todos os cenários rejeitados, nem auditoria integral dos logs de operações bem-sucedidas.

## Issue #4 — Testes adicionais de preço

Os seguintes cenários foram executados manualmente durante o desenvolvimento e apresentaram os resultados indicados:

| Cenário | `price` enviado | Esperado | Obtido | Resultado |
|---|---:|---|---|---|
| Máximo permitido | `999999.99` | 201 | 201; ID 26; `"999999.99"` | APROVADO |
| Acima do máximo | `1000000` | 400 | `Product price cannot exceed 999999.99 BRL`; log `price exceeds maximum` | APROVADO |
| Três casas decimais | `1499.999` | 400 | `Product price must have a maximum of 2 decimal places`; log `price exceeds decimal precision` | APROVADO |
| Fração muito pequena | `0.0000001` | 400 | Mesmo erro de precisão decimal e log correspondente | APROVADO |
| Duas casas decimais | `1499.99` | 201 | 201; ID 24; `"1499.99"` | APROVADO |
| Preço zero | `0` | 201 | 201; ID 27; `"0.00"` | APROVADO |
| Tipo string numérica | `"1499.99"` | 400 | `Product price must be a finite number`; log `invalid price type` | APROVADO |
| Preço negativo | `-1` | 400 | `Product price cannot be negative`; log `negative price` | APROVADO |

**Nota:** antes da correção, um preço acima da capacidade do banco produziu erro `500`; após a implementação da validação de limite, `1000000` passou a retornar `400` conforme a regra.

## Execução complementar — 12/10/2026 (-03:00)

Evidências manuais fornecidas em 12/10/2026, com respostas HTTP, logs e consultas no DBeaver. As datas HTTP aparecem em 13/10/2026 UTC.

| Caso | Entrada | Evidência | Resultado |
|---|---|---|---|
| CT-PRICE-01 | `999999.98` | Cadastro ID 33, preço retornado `"999999.98"`; cabeçalho de status não incluído no trecho | APROVADO quanto ao corpo |
| CT-PRICE-02 | `999999.991` | HTTP 400, erro `Product price cannot exceed 999999.99 BRL`, `WARN VALIDATION / price exceeds maximum` | APROVADO |
| CT-PRICE-03 | `price` ausente | HTTP 400, erro `Product price must be a finite number`, `WARN VALIDATION / invalid price type` | APROVADO |
| CT-PRICE-04 | `null` | HTTP 400, mesmo erro e WARN de tipo inválido | APROVADO |
| CT-PRICE-05 | `true` | HTTP 400, mesmo erro e WARN de tipo inválido | APROVADO |
| CT-PRICE-06 | Objeto `{"value":1499.99}` | HTTP 400, mesmo erro e WARN de tipo inválido | APROVADO |
| CT-JSON-01 | JSON com vírgula final | HTTP 400 confirmado em execução adicional; resposta HTML com stack trace do parser; sem novo WARN de Controller no trecho fornecido | APROVADO quanto à rejeição; melhoria de tratamento de erros |
| CT-PRICE-07 | `1499` | Cadastro ID 34, preço `"1499.00"`; cabeçalho de status não incluído no trecho | APROVADO quanto ao corpo |
| CT-PRICE-08 | `1499.9` | HTTP 201, ID 35, preço `"1499.90"` | APROVADO |
| CT-PRICE-09 | `100000000` | HTTP 400, erro de máximo, `WARN VALIDATION / price exceeds maximum`; sem novo ERROR no trecho fornecido | APROVADO |
| CT-PRICE-10 | `"1.499,90"` | HTTP 400, erro de número finito, `WARN VALIDATION / invalid price type` | APROVADO |

**Integridade:** primeira consulta ao PostgreSQL com seis SKUs rejeitados retornou zero linhas. Segunda consulta encontrou somente os dois produtos válidos (IDs 34 e 35), sem os SKUs `TEST-PRICE-OVERFLOW-001` e `TEST-PRICE-BRL-STRING-001`.

**Build:** `npm run build` executou `tsc` sem erros informados. O log também mostrou nova inicialização da API antes dos testes finais. O commit funcional já publicado é `67d836a`.

**Limitações da evidência:** não houve auditoria completa dos logs nem instrumentação para comprovar diretamente que cada rejeição evitou executar a consulta de INSERT; a ausência de persistência foi confirmada para os SKUs consultados. Os casos `1499.90` e `1499.9` são equivalentes como números JSON. O caso `999999.991` viola tanto o teto quanto a precisão, e foi rejeitado pela regra do teto, conforme a ordem atual das validações.

**Melhoria independente:** padronizar a resposta para JSON malformado e evitar exposição de stack trace/caminhos internos ao cliente, especialmente em produção.

## Verificações complementares e fechamento

- [x] Reexecutar CT-PROD-A a CT-PROD-N após as alterações, com novos SKUs nos cenários positivos.
- [x] Confirmar HTTP, corpo JSON e log de preço negativo na versão corrigida.
- [x] Testar preço imediatamente abaixo do máximo (`999999.98`) e três casas decimais próximas do limite (`999999.991`).
- [x] Confirmar por consulta ao PostgreSQL que os SKUs rejeitados consultados não persistiram.
- [x] Testar preço ausente, `null`, booleano e objeto, esperando HTTP `400` e erro de número finito.
- [x] Verificar JSON sintaticamente inválido e distinguir falha do parser HTTP de validação do Controller.
- [ ] Auditoria integral do log para ausência de `ERROR DATABASE` em todas as rejeições (não realizada; trechos fornecidos não mostraram novo ERROR).
- [x] Registrar `npm run build` sem erros e evidência de reinicialização da API; não houve nova alteração funcional após o commit `67d836a`.

## Resumo de QA e decisão

- **Histórico anterior à Issue #4:** 14/14 aprovados.
- **Regressão manual pós-alteração:** 14/14 aprovados.
- **Testes principais de limites, tipo e precisão da Issue #4:** aprovados nos cenários executados.
- **Verificações complementares:** executadas conforme seção acima; permanece pendente apenas auditoria integral dos logs.
- **Conclusão:** correção aprovada nos cenários executados; commit funcional `67d836a` já publicado. Encerramento da Issue #4 sujeito à revisão final dos critérios e da documentação.

## Observações técnicas

1. O PostgreSQL utiliza UTC (`Etc/UTC`); o log da aplicação usa `America/Sao_Paulo`.
2. O cabeçalho HTTP `Date` é apresentado em GMT/UTC.
3. A definição futura do contrato monetário da API pode considerar representação explícita de valores decimais; atualmente o driver `pg` retorna `NUMERIC` como string.
4. Logs `INFO` de cadastros bem-sucedidos e avaliação de desempenho do logger pertencem à Issue #5.
5. Esta documentação é mantida no repositório GitHub; evidências foram consolidadas a partir das execuções manuais apresentadas.

## Issue #6 — Tratamento de JSON malformado

**Execução:** 13/10/2026, horário local UTC-03:00.

**Objetivo:** garantir que requisições com JSON malformado recebam uma resposta padronizada, sem exposição de stack trace, preservando o comportamento das rotas existentes.

| Caso | Cenário | HTTP | Evidência | Resultado |
|---|---|---|---|---|
| CT-JSON-02 | JSON malformado (`"price":1499,90`) | 400 | `{"error":"Invalid JSON payload"}`; `Content-Type: application/json`; ausência de HTML e stack trace; `WARN VALIDATION` | APROVADO |
| CT-ISSUE6-01 | Cadastro válido | 201 | ID 36; SKU `TEST-ISSUE6-001`; preço `"1499.90"` | APROVADO |
| CT-ISSUE6-02 | Preço negativo (`-10`) | 400 | `Product price cannot be negative`; `WARN VALIDATION` | APROVADO |
| CT-ISSUE6-03 | SKU duplicado (`TEST-ISSUE6-001`) | 409 | `Product SKU already exists`; `WARN PRODUCT` | APROVADO |

**Resultado:** 4/4 cenários aprovados.

**Validação técnica:** `npm run build` e `git diff --check` executados sem erros.

**Conclusão:** o middleware reconhece `entity.parse.failed`, retorna HTTP 400 em JSON e registra `WARN VALIDATION`. As regressões direcionadas não identificaram alterações nos contratos HTTP 201, 400 e 409.

**Limitações:** não foi realizado teste específico de erro inesperado encaminhado por `next(err)`, nem uma regressão completa de todos os endpoints.

## Issue #5 — Registro INFO de cadastro bem-sucedido

**Execução:** 13/10/2026, horário local UTC-03:00.

**Objetivo:** confirmar que o cadastro bem-sucedido registra `INFO PRODUCT`, preservando os logs de rejeição e os contratos HTTP existentes.

| Caso | Cenário | HTTP | Evidência | Resultado |
|---|---|---|---|---|
| CT-LOG-01 | Cadastro válido, SKU `TEST-LOG-INFO-001` | Não apresentado no cabeçalho enviado | Produto ID 38 persistido; resposta JSON válida; `INFO PRODUCT` com ID 38 e SKU correspondente | APROVADO quanto às evidências disponíveis |
| CT-LOG-02 | SKU duplicado | 409 | `Product SKU already exists`; `WARN PRODUCT`; nenhum novo INFO de sucesso observado | APROVADO |
| CT-LOG-03 | Preço negativo (`-10`) | 400 | `Product price cannot be negative`; `WARN VALIDATION`; nenhum novo INFO de sucesso observado | APROVADO |

**Resultado:** três cenários executados, com comportamento de logging esperado observado.

**Log de sucesso confirmado:**

`2026-10-13 10:42:24 -03:00 INFO PRODUCT Product created successfully: ID 38 - SKU TEST-LOG-INFO-001`

**Validação técnica:** compilação TypeScript executada sem erros após a implementação.

**Limitações:** não foi provocado erro interno HTTP 500 para testar o comportamento do logger nesse cenário. A avaliação de desempenho de `appendFileSync()` permanece pendente e não faz parte desta implementação inicial.

**Conclusão:** os testes direcionados confirmaram o registro de sucesso após a inserção e a preservação dos registros WARN nos cenários de rejeição.
