import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  X, 
  Search, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Box, 
  Maximize2, 
  Sparkles, 
  Info, 
  ExternalLink, 
  Activity,
  Sliders,
  Play,
  Pause
} from 'lucide-react';
import { apiService } from '../../services/apiService';


// Department Color Palette for 3D Vector Nodes
const DEPT_COLORS = {
  'credit-cards': { hex: '#0057B8', light: '#60a5fa', name: 'Credit Cards', bg: 'bg-[#0057B8]' },
  'retail-lending': { hex: '#059669', light: '#34d399', name: 'Retail Lending', bg: 'bg-emerald-600' },
  'onboarding': { hex: '#7c3aed', light: '#a78bfa', name: 'Onboarding & KYC', bg: 'bg-purple-600' },
  'security': { hex: '#d97706', light: '#fbbf24', name: 'Security & InfoSec', bg: 'bg-amber-600' },
  'legal-compliance': { hex: '#e11d48', light: '#fb7185', name: 'Legal & Compliance', bg: 'bg-rose-600' },
  'other': { hex: '#475569', light: '#94a3b8', name: 'General Governance', bg: 'bg-slate-600' }
};

export default function VectorSpaceModal({
  isOpen,
  onClose,
  policies = [],
  onSelectPolicy
}) {
  const canvasRef = useRef(null);
  const [vectorData, setVectorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showEdges, setShowEdges] = useState(true);

  // Camera 3D State
  const cameraRef = useRef({
    yaw: 0.4,
    pitch: 0.25,
    distance: 650,
    targetYaw: 0.4,
    targetPitch: 0.25,
    targetDistance: 650
  });

  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // 1. Fetch live vector chunks from DB, with fallback to structured policy clauses
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadVectors() {
      setLoading(true);
      try {
        const rawVectors = await apiService.getVectors();
        if (isMounted && rawVectors && rawVectors.length > 0) {
          processAndClusterNodes(rawVectors);
        } else {
          // Generate realistic 3D semantic vector nodes from available policies
          buildSynthesizedNodes();
        }
      } catch (err) {
        console.warn('Falling back to synthesized 3D policy vectors:', err);
        buildSynthesizedNodes();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVectors();
    return () => { isMounted = false; };
  }, [isOpen, policies]);

  // Convert raw DB vectors into 3D clustered positions
  const processAndClusterNodes = (dbRows) => {
    const nodes = dbRows.map((row, idx) => {
      const dept = row.department_id || 'other';
      const clusterAngle = getClusterBaseAngle(dept);
      const radius = 180 + (idx % 4) * 45;
      const angle = clusterAngle + ((idx % 7) - 3) * 0.22;
      const height = ((idx % 5) - 2) * 55;

      return {
        id: `vec-${row.id || idx}`,
        policyId: row.policy_id,
        title: row.section_title || `Clause ${idx + 1}`,
        documentName: row.document_name || 'Operational Standard',
        department: dept,
        type: row.section_type || 'clause',
        preview: row.preview || (row.chunk_content ? row.chunk_content.slice(0, 150) : ''),
        x: Math.cos(angle) * radius + (Math.sin(idx * 3) * 20),
        y: height + (Math.cos(idx * 2) * 25),
        z: Math.sin(angle) * radius + (Math.sin(idx * 5) * 20),
        size: 7 + (idx % 3) * 2.5,
        color: DEPT_COLORS[dept]?.hex || DEPT_COLORS.other.hex,
        lightColor: DEPT_COLORS[dept]?.light || DEPT_COLORS.other.light
      };
    });

    setVectorData(nodes);
    if (nodes.length > 0) setSelectedNode(nodes[0]);
  };

  // Build semantic clusters when DB table has fresh/empty records
  const buildSynthesizedNodes = () => {
    const allPols = (policies && policies.length > 0) ? policies : [];
    const generated = [];

    allPols.forEach((pol, pIdx) => {
      const dept = pol.department_id || 'other';
      const baseAngle = getClusterBaseAngle(dept);
      const polCenterR = 210;
      const polX = Math.cos(baseAngle) * polCenterR;
      const polZ = Math.sin(baseAngle) * polCenterR;
      const polY = ((pIdx % 3) - 1) * 70;

      // 1. Policy Root Node
      generated.push({
        id: `pol-${pol.id}`,
        policyId: pol.id,
        title: pol.title,
        documentName: `${pol.id}.pdf`,
        department: dept,
        type: 'Policy Root',
        preview: pol.summary || 'Authoritative banking standard',
        x: polX,
        y: polY,
        z: polZ,
        size: 11,
        color: DEPT_COLORS[dept]?.hex || DEPT_COLORS.other.hex,
        lightColor: DEPT_COLORS[dept]?.light || DEPT_COLORS.other.light,
        isRoot: true
      });

      // 2. Clause Vector Chunks orbiting the policy root
      const clauseTitles = [
        'Purpose & Statutory Mandate',
        'Operational Underwriting Rules',
        'Approved Methodologies & Matrix',
        'Validity Periods & Turnaround SLA',
        'Operational Events & Lifecycle Triggers'
      ];

      clauseTitles.forEach((cTitle, cIdx) => {
        const subAngle = (cIdx / clauseTitles.length) * Math.PI * 2;
        const subR = 65;
        generated.push({
          id: `clause-${pol.id}-${cIdx}`,
          policyId: pol.id,
          title: cTitle,
          documentName: pol.title,
          department: dept,
          type: 'Vector Chunk',
          preview: `Discrete semantic embedding chunk for ${cTitle} in ${pol.title}. Enforced under APRA/ASIC standards.`,
          x: polX + Math.cos(subAngle) * subR,
          y: polY + ((cIdx % 3) - 1) * 35,
          z: polZ + Math.sin(subAngle) * subR,
          size: 6.5,
          color: DEPT_COLORS[dept]?.hex || DEPT_COLORS.other.hex,
          lightColor: DEPT_COLORS[dept]?.light || DEPT_COLORS.other.light,
          parentRootId: `pol-${pol.id}`
        });
      });
    });

    setVectorData(generated);
    if (generated.length > 0) setSelectedNode(generated[0]);
  };

  const getClusterBaseAngle = (dept) => {
    switch (dept) {
      case 'credit-cards': return 0;
      case 'retail-lending': return (Math.PI * 2) * (1 / 5);
      case 'onboarding': return (Math.PI * 2) * (2 / 5);
      case 'security': return (Math.PI * 2) * (3 / 5);
      case 'legal-compliance': return (Math.PI * 2) * (4 / 5);
      default: return Math.PI;
    }
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return vectorData.filter(node => {
      const matchDept = selectedDept === 'all' || node.department === selectedDept;
      const matchSearch = !searchQuery.trim() || 
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.documentName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [vectorData, selectedDept, searchQuery]);

  // 3D Rendering Canvas Engine Loop
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Handle high DPI crisp rendering
    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // 40 Ambient Star Particles
    const stars = Array.from({ length: 45 }, (_, i) => ({
      x: (Math.sin(i * 1.5) * 600),
      y: (Math.cos(i * 2.3) * 450),
      z: (Math.sin(i * 3.1) * 600),
      alpha: 0.15 + (i % 5) * 0.08
    }));

    // Animation Loop
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const cx = width / 2;
      const cy = height / 2;

      // Smooth auto-orbit rotation
      if (autoRotate && !isDraggingRef.current) {
        cameraRef.current.targetYaw += 0.0025;
      }

      // Smooth camera interpolation
      cameraRef.current.yaw += (cameraRef.current.targetYaw - cameraRef.current.yaw) * 0.1;
      cameraRef.current.pitch += (cameraRef.current.targetPitch - cameraRef.current.pitch) * 0.1;
      cameraRef.current.distance += (cameraRef.current.targetDistance - cameraRef.current.distance) * 0.1;

      const { yaw, pitch, distance } = cameraRef.current;
      const fov = 420;

      // Clear Canvas with sleek deep-navy gradient background
      ctx.clearRect(0, 0, width, height);
      const bgGrad = ctx.createRadialGradient(cx, cy, 50, cx, cy, width * 0.8);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.7, '#090d16');
      bgGrad.addColorStop(1, '#030712');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 3D Coordinate Projection Function
      const project = (x, y, z) => {
        // Rotate around Y axis (Yaw)
        const cosY = Math.cos(yaw);
        const sinY = Math.sin(yaw);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        // Rotate around X axis (Pitch)
        const cosP = Math.cos(pitch);
        const sinP = Math.sin(pitch);
        const y1 = y * cosP - z1 * sinP;
        const z2 = y * sinP + z1 * cosP;

        // Perspective Projection
        const scale = fov / (fov + z2 + distance);
        const screenX = cx + x1 * scale;
        const screenY = cy + y1 * scale;

        return { screenX, screenY, scale, zDepth: z2 };
      };

      // 1. Render 3D Perspective Floor Grid
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.22)';
      ctx.lineWidth = 1;
      const gridSize = 400;
      const gridSteps = 8;
      const step = gridSize / gridSteps;
      const floorY = 160;

      for (let i = -gridSteps; i <= gridSteps; i++) {
        const p1 = project(i * step, floorY, -gridSize);
        const p2 = project(i * step, floorY, gridSize);
        if (p1.scale > 0 && p2.scale > 0) {
          ctx.beginPath();
          ctx.moveTo(p1.screenX, p1.screenY);
          ctx.lineTo(p2.screenX, p2.screenY);
          ctx.stroke();
        }

        const p3 = project(-gridSize, floorY, i * step);
        const p4 = project(gridSize, floorY, i * step);
        if (p3.scale > 0 && p4.scale > 0) {
          ctx.beginPath();
          ctx.moveTo(p3.screenX, p3.screenY);
          ctx.lineTo(p4.screenX, p4.screenY);
          ctx.stroke();
        }
      }

      // 2. Render Ambient Depth Stars
      stars.forEach(s => {
        const p = project(s.x, s.y, s.z);
        if (p.scale > 0) {
          ctx.fillStyle = `rgba(148, 163, 184, ${s.alpha * Math.min(p.scale * 1.5, 1)})`;
          ctx.beginPath();
          ctx.arc(p.screenX, p.screenY, Math.max(1, 1.5 * p.scale), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 3. Project and Sort Nodes by Depth
      const projectedNodes = filteredNodes.map(node => {
        const p = project(node.x, node.y, node.z);
        return {
          ...node,
          screenX: p.screenX,
          screenY: p.screenY,
          scale: p.scale,
          zDepth: p.zDepth
        };
      }).filter(p => p.scale > 0);

      // Painter's algorithm: draw furthest first
      projectedNodes.sort((a, b) => b.zDepth - a.zDepth);

      // 4. Render Semantic Synaptic Edges / Lines
      if (showEdges) {
        ctx.lineWidth = 1;
        for (let i = 0; i < projectedNodes.length; i++) {
          const n1 = projectedNodes[i];
          for (let j = i + 1; j < projectedNodes.length; j++) {
            const n2 = projectedNodes[j];
            // Link if in same policy or sharing root
            const isConnected = (n1.policyId && n1.policyId === n2.policyId) ||
                                (n1.parentRootId === n2.id || n2.parentRootId === n1.id);
            if (isConnected) {
              const dx = n1.screenX - n2.screenX;
              const dy = n1.screenY - n2.screenY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist < 260) {
                const alpha = Math.max(0.08, (1 - dist / 260) * 0.35);
                ctx.strokeStyle = `rgba(96, 165, 250, ${alpha})`;
                ctx.beginPath();
                ctx.moveTo(n1.screenX, n1.screenY);
                ctx.lineTo(n2.screenX, n2.screenY);
                ctx.stroke();
              }
            }
          }
        }
      }

      // 5. Render 3D Vector Nodes
      projectedNodes.forEach(node => {
        const radius = Math.max(3, node.size * node.scale);
        const isHovered = hoveredNode?.id === node.id;
        const isSelected = selectedNode?.id === node.id;

        // Depth fog / glow
        ctx.save();
        if (isHovered || isSelected) {
          ctx.shadowBlur = 18;
          ctx.shadowColor = node.lightColor || '#60a5fa';
        }

        // Radial 3D Sphere Shading
        const grad = ctx.createRadialGradient(
          node.screenX - radius * 0.35,
          node.screenY - radius * 0.35,
          radius * 0.1,
          node.screenX,
          node.screenY,
          radius
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, node.lightColor || '#93c5fd');
        grad.addColorStop(1, node.color || '#2563eb');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(node.screenX, node.screenY, radius, 0, Math.PI * 2);
        ctx.fill();

        // Active / Hover Rings
        if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, radius + 4.5, 0, Math.PI * 2);
          ctx.stroke();
        } else if (isHovered) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(node.screenX, node.screenY, radius + 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw concise labels for large/hovered nodes
        if (isHovered || isSelected || node.isRoot) {
          ctx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
          ctx.font = `${Math.max(10, Math.round(11 * node.scale))}px Inter, system-ui, sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(node.title.slice(0, 24), node.screenX, node.screenY + radius + 14);
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, filteredNodes, autoRotate, showEdges, hoveredNode, selectedNode]);

  // Mouse & Drag Interaction Handlers
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Drag to rotate camera
    if (isDraggingRef.current) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      cameraRef.current.targetYaw += dx * 0.007;
      cameraRef.current.targetPitch = Math.max(-1.1, Math.min(1.1, cameraRef.current.targetPitch + dy * 0.007));
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    // Hover hit test on projected nodes
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { yaw, pitch, distance } = cameraRef.current;
    const fov = 420;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    let hit = null;
    let minD = 9999;

    filteredNodes.forEach(node => {
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const x1 = node.x * cosY + node.z * sinY;
      const z1 = -node.x * sinY + node.z * cosY;

      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);
      const y1 = node.y * cosP - z1 * sinP;
      const z2 = node.y * sinP + z1 * cosP;

      const scale = fov / (fov + z2 + distance);
      if (scale > 0) {
        const sx = cx + x1 * scale;
        const sy = cy + y1 * scale;
        const dist = Math.hypot(mouseX - sx, mouseY - sy);
        const radius = Math.max(5, node.size * scale);
        if (dist <= radius + 7 && dist < minD) {
          minD = dist;
          hit = node;
        }
      }
    });

    setHoveredNode(hit);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    cameraRef.current.targetDistance = Math.max(
      250, 
      Math.min(1300, cameraRef.current.targetDistance + e.deltaY * 0.65)
    );
  };

  const handleClick = () => {
    if (hoveredNode) {
      setSelectedNode(hoveredNode);
    }
  };

  const handleResetCamera = () => {
    cameraRef.current.targetYaw = 0.4;
    cameraRef.current.targetPitch = 0.25;
    cameraRef.current.targetDistance = 650;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-6xl h-[92vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Control Header */}
        <div className="px-5 py-3 border-b border-slate-800/90 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Neon pgvector 3D Topology
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  {filteredNodes.length} Chunks Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Interactive spatial cluster mapping of Australian banking policies & statutory clauses
              </p>
            </div>
          </div>

          {/* Quick Search & Close */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 3D vector space..."
                className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-blue-500 w-48 sm:w-60 transition"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close 3D View"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Partition Filter Bar */}
        <div className="px-5 py-2 bg-slate-900/50 border-b border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mr-1">
              Partitions:
            </span>
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                selectedDept === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              All ({vectorData.length})
            </button>
            {Object.entries(DEPT_COLORS).map(([deptKey, conf]) => (
              <button
                key={deptKey}
                onClick={() => setSelectedDept(deptKey)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition cursor-pointer ${
                  selectedDept === deptKey
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${conf.bg}`} />
                <span>{conf.name}</span>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 hidden md:block">
            <span className="text-slate-500">Drag:</span> Orbit 360° • <span className="text-slate-500">Scroll:</span> Zoom • <span className="text-slate-500">Click:</span> Select Node
          </div>
        </div>

        {/* Main 3D Space Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-slate-950">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            onClick={handleClick}
            className="w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* Floating Camera Toolbar */}
          <div className="absolute left-4 bottom-4 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 backdrop-blur-md shadow-xl text-slate-300">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? "Pause Auto Orbit" : "Play Auto Orbit"}
              className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1 transition cursor-pointer ${
                autoRotate ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-[11px]">Auto Orbit</span>
            </button>

            <button
              onClick={() => setShowEdges(!showEdges)}
              title="Toggle Semantic Synaptic Links"
              className={`p-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                showEdges ? 'bg-slate-800 text-blue-400 border border-blue-500/30' : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                cameraRef.current.targetDistance = Math.max(250, cameraRef.current.targetDistance - 100);
              }}
              title="Zoom In"
              className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                cameraRef.current.targetDistance = Math.min(1300, cameraRef.current.targetDistance + 100);
              }}
              title="Zoom Out"
              className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetCamera}
              title="Reset 3D Perspective"
              className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right Floating Node HUD Inspector */}
          {selectedNode && (
            <div className="absolute right-4 top-4 w-72 sm:w-80 bg-slate-900/95 border border-slate-800/90 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-slate-200 space-y-3 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${DEPT_COLORS[selectedNode.department]?.bg || 'bg-slate-700'}`}>
                    {DEPT_COLORS[selectedNode.department]?.name || selectedNode.department}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-1.5 leading-snug">
                    {selectedNode.title}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Doc: <span className="text-slate-300 font-mono">{selectedNode.documentName}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="text-slate-500 hover:text-white transition p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 3D Coordinate Pill */}
              <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px] bg-slate-950 p-2 rounded-xl border border-slate-800/80 text-slate-400">
                <div>X: <strong className="text-blue-400">{Math.round(selectedNode.x)}</strong></div>
                <div>Y: <strong className="text-emerald-400">{Math.round(selectedNode.y)}</strong></div>
                <div>Z: <strong className="text-purple-400">{Math.round(selectedNode.z)}</strong></div>
              </div>

              {/* Preview Content */}
              <div>
                <span className="text-[10.5px] uppercase font-bold text-slate-500 tracking-wider">
                  Chunk Content Excerpt
                </span>
                <p className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 mt-1 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar font-normal">
                  {selectedNode.preview || 'No excerpt available.'}
                </p>
              </div>

              {/* Action Button */}
              {selectedNode.policyId && (
                <button
                  onClick={() => {
                    if (onSelectPolicy) onSelectPolicy(selectedNode.policyId);
                    onClose();
                  }}
                  className="w-full py-2 bg-[#0057B8] hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Policy in Workspace</span>
                </button>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
