# Plano de Implementação do Fluxo de Visualização

## Visão Geral
Adicionar um painel básico de visualização na página Explorer que permite ao usuário criar gráficos a partir dos resultados das queries usando Recharts. Funciona inteiramente no client-side com os resultados de query já existentes.

## Decisões de Arquitetura

### Localização do Estado
- **Estado de visualização vive no componente `QueryResult`** (não na página pai)
  - Mantém a lógica de visualização autocontida
  - Recebe prop `data` do pai
  - Gerencia: `viewMode` ('table' | 'chart'), `chartType`, `dimension`, `metric`

### Detecção de Tipo de Coluna (Ajustada)
- Analisar as primeiras 100 linhas dos dados do resultado
- **Numérico**: `typeof value === 'number'` (inclui inteiros, floats)
  - Ignorar `null`/`undefined` durante a classificação
  - Se todos os valores **não-nulos** forem numéricos → classificar como `numeric`
  - Se não houver valores não-nulos suficientes para determinar → tratar como `categorical` (indeterminado) de forma segura
- **Categórico**: todo o resto (strings, datas, booleanos)
  - `null`/`undefined` **não** contam como categórico
- Auto-selecionar primeiro categórico como dimensão, primeiro numérico como métrica

### Datas (Ajustado)
- Não implementar parser sofisticado de datas
- **Não** tratar automaticamente coluna com valores de data como métrica numérica
- Para gráfico de linha, coluna de data/string temporal pode ser usada como dimensão/eixo X
- Datas permanecem como `categorical` para fins de seleção

### Tratamento de Null/Undefined (Ajustado)
- **NÃO** converter automaticamente `null`/`undefined` para 0
- Preservar o significado dos dados originais
- Filtrar **somente quando necessário** para evitar erro do Recharts
- Não alterar silenciosamente os valores retornados pelo backend

### Tipos de Gráfico e Requisitos
| Gráfico | Dimensão | Métrica |
|---------|----------|---------|
| Tabela | - | - |
| Barras | Categórico | Numérico |
| Linha | Categórico/Data | Numérico |
| Pizza | Categórico | Numérico |

## Estrutura de Componentes

### Novos Componentes
```
frontend/components/explorer/
├── visualization-panel.tsx   # Painel principal com controles + gráfico
├── chart-renderer.tsx        # Wrapper Recharts por tipo de gráfico
└── column-selector.tsx       # Dropdown para dimensão/métrica
```

### Componentes Modificados
- `query-result.tsx` - Adicionar toggle de visualização, integrar VisualizationPanel

## Passos de Implementação

### 1. Instalar Recharts
```bash
cd frontend && npm install recharts
```

### 2. Criar `column-selector.tsx`
- Dropdown reutilizável usando `DropdownMenu` dos componentes UI
- Props: `label`, `options`, `value`, `onChange`, `placeholder`, `disabled`
- Options: `{ value: string, label: string }[]`

### 3. Criar `chart-renderer.tsx`
- Componente único que renderiza o gráfico Recharts apropriado baseado no `chartType`
- Props: `data`, `chartType`, `dimension`, `metric`
- Configurações dos gráficos:
  - **Barras**: `BarChart` + `Bar` + `XAxis` (dimensão) + `YAxis` (métrica)
  - **Linha**: `LineChart` + `Line` + `XAxis` + `YAxis`
  - **Pizza**: `PieChart` + `Pie` (dataKey=métrica, nameKey=dimensão)
  - **Tabela**: Reutilizar lógica de tabela existente (ou delegar para QueryResult)
- ResponsiveContainer para dimensionamento
- Tratar dados vazios/inválidos graciosamente
- **Filtrar null/undefined da métrica apenas no momento da renderização do gráfico** (não nos dados originais)

### 4. Criar `visualization-panel.tsx`
- Props: `data`, `onBackToTable`
- Estado: `chartType`, `dimension`, `metric`
- Layout:
  - Cabeçalho: "Visualização" + botão voltar
  - Linha de controles: Seletor de tipo + Seletor de dimensão + Seletor de métrica
  - Área do gráfico: `<ChartRenderer ... />`
