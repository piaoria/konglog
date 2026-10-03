import { withSupabase } from 'npm:@supabase/server@1.9.0';

export default {
  fetch: withSupabase({ auth: 'none' }, async (req, { supabaseAdmin }) => {
    const headers = { 'Access-Control-Allow-Origin': 'https://piaoria.github.io', 'Access-Control-Allow-Headers': 'apikey, content-type', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Cache-Control': 'no-store' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (req.method !== 'GET' || new URL(req.url).search) return Response.json({ message: '지원하지 않는 요청입니다.' }, { status: 400, headers });
    try {
      const [home, travel] = await Promise.all([
        supabaseAdmin.from('home_status').select('status').eq('singleton', true).single(),
        supabaseAdmin.rpc('get_current_travel'),
      ]);
      if (home.error || travel.error) return Response.json({ message: '현재 상태를 불러오지 못했습니다.' }, { status: 503, headers });
      // No schedule rows, period boundaries, IDs, or caller-selected date.
      const snapshot = travel.data;
      const currentTravel = snapshot ? {
        place: snapshot.place, zone: snapshot.zone, clockLabel: snapshot.clockLabel, status: snapshot.status,
      } : null;
      return Response.json({ homeStatus: home.data.status, travel: currentTravel }, { headers });
    } catch {
      return Response.json({ message: '현재 상태를 불러오지 못했습니다.' }, { status: 503, headers });
    }
  }),
};
