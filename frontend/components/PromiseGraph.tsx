"use client";

import { useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
  Position,
  Handle,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { Promise as PPromise, FeasibilityDimension } from "@/lib/api";

/* ── Constants ── */

const DIMENSION_LABELS: Record<string, string> = {
  budget: "Budget",
  juridique: "Juridique",
  technique: "Technique",
  politique: "Politique",
  timeline: "Calendrier",
  social: "Acceptabilité",
  impact: "Impact",
};

const DIMENSION_WEIGHTS: Record<string, number> = {
  budget: 25,
  juridique: 15,
  technique: 15,
  politique: 10,
  timeline: 10,
  social: 10,
  impact: 15,
};

const DIMENSION_ICONS: Record<string, string> = {
  budget: "\u20ac",
  juridique: "\u2696",
  technique: "\u2699",
  politique: "\ud83c\udfdb",
  timeline: "\u23f1",
  social: "\ud83d\udc65",
  impact: "\ud83c\udfaf",
};

const THEME_COLORS: Record<string, string> = {
  economie: "#000091",
  emploi: "#000091",
  retraites: "#a558a0",
  sante: "#18753C",
  education: "#0063cb",
  securite: "#CE0500",
  immigration: "#B34000",
  environnement: "#18753C",
  logement: "#B34000",
  institutions: "#666666",
  international: "#000091",
  culture: "#a558a0",
  agriculture: "#18753C",
  numerique: "#0063cb",
};

/* ── Color helpers ── */

function scoreColor(score: number): string {
  if (score >= 0.6) return "#18753C";
  if (score >= 0.3) return "#B34000";
  return "#CE0500";
}

function scoreBg(score: number): string {
  if (score >= 0.6) return "#E8F5EE";
  if (score >= 0.3) return "#FEF5EE";
  return "#FEF4F4";
}

function scoreBorder(score: number): string {
  if (score >= 0.6) return "#b8e0c8";
  if (score >= 0.3) return "#f5dcc8";
  return "#f5c8c8";
}

/* ── Custom nodes ── */

type PromiseNodeData = {
  promise: PPromise;
  isSelected: boolean;
};

function PromiseNode({ data }: NodeProps<Node<PromiseNodeData>>) {
  const p = data.promise;
  const score = p.feasibility?.overall ?? null;
  const themeColor = THEME_COLORS[p.theme] || "#666666";

  return (
    <div
      className="group relative"
      style={{
        width: 260,
        background: data.isSelected ? "#f0f0ff" : "#ffffff",
        border: `2px solid ${data.isSelected ? "#000091" : "#e5e5e5"}`,
        borderRadius: 2,
        padding: "12px 14px",
        fontFamily: "Marianne, system-ui, sans-serif",
        boxShadow: data.isSelected
          ? "0 4px 20px rgba(0,0,145,0.15)"
          : "0 1px 4px rgba(0,0,0,0.06)",
        transition: "box-shadow 0.15s, border-color 0.15s",
        cursor: "pointer",
      }}
    >
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />

      {/* Theme badge */}
      <div className="flex items-center gap-2 mb-1.5">
        <span
          style={{
            display: "inline-block",
            background: themeColor,
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            padding: "1px 7px",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          {p.theme}
        </span>
        {score !== null && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: scoreColor(score),
            }}
          >
            {Math.round(score * 100)}%
          </span>
        )}
      </div>

      {/* Promise text */}
      <p
        style={{
          fontSize: 12,
          lineHeight: "1.4",
          color: "#3a3a3a",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          margin: 0,
        }}
      >
        {p.raw_text}
      </p>

      {/* Score bar */}
      {score !== null && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              height: 4,
              width: "100%",
              background: "#eeeeee",
              borderRadius: 2,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(score * 100)}%`,
                background: scoreColor(score),
                borderRadius: 2,
                transition: "width 0.3s",
              }}
            />
          </div>
          {p.feasibility?.label && (
            <span style={{ fontSize: 10, color: "#929292", marginTop: 2, display: "block" }}>
              {p.feasibility.label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

type DimensionNodeData = {
  dimension: string;
  dim: FeasibilityDimension;
  promiseId: string;
};

function DimensionNode({ data }: NodeProps<Node<DimensionNodeData>>) {
  const { dimension, dim } = data;
  const pct = Math.round(dim.score * 100);
  const icon = DIMENSION_ICONS[dimension] || "";
  const weight = DIMENSION_WEIGHTS[dimension];

  return (
    <div
      style={{
        width: 220,
        background: scoreBg(dim.score),
        border: `1.5px solid ${scoreBorder(dim.score)}`,
        borderRadius: 2,
        padding: "10px 12px",
        fontFamily: "Marianne, system-ui, sans-serif",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 12, fontWeight: 700, color: "#161616" }}>
          {icon} {DIMENSION_LABELS[dimension] || dimension}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: scoreColor(dim.score),
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {pct}%
        </span>
      </div>

      {/* Weight */}
      {weight != null && (
        <span style={{ fontSize: 9, color: "#929292", fontWeight: 500 }}>
          Poids MCDA : {weight}%
        </span>
      )}

      {/* Bar */}
      <div style={{ marginTop: 6 }}>
        <div style={{ height: 5, width: "100%", background: "#e0e0e0", borderRadius: 2 }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: scoreColor(dim.score),
              borderRadius: 2,
            }}
          />
        </div>
      </div>

      {/* Confidence */}
      <div style={{ marginTop: 4, fontSize: 10, color: "#666666" }}>
        Confiance : {Math.round(dim.confidence * 100)}%
      </div>

      {/* Justification */}
      <p
        style={{
          fontSize: 10,
          lineHeight: "1.35",
          color: "#3a3a3a",
          marginTop: 6,
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {dim.justification}
      </p>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  promise: PromiseNode,
  dimension: DimensionNode,
};

/* ── Layout ── */

const PROMISE_W = 260;
const PROMISE_GAP_Y = 20;
const PROMISE_H = 130;
const DIM_W = 220;
const DIM_GAP_Y = 10;
const DIM_H = 155;
const COLUMN_GAP = 100;

function buildGraph(
  promises: PPromise[],
  selectedId: string | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Promise nodes — left column
  let py = 0;
  for (const p of promises) {
    const isSelected = p.id === selectedId;

    nodes.push({
      id: p.id,
      type: "promise",
      position: { x: 0, y: py },
      data: { promise: p, isSelected },
    });

    // Dimension nodes — right column, only for selected promise
    if (isSelected && p.feasibility?.dimensions) {
      const dims = Object.entries(p.feasibility.dimensions);
      const totalDimsH = dims.length * DIM_H + (dims.length - 1) * DIM_GAP_Y;
      const startY = py + PROMISE_H / 2 - totalDimsH / 2;

      dims.forEach(([key, dim], i) => {
        const dimId = `${p.id}__${key}`;
        const dy = startY + i * (DIM_H + DIM_GAP_Y);

        nodes.push({
          id: dimId,
          type: "dimension",
          position: { x: PROMISE_W + COLUMN_GAP, y: dy },
          data: { dimension: key, dim: dim as FeasibilityDimension, promiseId: p.id },
        });

        edges.push({
          id: `e-${p.id}-${key}`,
          source: p.id,
          target: dimId,
          type: "smoothstep",
          animated: true,
          style: { stroke: scoreColor((dim as FeasibilityDimension).score), strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: scoreColor((dim as FeasibilityDimension).score) },
        });
      });
    }

    py += PROMISE_H + PROMISE_GAP_Y;
  }

  return { nodes, edges };
}

/* ── Filters ── */

const THEMES = [
  "economie", "emploi", "retraites", "sante", "education", "securite",
  "immigration", "environnement", "logement", "institutions", "international",
  "culture", "agriculture", "numerique",
];

const THEME_LABELS: Record<string, string> = {
  economie: "Économie",
  emploi: "Emploi",
  retraites: "Retraites",
  sante: "Santé",
  education: "Éducation",
  securite: "Sécurité",
  immigration: "Immigration",
  environnement: "Environnement",
  logement: "Logement",
  institutions: "Institutions",
  international: "International",
  culture: "Culture",
  agriculture: "Agriculture",
  numerique: "Numérique",
};

/* ── Main component ── */

interface PromiseGraphProps {
  promises: PPromise[];
}

export default function PromiseGraph({ promises }: PromiseGraphProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [themeFilter, setThemeFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...promises].sort((a, b) => a.theme.localeCompare(b.theme));
    if (!themeFilter) return sorted;
    return sorted.filter((p) => p.theme === themeFilter);
  }, [promises, themeFilter]);

  const activeThemes = useMemo(
    () => [...new Set(promises.map((p) => p.theme))].sort(),
    [promises]
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraph(filtered, selectedId),
    [filtered, selectedId]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when selection or filter changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type === "promise") {
        setSelectedId((prev) => (prev === node.id ? null : node.id));
      }
    },
    []
  );

  const selectedPromise = filtered.find((p) => p.id === selectedId);

  if (promises.length === 0) {
    return (
      <div className="border border-[#e5e5e5] bg-white p-6">
        <h3 className="mb-4 text-lg font-bold text-[#161616]">Graphe des promesses</h3>
        <p className="text-[#666666]">Aucune promesse disponible.</p>
      </div>
    );
  }

  // Compute canvas height
  const canvasH = Math.max(
    filtered.length * (PROMISE_H + PROMISE_GAP_Y),
    selectedPromise?.feasibility?.dimensions
      ? Object.keys(selectedPromise.feasibility.dimensions).length * (DIM_H + DIM_GAP_Y)
      : 400,
    500
  );

  return (
    <div className="border border-[#e5e5e5] bg-white">
      {/* Header + filters */}
      <div className="px-6 pt-6 pb-4 border-b border-[#e5e5e5]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[#161616]">
            Graphe des promesses ({filtered.length})
          </h3>
          {selectedId && (
            <button
              onClick={() => setSelectedId(null)}
              className="text-xs text-[#000091] font-medium hover:underline"
            >
              Fermer le détail
            </button>
          )}
        </div>

        {/* Theme filter pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setThemeFilter(null)}
            className="px-2.5 py-1 text-[11px] font-medium transition-colors"
            style={{
              background: !themeFilter ? "#000091" : "#f6f6f6",
              color: !themeFilter ? "#fff" : "#666666",
              border: `1px solid ${!themeFilter ? "#000091" : "#e5e5e5"}`,
            }}
          >
            Tous
          </button>
          {activeThemes.map((t) => (
            <button
              key={t}
              onClick={() => setThemeFilter(themeFilter === t ? null : t)}
              className="px-2.5 py-1 text-[11px] font-medium transition-colors"
              style={{
                background: themeFilter === t ? (THEME_COLORS[t] || "#666") : "#f6f6f6",
                color: themeFilter === t ? "#fff" : "#3a3a3a",
                border: `1px solid ${themeFilter === t ? (THEME_COLORS[t] || "#666") : "#e5e5e5"}`,
              }}
            >
              {THEME_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      {/* Graph canvas */}
      <div style={{ height: Math.min(canvasH + 80, 900), minHeight: 500 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          style={{ background: "#fafafa" }}
        />
      </div>

      {/* Detail panel for selected promise */}
      {selectedPromise && selectedPromise.feasibility?.dimensions && (
        <div className="border-t border-[#e5e5e5] px-6 py-5 bg-[#f6f6f6]">
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#666666] mb-1">
                Promesse sélectionnée
              </p>
              <p className="text-sm text-[#3a3a3a] leading-relaxed">
                {selectedPromise.raw_text}
              </p>
              {selectedPromise.candidate_justification && (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-[#929292] mb-0.5">
                    Justification du candidat
                  </p>
                  <p className="text-xs text-[#3a3a3a] italic leading-relaxed">
                    {selectedPromise.candidate_justification}
                  </p>
                </div>
              )}
              {selectedPromise.source_url && (
                <a
                  href={selectedPromise.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-[#000091] underline hover:text-[#1212FF]"
                >
                  Source
                </a>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#666666] mb-2">
                Rapports d&apos;experts — 7 dimensions
              </p>
              <div className="space-y-2">
                {Object.entries(selectedPromise.feasibility.dimensions).map(([key, dim]) => {
                  const d = dim as FeasibilityDimension;
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 p-2"
                      style={{ background: scoreBg(d.score), border: `1px solid ${scoreBorder(d.score)}` }}
                    >
                      <span className="text-sm">{DIMENSION_ICONS[key]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#161616]">
                            {DIMENSION_LABELS[key] || key}
                          </span>
                          <span
                            className="text-xs font-bold tabular-nums"
                            style={{ color: scoreColor(d.score) }}
                          >
                            {Math.round(d.score * 100)}%
                          </span>
                        </div>
                        <p className="text-[10px] text-[#3a3a3a] mt-0.5 line-clamp-2">
                          {d.justification}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