- Effect: Auto-selecionar dimensão/métrica quando dados mudam (reagir à prop `data`)
- Desabilitar controles quando não houver colunas compatíveis
- Mostrar avisos amigáveis quando não há colunas numéricas/categóricas

### 5. Modificar `query-result.tsx`
- Adicionar estado `viewMode` ('table' | 'chart')
- Na área do header (acima da tabela), adicionar botões toggle:
  - `[ Tabela ] [ Visualizar ]` - estilo segmented control
- Quando `viewMode === 'chart'`, renderizar `<VisualizationPanel data={data} onBackToTable={...} />`
- Quando `viewMode === 'table'`, renderizar tabela existente (comportamento atual)
- **Não usar `key` para forçar reset** - reagir normalmente à mudança da prop `data`

### 6. Definições de Tipos
Adicionar em `query-result.tsx` ou tipos compartilhados:
```ts
type ChartType = 'table' | 'bar' | 'line' | 'pie'
type ColumnType = 'numeric' | 'categorical'
interface ColumnInfo { name: string; type: ColumnType }
```

### 7. Utilitário de Análise de Colunas
Função `analyzeColumns(data: Record<string, unknown>[]): ColumnInfo[]`
- Amostrar primeiras 100 linhas
- Para cada coluna:
  - Coletar todos os valores não-nulos (`value !== null && value !== undefined`)
  - Se array vazio → `categorical` (indeterminado)
  - Se todos os valores não-nulos satisfazem `typeof v === 'number'` → `numeric`
  - Caso contrário → `categorical`
- Retornar array com classificação de tipo

## Casos de Borda (Atualizados)
- Dados vazios → mostrar "Nenhum dado para visualizar"
- Sem colunas numéricas → desabilitar seletor de métrica, mostrar aviso "Selecione uma métrica numérica"
- Sem colunas categóricas → desabilitar seletor de dimensão, mostrar aviso "Selecione uma dimensão categórica"
- Coluna única → ainda pode mostrar tabela, gráfico pode não funcionar
- Valores null/undefined → preservar nos dados; filtrar apenas no render do gráfico se Recharts exigir
- Todos os valores de uma coluna são null/undefined → classificar como `categorical` (indeterminado)

## Estilização
- Seguir tema MoniSUS branco/teal/slate existente
- Usar componente `Card` para container do painel
- Usar `Button` com `variant="outline"` para botões toggle
- Toggle ativo: `variant="default"` (teal)
- Container do gráfico: `h-[400px]` altura mínima
- Responsivo: empilhar controles verticalmente no mobile

## Checklist de Validação
- [ ] `npm run lint` passa
- [ ] `npm run build` passa
- [ ] TypeScript compila sem erros
- [ ] Teste manual do fluxo:
  1. Executar query → ver tabela
  2. Clicar "Visualizar" → ver painel de gráfico
  3. Trocar tipo de gráfico (barras → linha → pizza → tabela)
  4. Mudar dimensão/métrica → gráfico atualiza
  5. Clicar "Tabela" → voltar para tabela
  6. Executar nova query → visualização usa novos dados (reage à prop `data`)
  7. Resultado vazio → estado vazio gracioso
  8. Coluna única → sem crash
  9. Coluna com null/undefined mistos → classificação correta
  10. Coluna de datas → tratada como categórica, usável como dimensão em linha

## Arquivos a Criar
1. `frontend/components/explorer/column-selector.tsx`
2. `frontend/components/explorer/chart-renderer.tsx`
3. `frontend/components/explorer/visualization-panel.tsx`

## Arquivos a Modificar
1. `frontend/components/explorer/query-result.tsx`
2. `frontend/package.json` (adicionar recharts)

## Fora do Escopo
- Salvar visualizações
- Integração com dashboard
- Construtor de gráficos drag-and-drop
- Filtros avançados
- Mudanças no backend
- SQL builder visual
- Parser sofisticado de datas
- Persistência
- IA
- Novas bibliotecas além de recharts