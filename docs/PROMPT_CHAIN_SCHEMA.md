# Deterministic prompt-chain contract

`empowerment_prompt_chain/1` is a JSON document with `schema:1`, a local untrusted creation clock, a `context` object and `stages` array. Every stage carries `sequence`, `id`, `title`, `depends_on`, `expected_output`, `review_gate` and a complete text `prompt`. The Markdown export is the same prompts in reading order. Stage prompts are not executed or transmitted.

Lead entities: `individual`, `family`, `community`, `educator`, `researcher`, `nonprofit`, `business`, `institution`. Each profile enumerates separately affected roles and governance requirements. These categories are configuration templates, not a definition of legal authority.

Rigorous ten-stage pipeline:

1. Problem discovery and unknown data.
2. Stakeholder and sub-entity responsibility map.
3. Evidence retrieval instructions, publication dates and applicability check.
4. Theory of change, alternatives and falsifiable innovation genome.
5. Rights, misuse, equity, safety and reversibility.
6. Measures, comparators, preregistration and negative-results discipline.
7. Accessible, portable implementation plan, JSON and realistic offline behavior.
8. Adversarial security, functionality and evidence checks.
9. Consent-based pilot, total costs and benefit-sharing governance.
10. Portable transfer, attribution, unresolved research and recursive prompt queue.

The five-stage starter uses 1, 2, 4, 7 and 10. **Every prompt** includes the lead entity's distinct partners, constraints, source freshness, data-sharing limits, requested deliverable, expected output, review gate, unknowns to surface and a handoff contract. A source genome is treated only as a self-reported hypothesis, never as evidence of efficacy.

`empowerment_genome_pack/1` contains arrays of validated genome and experiment objects; experiment references must point to a genome supplied *in the same peer pack*. External project IDs and owner strings are deliberately stripped in public peer packs, but natural-language prose may contain identifying information and demands human review. Core workspace backups are private and retain the exact local values.
