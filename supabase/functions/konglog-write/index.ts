import { withSupabase } from 'npm:@supabase/server@1.9.0';

const encoder = new TextEncoder();
async function digest(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, { supabaseAdmin }) => {
    const origin = 'https://piaoria.github.io';
    const headers = { 'Access-Control-Allow-Origin': origin ?? '', 'Access-Control-Allow-Headers': 'apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
    const reply = (message: string, status: number) => Response.json({ message }, { status, headers });
    if (!origin) return reply('서버 설정이 필요합니다.', 503);
    if (req.headers.get('origin') !== origin) return reply('허용되지 않은 요청입니다.', 403);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'POST') return reply('지원하지 않는 요청입니다.', 405);
    // Supabase provides this server key automatically; never copy it to VITE_.
    const pepper = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!pepper) return reply('서버 설정이 필요합니다.', 503);
    try {
      // IP never reaches public tables or logs. Global quota also applies when
      // proxy headers are absent or spoofed; CORS itself is not authorization.
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
      const ipHash = Array.from(await digest(ip, pepper), byte => byte.toString(16).padStart(2, '0')).join('');
      const { data: allowed, error: limitError } = await supabaseAdmin.rpc('consume_write_budget', { ip_digest: ipHash });
      if (limitError) return reply('등록을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.', 503);
      if (!allowed) return reply('입력 시도가 많습니다. 잠시 후 다시 시도해주세요.', 429);
      if (!req.headers.get('content-type')?.includes('application/json')) return reply('잘못된 요청입니다.', 400);
      if (Number(req.headers.get('content-length')) > 12000) return reply('내용이 너무 깁니다.', 413);
      // Bound the streamed body too: Content-Length is not trusted.
      const reader = req.body?.getReader();
      if (!reader) return reply('잘못된 요청입니다.', 400);
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 12000) { await reader.cancel(); return reply('내용이 너무 깁니다.', 413); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const input = JSON.parse(new TextDecoder().decode(bytes));
      if (typeof input.code !== 'string' || !/^[0-9]{4}$/.test(input.code)) return reply('작성 코드를 확인해주세요.', 403);
      const { data: author, error: authorError } = await supabaseAdmin.rpc('verify_author_code', { submitted_code: input.code });
      if (authorError) return reply('작성 확인을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.', 503);
      if (author !== 'kongdol' && author !== 'kongsun') return reply('작성 코드를 확인해주세요.', 403);
      if (input.kind === 'memo') {
        if (input.author !== author) return reply('이 메모의 작성 코드를 확인해주세요.', 403);
        if (typeof input.content !== 'string' || !input.content.trim() || Array.from(input.content.trim()).length > 2000 || typeof input.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.id) || typeof input.date !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(input.date)) return reply('메모 내용을 확인해주세요.', 400);
        const { error } = await supabaseAdmin.rpc('save_today_memo', { memo_author: author, memo_content: input.content.trim(), request_id: input.id, expected_date: input.date });
        if (error?.code === '22023') return reply('한국 날짜가 바뀌었어요. 날짜를 확인하고 다시 보내주세요.', 409);
        return error ? reply('등록을 처리할 수 없습니다. 다시 시도해주세요.', 503) : reply('메모를 저장했습니다.', 200);
      }
      if (input.kind === 'home_status') {
        if (author !== 'kongdol') return reply('콩돌만 상태를 바꿀 수 있습니다.', 403);
        if (!['baseball', 'sleep', 'eating', 'resume', 'certificate', 'running', 'exercising'].includes(input.status)) return reply('상태를 확인해주세요.', 400);
        const { error } = await supabaseAdmin.rpc('save_home_status', { status_value: input.status });
        return error ? reply('상태를 저장하지 못했습니다. 다시 시도해주세요.', 503) : reply('상태를 저장했습니다.', 200);
      }
      if (input.kind === 'weight') {
        if (author !== 'kongdol') return reply('콩돌만 체중을 등록할 수 있습니다.', 403);
        if (typeof input.kg !== 'number' || !Number.isFinite(input.kg) || input.kg <= 0 || input.kg >= 1000) return reply('체중을 확인해주세요.', 400);
        const { error } = await supabaseAdmin.rpc('save_today_weight', { weight_kg: input.kg });
        return error ? reply('등록을 처리할 수 없습니다. 다시 시도해주세요.', 503) : reply('오늘의 체중을 등록했습니다.', 200);
      }
      return reply('잘못된 요청입니다.', 400);
    } catch {
      // Never log request bodies, author codes, or provider error objects.
      return reply('요청을 처리할 수 없습니다. 내용을 확인하고 다시 시도해주세요.', 400);
    }
  }),
};
