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

## Verificações complementares pendentes

- [x] Reexecutar CT-PROD-A a CT-PROD-N após as alterações, com novos SKUs nos cenários positivos.
- [x] Confirmar HTTP, corpo JSON e log de preço negativo na versão corrigida.
- [ ] Testar preço imediatamente abaixo do máximo (`999999.98`) e três casas decimais próximas do limite (`999999.991`).
- [ ] Confirmar por consulta ao PostgreSQL que entradas rejeitadas não persistiram.
- [ ] Testar preço ausente, `null`, booleano e objeto, esperando HTTP `400` e erro de número finito.
- [ ] Verificar JSON sintaticamente inválido e distinguir falha do parser HTTP de validação do Controller.
- [ ] Revisar ausência de `ERROR DATABASE` para todas as rejeições esperadas.
- [ ] Registrar execução final de `npm run build` e reinicialização do servidor na mesma versão que será commitada (builds anteriores foram informados como aprovados).

## Resumo de QA e decisão

- **Histórico anterior à Issue #4:** 14/14 aprovados.
- **Regressão manual pós-alteração:** 14/14 aprovados.
- **Testes principais de limites, tipo e precisão da Issue #4:** aprovados nos cenários executados.
- **Verificações complementares:** pendentes, conforme checklist acima.
- **Conclusão:** nenhuma regressão identificada na suíte funcional executada; encerramento da Issue #4 e commit dependem de decisão sobre as verificações complementares e revisão final do código/documentação.

## Observações técnicas

1. O PostgreSQL utiliza UTC (`Etc/UTC`); o log da aplicação usa `America/Sao_Paulo`.
2. O cabeçalho HTTP `Date` é apresentado em GMT/UTC.
3. A definição futura do contrato monetário da API pode considerar representação explícita de valores decimais; atualmente o driver `pg` retorna `NUMERIC` como string.
4. Logs `INFO` de cadastros bem-sucedidos e avaliação de desempenho do logger pertencem à Issue #5.
5. Este arquivo é uma versão revisada para substituição local, não uma atualização automática do GitHub.
