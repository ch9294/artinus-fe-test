# PR 02 자동 검사 기록

## 실행 절차

- Node.js 24와 `package.json`에 고정한 pnpm 12.4.2를 사용한다.
- `pnpm install --frozen-lockfile`로 `pnpm-lock.yaml`에 기록된 의존성을 설치한다.
- `pnpm typecheck`와 `pnpm lint`를 실행한다. 린트 경고도 실패로 처리한다.
- Pull request와 수동 실행 시 `.github/workflows/quality.yml`이 같은 순서로 검사한다.

Expo SDK 57의 flat ESLint 설정을 적용했다. `pnpm-workspace.yaml`은 ESLint 의존성인 `unrs-resolver`의 설치 스크립트를 허용한다.

## 로컬 검증

- 환경: macOS, Node.js 24.21.0, pnpm 12.4.2. 기기 실행은 수행하지 않았다.
- `pnpm install --frozen-lockfile`: 통과.
- 관리자 검토 후 재검증: 현재 워크트리의 파일을 `node_modules` 없이 임시 디렉터리에 복사해 `pnpm install --frozen-lockfile`을 실행했다. 전역 pnpm 저장소는 재사용했으며, 잠금 파일 outdated 오류 없이 설치가 통과했다. 이어서 CI 순서대로 타입 검사와 린트가 통과했다.
- `pnpm typecheck`: 통과. 임시 파일의 `string` 변수에 숫자를 대입했을 때 TS2322와 종료 코드 2로 실패함을 확인했다.
- `pnpm lint`: 통과. 임시 파일에 문법 오류를 넣었을 때 파싱 오류와 종료 코드 1로 실패함을 확인했다.
- 두 임시 오류와 검증 파일은 제거했다.
- PR #3의 GitHub Actions `quality` 작업이 `ubuntu-latest`에서 통과했다([실행 기록](https://github.com/ch9294/artinus-fe-test/actions/runs/36220770873/job/108345483184)). 워크플로는 Node.js 24에서 고정 설치, 타입 검사, 린트를 실행한다. 로컬 재검증은 macOS에서 수행했으며, iOS/Android 빌드와 기기 동작은 이 PR의 검증 대상이 아니다.

## PR 01 통합 결과

PR 01이 포함된 `main`의 `26a9b26` 위로 이 변경을 리베이스했다. 두 작업 모두 `package.json`과 `pnpm-lock.yaml`을 수정했으나 Git 충돌 없이 통합됐다. 최종 파일에서 PR 01의 development build 의존성·실행 명령과 PR 02의 pnpm 버전·검사 명령을 확인했다. 통합 후 `node_modules`가 없는 임시 복사본에서 `pnpm install --frozen-lockfile`, 타입 검사, 린트, peer dependency 검사가 통과했다. 전역 pnpm 저장소는 재사용했다.

## AI 활용 기록

- 문제: 기본 프로젝트에 PR 자동 정적 검사 설정이 없었다.
- 요청: pnpm 잠금 파일 설치, 타입 검사, 린트, GitHub Actions 구성과 로컬 검증.
- 제안: Expo flat ESLint 설정과 고정 pnpm 버전을 사용해 PR 워크플로에서 같은 명령을 실행한다.
- 채택·수정: Expo SDK 57 호환 `eslint-config-expo`를 채택하고, peer dependency 검사 결과에 따라 ESLint 10 대신 9를 선택했다. pnpm 12의 설치 스크립트 정책에 맞춰 `unrs-resolver`를 명시적으로 허용했다.
- 직접 검증: 고정 설치와 두 검사 통과, 타입·린트 오류에 대한 실패 감지, peer dependency 문제 없음, PR #3의 GitHub Actions `quality` 작업 통과.
