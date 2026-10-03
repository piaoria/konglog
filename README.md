# 콩돌 · 콩순

React + Vite + TypeScript 정적 페이지. Node 22.12 이상에서 `npm ci`, `npm run dev`로 실행합니다. 경로는 `/konglog/`입니다.

`npm run build`, `npm run typecheck`, `npm run lint`, `npm test`로 검증합니다. `node scripts/browser-check.mjs`는 로컬 Windows Chrome 화면을 검증하며 iPhone 실기 검증은 아닙니다.

현재 위치·활동·시간대의 갱신 파일은 `src/data.ts`의 `travelSnapshot` 한 곳입니다. `updatedAt`, `zone`, `clockLabel`, `place`, `status`를 현재 상태로 갱신합니다. 비행 중에는 `flight`에 현재 편명과 도착 예정 시각만 넣고, 지상·환승 상태에서는 `null`로 둡니다. 다음 도시·다음 편·일정 목록·미래 활동 전환 로직은 클라이언트에 넣지 않습니다. 시계와 귀국 예정 시각의 카운트다운은 매초 갱신합니다. 활동은 센서나 온라인 위치 조회 결과가 아닙니다.

메모·새 체중 등록은 저장소와 작성 코드 검증이 연결되지 않았습니다. 입력은 브라우저 메모리에만 있으며 저장 성공을 표시하지 않습니다. 기존 체중 기록은 `weightChallenge.records`에 있습니다. 검증 스크린샷·로그·참조·환경파일은 Git에서 제외합니다.

200일 영역은 `src/main.tsx`와 `index.html`의 주석에 보존했습니다. 시작일·기념일 데이터도 유지합니다. 폰트 라이선스와 출처는 `public/fonts`에 있습니다.

날씨는 Open-Meteo의 current 기온·체감온도·WMO 날씨코드·낮밤 값을 사용합니다. src/data.ts의 weatherLocations에는 승인된 현재 두 도시 중심 좌표만 두며, 여행 스냅샷 도시 변경 시 좌표도 함께 갱신합니다. 기기 GPS·구 단위 위치·이름·작성 코드는 보내지 않습니다. 요청은 페이지가 열릴 때 진행하고 실패 시 재시도할 수 있습니다. 출처 링크를 화면에 표시합니다.
