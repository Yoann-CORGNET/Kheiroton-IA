"""
Phase 4+5 — Analysis: Feasibility scoring using rule-based heuristics + context data.

This is the POC version. In production, each dimension would be evaluated by a
specialized LLM agent with RAG context. Here we use rule-based heuristics to
demonstrate the pipeline flow and validate the data structure.
"""

import random
import numpy as np
from models import (
    Promise, DimensionScore, FeasibilityScore, MCDA_WEIGHTS,
    get_feasibility_label,
)


class FeasibilityAnalyzer:
    """Rule-based feasibility analyzer (POC version).

    Production version would use LLM agents for each dimension.
    This version uses heuristics based on available structured data.
    """

    def __init__(self, context: dict):
        self.context = context
        self.macro = context.get("economic", {}).get("macro_indicators", {})
        self.budget = context.get("economic", {}).get("budget_structure", {})
        self.fiscal = context.get("economic", {}).get("fiscal_constraints", {})
        self.legal = context.get("legal", {})
        self.precedents = context.get("precedents", {})
        self.evaluations = context.get("evaluations", {})

    def analyze_promise(self, promise: Promise) -> FeasibilityScore:
        """Analyze a single promise across all dimensions."""
        dimensions = {
            "legal": self._score_legal(promise),
            "budget": self._score_budget(promise),
            "technical": self._score_technical(promise),
            "political": self._score_political(promise),
            "timeline": self._score_timeline(promise),
            "social": self._score_social(promise),
            "impact": self._score_impact(promise),
        }

        # Weighted score
        overall = sum(
            MCDA_WEIGHTS[dim] * ds.score
            for dim, ds in dimensions.items()
        )

        # Uncertainty
        uncertainty = sum(
            MCDA_WEIGHTS[dim] * (1 - ds.confidence)
            for dim, ds in dimensions.items()
        )

        # Monte Carlo simulation
        mc = self._monte_carlo(dimensions, n=1000)

        ci_95 = (
            round(max(0, np.percentile(mc, 2.5)), 3),
            round(min(1, np.percentile(mc, 97.5)), 3),
        )

        return FeasibilityScore(
            overall=round(overall, 3),
            uncertainty=round(uncertainty, 3),
            ci_95=ci_95,
            dimensions=dimensions,
            monte_carlo={
                "mean": round(float(np.mean(mc)), 3),
                "std": round(float(np.std(mc)), 3),
                "p5": round(float(np.percentile(mc, 5)), 3),
                "p95": round(float(np.percentile(mc, 95)), 3),
            },
            label=get_feasibility_label(overall),
        )

    def _score_legal(self, p: Promise) -> DimensionScore:
        """Heuristic legal feasibility scoring."""
        score = 0.7  # default: most promises are legally possible
        confidence = 0.5
        findings = []
        risks = []

        # Constitutional constraints check
        const = self.legal.get("constitutional_constraints", {})
        articles = const.get("articles", [])

        # Promises requiring constitutional revision are very hard
        keywords_const_revision = [
            "referendum", "VIe Republique", "6e Republique",
            "proportionnelle intégrale", "supprimer le sénat",
        ]
        if any(kw.lower() in p.raw_text.lower() for kw in keywords_const_revision):
            score = 0.15
            confidence = 0.8
            findings.append("Necessite une revision constitutionnelle (Art. 89)")
            risks.append("Le Senat dispose d'un droit de veto sur les revisions constitutionnelles")

        # EU law constraints
        eu = self.legal.get("eu_legal_constraints", {})
        eu_constraints = eu.get("constraints", [])

        eu_keywords = {
            "immigration": ["preference nationale", "quotas immigration", "renvoi", "expulsion"],
            "budget_fiscal": ["sortir de l'euro", "monetisation", "devaluation"],
            "libre_circulation": ["priorite nationale emploi", "fermer les frontieres"],
        }
        for domain, keywords in eu_keywords.items():
            if any(kw.lower() in p.raw_text.lower() for kw in keywords):
                score = min(score, 0.3)
                confidence = max(confidence, 0.7)
                findings.append(f"Potentiel conflit avec le droit UE ({domain})")
                risks.append("Risque de contentieux devant la CJUE")

        # Standard law is easier
        if score > 0.5 and p.theme in ["economie", "emploi", "education", "sante"]:
            findings.append("Realisable par loi ordinaire ou decret")

        return DimensionScore(
            score=round(score, 2),
            confidence=round(confidence, 2),
            justification="; ".join(findings) if findings else "Pas d'obstacle juridique majeur identifie",
            key_findings=findings,
            risks=risks,
        )

    def _score_budget(self, p: Promise) -> DimensionScore:
        """Heuristic budget feasibility scoring."""
        score = 0.5
        confidence = 0.4
        findings = []
        risks = []

        cost = p.cost_announced.amount_eur if p.cost_announced and p.cost_announced.amount_eur else None

        if cost is None:
            # No cost estimate = lower score (opaque)
            score = 0.4
            confidence = 0.3
            findings.append("Aucun chiffrage disponible")
            risks.append("Cout inconnu — risque de derapage budgetaire")
        elif cost < 0:
            # Savings/revenue measure
            score = 0.7
            confidence = 0.6
            findings.append(f"Mesure generant {abs(cost)/1e9:.1f} Md EUR d'economies/recettes")
        else:
            # Spending measure
            budget_total = 445e9  # state budget ~445 Md EUR
            ratio = cost / budget_total

            if ratio < 0.001:  # < 0.1% of budget
                score = 0.85
                confidence = 0.7
                findings.append(f"Cout modeste ({cost/1e9:.1f} Md EUR, {ratio*100:.2f}% du budget)")
            elif ratio < 0.01:  # < 1% of budget
                score = 0.6
                confidence = 0.6
                findings.append(f"Cout significatif ({cost/1e9:.1f} Md EUR, {ratio*100:.1f}% du budget)")
            elif ratio < 0.05:  # < 5% of budget
                score = 0.35
                confidence = 0.5
                findings.append(f"Cout tres eleve ({cost/1e9:.1f} Md EUR, {ratio*100:.1f}% du budget)")
                risks.append("Impact majeur sur le deficit public")
            else:  # > 5% of budget
                score = 0.15
                confidence = 0.6
                findings.append(f"Cout massif ({cost/1e9:.1f} Md EUR, {ratio*100:.1f}% du budget)")
                risks.append("Incompatible avec les contraintes budgetaires actuelles")

        # Funding source credibility
        if p.funding_source:
            vague_funding = ["croissance", "plein emploi", "lutte contre la fraude",
                             "economies", "rationalisation"]
            if any(vf in p.funding_source.lower() for vf in vague_funding):
                score = max(score - 0.15, 0.05)
                findings.append(f"Financement flou : '{p.funding_source}'")
                risks.append("Source de financement non credible ou aleatoire")
            else:
                findings.append(f"Source de financement identifiee : {p.funding_source}")
        elif cost and cost > 0:
            score = max(score - 0.1, 0.05)
            findings.append("Aucune source de financement identifiee")

        # Context: France under excessive deficit procedure
        if cost and cost > 5e9:
            risks.append("France sous procedure de deficit excessif UE (deficit 5.8% PIB)")

        return DimensionScore(
            score=round(max(0, min(1, score)), 2),
            confidence=round(confidence, 2),
            justification="; ".join(findings) if findings else "Analyse budgetaire standard",
            key_findings=findings,
            risks=risks,
        )

    def _score_technical(self, p: Promise) -> DimensionScore:
        """Heuristic technical/administrative feasibility."""
        score = 0.6
        confidence = 0.4
        findings = []
        risks = []

        # Simple measures (tax changes, transfers) are easier to implement
        easy_verbs = ["supprimer", "augmenter", "reduire", "exonerer", "revaloriser"]
        hard_verbs = ["creer", "reformer", "transformer", "restructurer", "fusionner"]

        if p.action_verb.lower() in easy_verbs:
            score = 0.75
            findings.append("Mesure de type parametrique (plus simple a mettre en oeuvre)")
        elif p.action_verb.lower() in hard_verbs:
            score = 0.45
            findings.append("Reforme structurelle (mise en oeuvre complexe)")
            risks.append("Necessite une reorganisation administrative significative")

        # Check if similar reforms succeeded or failed in precedents
        reforms = self.precedents.get("french_reforms", [])
        if isinstance(reforms, list):
            for reform in reforms:
                if isinstance(reform, dict) and reform.get("domain") == p.theme:
                    outcome = reform.get("outcome", "")
                    if "success" in outcome.lower() or "reussi" in outcome.lower():
                        score = min(score + 0.1, 1.0)
                        findings.append(f"Precedent positif : {reform.get('name', 'N/A')}")
                    elif "echec" in outcome.lower() or "fail" in outcome.lower():
                        score = max(score - 0.1, 0.0)
                        risks.append(f"Precedent negatif : {reform.get('name', 'N/A')}")
                    break  # Only use first matching precedent

        return DimensionScore(
            score=round(score, 2),
            confidence=round(confidence, 2),
            justification="; ".join(findings) if findings else "Faisabilite technique standard",
            key_findings=findings,
            risks=risks,
        )

    def _score_political(self, p: Promise) -> DimensionScore:
        """Heuristic political feasibility (parliamentary arithmetic)."""
        score = 0.4  # default low — no majority
        confidence = 0.35  # political prediction always uncertain
        findings = []
        risks = []

        parl = self.legal.get("parliamentary_arithmetic", {})
        an = parl.get("assemblee_nationale", {})

        findings.append("Aucun bloc ne detient la majorite absolue (289 sieges)")
        risks.append("Risque de blocage parlementaire systematique")

        # Measures that enjoy broad consensus score higher
        consensus_themes = ["securite", "sante", "education"]
        if p.theme in consensus_themes:
            score = 0.55
            findings.append(f"Theme '{p.theme}' beneficie souvent d'un large consensus")

        # Divisive themes score lower
        divisive_themes = ["immigration", "retraites", "institutions"]
        if p.theme in divisive_themes:
            score = 0.25
            findings.append(f"Theme '{p.theme}' tres clivant politiquement")
            risks.append("Opposition probable de multiples groupes parlementaires")

        # Can be done by decree = higher political feasibility
        decree_friendly = ["revaloriser", "exonerer"]
        if p.action_verb.lower() in decree_friendly:
            score = min(score + 0.2, 0.8)
            findings.append("Peut potentiellement etre mis en oeuvre par decret")

        return DimensionScore(
            score=round(score, 2),
            confidence=round(confidence, 2),
            justification="; ".join(findings),
            key_findings=findings,
            risks=risks,
        )

    def _score_timeline(self, p: Promise) -> DimensionScore:
        """Heuristic timeline feasibility."""
        score = 0.6
        confidence = 0.4
        findings = []
        risks = []

        if not p.timeline:
            score = 0.5
            confidence = 0.3
            findings.append("Aucune echeance annoncee")
        elif any(kw in p.timeline.lower() for kw in ["dès", "immédiat", "premier jour", "2022"]):
            # Immediate implementation promised
            if p.action_verb.lower() in ["supprimer", "augmenter", "reduire"]:
                score = 0.8
                findings.append("Mesure parametrique applicable rapidement")
            else:
                score = 0.3
                findings.append("Echeance immediate pour une reforme structurelle = irrealiste")
                risks.append("Delai trop court pour les consultations et la navette parlementaire")
        elif any(kw in p.timeline.lower() for kw in ["quinquennat", "mandat", "5 ans"]):
            score = 0.65
            findings.append("Echeance raisonnable (duree du mandat)")
        elif any(kw in p.timeline.lower() for kw in ["2030", "2040", "2050"]):
            score = 0.7
            findings.append("Objectif a long terme")
            risks.append("Engagement difficile a tenir au-dela du mandat")

        return DimensionScore(
            score=round(score, 2),
            confidence=round(confidence, 2),
            justification="; ".join(findings) if findings else "Calendrier standard",
            key_findings=findings,
            risks=risks,
        )

    def _score_social(self, p: Promise) -> DimensionScore:
        """Heuristic social acceptability scoring."""
        score = 0.6
        confidence = 0.4
        findings = []
        risks = []

        # Measures that benefit a large population = higher acceptability
        popular_keywords = ["pouvoir d'achat", "augmenter", "prime", "allocation",
                           "gratuit", "baisse", "exonér"]
        unpopular_keywords = ["supprimer", "réduire", "reculer", "interdire",
                             "taxe", "cotisation", "effort"]

        text_lower = p.raw_text.lower()

        if any(kw in text_lower for kw in popular_keywords):
            score = 0.75
            findings.append("Mesure a priori populaire (benefice direct pour les menages)")
        if any(kw in text_lower for kw in unpopular_keywords):
            score = min(score, 0.4)
            findings.append("Mesure potentiellement impopulaire (effort demande)")
            risks.append("Risque de contestation sociale")

        # Retraites = always contested in France
        if p.theme == "retraites" and "reculer" in text_lower or "65" in text_lower or "64" in text_lower:
            score = 0.2
            confidence = 0.8
            findings.append("Reforme des retraites = opposition sociale quasi-certaine en France")
            risks.append("Greves massives previsibles (precedent 2023, 2019, 2010, 1995)")

        return DimensionScore(
            score=round(score, 2),
            confidence=round(confidence, 2),
            justification="; ".join(findings) if findings else "Acceptabilite sociale moyenne",
            key_findings=findings,
            risks=risks,
        )

    def _score_impact(self, p: Promise) -> DimensionScore:
        """Heuristic socio-economic impact scoring."""
        score = 0.5
        confidence = 0.35
        findings = []
        risks = []

        # Quantified promises with clear targets = higher impact potential
        if p.quantification and p.quantification.value:
            score = 0.65
            confidence = 0.5
            findings.append(f"Objectif quantifie : {p.quantification.value} {p.quantification.unit or ''}")

        if p.target_population:
            findings.append(f"Population cible : {p.target_population}")
            score = min(score + 0.1, 1.0)

        # Vague promises = low impact certainty
        if p.precision_level == "vague":
            score = max(score - 0.2, 0.1)
            findings.append("Promesse vague, impact difficile a evaluer")

        return DimensionScore(
            score=round(score, 2),
            confidence=round(confidence, 2),
            justification="; ".join(findings) if findings else "Impact standard",
            key_findings=findings,
            risks=risks,
        )

    def _monte_carlo(self, dimensions: dict[str, DimensionScore], n: int = 1000) -> list[float]:
        """Monte Carlo simulation for confidence intervals."""
        rng = np.random.default_rng(42)
        results = []
        for _ in range(n):
            score = 0.0
            for dim, ds in dimensions.items():
                noise_std = (1 - ds.confidence) * 0.15
                perturbed = np.clip(ds.score + rng.normal(0, noise_std), 0, 1)
                score += MCDA_WEIGHTS[dim] * perturbed
            results.append(score)
        return results
