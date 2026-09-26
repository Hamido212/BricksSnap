import { mkdir, writeFile } from "node:fs/promises";

// Native editable Bricks elements; no executable HTML, external images or fonts.
const content = [];
const color = hex => ({ hex });
const pad = (y, x = y) => ({ top: y, right: x, bottom: y, left: x });
const type = (size, weight = "400", ink = "#14291f") => ({ "font-family": "Segoe UI, Arial, sans-serif", "font-size": size, "font-weight": weight, "line-height": "1.45", color: color(ink) });
function el(id, name, parent, settings, label) {
  content.push({ id, name, parent, children: [], settings, ...(label ? { label } : {}) });
  if (parent) content.find(e => e.id === parent).children.push(id);
}
el("hbroot", "section", 0, {
  _background: { color: color("#f5f7f3") }, _heightMin: "100svh", _padding: pad("0", "clamp(22px,5vw,80px)"),
  _typography: type("16px"),
  _cssCustom: "%root% { overflow: hidden; }\n%root% * { box-sizing: border-box; }\n%root% p { margin: 0; }\n%root% .hb-plate { transform: rotate(-7deg); }\n@media(max-width:767px) { %root% .hb-plate { transform: rotate(-4deg); } }",
}, "HB · Coming soon");
el("hbwrap", "container", "hbroot", { _width: "100%", _widthMax: "1240px", _heightMin: "100svh", _display: "flex", _direction: "column", _justifyContent: "space-between", _margin: { left: "auto", right: "auto" } });
el("hbhead", "div", "hbwrap", { _display: "flex", _direction: "row", _justifyContent: "space-between", _alignItems: "center", _gap: "20px", _padding: pad("30px", "0"), _width: "100%", "_direction:mobile_portrait": "column", "_alignItems:mobile_portrait": "flex-start" }, "Marke & Status");
el("hblogo", "text-basic", "hbhead", { text: "HB / ZULASSUNGSDIENST", tag: "div", _typography: { ...type("15px", "700"), "letter-spacing": "0.035em" } });
el("hbstat", "text-basic", "hbhead", { text: "●  NEUER AUFTRITT IN ARBEIT", tag: "div", _typography: { ...type("11px", "600", "#486153"), "letter-spacing": "0.09em" } });
el("hbmain", "div", "hbwrap", { _display: "grid", _gridTemplateColumns: "1.05fr 0.95fr", _alignItems: "center", _gap: "64px", _width: "100%", _padding: pad("70px", "0"), "_gridTemplateColumns:mobile_landscape": "1fr", "_gap:mobile_landscape": "48px", "_padding:mobile_landscape": pad("40px", "0") }, "Coming-soon Inhalt");
el("hbcopy", "div", "hbmain", { _display: "flex", _direction: "column", _gap: "26px", _widthMin: "0" });
el("hbeyeb", "text-basic", "hbcopy", { text: "BALD WIEDER ONLINE", tag: "div", _typography: { ...type("11px", "700", "#526d58"), "letter-spacing": "0.15em" } });
el("hbtitle", "heading", "hbcopy", { text: "Wir machen uns startklar.", tag: "h1", _typography: { ...type("clamp(48px,5.6vw,82px)", "700"), "line-height": "1.02", "letter-spacing": "-0.055em" }, _margin: pad("0") });
el("hbtext", "text-basic", "hbcopy", { text: "Hier entsteht der neue Online-Auftritt von HB Zulassungsdienst. Bald finden Sie hier alle Informationen rund um Ihre Fahrzeugzulassung.", tag: "p", _typography: type("18px", "400", "#56645b"), _widthMax: "460px" });
el("hbtags", "div", "hbcopy", { _display: "flex", _direction: "row", _flexWrap: "wrap", _gap: "10px", _margin: { top: "10px" } });
for (const [index, text] of ["Anmelden", "Ummelden", "Abmelden"].entries()) el(`hbtag${index}`, "text-basic", "hbtags", { text, tag: "span", _typography: type("13px", "500"), _padding: pad("8px", "15px"), _border: { width: pad("1"), style: "solid", color: color("#d6dfd5"), radius: pad("100px") } });
el("hbartx", "div", "hbmain", { _background: { color: color("#d9edc8") }, _border: { radius: pad("28px") }, _padding: pad("65px", "34px"), _heightMin: "390px", _display: "flex", _direction: "column", _justifyContent: "center", _alignItems: "center", _gap: "38px", _widthMin: "0", "_heightMin:mobile_landscape": "300px", "_padding:mobile_portrait": pad("48px", "20px") }, "Kennzeichen-Motiv");
el("hbplat", "div", "hbartx", { _cssClasses: "hb-plate", _display: "flex", _direction: "row", _alignItems: "stretch", _background: { color: color("#ffffff") }, _border: { width: pad("2"), style: "solid", color: color("#172d22"), radius: pad("12px") }, _boxShadow: { values: { offsetX: "0", offsetY: "18", blur: "24", spread: "-10" }, color: { raw: "#14291f30" } }, _width: "100%", _widthMax: "410px", _height: "95px", _overflow: "hidden", "_height:mobile_portrait": "76px", _attributes: [{ name: "aria-label", value: "Symbolisches Kennzeichen: HB NEU" }] });
el("hbeuro", "text-basic", "hbplat", { text: "D", tag: "span", _background: { color: color("#244d85") }, _typography: type("22px", "600", "#ffffff"), _width: "42px", _display: "flex", _justifyContent: "center", _alignItems: "center", _flexShrink: "0" });
el("hbnumr", "text-basic", "hbplat", { text: "HB · NEU", tag: "span", _typography: { ...type("clamp(30px,3.7vw,52px)", "700"), "font-family": "Arial, sans-serif", "letter-spacing": "0.055em", "line-height": "1" }, _display: "flex", _justifyContent: "center", _alignItems: "center", _width: "100%", _padding: pad("0", "12px") });
el("hbnote", "text-basic", "hbartx", { text: "Ein frischer Auftritt.\nBald an dieser Stelle.", tag: "p", _typography: { ...type("15px", "500", "#35523c"), "text-align": "center" }, _cssCustom: "%root% { white-space: pre-line; }" });
el("hbfoot", "div", "hbwrap", { _display: "flex", _direction: "row", _justifyContent: "space-between", _gap: "16px", _width: "100%", _padding: pad("24px", "0"), _border: { width: { top: "1" }, style: "solid", color: color("#dce3d9") }, "_direction:mobile_portrait": "column" }, "Fußzeile");
el("hburlx", "text-basic", "hbfoot", { text: "hb-zulassungsdienst.de", tag: "span", _typography: type("12px", "600", "#56645b") });
el("hbsoon", "text-basic", "hbfoot", { text: "Danke für Ihre Geduld.", tag: "span", _typography: type("12px", "400", "#56645b") });
// Bricks IDs must be exactly six lowercase alphanumeric characters.
const mapping = new Map(content.map((e, index) => [e.id, `hb${index.toString(36).padStart(4, "0")}`]));
for (const e of content) {
  e.id = mapping.get(e.id); e.parent = e.parent ? mapping.get(e.parent) : 0; e.children = e.children.map(id => mapping.get(id));
  for (const key of Object.keys(e.settings)) {
    if (key === "_gap" || key.startsWith("_gap:")) {
      e.settings[key.replace("_gap", "_rowGap")] = e.settings[key];
      e.settings[key.replace("_gap", "_columnGap")] = e.settings[key];
      delete e.settings[key];
    }
  }
  const typography = e.settings._typography;
  if (typography?.["font-family"]?.includes(",")) {
    const stack = typography["font-family"];
    typography["font-family"] = stack.split(",")[0];
    e.settings._cssCustom = `${e.settings._cssCustom || ""}\n%root% { font-family: ${stack}; }`;
  }
  if (e.settings._cssCustom) e.settings._cssCustom = e.settings._cssCustom.replaceAll("%root%", `#brxe-${e.id}`);
}
const template = { name: "hb-coming-soon", title: "HB Zulassungsdienst · Coming soon", type: "content", templateType: "content", content, source: "bricksCopiedElements", sourceUrl: "", version: "2.4.1", globalClasses: [], globalElements: [] };
await mkdir("artifacts/hb-coming-soon", { recursive: true });
await writeFile("artifacts/hb-coming-soon/hb-coming-soon.json", JSON.stringify(template, null, 2));
console.log(`Created ${content.length} native elements.`);
