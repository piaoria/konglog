export const page = {
  title: '다시 같은 시간에',
  homeStatus: '⚾ 야구 보는 중',
  startDate: '2026-03-18',
  anniversaryDate: '2026-10-03',
  arrival: '2026-10-19T10:55:00+09:00',
  reunited: false, // 실제 만난 뒤 직접 변경합니다.
  closed: false, // 표시 상태만 변경하며 파일을 삭제하거나 보호하지 않습니다.
  people: { home: { name: '콩돌', zone: 'Asia/Seoul', photo: null as string | null }, away: { name: '콩순', photo: null as string | null } },
  memo: { heading: '메모' },
};
// 갱신 시 이 현재 상태만 바꿉니다. 다음 도시나 이후 활동은 넣지 않습니다.
export const travelSnapshot = {
  updatedAt: '2026-10-03T05:52:57Z',
  zone: 'Europe/Madrid',
  clockLabel: '바르셀로나 시간',
  place: '바르셀로나',
  status: '바르셀로나에서 하루 시작 ☀️',
  // 비행 중인 시점의 스냅샷에만 현재 편명과 도착 예정 시각을 넣습니다.
  flight: null as { number: string; arrival: string } | null,
};

export const weightChallenge = {
  target: 76,
  records: [{ date: '2026-10-02', kg: 78.25 }],
};

// 승인된 현재 도시 중심 좌표만 사용합니다. 현재 도시 변경 시 이 좌표도 함께 갱신합니다.
export const weatherLocations = [{ latitude: 37.5665, longitude: 126.978 }, { latitude: 41.3874, longitude: 2.1686 }];
