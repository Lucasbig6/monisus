# Plano: Tornar o Frontend MoniSUS Responsivo

## Visão Geral
Tornar a aplicação responsiva para qualquer tamanho de tela usando abordagem mobile-first com breakpoints padrão do Tailwind CSS (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px).

## Decisões Principais
1. **Breakpoints**: Tailwind defaults (mobile-first)
2. **Sidebar**: Drawer lateral (slide-over) no mobile/tablet (< lg), sidebar fixa no desktop (>= lg)
3. **Tabelas de dados**: Layout de cards empilhados no mobile, tabela tradicional no desktop
4. **Editor SQL**: Altura flexível no mobile, altura fixa (400px) no desktop
5. **Header**: Nome do usuário oculto no mobile, visível a partir de md

---

## Tarefas de Implementação

### 1. Sidebar Responsiva (`components/layout/sidebar.tsx`)
- [ ] Adicionar state para controlar abertura/fechamento do drawer no mobile
- [ ] Adicionar backdrop overlay quando drawer aberto no mobile
- [ ] Mostrar botão de hambúrguer no header para abrir sidebar no mobile
- [ ] Sidebar fixa (w-80/w-16) apenas em `lg:` e acima
- [ ] Drawer full-height no mobile com `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform`
- [ ] Fechar drawer ao clicar em link de navegação ou no backdrop

### 2. Header Responsivo (`components/layout/header.tsx`)
- [ ] Adicionar botão de menu (hambúrguer) visível apenas em `< lg`
- [ ] Ocultar nome do usuário no mobile (`hidden md:block` já existe, manter)
- [ ] Props para receber callback de toggle da sidebar

### 3. AppShell Responsivo (`components/layout/app-shell.tsx`)
- [ ] Gerenciar estado da sidebar aberta/fechada no mobile
- [ ] Renderizar backdrop quando sidebar aberta no mobile
- [ ] Passar callbacks para Header e Sidebar
- [ ] Remover `h-screen` fixo, usar `min-h-screen` para permitir scroll

### 4. Página Início (`app/(authenticated)/inicio/page.tsx`)
- [ ] Grid de ações rápidas: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (já está correto)
- [ ] Ajustar padding: `px-4 sm:px-6 lg:px-8`
- [ ] Busca: stack vertical no mobile, horizontal no desktop
- [ ] Seção "Comece por aqui": stack vertical no mobile

### 5. Página Explorar (`app/(authenticated)/explorar/page.tsx`)
- [ ] Container: `px-4 sm:px-6 lg:px-8`
- [ ] Seções empilhadas verticalmente no mobile
- [ ] Selector de dataset: width full no mobile
- [ ] Cards de colunas: `flex-wrap` já está correto

### 6. Dataset Selector (`components/explorer/dataset-selector.tsx`)
- [ ] Select full width no mobile (`w-full`)
- [ ] Label empilhado acima do select no mobile

### 7. SQL Editor (`components/explorer/sql-editor.tsx`)
- [ ] Altura: `h-[300px] sm:h-[400px] lg:h-[500px]` (flexível)
- [ ] Padding interno responsivo
- [ ] Botão executar: full width no mobile, auto no desktop
- [ ] Fonte: `text-sm sm:text-base` no editor

### 8. Query Result / Tabela (`components/explorer/query-result.tsx`)
- [ ] **Mobile (< lg)**: Layout de cards - cada linha vira um card com label/valor
- [ ] **Desktop (>= lg)**: Tabela tradicional (comportamento atual)
- [ ] Paginação: botões full width no mobile, inline no desktop
- [ ] Scroll horizontal apenas se necessário no desktop

### 9. Página Login (`app/(public)/login/page.tsx`)
- [ ] Já está responsivo (max-w-sm, px-4)
- [ ] Verificar se precisa de ajustes menores

### 10. Globals CSS (`app/globals.css`)
- [ ] Adicionar utilitários para scrollbar customizada no mobile
- [ ] Garantir `html, body { @apply min-h-screen }`

---

## Detalhes Técnicos

### Breakpoints Tailwind Utilizados
- `sm:` 640px - Tablets pequenos / Mobile landscape
- `md:` 768px - Tablets
- `lg:` 1024px - Desktop pequeno (sidebar fixa inicia aqui)
- `xl:` 1280px - Desktop
- `2xl:` 1536px - Desktop grande

### Padrão de Drawer Mobile
```tsx
// No AppShell
{isMobileSidebarOpen && (
  <div 
    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
    onClick={closeSidebar}
    aria-hidden="true"
  />
)}
<Sidebar isOpen={isMobileSidebarOpen} onClose={closeSidebar} />
```

### Layout de Cards para Tabela (Mobile)
```tsx
// QueryResult - Mobile
{data.map((row, i) => (
  <div key={i} className="lg:hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm mb-3">
    {columns.map((col) => (
      <div key={col} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
        <span className="text-xs font-medium text-slate-500 uppercase">{col}</span>
        <span className="text-sm text-slate-900 font-mono">{row[col] ?? '—'}</span>
      </div>
    ))}
  </div>
))}
// Desktop table mantido com lg:block hidden
```

---

## Ordem de Execução Recomendada

1. **AppShell + Sidebar + Header** (core layout) - devem ser feitos juntos
2. **Páginas principais** (inicio, explorar) - ajustes de container/padding
3. **Componentes de dados** (dataset-selector, sql-editor, query-result)
4. **Login** - verificação final
5. **Testes visuais** em diferentes breakpoints

---

## Validação

### Checklist de Testes
- [ ] Mobile (375px): Sidebar abre como drawer, tabelas viram cards, editor altura reduzida
- [ ] Tablet (768px): Sidebar drawer, layout intermediário
- [ ] Desktop (1024px+): Sidebar fixa, tabelas tradicionais, editor altura padrão
- [ ] Navegação: Links fecham drawer no mobile
- [ ] Backdrop: Clique fora fecha drawer
- [ ] Scroll: Página scrollável no mobile quando drawer aberta
- [ ] Orientação: Landscape/portrait funcionando

### Comandos de Verificação
```bash
cd frontend
npm run lint
npm run build
npm run dev  # Testar visualmente
```

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Monaco Editor não redimensiona bem | `automaticLayout: true` já configurado, testar resize |
| Tabelas complexas no mobile | Limitar colunas exibidas no card mobile, "Ver mais" se necessário |
| Z-index conflicts | Usar escala consistente: backdrop z-40, sidebar z-50, header z-30 |
| Performance com muitos dados | Paginação já implementada (10 itens/página) |

---

## Fora de Escopo
- Temas dark/light (já implementado)
- Internacionalização
- Testes automatizados (Cypress/Playwright)
- PWA/Offline support