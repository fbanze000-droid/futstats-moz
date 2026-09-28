# FutStats MOZ

Sistema automatizado de análise de futebol com atualização diária, backend, banco de dados e frontend moderno.

## Tecnologias
- Node.js + Express
- SQLite com better-sqlite3
- Cron para atualização automática às 00:00
- Frontend estático em HTML/CSS/JS

## Estrutura
- `server.js` - servidor principal
- `src/db.js` - conexões e schema do banco
- `src/dataService.js` - lógica de sincronização e geração de dados
- `src/scheduler.js` - agendamento da atualização diária
- `public/index.html` - interface do site
- `data/` - banco SQLite e arquivos persistentes

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Inicie a aplicação:
   ```bash
   npm start
   ```

3. Acesse:
   ```bash
   http://localhost:3000
   ```

## Atualização automática
- A aplicação verifica e sincroniza os dados diariamente às 00:00.
- Se não houver API externa configurada, usa um mode de demonstração gerado automaticamente.

## Variáveis de ambiente
- `PORT` - porta da aplicação (opcional)
- `FOOTBALL_API_URL` - endpoint externo de dados
- `FOOTBALL_API_KEY` - chave de acesso externa

## Observação
Este projeto é uma base automatizada para análise esportiva e pode ser integrado a APIs reais de futebol para dados em produção.
