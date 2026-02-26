import Link from "next/link";
import { getSessionUserId } from "@/lib/session";
import { getUser } from "@/lib/db";

export default async function HomePage() {
  const userId = await getSessionUserId();
  const user = userId ? getUser(userId) : null;

  return (
    <>
      {/* Hero */}
      <section className="hero" data-testid="hero">
        <div className="hero-badge" data-testid="heroBadge">
          <span className="dot"></span>
          AI-Powered Code Analysis
        </div>

        <h1 data-testid="heroTitle">
          Your Code&apos;s<br />
          <span className="gradient-text">Long-Term Health</span>
          <br />
          Score
        </h1>

        <p className="hero-subtitle" data-testid="heroSubtitle">
          AI가 코드를 4가지 핵심 차원에서 분석합니다.
          <br />
          확장성, 안정성, 유지보수성, 보안성 — 코드의 장기적 완성도를 한눈에.
        </p>

        <div className="hero-cta">
          {user ? (
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/api/auth/login" className="btn btn-google" data-testid="heroCtaSignIn">
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Link>
              <a href="#features" className="btn btn-ghost">
                Learn More
              </a>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="features-section" id="features" data-testid="featuresSection">
        <div className="section-label">// Analysis Dimensions</div>
        <h2 className="section-title">4 Dimensions of Code Maturity</h2>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon scalability">&#x21C5;</div>
            <h3>Scalability</h3>
            <p>
              사용자가 10배, 100배 늘어나도 코드가 버틸 수 있는가? 수평 확장
              가능 구조, DB 쿼리 효율, 비동기 처리 패턴을 분석합니다.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon stability">&#x2764;</div>
            <h3>Stability</h3>
            <p>
              장애 발생 시 스스로 감지하고 복구할 수 있는가? 에러 핸들링,
              모니터링, 서킷 브레이커, 장애 복구 전략을 평가합니다.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon maintainability">&#x270E;</div>
            <h3>Maintainability</h3>
            <p>
              6개월 후 다른 개발자가 이 코드를 수정할 수 있는가? 코드 구조,
              문서화, 테스트 커버리지, 변경 안전성을 검사합니다.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon security">&#x1F512;</div>
            <h3>Security</h3>
            <p>
              알려진/알려지지 않은 공격에 얼마나 방어적인가? 인증/인가, 입력
              검증, 시크릿 관리, 의존성 취약점을 점검합니다.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="features-section" data-testid="howItWorksSection">
        <div className="section-label">// How it works</div>
        <h2 className="section-title">Simple 3-Step Process</h2>

        <div className="features-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <div className="feature-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>1</div>
            <h3>Upload</h3>
            <p>
              프로젝트를 .zip 파일로 압축하여 업로드합니다. 업로드된 파일은
              분석 후 즉시 폐기됩니다.
            </p>
          </div>
          <div className="feature-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>2</div>
            <h3>Analyze</h3>
            <p>
              AI가 4가지 차원에서 병렬로 코드를 분석합니다. 약 3~5분이
              소요됩니다.
            </p>
          </div>
          <div className="feature-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>3</div>
            <h3>Report</h3>
            <p>
              각 차원별 등급과 점수를 확인합니다. Pro 플랜에서 상세 분석
              리포트를 제공합니다.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
