# 심리학 실험용 웹 기반 AI 선택 플랫폼 설계 문서

## 커버스토리
- 참가자에게는 **“새로운 학습 플랫폼 시범 평가”**로 안내한다.
- 문항을 풀다가 필요할 때만 **AI 힌트 보기** 버튼을 통해 힌트를 열 수 있다.

## 랜덤화 규칙
1. **조건(condition) 배정**
   - `hint-available`, `hint-optional` 두 가지 조건 중 하나를 무작위로 선택한다.
   - 조건은 참가자 ID 입력 후 실험 시작 시 한 번만 결정된다.
2. **문항 순서**
   - 모든 문항(trials)을 Fisher–Yates 셔플로 무작위 섞는다.
   - 섞인 순서는 참가자가 모든 문항을 완료할 때까지 유지된다.

## 데이터 스키마 (CSV)
| 변수명 | 타입 | 설명 |
| --- | --- | --- |
| participant_id | string | 참가자 입력 ID |
| condition | string | 무작위 배정된 조건 |
| trial_index | integer | 1부터 시작하는 문항 순번 |
| hint_level_opened | integer | 0–3 범위, 참가자가 연 힌트의 최고 단계 |
| first_hint_rt_ms | integer / blank | 문항 제시 후 첫 힌트 열기까지의 반응시간(ms). 힌트를 보지 않으면 빈 값 |
| total_time_ms | integer | 문항 제시 후 정답 제출까지의 총 시간(ms) |
| accuracy | integer | 정답(1) / 오답(0) |

## 타이밍 정의
- **문항 제시 시점**: 새로운 문항이 화면에 렌더링되는 순간을 기준으로 `trial_start_time`을 기록한다.
- **first_hint_rt_ms**: 첫 힌트(1~3단계 중 최초 선택)가 열린 시점에서 `trial_start_time`을 뺀 값.
- **total_time_ms**: 정답 제출 버튼 클릭 시점에서 `trial_start_time`을 뺀 값.

## 힌트 노출 규칙
- 힌트는 기본적으로 숨겨져 있으며, 참가자가 **AI 힌트 보기** 버튼을 눌러야만 힌트 영역이 열린다.
- 힌트는 **3단계(일반 전략 → 핵심 추론 → 정답 근접 설명)**로 제공되며, 단계별 버튼을 통해 순차적으로 공개된다.
- 참가자가 열어본 힌트의 최고 단계가 `hint_level_opened`에 저장된다.
