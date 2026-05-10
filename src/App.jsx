import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
/**
 * Type Sampler Tool
 * Focuses on professional typography specimens with a clean PDF export workflow.
 */
const PANGRAMS = [
  "Quick nymph bugs vex fjord waltz.",
  "Waltz, bad nymph, for quick jigs vex.",
  "Glib jocks quiz nymph to vex dwarf.",
  "Sphinx of black quartz, judge my vow.",
  "How quickly daft jumping zebras vex!",
  "The five boxing wizards jump quickly.",
  "Jackdaws love my big sphinx of quartz.",
  "Pack my box with five dozen liquor jugs."
];
const INITIAL_STATE = {
  sample: "Type to test fonts...",
  fontSize: 24,
  letterSpacing: 0,
  leading: 1.2,
  align: "left",
  selectedTransform: "as-typed"
};
const GOOGLE_FONTS = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald",
  "Source Code Pro", "Playfair Display", "Merriweather", "Poppins",
  "Lora", "Raleway", "Work Sans", "DM Sans", "Space Grotesk",
  "Syne", "Fraunces", "Crimson Text", "Libre Baskerville", "IBM Plex Mono"
];
const DEFAULT_VARIANT = { weight: 400, style: "normal" };
const FONT_VARIANT_PRESETS = {
  "inter": { weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], styles: ["normal", "italic"] },
  "roboto": { weights: [100, 300, 400, 500, 700, 900], styles: ["normal", "italic"] },
  "open sans": { weights: [300, 400, 500, 600, 700, 800], styles: ["normal", "italic"] },
  "lato": { weights: [100, 300, 400, 700, 900], styles: ["normal", "italic"] },
  "montserrat": { weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], styles: ["normal", "italic"] },
  "oswald": { weights: [200, 300, 400, 500, 600, 700], styles: ["normal"] },
  "source code pro": { weights: [200, 300, 400, 500, 600, 700, 800, 900], styles: ["normal", "italic"] },
  "playfair display": { weights: [400, 500, 600, 700, 800, 900], styles: ["normal", "italic"] },
  "merriweather": { weights: [300, 400, 700, 900], styles: ["normal", "italic"] },
  "poppins": { weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], styles: ["normal", "italic"] },
  "lora": { weights: [400, 500, 600, 700], styles: ["normal", "italic"] },
  "raleway": { weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], styles: ["normal", "italic"] },
  "work sans": { weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], styles: ["normal", "italic"] },
  "dm sans": { weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], styles: ["normal", "italic"] },
  "space grotesk": { weights: [300, 400, 500, 600, 700], styles: ["normal"] },
  "syne": { weights: [400, 500, 600, 700, 800], styles: ["normal"] },
  "fraunces": { weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], styles: ["normal", "italic"] },
  "crimson text": { weights: [400, 600, 700], styles: ["normal", "italic"] },
  "libre baskerville": { weights: [400, 700], styles: ["normal", "italic"] },
  "ibm plex mono": { weights: [100, 200, 300, 400, 500, 600, 700], styles: ["normal", "italic"] }
};
function titleCaseText(value) {
  return value
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}
function formatGoogleFontName(fontName) {
  return fontName.trim().split(/\s+/).join("+");
}
function getSafeFontId(fontName) {
  return "google-" + fontName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now();
}
function buildGoogleFontHref(fontName) {
  const family = formatGoogleFontName(fontName);
  const preset = FONT_VARIANT_PRESETS[fontName.trim().toLowerCase()] || null;
  if (!preset) {
    return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  }
  const weights = preset.weights || [400];
  const styles = preset.styles || ["normal"];
  if (styles.includes("italic")) {
    const axes = [];
    weights.forEach((weight) => axes.push("0," + weight));
    weights.forEach((weight) => axes.push("1," + weight));
    return `https://fonts.googleapis.com/css2?family=${family}:ital,wght@${axes.join(";")}&display=swap`;
  }
  if (weights.length > 1) {
    return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights.join(";")}&display=swap`;
  }
  return `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
}
function makeLocalFontFamily(id) {
  return "LocalTypeSamplerFont_" + id.replace(/[^a-zA-Z0-9_]/g, "_");
}
function inferLocalFontVariant(fileName) {
  const normalized = (fileName || "").toLowerCase();
  const style = /italic|oblique/.test(normalized) ? "italic" : "normal";
  let weight = 400;
  if (/thin|hairline|100/.test(normalized)) weight = 100;
  else if (/extra[-_\s]?light|ultra[-_\s]?light|200/.test(normalized)) weight = 200;
  else if (/light|300/.test(normalized)) weight = 300;
  else if (/medium|500/.test(normalized)) weight = 500;
  else if (/semi[-_\s]?bold|demi[-_\s]?bold|600/.test(normalized)) weight = 600;
  else if (/extra[-_\s]?bold|ultra[-_\s]?bold|800/.test(normalized)) weight = 800;
  else if (/black|heavy|900/.test(normalized)) weight = 900;
  else if (/bold|700/.test(normalized)) weight = 700;
  return { weight, style };
}
function makeReadableFontName(fileName) {
  return (fileName || "Local Font")
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const EditableValue = ({ value, suffix = "", onSave, accentColor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  const handleBlur = () => {
    setIsEditing(false);
    const num = parseFloat(inputValue);
    if (!isNaN(num)) {
      onSave(num);
    } else {
      setInputValue(value);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleBlur();
    if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value);
    }
  };
  if (isEditing) {
    return (
      <input
        autoFocus
        type="text"
        className="bg-transparent border-b border-current outline-none text-[11px] w-12 text-right p-0"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={{ color: accentColor }}
      />
    );
  }
  return (
    <button
      onClick={() => setIsEditing(true)}
      className="text-[11px] hover:underline cursor-text transition-all opacity-100 hover:opacity-100"
      style={{ color: accentColor }}
    >
      {value}{suffix}
    </button>
  );
};
const TypographyControls = ({
  title,
  fontSize, setFontSize,
  letterSpacing, setLetterSpacing,
  leading, setLeading,
  selectedTransform, setSelectedTransform,
  align, setAlign,
  onReset,
  accent, appBg
}) => (
  <div className="space-y-4">
    <div className="flex justify-between items-end mb-1">
      <span className="text-[10px] uppercase tracking-widest font-bold block">{title}</span>
      <button
        onClick={onReset}
        className="text-[10px] underline hover:opacity-90 lowercase"
      >
        reset
      </button>
    </div>

    <div className="flex justify-between text-[11px] mb-1">
      <span>Size</span>
      <EditableValue value={fontSize} suffix="px" onSave={setFontSize} accentColor={accent} />
    </div>
    <input type="range" min="8" max="240" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="w-full" />

    <div className="flex justify-between text-[11px] mb-1">
      <span>Spacing</span>
      <EditableValue value={letterSpacing} suffix="px" onSave={setLetterSpacing} accentColor={accent} />
    </div>
    <input type="range" min="-10" max="100" value={letterSpacing} onChange={e => setLetterSpacing(Number(e.target.value))} className="w-full" />

    <div className="flex justify-between text-[11px] mb-1">
      <span>Leading</span>
      <EditableValue value={leading} onSave={setLeading} accentColor={accent} />
    </div>
    <input type="range" min="0.5" max="3" step="0.01" value={leading} onChange={e => setLeading(Number(e.target.value))} className="w-full" />

    <div className="grid grid-cols-2 gap-1 mt-4">
      {["as-typed", "title", "upper", "lower"].map(t => (
        <button key={t} onClick={() => setSelectedTransform(t)} className="text-[10px] uppercase border py-2 transition-all" style={{ backgroundColor: selectedTransform === t ? accent : "transparent", color: selectedTransform === t ? appBg : accent, borderColor: accent }}>{t.replace("-", " ")}</button>
      ))}
    </div>
    <div className="flex gap-1">
      {["left", "center", "right"].map(a => (
        <button key={a} onClick={() => setAlign(a)} className="flex-1 border py-2 text-[10px] uppercase transition-all" style={{ backgroundColor: align === a ? accent : "transparent", color: align === a ? appBg : accent, borderColor: accent }}>{a}</button>
      ))}
    </div>
  </div>
);
export default function App() {
  const [sample, setSample] = useState(INITIAL_STATE.sample);
  const [fontSize, setFontSize] = useState(INITIAL_STATE.fontSize);
  const [letterSpacing, setLetterSpacing] = useState(INITIAL_STATE.letterSpacing);
  const [leading, setLeading] = useState(INITIAL_STATE.leading);
  const [align, setAlign] = useState(INITIAL_STATE.align);
  const [selectedTransform, setSelectedTransform] = useState(INITIAL_STATE.selectedTransform);
  const [secondaryEnabled, setSecondaryEnabled] = useState(false);
  const [secondarySample, setSecondarySample] = useState(INITIAL_STATE.sample);
  const [secondaryFontId, setSecondaryFontId] = useState(null);
  const [secondaryFontSize, setSecondaryFontSize] = useState(INITIAL_STATE.fontSize);
  const [secondaryLetterSpacing, setSecondaryLetterSpacing] = useState(INITIAL_STATE.letterSpacing);
  const [secondaryLeading, setSecondaryLeading] = useState(INITIAL_STATE.leading);
  const [secondaryAlign, setSecondaryAlign] = useState(INITIAL_STATE.align);
  const [secondaryTransform, setSecondaryTransform] = useState(INITIAL_STATE.selectedTransform);
  const [invert, setInvert] = useState(false);
  const [monochrome, setMonochrome] = useState(false);
  const [googleFontInput, setGoogleFontInput] = useState("");
  const [showFontBrowser, setShowFontBrowser] = useState(false);
  const [displayTextColor, setDisplayTextColor] = useState("#202020");
  const [displayBgColor, setDisplayBgColor] = useState("#ece9e2");
  const [textColorHistory, setTextColorHistory] = useState(["#202020", "#ef4423", "#000000", "#ffffff", "#f4b2a6"]);
  const [bgColorHistory, setBgColorHistory] = useState(["#ece9e2", "#ffffff", "#f7e4df", "#f4b2a6", "#ef4423"]);
  const [fonts, setFonts] = useState([
    { id: "serif", name: "System Serif", family: "Georgia, Times, serif", source: "SYSTEM", status: "ready", hasVariants: true, preloaded: true, availableWeights: [400, 700], availableStyles: ["normal", "italic"] },
    { id: "sans", name: "System Sans", family: "Arial, Helvetica, sans-serif", source: "SYSTEM", status: "ready", hasVariants: true, preloaded: true, availableWeights: [400, 700], availableStyles: ["normal", "italic"] },
    { id: "mono", name: "System Mono", family: "Courier New, Courier, monospace", source: "SYSTEM", status: "ready", hasVariants: true, preloaded: true, availableWeights: [400, 700], availableStyles: ["normal", "italic"] }
  ]);
  const [misfits, setMisfits] = useState([]);
  const [fontVariants, setFontVariants] = useState({});
  const [fontBrowserSearch, setFontBrowserSearch] = useState("");
  const [fontRatings, setFontRatings] = useState({});

  const fileInputRef = useRef(null);
  const samplesRef = useRef(null);
  const appBg = monochrome ? (invert ? "#000000" : "#ffffff") : invert ? "#ef4423" : "#ece9e2";
  const sampleBg = monochrome ? (invert ? "#000000" : "#ffffff") : invert ? displayTextColor : displayBgColor;
  const accent = monochrome ? (invert ? "#ffffff" : "#000000") : invert ? "#f5f1eb" : "#ef4423";
  const textColor = monochrome ? (invert ? "#ffffff" : "#000000") : invert ? displayBgColor : displayTextColor;
  const transformedText = useMemo(() => {
    if (selectedTransform === "upper") return sample.toUpperCase();
    if (selectedTransform === "title") return titleCaseText(sample);
    if (selectedTransform === "lower") return sample.toLowerCase();
    return sample;
  }, [sample, selectedTransform]);
  const transformedSecondaryText = useMemo(() => {
    if (secondaryTransform === "upper") return secondarySample.toUpperCase();
    if (secondaryTransform === "title") return titleCaseText(secondarySample);
    if (secondaryTransform === "lower") return secondarySample.toLowerCase();
    return secondarySample;
  }, [secondarySample, secondaryTransform]);
  const secondaryFont = fonts.find(f => f.id === secondaryFontId);
  const addGoogleFont = async (fontName) => {
    const cleaned = fontName.trim();
    if (!cleaned || fonts.some(f => f.name.toLowerCase() === cleaned.toLowerCase())) return;
    const id = getSafeFontId(cleaned);
    const family = `'${cleaned.replace(/'/g, "\\'")}', Arial, sans-serif`;
    const preset = FONT_VARIANT_PRESETS[cleaned.toLowerCase()];
    const availableWeights = preset?.weights || [400];
    const availableStyles = preset?.styles || ["normal"];
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = buildGoogleFontHref(cleaned);
    link.dataset.typeSamplerFont = cleaned.toLowerCase();
    document.head.appendChild(link);
    setFonts(prev => [
      ...prev,
      { id, name: cleaned, family, source: "GOOGLE", status: "loading", hasVariants: availableWeights.length > 1 || availableStyles.length > 1, availableWeights, availableStyles }
    ]);
    setGoogleFontInput("");
    setShowFontBrowser(false);
    if (document.fonts?.load) {
      try {
        await document.fonts.load(`400 24px '${cleaned}'`);
        setFonts(prev => prev.map(f => f.id === id ? { ...f, status: "ready" } : f));
      } catch (e) {
        setFonts(prev => prev.map(f => f.id === id ? { ...f, status: "ready" } : f));
      }
    }
  };
  const handleLocalFontUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    for (const file of files) {
      const id = "local-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      const familyName = makeLocalFontFamily(id);
      const name = makeReadableFontName(file.name);
      const variant = inferLocalFontVariant(file.name);
      try {
        const buffer = await file.arrayBuffer();
        const face = new FontFace(familyName, buffer, {
          weight: String(variant.weight),
          style: variant.style,
          display: "swap"
        });
        const loadedFace = await face.load();
        document.fonts.add(loadedFace);
        setFonts(prev => [...prev, {
          id, name, family: `'${familyName}'`, source: "LOCAL", status: "ready",
          hasVariants: false, availableWeights: [variant.weight], availableStyles: [variant.style]
        }]);
        setFontVariants(prev => ({ ...prev, [id]: variant }));
      } catch (e) {
        console.error("Local font failed to load:", file.name, e);
      }
    }
    event.target.value = "";
  };
  const resetTypography = () => {
    setFontSize(INITIAL_STATE.fontSize);
    setLetterSpacing(INITIAL_STATE.letterSpacing);
    setLeading(INITIAL_STATE.leading);
    setAlign(INITIAL_STATE.align);
    setSelectedTransform(INITIAL_STATE.selectedTransform);
  };
  const resetSecondaryTypography = () => {
    setSecondaryFontSize(INITIAL_STATE.fontSize);
    setSecondaryLetterSpacing(INITIAL_STATE.letterSpacing);
    setSecondaryLeading(INITIAL_STATE.leading);
    setSecondaryAlign(INITIAL_STATE.align);
    setSecondaryTransform(INITIAL_STATE.selectedTransform);
  };
  const getFontVariant = (id) => fontVariants[id] || DEFAULT_VARIANT;
  const removeFont = (id) => {
    const fontToRemove = fonts.find(f => f.id === id);
    if (fontToRemove) {
      setMisfits(prev => [fontToRemove, ...prev]);
      setFonts(prev => prev.filter(f => f.id !== id));
      if (secondaryFontId === id) setSecondaryFontId(null);
    }
  };
  const restoreFont = (id) => {
    const fontToRestore = misfits.find(f => f.id === id);
    if (fontToRestore) {
      setFonts(prev => [...prev, fontToRestore]);
      setMisfits(prev => prev.filter(f => f.id !== id));
    }
  };
  const handleRate = (fontId, value) => {
    setFontRatings(prev => ({
      ...prev,
      [fontId]: prev[fontId] === value ? null : value
    }));
  };
  const addColorToHistory = (color, setter) => {
    if (!color) return;
    setter((prev) => [color, ...prev.filter((item) => item !== color)].slice(0, 5));
  };
  const handlePrintExport = () => {
    window.print();
  };
  const filteredBrowserFonts = GOOGLE_FONTS.filter(f => f.toLowerCase().includes(fontBrowserSearch.toLowerCase()));
  const staticPadding = {
    padding: `36px 24px`,
    minHeight: `100px`
  };
  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ backgroundColor: appBg, color: accent }}>
      <style>{`
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${accent}77; border-radius: 10px; }
        input[type="range"] { accent-color: ${accent}; cursor: pointer; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
        input[type="color"]::-webkit-color-swatch { border: 0; border-radius: 2px; }

        .color-transition {
            transition: background-color 0.15s ease-out, color 0.15s ease-out, border-color 0.15s ease-out;
        }
        .specimen-text {
          transform: none !important;
          transition: none !important;
        }

        @media print {
          @page { margin: 1cm; size: auto; }
          body { background: white !important; }
          aside { display: none !important; }
          section {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            background: white !important;
            overflow: visible !important;
            height: auto !important;
          }
          .font-card {
            border: 1px solid #eee !important;
            page-break-inside: avoid;
            margin-bottom: 20px !important;
            box-shadow: none !important;
          }
          .font-card div[style*="background-color"] {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .utility-bar, .modal-overlay { display: none !important; }
        }
      `}</style>
      {/* Sidebar */}
      <aside className="w-[390px] h-full border-r flex flex-col overflow-y-auto color-transition" style={{ borderColor: `${accent}66` }}>
        <div className="p-6 border-b color-transition" style={{ borderColor: `${accent}66` }}>
          <h1 className="text-5xl font-black tracking-tighter leading-none" style={{ color: accent }}>
            Type <br /> Sampler
          </h1>
        </div>
        {/* Input Area */}
        <div className="p-6 border-b color-transition" style={{ borderColor: `${accent}66` }}>
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold">Sample Text</span>
            <button
              onClick={() => setSample(PANGRAMS[Math.floor(Math.random() * PANGRAMS.length)])}
              className="text-[10px] underline hover:opacity-90 lowercase"
            >
              pangram me
            </button>
          </div>
          <textarea
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            className="w-full h-24 bg-transparent border p-3 text-sm resize-none outline-none rounded-none transition-all focus:ring-1"
            style={{ borderColor: `${accent}77`, color: accent, "--tw-ring-color": accent }}
          />
        </div>
        {/* Font Management */}
        <div className="p-6 border-b space-y-6 color-transition" style={{ borderColor: `${accent}66` }}>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold mb-2 block">Google Fonts</label>
            <div className="flex gap-1">
              <input
                value={googleFontInput}
                onChange={(e) => setGoogleFontInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addGoogleFont(googleFontInput)}
                placeholder="Inter, Roboto, Syne..."
                className="flex-1 bg-transparent border px-3 py-2 text-xs outline-none rounded-none"
                style={{ borderColor: `${accent}77` }}
              />
              <button
                onClick={() => setShowFontBrowser(true)}
                className="px-4 py-2 text-sm border hover:bg-white/10 transition-colors"
                style={{ borderColor: `${accent}77` }}
              >
                +
              </button>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current.click()}
            className="w-full py-3 text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2"
            style={{ backgroundColor: accent, color: appBg }}
          >
            Upload Local Fonts
          </button>
          <input ref={fileInputRef} type="file" multiple accept=".ttf,.otf,.woff,.woff2" onChange={handleLocalFontUpload} className="hidden" />
          {/* Active Fonts List */}
          <div className="space-y-6">
            <div>
              <label className="text-[8px] uppercase tracking-[0.2em] opacity-70 mb-3 block">Active Fonts</label>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-2 border" style={{ borderColor: `${accent}55`, padding: "8px" }}>
                {fonts.map(font => (
                  <div key={font.id} className="flex flex-col border-b last:border-0 pb-3 mb-2 color-transition" style={{ borderColor: `${accent}44` }}>
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex flex-wrap items-center gap-2 max-w-[280px]">
                        <span className="text-[11px] font-medium truncate">{font.name}</span>
                        <span className="text-[7px] font-black tracking-tighter px-1 border leading-tight" style={{ borderColor: `${accent}99`, color: `${accent}dd` }}>
                          {font.source || "SYSTEM"}
                        </span>
                      </div>
                      <button onClick={() => removeFont(font.id)} className="opacity-60 hover:opacity-100 p-1 -mr-1">
                        <X size={12} />
                      </button>
                    </div>
                    {font.hasVariants && (
                      <div className="grid grid-cols-2 gap-1 mt-1">
                        <select
                          className="bg-transparent text-[10px] border px-1 py-1 outline-none"
                          style={{ borderColor: `${accent}55` }}
                          value={getFontVariant(font.id).weight}
                          onChange={(e) => setFontVariants(v => ({ ...v, [font.id]: { ...getFontVariant(font.id), weight: Number(e.target.value) } }))}
                        >
                          {font.availableWeights.map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                        <select
                          className="bg-transparent text-[10px] border px-1 py-1 outline-none"
                          style={{ borderColor: `${accent}55` }}
                          value={getFontVariant(font.id).style}
                          onChange={(e) => setFontVariants(v => ({ ...v, [font.id]: { ...getFontVariant(font.id), style: e.target.value } }))}
                        >
                          {font.availableStyles.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <AnimatePresence>
              {misfits.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-2 border-t"
                  style={{ borderColor: `${accent}55` }}
                >
                  <label className="text-[8px] uppercase tracking-[0.2em] opacity-70 mb-3 block">Misfits</label>
                  <div className="flex flex-wrap gap-1.5">
                    {misfits.map(font => (
                      <button
                        key={font.id}
                        onClick={() => restoreFont(font.id)}
                        className="text-[9px] border px-2 py-1.5 flex items-center gap-2 hover:bg-white/5 transition-colors"
                        style={{ borderColor: `${accent}55` }}
                      >
                        <RotateCcw size={10} className="opacity-80" />
                        <span>{font.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* Global Controls */}
        <div className="p-6 space-y-8 pb-12">
          {/* Typography Controls */}
          <div className="space-y-4">
            <TypographyControls
              title="Typography"
              fontSize={fontSize} setFontSize={setFontSize}
              letterSpacing={letterSpacing} setLetterSpacing={setLetterSpacing}
              leading={leading} setLeading={setLeading}
              selectedTransform={selectedTransform} setSelectedTransform={setSelectedTransform}
              align={align} setAlign={setAlign}
              onReset={resetTypography}
              accent={accent} appBg={appBg}
            />
            <button
              onClick={() => setSecondaryEnabled(!secondaryEnabled)}
              className="w-full py-2 text-[10px] border uppercase transition-all"
              style={{ backgroundColor: secondaryEnabled ? accent : "transparent", color: secondaryEnabled ? appBg : accent, borderColor: accent }}
            >
              Secondary Type
            </button>
          </div>
          {/* Secondary Font Picker */}
          {secondaryEnabled && (
            <div className="pt-8 border-t space-y-4 color-transition" style={{ borderColor: `${accent}66` }}>
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold">Secondary Sample Text</span>
                  <button
                    onClick={() => setSecondarySample(PANGRAMS[Math.floor(Math.random() * PANGRAMS.length)])}
                    className="text-[10px] underline hover:opacity-90 lowercase"
                  >
                    pangram me
                  </button>
                </div>
                <textarea
                  value={secondarySample}
                  onChange={(e) => setSecondarySample(e.target.value)}
                  className="w-full h-24 bg-transparent border p-3 text-sm resize-none outline-none rounded-none transition-all focus:ring-1"
                  style={{ borderColor: `${accent}77`, color: accent, "--tw-ring-color": accent }}
                />
              </div>
              <label className="text-[10px] uppercase tracking-widest font-bold block mb-1">Secondary Font</label>
              <div className="space-y-1 max-h-72 overflow-y-auto pr-2 border" style={{ borderColor: `${accent}55`, padding: "8px" }}>
                {fonts.map(font => {
                  const isSelected = secondaryFontId === font.id;
                  return (
                    <button
                      key={font.id}
                      onClick={() => setSecondaryFontId(isSelected ? null : font.id)}
                      className="w-full flex items-center gap-2 px-2 py-2 text-left text-[11px] border transition-all mb-1 last:mb-0"
                      style={{
                        borderColor: isSelected ? accent : `${accent}55`,
                        backgroundColor: isSelected ? accent : "transparent",
                        color: isSelected ? appBg : accent
                      }}
                    >
                      <span className="truncate flex-1">{font.name}</span>
                      <span className="text-[7px] font-black tracking-tighter px-1 border leading-tight" style={{ borderColor: isSelected ? appBg : `${accent}99`, color: isSelected ? appBg : `${accent}dd` }}>
                        {font.source || "SYSTEM"}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!secondaryFont && (
                <p className="text-[10px] opacity-70 leading-tight">Select a font above to pair with your primary specimens.</p>
              )}
            </div>
          )}
          {/* Secondary Typography Controls */}
          {secondaryEnabled && (
            <div className="pt-8 border-t color-transition" style={{ borderColor: `${accent}66` }}>
              <TypographyControls
                title="Secondary Typography"
                fontSize={secondaryFontSize} setFontSize={setSecondaryFontSize}
                letterSpacing={secondaryLetterSpacing} setLetterSpacing={setSecondaryLetterSpacing}
                leading={secondaryLeading} setLeading={setSecondaryLeading}
                selectedTransform={secondaryTransform} setSelectedTransform={setSecondaryTransform}
                align={secondaryAlign} setAlign={setSecondaryAlign}
                onReset={resetSecondaryTypography}
                accent={accent} appBg={appBg}
              />
            </div>
          )}
          {/* Color Section */}
          <div className="pt-8 border-t space-y-6 color-transition" style={{ borderColor: `${accent}66` }}>
            <div className="flex justify-between items-end mb-1">
              <label className="text-[10px] uppercase tracking-widest font-bold">Color</label>
              <button
                onClick={() => {
                  setDisplayTextColor("#202020");
                  setDisplayBgColor("#ece9e2");
                }}
                className="text-[10px] underline hover:opacity-90 lowercase"
              >
                reset
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setInvert(!invert)} className="flex-1 py-2 text-[10px] border uppercase transition-all" style={{ backgroundColor: invert ? accent : "transparent", color: invert ? appBg : accent, borderColor: accent }}>Invert</button>
              <button onClick={() => setMonochrome(!monochrome)} className="flex-1 py-2 text-[10px] border uppercase transition-all" style={{ backgroundColor: monochrome ? accent : "transparent", color: monochrome ? appBg : accent, borderColor: accent }}>Mono</button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-80 mb-2">Text</span>
                <div className="flex gap-1.5 flex-wrap">
                  <input type="color" value={displayTextColor} onChange={e => setDisplayTextColor(e.target.value)} onBlur={e => addColorToHistory(e.target.value, setTextColorHistory)} className="w-14 h-7 outline-none cursor-pointer border rounded-sm" style={{ borderColor: `${accent}55` }} />
                  {textColorHistory.map((c, i) => <button key={i} onClick={() => setDisplayTextColor(c)} className="w-7 h-7 rounded-sm border color-transition" style={{ backgroundColor: c, borderColor: `${accent}55` }} />)}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest font-bold opacity-80 mb-2">Background</span>
                <div className="flex gap-1.5 flex-wrap">
                  <input type="color" value={displayBgColor} onChange={e => setDisplayBgColor(e.target.value)} onBlur={e => addColorToHistory(e.target.value, setBgColorHistory)} className="w-14 h-7 outline-none cursor-pointer border rounded-sm" style={{ borderColor: `${accent}55` }} />
                  {bgColorHistory.map((c, i) => <button key={i} onClick={() => setDisplayBgColor(c)} className="w-7 h-7 rounded-sm border color-transition" style={{ backgroundColor: c, borderColor: `${accent}55` }} />)}
                </div>
              </div>
            </div>
          </div>
          {/* Export / Print Section */}
          <div className="pt-8 border-t space-y-4 color-transition" style={{ borderColor: `${accent}66` }}>
            <label className="text-[10px] uppercase tracking-widest font-bold block mb-1">Export</label>
            <div className="flex flex-col gap-1">
              <button
                onClick={handlePrintExport}
                className="w-full py-4 text-[10px] border flex items-center justify-center uppercase hover:bg-white/5 transition-colors"
                style={{ borderColor: accent }}
              >
                Export to PDF
              </button>
            </div>
            <p className="text-[10px] opacity-80 leading-tight pt-2">
              This tool was made by <a href="https://www.instagram.com/mireyareyy/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-100 font-normal" style={{ color: accent }}>Mireya Lavender</a>
            </p>
          </div>
        </div>
      </aside>
      {/* Main Preview Area */}
      <section className="flex-1 overflow-y-auto p-12 color-transition relative" style={{ backgroundColor: appBg }}>
        <div ref={samplesRef} className="max-w-4xl mx-auto space-y-8 pb-32">
          <AnimatePresence mode="popLayout">
            {fonts.map((font, idx) => {
              const variant = getFontVariant(font.id);
              const currentRating = fontRatings[font.id];

              return (
                <motion.div
                  key={font.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="font-card border overflow-hidden shadow-sm color-transition group/card"
                  style={{ borderColor: `${accent}66`, backgroundColor: "transparent" }}
                >
                  <div className="relative px-4 py-2 border-b flex justify-between items-center bg-black/5 color-transition" style={{ borderColor: `${accent}55` }}>
                    <span className="text-[10px] font-black tracking-widest uppercase opacity-90" style={{ color: accent }}>{font.name}</span>
                    <div className="utility-bar absolute left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity" style={{ color: accent }}>
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          onClick={() => handleRate(font.id, val)}
                          className="relative w-5 h-5 flex items-center justify-center text-[9px] font-bold transition-all hover:scale-110"
                        >
                          {currentRating === val && (
                            <motion.div
                              layoutId={`rating-circle-${font.id}`}
                              className="absolute inset-0.5 rounded-full border border-current pointer-events-none"
                              initial={false}
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          <span className={currentRating === val ? "opacity-100" : "opacity-80"}>{val}</span>
                        </button>
                      ))}
                    </div>
                    <div className="text-[10px] font-mono opacity-50 tracking-widest">#{String(idx + 1).padStart(2, '0')}</div>
                  </div>

                  <div
                    className="flex items-center specimen-text"
                    style={{
                      ...staticPadding,
                      fontFamily: font.family,
                      fontSize: `${fontSize}px`,
                      fontWeight: variant.weight,
                      fontStyle: variant.style,
                      letterSpacing: `${letterSpacing}px`,
                      lineHeight: leading,
                      textAlign: align,
                      color: textColor,
                      backgroundColor: sampleBg
                    }}
                  >
                    <div className="w-full break-words">
                      {transformedText || "..." }
                    </div>
                  </div>
                  {secondaryEnabled && secondaryFont && (
                    <div
                      className="flex items-center specimen-text border-t"
                      style={{
                        ...staticPadding,
                        borderColor: `${accent}55`,
                        fontFamily: secondaryFont.family,
                        fontSize: `${secondaryFontSize}px`,
                        fontWeight: getFontVariant(secondaryFont.id).weight,
                        fontStyle: getFontVariant(secondaryFont.id).style,
                        letterSpacing: `${secondaryLetterSpacing}px`,
                        lineHeight: secondaryLeading,
                        textAlign: secondaryAlign,
                        color: textColor,
                        backgroundColor: sampleBg
                      }}
                    >
                      <div className="w-full break-words">
                        {transformedSecondaryText || "..." }
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>
      {/* Font Browser Modal */}
      <AnimatePresence>
        {showFontBrowser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm modal-overlay"
            onClick={() => setShowFontBrowser(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl h-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border color-transition"
              style={{ backgroundColor: appBg, borderColor: `${accent}77` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b flex justify-between items-center color-transition" style={{ borderColor: `${accent}55` }}>
                <div className="flex-1 mr-4">
                  <h2 className="text-xl font-bold uppercase tracking-tight mb-4" style={{ color: accent }}>Browse Google Fonts</h2>
                  <input
                    autoFocus
                    placeholder="Search fonts..."
                    value={fontBrowserSearch}
                    onChange={(e) => setFontBrowserSearch(e.target.value)}
                    className="w-full bg-transparent border px-4 py-3 text-sm outline-none rounded-none"
                    style={{ borderColor: `${accent}77`, color: accent }}
                  />
                </div>
                <button onClick={() => setShowFontBrowser(false)} className="w-10 h-10 flex items-center justify-center text-2xl opacity-70 hover:opacity-100" style={{ color: accent }}>×</button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredBrowserFonts.map((f) => {
                  const isAdded = fonts.some(font => font.name.toLowerCase() === f.toLowerCase());
                  return (
                    <button
                      key={f}
                      disabled={isAdded}
                      onClick={() => addGoogleFont(f)}
                      className="group p-4 border text-left transition-all hover:scale-[1.02] active:scale-[0.98] flex flex-col justify-between"
                      style={{
                        borderColor: isAdded ? `${accent}44` : `${accent}66`,
                        opacity: isAdded ? 0.4 : 1,
                        backgroundColor: isAdded ? "transparent" : `${accent}38`
                      }}
                    >
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest mb-1">{f}</div>
                        <div className="text-[10px] opacity-60 uppercase">{FONT_VARIANT_PRESETS[f.toLowerCase()]?.weights.length || 1} weights</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
