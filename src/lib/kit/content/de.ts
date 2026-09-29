import type { IndustryCopy, BaseCopy } from "./model";
import type { IndustryId } from "./types";

/** German copy. `{name}` and `{city}` are replaced with the profile's values. */
export const baseDe: BaseCopy = {
  anchors: { services: "leistungen", pricing: "preise", about: "ueber-uns", contact: "kontakt", faq: "faq", team: "team", portfolio: "referenzen" },
  nav: [{ label: "Leistungen", href: "#leistungen" }, { label: "Preise", href: "#preise" }, { label: "Über uns", href: "#ueber-uns" }, { label: "Kontakt", href: "#kontakt" }],
  contact: {
    eyebrow: "Kontakt", title: "Wir freuen uns auf Ihre Nachricht", lead: "Rufen Sie an oder schreiben Sie uns – wir melden uns in der Regel am selben Werktag.", formTitle: "Anfrage senden",
    labels: { name: "Name", email: "E-Mail", phone: "Telefon", message: "Ihre Nachricht", submit: "Nachricht senden", privacy: "Ich stimme der Verarbeitung meiner Daten gemäß Datenschutzerklärung zu." },
    hoursTitle: "Öffnungszeiten", addressTitle: "Anschrift",
  },
  footerColumns: [
    { title: "Unternehmen", links: [{ label: "Über uns", href: "#ueber-uns" }, { label: "Team", href: "#team" }, { label: "Karriere", href: "#" }] },
    { title: "Service", links: [{ label: "Leistungen", href: "#leistungen" }, { label: "Preise", href: "#preise" }, { label: "Häufige Fragen", href: "#faq" }] },
  ],
  legal: [{ label: "Impressum", href: "/impressum" }, { label: "Datenschutz", href: "/datenschutz" }],
  notFound: { title: "Diese Seite gibt es nicht (mehr)", text: "Vielleicht hat sich die Adresse geändert. Auf der Startseite finden Sie alles Wichtige.", cta: { label: "Zur Startseite", href: "/" } },
  comingSoon: { eyebrow: "Bald online", title: "Hier entsteht die neue Website von {name}", text: "Wir sind weiterhin für Sie da – telefonisch und vor Ort.", cta: { label: "Jetzt anrufen", href: "tel:" } },
  login: { title: "Willkommen zurück", text: "Melden Sie sich mit Ihren Zugangsdaten an.", email: "E-Mail oder Benutzername", password: "Passwort", submit: "Anmelden", forgot: "Passwort vergessen?" },
  ui: { readMore: "Weiterlesen", perMonth: "pro Monat", mostPopular: "Beliebt", openingHours: "Öffnungszeiten", callUs: "Anrufen", writeUs: "Schreiben", visitUs: "Besuchen", allRightsReserved: "Alle Rechte vorbehalten." },
};

