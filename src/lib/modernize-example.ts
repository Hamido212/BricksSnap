/**
 * BricksSnap's own example for the Modernize tab: a feature section written the way many Bricks
 * libraries ship them (fixed hex colors, rem at 62.5%, a framework variable, a button preset, a
 * utility class without styles, a three-column grid without mobile rules). Not taken from any library.
 */
const feature = (id: string, title: string, text: string) => [
  { id: `c${id}`, name: "block", parent: "grid01", children: [`i${id}`, `t${id}`, `p${id}`], label: "Feature card", settings: { _cssGlobalClasses: ["fcard1"] } },
  { id: `i${id}`, name: "icon", parent: `c${id}`, children: [], settings: { icon: { library: "ionicons", icon: "ion-md-flash" }, iconSize: "28px", iconColor: { hex: "#7c3aed" } } },
  { id: `t${id}`, name: "heading", parent: `c${id}`, children: [], settings: { tag: "h3", text: title, _typography: { "font-size": "2.2rem", "font-family": "Montserrat", "font-weight": "700", color: { hex: "#1a1a2e" } } } },
  { id: `p${id}`, name: "text-basic", parent: `c${id}`, children: [], settings: { text, _typography: { "font-size": "1.6rem", color: { hex: "#6b6b80" }, "line-height": "1.6" } } },
];

export const MODERNIZE_EXAMPLE = {
  content: [
    { id: "sect01", name: "section", parent: 0, children: ["cont01"], label: "Features", settings: { _cssGlobalClasses: ["util01"], _background: { color: { hex: "#faf7ff" } }, _padding: { top: "96px", bottom: "96px" } } },
    { id: "cont01", name: "container", parent: "sect01", children: ["head01", "lead01", "grid01", "acts01"], settings: { _alignItems: "center", _rowGap: "2.4rem" } },
    { id: "head01", name: "heading", parent: "cont01", children: [], settings: { tag: "h2", text: "Everything your team needs", _typography: { "font-size": "4.4rem", "font-family": "Montserrat", "font-weight": "800", color: { hex: "#1a1a2e" }, "text-align": "center" } } },
    { id: "lead01", name: "text-basic", parent: "cont01", children: [], settings: { text: "Plan, build and ship in one place – without juggling five tools.", _typography: { "font-size": "1.9rem", color: { hex: "#6b6b80" }, "text-align": "center" }, _widthMax: "620px" } },
    { id: "grid01", name: "div", parent: "cont01", children: ["ca01", "cb02", "cc03"], settings: { _display: "grid", _gridTemplateColumns: "1fr 1fr 1fr", _gridGap: "var(--grid-gap)", _width: "100%", _margin: { top: "24px" } } },
    ...feature("a01", "Plan together", "Shared boards keep everyone on the same page."),
    ...feature("b02", "Ship faster", "Automations take care of the busywork."),
    ...feature("c03", "Stay in control", "Roles and audit logs for every change."),
    { id: "acts01", name: "div", parent: "cont01", children: ["btn001", "btn002"], settings: { _display: "flex", _direction: "row", _columnGap: "1.6rem", _margin: { top: "16px" } } },
    { id: "btn001", name: "button", parent: "acts01", children: [], settings: { text: "Start free", style: "primary", size: "lg", link: { type: "external", url: "#" } } },
    { id: "btn002", name: "button", parent: "acts01", children: [], settings: { text: "See pricing", outline: true, link: { type: "external", url: "#" } } },
  ],
  globalClasses: [
    { id: "util01", name: "section--l", settings: {} },
    { id: "fcard1", name: "feature-card", settings: {
      _background: { color: { hex: "#ffffff" } }, _padding: { top: "3.2rem", right: "3.2rem", bottom: "3.2rem", left: "3.2rem" }, _rowGap: "12px",
      _border: { width: { top: "1px", right: "1px", bottom: "1px", left: "1px" }, style: "solid", color: { hex: "#ebe5f7" }, radius: { top: "18px", right: "18px", bottom: "18px", left: "18px" } },
      _boxShadow: { values: { offsetX: "0", offsetY: "12px", blur: "32px", spread: "-12px" }, color: { rgb: "rgba(124, 58, 237, 0.18)" } },
    } },
  ],
};
