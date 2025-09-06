// logger.mjs
import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  keyFile: "/etc/secrets/service-account.json",
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = "DiscordBotLog";

// 共通ログ関数
export async function logToSheets({
  serverId = "",
  userId = "",
  channelId = "",
  level = "",
  timestamp = "",   // 呼び出し元から渡す
  cmd = "",
  message = "",
}) {
  try {
    const values = [[
      serverId,   // A: ServerID
      userId,     // B: UserID
      channelId,  // C: ChannelID
      level,      // D: Level
      timestamp,  // E: Timestamp (呼び出し元の値)
      cmd,        // F: Cmd
      message,    // G: Message
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    console.log(`[LOGGED] ${level}: ${cmd} ${message}`);
  } catch (err) {
    console.error("Failed to write log to Sheets:", err.message);
  }
}
