import Link from 'next/link'
import ResearchViewShell, { ResearchAdPlacement } from '@/components/stocks/ResearchViewShell'
import {
  currentResearchSnapshot,
  formatResearchDate,
  formatResearchMoney,
  formatResearchShares,
} from '@/lib/research-evidence'
import type { StockResearchData } from '@/lib/stock-research'
import styles from './StockOwnershipResearch.module.css'

function CurrentSnapshot({ data }: { data: StockResearchData }) {
  const snapshot = currentResearchSnapshot(data)
  const fields = [
    { label: 'Market cap', value: formatResearchMoney(snapshot.marketCap, snapshot.currency) },
    { label: 'Shares outstanding', value: formatResearchShares(snapshot.sharesOutstanding) },
    { label: 'Currency', value: snapshot.currency },
    { label: 'Reporting period', value: formatResearchDate(snapshot.reportingPeriod) },
  ]

  return (
    <section className={styles.snapshotStrip} aria-label="Current capital snapshot">
      {fields.map((field) => (
        <div className={styles.snapshotItem} key={field.label}>
          <span>{field.label}</span>
          <strong>{field.value}</strong>
        </div>
      ))}
    </section>
  )
}

function EquityOwnership({ data }: { data: StockResearchData }) {
  return (
    <>
      <section className={styles.hero} aria-labelledby="ownership-breakdown">
        <div className={styles.ownershipCanvas}>
          <div className={styles.moduleHeader}>
            <h2 id="ownership-breakdown">Ownership breakdown</h2>
            <span>Pending integration</span>
          </div>
          <div className={styles.breakdownFrame}>
            <div className={styles.ringPlaceholder} role="img" aria-label="Ownership categories pending integration">
              <div><strong>Ownership data</strong><span>Pending integration</span></div>
            </div>
            <dl className={styles.legend}>
              {['Institutional', 'Insider', 'Retail / other', 'Free float'].map((label) => (
                <div className={styles.legendRow} key={label}>
                  <dt>{label}</dt>
                  <dd>Data pending</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <aside className={styles.ownershipAside} aria-label="Ownership context">
          <div>
            <div className={styles.moduleHeader}><h2>Concentration</h2><span>Future data</span></div>
            <dl className={styles.asideRows}>
              <div><dt>Top holders</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
              <div><dt>Largest holder</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
              <div><dt>Free float</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
            </dl>
          </div>
        </aside>
      </section>

      <section className={styles.capitalSection} aria-labelledby="capital-structure">
        <div className={styles.capitalIntro}>
          <div>
            <h2 id="capital-structure">Capital structure</h2>
            <p>How market value relates to debt, cash and enterprise value.</p>
          </div>
          <div className={styles.bridgeFormula} aria-label="Enterprise value bridge">
            <div className={styles.bridgeTerm} data-known="true"><small>Market cap</small><strong>{formatResearchMoney(currentResearchSnapshot(data).marketCap, currentResearchSnapshot(data).currency)}</strong></div>
            <span className={styles.bridgeOperator} aria-hidden="true">+</span>
            <div className={styles.bridgeTerm}><small>Debt</small><strong>Data pending</strong></div>
            <span className={styles.bridgeOperator} aria-hidden="true">−</span>
            <div className={styles.bridgeTerm}><small>Cash</small><strong>Data pending</strong></div>
            <span className={styles.bridgeOperator} aria-hidden="true">=</span>
            <div className={styles.bridgeTerm}><small>Enterprise value</small><strong>Data pending</strong></div>
          </div>
        </div>
      </section>

      <section className={styles.detailGrid} aria-label="Ownership and capital detail">
        <div className={styles.detailModule}>
          <h2>Shares outstanding</h2>
          <p>Current shares are available; the historical path is not yet supplied.</p>
          <div className={styles.placeholderTimeline} role="img" aria-label="Shares outstanding history pending integration">
            <strong>Shares history</strong><span>Pending integration</span>
          </div>
        </div>
        <div className={styles.detailModule}>
          <h2>Capital changes</h2>
          <p>Issuance, buybacks and dilution require a dated capital-actions series.</p>
          <dl className={styles.detailRows}>
            <div><dt>Issuance history</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
            <div><dt>Buybacks</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
            <div><dt>Dilution</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
          </dl>
        </div>
      </section>
    </>
  )
}

function FundStructure() {
  return (
    <>
      <section className={styles.fundStructure} aria-labelledby="fund-structure">
        <div className={styles.module}>
          <div className={styles.moduleHeader}><h2 id="fund-structure">Fund structure</h2><span>Preview</span></div>
          <div className={styles.fundFrame} role="img" aria-label="Fund structure pending integration">
            <strong>Issuer, asset base and creation / redemption structure</strong>
            <span>Pending integration · no corporate ownership model applied</span>
          </div>
        </div>
        <div className={styles.ownershipAside}>
          <div>
            <div className={styles.moduleHeader}><h2>Fund context</h2><span>Future data</span></div>
            <dl className={styles.asideRows}>
              <div><dt>Issuer</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
              <div><dt>AUM</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
              <div><dt>Holder concentration</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
            </dl>
          </div>
          <p className={styles.pendingNote}>Fund structure uses fund-specific fields and does not infer insider ownership, corporate debt or dilution.</p>
        </div>
      </section>

      <section className={styles.detailGrid} aria-label="Fund structure detail">
        <div className={styles.detailModule}>
          <h2>Shares outstanding</h2>
          <p>Current shares are shown in the snapshot above.</p>
          <dl className={styles.detailRows}>
            <div><dt>Creation / redemption</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
            <div><dt>Shares history</dt><dd className={styles.pendingValue}>Pending integration</dd></div>
          </dl>
        </div>
        <div className={styles.detailModule}>
          <h2>Holder concentration</h2>
          <p>Holder data will appear when the fund-specific ownership contract is available.</p>
          <div className={styles.placeholderTimeline} role="img" aria-label="Fund holder concentration pending integration">
            <strong>Concentration view</strong><span>Pending integration</span>
          </div>
        </div>
      </section>
    </>
  )
}

export default function StockOwnershipResearch({ data }: { data: StockResearchData }) {
  const isFund = data.kind === 'fund'

  return (
    <ResearchViewShell data={data} title={isFund ? 'Fund Structure' : 'Ownership & Capital'}>
      <div className={styles.page}>
        <CurrentSnapshot data={data} />
        {isFund ? <FundStructure /> : <EquityOwnership data={data} />}
        <section className={styles.methodology} aria-labelledby="ownership-methodology">
          <div>
            <h2 id="ownership-methodology">Methodology</h2>
            <p>Ownership and capital fields require dated, asset-aware backend evidence.</p>
          </div>
          <div>
            <p>Percentages, holder rankings, bridge terms and capital changes will remain unavailable until the canonical contract supplies source and as-of metadata.</p>
            <Link href={`/stocks/${data.ticker}/methodology`}>Open methodology →</Link>
          </div>
        </section>
        <ResearchAdPlacement />
      </div>
    </ResearchViewShell>
  )
}
