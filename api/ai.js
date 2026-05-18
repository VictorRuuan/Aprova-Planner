const OPENAI_API_URL = "https://api.openai.com/v1/responses";

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}

function extractText(data) {
  if (typeof data?.output_text === "string") return data.output_text;

  const output = Array.isArray(data?.output) ? data.output : [];
  return output
    .flatMap((item) => (Array.isArray(item.content) ? item.content : []))
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");
}

function extractSources(data) {
  const output = Array.isArray(data?.output) ? data.output : [];
  const sources = output
    .flatMap((item) => {
      const actionSources = Array.isArray(item?.action?.sources)
        ? item.action.sources
        : [];
      const contentSources = Array.isArray(item?.content)
        ? item.content.flatMap((content) =>
            Array.isArray(content?.annotations) ? content.annotations : [],
          )
        : [];

      return [...actionSources, ...contentSources];
    })
    .map((source) => ({
      title: source?.title || source?.url || "Fonte consultada",
      url: source?.url,
    }))
    .filter((source) => source.url);

  return [...new Map(sources.map((source) => [source.url, source])).values()];
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    return sendJson(response, 405, { error: "Metodo nao permitido." });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return sendJson(response, 500, {
      error:
        "Configure a variavel OPENAI_API_KEY no ambiente local ou na Vercel.",
    });
  }

  const { prompt, webSearch } = request.body ?? {};

  if (!prompt || typeof prompt !== "string") {
    return sendJson(response, 400, { error: "Envie um prompt valido." });
  }

  try {
    const openAiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5.2",
        instructions:
          "Voce e um assistente de estudos para concursos publicos no Brasil. Pesquise fontes oficiais e confiaveis quando a busca web estiver disponivel. Responda em portugues do Brasil, com orientacoes praticas, objetivas e organizadas. Quando nao encontrar edital ou conteudo programatico oficial, deixe isso claro e separe inferencias de fatos confirmados.",
        input: prompt,
        tools: webSearch
          ? [
              {
                type: "web_search",
                user_location: {
                  type: "approximate",
                  country: "BR",
                  timezone: "America/Sao_Paulo",
                },
              },
            ]
          : undefined,
        tool_choice: webSearch ? "auto" : undefined,
        include: webSearch ? ["web_search_call.action.sources"] : undefined,
      }),
    });

    const rawData = await openAiResponse.text();
    let data = {};

    try {
      data = rawData ? JSON.parse(rawData) : {};
    } catch {
      return sendJson(response, 502, {
        error: "A OpenAI retornou uma resposta invalida.",
      });
    }

    if (!openAiResponse.ok) {
      return sendJson(response, openAiResponse.status, {
        error:
          data?.error?.message ||
          "Nao foi possivel gerar a resposta da IA agora.",
      });
    }

    return sendJson(response, 200, {
      answer: extractText(data) || "Nao recebi uma resposta em texto da IA.",
      sources: extractSources(data),
    });
  } catch (error) {
    return sendJson(response, 500, {
      error:
        error instanceof Error
          ? error.message
          : "Erro inesperado ao chamar a IA.",
    });
  }
}
