export default function Methodology() {
  const rightRail = (
    <div style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: '#6b7280',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        On this page
      </div>

      {[
        { label: 'Overview', href: '#overview' },
        { label: 'Pipeline architecture', href: '#pipeline-architecture' },
        { label: 'Strategy design', href: '#strategy-design' },
        { label: 'Validation framework', href: '#validation-framework' },
        { label: 'Live signal contract', href: '#live-signal-contract' },
        { label: 'How to read results', href: '#how-to-read-results' },
        {
          label: 'What is public vs. proprietary',
          href: '#what-is-public-vs-proprietary',
        },
        { label: 'Limitations and known risks', href: '#limitations-and-known-risks' },
      ].map((section) => (
        <a
          key={section.label}
          href={section.href}
          style={{
            display: 'block',
            fontSize: '13px',
            color: '#6b7280',
            padding: '4px 0',
            borderLeft: '2px solid #e5e7eb',
            paddingLeft: '12px',
            marginBottom: '2px',
            textDecoration: 'none',
          }}
        >
          {section.label}
        </a>
      ))}
    </div>
  )

  return (
    <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_280px]">
      <div>
      <div style={{ padding: '20px 0 16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          S&amp;P 500 ETF (SPY) · Timing &amp; Allocation System
        </div>
        <div style={{ fontSize: '22px', fontWeight: 600 }}>Methodology</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          System design, validation framework, and live signal contract
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '0px',
          padding: '32px 0',
        }}
      >
        <article style={{ lineHeight: '1.75', fontSize: '14px', color: '#374151' }}>
          <section id="overview" style={{ marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '12px',
              }}
            >
              Overview
            </h2>
            <p style={{ marginBottom: '12px' }}>
              This project is an end-to-end machine learning system for timing and
              allocating exposure to SPY, the S&amp;P 500 ETF. It was built as a
              long-term research project with the goal of producing something closer
              to a production-quality research and deployment system than a typical
              portfolio project.
            </p>
            <p style={{ marginBottom: '12px' }}>
              The live system is a long-flat timing model. It decides when to hold
              SPY and when to remain flat. It does not short the market. The goal is
              not to maximize directional hit rate in isolation, but to improve
              capital allocation: participate when expected conditions are favorable
              and step aside when they are not.
            </p>
            <p>
              The system is built around walk-forward validation, strict timing
              discipline, release-aware macro handling, and a live runtime that
              reuses the same core pipeline contract used in research.
            </p>
          </section>

          <section id="pipeline-architecture" style={{ marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '12px',
              }}
            >
              Pipeline architecture
            </h2>
            <p style={{ marginBottom: '12px' }}>
              The system is structured as a sequential pipeline with clear stage
              boundaries and explicit timing assumptions:
            </p>

            <div
              style={{
                borderLeft: '3px solid #e5e7eb',
                paddingLeft: '16px',
                marginBottom: '12px',
              }}
            >
              {[
                {
                  stage: 'Data ingestion',
                  desc:
                    'Price, volume, and macro data are fetched from external sources. Data is stored with explicit date handling, and macro inputs are aligned using release-aware availability rules rather than revised hindsight values.',
                },
                {
                  stage: 'Feature engineering',
                  desc:
                    'Technical, return-based, and macro regime features are computed only from information that should be available at the decision timestamp.',
                },
                {
                  stage: 'Model training',
                  desc:
                    'A model is trained on rolling historical windows and retrained on a fixed schedule. The exact live feature set, model specification, and parameterization are not publicly disclosed.',
                },
                {
                  stage: 'Signal generation',
                  desc:
                    'The model produces a forward expectation for SPY using end-of-day information under a fixed timing contract.',
                },
                {
                  stage: 'Risk and allocation layer',
                  desc:
                    'Model output is translated into an invest-or-flat stance through risk-scaling and allocation logic. In the public live version, this results in either positive SPY exposure or a flat position.',
                },
                {
                  stage: 'Backtesting and validation',
                  desc:
                    'Performance is evaluated on held-out periods through walk-forward testing, with no leakage from evaluation windows into training or feature construction.',
                },
              ].map((item) => (
                <div key={item.stage} style={{ marginBottom: '14px' }}>
                  <div
                    style={{
                      fontWeight: 500,
                      color: '#1a1a1a',
                      marginBottom: '2px',
                      fontSize: '13px',
                    }}
                  >
                    {item.stage}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.desc}</div>
                </div>
              ))}
            </div>

            <p>
              The same core system contract is used across research and live runtime.
              Public results are intended to reflect the deployed process rather than
              a separate simplified demonstration path.
            </p>
          </section>

          <section id="strategy-design" style={{ marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '12px',
              }}
            >
              Strategy design
            </h2>
            <p style={{ marginBottom: '12px' }}>
              This is not a stock picker and not a discretionary forecasting
              dashboard. It is a timing and allocation system for a single
              underlying instrument: SPY.
            </p>
            <p style={{ marginBottom: '12px' }}>
              In the public live setup, the effective states are simple:
            </p>
            <div
              style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '13px',
                marginBottom: '12px',
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <strong>Bullish</strong> = positive SPY exposure
              </div>
              <div>
                <strong>Neutral</strong> = flat, no position
              </div>
            </div>
            <p style={{ marginBottom: '12px' }}>
              A neutral signal is not a hidden short view and not necessarily a
              directional prediction failure. It is a no-allocation state. The
              system is choosing not to commit capital because expected conditions
              do not justify exposure.
            </p>
            <p>
              This asymmetry is deliberate. The objective is to improve exposure
              quality rather than force continuous market participation.
            </p>
          </section>

          <section id="validation-framework" style={{ marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '12px',
              }}
            >
              Validation framework
            </h2>
            <p style={{ marginBottom: '12px' }}>
              The central research problem is not only model fitting, but evaluation
              quality. Many ML finance projects look strong only because their
              validation process leaks future information, reuses the same test set
              repeatedly, or tunes implicitly on the final evaluation period.
            </p>
            <p style={{ marginBottom: '12px' }}>
              This system uses walk-forward validation. A model is trained on a
              historical window, evaluated on the immediately following period, then
              advanced forward through time. At no point does the training window
              contain observations from the period being evaluated.
            </p>
            <div
              style={{
                background: '#f9fafb',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '13px',
              }}
            >
              {[
                'Feature computation uses only information intended to be available at the prediction timestamp',
                'Macro features use release-aware handling to reduce look-ahead into later revisions',
                'No final out-of-sample period is used as an informal tuning playground',
                'Transaction costs and execution assumptions are modeled explicitly in research',
                'Position and turnover constraints are enforced in the allocation layer',
                'The live signal follows the same core pipeline contract used in research rather than a separate simplified path',
              ].map((point) => (
                <div
                  key={point}
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '8px',
                    alignItems: 'flex-start',
                  }}
                >
                  <span style={{ color: '#27500A', fontWeight: 600, marginTop: '1px' }}>
                    ✓
                  </span>
                  <span style={{ color: '#374151' }}>{point}</span>
                </div>
              ))}
            </div>
          </section>

          <section id="live-signal-contract" style={{ marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '12px',
              }}
            >
              Live signal contract
            </h2>
            <p style={{ marginBottom: '12px' }}>
              The system generates a live signal each trading day using information
              available at US market close. That signal is intended to correspond to
              next-open execution under the same timing assumptions used in research
              and live runtime.
            </p>
            <p style={{ marginBottom: '12px' }}>
              Signals shown on this site are therefore live outputs of the system
              rather than delayed retrospective examples. The purpose of publishing
              them is to expose how the process behaves over time, not to operate as
              a trading service or instruction feed.
            </p>
            <p>
              Public presentation does not change the underlying constraints of the
              system: execution quality, slippage, fees, latency, and account-level
              considerations can all cause realized outcomes to differ from modeled
              behavior.
            </p>
          </section>

          <section id="how-to-read-results" style={{ marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '12px',
              }}
            >
              How to read results
            </h2>
            <p style={{ marginBottom: '12px' }}>
              Public results should be interpreted as allocation decisions, not as
              pure directional calls.
            </p>
            <p style={{ marginBottom: '12px' }}>
              A bullish signal means the system chose to allocate to SPY. A neutral
              signal means the system chose to stay flat. Because of that,
              directional hit rate is a secondary metric rather than the primary one.
            </p>
            <p style={{ marginBottom: '12px' }}>
              For a long-flat system, a raw overall hit rate can be misleading. Flat
              periods are not active bets, and the more important question is whether
              the system improves outcomes when it is invested versus when it is not.
            </p>
            <p>
              The most meaningful public metrics are therefore allocation-aware ones,
              such as performance during invested periods, share of time allocated,
              turnover, drawdown behavior, and the quality of active entries rather
              than simple classification accuracy across all rows.
            </p>
          </section>

          <section id="what-is-public-vs-proprietary" style={{ marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '12px',
              }}
            >
              What is public vs. proprietary
            </h2>
            <p style={{ marginBottom: '12px' }}>
              This site is intended to disclose the system contract and research
              discipline without disclosing implementation details that would reveal
              the live edge directly.
            </p>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.8' }}>
              <div>
                <strong>Public:</strong> strategy structure, timing assumptions,
                validation approach, deployment philosophy, and the interpretation of
                signals and results
              </div>
              <div>
                <strong>Not disclosed:</strong> the exact live feature set, model
                architecture, training configuration, threshold logic, and other
                implementation details that would expose the informational edge
              </div>
            </div>
          </section>

          <section id="limitations-and-known-risks" style={{ marginBottom: '36px' }}>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '12px',
              }}
            >
              Limitations and known risks
            </h2>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.8' }}>
              <div>· Regime changes can degrade model behavior</div>
              <div>· Historical coverage does not span every possible market environment</div>
              <div>· Real-world execution costs may differ from research assumptions</div>
              <div>· A long-flat design can miss sharp upside moves while out of the market</div>
              <div>· Live performance can differ materially from backtested behavior</div>
              <div>· Public metrics are simplified representations of a richer research process</div>
            </div>
          </section>

          <div
            style={{
              fontSize: '11px',
              color: '#9ca3af',
              lineHeight: '1.6',
              padding: '12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          >
            This is a research and portfolio project built for educational and
            professional demonstration purposes. Nothing on this site constitutes
            investment advice or a recommendation to buy or sell any security. The
            site does not account for individual objectives, constraints, taxes,
            transaction costs, slippage, or execution quality, and real-world results
            may differ materially from modeled or displayed outcomes.
          </div>
        </article>
      </div>
      </div>
      <aside className="hidden xl:block">{rightRail}</aside>
    </div>
  )
}
