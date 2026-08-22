export type LinkProbeResult = {
  httpStatus: number;
  veredicto: "ok" | "erro" | "nao_verificavel";
  mensagem: string;
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export function isManychatUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("manychat.com");
  } catch {
    return false;
  }
}

export function classifyHttpStatus(
  httpStatus: number,
  url: string,
): LinkProbeResult {
  if (httpStatus === 0) {
    return {
      httpStatus: 0,
      veredicto: "erro",
      mensagem: "Falha de rede ou timeout",
    };
  }

  if (httpStatus >= 200 && httpStatus < 300) {
    return {
      httpStatus,
      veredicto: "ok",
      mensagem: `HTTP ${httpStatus}`,
    };
  }

  // ManyChat e auth walls: 401/403/302 não são erro definitivo
  if (
    isManychatUrl(url) ||
    httpStatus === 401 ||
    httpStatus === 403 ||
    httpStatus === 302
  ) {
    return {
      httpStatus,
      veredicto: "nao_verificavel",
      mensagem: `HTTP ${httpStatus} · não verificável automaticamente`,
    };
  }

  return {
    httpStatus,
    veredicto: "erro",
    mensagem: `HTTP ${httpStatus}`,
  };
}

export async function probeUrl(url: string): Promise<LinkProbeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      cache: "no-store",
    });

    return classifyHttpStatus(response.status, url);
  } catch {
    return classifyHttpStatus(0, url);
  } finally {
    clearTimeout(timeout);
  }
}
