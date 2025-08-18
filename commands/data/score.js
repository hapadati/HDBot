import fs from 'fs';
import path from 'path';

const FILE_PATH = path.resolve('./data/leaderboard.json');

export function updateScore(guildId, userId, isCorrect) {
  let data = {};
  try {
    if (fs.existsSync(FILE_PATH)) {
      data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
    }
  } catch {
    data = {};
  }

  if (!data[guildId]) data[guildId] = {};
  if (!data[guildId][userId]) data[guildId][userId] = { correct: 0, attempts: 0 };

  data[guildId][userId].attempts += 1;
  if (isCorrect) {
    data[guildId][userId].correct += 1;
  }

  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}
