// Generates assets/terminal-{dark,light}.svg — an animated terminal for the profile README.
// Usage: bun scripts/build.ts            (SPEED=0.001 renders the final frame instantly, for previews)

type Line = { cmd: string } | { out: string; tone?: "text" | "muted" | "accent" | "dot" } | "gap";

const LINES: Line[] = [
  { cmd: "whoami" },
  { out: "Mustafa Kurt · backend developer · Antalya, TR" },
  "gap",
  { cmd: "cat principles.txt" },
  { out: "→ clean architecture over clever code", tone: "muted" },
  { out: "→ zero dependencies when it matters", tone: "muted" },
  { out: "→ things should work smoothly under the hood", tone: "muted" },
  "gap",
  { cmd: "echo $STACK" },
  { out: "bun · hono · drizzle · postgres · react · c#", tone: "accent" },
  "gap",
  { cmd: "status" },
  { out: "building quietly", tone: "dot" },
];

const THEMES = {
  dark: { win: "#0d1117", bar: "#161b22", border: "#30363d", text: "#e6edf3", muted: "#8b949e",
    prompt: "#7ee787", accent: "#79c0ff", title: "#6e7681", shadow: "#000000" },
  light: { win: "#ffffff", bar: "#f6f8fa", border: "#d0d7de", text: "#1f2328", muted: "#656d76",
    prompt: "#1a7f37", accent: "#0969da", title: "#8c959f", shadow: "#1f2328" },
};

const W = 760, BAR = 38, PAD = 28, LH = 26, FS = 15, CW = 9, X = 28, CMD_X = X + 2 * CW;
const SPEED = Number(process.env.SPEED ?? 1);
const FONT = "'JetBrains Mono','SF Mono','Cascadia Code',Consolas,'Liberation Mono',monospace";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const t = (s: number) => `${(s * SPEED).toFixed(4)}s`;
const fadeIn = (at: number) => `<animate attributeName="opacity" from="0" to="1" begin="${t(at)}" dur="${t(0.3)}" fill="freeze"/>`;

function render(c: (typeof THEMES)["dark"]) {
  const H = BAR + PAD * 2 + LINES.length * LH;
  const body: string[] = [];
  let at = 0.6;
  LINES.forEach((line, i) => {
    const y = BAR + PAD + i * LH + 17;
    if (line === "gap") return;
    if ("cmd" in line) {
      const n = line.cmd.length, dur = n * 0.07;
      const steps = Array.from({ length: n + 1 }, (_, k) => k * CW);
      body.push(`<g opacity="0">${fadeIn(at - 0.2)}<text x="${X}" y="${y}" fill="${c.prompt}">$</text></g>`,
        `<clipPath id="c${i}"><rect x="${CMD_X}" y="${y - 16}" height="22" width="0"><animate attributeName="width" begin="${t(at)}" dur="${t(dur)}" values="${steps.join(";")}" calcMode="discrete" fill="freeze"/></rect></clipPath>`,
        `<text x="${CMD_X}" y="${y}" fill="${c.text}" clip-path="url(#c${i})" textLength="${n * CW}" lengthAdjust="spacing">${esc(line.cmd)}</text>`,
        `<rect x="${CMD_X}" y="${y - 14}" width="${CW}" height="18" fill="${c.text}" opacity="0"><set attributeName="opacity" to="0.85" begin="${t(at - 0.2)}" dur="${t(dur + 0.35)}"/><animate attributeName="x" begin="${t(at)}" dur="${t(dur)}" values="${steps.map((s) => s + CMD_X).join(";")}" calcMode="discrete" fill="freeze"/></rect>`);
      at += dur + 0.35;
      return;
    }
    const tone = line.tone ?? "text";
    const dot = tone === "dot"
      ? `<circle cx="${X + 4}" cy="${y - 5}" r="4" fill="${c.prompt}"><animate attributeName="opacity" values="1;0.25;1" dur="2.4s" repeatCount="indefinite"/></circle>`
      : "";
    const fill = tone === "dot" ? c.text : tone === "muted" ? c.muted : tone === "accent" ? c.accent : c.text;
    const len = line.out.length;
    body.push(`<g opacity="0">${fadeIn(at)}${dot}<text x="${tone === "dot" ? X + 18 : X}" y="${y}" fill="${fill}" textLength="${len * CW}" lengthAdjust="spacing">${esc(line.out)}</text></g>`);
    at += 0.14;
    const next = LINES[i + 1];
    if (next === "gap" || next === undefined) at += 0.45;
  });
  const y = BAR + PAD + LINES.length * LH + 17; // final prompt row
  body.push(`<g opacity="0">${fadeIn(at)}<text x="${X}" y="${y}" fill="${c.prompt}">$</text>`,
    `<rect x="${CMD_X}" y="${y - 14}" width="${CW}" height="18" fill="${c.text}"><animate attributeName="opacity" values="0.85;0.85;0;0" keyTimes="0;0.5;0.5;1" dur="1.1s" begin="${t(at)}" repeatCount="indefinite"/></rect></g>`);

  const dots = ["#ff5f57", "#febc2e", "#28c840"].map((f, k) => `<circle cx="${22 + k * 20}" cy="${BAR / 2}" r="6" fill="${f}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W + 20}" height="${H + LH + 24}" viewBox="-10 -6 ${W + 20} ${H + LH + 24}" font-family="${FONT}" font-size="${FS}">
<defs><filter id="s" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="${c.shadow}" flood-opacity="0.18"/></filter>
<clipPath id="win"><rect width="${W}" height="${H + LH}" rx="10"/></clipPath></defs>
<g filter="url(#s)"><rect width="${W}" height="${H + LH}" rx="10" fill="${c.win}" stroke="${c.border}"/></g>
<g clip-path="url(#win)"><rect width="${W}" height="${BAR}" fill="${c.bar}"/><line x1="0" y1="${BAR}" x2="${W}" y2="${BAR}" stroke="${c.border}"/>
${dots}<text x="${W / 2}" y="${BAR / 2 + 5}" text-anchor="middle" fill="${c.title}" font-size="13">mustafa@kurt: ~</text>
${body.join("\n")}</g>
</svg>
`;
}

for (const [name, theme] of Object.entries(THEMES)) {
  await Bun.write(`assets/terminal-${name}.svg`, render(theme));
}
console.log("assets/terminal-{dark,light}.svg written", SPEED !== 1 ? `(SPEED=${SPEED})` : "");
