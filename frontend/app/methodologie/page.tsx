"use client";

import { useEffect, useRef, type ReactNode } from "react";

// ────────────────────────────────────────────
// Scroll-triggered reveal
// ────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: 0,
        transform: "translateY(28px)",
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ────────────────────────────────────────────
// Animated weight bar (fills on scroll)
// ────────────────────────────────────────────

function WeightBar({
  label,
  weight,
  color,
}: {
  label: string;
  weight: number;
  color: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.width = `${weight}%`;
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [weight]);

  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-right text-[13px] font-medium text-[#3a3a3a] shrink-0">
        {label}
      </span>
      <div className="flex-1 h-7 bg-[#f6f6f6] relative overflow-hidden">
        <div
          ref={barRef}
          className="h-full flex items-center justify-end pr-2.5"
          style={{
            width: "0%",
            backgroundColor: color,
            transition: "width 1s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}
        >
          <span className="text-[11px] font-mono font-bold text-white">
            {weight}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// Pipeline visual elements
// ────────────────────────────────────────────

function Spine() {
  return (
    <div className="flex justify-center">
      <div className="pipeline-spine w-[3px] h-14 bg-gradient-to-b from-[#000091] to-[#6a6af4]" />
    </div>
  );
}

function PhaseBadge({ number }: { number: string }) {
  return (
    <div className="flex justify-center">
      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#000091] text-white font-extrabold text-xl shadow-[0_0_0_5px_white,0_0_0_7px_#000091] transition-transform duration-300 hover:scale-105">
        {number}
      </div>
    </div>
  );
}

function ParallelLabel({ text }: { text: string }) {
  return (
    <div className="flex justify-center my-5">
      <div className="flex items-center gap-3 text-[11px] text-[#929292] uppercase tracking-[0.15em] font-semibold">
        <div className="h-[1px] w-10 bg-[#cecece]" />
        {text}
        <div className="h-[1px] w-10 bg-[#cecece]" />
      </div>
    </div>
  );
}

function AgentCard({
  name,
  role,
  question,
  details,
  weight,
  color,
  icon,
}: {
  name: string;
  role: string;
  question: string;
  details: string[];
  weight?: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      className="relative border border-[#e5e5e5] bg-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 h-full"
      style={{ borderTopWidth: "3px", borderTopColor: color }}
    >
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{icon}</span>
            <h3 className="font-bold text-[15px] text-[#161616]">{name}</h3>
          </div>
          {weight && (
            <span
              className="shrink-0 font-mono text-[11px] px-2 py-0.5 font-bold"
              style={{ backgroundColor: color + "14", color }}
            >
              {weight}
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#929292] uppercase tracking-[0.1em] ml-[34px]">
          {role}
        </p>

        <div
          className="mt-4 border-l-2 pl-3 ml-2.5"
          style={{ borderColor: color + "40" }}
        >
          <p
            className="text-[13px] font-semibold italic leading-snug"
            style={{ color }}
          >
            &laquo;&nbsp;{question}&nbsp;&raquo;
          </p>
        </div>

        <ul className="mt-4 space-y-2 ml-2.5 flex-1">
          {details.map((d, i) => (
            <li
              key={i}
              className="text-[13px] text-[#3a3a3a] flex gap-2 leading-relaxed"
            >
              <span style={{ color }} className="shrink-0 font-bold">
                &rsaquo;
              </span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────
// DATA
// ────────────────────────────────────────────

const COLLECTORS = [
  {
    name: "Les promesses",
    role: "Ce que disent les candidats",
    icon: "\u{1F4CB}",
    color: "#000091",
    question: "Qu\u2019est-ce que le candidat promet concr\u00e8tement\u202f?",
    details: [
      "On extrait 15 \u00e0 25 promesses concr\u00e8tes par candidat",
      "On consulte les programmes officiels, les discours et les interviews",
      "Chaque promesse est li\u00e9e \u00e0 sa source pour que vous puissiez v\u00e9rifier",
    ],
  },
  {
    name: "Le contexte \u00e9conomique",
    role: "L\u2019\u00e9tat des finances du pays",
    icon: "\u{1F4CA}",
    color: "#B34000",
    question: "Quel est l\u2019\u00e9tat r\u00e9el des finances publiques\u202f?",
    details: [
      "Richesse nationale, niveau de dette (113\u202f% du PIB), d\u00e9ficit (5,8\u202f%)",
      "Combien l\u2019\u00c9tat gagne et combien il d\u00e9pense chaque ann\u00e9e",
      "Les r\u00e8gles europ\u00e9ennes qui limitent les d\u00e9penses",
    ],
  },
  {
    name: "Le cadre juridique",
    role: "Ce que la loi permet ou interdit",
    icon: "\u2696\uFE0F",
    color: "#18753C",
    question: "Quelles sont les r\u00e8gles du jeu institutionnel\u202f?",
    details: [
      "Ce que la Constitution autorise ou interdit",
      "Les trait\u00e9s europ\u00e9ens qui s\u2019imposent \u00e0 la France",
      "La r\u00e9alit\u00e9 des rapports de force \u00e0 l\u2019Assembl\u00e9e et au S\u00e9nat",
    ],
  },
  {
    name: "Les pr\u00e9c\u00e9dents",
    role: "Ce que l\u2019histoire nous apprend",
    icon: "\u{1F4DA}",
    color: "#CE0500",
    question: "Qu\u2019ont donn\u00e9 les r\u00e9formes similaires par le pass\u00e9\u202f?",
    details: [
      "15 r\u00e9formes fran\u00e7aises r\u00e9centes\u202f: qu\u2019est-ce qui a march\u00e9 ou \u00e9chou\u00e9\u202f?",
      "Des exp\u00e9riences similaires \u00e0 l\u2019\u00e9tranger (Allemagne, Danemark, Su\u00e8de\u2026)",
      "Les \u00e9valuations d\u2019organismes ind\u00e9pendants (Institut Montaigne, IFRAP, Cour des Comptes)",
    ],
  },
];

const EXPERTS_ROW1 = [
  {
    name: "Le regard \u00e9conomique",
    role: "Analyse budg\u00e9taire",
    icon: "\u{1F4B0}",
    color: "#000091",
    weight: "25\u202f%",
    question: "Le budget tient-il\u202f?",
    details: [
      "Combien la mesure va-t-elle co\u00fbter r\u00e9ellement\u202f?",
      "Le financement annonc\u00e9 par le candidat est-il cr\u00e9dible\u202f?",
      "Quel impact sur la dette et le d\u00e9ficit du pays\u202f?",
      "Comparaison avec les estimations d\u2019organismes ind\u00e9pendants",
    ],
  },
  {
    name: "Le regard juridique",
    role: "Analyse constitutionnelle",
    icon: "\u2696\uFE0F",
    color: "#18753C",
    weight: "15\u202f%",
    question: "C\u2019est l\u00e9gal\u202f?",
    details: [
      "La mesure respecte-t-elle la Constitution\u202f?",
      "Y a-t-il un conflit avec le droit europ\u00e9en\u202f?",
      "Faut-il un simple d\u00e9cret, une loi, ou une r\u00e9vision constitutionnelle\u202f?",
      "Le gouvernement a-t-il les voix n\u00e9cessaires au Parlement\u202f?",
    ],
  },
  {
    name: "Le regard social",
    role: "Acceptabilit\u00e9 et impact",
    icon: "\u{1F465}",
    color: "#CE0500",
    weight: "10 + 15\u202f%",
    question: "Les Fran\u00e7ais vont-ils l\u2019accepter\u202f?",
    details: [
      "Qui sont les gagnants et les perdants de la mesure\u202f?",
      "Risque-t-on des gr\u00e8ves ou des manifestations\u202f?",
      "La mesure r\u00e9duit-elle ou aggrave-t-elle les in\u00e9galit\u00e9s\u202f?",
      "Que s\u2019est-il pass\u00e9 pour des r\u00e9formes similaires (retraites 2023, gilets jaunes\u2026)\u202f?",
    ],
  },
];

const EXPERTS_ROW2 = [
  {
    name: "La v\u00e9rification des faits",
    role: "Fact-checking",
    icon: "\u{1F50D}",
    color: "#B34000",
    weight: "Transversal",
    question: "Les chiffres avanc\u00e9s sont-ils vrais\u202f?",
    details: [
      "Chaque chiffre annonc\u00e9 est v\u00e9rifi\u00e9 contre les donn\u00e9es officielles",
      "On compare ce que dit le candidat avec ce que disent les organismes ind\u00e9pendants",
      "On rep\u00e8re les sources de financement souvent surestim\u00e9es (lutte contre la fraude, \u00e9conomies de gestion\u2026)",
      "On d\u00e9tecte les incoh\u00e9rences\u202f: un m\u00eame euro compt\u00e9 deux fois, des mesures qui se contredisent",
    ],
  },
  {
    name: "Les le\u00e7ons de l\u2019histoire",
    role: "Analyse des pr\u00e9c\u00e9dents",
    icon: "\u{1F3DB}\uFE0F",
    color: "#6A6AF4",
    weight: "15 + 10\u202f%",
    question: "Des r\u00e9formes similaires ont-elles d\u00e9j\u00e0 \u00e9t\u00e9 tent\u00e9es\u202f?",
    details: [
      "On recherche les pr\u00e9c\u00e9dents en France (15 r\u00e9formes r\u00e9centes analys\u00e9es)",
      "On regarde aussi \u00e0 l\u2019\u00e9tranger\u202f: Allemagne, Danemark, Su\u00e8de\u2026",
      "Qu\u2019est-ce qui a fait la diff\u00e9rence entre succ\u00e8s et \u00e9chec\u202f?",
      "En moyenne, seuls 60 \u00e0 70\u202f% d\u2019une promesse sont effectivement r\u00e9alis\u00e9s",
    ],
  },
];

const WEIGHT_BARS = [
  { label: "Budget", weight: 25, color: "#000091" },
  { label: "L\u00e9galit\u00e9", weight: 15, color: "#18753C" },
  { label: "Faisabilit\u00e9", weight: 15, color: "#6A6AF4" },
  { label: "Impact", weight: 15, color: "#CE0500" },
  { label: "Politique", weight: 10, color: "#B34000" },
  { label: "D\u00e9lai", weight: 10, color: "#0063CB" },
  { label: "Acceptation", weight: 10, color: "#A8328E" },
];

const SCORE_LABELS = [
  { label: "Tr\u00e8s faisable", range: "0.80 \u2013 1.00", color: "#18753C" },
  { label: "Faisable", range: "0.60 \u2013 0.79", color: "#4CAF50" },
  { label: "Partiellement", range: "0.40 \u2013 0.59", color: "#B34000" },
  { label: "Difficilement", range: "0.20 \u2013 0.39", color: "#CE0500" },
  { label: "Irr\u00e9aliste", range: "< 0.20", color: "#8B0000" },
];

const AUDIT_CHECKS = [
  {
    check: "Chaque collection est peupl\u00e9e",
    desc: "Programmes, \u00e9conomie, droit, pr\u00e9c\u00e9dents, \u00e9valuations",
  },
  {
    check: "Chaque promesse a une source URL",
    desc: "Pas de donn\u00e9e = pas d\u2019inclusion. On n\u2019invente jamais.",
  },
  {
    check: "Diversit\u00e9 des sources v\u00e9rifi\u00e9e",
    desc: "Au moins 2 orientations \u00e9ditoriales diff\u00e9rentes par promesse",
  },
  {
    check: "Coh\u00e9rence des donn\u00e9es",
    desc: "Recoupement entre sources, d\u00e9tection des contradictions",
  },
];

const REPORT_CARDS = [
  {
    icon: "\u{1F4CA}",
    title: "Scores comparatifs",
    desc: "Classement par faisabilit\u00e9 globale, par th\u00e8me, par cr\u00e9dibilit\u00e9 budg\u00e9taire. Top\u00a05 des promesses les plus et les moins faisables.",
  },
  {
    icon: "\u{1F50E}",
    title: "Fiches par promesse",
    desc: "7 axes de notation, justification d\u00e9taill\u00e9e, sources cit\u00e9es, intervalles de confiance, risques identifi\u00e9s.",
  },
  {
    icon: "\u26A0\uFE0F",
    title: "Contradictions",
    desc: "D\u00e9tection des incoh\u00e9rences\u202f: d\u00e9penses > recettes, double-comptage, politiques contradictoires.",
  },
];

// ────────────────────────────────────────────
// PAGE
// ────────────────────────────────────────────

export default function MethodologiePage() {
  return (
    <main className="pb-20">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-[#f5f5fe] border-b border-[#e5e5e5]">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(#000091 1px, transparent 1px),
              linear-gradient(90deg, #000091 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative mx-auto max-w-4xl px-6 py-20 text-center">
          <Reveal>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#000091] mb-5">
              M&eacute;thodologie
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#161616] leading-[1.1] tracking-tight">
              Comment PolitiScale
              <br />
              <span className="text-[#000091]">analyse un programme</span>
              <br />
              politique&nbsp;?
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-7 text-[17px] text-[#666666] leading-relaxed max-w-2xl mx-auto">
              Un processus en{" "}
              <strong className="text-[#161616]">5&nbsp;&eacute;tapes</strong>{" "}
              qui passe chaque promesse au crible, sous{" "}
              <strong className="text-[#161616]">7&nbsp;angles diff&eacute;rents</strong>,
              pour &eacute;valuer sa faisabilit&eacute; r&eacute;elle.
            </p>
          </Reveal>

          <Reveal delay={400}>
            <div className="mt-10 flex justify-center">
              <div className="flex flex-col items-center text-[#000091] animate-bounce">
                <span className="text-[11px] uppercase tracking-[0.15em] font-semibold mb-1.5">
                  D&eacute;couvrir
                </span>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M9 3v12M3 9l6 6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════ INTRO ═══════════ */}
      <section className="mx-auto max-w-3xl px-6 py-14">
        <Reveal>
          <div className="border-l-4 border-[#000091] pl-5">
            <h2 className="text-[20px] font-extrabold text-[#161616] mb-3">
              Qu&rsquo;est-ce que PolitiScale&nbsp;?
            </h2>
            <p className="text-[15px] text-[#666666] leading-relaxed mb-4">
              Quand un candidat promet de &laquo;&nbsp;baisser les imp&ocirc;ts
              de 10&nbsp;%&nbsp;&raquo; ou de &laquo;&nbsp;cr&eacute;er
              500&nbsp;000 emplois&nbsp;&raquo;, comment savoir si c&rsquo;est
              r&eacute;aliste&nbsp;? C&rsquo;est la question &agrave; laquelle
              PolitiScale essaie de r&eacute;pondre.
            </p>
            <p className="text-[15px] text-[#666666] leading-relaxed mb-4">
              L&rsquo;outil reproduit, gr&acirc;ce &agrave; l&rsquo;intelligence
              artificielle, le travail qu&rsquo;effectuerait une{" "}
              <strong className="text-[#161616]">
                &eacute;quipe pluridisciplinaire d&rsquo;experts
              </strong>{" "}
              &mdash; &eacute;conomiste, juriste, sociologue, journaliste de
              fact-checking, historien. Chacun examine chaque promesse sous
              son angle propre.
            </p>
            <p className="text-[15px] text-[#666666] leading-relaxed">
              Le r&eacute;sultat&nbsp;: un{" "}
              <strong className="text-[#161616]">score de faisabilit&eacute;</strong>{" "}
              pour chaque promesse, accompagn&eacute; de ses sources et de sa
              marge d&rsquo;incertitude. Pas d&rsquo;opinion, pas de parti pris
              &mdash; uniquement des faits v&eacute;rifiables et des
              m&eacute;thodologies transparentes.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ═══════════ PIPELINE ═══════════ */}
      <div className="mx-auto max-w-5xl px-6">
        {/* ─── PHASE 1: COLLECTE ─── */}
        <Spine />
        <Reveal>
          <PhaseBadge number="1" />
        </Reveal>

        <Reveal>
          <div className="text-center mt-7 mb-3">
            <h2 className="text-[26px] font-extrabold text-[#161616] tracking-tight">
              Collecte des donn&eacute;es
            </h2>
            <p className="mt-3 text-[15px] text-[#666666] max-w-2xl mx-auto leading-relaxed">
              Tout commence par les faits. Avant de juger si une promesse est
              r&eacute;aliste, il faut comprendre ce qui est promis &mdash; et
              dans quel contexte &eacute;conomique, juridique et historique.{" "}
              <strong className="text-[#161616]">
                Quatre recherches sont lanc&eacute;es simultan&eacute;ment.
              </strong>
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <ParallelLabel text="4 recherches simultan\u00e9es" />
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {COLLECTORS.map((agent, i) => (
            <Reveal key={agent.name} delay={i * 70}>
              <AgentCard {...agent} />
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="text-center text-[13px] text-[#929292] italic my-6">
            Toutes ces informations sont sauvegard&eacute;es et organis&eacute;es
            pour servir de base factuelle &agrave; l&rsquo;&eacute;tape suivante.
          </p>
        </Reveal>

        {/* ─── PHASE 2: AUDIT ─── */}
        <Spine />
        <Reveal>
          <PhaseBadge number="2" />
        </Reveal>

        <Reveal>
          <div className="text-center mt-7 mb-6">
            <h2 className="text-[26px] font-extrabold text-[#161616] tracking-tight">
              Audit qualit&eacute;
            </h2>
            <p className="mt-3 text-[15px] text-[#666666] max-w-2xl mx-auto leading-relaxed">
              Pause. Avant de continuer, on v&eacute;rifie tout. Pas de
              donn&eacute;e douteuse, pas de source manquante. C&rsquo;est le{" "}
              <strong className="text-[#161616]">point de contr&ocirc;le</strong>{" "}
              qui garantit la fiabilit&eacute; de la suite.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="mx-auto max-w-2xl border border-[#e5e5e5] bg-white p-6">
            <div className="space-y-4">
              {AUDIT_CHECKS.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-0.5 shrink-0 flex h-5 w-5 items-center justify-center bg-[#18753C] text-white">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#161616]">
                      {item.check}
                    </p>
                    <p className="text-[13px] text-[#666666]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-[#e5e5e5]">
              <p className="text-[13px] text-[#929292] italic">
                Si des lacunes sont d&eacute;tect&eacute;es, les recherches
                sont relanc&eacute;es pour combler les manques
                avant de poursuivre.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ─── PHASE 3: ANALYSE ─── */}
        <div className="mt-2">
          <Spine />
        </div>
        <Reveal>
          <PhaseBadge number="3" />
        </Reveal>

        <Reveal>
          <div className="text-center mt-7 mb-3">
            <h2 className="text-[26px] font-extrabold text-[#161616] tracking-tight">
              Analyse multi-experts
            </h2>
            <p className="mt-3 text-[15px] text-[#666666] max-w-2xl mx-auto leading-relaxed">
              Maintenant, place &agrave; l&rsquo;analyse. Chaque promesse est
              examin&eacute;e sous{" "}
              <strong className="text-[#161616]">
                5&nbsp;angles diff&eacute;rents
              </strong>{" "}
              &mdash; budget, droit, soci&eacute;t&eacute;,
              v&eacute;rit&eacute; des chiffres, le&ccedil;ons de l&rsquo;histoire.
              L&rsquo;IA simule le regard de chaque sp&eacute;cialiste
              avec sa grille d&rsquo;analyse propre.
            </p>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <ParallelLabel text="5 analyses ind\u00e9pendantes" />
        </Reveal>

        {/* Row 1: 3 experts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {EXPERTS_ROW1.map((agent, i) => (
            <Reveal key={agent.name} delay={i * 70}>
              <AgentCard {...agent} />
            </Reveal>
          ))}
        </div>

        {/* Row 2: 2 experts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXPERTS_ROW2.map((agent, i) => (
            <Reveal key={agent.name} delay={i * 70}>
              <AgentCard {...agent} />
            </Reveal>
          ))}
        </div>

        {/* ─── PHASE 4: SYNTHESE ─── */}
        <div className="mt-2">
          <Spine />
        </div>
        <Reveal>
          <PhaseBadge number="4" />
        </Reveal>

        <Reveal>
          <div className="text-center mt-7 mb-6">
            <h2 className="text-[26px] font-extrabold text-[#161616] tracking-tight">
              Synth&egrave;se &amp; scoring
            </h2>
            <p className="mt-3 text-[15px] text-[#666666] max-w-2xl mx-auto leading-relaxed">
              Les cinq analyses convergent. Un algorithme combine les
              7&nbsp;dimensions en un{" "}
              <strong className="text-[#161616]">
                score unique de faisabilit&eacute;
              </strong>
              , en donnant plus ou moins de poids &agrave; chaque
              crit&egrave;re selon son importance. Le budget p&egrave;se
              par exemple plus lourd que le d&eacute;lai de
              r&eacute;alisation.
            </p>
          </div>
        </Reveal>

        <Reveal>
          <div className="mx-auto max-w-2xl border border-[#e5e5e5] bg-white p-6">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#929292] mb-5">
              Pond&eacute;ration des dimensions
            </h3>
            <div className="space-y-2.5">
              {WEIGHT_BARS.map((bar) => (
                <WeightBar key={bar.label} {...bar} />
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-[#e5e5e5]">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#929292] mb-4">
                &Eacute;chelle de faisabilit&eacute;
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SCORE_LABELS.map((s) => (
                  <div key={s.label} className="flex items-center gap-2.5">
                    <div
                      className="h-3 w-3 shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-[13px] text-[#3a3a3a]">
                      <span className="font-semibold">{s.label}</span>
                      <span className="text-[#929292] ml-1.5">
                        ({s.range})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#e5e5e5]">
              <p className="text-[13px] text-[#666666] leading-relaxed">
                Chaque score est accompagn&eacute; d&rsquo;une{" "}
                <strong className="text-[#161616]">
                  marge d&rsquo;incertitude
                </strong>
                &nbsp;: plus les donn&eacute;es sont solides, plus la marge est
                &eacute;troite. Si deux analyses aboutissent &agrave; des
                conclusions tr&egrave;s diff&eacute;rentes, les deux points de
                vue sont expliqu&eacute;s.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ─── PHASE 5: RAPPORT ─── */}
        <div className="mt-2">
          <Spine />
        </div>
        <Reveal>
          <PhaseBadge number="5" />
        </Reveal>

        <Reveal>
          <div className="text-center mt-7 mb-6">
            <h2 className="text-[26px] font-extrabold text-[#161616] tracking-tight">
              Rapport final
            </h2>
            <p className="mt-3 text-[15px] text-[#666666] max-w-2xl mx-auto leading-relaxed">
              Le r&eacute;sultat est l&agrave;. Transparent, sourc&eacute;, et
              toujours accompagn&eacute; de ses limites. Chaque promesse a un
              score, chaque score a une justification, chaque justification a
              une source.
            </p>
          </div>
        </Reveal>

        <div className="mx-auto max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-4">
          {REPORT_CARDS.map((item, i) => (
            <Reveal key={item.title} delay={i * 70}>
              <div className="border border-[#e5e5e5] bg-white p-6 text-center h-full transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                <span className="text-3xl">{item.icon}</span>
                <h3 className="mt-3 font-bold text-[14px] text-[#161616]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[13px] text-[#666666] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ─── TERMINUS ─── */}
        <Spine />
        <div className="flex justify-center">
          <div className="h-4 w-4 rounded-full bg-[#000091]" />
        </div>

        {/* ─── METHODES ACADEMIQUES ─── */}
        <Reveal>
          <div className="mx-auto max-w-4xl mt-20 mb-16">
            <div className="text-center mb-10">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#000091] mb-3">
                Fondements
              </p>
              <h2 className="text-[28px] font-extrabold text-[#161616] tracking-tight">
                Sur quoi reposent nos analyses&nbsp;?
              </h2>
              <p className="mt-3 text-[15px] text-[#666666] max-w-2xl mx-auto leading-relaxed">
                PolitiScale s&rsquo;appuie sur des m&eacute;thodes
                reconnues en science politique et en aide &agrave; la
                d&eacute;cision. Voici les principales.
              </p>
            </div>

            {/* ── CHES ── */}
            <div className="border border-[#e5e5e5] bg-white p-6 sm:p-8 mb-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl shrink-0">🧭</span>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#161616]">
                    Comment sait-on si un parti est &laquo;&nbsp;de
                    gauche&nbsp;&raquo; ou &laquo;&nbsp;de
                    droite&nbsp;&raquo;&nbsp;?
                  </h3>
                  <p className="text-[12px] text-[#929292] uppercase tracking-wider mt-0.5">
                    Chapel Hill Expert Survey (CHES) &middot; Universit&eacute;
                    de Caroline du Nord
                  </p>
                </div>
              </div>

              <p className="text-[14px] text-[#3a3a3a] leading-relaxed mb-4">
                Plut&ocirc;t que de d&eacute;cider nous-m&ecirc;mes o&ugrave;
                placer un parti, nous utilisons le{" "}
                <strong className="text-[#161616]">
                  Chapel Hill Expert Survey
                </strong>{" "}
                (CHES), une enqu&ecirc;te men&eacute;e depuis 1999 aupr&egrave;s
                de centaines de chercheurs en science politique &agrave; travers
                l&rsquo;Europe. Ces experts positionnent chaque parti sur
                plusieurs axes, de 0 &agrave; 10.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="bg-[#f5f5fe] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[#000091]">
                      Gauche &mdash; Droite
                    </span>
                    <span className="text-[11px] text-[#929292] font-mono">
                      LRGEN
                    </span>
                  </div>
                  <p className="text-[13px] text-[#3a3a3a] leading-relaxed">
                    Le positionnement g&eacute;n&eacute;ral du parti.
                    C&rsquo;est cet axe qui est affich&eacute; sur les fiches
                    partis de PolitiScale.
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#929292]">
                    <span className="font-semibold text-[#CE0500]">0</span>
                    <div className="flex-1 h-1.5 bg-gradient-to-r from-[#CE0500] via-[#B34000] to-[#000091]" />
                    <span className="font-semibold text-[#000091]">10</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#929292] mt-0.5">
                    <span>Extr&ecirc;me gauche</span>
                    <span>Extr&ecirc;me droite</span>
                  </div>
                </div>

                <div className="bg-[#f5f5fe] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[#000091]">
                      &Eacute;conomie
                    </span>
                    <span className="text-[11px] text-[#929292] font-mono">
                      LRECON
                    </span>
                  </div>
                  <p className="text-[13px] text-[#3a3a3a] leading-relaxed">
                    La vision &eacute;conomique&nbsp;: davantage
                    d&rsquo;intervention de l&rsquo;&Eacute;tat (0) ou davantage
                    de libre march&eacute; (10)&nbsp;?
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#929292]">
                    <span className="font-semibold text-[#CE0500]">0</span>
                    <div className="flex-1 h-1.5 bg-gradient-to-r from-[#CE0500] via-[#B34000] to-[#000091]" />
                    <span className="font-semibold text-[#000091]">10</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#929292] mt-0.5">
                    <span>Interventionnisme</span>
                    <span>Libre march&eacute;</span>
                  </div>
                </div>

                <div className="bg-[#f5f5fe] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold uppercase tracking-wider text-[#000091]">
                      Valeurs
                    </span>
                    <span className="text-[11px] text-[#929292] font-mono">
                      GAL-TAN
                    </span>
                  </div>
                  <p className="text-[13px] text-[#3a3a3a] leading-relaxed">
                    Les valeurs soci&eacute;tales&nbsp;: lib&eacute;ral sur les
                    moeurs et &eacute;cologiste (0) ou conservateur et
                    traditionaliste (10)&nbsp;?
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#929292]">
                    <span className="font-semibold text-[#CE0500]">0</span>
                    <div className="flex-1 h-1.5 bg-gradient-to-r from-[#CE0500] via-[#B34000] to-[#000091]" />
                    <span className="font-semibold text-[#000091]">10</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#929292] mt-0.5">
                    <span>Progressiste</span>
                    <span>Conservateur</span>
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-[#666666] leading-relaxed">
                L&rsquo;&eacute;dition utilis&eacute;e est{" "}
                <strong className="text-[#161616]">CHES&nbsp;2024</strong>,
                couvrant les 10&nbsp;principaux partis fran&ccedil;ais. Les
                donn&eacute;es historiques (depuis 1999) permettent aussi de
                visualiser l&rsquo;&eacute;volution du positionnement dans le
                temps.
              </p>
            </div>

            {/* ── MCDA ── */}
            <div className="border border-[#e5e5e5] bg-white p-6 sm:p-8 mb-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl shrink-0">⚖️</span>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#161616]">
                    Comment calcule-t-on le score de faisabilit&eacute;&nbsp;?
                  </h3>
                  <p className="text-[12px] text-[#929292] uppercase tracking-wider mt-0.5">
                    Analyse multicrit&egrave;re (MCDA) &middot; Aide &agrave; la
                    d&eacute;cision
                  </p>
                </div>
              </div>

              <p className="text-[14px] text-[#3a3a3a] leading-relaxed mb-4">
                Pour combiner les 7&nbsp;notes en un score unique, on utilise
                une m&eacute;thode issue de l&rsquo;
                <strong className="text-[#161616]">
                  aide &agrave; la d&eacute;cision multicrit&egrave;re
                </strong>{" "}
                (MCDA en anglais). Le principe est simple&nbsp;: plut&ocirc;t
                que de faire une simple moyenne, chaque crit&egrave;re a un{" "}
                <strong className="text-[#161616]">poids</strong> qui
                refl&egrave;te son importance relative. Le budget (25&nbsp;%)
                p&egrave;se par exemple plus que le d&eacute;lai de
                r&eacute;alisation (10&nbsp;%).
              </p>

              <p className="text-[14px] text-[#3a3a3a] leading-relaxed mb-4">
                Cette approche est utilis&eacute;e dans de nombreux domaines
                &mdash; &eacute;valuation des politiques publiques,
                ing&eacute;nierie, sant&eacute; &mdash; parce qu&rsquo;elle
                permet de rendre transparent le raisonnement&nbsp;: on voit
                exactement pourquoi une promesse obtient tel ou tel score.
              </p>

              <div className="bg-[#f5f5fe] p-4">
                <p className="text-[13px] text-[#3a3a3a] leading-relaxed">
                  <strong className="text-[#000091]">
                    La marge d&rsquo;incertitude
                  </strong>{" "}
                  &mdash; Chaque note est accompagn&eacute;e d&rsquo;un indice
                  de confiance (de 0 &agrave; 1). Quand les donn&eacute;es sont
                  fragiles ou que les sources divergent, la confiance baisse et
                  la marge d&rsquo;incertitude augmente. Cela signifie&nbsp;:
                  &laquo;&nbsp;le score est autour de X, mais il pourrait varier
                  de Y&nbsp;&raquo;.
                </p>
              </div>
            </div>

            {/* ── Sources ── */}
            <div className="border border-[#e5e5e5] bg-white p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-2xl shrink-0">📰</span>
                <div>
                  <h3 className="text-[17px] font-extrabold text-[#161616]">
                    Comment garantit-on la neutralit&eacute;&nbsp;?
                  </h3>
                  <p className="text-[12px] text-[#929292] uppercase tracking-wider mt-0.5">
                    Diversit&eacute; des sources &middot; Croisement
                    syst&eacute;matique
                  </p>
                </div>
              </div>

              <p className="text-[14px] text-[#3a3a3a] leading-relaxed mb-4">
                Pour chaque promesse, nous croisons au minimum{" "}
                <strong className="text-[#161616]">
                  deux sources d&rsquo;orientations diff&eacute;rentes
                </strong>
                . Par exemple, un chiffrage de l&rsquo;Institut Montaigne (plut&ocirc;t
                lib&eacute;ral) est confront&eacute; &agrave; une analyse
                de France Strat&eacute;gie ou de la Cour des Comptes
                (institutionnel). Cette r&egrave;gle s&rsquo;applique
                syst&eacute;matiquement.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    type: "Donn\u00e9es officielles",
                    examples: "INSEE, budget.gouv.fr, L\u00e9gifrance, Eurostat",
                  },
                  {
                    type: "Organismes ind\u00e9pendants",
                    examples: "Institut Montaigne, IFRAP, Cour des Comptes, France Strat\u00e9gie",
                  },
                  {
                    type: "Recherche acad\u00e9mique",
                    examples: "CHES (positionnement), OFCE, CEPII, DREES",
                  },
                  {
                    type: "Sources primaires",
                    examples: "Programmes officiels des partis, d\u00e9bats parlementaires",
                  },
                ].map((src) => (
                  <div key={src.type} className="flex gap-2.5">
                    <div className="mt-1.5 h-2 w-2 shrink-0 bg-[#000091]" />
                    <div>
                      <p className="text-[13px] font-semibold text-[#161616]">
                        {src.type}
                      </p>
                      <p className="text-[12px] text-[#929292]">
                        {src.examples}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-[#e5e5e5]">
                <p className="text-[13px] text-[#666666] leading-relaxed italic">
                  R&egrave;gle cl&eacute;&nbsp;: si une donn&eacute;e n&rsquo;est
                  pas disponible, on ne l&rsquo;invente pas. L&rsquo;absence
                  d&rsquo;information dans nos sources n&rsquo;est jamais
                  confondue avec une absence de financement propos&eacute; par le
                  candidat.
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ─── DISCLAIMER ─── */}
        <Reveal>
          <div className="mx-auto max-w-3xl mt-14 border-l-4 border-[#B34000] bg-[#FEF4F4] p-5">
            <p className="text-[13px] text-[#3a3a3a] leading-relaxed">
              <strong className="text-[#B34000]">
                Avertissement &mdash;
              </strong>{" "}
              Cette analyse est produite par des syst&egrave;mes automatis&eacute;s
              utilisant l&rsquo;intelligence artificielle. Elle s&rsquo;appuie
              sur des donn&eacute;es publiques et des m&eacute;thodologies
              transparentes mais ne remplace pas l&rsquo;expertise humaine, le
              d&eacute;bat d&eacute;mocratique ou le jugement citoyen. Les
              scores de faisabilit&eacute; sont des estimations avec marges
              d&rsquo;incertitude.
            </p>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
