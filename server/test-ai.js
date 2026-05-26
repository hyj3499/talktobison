import OpenAI from "openai";
import dotenv from "dotenv";
import readline from "readline";
import { BISON_SYSTEM_PROMPT } from "./prompts.js";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 터미널 입력을 받기 위한 설정
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// 게임 상태 관리 변수들
let turnCount = 10;
const maxTurns = 10;
// 💡 대화 기록을 누적할 배열 (AI에게 이전 대화를 기억시키기 위함)
let conversationHistory = [
  { role: "system", content: BISON_SYSTEM_PROMPT }
];

console.log("\n==================================================");
console.log("🌋 게임 시작: 화산들소가 길을 막고 있다! 🌋");
console.log(`규칙: ${maxTurns}턴 안에 채팅으로 화산들소를 설득해 비키게 하세요.`);
console.log("==================================================\n");

function askUser() {
  if (turnCount <= 0) {
    console.log("\n💀 [GAME OVER] 10턴이 지났습니다. 들소가 뿔로 당신을 날려버렸습니다!");
    rl.close();
    return;
  }

  console.log(`\n[남은 기회: ${turnCount}/${maxTurns}]`);
  rl.question("나(Player): ", async (userInput) => {
    // 유저가 아무것도 입력 안 했을 때 처리
    if (!userInput.trim()) {
      console.log("들소 앞에서 멍하니 서있을 시간이 없습니다. 말 대답을 하세요!");
      askUser();
      return;
    }

// 1. 유저 입력을 대화 기록에 추가할 때 '현재 턴 정보'를 AI가 알 수 있게 몰래 같이 보냄
    const currentTurn = 11 - turnCount; // 1턴, 2턴... 계산
    const inputWithTurnInfo = `[현재 ${currentTurn}턴째 / 10턴째에 화산 폭발함] 플레이어의 행동: ${userInput}`;
    
    conversationHistory.push({ role: "user", content: inputWithTurnInfo });
    turnCount--; // 턴 차감

    try {
      console.log("\n🔄 화산들소가 생각 중입니다...");
      
      // 2. 누적된 대화 기록 전체를 AI에게 전달
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: conversationHistory,
      });

      const bisonReply = response.choices[0].message.content;

      console.log("\n🦬 화산들소: " + bisonReply);

      // 3. 들소의 답변도 대화 기록에 누적 (다음 턴에 들소가 기억하게 함)
      conversationHistory.push({ role: "assistant", content: bisonReply });

      // 4. 승리 조건 확인 ([CLEAR] 태그가 포함되었는가?)
      if (bisonReply.includes("[CLEAR]")) {
        console.log("\n🎉 [GAME CLEAR] 성공! 들소가 길을 비켜주었습니다! 당신은 살아남았습니다!");
        rl.close();
      } else {
        // 클리어하지 못했다면 다음 턴 진행
        askUser();
      }

    } catch (error) {
      console.error("에러 발생:", error);
      rl.close();
    }
  });
}

// 첫 번째 턴 시작
askUser();