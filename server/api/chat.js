import OpenAI from "openai";
import dotenv from "dotenv";
import { BISON_SYSTEM_PROMPT } from "../prompts.js"; // 경로 주의 (한 단계 위)

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Vercel 서버리스 함수 핸들러
export default async function handler(req, res) {
  // 1. CORS 설정을 위한 헤더 추가 (프론트엔드와 통신 허용)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 브라우저가 통신 전 미리 보내는 OPTIONS 요청 처리
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // POST 요청만 허용
  if (req.method !== "POST") {
    return res.status(455).json({ error: "Method Not Allowed" });
  }

  try {
    const { userInput, conversationHistory } = req.body;

    let history = [...conversationHistory];
    if (history.length === 0) {
      history.push({ role: "system", content: BISON_SYSTEM_PROMPT });
    }

    const userMessagesCount = history.filter(m => m.role === "user").length + 1;

    let turnInstruction = "";
    if ([1, 4, 7, 9].includes(userMessagesCount)) {
      turnInstruction = " [시스템 명령: 묘사 내용에 화산들소 등 위의 화산이 끓어오르고 점점 뜨거워지는 상태를 반드시 포함해라.]";
    } else {
      turnInstruction = " [시스템 명령: 이번 묘사에서는 등 위의 화산에 대해서는 절대 언급하지 마라.]";
    }

    const processedUserInput = `[현재 ${userMessagesCount}턴/10턴] 플레이어 행동: ${userInput}${turnInstruction}`;
    history.push({ role: "user", content: processedUserInput });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: history,
    });

    const bisonReply = response.choices[0].message.content;
    history.push({ role: "assistant", content: bisonReply });

    let gameStatus = "CONTINUE";
    if (bisonReply.includes("[CLEAR]")) {
      gameStatus = "CLEAR";
    } else if (bisonReply.includes("[GAMEOVER]")) {
      gameStatus = "GAMEOVER";
    } else if (userMessagesCount >= 10) {
      gameStatus = "TIMEOUT";
    }

    // 결과 반환
    return res.status(200).json({
      bisonReply,
      updatedHistory: history,
      gameStatus,
      currentTurn: userMessagesCount
    });

  } catch (error) {
    console.error("서버리스 에러 발생:", error);
    return res.status(500).json({ error: "화산들소 서버 처리 중 오류가 발생했습니다." });
  }
}