import { Palette } from "lucide-react"

const themes = [
  { id: "serika-dark", label: "Serika Dark", swatch: ["#323437", "#d9cbc2", "#d1d0c5"] },
  { id: "graphite", label: "Graphite", swatch: ["#1f2329", "#d3c6aa", "#d3c6aa"] },
  { id: "ocean", label: "Ocean", swatch: ["#0f1720", "#5eead4", "#cde6f5"] },
  { id: "lotus", label: "Lotus", swatch: ["#221b25", "#d59edb", "#e8d9ee"] },
  { id: "sandstone", label: "Sandstone", swatch: ["#f1e6d8", "#be7d5d", "#2f2720"] },
  { id: "inkwell", label: "Inkwell", swatch: ["#111419", "#7d94d1", "#d6dceb"] },
  { id: "dawn", label: "Dawn", swatch: ["#f4f2f8", "#8d77c8", "#2f2a39"] },
]

export default function GameSettingsScreen({ themePack, onThemePackChange }) {
  return (
    <div className="surface min-w-[290px] space-y-3 p-3">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-soft)]">Settings</p>
        <p className="text-sm text-[var(--text)]">Theme Presets</p>
      </div>

      <div className="grid gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onThemePackChange(theme.id)}
            className={`chip-btn flex items-center justify-between gap-3 px-3 py-2 text-sm ${
              themePack === theme.id ? "active" : ""
            }`}
          >
            <span className="flex items-center gap-2">
              <Palette size={14} />
              {theme.label}
            </span>
            <span className="flex items-center gap-1" aria-hidden>
              {theme.swatch.map((color) => (
                <span
                  key={color}
                  className="h-3 w-3 rounded-full border border-black/20"
                  style={{ backgroundColor: color }}
                />
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
