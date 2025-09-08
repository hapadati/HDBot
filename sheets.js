import { google } from 'googleapis';
import fs from 'fs';

const sheetsConfigPath = '/etc/secrets/service-account.json'; // Secret File
const sheetsConfig = JSON.parse(fs.readFileSync(sheetsConfigPath, 'utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials: sheetsConfig,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

export const sheets = google.sheets({ version: 'v4', auth });
