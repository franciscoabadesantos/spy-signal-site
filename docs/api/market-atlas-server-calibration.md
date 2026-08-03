# Market atlas server calibration prompt

Send the prompt below to an agent running beside the production PostgreSQL after the
`relationship_atlas_*` schema and the updated relationship-map builder have been deployed.
The task is read-only: it must not alter data, configuration, deployments, or grants.

```text
Audit the latest materialized market atlas in PostgreSQL for product calibration. Work read-only.
Do not UPDATE, INSERT, DELETE, CREATE, ALTER, GRANT, trigger a build, restart a service, or expose
credentials/connection strings. Use the repository's AGENTS.md and operational rules first.

Tables:
- feature_store.relationship_edges
- feature_store.relationship_atlas_communities
- feature_store.relationship_atlas_nodes
- feature_store.relationship_atlas_edges

For each window (126, 252) and view (market, residual, timing, theme), report:
1. latest as_of_date;
2. total communities, nodes and sparse edges;
3. community-size distribution: min, p25, median, p75, p90, max;
4. confidence distribution for source relationship_edges and materialized atlas edges:
   min, p10, p25, median, p75, p90, max;
5. signed-strength distribution, including count/share of negative edges;
6. degree distribution in relationship_atlas_edges and the 20 highest-degree symbols;
7. the 20 largest communities with id, label, member_count, average_confidence,
   dominant_sector and representative_symbols from extras;
8. singleton/two-member communities and disconnected components;
9. cross-community versus within-community edge counts and weighted score totals;
10. duplicate symbols per view/window, missing community references, non-finite coordinates,
    coordinates outside ±12, confidence outside 0..1, strength outside -1..1, and stale rows.

Then evaluate, without changing anything:
- whether min_confidence=0.40 removes too much or too little;
- whether top_k_per_node=8 keeps the graph legible while preserving bridges;
- whether Louvain resolution=1.0 produces roughly 8–24 useful communities rather than one giant
  component or many tiny fragments;
- whether the initial global response can stay under 25 communities and 60 aggregate links;
- whether community detail should default to 48, 64 or 80 nodes on desktop and 28, 36 or 48 on mobile.

Return:
A. a concise findings table;
B. exact read-only SQL used;
C. recommended config values per view/window, with evidence;
D. anomalies that block launch;
E. estimated JSON row counts for atlas, largest community detail and a 28-neighbor ticker request.

Do not infer missing values. Clearly mark unavailable measurements. Redact all secrets and hostnames.
```
