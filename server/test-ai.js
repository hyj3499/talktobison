import OpenAI from "openai";
import dotenv from "dotenv";
import { BISON_SYSTEM_PROMPT } from "./prompts.js"; // 👈 분리한 프롬프트를 가져옴

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { 
          role: "system", 
          content: BISON_SYSTEM_PROMPT // 👈 하드코딩 대신 변수 입력
        },
        { 
          role: "user", 
          // 아래 텍스트를 바꿔가며 들소를 설득해 보세요!
          content: "저기, 내가 엄청 시원한 얼음 풀을 가져왔는데, 길 좀 비켜주면 이거 줄게." 
        }
      ],
    });

    const bisonReply = response.choices[0].message.content;
    console.log("=== 화산들소의 반응 ===");
    console.log(bisonReply);
    console.log("=======================");

    // 승리 조건 체크 로직
    if (bisonReply.includes("[CLEAR]")) {
      console.log("🎉 승리! 들소가 길을 비켜주었습니다!");
    } else {
      console.log("❌ 들소가 아직 길을 비키지 않았습니다. 다시 설득해 보세요.");
    }

  } catch (error) {
    console.error("에러가 발생했습니다:", error);
  }
}

main();