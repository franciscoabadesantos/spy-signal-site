import Nav from '@/components/Nav'

export default function Methodology() {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px' }}>
      <Nav active="methodology" />

      {/* Header */}
      <div style={{ padding: '20px 0 16px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
          S&P 500 ETF (SPY) · ML Directional Model
        </div>
        <div style={{ fontSize: '22px', fontWeight: 600 }}>Methodology</div>
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          System design, validation framework, and research approach
        </div>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '48px', padding: '32px 0' }}>

        {/* Article */}
        <article style={{ lineHeight: '1.75', fontSize: '14px', color: '#374151' }}>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
              Overview
            </h2>
            <p style={{ marginBottom: '12px' }}>
              This project is a full end-to-end machine learning system for predicting the directional
              movement of SPY (the S&P 500 ETF) over a 20 trading day horizon. It was built by one person
              over approximately 12 months with the goal of producing something closer to a production-grade
              research system than a typical portfolio project.
            </p>
            <p>
              The system is designed around strong validation principles — walk-forward testing,
              strict avoidance of lookahead bias, and realistic backtesting with transaction costs
              and position constraints. The signal currently running live uses a monthly retraining
              cadence with a 2-year rolling training window.
            </p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
              Pipeline architecture
            </h2>
            <p style={{ marginBottom: '12px' }}>
              The system is structured as a sequential pipeline with six stages, each with a
              clearly defined interface and no data leakage between them:
            </p>
            <div style={{ borderLeft: '3px solid #e5e7eb', paddingLeft: '16px', marginBottom: '12px' }}>
              {[
                { stage: 'Data ingestion', desc: 'Price, volume, and macro data fetched from external sources. All data is timestamped and stored with the exact availability date to prevent future leakage.' },
                { stage: 'Feature engineering', desc: 'Technical indicators, return windows, and regime-based features are computed strictly using information available at prediction time.' },
                { stage: 'Model training', desc: 'An ensemble model is trained on a rolling window of historical data. The model family and training procedure are not disclosed.' },
                { stage: 'Signal generation', desc: 'The trained model produces a directional prediction and confidence score for the target horizon. Position sizing is scaled by signal strength.' },
                { stage: 'Portfolio construction', desc: 'Signals are translated into positions with constraints on maximum exposure and turnover. Transaction costs are modelled explicitly.' },
                { stage: 'Backtesting and validation', desc: 'Performance is evaluated on held-out data using walk-forward testing. No information from the test period is used during training.' },
              ].map(item => (
                <div key={item.stage} style={{ marginBottom: '14px' }}>
                  <div style={{ fontWeight: 500, color: '#1a1a1a', marginBottom: '2px', fontSize: '13px' }}>
                    {item.stage}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
              Validation framework
            </h2>
            <p style={{ marginBottom: '12px' }}>
              The most important design decision in the system is how validation is handled.
              Most ML projects overfit to their evaluation set — either through direct data leakage,
              repeated use of the same test period, or hyperparameter tuning that implicitly uses
              future information.
            </p>
            <p style={{ marginBottom: '12px' }}>
              This system uses walk-forward testing throughout. The model is retrained on a fixed
              rolling window, then evaluated on the immediately following period before the window
              advances. At no point does the training set include any data from the evaluation period.
            </p>
            <p style={{ marginBottom: '12px' }}>
              Additional safeguards include:
            </p>
            <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '14px 16px', fontSize: '13px' }}>
              {[
                'Feature computation uses only data available at the prediction timestamp',
                'No hyperparameters were tuned on the final out-of-sample test period',
                'Transaction costs and slippage are modelled at realistic levels',
                'Position constraints prevent unrealistic concentration',
                'The live signal uses the same pipeline as the backtest with no modifications',
              ].map(point => (
                <div key={point} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#27500A', fontWeight: 600, marginTop: '1px' }}>✓</span>
                  <span style={{ color: '#374151' }}>{point}</span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
              Live signal and display lag
            </h2>
            <p style={{ marginBottom: '12px' }}>
              The system generates a new signal each trading day after US market close. The signal
              is based on data available at that close and predicts the direction of SPY over the
              following 20 trading days.
            </p>
            <p style={{ marginBottom: '12px' }}>
              Signals displayed on this site are shown with a 45-day lag. This means what you see
              today was generated 45 days ago. The actual outcome — whether the prediction was
              correct — is shown alongside it once the prediction horizon has passed.
            </p>
            <p>
              This lag is intentional. It allows the site to show verified predictions with real
              outcomes rather than unverifiable live calls, while keeping the signal generation
              details proprietary.
            </p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
              What is not disclosed
            </h2>
            <p style={{ marginBottom: '12px' }}>
              The following details are kept proprietary and are not disclosed on this site:
            </p>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.8' }}>
              <div>· The specific features used in signal generation</div>
              <div>· The model architecture, hyperparameters, and ensemble weights</div>
              <div>· The exact entry and exit logic in portfolio construction</div>
              <div>· Any data sources that provide informational edge</div>
            </div>
            <p style={{ marginTop: '12px' }}>
              The source code for the data pipeline, backtesting engine, and infrastructure
              is available in a sanitised form on GitHub, with the proprietary components removed.
            </p>
          </section>

          <section style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#1a1a1a', marginBottom: '12px' }}>
              Limitations and known risks
            </h2>
            <p style={{ marginBottom: '12px' }}>
              No model predicts markets reliably over long periods. Known limitations of this system include:
            </p>
            <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.8' }}>
              <div>· Regime changes can cause rapid performance degradation</div>
              <div>· The training history is limited and may not cover all market conditions</div>
              <div>· Transaction cost estimates may not reflect live execution reality</div>
              <div>· The model is not designed for live trading and has not been used for that purpose</div>
            </div>
          </section>

          <div style={{
            fontSize: '11px', color: '#9ca3af', lineHeight: '1.6',
            padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px'
          }}>
            This is a research and portfolio project built for educational and professional
            demonstration purposes. Nothing on this site constitutes investment advice or a
            recommendation to buy or sell any security.
          </div>

        </article>

        {/* Sidebar TOC */}
        <div style={{ position: 'sticky', top: '24px', alignSelf: 'start' }}>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            On this page
          </div>
          {[
            'Overview',
            'Pipeline architecture',
            'Validation framework',
            'Live signal and display lag',
            'What is not disclosed',
            'Limitations and known risks',
          ].map(section => (
            <div key={section} style={{
              fontSize: '13px', color: '#6b7280',
              padding: '4px 0', borderLeft: '2px solid #e5e7eb',
              paddingLeft: '12px', marginBottom: '2px',
            }}>
              {section}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
