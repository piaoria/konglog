# 콩돌 · 콩순

React + Vite + TypeScript 정적 페이지. Node 22.12 이상에서 `npm ci`, `npm run dev`로 실행합니다. 경로는 `/konglog/`입니다.

`npm run build`, `npm run typecheck`, `npm run lint`, `npm test`로 검증합니다. `node scripts/browser-check.mjs`는 로컬 Windows Chrome 화면을 검증하며 iPhone 실기 검증은 아닙니다.

현재 위치·활동·시간대의 갱신 파일은 `src/data.ts`의 `travelSnapshot` 한 곳입니다. `updatedAt`, `zone`, `clockLabel`, `place`, `status`를 현재 상태로 갱신합니다. 비행 중에는 `flight`에 현재 편명과 도착 예정 시각만 넣고, 지상·환승 상태에서는 `null`로 둡니다. 다음 도시·다음 편·일정 목록·미래 활동 전환 로직은 클라이언트에 넣지 않습니다. 시계와 귀국 예정 시각의 카운트다운은 매초 갱신합니다. 활동은 센서나 온라인 위치 조회 결과가 아닙니다.

메모·새 체중 등록은 저장소와 작성 코드 검증이 연결되지 않았습니다. 입력은 브라우저 메모리에만 있으며 저장 성공을 표시하지 않습니다. 기존 체중 기록은 `weightChallenge.records`에 있습니다. 검증 스크린샷·로그·참조·환경파일은 Git에서 제외합니다.

200일 영역은 `src/main.tsx`와 `index.html`의 주석에 보존했습니다. 시작일·기념일 데이터도 유지합니다. 폰트 라이선스와 출처는 `public/fonts`에 있습니다.

날씨는 Open-Meteo의 current 기온·체감온도·WMO 날씨코드·낮밤 값을 사용합니다. src/data.ts의 weatherLocations에는 승인된 현재 두 도시 중심 좌표만 두며, 여행 스냅샷 도시 변경 시 좌표도 함께 갱신합니다. 기기 GPS·구 단위 위치·이름·작성 코드는 보내지 않습니다. 요청은 페이지가 열릴 때 진행하고 실패 시 재시도할 수 있습니다. 출처 링크를 화면에 표시합니다.

## Supabase 연결과 작성 코드 등록

메모와 체중은 공개 조회합니다. 익명 직접 INSERT/UPDATE/DELETE와 관리자 RPC 실행은 허용하지 않습니다. 등록은 `konglog-write` Edge Function에서 작성 private 관리 테이블의 해시와 코드를 비교합니다. 4자리 코드는 간단한 작성자 구분이며 강한 인증이 아닙니다.

1. 새 konglog 프로젝트가 맞는지 확인한 뒤 `supabase/migrations`의 `konglog` migration을 검토·적용합니다. 초기 체중 등 실제 사용자 데이터는 별도 승인 후 이관합니다. SQL은 빈 테이블만 생성합니다. 기존 승인된 초기 체중은 화면의 기준 기록으로 유지하며, DB에 같은 날짜 기록이 있으면 DB 값이 우선합니다.
2. 프로젝트 URL과 publishable key를 `config/client.env.example` 기준으로 로컬 `.env.local` 및 사이트 빌드 환경에 설정합니다. `VITE_` 값은 최종 공개 번들에 포함됩니다. secret/service_role/DB 비밀번호를 넣지 않습니다.
3. 별도 서버 secrets 설정은 필요하지 않습니다. 허용 origin은 함수의 `https://piaoria.github.io`로 고정했습니다. 작성 코드는 secrets 대신 서버만 접근하는 `private.author_codes`의 bcrypt 해시로 관리합니다. 사용자가 `supabase/author-codes.example.sql`의 두 placeholder를 서로 다른 4자리 코드로 바꾸어 개인 SQL Editor에서 실행합니다. 실제 코드가 들어간 SQL을 Git·채팅·로그로 전달하지 않습니다. Supabase가 기본 제공하는 서버 키를 함수 내부에서만 사용하므로 새 키·DB 비밀번호 전달은 필요 없습니다.
4. `supabase/config.toml`의 JWT 검증 해제는 함수 내부 작성 코드 검증을 사용하기 위한 설정입니다. 함수는 `@supabase/server`의 관리자 클라이언트를 사용하며, 함수·키 설정 검토 후에만 배포합니다. CORS origin 검사는 작성 권한 검증을 대신하지 않습니다.
5. 관리자가 아닌 publishable key로 공개 SELECT만 되는지, 직접 쓰기·세 RPC가 거부되는지 실제 서버에서 검증합니다. 콩순 체중 등록 거부, 한국 자정 경계, 동일 날짜 upsert, 동시 요청 제한도 확인합니다. 현재 검증 범위와 코드 등록 대기 여부는 배포 작업 결과를 확인합니다.

DB의 지속성 있는 요청 제한은 IP HMAC별 15분 5회와 전체 1시간 30회입니다. 실패/성공/잘못된 요청도 모두 집계합니다. 원 IP·작성 코드는 저장하지 않습니다. 제한 자료는 후속 허용 요청에서 2일 경과분을 정리합니다. 글로벌 제한으로 분산 추측도 줄이지만 공격자가 정상 쓰기를 일시 차단할 수 있습니다. 실제 강한 접근 보호가 필요하면 Supabase Auth로 전환합니다.

체중 날짜는 DB가 `Asia/Seoul`로 결정하며 날짜별 한 행을 원자적으로 갱신합니다. 요청의 작성자·날짜는 신뢰하지 않습니다. 메모는 UUID로 중복 등록을 방지하고 최근 100개를 조회합니다. 공개 조회이므로 메모에 개인정보나 비밀을 쓰지 않도록 화면에서 알립니다. 등록 실패에는 내용이 유지되고, 등록 성공 뒤 조회 실패는 별도로 표시합니다.

`npm run test:edge`는 합성 코드와 DB 모킹으로 권한·오류·요청 제한 호출을 확인합니다. 실제 PostgreSQL 동시성/RLS와 Deno 런타임 검증을 대신하지 않습니다. 새 클라이언트 라이브러리 설치는 필요하지 않습니다.

2026-10-03 서버 적용: 관리 RPC는 SECURITY INVOKER로 실행되고 service_role만 private 스키마·필요 테이블 권한을 갖습니다. 함수 의존성은 @supabase/server 1.9.0으로 고정했습니다. 사이트 빌드의 URL/publishable key는 공개 앱 식별값으로 workflow에 설정합니다. 사용자 작성 코드는 코드 등록용 placeholder SQL을 통해 직접 등록해야 합니다.

Migration 파일은 공식 Supabase CLI 2.119.0의 `migration new konglog`로 생성한 `20261003141048_konglog.sql`입니다. 원격 적용은 별도 도구로 완료했으며 원격 migration history를 변경하지 않았습니다. 이후 CLI로 DB 변경을 배포하려면 먼저 원격 적용 버전과 로컬 파일의 대응을 확인해야 합니다.
