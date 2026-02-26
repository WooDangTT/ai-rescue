import Link from "next/link";
import { getSessionUserId } from "@/lib/session";
import { getUser } from "@/lib/db";
import { FreePlanButton, ProPlanButton } from "./PricingClient";

export default async function PricingPage() {
  const userId = await getSessionUserId();
  const user = userId ? getUser(userId) : null;
  const currentPlan = user?.plan ?? "";

  return (
    <div className="pricing-page">
      <div className="section-label">// Plans</div>
      <h1 className="section-title" style={{ fontSize: "2.5rem" }}>
        Choose Your Plan
      </h1>
      <p
        style={{
          color: "var(--text-secondary)",
          maxWidth: "480px",
          margin: "-24px auto 0",
        }}
      >
        Free 플랜으로 등급만 확인하고, Pro에서 상세 분석과 권장사항을
        받아보세요.
      </p>

      <div className="pricing-grid">
        {/* Free */}
        <div className="pricing-card">
          <div className="pricing-plan">Free</div>
          <div className="pricing-price">
            <span className="currency">&#8361;</span>0
            <span className="period">/ forever</span>
          </div>
          <div className="pricing-desc">코드의 현재 상태를 빠르게 파악</div>
          <ul className="pricing-features">
            <li>
              <span className="check">&#x2713;</span> 월 3회 분석
            </li>
            <li>
              <span className="check">&#x2713;</span> 4개 차원 등급 확인 (A~F)
            </li>
            <li>
              <span className="check">&#x2713;</span> 종합 점수 / 등급
            </li>
            <li>
              <span className="check">&#x2713;</span> Liebig&apos;s Law 취약
              영역 표시
            </li>
            <li>
              <span style={{ color: "var(--text-muted)" }}>&#x2717;</span>{" "}
              <span style={{ color: "var(--text-muted)" }}>
                상세 분석 리포트
              </span>
            </li>
            <li>
              <span style={{ color: "var(--text-muted)" }}>&#x2717;</span>{" "}
              <span style={{ color: "var(--text-muted)" }}>
                Critical Issues 목록
              </span>
            </li>
            <li>
              <span style={{ color: "var(--text-muted)" }}>&#x2717;</span>{" "}
              <span style={{ color: "var(--text-muted)" }}>
                맞춤 Recommendations
              </span>
            </li>
          </ul>
          {user ? (
            <FreePlanButton currentPlan={currentPlan} />
          ) : (
            <Link
              href="/api/auth/login"
              className="btn btn-ghost"
              style={{ width: "100%" }}
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Pro */}
        <div className="pricing-card featured">
          <div className="pricing-plan">Pro</div>
          <div className="pricing-price">
            <span className="currency">&#8361;</span>29,000
            <span className="period">/ month</span>
          </div>
          <div className="pricing-desc">
            코드 완성도를 끌어올리는 상세 분석
          </div>
          <ul className="pricing-features">
            <li>
              <span className="check">&#x2713;</span> 무제한 분석
            </li>
            <li>
              <span className="check">&#x2713;</span> 4개 차원 등급 + 세부 점수
            </li>
            <li>
              <span className="check">&#x2713;</span> Sub-score별 상세 분석
              (16개 항목)
            </li>
            <li>
              <span className="check">&#x2713;</span> Critical Issues 전체 목록
            </li>
            <li>
              <span className="check">&#x2713;</span> 코드 라인 수준 findings
            </li>
            <li>
              <span className="check">&#x2713;</span> 맞춤 Recommendations
            </li>
            <li>
              <span className="check">&#x2713;</span> JSON/PDF 리포트 다운로드
            </li>
            <li>
              <span className="check">&#x2713;</span> GitHub repo URL 직접 분석
            </li>
          </ul>
          {user ? (
            <ProPlanButton currentPlan={currentPlan} />
          ) : (
            <Link
              href="/api/auth/login"
              className="btn btn-upgrade"
              style={{ width: "100%" }}
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Enterprise */}
        <div className="pricing-card">
          <div className="pricing-plan">Enterprise</div>
          <div className="pricing-price">Custom</div>
          <div className="pricing-desc">조직 전체의 코드 품질 관리</div>
          <ul className="pricing-features">
            <li>
              <span className="check">&#x2713;</span> Pro 기능 전체 포함
            </li>
            <li>
              <span className="check">&#x2713;</span> 팀 대시보드
            </li>
            <li>
              <span className="check">&#x2713;</span> CI/CD 파이프라인 통합
            </li>
            <li>
              <span className="check">&#x2713;</span> Custom 평가 기준 설정
            </li>
            <li>
              <span className="check">&#x2713;</span> 트렌드 분석 (시계열)
            </li>
            <li>
              <span className="check">&#x2713;</span> SSO / SAML 인증
            </li>
            <li>
              <span className="check">&#x2713;</span> 전담 지원
            </li>
          </ul>
          <a
            className="btn btn-ghost"
            style={{ width: "100%", justifyContent: "center" }}
            href="mailto:enterprise@airescue.dev"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}
