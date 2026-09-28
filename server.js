const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase, getDatabaseStats, getMatchesForToday, getLatestUpdatedAt } = require('./src/db');
const { syncMatches } = require('./src/dataService');
const { startScheduler } = require('./src/scheduler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  const stats = getDatabaseStats();
  res.json({ ok: true, database: stats });
});

app.get('/api/games', async (req, res) => {
  try {
    const matches = getMatchesForToday();
    const lastUpdate = getLatestUpdatedAt();

    res.json({
      games: matches,
      lastUpdate,
      total: matches.length,
    });
  } catch (error) {
    console.error('Erro ao carregar jogos:', error);
    res.status(500).json({ error: 'Não foi possível carregar os jogos.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function bootstrap() {
  initDatabase();
  await syncMatches();
  startScheduler();

  app.listen(PORT, () => {
    console.log(`FutStats MOZ rodando em http://localhost:${PORT}`);
  });
}

bootstrap();
