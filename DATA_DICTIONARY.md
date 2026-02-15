# ICNS 실험 플랫폼 데이터 사전

## 1. 원칙
- 모든 시간 필드는 UTC epoch ms(`*_at_ms`)를 사용한다.
- 계산 가능한 지표는 원시 로그를 남긴 뒤 후처리로 산출한다.
- 결측은 `null`로 저장하며, 0과 구분한다.

## 2. 테이블 정의

## 2.1 `sessions`
- `id` (string, PK)
- `study_id` (string; study1~study4)
- `session_code` (string, unique)
- `randomization_seed` (string)
- `phase3_enabled` (boolean)
- `raw_ai_logging` (boolean)
- `created_at_ms` (number)

## 2.2 `participants`
- `id` (string, PK)
- `session_id` (string, FK -> sessions.id)
- `participant_code` (string, unique)
- `condition` (enum: interactive|static|control)
- `current_phase` (string)
- `completed` (boolean)
- `created_at_ms` (number)
- `updated_at_ms` (number)

## 2.3 `responses`
- `id` (string, PK)
- `participant_id` (string, FK)
- `phase` (string)
- `item_id` (string)
- `response_value` (string/json)
- `submitted_at_ms` (number)

## 2.4 `events`
- `id` (string, PK)
- `participant_id` (string, FK)
- `study_id` (string)
- `phase` (string)
- `item_id` (string|null)
- `event_type` (string)
- `timestamp_ms` (number)
- `metadata_json` (json|null)

필수 `event_type`:
- `item_viewed`
- `item_submitted`
- `ai_panel_opened`
- `ai_call_started`
- `ai_call_finished`

## 2.5 `ai_calls`
- `id` (string, PK)
- `participant_id` (string, FK)
- `phase` (string)
- `item_id` (string)
- `request_started_at_ms` (number)
- `response_received_at_ms` (number)
- `latency_ms` (number)
- `provider` (string; mock|openai)
- `prompt_text` (string|null, 기본 null)
- `assistant_text` (string|null, 기본 null)

## 2.6 `bpnsfs_scores`
- `id` (string, PK)
- `participant_id` (string, FK)
- `timepoint` (enum: T1|T2)
- `competence_satisfaction` (number)
- `competence_frustration` (number)
- `autonomy_satisfaction` (number|null)
- `relatedness_satisfaction` (number|null)
- `computed_at_ms` (number)

## 2.7 `predictions`
- `id` (string, PK)
- `participant_id` (string, FK)
- `phase` (string; phase3)
- `item_id` (string)
- `prediction_score` (number)
- `transfer_score` (number|null)
- `recorded_at_ms` (number)

## 3. 파생 변수 정의
- `illusion_score = prediction_score - transfer_score`
- `ai_call_count_per_participant = count(ai_calls.id)` (phase4 기준 집계 가능)
- `first_ai_call_latency_ms = ai_first_call_at_ms - item_viewed_at_ms`
- `percent_items_completed_without_ai = (ai 미호출 제출 문항 수 / 전체 제출 문항 수) * 100`

## 4. 문항 단위 계산을 위한 최소 이벤트
각 문항(item_id)마다 아래 3개 시점이 복원 가능해야 한다.
- `item_viewed_at_ms`
- `item_submitted_at_ms`
- `ai_first_call_at_ms` (호출 없으면 null)

## 5. 결측 처리 규칙
- AI를 호출하지 않은 문항: `ai_first_call_at_ms = null`, `first_ai_call_latency_ms = null`
- 미제출 문항: `item_submitted_at_ms = null`, 파생 지표 분모에서 제외 여부를 분석 스크립트에 명시
- BPNSFS 일부 누락: 하위척도 점수는 응답한 문항 평균으로 계산하되, 50% 미만 응답 시 null

## 6. 분석용 공통 출력 컬럼(권장)
- `participant_id`
- `study_id`
- `condition`
- `illusion_score`
- `bpnsfs_competence_satisfaction_T1`
- `bpnsfs_competence_frustration_T1`
- `bpnsfs_competence_satisfaction_T2`
- `bpnsfs_competence_frustration_T2`
- `ai_call_count_per_participant`
- `first_ai_call_latency_ms_mean`
- `percent_items_completed_without_ai`
