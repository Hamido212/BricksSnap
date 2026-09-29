/**
 * Sample photos (Unsplash license) checked for availability and subject. They are placeholders:
 * import them into the media library before saving (some host firewalls block external URLs),
 * or replace them with the business's own pictures.
 */
const photo = (id: string, width = 1600) => `https://images.unsplash.com/${id}?w=${width}&q=80&auto=format&fit=crop`;

export type Photo = { url: string; alt: { de: string; en: string } };
const p = (id: string, de: string, en: string, width?: number): Photo => ({ url: photo(id, width), alt: { de, en } });

export const PHOTOS = {
  carFront: p("photo-1494976388531-d1058494cdd8", "Sportwagen in der Frontansicht", "Sports car seen from the front"),
  carSide: p("photo-1580273916550-e323be2ae537", "Silberne Limousine auf einer Landstraße", "Silver saloon on a country road"),
  carRoad: p("photo-1503376780353-7e6692767b70", "Schwarzer Sportwagen auf der Straße", "Black sports car on the road"),
  carWash: p("photo-1607860108855-64acf2078ed9", "Auto wird von Hand gewaschen", "Car being washed by hand"),
  signing: p("photo-1450101499163-c8848c66ca85", "Hand unterschreibt ein Formular", "Hand signing a form"),
  paperwork: p("photo-1554224155-6726b3ff858f", "Unterlagen und Taschenrechner auf dem Tisch", "Paperwork and calculator on a desk"),
  electrician: p("photo-1621905251189-08b45d6a269e", "Elektriker mit Helm bei der Arbeit", "Electrician in a hard hat at work"),
  drill: p("photo-1504148455328-c376907d081c", "Akkuschrauber auf einer Baustelle", "Cordless drill on a building site"),
  plumber: p("photo-1558618666-fcd25c85cd64", "Handwerker bei der Arbeit an Rohren", "Tradesman working on pipes"),
  site: p("photo-1504307651254-35680f356dfd", "Baustelle von oben", "Building site from above"),
  interior: p("photo-1586023492125-27b2c045efd7", "Renovierter Wohnraum mit gelbem Sessel", "Renovated living room with a yellow armchair"),
  reception: p("photo-1519494026892-80bbd2d6fd0d", "Heller Empfangsbereich einer Praxis", "Bright practice reception area"),
  doctor: p("photo-1576091160399-112ba8d25d1d", "Ärztin im Kittel mit Stethoskop", "Doctor in a white coat with a stethoscope"),
  treatment: p("photo-1629909613654-28e377c37b09", "Moderner Behandlungsraum", "Modern treatment room"),
  dining: p("photo-1517248135467-4c7edcad34c4", "Restaurant mit gedeckten Tischen", "Restaurant with laid tables"),
  plate: p("photo-1414235077428-338989a2e8c0", "Angerichteter Teller im Restaurant", "Plated dish in a restaurant"),
  bistro: p("photo-1555396273-367ea4eb4db5", "Lichtdurchflutetes Restaurant", "Light-filled restaurant"),
  food: p("photo-1504674900247-0877df9cc836", "Frische Gerichte von oben", "Fresh dishes from above"),
  team: p("photo-1522071820081-009f0129c71c", "Team arbeitet gemeinsam an Laptops", "Team working together on laptops"),
  office: p("photo-1497366216548-37526070297c", "Helles, modernes Büro", "Bright modern office"),
  workshop: p("photo-1553877522-43269d4ea984", "Konzentriertes Arbeiten am Laptop", "Focused work on a laptop"),
  meeting: p("photo-1542744173-8e7e53415bb0", "Besprechung im Konferenzraum", "Meeting in a conference room"),
  handshake: p("photo-1600880292203-757bb62b4baf", "Zwei Kollegen feiern einen Erfolg", "Two colleagues celebrating a win"),
  portraitA: p("photo-1573497019940-1c28c88b4f3e", "Porträt einer lächelnden Frau", "Portrait of a smiling woman", 600),
  portraitB: p("photo-1500648767791-00dcc994a43e", "Porträt eines Mannes", "Portrait of a man", 600),
  portraitC: p("photo-1494790108377-be9c29b29330", "Porträt einer Frau mit rotem Pullover", "Portrait of a woman in a red jumper", 600),
  portraitD: p("photo-1472099645785-5658abf4ff4e", "Porträt eines Mannes mit Brille", "Portrait of a man with glasses", 600),
  portraitE: p("photo-1438761681033-6461ffad8d80", "Porträt einer jungen Frau", "Portrait of a young woman", 600),
  portraitF: p("photo-1507003211169-0a1dd7228f2d", "Porträt eines lächelnden Mannes", "Portrait of a smiling man", 600),
} satisfies Record<string, Photo>;

export type PhotoKey = keyof typeof PHOTOS;
export const PORTRAITS: PhotoKey[] = ["portraitA", "portraitB", "portraitC", "portraitD", "portraitE", "portraitF"];