export const industriesDe: Record<IndustryId, IndustryCopy> = {
  kfz: {
    brand: { name: "Zulassungsdienst Nord", city: "Bremen", phone: "0421 123 456 78", address: "Hafenstraße 12, 28217 Bremen", tagline: "Zulassung, Ummeldung und Abmeldung – schnell und zum Festpreis.", hours: ["Mo–Fr 8:00–18:00 Uhr", "Sa 9:00–13:00 Uhr"] },
    navCta: { label: "Auftrag starten", href: "#kontakt" },
    hero: {
      eyebrow: "Kfz-Zulassung in {city}", title: "Zulassen, ummelden, abmelden – ohne Wartezeit.",
      lead: "Wir übernehmen den Weg zur Zulassungsstelle: Neuzulassung, Umschreibung, Abmeldung und Wunschkennzeichen, meist noch am selben Tag.",
      primary: { label: "Auftrag starten", href: "#kontakt" }, secondary: { label: "Preise ansehen", href: "#preise" },
      points: ["Erledigung oft am selben Werktag", "Festpreise ohne versteckte Kosten", "Kennzeichen direkt vor Ort geprägt"],
      image: "carSide", panelTitle: "Heute für Sie da", panelLines: ["Mo–Fr 8:00–18:00 Uhr", "Sa 9:00–13:00 Uhr", "Ohne Termin – einfach vorbeikommen"],
    },
    services: {
      eyebrow: "Leistungen", title: "Alles rund um die Zulassung aus einer Hand", lead: "Sie bringen die Unterlagen, wir erledigen den Rest – für Privatkunden, Firmen und Autohäuser.",
      items: [
        { icon: "car", title: "Neuzulassung", text: "Neuwagen, Gebrauchter oder Import: Ihr Fahrzeug kommt schnell und korrekt auf die Straße.", image: "carSide", price: "ab 69 €" },
        { icon: "document", title: "Umschreibung", text: "Halterwechsel oder Umzug – wir kümmern uns um alle Formulare und Eintragungen.", image: "signing", price: "ab 59 €" },
        { icon: "clipboard", title: "Abmeldung", text: "Außerbetriebsetzung ohne Behördengang, auch kurzfristig am selben Tag.", image: "paperwork", price: "ab 29 €" },
        { icon: "key", title: "Wunschkennzeichen", text: "Reservierung und Prägung Ihres Wunschkennzeichens aus einer Hand.", image: "carFront", price: "ab 15 €" },
        { icon: "time", title: "Kurzzeitkennzeichen", text: "Für Überführung und Probefahrt – meist in wenigen Minuten fertig.", image: "carRoad", price: "ab 49 €" },
        { icon: "briefcase", title: "Händlerservice", text: "Sammelaufträge für Autohäuser mit festem Ansprechpartner und Abholung.", image: "carWash" },
      ],
    },
    features: {
      eyebrow: "Warum wir", title: "Zeit sparen statt Wartemarke ziehen", lead: "Wir kennen die Abläufe der Zulassungsstelle und erledigen sie jeden Tag.",
      items: [
        { icon: "flash", title: "Schnell", text: "Die meisten Aufträge sind am selben Werktag erledigt." },
        { icon: "cash", title: "Festpreis", text: "Sie kennen den Preis vorher, amtliche Gebühren transparent ausgewiesen." },
        { icon: "pin", title: "Direkt in {city}", text: "Kurze Wege zur Zulassungsstelle und Parkplätze vor der Tür." },
        { icon: "chatbubbles", title: "Persönlich", text: "Ein fester Ansprechpartner statt Warteschleife." },
      ],
    },
    steps: {
      eyebrow: "So funktioniert’s", title: "In drei Schritten zugelassen", lead: "Kein Termin, keine Wartemarke – nur ein paar Unterlagen.",
      items: [
        { title: "Unterlagen senden", text: "Fahrzeugbrief, eVB-Nummer und Ausweis als Foto schicken oder bei uns vorbeibringen." },
        { title: "Wir erledigen alles", text: "Anträge, Gebühren und Kennzeichen – wir melden uns, sobald alles fertig ist." },
        { title: "Abholen oder liefern lassen", text: "Papiere und Kennzeichen abholen oder bequem zu Ihnen bringen lassen." },
      ],
    },
    stats: { eyebrow: "In Zahlen", title: "Verlässlich seit 2011", items: [{ value: "12.000+", label: "Zulassungen" }, { value: "Ø 4 Std.", label: "Bearbeitungszeit" }, { value: "4,9 / 5", label: "Google-Bewertung" }, { value: "40+", label: "Partner-Autohäuser" }] },
    pricing: {
      eyebrow: "Preise", title: "Faire Festpreise", lead: "Unser Servicepreis steht vorher fest. Amtliche Gebühren und Kennzeichen rechnen wir transparent ab.", note: "Alle Preise zzgl. amtlicher Gebühren. Stand 2026.",
      plans: [
        { name: "Abmeldung", price: "29 €", unit: "zzgl. Gebühren", description: "Fahrzeug außer Betrieb setzen", features: ["Ohne Termin", "Bestätigung für Versicherung", "Am selben Tag"], cta: { label: "Abmelden lassen", href: "#kontakt" } },
        { name: "Umschreibung", price: "59 €", unit: "zzgl. Gebühren", description: "Halterwechsel oder Umzug", features: ["Alle Formulare inklusive", "Kennzeichen-Prägung vor Ort", "Rückgabe per Kurier möglich"], featured: true, cta: { label: "Umschreiben lassen", href: "#kontakt" } },
        { name: "Neuzulassung", price: "69 €", unit: "zzgl. Gebühren", description: "Neu, gebraucht oder Import", features: ["Prüfung der Unterlagen", "Wunschkennzeichen möglich", "Plaketten inklusive"], cta: { label: "Zulassen lassen", href: "#kontakt" } },
      ],
      list: [
        { name: "Neuzulassung", detail: "Pkw, Motorrad, Anhänger", price: "69 €" },
        { name: "Umschreibung", detail: "Halterwechsel oder Umzug", price: "59 €" },
        { name: "Abmeldung", detail: "Außerbetriebsetzung", price: "29 €" },
        { name: "Wunschkennzeichen", detail: "Reservierung", price: "15 €" },
        { name: "Kurzzeitkennzeichen", detail: "inkl. Versicherungsnachweis", price: "49 €" },
        { name: "Kennzeichen prägen", detail: "Paar, EU-Norm", price: "25 €" },
      ],
    },
    testimonials: {
      eyebrow: "Kundenstimmen", title: "Was unsere Kunden sagen", rating: { score: "4,9", count: "320 Bewertungen", source: "Google" },
      items: [
        { quote: "Morgens die Unterlagen abgegeben, mittags war das Auto zugelassen. So entspannt war eine Ummeldung noch nie.", name: "Sandra K.", role: "Privatkundin", photo: "portraitA" },
        { quote: "Für unser Autohaus der verlässlichste Partner: feste Ansprechpartner und keine Überraschungen bei den Kosten.", name: "Thomas Meyer", role: "Autohaus Meyer", photo: "portraitD" },
        { quote: "Wunschkennzeichen reserviert, Auto zugelassen, alles in einem Gang. Freundlich und superschnell.", name: "Tim R.", role: "Neuzulassung", photo: "portraitF" },
      ],
    },
    team: {
      eyebrow: "Team", title: "Ihre Ansprechpartner", lead: "Wir kennen jeden Antrag – und nehmen uns Zeit für Ihre Fragen.",
      members: [{ name: "Jana Petersen", role: "Inhaberin", photo: "portraitE" }, { name: "Mehmet Aydın", role: "Zulassung & Beratung", photo: "portraitB" }, { name: "Lukas Brandt", role: "Händlerservice", photo: "portraitF" }, { name: "Sophie Wagner", role: "Kundenservice", photo: "portraitC" }],
    },
    about: {
      eyebrow: "Über uns", title: "Seit 2011 Ihr Zulassungsdienst in {city}",
      paragraphs: ["{name} wurde gegründet, um Autofahrern den Weg zur Zulassungsstelle zu ersparen. Heute betreuen wir Privatkunden, Firmenflotten und über 40 Autohäuser in der Region.", "Unser Team kennt jedes Formular und jede Sonderregel. Deshalb sind die meisten Aufträge noch am selben Tag erledigt – zum vorher vereinbarten Festpreis."],
      points: ["Offiziell zugelassener Zulassungsdienst", "Kennzeichen-Prägung im eigenen Haus", "Kurierdienst im gesamten Stadtgebiet"],
      image: "signing", secondImage: "carFront",
    },
    faq: {
      eyebrow: "Fragen & Antworten", title: "Häufige Fragen", lead: "Ihre Frage ist nicht dabei? Rufen Sie uns einfach an.",
      items: [
        { q: "Welche Unterlagen brauche ich für eine Zulassung?", a: "Zulassungsbescheinigung Teil I und II, eVB-Nummer Ihrer Versicherung, Personalausweis, SEPA-Mandat für die Kfz-Steuer und bei Gebrauchtwagen den HU-Nachweis." },
        { q: "Wie schnell ist mein Fahrzeug zugelassen?", a: "Die meisten Aufträge erledigen wir am selben Werktag. Bei vollständigen Unterlagen bis 11 Uhr meist noch am Mittag." },
        { q: "Brauche ich einen Termin?", a: "Nein. Kommen Sie während der Öffnungszeiten vorbei oder senden Sie uns die Unterlagen vorab als Foto." },
        { q: "Kann ich jemanden bevollmächtigen?", a: "Ja. Mit einer unterschriebenen Vollmacht und einer Ausweiskopie erledigen wir alles für Sie – Sie müssen nicht selbst kommen." },
        { q: "Arbeiten Sie auch für Autohäuser?", a: "Ja, mit Sammelaufträgen, festen Ansprechpartnern und Abholung der Unterlagen direkt im Autohaus." },
        { q: "Wie kann ich bezahlen?", a: "Bar, per EC- oder Kreditkarte sowie für Firmenkunden auf Rechnung." },
      ],
    },
    cta: { eyebrow: "Jetzt starten", title: "Keine Zeit für die Zulassungsstelle?", lead: "Schicken Sie uns Ihre Unterlagen – wir melden uns innerhalb einer Stunde mit dem Festpreis.", primary: { label: "Auftrag starten", href: "#kontakt" }, secondary: { label: "Anrufen", href: "tel:" } },
    gallery: { eyebrow: "Einblicke", title: "Bei uns vor Ort", images: ["carSide", "signing", "carFront", "paperwork", "carWash", "carRoad"] },
    portfolio: { eyebrow: "Referenzen", title: "Für wen wir arbeiten", lead: "Vom Privatwagen bis zur Firmenflotte.", items: [{ title: "Flottenumstellung", category: "Firmenkunde", image: "carRoad" }, { title: "Import-Zulassung", category: "Privatkunde", image: "carFront" }, { title: "Händler-Sammelauftrag", category: "Autohaus", image: "carWash" }, { title: "Oldtimer mit H-Kennzeichen", category: "Privatkunde", image: "carSide" }] },
    blog: {
      eyebrow: "Ratgeber", title: "Wissen rund um die Zulassung", lead: "Kurz erklärt, was Sie wirklich wissen müssen.",
      posts: [
        { title: "Diese Unterlagen brauchen Sie für die Zulassung", excerpt: "Die komplette Checkliste für Neu-, Gebraucht- und Importfahrzeuge.", category: "Checkliste", date: "März 2026", image: "paperwork" },
        { title: "Wunschkennzeichen reservieren: So geht’s", excerpt: "Welche Kombinationen möglich sind und wie lange die Reservierung gilt.", category: "Ratgeber", date: "Februar 2026", image: "carFront" },
        { title: "Auto abmelden: Das müssen Sie beachten", excerpt: "Versicherung, Steuer und Kennzeichen – der Ablauf Schritt für Schritt.", category: "Ratgeber", date: "Januar 2026", image: "signing" },
      ],
    },
    logos: { title: "Partner und Autohäuser aus der Region", names: ["Autohaus Meyer", "Nordcar", "Weser Mobil", "HB Leasing", "Stadtflotte"] },
    timeline: { eyebrow: "Geschichte", title: "Unser Weg", items: [{ year: "2011", title: "Gründung", text: "Start als Ein-Frau-Betrieb direkt neben der Zulassungsstelle." }, { year: "2016", title: "Händlerservice", text: "Sammelaufträge und Abholservice für Autohäuser." }, { year: "2021", title: "Online-Auftrag", text: "Unterlagen digital einreichen, Status per SMS." }, { year: "2026", title: "Zweiter Standort", text: "Mehr Platz und eigene Kennzeichen-Prägung." }] },
  },

  handwerk: {
    brand: { name: "Meyer Haustechnik", city: "Hannover", phone: "0511 987 654 30", address: "Werkstraße 7, 30159 Hannover", tagline: "Elektro, Sanitär und Heizung vom Meisterbetrieb.", hours: ["Mo–Fr 7:00–17:00 Uhr", "Notdienst rund um die Uhr"] },
    navCta: { label: "Angebot anfragen", href: "#kontakt" },
    hero: {
      eyebrow: "Meisterbetrieb in {city}", title: "Haustechnik, die einfach funktioniert.",
      lead: "Elektro, Sanitär und Heizung aus einer Hand – sauber geplant, pünktlich umgesetzt und mit Festpreisangebot.",
      primary: { label: "Angebot anfragen", href: "#kontakt" }, secondary: { label: "Leistungen ansehen", href: "#leistungen" },
      points: ["Festpreisangebot innerhalb von 48 Stunden", "Termintreue mit festem Ansprechpartner", "24/7-Notdienst für Bestandskunden"],
      image: "electrician", panelTitle: "Notdienst", panelLines: ["Rund um die Uhr erreichbar", "Anfahrt im Stadtgebiet in 60 Minuten", "Transparente Notdienstpauschale"],
    },
    services: {
      eyebrow: "Leistungen", title: "Ein Betrieb für Ihr ganzes Haus", lead: "Von der kleinen Reparatur bis zur Komplettsanierung – mit eigenen Fachkräften statt Subunternehmern.",
      items: [
        { icon: "flash", title: "Elektroinstallation", text: "Neubau, Sanierung und E-Check – sicher nach aktueller Norm.", image: "electrician", price: "ab 65 € / Std." },
        { icon: "construct", title: "Bad & Sanitär", text: "Barrierefreie Bäder und Sanitärinstallation mit Planung aus einer Hand.", image: "plumber" },
        { icon: "sunny", title: "Heizung & Wärmepumpe", text: "Beratung, Förderantrag und Einbau moderner Heizsysteme.", image: "site" },
        { icon: "home", title: "Smart Home", text: "Licht, Heizung und Sicherheit komfortabel per App steuern.", image: "interior" },
        { icon: "build", title: "Reparatur & Notdienst", text: "Schnelle Hilfe bei Stromausfall, Rohrbruch oder Heizungsausfall.", image: "drill" },
        { icon: "settings", title: "Wartung", text: "Regelmäßige Wartung für lange Lebensdauer und niedrige Kosten.", image: "plumber" },
      ],
    },
    features: {
      eyebrow: "Warum Meyer", title: "Handwerk, auf das Sie sich verlassen können", lead: "Seit drei Generationen in {city} – mit eigenem Team und klaren Zusagen.",
      items: [
        { icon: "ribbon", title: "Meisterbetrieb", text: "Eingetragen in der Handwerkskammer, geschultes Fachpersonal." },
        { icon: "calendar", title: "Termintreu", text: "Wir kommen, wann wir es sagen – sonst ist die Anfahrt kostenlos." },
        { icon: "cash", title: "Festpreis", text: "Schriftliches Angebot vor Arbeitsbeginn, keine Überraschungen." },
        { icon: "leaf", title: "Sauber", text: "Staubschutz, Schuhüberzieher und besenreine Übergabe." },
      ],
    },
    steps: {
      eyebrow: "Ablauf", title: "Vom Anruf bis zur Übergabe", lead: "Klar geplant, damit Ihr Alltag weiterläuft.",
      items: [
        { title: "Besichtigung", text: "Wir schauen uns alles vor Ort an und beraten Sie ehrlich." },
        { title: "Festpreisangebot", text: "Sie erhalten innerhalb von 48 Stunden ein verbindliches Angebot." },
        { title: "Umsetzung", text: "Unser Team arbeitet sauber, pünktlich und im vereinbarten Zeitrahmen." },
        { title: "Übergabe", text: "Einweisung, Dokumentation und Gewährleistung inklusive." },
      ],
    },
    stats: { eyebrow: "In Zahlen", title: "Seit 1978 in {city}", items: [{ value: "3.500+", label: "Aufträge im Jahr" }, { value: "24 / 7", label: "Notdienst" }, { value: "18", label: "Fachkräfte" }, { value: "4,8 / 5", label: "Kundenbewertung" }] },
    pricing: {
      eyebrow: "Preise", title: "Transparente Konditionen", lead: "Kleine Arbeiten nach Aufwand, größere Projekte zum schriftlichen Festpreis.", note: "Alle Preise inkl. MwSt. Material nach Verbrauch.",
      plans: [
        { name: "Reparatur", price: "65 €", unit: "pro Stunde", description: "Kleine Arbeiten und Fehlersuche", features: ["Anfahrt im Stadtgebiet inklusive", "Abrechnung im 15-Minuten-Takt", "Material nach Verbrauch"], cta: { label: "Termin anfragen", href: "#kontakt" } },
        { name: "Wartungsvertrag", price: "19 €", unit: "pro Monat", description: "Heizung oder Anlage im Jahresrhythmus", features: ["Jährliche Wartung", "Bevorzugte Notdiensttermine", "10 % auf Ersatzteile"], featured: true, cta: { label: "Vertrag abschließen", href: "#kontakt" } },
        { name: "Projekt", price: "Festpreis", unit: "nach Angebot", description: "Bad, Heizung oder Elektrosanierung", features: ["Kostenlose Besichtigung", "Planung und Förderberatung", "Fester Ansprechpartner"], cta: { label: "Angebot anfordern", href: "#kontakt" } },
      ],
      list: [
        { name: "Arbeitsstunde Geselle", detail: "Montage und Reparatur", price: "65 €" },
        { name: "Arbeitsstunde Meister", detail: "Planung und Abnahme", price: "82 €" },
        { name: "E-Check", detail: "Wohnung bis 100 m²", price: "149 €" },
        { name: "Heizungswartung", detail: "Gas-Brennwert", price: "169 €" },
        { name: "Notdienstpauschale", detail: "nachts und am Wochenende", price: "89 €" },
        { name: "Anfahrt", detail: "außerhalb des Stadtgebiets", price: "ab 25 €" },
      ],
    },
    testimonials: {
      eyebrow: "Kundenstimmen", title: "Das sagen unsere Kunden", rating: { score: "4,8", count: "210 Bewertungen", source: "Google" },
      items: [
        { quote: "Das neue Bad wurde in zehn Tagen fertig, genau wie versprochen. Sauber gearbeitet und immer erreichbar.", name: "Familie Schröder", role: "Badsanierung", photo: "portraitC" },
        { quote: "Samstagabend Heizungsausfall – eine Stunde später war der Techniker da. Top!", name: "Martin L.", role: "Notdienst", photo: "portraitB" },
        { quote: "Von der Förderberatung bis zur fertigen Wärmepumpe alles aus einer Hand. Absolut empfehlenswert.", name: "Anna W.", role: "Heizungstausch", photo: "portraitA" },
      ],
    },
    team: {
      eyebrow: "Team", title: "Die Menschen hinter Meyer", lead: "Eigene Fachkräfte, eigene Azubis – und jede Menge Erfahrung.",
      members: [{ name: "Stefan Meyer", role: "Elektromeister, Inhaber", photo: "portraitD" }, { name: "Katrin Meyer", role: "Büro & Planung", photo: "portraitE" }, { name: "Jonas Koch", role: "Anlagenmechaniker SHK", photo: "portraitF" }, { name: "Leonie Busch", role: "Elektronikerin", photo: "portraitC" }],
    },
    about: {
      eyebrow: "Über uns", title: "Seit drei Generationen in {city}",
      paragraphs: ["{name} ist ein Familienbetrieb mit 18 Fachkräften. Wir planen, installieren und warten Elektro-, Sanitär- und Heizungsanlagen für private Haushalte, Hausverwaltungen und Gewerbe.", "Wir bilden selbst aus, arbeiten ohne Subunternehmer und stehen auch nach der Übergabe für Sie bereit."],
      points: ["Eingetragener Meisterbetrieb", "Zertifizierter Wärmepumpen-Fachbetrieb", "Eigener 24/7-Notdienst"],
      image: "electrician", secondImage: "interior",
    },
    faq: {
      eyebrow: "Fragen & Antworten", title: "Häufige Fragen", lead: "Sie haben eine andere Frage? Wir rufen Sie gern zurück.",
      items: [
        { q: "Wie schnell bekomme ich einen Termin?", a: "Für Reparaturen meist innerhalb von zwei bis drei Werktagen, im Notdienst noch am selben Tag." },
        { q: "Ist die Besichtigung kostenlos?", a: "Ja, für Projekte ab 1.000 € ist die Besichtigung im Stadtgebiet kostenlos." },
        { q: "Helfen Sie bei Förderanträgen?", a: "Ja. Wir beraten zu BAFA- und KfW-Förderungen und bereiten die Unterlagen für Sie vor." },
        { q: "Arbeiten Sie auch für Hausverwaltungen?", a: "Ja, mit Rahmenverträgen, festen Ansprechpartnern und digitaler Dokumentation." },
        { q: "Welche Gewährleistung gibt es?", a: "Auf unsere Arbeiten gilt die gesetzliche Gewährleistung, auf viele Geräte zusätzlich die Herstellergarantie." },
        { q: "Wie kann ich bezahlen?", a: "Per Überweisung nach Rechnung, bei größeren Projekten in vereinbarten Abschlägen." },
      ],
    },
    cta: { eyebrow: "Kostenloses Angebot", title: "Planen Sie ein Projekt?", lead: "Erzählen Sie uns kurz davon – Sie erhalten innerhalb von 48 Stunden ein Festpreisangebot.", primary: { label: "Angebot anfragen", href: "#kontakt" }, secondary: { label: "Notdienst anrufen", href: "tel:" } },
    gallery: { eyebrow: "Projekte", title: "Aus unserer Arbeit", images: ["interior", "electrician", "plumber", "site", "drill", "handshake"] },
    portfolio: { eyebrow: "Referenzen", title: "Ausgewählte Projekte", lead: "Ein kleiner Einblick in unsere Arbeit der letzten Monate.", items: [{ title: "Barrierefreies Bad", category: "Sanitär", image: "interior" }, { title: "Wärmepumpe im Altbau", category: "Heizung", image: "site" }, { title: "Elektrosanierung Mehrfamilienhaus", category: "Elektro", image: "electrician" }, { title: "Smart-Home-Nachrüstung", category: "Elektro", image: "drill" }] },
    blog: {
      eyebrow: "Ratgeber", title: "Tipps rund ums Haus", lead: "Praktisches Wissen von unseren Meistern.",
      posts: [
        { title: "Wärmepumpe im Altbau – geht das?", excerpt: "Worauf es wirklich ankommt und welche Förderung möglich ist.", category: "Heizung", date: "März 2026", image: "site" },
        { title: "E-Check: Wann ist er Pflicht?", excerpt: "Für Vermieter und Gewerbe wichtig – und für Eigentümer sinnvoll.", category: "Elektro", date: "Februar 2026", image: "electrician" },
        { title: "Barrierefreies Bad planen", excerpt: "Fünf Details, die im Alltag den Unterschied machen.", category: "Sanitär", date: "Januar 2026", image: "interior" },
      ],
    },
    logos: { title: "Wir arbeiten mit starken Partnern", names: ["Viessmann", "Grohe", "Busch-Jaeger", "Vaillant", "Hager"] },
    timeline: { eyebrow: "Geschichte", title: "Drei Generationen Handwerk", items: [{ year: "1978", title: "Gründung", text: "Heinrich Meyer eröffnet die Elektrowerkstatt." }, { year: "1996", title: "Sanitär & Heizung", text: "Erweiterung um den SHK-Bereich." }, { year: "2012", title: "Neue Werkstatt", text: "Umzug in die Werkstraße mit eigenem Lager." }, { year: "2024", title: "Wärmepumpen", text: "Zertifizierung als Fachbetrieb für Wärmepumpen." }] },
  },

  praxis: {
    brand: { name: "Praxis Dr. Lehmann", city: "Leipzig", phone: "0341 555 012 34", address: "Lindenallee 3, 04109 Leipzig", tagline: "Allgemeinmedizin mit Zeit für Sie.", hours: ["Mo, Di, Do 8:00–18:00 Uhr", "Mi, Fr 8:00–13:00 Uhr"] },
    navCta: { label: "Termin vereinbaren", href: "#kontakt" },
    hero: {
      eyebrow: "Hausarztpraxis in {city}", title: "Medizin mit Zeit für Sie.",
      lead: "Wir begleiten Sie und Ihre Familie ein Leben lang – mit Vorsorge, moderner Diagnostik und einem offenen Ohr.",
      primary: { label: "Termin vereinbaren", href: "#kontakt" }, secondary: { label: "Leistungen ansehen", href: "#leistungen" },
      points: ["Online-Termine rund um die Uhr", "Kurze Wartezeiten durch Terminsprechstunde", "Barrierefreie Praxisräume"],
      image: "reception", panelTitle: "Sprechzeiten", panelLines: ["Mo, Di, Do 8:00–18:00 Uhr", "Mi, Fr 8:00–13:00 Uhr", "Akutsprechstunde täglich ab 8 Uhr"],
    },
    services: {
      eyebrow: "Leistungen", title: "Hausärztliche Versorgung für die ganze Familie", lead: "Von der Vorsorge bis zur Behandlung chronischer Erkrankungen.",
      items: [
        { icon: "heart", title: "Vorsorge & Check-up", text: "Gesundheits-Check, Krebsvorsorge und individuelle Beratung.", image: "doctor" },
        { icon: "medkit", title: "Impfungen", text: "Standard-, Reise- und Auffrischimpfungen nach STIKO.", image: "treatment" },
        { icon: "pulse", title: "Diagnostik", text: "EKG, Belastungs-EKG, Lungenfunktion und Ultraschall.", image: "treatment" },
        { icon: "home", title: "Hausbesuche", text: "Für Patientinnen und Patienten, die nicht in die Praxis kommen können.", image: "doctor" },
        { icon: "globe", title: "Reisemedizin", text: "Beratung, Impfungen und Reiseapotheke vor Ihrer Reise.", image: "reception" },
        { icon: "chatbubbles", title: "Videosprechstunde", text: "Befundbesprechung und Folgetermine bequem von zu Hause.", image: "office" },
      ],
    },
    features: {
      eyebrow: "Unsere Praxis", title: "Gut aufgehoben vom ersten Anruf an", lead: "Wir nehmen uns Zeit – und organisieren die Praxis so, dass Sie nicht warten müssen.",
      items: [
        { icon: "time", title: "Kurze Wartezeiten", text: "Terminsprechstunde und Akutsprechstunde getrennt organisiert." },
        { icon: "calendar", title: "Online-Termine", text: "Termine rund um die Uhr online buchen oder verschieben." },
        { icon: "people", title: "Familienmedizin", text: "Wir betreuen Kinder, Eltern und Großeltern." },
        { icon: "hand", title: "Barrierefrei", text: "Stufenloser Zugang, Aufzug und Behinderten-WC." },
      ],
    },
    steps: {
      eyebrow: "Ihr Besuch", title: "So läuft Ihr Termin ab", lead: "Einfach und gut vorbereitet.",
      items: [
        { title: "Termin buchen", text: "Online, telefonisch oder in der Praxis – wie es Ihnen passt." },
        { title: "Gut vorbereitet kommen", text: "Versichertenkarte, Medikamentenplan und aktuelle Befunde mitbringen." },
        { title: "Gemeinsam entscheiden", text: "Wir besprechen Befunde verständlich und planen die nächsten Schritte." },
      ],
    },
    stats: { eyebrow: "Über die Praxis", title: "Für {city} da", items: [{ value: "25", label: "Jahre Erfahrung" }, { value: "6.000+", label: "Patientinnen und Patienten" }, { value: "Ø 12 Min.", label: "Wartezeit" }, { value: "4,9 / 5", label: "Bewertung" }] },
    pricing: {
      eyebrow: "Selbstzahlerleistungen", title: "Individuelle Gesundheitsleistungen", lead: "Leistungen, die die gesetzliche Krankenkasse nicht übernimmt – transparent nach GOÄ.", note: "Abrechnung nach GOÄ. Wir beraten Sie gern persönlich.",
      plans: [
        { name: "Basis-Check", price: "79 €", unit: "einmalig", description: "Für Gesundheitsbewusste ab 25", features: ["Ausführliche Anamnese", "Blutbild und Blutzucker", "Abschlussgespräch"], cta: { label: "Termin buchen", href: "#kontakt" } },
        { name: "Vorsorge Plus", price: "189 €", unit: "einmalig", description: "Umfassender Check-up", features: ["Labor erweitert", "Ruhe-EKG und Ultraschall", "Persönlicher Gesundheitsplan"], featured: true, cta: { label: "Termin buchen", href: "#kontakt" } },
        { name: "Reisemedizin", price: "35 €", unit: "Beratung", description: "Vor Fernreisen", features: ["Individuelle Impfberatung", "Reiseapotheke", "Impfungen nach Aufwand"], cta: { label: "Termin buchen", href: "#kontakt" } },
      ],
      list: [
        { name: "Reisemedizinische Beratung", detail: "ca. 20 Minuten", price: "35 €" },
        { name: "Sportmedizinischer Check", detail: "inkl. Belastungs-EKG", price: "129 €" },
        { name: "Ultraschall Schilddrüse", detail: "auf Wunsch", price: "45 €" },
        { name: "Attest / Bescheinigung", detail: "je nach Umfang", price: "ab 15 €" },
        { name: "Laborprofil Vitamine", detail: "D, B12, Folsäure", price: "59 €" },
        { name: "Tauglichkeitsuntersuchung", detail: "z. B. Tauchen", price: "89 €" },
      ],
    },
    testimonials: {
      eyebrow: "Patientenstimmen", title: "Was Patientinnen und Patienten sagen", rating: { score: "4,9", count: "180 Bewertungen", source: "Google" },
      items: [
        { quote: "Hier fühlt man sich ernst genommen. Dr. Lehmann erklärt alles in Ruhe und verständlich.", name: "Birgit S.", role: "Patientin seit 2015", photo: "portraitC" },
        { quote: "Online gebucht, pünktlich drangekommen – so sollte jede Praxis funktionieren.", name: "Daniel M.", role: "Patient", photo: "portraitF" },
        { quote: "Das ganze Team ist herzlich, auch bei den Hausbesuchen für meine Mutter.", name: "Claudia H.", role: "Angehörige", photo: "portraitE" },
      ],
    },
    team: {
      eyebrow: "Team", title: "Unser Praxisteam", lead: "Ärztinnen, Ärzte und medizinische Fachangestellte mit Herz.",
      members: [{ name: "Dr. med. Anne Lehmann", role: "Fachärztin für Allgemeinmedizin", photo: "portraitA" }, { name: "Dr. med. Paul Richter", role: "Facharzt für Innere Medizin", photo: "portraitD" }, { name: "Maria Kowalski", role: "Praxismanagerin", photo: "portraitE" }, { name: "Elif Demir", role: "Medizinische Fachangestellte", photo: "portraitC" }],
    },
    about: {
      eyebrow: "Über uns", title: "Ihre Hausarztpraxis in {city}",
      paragraphs: ["Seit 25 Jahren betreuen wir Familien aus {city} und Umgebung. Uns ist wichtig, dass Sie sich verstanden fühlen – deshalb nehmen wir uns Zeit für Gespräche.", "Moderne Diagnostik, digitale Termine und ein eingespieltes Team sorgen dafür, dass Ihr Besuch reibungslos verläuft."],
      points: ["Alle Kassen und Privatpatienten", "Akademische Lehrpraxis", "Barrierefreier Zugang mit Aufzug"],
      image: "reception", secondImage: "doctor",
    },
    faq: {
      eyebrow: "Fragen & Antworten", title: "Häufige Fragen", lead: "Weitere Fragen beantworten wir gern telefonisch.",
      items: [
        { q: "Nehmen Sie neue Patientinnen und Patienten auf?", a: "Ja, wir nehmen neue Patientinnen und Patienten aus {city} auf. Bitte vereinbaren Sie einen Ersttermin." },
        { q: "Wie buche ich einen Termin?", a: "Online rund um die Uhr, telefonisch während der Sprechzeiten oder direkt am Empfang." },
        { q: "Was mache ich bei akuten Beschwerden?", a: "Kommen Sie in die Akutsprechstunde, täglich ab 8 Uhr. Außerhalb der Sprechzeiten erreichen Sie den ärztlichen Bereitschaftsdienst unter 116 117." },
        { q: "Machen Sie Hausbesuche?", a: "Ja, für Patientinnen und Patienten, die aus gesundheitlichen Gründen nicht in die Praxis kommen können." },
        { q: "Kann ich Rezepte online bestellen?", a: "Ja, Folgerezepte können Sie online bestellen und am nächsten Werktag abholen." },
        { q: "Gibt es Parkplätze?", a: "Direkt vor der Praxis gibt es zwei Behindertenparkplätze, weitere Plätze im Parkhaus gegenüber." },
      ],
    },
    cta: { eyebrow: "Termin", title: "Wir sind für Sie da", lead: "Buchen Sie Ihren Termin online – oder rufen Sie uns während der Sprechzeiten an.", primary: { label: "Online-Termin buchen", href: "#kontakt" }, secondary: { label: "Anrufen", href: "tel:" } },
    gallery: { eyebrow: "Einblicke", title: "Unsere Praxisräume", images: ["reception", "treatment", "doctor", "office", "meeting", "workshop"] },
    portfolio: { eyebrow: "Schwerpunkte", title: "Unsere Schwerpunkte", lead: "Womit wir uns besonders gut auskennen.", items: [{ title: "Diabetes-Betreuung", category: "Chronische Erkrankungen", image: "doctor" }, { title: "Herz-Kreislauf", category: "Diagnostik", image: "treatment" }, { title: "Reisemedizin", category: "Beratung", image: "reception" }, { title: "Geriatrie", category: "Hausbesuche", image: "office" }] },
    blog: {
      eyebrow: "Gesundheit", title: "Aktuelles aus der Praxis", lead: "Neuigkeiten und Gesundheitstipps.",
      posts: [
        { title: "Grippeimpfung: Jetzt ist die richtige Zeit", excerpt: "Für wen die Impfung empfohlen ist und wie Sie einen Termin bekommen.", category: "Impfungen", date: "Oktober 2026", image: "treatment" },
        { title: "Check-up ab 35: Was wird untersucht?", excerpt: "Die Vorsorgeuntersuchung der Krankenkasse einfach erklärt.", category: "Vorsorge", date: "September 2026", image: "doctor" },
        { title: "Neue Online-Terminbuchung", excerpt: "Termine rund um die Uhr buchen, verschieben und absagen.", category: "Praxis", date: "August 2026", image: "reception" },
      ],
    },
    logos: { title: "Kooperationen", names: ["Klinikum Leipzig", "Uniklinik", "Apotheke am Markt", "Physio Plus", "Labor Mitte"] },
    timeline: { eyebrow: "Geschichte", title: "Unsere Praxis", items: [{ year: "2001", title: "Praxisgründung", text: "Dr. Lehmann eröffnet die Praxis in der Lindenallee." }, { year: "2012", title: "Lehrpraxis", text: "Anerkennung als akademische Lehrpraxis." }, { year: "2020", title: "Videosprechstunde", text: "Digitale Termine und Online-Rezepte." }, { year: "2025", title: "Erweiterung", text: "Zweiter Arzt und neue Diagnostikräume." }] },
  },

  restaurant: {
    brand: { name: "Trattoria Luce", city: "Köln", phone: "0221 444 555 66", address: "Am Rheinufer 21, 50667 Köln", tagline: "Italienische Küche mit regionalen Zutaten.", hours: ["Di–Sa 12:00–23:00 Uhr", "So 12:00–21:00 Uhr"] },
    navCta: { label: "Tisch reservieren", href: "#kontakt" },
    hero: {
      eyebrow: "Trattoria in {city}", title: "Echte italienische Küche, frisch gemacht.",
      lead: "Hausgemachte Pasta, Pizza aus dem Steinofen und Weine aus kleinen Weingütern – mitten in {city}.",
      primary: { label: "Tisch reservieren", href: "#kontakt" }, secondary: { label: "Zur Speisekarte", href: "#preise" },
      points: ["Pasta täglich frisch von Hand", "Regionale und saisonale Zutaten", "Terrasse mit Blick auf den Rhein"],
      image: "dining", panelTitle: "Öffnungszeiten", panelLines: ["Di–Sa 12:00–23:00 Uhr", "So 12:00–21:00 Uhr", "Montag Ruhetag"],
    },
    services: {
      eyebrow: "Angebot", title: "Genuss für jeden Anlass", lead: "Ob schneller Mittagstisch oder langer Abend mit Freunden.",
      items: [
        { icon: "restaurant", title: "Mittagstisch", text: "Wechselnde Gerichte, schnell serviert – Di bis Fr ab 12 Uhr.", image: "food", price: "ab 12,90 €" },
        { icon: "pizza", title: "Steinofen-Pizza", text: "48 Stunden gereifter Teig, im Holzofen gebacken.", image: "plate" },
        { icon: "wine", title: "Weinbar", text: "Über 60 Weine aus kleinen italienischen Weingütern.", image: "bistro" },
        { icon: "people", title: "Feiern & Events", text: "Geburtstage, Firmenfeiern und private Abende bis 60 Gäste.", image: "dining" },
        { icon: "cafe", title: "Catering", text: "Antipasti, Pasta und Dolci für Ihre Veranstaltung.", image: "food" },
        { icon: "nutrition", title: "Vegetarisch & vegan", text: "Viele Gerichte auch vegetarisch oder vegan zubereitet.", image: "plate" },
      ],
    },
    features: {
      eyebrow: "Unsere Küche", title: "Was uns besonders macht", lead: "Einfache Rezepte, beste Zutaten und viel Zeit.",
      items: [
        { icon: "leaf", title: "Frisch", text: "Pasta und Saucen jeden Tag von Hand." },
        { icon: "pin", title: "Regional", text: "Gemüse und Fleisch von Höfen aus der Region." },
        { icon: "wine", title: "Weine", text: "Sorgfältig ausgewählt, auch glasweise." },
        { icon: "heart", title: "Familiär", text: "Seit 2009 ein Familienbetrieb." },
      ],
    },
    steps: {
      eyebrow: "Reservierung", title: "So reservieren Sie", lead: "In einer Minute zu Ihrem Tisch.",
      items: [
        { title: "Datum wählen", text: "Tag, Uhrzeit und Anzahl der Gäste angeben." },
        { title: "Bestätigung erhalten", text: "Wir bestätigen Ihre Reservierung umgehend." },
        { title: "Genießen", text: "Wir freuen uns auf Ihren Besuch." },
      ],
    },
    stats: { eyebrow: "Trattoria Luce", title: "Seit 2009 in {city}", items: [{ value: "2009", label: "gegründet" }, { value: "60+", label: "Weine" }, { value: "120", label: "Plätze" }, { value: "4,7 / 5", label: "Bewertung" }] },
    pricing: {
      eyebrow: "Speisekarte", title: "Aus unserer Karte", lead: "Eine Auswahl – die vollständige Karte wechselt mit der Saison.", note: "Alle Preise inkl. MwSt. Allergene auf Anfrage.",
      plans: [
        { name: "Pranzo", price: "14,90 €", unit: "Mittagsmenü", description: "Di–Fr 12–15 Uhr", features: ["Tagesantipasto", "Pasta oder Pizza", "Espresso"], cta: { label: "Tisch reservieren", href: "#kontakt" } },
        { name: "Menu Luce", price: "49 €", unit: "pro Person", description: "Vier Gänge nach Wahl der Küche", features: ["Antipasto misto", "Hausgemachte Pasta", "Hauptgang und Dolce"], featured: true, cta: { label: "Tisch reservieren", href: "#kontakt" } },
        { name: "Festa", price: "ab 39 €", unit: "pro Person", description: "Für Gruppen ab 12 Personen", features: ["Buffet oder Menü", "Weinbegleitung optional", "Eigener Bereich"], cta: { label: "Anfragen", href: "#kontakt" } },
      ],
      list: [
        { name: "Vitello tonnato", detail: "Kalbfleisch, Thunfischcreme, Kapern", price: "14,50 €" },
        { name: "Tagliatelle al ragù", detail: "Hausgemachte Pasta, Ragù vom Rind", price: "16,90 €" },
        { name: "Pizza Margherita", detail: "San-Marzano-Tomaten, Fior di Latte", price: "11,50 €" },
        { name: "Risotto ai funghi", detail: "Steinpilze, Parmigiano", price: "18,50 €" },
        { name: "Saltimbocca", detail: "Kalb, Salbei, Parmaschinken", price: "24,90 €" },
        { name: "Tiramisù", detail: "nach Rezept der Nonna", price: "7,50 €" },
      ],
    },
    testimonials: {
      eyebrow: "Gäste", title: "Was unsere Gäste sagen", rating: { score: "4,7", count: "860 Bewertungen", source: "Google" },
      items: [
        { quote: "Die beste Pasta der Stadt – und ein Service, bei dem man sich sofort willkommen fühlt.", name: "Julia B.", role: "Stammgast", photo: "portraitE" },
        { quote: "Unsere Firmenfeier war perfekt organisiert. Das Menü war ein Traum.", name: "Markus F.", role: "Firmenevent", photo: "portraitB" },
        { quote: "Pizza wie in Neapel, dazu ein toller Wein. Wir kommen wieder!", name: "Lena und Tom", role: "Gäste", photo: "portraitC" },
      ],
    },
    team: {
      eyebrow: "Team", title: "Die Familie Luce", lead: "Küche und Service mit Leidenschaft.",
      members: [{ name: "Marco Bellini", role: "Küchenchef", photo: "portraitD" }, { name: "Giulia Bellini", role: "Gastgeberin", photo: "portraitA" }, { name: "Luca Romano", role: "Pizzaiolo", photo: "portraitF" }, { name: "Sara Klein", role: "Sommelière", photo: "portraitE" }],
    },
    about: {
      eyebrow: "Über uns", title: "Ein Stück Italien in {city}",
      paragraphs: ["{name} ist ein Familienrestaurant: Marco kocht nach den Rezepten seiner Großmutter, Giulia sorgt dafür, dass sich jeder Gast wie zu Hause fühlt.", "Wir kaufen regional und saisonal ein und machen fast alles selbst – von der Pasta bis zum Tiramisù."],
      points: ["Pasta täglich frisch", "Regionale Zutaten", "Glutenfreie Pasta auf Anfrage"],
      image: "bistro", secondImage: "plate",
    },
    faq: {
      eyebrow: "Fragen & Antworten", title: "Gut zu wissen", lead: "Weitere Fragen beantworten wir gern telefonisch.",
      items: [
        { q: "Kann ich online reservieren?", a: "Ja, über das Formular oder telefonisch. Für Gruppen ab 12 Personen melden Sie sich bitte direkt bei uns." },
        { q: "Gibt es vegetarische und vegane Gerichte?", a: "Ja, viele Gerichte sind vegetarisch, einige auch vegan. Fragen Sie gern unser Team." },
        { q: "Können wir bei Ihnen feiern?", a: "Gern – für bis zu 60 Gäste mit Menü oder Buffet." },
        { q: "Bieten Sie Speisen zum Mitnehmen an?", a: "Ja, Pizza und Pasta zum Mitnehmen während der Öffnungszeiten." },
        { q: "Sind Hunde erlaubt?", a: "Gut erzogene Hunde sind auf der Terrasse herzlich willkommen." },
        { q: "Gibt es Gutscheine?", a: "Ja, Gutscheine erhalten Sie im Restaurant in jedem Wert." },
      ],
    },
    cta: { eyebrow: "Reservierung", title: "Buon appetito!", lead: "Reservieren Sie Ihren Tisch – wir freuen uns auf Sie.", primary: { label: "Tisch reservieren", href: "#kontakt" }, secondary: { label: "Anrufen", href: "tel:" } },
    gallery: { eyebrow: "Eindrücke", title: "Aus unserer Trattoria", images: ["dining", "plate", "bistro", "food", "handshake", "office"] },
    portfolio: { eyebrow: "Events", title: "Feiern bei uns", lead: "Von der Hochzeit bis zur Weihnachtsfeier.", items: [{ title: "Hochzeitsdinner", category: "Private Feier", image: "dining" }, { title: "Weinabend", category: "Event", image: "bistro" }, { title: "Firmen-Lunch", category: "Business", image: "food" }, { title: "Kochkurs", category: "Workshop", image: "plate" }] },
    blog: {
      eyebrow: "Neuigkeiten", title: "Aus der Küche", lead: "Saisonale Gerichte, Weine und Termine.",
      posts: [
        { title: "Trüffelwochen im November", excerpt: "Frische Trüffel aus dem Piemont – nur für kurze Zeit.", category: "Saison", date: "November 2026", image: "plate" },
        { title: "Weinabend mit dem Weingut Rossi", excerpt: "Fünf Weine, fünf Gänge und viele Geschichten.", category: "Event", date: "Oktober 2026", image: "bistro" },
        { title: "Neue Mittagskarte", excerpt: "Leichte Gerichte für die Mittagspause.", category: "Karte", date: "September 2026", image: "food" },
      ],
    },
    logos: { title: "Unsere Lieferanten", names: ["Hof Kaiser", "Caseificio Rossi", "Weingut Valle", "Bäckerei Stein", "Olio Sano"] },
    timeline: { eyebrow: "Geschichte", title: "Unsere Geschichte", items: [{ year: "2009", title: "Eröffnung", text: "Marco und Giulia eröffnen die Trattoria." }, { year: "2014", title: "Steinofen", text: "Ein eigener Holzofen für echte neapolitanische Pizza." }, { year: "2019", title: "Terrasse", text: "Neue Terrasse mit Blick auf den Rhein." }, { year: "2025", title: "Weinbar", text: "Über 60 Weine aus kleinen Weingütern." }] },
  },

  agentur: {
    brand: { name: "Studio Kante", city: "Berlin", phone: "030 123 456 70", address: "Torstraße 140, 10119 Berlin", tagline: "Websites und Marken, die wirken.", hours: ["Mo–Fr 9:00–18:00 Uhr"] },
    navCta: { label: "Projekt anfragen", href: "#kontakt" },
    hero: {
      eyebrow: "Agentur für Web & Marke", title: "Websites, die Kundinnen und Kunden gewinnen.",
      lead: "Wir gestalten und entwickeln schnelle, barrierearme Websites mit WordPress und Bricks – von der Strategie bis zum Launch.",
      primary: { label: "Projekt anfragen", href: "#kontakt" }, secondary: { label: "Arbeiten ansehen", href: "#referenzen" },
      points: ["Launch in 6 bis 10 Wochen", "Pflegeleicht in Bricks Builder", "Messbare Ergebnisse statt Bauchgefühl"],
      image: "team", panelTitle: "Aktuell verfügbar", panelLines: ["Projektstart ab November", "Kostenloses Erstgespräch", "Antwort innerhalb von 24 Stunden"],
    },
    services: {
      eyebrow: "Leistungen", title: "Alles, was eine starke Website braucht", lead: "Ein Team für Strategie, Design, Entwicklung und Wachstum.",
      items: [
        { icon: "color-palette", title: "Webdesign", text: "Klare Gestaltung, die Ihre Marke stärkt und Besucher führt.", image: "workshop" },
        { icon: "code", title: "WordPress & Bricks", text: "Schnelle, pflegeleichte Websites auf einem sauberen Design-System.", image: "office" },
        { icon: "search", title: "SEO", text: "Technisch sauber und inhaltlich stark – für mehr Sichtbarkeit.", image: "meeting" },
        { icon: "brush", title: "Branding", text: "Logo, Farben und Typografie, die zusammenpassen.", image: "team" },
        { icon: "trending-up", title: "Performance Marketing", text: "Kampagnen mit messbarem Ergebnis statt Streuverlust.", image: "handshake" },
        { icon: "lock", title: "Wartung & Hosting", text: "Updates, Backups und Monitoring – damit Ihre Website läuft.", image: "workshop" },
      ],
    },
    features: {
      eyebrow: "Arbeitsweise", title: "Warum Kundinnen und Kunden bleiben", lead: "Wir arbeiten transparent, schnell und auf Augenhöhe.",
      items: [
        { icon: "rocket", title: "Schnell live", text: "Klare Sprints und Launch in wenigen Wochen." },
        { icon: "analytics", title: "Messbar", text: "Ziele, Tracking und Reporting ab Tag eins." },
        { icon: "people", title: "Ein Team", text: "Design und Entwicklung eng verzahnt." },
        { icon: "shield", title: "Zukunftssicher", text: "Barrierearm, DSGVO-konform und pflegeleicht." },
      ],
    },
    steps: {
      eyebrow: "Prozess", title: "Vom Erstgespräch zum Launch", lead: "Ein klarer Ablauf ohne Überraschungen.",
      items: [
        { title: "Kennenlernen", text: "Wir verstehen Ziele, Zielgruppe und Wettbewerb." },
        { title: "Konzept & Design", text: "Struktur, Inhalte und Gestaltung – abgestimmt in zwei Runden." },
        { title: "Entwicklung", text: "Umsetzung in Bricks auf einem sauberen Design-System." },
        { title: "Launch & Wachstum", text: "Go-live, Schulung und laufende Optimierung." },
      ],
    },
    stats: { eyebrow: "Ergebnisse", title: "Was unsere Arbeit bewirkt", items: [{ value: "140+", label: "Websites live" }, { value: "+62 %", label: "mehr Anfragen im Schnitt" }, { value: "98", label: "Ø PageSpeed-Score" }, { value: "12", label: "Jahre Erfahrung" }] },
    pricing: {
      eyebrow: "Pakete", title: "Klare Pakete, klare Preise", lead: "Festpreise für Websites – oder individuelle Angebote für größere Projekte.", note: "Alle Preise zzgl. MwSt.",
      plans: [
        { name: "Start", price: "4.900 €", unit: "einmalig", description: "Onepager für den professionellen Auftritt", features: ["Bis zu 6 Abschnitte", "Responsives Design", "Basis-SEO"], cta: { label: "Anfragen", href: "#kontakt" } },
        { name: "Business", price: "9.800 €", unit: "einmalig", description: "Website mit bis zu 12 Seiten", features: ["Individuelles Design-System", "Blog und Formulare", "SEO und Tracking"], featured: true, cta: { label: "Anfragen", href: "#kontakt" } },
        { name: "Care", price: "149 €", unit: "pro Monat", description: "Wartung und Weiterentwicklung", features: ["Updates und Backups", "Monitoring", "2 Stunden Änderungen"], cta: { label: "Anfragen", href: "#kontakt" } },
      ],
      list: [
        { name: "Workshop Strategie", detail: "halber Tag", price: "890 €" },
        { name: "Landingpage", detail: "Design und Umsetzung", price: "ab 2.400 €" },
        { name: "Logo & Basis-Branding", detail: "inkl. Styleguide", price: "ab 2.900 €" },
        { name: "SEO-Audit", detail: "technisch und inhaltlich", price: "690 €" },
        { name: "Bricks-Schulung", detail: "3 Stunden, remote", price: "390 €" },
        { name: "Wartung", detail: "pro Monat", price: "ab 149 €" },
      ],
    },
    testimonials: {
      eyebrow: "Kundenstimmen", title: "Was Kundinnen und Kunden sagen", rating: { score: "5,0", count: "48 Bewertungen", source: "Google" },
      items: [
        { quote: "Studio Kante hat unsere Website in acht Wochen neu aufgestellt. Seitdem kommen doppelt so viele Anfragen.", name: "Nina Hoffmann", role: "Geschäftsführerin, Hoffmann Immobilien", photo: "portraitA" },
        { quote: "Endlich eine Website, die wir selbst pflegen können. Das Design-System in Bricks ist Gold wert.", name: "Felix Braun", role: "Marketing, Braun Logistik", photo: "portraitB" },
        { quote: "Strategisch stark, schnell in der Umsetzung und immer ansprechbar.", name: "Sarah Lindner", role: "Gründerin, Lindner Coaching", photo: "portraitE" },
      ],
    },
    team: {
      eyebrow: "Team", title: "Die Köpfe hinter Studio Kante", lead: "Klein genug für persönliche Betreuung, groß genug für starke Projekte.",
      members: [{ name: "Jakob Kante", role: "Gründer, Strategie", photo: "portraitD" }, { name: "Mira Schulz", role: "Art Direction", photo: "portraitC" }, { name: "Can Yilmaz", role: "Entwicklung", photo: "portraitF" }, { name: "Lea Vogt", role: "SEO & Content", photo: "portraitE" }],
    },
    about: {
      eyebrow: "Über uns", title: "Design mit Haltung, Technik mit Sorgfalt",
      paragraphs: ["{name} ist eine inhabergeführte Agentur aus {city}. Wir verbinden Strategie, Gestaltung und Entwicklung zu Websites, die messbar mehr erreichen.", "Unsere Projekte bauen wir in WordPress mit Bricks – auf einem Design-System, das unsere Kundinnen und Kunden selbst pflegen können."],
      points: ["Über 140 umgesetzte Websites", "Bricks-Spezialisten seit 2021", "Barrierearme Umsetzung nach WCAG"],
      image: "team", secondImage: "meeting",
    },
    faq: {
      eyebrow: "Fragen & Antworten", title: "Häufige Fragen", lead: "Noch Fragen? Buchen Sie ein kostenloses Erstgespräch.",
      items: [
        { q: "Wie lange dauert ein Website-Projekt?", a: "Onepager sind meist in vier bis sechs Wochen live, größere Websites in acht bis zwölf Wochen." },
        { q: "Kann ich die Website selbst pflegen?", a: "Ja. Wir bauen auf Bricks mit einem klaren Design-System und schulen Ihr Team." },
        { q: "Übernehmen Sie auch Texte und Fotos?", a: "Ja, mit unserem Netzwerk aus Texterinnen, Textern und Fotografen." },
        { q: "Was kostet eine Website?", a: "Unsere Pakete starten bei 4.900 €. Für größere Projekte erstellen wir ein individuelles Angebot." },
        { q: "Kümmern Sie sich um Hosting und Wartung?", a: "Ja, mit unserem Care-Paket inklusive Updates, Backups und Monitoring." },
        { q: "Arbeiten Sie nur in {city}?", a: "Nein, wir arbeiten remote mit Kundinnen und Kunden im gesamten deutschsprachigen Raum." },
      ],
    },
    cta: { eyebrow: "Erstgespräch", title: "Bereit für eine Website, die wirkt?", lead: "Erzählen Sie uns von Ihrem Projekt – wir melden uns innerhalb von 24 Stunden.", primary: { label: "Projekt anfragen", href: "#kontakt" }, secondary: { label: "Anrufen", href: "tel:" } },
    gallery: { eyebrow: "Studio", title: "Einblicke ins Studio", images: ["team", "office", "workshop", "meeting", "handshake", "interior"] },
    portfolio: { eyebrow: "Referenzen", title: "Ausgewählte Arbeiten", lead: "Ein Auszug aus Projekten der letzten Monate.", items: [{ title: "Hoffmann Immobilien", category: "Website & Branding", image: "office" }, { title: "Braun Logistik", category: "Relaunch", image: "meeting" }, { title: "Lindner Coaching", category: "Onepager", image: "workshop" }, { title: "Café Nord", category: "Branding", image: "handshake" }] },
    blog: {
      eyebrow: "Journal", title: "Wissen aus unseren Projekten", lead: "Über Design, Bricks und digitales Wachstum.",
      posts: [
        { title: "Design-Systeme in Bricks aufbauen", excerpt: "Variablen, Klassen und Komponenten sinnvoll kombinieren.", category: "Bricks", date: "März 2026", image: "workshop" },
        { title: "Barrierefreiheit ab 2025: Was gilt?", excerpt: "Das Barrierefreiheitsstärkungsgesetz kurz erklärt.", category: "Recht", date: "Februar 2026", image: "office" },
        { title: "Fünf Hebel für mehr Anfragen", excerpt: "Kleine Änderungen mit großer Wirkung auf Ihre Conversion.", category: "Marketing", date: "Januar 2026", image: "meeting" },
      ],
    },
    logos: { title: "Kundinnen und Kunden, die uns vertrauen", names: ["Hoffmann Immobilien", "Braun Logistik", "Lindner Coaching", "Café Nord", "Stadtwerke Süd"] },
    timeline: { eyebrow: "Geschichte", title: "Unser Weg", items: [{ year: "2014", title: "Gründung", text: "Start als Freelance-Duo in {city}." }, { year: "2018", title: "Studio", text: "Eigenes Studio und erstes Festanstellungs-Team." }, { year: "2021", title: "Bricks", text: "Umstieg auf Bricks und Design-Systeme." }, { year: "2026", title: "140 Websites", text: "Über 140 Projekte erfolgreich live." }] },
  },

  business: {
    brand: { name: "Nordlicht Beratung", city: "Hamburg", phone: "040 123 456 78", address: "Große Elbstraße 45, 22767 Hamburg", tagline: "Klarheit für Ihr Unternehmen.", hours: ["Mo–Fr 9:00–18:00 Uhr"] },
    navCta: { label: "Kontakt aufnehmen", href: "#kontakt" },
    hero: {
      eyebrow: "Unternehmensberatung in {city}", title: "Mehr Klarheit. Bessere Entscheidungen.",
      lead: "Wir unterstützen mittelständische Unternehmen bei Strategie, Organisation und Digitalisierung – pragmatisch und messbar.",
      primary: { label: "Erstgespräch vereinbaren", href: "#kontakt" }, secondary: { label: "Leistungen ansehen", href: "#leistungen" },
      points: ["Über 200 begleitete Projekte", "Umsetzung statt Foliensätze", "Fester Ansprechpartner"],
      image: "meeting", panelTitle: "Kostenloses Erstgespräch", panelLines: ["30 Minuten, per Video oder vor Ort", "Unverbindlich", "Termine innerhalb einer Woche"],
    },
    services: {
      eyebrow: "Leistungen", title: "Wie wir Sie unterstützen", lead: "Von der Analyse bis zur Umsetzung im Alltag.",
      items: [
        { icon: "bulb", title: "Strategie", text: "Klare Ziele und ein Plan, den Ihr Team versteht.", image: "meeting" },
        { icon: "people", title: "Organisation", text: "Strukturen und Abläufe, die mit Ihnen wachsen.", image: "team" },
        { icon: "analytics", title: "Digitalisierung", text: "Prozesse digitalisieren – mit Werkzeugen, die wirklich genutzt werden.", image: "workshop" },
        { icon: "trending-up", title: "Wachstum", text: "Neue Märkte, neue Produkte, bessere Vertriebsprozesse.", image: "handshake" },
        { icon: "school", title: "Führung", text: "Workshops und Coaching für Führungskräfte.", image: "office" },
        { icon: "shield", title: "Finanzierung", text: "Fördermittel, Banken und Investoren gut vorbereitet.", image: "paperwork" },
      ],
    },
    features: {
      eyebrow: "Unser Ansatz", title: "Beratung, die ankommt", lead: "Wir arbeiten mit Ihrem Team, nicht an ihm vorbei.",
      items: [
        { icon: "checkmark-circle", title: "Pragmatisch", text: "Lösungen, die im Alltag funktionieren." },
        { icon: "analytics", title: "Messbar", text: "Klare Kennzahlen für jeden Schritt." },
        { icon: "people", title: "Partnerschaftlich", text: "Wir arbeiten eng mit Ihrem Team." },
        { icon: "time", title: "Schnell", text: "Erste Ergebnisse nach wenigen Wochen." },
      ],
    },
    steps: {
      eyebrow: "Vorgehen", title: "So arbeiten wir", lead: "Strukturiert, transparent und nah an Ihrem Alltag.",
      items: [
        { title: "Analyse", text: "Wir verstehen Ihre Ausgangslage und Ziele." },
        { title: "Plan", text: "Gemeinsam entwickeln wir einen umsetzbaren Fahrplan." },
        { title: "Umsetzung", text: "Wir begleiten die Umsetzung bis zum Ergebnis." },
      ],
    },
    stats: { eyebrow: "Ergebnisse", title: "Wirkung, die man messen kann", items: [{ value: "200+", label: "Projekte" }, { value: "15", label: "Jahre Erfahrung" }, { value: "92 %", label: "Weiterempfehlung" }, { value: "40", label: "Branchen" }] },
    pricing: {
      eyebrow: "Formate", title: "Wie wir zusammenarbeiten", lead: "Vom Workshop bis zur langfristigen Begleitung.", note: "Alle Preise zzgl. MwSt.",
      plans: [
        { name: "Workshop", price: "1.900 €", unit: "pro Tag", description: "Kompakter Start in ein Thema", features: ["Vorbereitung und Moderation", "Ergebnisprotokoll", "Maßnahmenplan"], cta: { label: "Anfragen", href: "#kontakt" } },
        { name: "Projekt", price: "ab 12.000 €", unit: "Festpreis", description: "Klar umrissenes Vorhaben", features: ["Analyse und Konzept", "Begleitung der Umsetzung", "Wöchentliche Abstimmung"], featured: true, cta: { label: "Anfragen", href: "#kontakt" } },
        { name: "Sparring", price: "990 €", unit: "pro Monat", description: "Regelmäßiger Austausch", features: ["Zwei Termine im Monat", "Erreichbarkeit per Telefon", "Kündbar monatlich"], cta: { label: "Anfragen", href: "#kontakt" } },
      ],
      list: [
        { name: "Erstgespräch", detail: "30 Minuten", price: "kostenlos" },
        { name: "Strategie-Workshop", detail: "ein Tag", price: "1.900 €" },
        { name: "Führungskräfte-Coaching", detail: "pro Sitzung", price: "290 €" },
        { name: "Prozessanalyse", detail: "je Bereich", price: "ab 3.500 €" },
        { name: "Förderberatung", detail: "Antrag inklusive", price: "ab 1.200 €" },
        { name: "Interims-Management", detail: "pro Tag", price: "auf Anfrage" },
      ],
    },
    testimonials: {
      eyebrow: "Referenzen", title: "Was Kundinnen und Kunden sagen", rating: { score: "4,9", count: "64 Bewertungen", source: "ProvenExpert" },
      items: [
        { quote: "Nach sechs Monaten haben wir klare Prozesse und ein Team, das an einem Strang zieht.", name: "Ralf Petersen", role: "Geschäftsführer, Petersen Metallbau", photo: "portraitD" },
        { quote: "Endlich eine Beratung, die mit anpackt. Die Ergebnisse sprechen für sich.", name: "Julia Krämer", role: "COO, Krämer & Söhne", photo: "portraitA" },
        { quote: "Pragmatisch, ehrlich und immer lösungsorientiert.", name: "Oliver Stein", role: "Inhaber, Stein Logistik", photo: "portraitB" },
      ],
    },
    team: {
      eyebrow: "Team", title: "Ihre Beraterinnen und Berater", lead: "Erfahrung aus Mittelstand, Konzern und Gründung.",
      members: [{ name: "Dr. Henrik Voss", role: "Geschäftsführer", photo: "portraitD" }, { name: "Laura Becker", role: "Strategie", photo: "portraitA" }, { name: "Tobias Engel", role: "Digitalisierung", photo: "portraitF" }, { name: "Nadia Haddad", role: "Organisation", photo: "portraitE" }],
    },
    about: {
      eyebrow: "Über uns", title: "Beratung aus {city} für den Mittelstand",
      paragraphs: ["{name} begleitet seit 15 Jahren mittelständische Unternehmen. Wir kommen aus der Praxis und wissen, dass gute Ideen erst im Alltag zählen.", "Deshalb arbeiten wir eng mit Ihrem Team, messen Fortschritte und bleiben, bis die Ergebnisse stehen."],
      points: ["Über 200 erfolgreiche Projekte", "Zertifizierte Förderberatung", "Netzwerk aus Spezialistinnen und Spezialisten"],
      image: "meeting", secondImage: "team",
    },
    faq: {
      eyebrow: "Fragen & Antworten", title: "Häufige Fragen", lead: "Weitere Fragen klären wir gern im Erstgespräch.",
      items: [
        { q: "Für welche Unternehmen arbeiten Sie?", a: "Vor allem für mittelständische Unternehmen mit 20 bis 500 Mitarbeitenden." },
        { q: "Wie läuft das Erstgespräch ab?", a: "30 Minuten per Video oder vor Ort – kostenlos und unverbindlich." },
        { q: "Wie lange dauert ein Projekt?", a: "Je nach Umfang zwischen sechs Wochen und einem Jahr." },
        { q: "Gibt es Fördermittel für Beratung?", a: "Ja, viele Beratungsleistungen sind förderfähig. Wir prüfen das für Sie." },
        { q: "Arbeiten Sie auch remote?", a: "Ja, wir kombinieren Termine vor Ort mit Remote-Arbeit." },
        { q: "Wie rechnen Sie ab?", a: "Nach Tagessätzen oder als Festpreis – transparent vorab vereinbart." },
      ],
    },
    cta: { eyebrow: "Erstgespräch", title: "Lassen Sie uns sprechen", lead: "30 Minuten, kostenlos und unverbindlich – wir finden gemeinsam den nächsten Schritt.", primary: { label: "Termin vereinbaren", href: "#kontakt" }, secondary: { label: "Anrufen", href: "tel:" } },
    gallery: { eyebrow: "Einblicke", title: "Aus unserem Alltag", images: ["meeting", "team", "office", "workshop", "handshake", "paperwork"] },
    portfolio: { eyebrow: "Projekte", title: "Ausgewählte Projekte", lead: "Ein Auszug aus unserer Arbeit.", items: [{ title: "Neuausrichtung Vertrieb", category: "Strategie", image: "meeting" }, { title: "Digitale Auftragsabwicklung", category: "Digitalisierung", image: "workshop" }, { title: "Neue Führungsstruktur", category: "Organisation", image: "team" }, { title: "Förderung Innovationsprojekt", category: "Finanzierung", image: "paperwork" }] },
    blog: {
      eyebrow: "Insights", title: "Impulse für Ihr Unternehmen", lead: "Praxiswissen aus unseren Projekten.",
      posts: [
        { title: "Strategie in 90 Tagen", excerpt: "Wie Sie mit einem klaren Rhythmus Ergebnisse erzielen.", category: "Strategie", date: "März 2026", image: "meeting" },
        { title: "Digitalisierung ohne Frust", excerpt: "Warum Werkzeuge allein keine Prozesse verbessern.", category: "Digitalisierung", date: "Februar 2026", image: "workshop" },
        { title: "Fördermittel 2026", excerpt: "Die wichtigsten Programme für den Mittelstand.", category: "Finanzierung", date: "Januar 2026", image: "paperwork" },
      ],
    },
    logos: { title: "Unternehmen, die uns vertrauen", names: ["Petersen Metallbau", "Krämer & Söhne", "Stein Logistik", "Hanse Textil", "Elbe Foods"] },
    timeline: { eyebrow: "Geschichte", title: "Unser Weg", items: [{ year: "2011", title: "Gründung", text: "Start in {city} mit drei Beratern." }, { year: "2016", title: "Digitalisierung", text: "Eigener Bereich für digitale Prozesse." }, { year: "2021", title: "Förderberatung", text: "Zertifizierung als Förderberater." }, { year: "2026", title: "200 Projekte", text: "Über 200 erfolgreiche Projekte." }] },
  },
};
