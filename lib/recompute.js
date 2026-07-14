const { tursoAll } = require('./db');
const { computeAll } = require('./engine');

async function loadEverything() {
  const [players, leagues, results] = await Promise.all([
    tursoAll('SELECT * FROM players ORDER BY name'),
    tursoAll('SELECT * FROM leagues ORDER BY order_index'),
    tursoAll('SELECT * FROM league_results'),
  ]);
  return { players, leagues, results };
}

async function recomputeAll() {
  const data = await loadEverything();
  return { ...data, computed: computeAll(data) };
}

module.exports = { loadEverything, recomputeAll };
