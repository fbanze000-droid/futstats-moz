const { upsertMatches, logSync } = require('./db');

function buildDemoMatches() {
  const today = new Date().toISOString().slice(0, 10);

  return [
    {
      id: 'demo-brasileirao-1',
      league: 'Campeonato Brasileiro',
      country: 'Brasil',
      match_key: 'brasileirao',
      match_date: today,
      kickoff_time: '19:00',
      home_team: 'Flamengo',
      away_team: 'Palmeiras',
      home_emoji: '🔴',
      away_emoji: '🌴',
      home_form: 'V V E V V',
      away_form: 'V E V V E',
      xg_home: 1.78,
      xg_away: 1.24,
      home_win: 52,
      draw: 26,
      away_win: 22,
      over25: 64,
      btts: 58,
      market: 'winner',
      recommendation: 'Flamengo vence',
      confidence: 52,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'demo',
      status: 'scheduled',
    },
    {
      id: 'demo-premier-1',
      league: 'Premier League',
      country: 'Inglaterra',
      match_key: 'premier',
      match_date: today,
      kickoff_time: '16:00',
      home_team: 'Manchester City',
      away_team: 'Arsenal',
      home_emoji: '🔵',
      away_emoji: '🔴',
      home_form: 'V V V E V',
      away_form: 'V V E V E',
      xg_home: 1.91,
      xg_away: 1.48,
      home_win: 48,
      draw: 25,
      away_win: 27,
      over25: 75,
      btts: 69,
      market: 'goals',
      recommendation: 'Mais de 2.5 gols',
      confidence: 75,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'demo',
      status: 'scheduled',
    },
    {
      id: 'demo-laliga-1',
      league: 'La Liga',
      country: 'Espanha',
      match_key: 'laliga',
      match_date: today,
      kickoff_time: '17:30',
      home_team: 'Real Madrid',
      away_team: 'Sevilla',
      home_emoji: '👑',
      away_emoji: '⚪',
      home_form: 'V V V V E',
      away_form: 'E D V D E',
      xg_home: 2.08,
      xg_away: 0.78,
      home_win: 72,
      draw: 17,
      away_win: 11,
      over25: 61,
      btts: 43,
      market: 'winner',
      recommendation: 'Real Madrid vence',
      confidence: 72,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'demo',
      status: 'scheduled',
    },
  ];
}

async function fetchExternalMatches() {
  const apiUrl = process.env.FOOTBALL_API_URL;
  const apiKey = process.env.FOOTBALL_API_KEY;

  if (!apiUrl || !apiKey) {
    return buildDemoMatches();
  }

  const response = await fetch(`${apiUrl}?apikey=${apiKey}`);

  if (!response.ok) {
    throw new Error('API externa indisponível');
  }

  const payload = await response.json();

  if (!payload || !Array.isArray(payload.matches)) {
    return buildDemoMatches();
  }

  return payload.matches.map((match) => ({
    id: String(match.id || `${match.homeTeam}-${match.awayTeam}-${Date.now()}`),
    league: match.league || 'Campeonato Internacional',
    country: match.country || 'Internacional',
    match_key: match.key || 'other',
    match_date: match.match_date || new Date().toISOString().slice(0, 10),
    kickoff_time: match.kickoff_time || '20:00',
    home_team: match.home_team || match.home || 'Casa',
    away_team: match.away_team || match.away || 'Fora',
    home_emoji: match.home_emoji || '⚽',
    away_emoji: match.away_emoji || '⚽',
    home_form: match.home_form || 'N/A',
    away_form: match.away_form || 'N/A',
    xg_home: Number(match.xg_home || 1.0),
    xg_away: Number(match.xg_away || 1.0),
    home_win: Number(match.home_win || 50),
    draw: Number(match.draw || 25),
    away_win: Number(match.away_win || 25),
    over25: Number(match.over25 || 50),
    btts: Number(match.btts || 50),
    market: match.market || 'winner',
    recommendation: match.recommendation || 'Seleção estatística',
    confidence: Number(match.confidence || 50),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    source: 'external',
    status: match.status || 'scheduled',
  }));
}

async function syncMatches() {
  const startedAt = new Date().toISOString();

  try {
    const matches = await fetchExternalMatches();
    upsertMatches(matches);

    const finishedAt = new Date().toISOString();
    logSync(startedAt, finishedAt, 'success', 'Sincronização concluída', 'daily-sync');

    return { success: true, count: matches.length };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    logSync(startedAt, finishedAt, 'error', error.message, 'daily-sync');

    const fallback = buildDemoMatches();
    upsertMatches(fallback);

    return { success: false, count: fallback.length, error: error.message };
  }
}

module.exports = {
  syncMatches,
  buildDemoMatches,
};
