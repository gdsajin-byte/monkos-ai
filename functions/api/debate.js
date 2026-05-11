export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  try {
    const body = await context.request.json();
    const { messages = [], next_speaker = "auto", config = {} } = body;

    const agent1 = config.agent1 || { name: "에이전트1", model: "@cf/google/gemma-3-12b-it" };
    const agent2 = config.agent2 || { name: "에이전트2", model: "@cf/qwen/qwen2.5-coder-32b-instruct" };
    const maxRounds = config.max_rounds || 3;

    const speaker = resolveSpeaker(messages, next_speaker, agent1, agent2);
    const round = countRounds(messages, speaker.name, agent1.name, agent2.name);
    const done = round > maxRounds;

    if (done) {
      return new Response(JSON.stringify({
        speaker: speaker.name,
        message: "",
        next_auto: false,
        round: maxRounds,
        done: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isFinalRound = round === maxRounds;
    const systemPrompt = buildSystemPrompt(speaker, agent1, agent2, isFinalRound);
    const aiMessages = buildAiMessages(systemPrompt, messages, speaker.name, agent1.name, agent2.name);

    const response = await context.env.AI.run(speaker.model, { messages: aiMessages });
    const text = response.response || response.result || "";

    const opponentName = speaker.name === agent1.name ? agent2.name : agent1.name;
    const lastIsAgent = messages.length > 0 && (
      messages[messages.length - 1].role === "agent1" ||
      messages[messages.length - 1].role === "agent2"
    );

    return new Response(JSON.stringify({
      speaker: speaker.name,
      message: text.trim(),
      next_auto: !done && round <= maxRounds,
      round,
      done: false,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function resolveSpeaker(messages, nextSpeaker, agent1, agent2) {
  if (nextSpeaker === "agent1") return agent1;
  if (nextSpeaker === "agent2") return agent2;

  const agentMessages = messages.filter(m => m.role === "agent1" || m.role === "agent2");
  if (agentMessages.length === 0) return agent1;

  const last = agentMessages[agentMessages.length - 1];
  return last.role === "agent1" ? agent2 : agent1;
}

function countRounds(messages, speakerName, a1Name, a2Name) {
  let count = 0;
  for (const m of messages) {
    if (m.role === "agent1" && a1Name === speakerName) count++;
    if (m.role === "agent2" && a2Name === speakerName) count++;
  }
  return count + 1;
}

function buildSystemPrompt(speaker, agent1, agent2, isFinalRound) {
  const opponentName = speaker.name === agent1.name ? agent2.name : agent1.name;
  let prompt = `당신은 토론 참가자입니다.
이름: ${speaker.name}
상대: ${opponentName}
규칙:
- 상대 발언을 인용한 뒤 반론 (근거 필수)
- 근거 없는 동의 금지
- 2~5문장으로 간결하게
- 사람(작가님)이 질문하면 토론보다 우선 응답
- 한국어로 대답`;

  if (isFinalRound) {
    prompt += `\n- 이번이 최종 라운드입니다. 합의점과 미결 사항을 정리하세요.`;
  }
  return prompt;
}

function buildAiMessages(systemPrompt, messages, speakerName, a1Name, a2Name) {
  const aiMsgs = [{ role: "system", content: systemPrompt }];

  for (const m of messages) {
    if (m.role === "system") {
      aiMsgs.push({ role: "user", content: `[주제] ${m.content}` });
    } else if (m.role === "human") {
      aiMsgs.push({ role: "user", content: `[작가님] ${m.content}` });
    } else if (m.role === "agent1") {
      const isMe = a1Name === speakerName;
      aiMsgs.push({
        role: isMe ? "assistant" : "user",
        content: isMe ? m.content : `[${a1Name}] ${m.content}`,
      });
    } else if (m.role === "agent2") {
      const isMe = a2Name === speakerName;
      aiMsgs.push({
        role: isMe ? "assistant" : "user",
        content: isMe ? m.content : `[${a2Name}] ${m.content}`,
      });
    }
  }

  if (aiMsgs.length === 1) {
    aiMsgs.push({ role: "user", content: "토론을 시작해 주세요. 주제에 대한 당신의 입장을 밝히세요." });
  }

  return aiMsgs;
}
