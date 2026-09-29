import type { IndustryCopy, BaseCopy } from "./model";
import type { IndustryId } from "./types";

/** English copy. `{name}` and `{city}` are replaced with the profile's values. */
export const baseEn: BaseCopy = {
  anchors: { services: "services", pricing: "pricing", about: "about", contact: "contact", faq: "faq", team: "team", portfolio: "work" },
  nav: [{ label: "Services", href: "#services" }, { label: "Pricing", href: "#pricing" }, { label: "About", href: "#about" }, { label: "Contact", href: "#contact" }],
  contact: {
    eyebrow: "Contact", title: "We look forward to hearing from you", lead: "Call or write to us – we usually reply on the same working day.", formTitle: "Send a request",
    labels: { name: "Name", email: "Email", phone: "Phone", message: "Your message", submit: "Send message", privacy: "I agree to the processing of my data as described in the privacy policy." },
    hoursTitle: "Opening hours", addressTitle: "Address",
  },
  footerColumns: [
    { title: "Company", links: [{ label: "About", href: "#about" }, { label: "Team", href: "#team" }, { label: "Careers", href: "#" }] },
    { title: "Service", links: [{ label: "Services", href: "#services" }, { label: "Pricing", href: "#pricing" }, { label: "FAQ", href: "#faq" }] },
  ],
  legal: [{ label: "Legal notice", href: "/legal" }, { label: "Privacy", href: "/privacy" }],
  notFound: { title: "This page doesn’t exist (anymore)", text: "The address may have changed. You’ll find everything important on the homepage.", cta: { label: "Back to the homepage", href: "/" } },
  comingSoon: { eyebrow: "Coming soon", title: "The new {name} website is on its way", text: "We’re still here for you – by phone and in person.", cta: { label: "Call us", href: "tel:" } },
  login: { title: "Welcome back", text: "Sign in with your account details.", email: "Email or username", password: "Password", submit: "Sign in", forgot: "Forgot your password?" },
  ui: { readMore: "Read more", perMonth: "per month", mostPopular: "Popular", openingHours: "Opening hours", callUs: "Call", writeUs: "Write", visitUs: "Visit", allRightsReserved: "All rights reserved." },
};

export const industriesEn: Record<IndustryId, IndustryCopy> = {
  kfz: {
    brand: { name: "Northside Registrations", city: "Bremen", phone: "+49 421 123 456 78", address: "Hafenstraße 12, 28217 Bremen", tagline: "Vehicle registration, transfers and deregistration – fast and at a fixed price.", hours: ["Mon–Fri 8 am–6 pm", "Sat 9 am–1 pm"] },
    navCta: { label: "Start an order", href: "#contact" },
    hero: {
      eyebrow: "Vehicle registration in {city}", title: "Register, transfer, deregister – no queues.",
      lead: "We handle the trip to the registration office for you: new registrations, transfers, deregistration and personalised plates, usually on the same day.",
      primary: { label: "Start an order", href: "#contact" }, secondary: { label: "See prices", href: "#pricing" },
      points: ["Often done on the same working day", "Fixed prices, no hidden costs", "Plates made on site"],
      image: "carSide", panelTitle: "Open today", panelLines: ["Mon–Fri 8 am–6 pm", "Sat 9 am–1 pm", "No appointment needed"],
    },
    services: {
      eyebrow: "Services", title: "Everything around registration, in one place", lead: "You bring the documents, we do the rest – for private customers, companies and dealerships.",
      items: [
        { icon: "car", title: "New registration", text: "New, used or imported: your vehicle gets on the road quickly and correctly.", image: "carSide", price: "from €69" },
        { icon: "document", title: "Transfer", text: "Change of owner or address – we take care of every form and entry.", image: "signing", price: "from €59" },
        { icon: "clipboard", title: "Deregistration", text: "Take a vehicle off the road without visiting the office, even at short notice.", image: "paperwork", price: "from €29" },
        { icon: "key", title: "Personalised plates", text: "Reservation and embossing of your chosen plate in one go.", image: "carFront", price: "from €15" },
        { icon: "time", title: "Temporary plates", text: "For transfers and test drives – usually ready in minutes.", image: "carRoad", price: "from €49" },
        { icon: "briefcase", title: "Dealer service", text: "Batch orders for dealerships with a dedicated contact and pick-up.", image: "carWash" },
      ],
    },
    features: {
      eyebrow: "Why us", title: "Save time instead of taking a ticket", lead: "We know the registration office’s processes and handle them every day.",
      items: [
        { icon: "flash", title: "Fast", text: "Most orders are done on the same working day." },
        { icon: "cash", title: "Fixed price", text: "You know the price upfront; official fees listed transparently." },
        { icon: "pin", title: "Right in {city}", text: "Close to the registration office, with parking at the door." },
        { icon: "chatbubbles", title: "Personal", text: "One contact person instead of a call queue." },
      ],
    },
    steps: {
      eyebrow: "How it works", title: "Registered in three steps", lead: "No appointment, no ticket – just a few documents.",
      items: [
        { title: "Send your documents", text: "Send photos of the registration papers, insurance number and ID, or drop them off." },
        { title: "We handle everything", text: "Applications, fees and plates – we’ll let you know as soon as it’s done." },
        { title: "Pick up or get it delivered", text: "Collect papers and plates or have them brought to you." },
      ],
    },
    stats: { eyebrow: "In numbers", title: "Reliable since 2011", items: [{ value: "12,000+", label: "Registrations" }, { value: "4 hrs", label: "Average turnaround" }, { value: "4.9 / 5", label: "Google rating" }, { value: "40+", label: "Partner dealerships" }] },
    pricing: {
      eyebrow: "Pricing", title: "Fair fixed prices", lead: "Our service price is fixed upfront. Official fees and plates are charged transparently.", note: "All prices plus official fees. As of 2026.",
      plans: [
        { name: "Deregistration", price: "€29", unit: "plus fees", description: "Take a vehicle off the road", features: ["No appointment", "Confirmation for your insurer", "Same day"], cta: { label: "Deregister", href: "#contact" } },
        { name: "Transfer", price: "€59", unit: "plus fees", description: "Change of owner or address", features: ["All forms included", "Plates made on site", "Courier return available"], featured: true, cta: { label: "Transfer", href: "#contact" } },
        { name: "New registration", price: "€69", unit: "plus fees", description: "New, used or imported", features: ["Document check", "Personalised plates available", "Stickers included"], cta: { label: "Register", href: "#contact" } },
      ],
      list: [
        { name: "New registration", detail: "Car, motorcycle, trailer", price: "€69" },
        { name: "Transfer", detail: "Change of owner or address", price: "€59" },
        { name: "Deregistration", detail: "Taking off the road", price: "€29" },
        { name: "Personalised plate", detail: "Reservation", price: "€15" },
        { name: "Temporary plates", detail: "incl. insurance certificate", price: "€49" },
        { name: "Plate embossing", detail: "Pair, EU standard", price: "€25" },
      ],
    },
    testimonials: {
      eyebrow: "Reviews", title: "What our customers say", rating: { score: "4.9", count: "320 reviews", source: "Google" },
      items: [
        { quote: "Dropped off the papers in the morning, the car was registered by lunchtime. The easiest transfer I’ve ever had.", name: "Sandra K.", role: "Private customer", photo: "portraitA" },
        { quote: "Our dealership’s most reliable partner: dedicated contacts and no surprises on cost.", name: "Thomas Meyer", role: "Meyer Motors", photo: "portraitD" },
        { quote: "Plate reserved, car registered, all in one visit. Friendly and super fast.", name: "Tim R.", role: "New registration", photo: "portraitF" },
      ],
    },
    team: {
      eyebrow: "Team", title: "Your contacts", lead: "We know every application – and take time for your questions.",
      members: [{ name: "Jana Petersen", role: "Owner", photo: "portraitE" }, { name: "Mehmet Aydın", role: "Registration & advice", photo: "portraitB" }, { name: "Lukas Brandt", role: "Dealer service", photo: "portraitF" }, { name: "Sophie Wagner", role: "Customer service", photo: "portraitC" }],
    },
    about: {
      eyebrow: "About us", title: "Your registration service in {city} since 2011",
      paragraphs: ["{name} was founded to save drivers the trip to the registration office. Today we look after private customers, company fleets and more than 40 dealerships in the region.", "Our team knows every form and special rule, so most orders are completed on the same day – at the fixed price we agreed."],
      points: ["Officially licensed registration service", "In-house plate embossing", "Courier service across the city"],
      image: "signing", secondImage: "carFront",
    },
    faq: {
      eyebrow: "Questions & answers", title: "Frequently asked questions", lead: "Can’t find your question? Just give us a call.",
      items: [
        { q: "Which documents do I need to register a vehicle?", a: "Registration certificates part I and II, your insurance confirmation number, ID, a direct-debit mandate for vehicle tax and, for used cars, the inspection certificate." },
        { q: "How quickly is my vehicle registered?", a: "Most orders are done on the same working day. With complete documents by 11 am, usually by midday." },
        { q: "Do I need an appointment?", a: "No. Drop by during opening hours or send us photos of your documents in advance." },
        { q: "Can someone else do it for me?", a: "Yes. With a signed power of attorney and a copy of your ID we take care of everything – you don’t have to come in." },
        { q: "Do you work with dealerships?", a: "Yes, with batch orders, dedicated contacts and document pick-up at the dealership." },
        { q: "How can I pay?", a: "Cash, debit or credit card, and on invoice for business customers." },
      ],
    },
    cta: { eyebrow: "Get started", title: "No time for the registration office?", lead: "Send us your documents – we’ll reply within an hour with a fixed price.", primary: { label: "Start an order", href: "#contact" }, secondary: { label: "Call us", href: "tel:" } },
    gallery: { eyebrow: "Impressions", title: "At our office", images: ["carSide", "signing", "carFront", "paperwork", "carWash", "carRoad"] },
    portfolio: { eyebrow: "References", title: "Who we work for", lead: "From private cars to company fleets.", items: [{ title: "Fleet changeover", category: "Business customer", image: "carRoad" }, { title: "Import registration", category: "Private customer", image: "carFront" }, { title: "Dealer batch order", category: "Dealership", image: "carWash" }, { title: "Classic car registration", category: "Private customer", image: "carSide" }] },
    blog: {
      eyebrow: "Guides", title: "Registration made simple", lead: "What you really need to know, in brief.",
      posts: [
        { title: "The documents you need for registration", excerpt: "The complete checklist for new, used and imported vehicles.", category: "Checklist", date: "March 2026", image: "paperwork" },
        { title: "How to reserve a personalised plate", excerpt: "Which combinations are possible and how long a reservation lasts.", category: "Guide", date: "February 2026", image: "carFront" },
        { title: "Deregistering a car: what to watch out for", excerpt: "Insurance, tax and plates – the process step by step.", category: "Guide", date: "January 2026", image: "signing" },
      ],
    },
    logos: { title: "Partners and dealerships in the region", names: ["Meyer Motors", "Nordcar", "Weser Mobility", "HB Leasing", "City Fleet"] },
    timeline: { eyebrow: "History", title: "Our journey", items: [{ year: "2011", title: "Founded", text: "Started as a one-woman business next to the registration office." }, { year: "2016", title: "Dealer service", text: "Batch orders and pick-up for dealerships." }, { year: "2021", title: "Online orders", text: "Submit documents digitally, status updates by text." }, { year: "2026", title: "Second location", text: "More space and our own plate embossing." }] },
  },

  handwerk: {
    brand: { name: "Meyer Building Services", city: "Hanover", phone: "+49 511 987 654 30", address: "Werkstraße 7, 30159 Hanover", tagline: "Electrical, plumbing and heating from a master workshop.", hours: ["Mon–Fri 7 am–5 pm", "24/7 emergency service"] },
    navCta: { label: "Request a quote", href: "#contact" },
    hero: {
      eyebrow: "Master workshop in {city}", title: "Building services that simply work.",
      lead: "Electrical, plumbing and heating from one team – carefully planned, done on time and with a fixed-price quote.",
      primary: { label: "Request a quote", href: "#contact" }, secondary: { label: "See services", href: "#services" },
      points: ["Fixed-price quote within 48 hours", "Reliable dates with one contact", "24/7 emergency service for customers"],
      image: "electrician", panelTitle: "Emergency service", panelLines: ["Available around the clock", "On site in the city within 60 minutes", "Transparent call-out fee"],
    },
    services: {
      eyebrow: "Services", title: "One company for your whole house", lead: "From small repairs to complete renovations – with our own specialists, not subcontractors.",
      items: [
        { icon: "flash", title: "Electrical installation", text: "New builds, renovations and safety checks – to current standards.", image: "electrician", price: "from €65 / hr" },
        { icon: "construct", title: "Bathrooms & plumbing", text: "Accessible bathrooms and plumbing, planned by one team.", image: "plumber" },
        { icon: "sunny", title: "Heating & heat pumps", text: "Advice, grant applications and installation of modern heating.", image: "site" },
        { icon: "home", title: "Smart home", text: "Control lighting, heating and security from an app.", image: "interior" },
        { icon: "build", title: "Repairs & emergencies", text: "Fast help with power cuts, burst pipes or heating failures.", image: "drill" },
        { icon: "settings", title: "Maintenance", text: "Regular servicing for a long life and low running costs.", image: "plumber" },
      ],
    },
    features: {
      eyebrow: "Why Meyer", title: "Craftsmanship you can rely on", lead: "Three generations in {city} – with our own team and clear commitments.",
      items: [
        { icon: "ribbon", title: "Master workshop", text: "Registered with the chamber of crafts, trained specialists." },
        { icon: "calendar", title: "On time", text: "We arrive when we say – or the call-out is free." },
        { icon: "cash", title: "Fixed price", text: "Written quote before work starts, no surprises." },
        { icon: "leaf", title: "Tidy", text: "Dust protection, shoe covers and a clean handover." },
      ],
    },
    steps: {
      eyebrow: "Process", title: "From call to handover", lead: "Clearly planned, so your everyday life carries on.",
      items: [
        { title: "Site visit", text: "We look at everything on site and give honest advice." },
        { title: "Fixed-price quote", text: "You receive a binding quote within 48 hours." },
        { title: "Installation", text: "Our team works cleanly, punctually and within the agreed time." },
        { title: "Handover", text: "Instructions, documentation and warranty included." },
      ],
    },
    stats: { eyebrow: "In numbers", title: "In {city} since 1978", items: [{ value: "3,500+", label: "Jobs a year" }, { value: "24 / 7", label: "Emergency service" }, { value: "18", label: "Specialists" }, { value: "4.8 / 5", label: "Customer rating" }] },
    pricing: {
      eyebrow: "Pricing", title: "Transparent terms", lead: "Small jobs by time spent, larger projects at a written fixed price.", note: "All prices incl. VAT. Materials charged as used.",
      plans: [
        { name: "Repair", price: "€65", unit: "per hour", description: "Small jobs and fault finding", features: ["Call-out in the city included", "Billed in 15-minute steps", "Materials as used"], cta: { label: "Book a visit", href: "#contact" } },
        { name: "Maintenance plan", price: "€19", unit: "per month", description: "Heating or system serviced yearly", features: ["Annual service", "Priority emergency slots", "10% off spare parts"], featured: true, cta: { label: "Sign up", href: "#contact" } },
        { name: "Project", price: "Fixed price", unit: "by quote", description: "Bathroom, heating or rewiring", features: ["Free site visit", "Planning and grant advice", "One dedicated contact"], cta: { label: "Request a quote", href: "#contact" } },
      ],
      list: [
        { name: "Technician hour", detail: "Installation and repair", price: "€65" },
        { name: "Master hour", detail: "Planning and inspection", price: "€82" },
        { name: "Electrical safety check", detail: "Flat up to 100 m²", price: "€149" },
        { name: "Boiler service", detail: "Gas condensing boiler", price: "€169" },
        { name: "Emergency call-out", detail: "Nights and weekends", price: "€89" },
        { name: "Travel", detail: "Outside the city", price: "from €25" },
      ],
    },
    testimonials: {
      eyebrow: "Reviews", title: "What our customers say", rating: { score: "4.8", count: "210 reviews", source: "Google" },
      items: [
        { quote: "Our new bathroom was finished in ten days, exactly as promised. Tidy work and always reachable.", name: "The Schröder family", role: "Bathroom renovation", photo: "portraitC" },
        { quote: "Heating broke down on a Saturday evening – a technician was there an hour later. Brilliant!", name: "Martin L.", role: "Emergency service", photo: "portraitB" },
        { quote: "From grant advice to a working heat pump, all from one company. Highly recommended.", name: "Anna W.", role: "Heating upgrade", photo: "portraitA" },
      ],
    },
    team: {
      eyebrow: "Team", title: "The people behind Meyer", lead: "Our own specialists, our own apprentices – and plenty of experience.",
      members: [{ name: "Stefan Meyer", role: "Master electrician, owner", photo: "portraitD" }, { name: "Katrin Meyer", role: "Office & planning", photo: "portraitE" }, { name: "Jonas Koch", role: "Plumbing & heating engineer", photo: "portraitF" }, { name: "Leonie Busch", role: "Electrician", photo: "portraitC" }],
    },
    about: {
      eyebrow: "About us", title: "Three generations in {city}",
      paragraphs: ["{name} is a family business with 18 specialists. We plan, install and maintain electrical, plumbing and heating systems for homes, property managers and businesses.", "We train our own apprentices, work without subcontractors and are still there for you after the handover."],
      points: ["Registered master workshop", "Certified heat-pump installer", "Own 24/7 emergency service"],
      image: "electrician", secondImage: "interior",
    },
    faq: {
      eyebrow: "Questions & answers", title: "Frequently asked questions", lead: "Have another question? We’re happy to call you back.",
      items: [
        { q: "How quickly can I get an appointment?", a: "For repairs usually within two to three working days, same day for emergencies." },
        { q: "Is the site visit free?", a: "Yes, for projects from €1,000 the site visit in the city is free." },
        { q: "Do you help with grant applications?", a: "Yes. We advise on available grants and prepare the paperwork for you." },
        { q: "Do you work for property managers?", a: "Yes, with framework agreements, dedicated contacts and digital documentation." },
        { q: "What warranty do you give?", a: "Our work carries the statutory warranty, and many appliances also have a manufacturer’s guarantee." },
        { q: "How can I pay?", a: "By bank transfer on invoice; larger projects in agreed instalments." },
      ],
    },
    cta: { eyebrow: "Free quote", title: "Planning a project?", lead: "Tell us briefly about it – you’ll get a fixed-price quote within 48 hours.", primary: { label: "Request a quote", href: "#contact" }, secondary: { label: "Call emergency line", href: "tel:" } },
    gallery: { eyebrow: "Projects", title: "From our work", images: ["interior", "electrician", "plumber", "site", "drill", "handshake"] },
    portfolio: { eyebrow: "References", title: "Selected projects", lead: "A small glimpse of our recent work.", items: [{ title: "Accessible bathroom", category: "Plumbing", image: "interior" }, { title: "Heat pump in an old building", category: "Heating", image: "site" }, { title: "Rewiring an apartment block", category: "Electrical", image: "electrician" }, { title: "Smart-home retrofit", category: "Electrical", image: "drill" }] },
    blog: {
      eyebrow: "Guides", title: "Tips for your home", lead: "Practical knowledge from our master craftsmen.",
      posts: [
        { title: "Heat pumps in old buildings – does it work?", excerpt: "What really matters and which grants are available.", category: "Heating", date: "March 2026", image: "site" },
        { title: "Electrical safety checks: when are they required?", excerpt: "Essential for landlords and businesses – and sensible for owners.", category: "Electrical", date: "February 2026", image: "electrician" },
        { title: "Planning an accessible bathroom", excerpt: "Five details that make a difference every day.", category: "Plumbing", date: "January 2026", image: "interior" },
      ],
    },
    logos: { title: "We work with strong partners", names: ["Viessmann", "Grohe", "Busch-Jaeger", "Vaillant", "Hager"] },
    timeline: { eyebrow: "History", title: "Three generations of craft", items: [{ year: "1978", title: "Founded", text: "Heinrich Meyer opens the electrical workshop." }, { year: "1996", title: "Plumbing & heating", text: "Expansion into plumbing and heating." }, { year: "2012", title: "New workshop", text: "Move to Werkstraße with our own warehouse." }, { year: "2024", title: "Heat pumps", text: "Certified as a heat-pump specialist." }] },
  },

  praxis: {
    brand: { name: "Dr. Lehmann’s Practice", city: "Leipzig", phone: "+49 341 555 012 34", address: "Lindenallee 3, 04109 Leipzig", tagline: "General practice with time for you.", hours: ["Mon, Tue, Thu 8 am–6 pm", "Wed, Fri 8 am–1 pm"] },
    navCta: { label: "Book an appointment", href: "#contact" },
    hero: {
      eyebrow: "Family practice in {city}", title: "Medicine with time for you.",
      lead: "We look after you and your family for life – with preventive care, modern diagnostics and a listening ear.",
      primary: { label: "Book an appointment", href: "#contact" }, secondary: { label: "See services", href: "#services" },
      points: ["Online booking around the clock", "Short waits thanks to scheduled appointments", "Step-free practice"],
      image: "reception", panelTitle: "Surgery hours", panelLines: ["Mon, Tue, Thu 8 am–6 pm", "Wed, Fri 8 am–1 pm", "Walk-in clinic daily from 8 am"],
    },
    services: {
      eyebrow: "Services", title: "Primary care for the whole family", lead: "From prevention to the treatment of chronic conditions.",
      items: [
        { icon: "heart", title: "Check-ups", text: "Health checks, cancer screening and personal advice.", image: "doctor" },
        { icon: "medkit", title: "Vaccinations", text: "Routine, travel and booster vaccinations.", image: "treatment" },
        { icon: "pulse", title: "Diagnostics", text: "ECG, exercise ECG, lung function and ultrasound.", image: "treatment" },
        { icon: "home", title: "Home visits", text: "For patients who can’t come to the practice.", image: "doctor" },
        { icon: "globe", title: "Travel medicine", text: "Advice, vaccinations and a travel kit before you go.", image: "reception" },
        { icon: "chatbubbles", title: "Video consultations", text: "Discuss results and follow-ups from home.", image: "office" },
      ],
    },
    features: {
      eyebrow: "Our practice", title: "In good hands from the first call", lead: "We take our time – and organise the practice so you don’t have to wait.",
      items: [
        { icon: "time", title: "Short waits", text: "Scheduled and walk-in clinics run separately." },
        { icon: "calendar", title: "Online booking", text: "Book or move appointments online, any time." },
        { icon: "people", title: "Family medicine", text: "We care for children, parents and grandparents." },
        { icon: "hand", title: "Accessible", text: "Step-free entrance, lift and accessible toilet." },
      ],
    },
    steps: {
      eyebrow: "Your visit", title: "How your appointment works", lead: "Simple and well prepared.",
      items: [
        { title: "Book", text: "Online, by phone or at reception – whatever suits you." },
        { title: "Come prepared", text: "Bring your insurance card, medication plan and recent results." },
        { title: "Decide together", text: "We explain results clearly and plan the next steps with you." },
      ],
    },
    stats: { eyebrow: "About the practice", title: "Here for {city}", items: [{ value: "25", label: "Years of experience" }, { value: "6,000+", label: "Patients" }, { value: "12 min", label: "Average wait" }, { value: "4.9 / 5", label: "Rating" }] },
    pricing: {
      eyebrow: "Private services", title: "Additional health services", lead: "Services not covered by statutory insurance – transparently priced.", note: "Billed according to the official fee schedule. We’re happy to advise you in person.",
      plans: [
        { name: "Basic check", price: "€79", unit: "one-off", description: "For the health-conscious over 25", features: ["Detailed history", "Blood count and glucose", "Results consultation"], cta: { label: "Book", href: "#contact" } },
        { name: "Prevention Plus", price: "€189", unit: "one-off", description: "Comprehensive check-up", features: ["Extended lab tests", "Resting ECG and ultrasound", "Personal health plan"], featured: true, cta: { label: "Book", href: "#contact" } },
        { name: "Travel medicine", price: "€35", unit: "consultation", description: "Before long-haul trips", features: ["Personal vaccination advice", "Travel kit", "Vaccinations as needed"], cta: { label: "Book", href: "#contact" } },
      ],
      list: [
        { name: "Travel medicine consultation", detail: "about 20 minutes", price: "€35" },
        { name: "Sports medical check", detail: "incl. exercise ECG", price: "€129" },
        { name: "Thyroid ultrasound", detail: "on request", price: "€45" },
        { name: "Certificate", detail: "depending on scope", price: "from €15" },
        { name: "Vitamin lab profile", detail: "D, B12, folic acid", price: "€59" },
        { name: "Fitness certificate", detail: "e.g. diving", price: "€89" },
      ],
    },
    testimonials: {
      eyebrow: "Patient reviews", title: "What our patients say", rating: { score: "4.9", count: "180 reviews", source: "Google" },
      items: [
        { quote: "You feel taken seriously here. Dr. Lehmann explains everything calmly and clearly.", name: "Birgit S.", role: "Patient since 2015", photo: "portraitC" },
        { quote: "Booked online, seen on time – every practice should work like this.", name: "Daniel M.", role: "Patient", photo: "portraitF" },
        { quote: "The whole team is warm, including on the home visits for my mother.", name: "Claudia H.", role: "Relative", photo: "portraitE" },
      ],
    },
    team: {
      eyebrow: "Team", title: "Our practice team", lead: "Doctors and medical assistants who care.",
      members: [{ name: "Dr. Anne Lehmann", role: "General practitioner", photo: "portraitA" }, { name: "Dr. Paul Richter", role: "Internal medicine", photo: "portraitD" }, { name: "Maria Kowalski", role: "Practice manager", photo: "portraitE" }, { name: "Elif Demir", role: "Medical assistant", photo: "portraitC" }],
    },
    about: {
      eyebrow: "About us", title: "Your family practice in {city}",
      paragraphs: ["For 25 years we have cared for families from {city} and the surrounding area. We want you to feel understood – so we take time to talk.", "Modern diagnostics, online appointments and a well-practised team make sure your visit runs smoothly."],
      points: ["All insurers and private patients", "Academic teaching practice", "Step-free access with lift"],
      image: "reception", secondImage: "doctor",
    },
    faq: {
      eyebrow: "Questions & answers", title: "Frequently asked questions", lead: "We’re happy to answer other questions by phone.",
      items: [
        { q: "Are you taking new patients?", a: "Yes, we welcome new patients from {city}. Please book a first appointment." },
        { q: "How do I book an appointment?", a: "Online around the clock, by phone during surgery hours or at reception." },
        { q: "What should I do if I’m acutely unwell?", a: "Come to the walk-in clinic, daily from 8 am. Outside surgery hours, call the out-of-hours service." },
        { q: "Do you make home visits?", a: "Yes, for patients who can’t come to the practice for health reasons." },
        { q: "Can I order repeat prescriptions online?", a: "Yes, order online and collect them on the next working day." },
        { q: "Is there parking?", a: "There are two accessible spaces outside, and more in the car park opposite." },
      ],
    },
    cta: { eyebrow: "Appointments", title: "We’re here for you", lead: "Book your appointment online – or call us during surgery hours.", primary: { label: "Book online", href: "#contact" }, secondary: { label: "Call us", href: "tel:" } },
    gallery: { eyebrow: "Impressions", title: "Our practice", images: ["reception", "treatment", "doctor", "office", "meeting", "workshop"] },
    portfolio: { eyebrow: "Focus areas", title: "Our focus areas", lead: "Where we have particular expertise.", items: [{ title: "Diabetes care", category: "Chronic conditions", image: "doctor" }, { title: "Cardiovascular health", category: "Diagnostics", image: "treatment" }, { title: "Travel medicine", category: "Advice", image: "reception" }, { title: "Care for older people", category: "Home visits", image: "office" }] },
    blog: {
      eyebrow: "Health", title: "News from the practice", lead: "Updates and health tips.",
      posts: [
        { title: "Flu vaccination: now is the time", excerpt: "Who it’s recommended for and how to get an appointment.", category: "Vaccinations", date: "October 2026", image: "treatment" },
        { title: "Check-up from 35: what’s included?", excerpt: "The standard health check explained simply.", category: "Prevention", date: "September 2026", image: "doctor" },
        { title: "New online booking", excerpt: "Book, move and cancel appointments around the clock.", category: "Practice", date: "August 2026", image: "reception" },
      ],
    },
    logos: { title: "Partners", names: ["Leipzig Hospital", "University Clinic", "Market Pharmacy", "Physio Plus", "Central Lab"] },
    timeline: { eyebrow: "History", title: "Our practice", items: [{ year: "2001", title: "Founded", text: "Dr. Lehmann opens the practice on Lindenallee." }, { year: "2012", title: "Teaching practice", text: "Recognised as an academic teaching practice." }, { year: "2020", title: "Video consultations", text: "Online appointments and repeat prescriptions." }, { year: "2025", title: "Expansion", text: "A second doctor and new diagnostic rooms." }] },
  },

  zahnarzt: {
    brand: { name: "Smile Lines Dental", city: "Hamburg", phone: "+49 40 555 017 89", address: "Schulterblatt 12, 20357 Hamburg", tagline: "Dentistry that feels good.", hours: ["Mon–Thu 8 am–7 pm", "Fri 8 am–3 pm"] },
    navCta: { label: "Book a visit", href: "#contact" },
    hero: {
      eyebrow: "Dental practice in {city}", title: "Laughing allowed. Even at the dentist.",
      lead: "Thorough dentistry without the clinical chill: we explain everything, plan with you and take our time – especially if the dentist isn’t your favourite place.",
      primary: { label: "Book a visit", href: "#contact" }, secondary: { label: "What we do", href: "#services" },
      points: ["Online booking, evening slots", "Extra time for nervous patients", "Kids welcome"],
      image: "aligner", panelTitle: "Opening hours", panelLines: ["Mon–Thu 8 am–7 pm", "Fri 8 am–3 pm", "Same-day slots for toothache from 8 am"],
    },
    services: {
      eyebrow: "Services", title: "Everything for your smile – under one roof", lead: "From a proper clean to invisible aligners.",
      items: [
        { icon: "sunny", title: "Hygiene & cleaning", text: "A thorough clean, polish and tips that actually work in everyday life.", image: "dentalChair" },
        { icon: "happy", title: "Aligners", text: "Clear aligners for straight teeth – no metal, planned digitally.", image: "aligner" },
        { icon: "search", title: "Digital diagnostics", text: "3D scans instead of impression trays and low-dose X-rays.", image: "dentalScan" },
        { icon: "shield", title: "Fillings & crowns", text: "Tooth-coloured fillings and long-lasting ceramic restorations.", image: "dentalVisit" },
        { icon: "flower", title: "Whitening", text: "Gentle whitening in the practice or with trays at home.", image: "dentalRoom" },
        { icon: "heart", title: "Children’s dentistry", text: "Playful, patient and with a small surprise at the end.", image: "dentist" },
      ],
    },
    features: {
      eyebrow: "Why us", title: "The dentist, but relaxed", lead: "We set up the practice the way we’d like to be treated ourselves.",
      items: [
        { icon: "chatbubbles", title: "Talk first, treat second", text: "Every step is explained beforehand. You set the pace." },
        { icon: "hand", title: "For nervous patients", text: "Longer visits, breaks on a hand signal and headphones if you like." },
        { icon: "calendar", title: "Evenings & online", text: "Appointments until 7 pm, bookable online around the clock." },
        { icon: "cash", title: "Clear costs", text: "A written cost estimate before any larger treatment." },
      ],
    },
    steps: {
      eyebrow: "Your first visit", title: "An easy start", lead: "Three steps to a plan for your teeth.",
      items: [
        { title: "Get to know us", text: "We talk about your wishes, worries and past experiences." },
        { title: "Check-up", text: "A thorough exam with a 3D scan – no impression trays." },
        { title: "Plan together", text: "You get your options and costs in writing and decide in your own time." },
      ],
    },
    stats: { eyebrow: "About the practice", title: "In {city} for 12 years", items: [{ value: "12", label: "Years of experience" }, { value: "4,500+", label: "Patients" }, { value: "7", label: "Treatment rooms" }, { value: "4.9 / 5", label: "Rating" }] },
    pricing: {
      eyebrow: "Prices", title: "Clear before we start", lead: "Guide prices for common private treatments. You always get your personal estimate first.", note: "Guide prices; the final cost depends on the treatment. Many supplementary insurances cover part of it.",
      plans: [
        { name: "Professional clean", price: "€95", unit: "per visit", description: "Thorough and gentle", features: ["Plaque and tartar removal", "Polish and fluoride", "Care tips"], cta: { label: "Book a visit", href: "#contact" } },
        { name: "Aligners", price: "from €2,900", unit: "treatment", description: "Straight teeth, invisibly", features: ["3D scan and simulation", "All aligners included", "Check-ups"], featured: true, cta: { label: "Book a consultation", href: "#contact" } },
        { name: "Whitening", price: "from €290", unit: "treatment", description: "Brighten gently", features: ["Check-up and clean first", "In practice or at home", "Follow-up visit"], cta: { label: "Book a visit", href: "#contact" } },
      ],
      list: [
        { name: "Professional clean", detail: "about 60 minutes", price: "€95" },
        { name: "Children’s hygiene visit", detail: "up to 17", price: "€45" },
        { name: "In-practice whitening", detail: "one session", price: "from €290" },
        { name: "Aligner consultation with 3D scan", detail: "incl. simulation", price: "€79" },
        { name: "Ceramic inlay", detail: "per tooth", price: "from €690" },
        { name: "Night guard", detail: "custom-fitted", price: "from €220" },
      ],
    },
    testimonials: {
      eyebrow: "Reviews", title: "What our patients say", rating: { score: "4.9", count: "260 reviews", source: "Google" },
      items: [
        { quote: "I hadn’t seen a dentist in ten years. Nobody made me feel guilty – now I actually like coming.", name: "Jonas K.", role: "Patient since 2023", photo: "portraitB" },
        { quote: "My daughter asks when we’re going back to “the smiley dentist”. Enough said.", name: "Sandra P.", role: "Mum of Lea, 6", photo: "portraitC" },
        { quote: "Estimate up front, a 6 pm slot, everything explained calmly. Exactly right.", name: "Mehmet A.", role: "Patient", photo: "portraitF" },
      ],
    },
    team: {
      eyebrow: "Team", title: "The people behind the smiles", lead: "Dentists and a team that likes to laugh.",
      members: [{ name: "Dr. Mila Hoffmann", role: "Dentist, practice owner", photo: "portraitA" }, { name: "Dr. Jan Petersen", role: "Dentist, aligner specialist", photo: "portraitD" }, { name: "Aylin Kaya", role: "Dental hygienist", photo: "portraitE" }, { name: "Tom Becker", role: "Front desk & good mood", photo: "portraitB" }],
    },
    about: {
      eyebrow: "About us", title: "Your dental practice in the heart of {city}",
      paragraphs: ["We believe good dentistry starts with trust. So we take time to talk, explain things without jargon and plan together with you.", "Bright rooms, modern technology and a team that knows your name make every visit as pleasant as possible."],
      points: ["All insurances and private patients", "Step-free access", "Appointments until 7 pm"],
      image: "dentalRoom", secondImage: "dentalVisit",
    },
    faq: {
      eyebrow: "Questions & answers", title: "Good to know", lead: "Anything else? Call us or send a WhatsApp message.",
      items: [
        { q: "I’m scared of the dentist. What now?", a: "Tell us when you book. You’ll get a longer appointment, we explain every step and pause whenever you want." },
        { q: "Are you taking new patients?", a: "Yes, gladly – from {city} and around. Just book a get-to-know-you visit." },
        { q: "How much is a professional clean?", a: "Around €95 per visit, depending on the work needed. Many insurers contribute." },
        { q: "Do you treat children?", a: "We love to, from the first tooth. We prefer morning slots for kids." },
        { q: "What if I have toothache?", a: "Call us – there are same-day slots from 8 am. At night and at weekends the dental emergency service helps." },
        { q: "Is there parking?", a: "A car park is two minutes away, and the underground station is just around the corner." },
      ],
    },
    cta: { eyebrow: "Appointments", title: "Ready for your next smile?", lead: "Book online – around the clock. Or simply give us a call.", primary: { label: "Book online", href: "#contact" }, secondary: { label: "Call us", href: "tel:" } },
    gallery: { eyebrow: "Inside", title: "Our practice", images: ["dentalChair", "dentalRoom", "dentalVisit", "dentalScan", "dentist", "aligner"] },
    portfolio: { eyebrow: "Focus areas", title: "What we specialise in", lead: "Where we know our stuff best.", items: [{ title: "Aligner therapy", category: "Orthodontics", image: "aligner" }, { title: "Digital impressions", category: "3D diagnostics", image: "dentalScan" }, { title: "Nervous patients", category: "Treatment", image: "dentalVisit" }, { title: "Children’s dentistry", category: "Family", image: "dentalChair" }] },
    blog: {
      eyebrow: "Tooth talk", title: "From the practice", lead: "Tips for healthy teeth – short and clear.",
      posts: [
        { title: "Electric or manual? The toothbrush question", excerpt: "What really matters – and why technique beats the motor.", category: "Care", date: "October 2026", image: "dentalChair" },
        { title: "Aligners: who they suit", excerpt: "Duration, cost and everyday life with clear aligners.", category: "Aligners", date: "September 2026", image: "aligner" },
        { title: "No more fear of the drill", excerpt: "How we make visits easier for nervous patients.", category: "Practice", date: "August 2026", image: "dentalVisit" },
      ],
    },
    logos: { title: "Partners", names: ["Dental Lab North", "Kids Dental HH", "Dental Chamber", "University Hospital", "Prophylaxis Plus"] },
    timeline: { eyebrow: "History", title: "Our practice", items: [{ year: "2014", title: "Opening", text: "Dr. Hoffmann opens the practice on Schulterblatt." }, { year: "2018", title: "Digital scans", text: "A 3D scanner replaces impression trays." }, { year: "2022", title: "Aligners", text: "Aligner therapy starts with Dr. Petersen." }, { year: "2026", title: "New rooms", text: "Seven treatment rooms and a kids’ corner." }] },
  },

  restaurant: {
    brand: { name: "Trattoria Luce", city: "Cologne", phone: "+49 221 444 555 66", address: "Am Rheinufer 21, 50667 Cologne", tagline: "Italian cooking with local ingredients.", hours: ["Tue–Sat 12 pm–11 pm", "Sun 12 pm–9 pm"] },
    navCta: { label: "Book a table", href: "#contact" },
    hero: {
      eyebrow: "Trattoria in {city}", title: "Real Italian food, made fresh.",
      lead: "Handmade pasta, stone-oven pizza and wines from small estates – right in the heart of {city}.",
      primary: { label: "Book a table", href: "#contact" }, secondary: { label: "See the menu", href: "#pricing" },
      points: ["Pasta made by hand every day", "Local, seasonal ingredients", "Terrace overlooking the river"],
      image: "dining", panelTitle: "Opening hours", panelLines: ["Tue–Sat 12 pm–11 pm", "Sun 12 pm–9 pm", "Closed on Mondays"],
    },
    services: {
      eyebrow: "What we offer", title: "Good food for every occasion", lead: "From a quick lunch to a long evening with friends.",
      items: [
        { icon: "restaurant", title: "Lunch menu", text: "Changing dishes, served quickly – Tue to Fri from noon.", image: "food", price: "from €12.90" },
        { icon: "pizza", title: "Stone-oven pizza", text: "Dough rested for 48 hours, baked in a wood-fired oven.", image: "plate" },
        { icon: "wine", title: "Wine bar", text: "More than 60 wines from small Italian estates.", image: "bistro" },
        { icon: "people", title: "Parties & events", text: "Birthdays, company parties and private dinners for up to 60 guests.", image: "dining" },
        { icon: "cafe", title: "Catering", text: "Antipasti, pasta and desserts for your event.", image: "food" },
        { icon: "nutrition", title: "Vegetarian & vegan", text: "Many dishes are vegetarian or can be made vegan.", image: "plate" },
      ],
    },
    features: {
      eyebrow: "Our kitchen", title: "What makes us special", lead: "Simple recipes, the best ingredients and plenty of time.",
      items: [
        { icon: "leaf", title: "Fresh", text: "Pasta and sauces made by hand every day." },
        { icon: "pin", title: "Local", text: "Vegetables and meat from farms in the region." },
        { icon: "wine", title: "Wines", text: "Carefully chosen, also by the glass." },
        { icon: "heart", title: "Family-run", text: "A family business since 2009." },
      ],
    },
    steps: {
      eyebrow: "Reservations", title: "How to book", lead: "Your table in under a minute.",
      items: [
        { title: "Pick a date", text: "Choose the day, time and number of guests." },
        { title: "Get confirmation", text: "We confirm your booking right away." },
        { title: "Enjoy", text: "We look forward to welcoming you." },
      ],
    },
    stats: { eyebrow: "Trattoria Luce", title: "In {city} since 2009", items: [{ value: "2009", label: "Founded" }, { value: "60+", label: "Wines" }, { value: "120", label: "Seats" }, { value: "4.7 / 5", label: "Rating" }] },
    pricing: {
      eyebrow: "Menu", title: "From our menu", lead: "A selection – the full menu changes with the seasons.", note: "All prices incl. VAT. Allergen information on request.",
      plans: [
        { name: "Pranzo", price: "€14.90", unit: "lunch menu", description: "Tue–Fri 12–3 pm", features: ["Antipasto of the day", "Pasta or pizza", "Espresso"], cta: { label: "Book a table", href: "#contact" } },
        { name: "Menu Luce", price: "€49", unit: "per person", description: "Four courses chosen by the chef", features: ["Mixed antipasti", "Handmade pasta", "Main course and dessert"], featured: true, cta: { label: "Book a table", href: "#contact" } },
        { name: "Festa", price: "from €39", unit: "per person", description: "For groups of 12 or more", features: ["Buffet or set menu", "Optional wine pairing", "Private area"], cta: { label: "Enquire", href: "#contact" } },
      ],
      list: [
        { name: "Vitello tonnato", detail: "Veal, tuna cream, capers", price: "€14.50" },
        { name: "Tagliatelle al ragù", detail: "Handmade pasta, beef ragù", price: "€16.90" },
        { name: "Pizza Margherita", detail: "San Marzano tomatoes, fior di latte", price: "€11.50" },
        { name: "Risotto ai funghi", detail: "Porcini, Parmigiano", price: "€18.50" },
        { name: "Saltimbocca", detail: "Veal, sage, Parma ham", price: "€24.90" },
        { name: "Tiramisù", detail: "Nonna’s recipe", price: "€7.50" },
      ],
    },
    testimonials: {
      eyebrow: "Guests", title: "What our guests say", rating: { score: "4.7", count: "860 reviews", source: "Google" },
      items: [
        { quote: "The best pasta in town – and service that makes you feel welcome straight away.", name: "Julia B.", role: "Regular guest", photo: "portraitE" },
        { quote: "Our company party was perfectly organised. The menu was a dream.", name: "Markus F.", role: "Company event", photo: "portraitB" },
        { quote: "Pizza like in Naples and a great wine. We’ll be back!", name: "Lena and Tom", role: "Guests", photo: "portraitC" },
      ],
    },
    team: {
      eyebrow: "Team", title: "The Luce family", lead: "Kitchen and service with passion.",
      members: [{ name: "Marco Bellini", role: "Head chef", photo: "portraitD" }, { name: "Giulia Bellini", role: "Host", photo: "portraitA" }, { name: "Luca Romano", role: "Pizzaiolo", photo: "portraitF" }, { name: "Sara Klein", role: "Sommelier", photo: "portraitE" }],
    },
    about: {
      eyebrow: "About us", title: "A slice of Italy in {city}",
      paragraphs: ["{name} is a family restaurant: Marco cooks from his grandmother’s recipes, and Giulia makes sure every guest feels at home.", "We buy local and seasonal and make almost everything ourselves – from the pasta to the tiramisù."],
      points: ["Fresh pasta every day", "Local ingredients", "Gluten-free pasta on request"],
      image: "bistro", secondImage: "plate",
    },
    faq: {
      eyebrow: "Questions & answers", title: "Good to know", lead: "We’re happy to answer other questions by phone.",
      items: [
        { q: "Can I book online?", a: "Yes, using the form or by phone. For groups of 12 or more, please contact us directly." },
        { q: "Do you have vegetarian and vegan dishes?", a: "Yes, many dishes are vegetarian and some are vegan. Just ask our team." },
        { q: "Can we hold a party with you?", a: "Of course – for up to 60 guests with a set menu or buffet." },
        { q: "Do you offer takeaway?", a: "Yes, pizza and pasta to take away during opening hours." },
        { q: "Are dogs allowed?", a: "Well-behaved dogs are very welcome on the terrace." },
        { q: "Do you sell gift vouchers?", a: "Yes, vouchers of any value are available in the restaurant." },
      ],
    },
    cta: { eyebrow: "Reservations", title: "Buon appetito!", lead: "Book your table – we look forward to seeing you.", primary: { label: "Book a table", href: "#contact" }, secondary: { label: "Call us", href: "tel:" } },
    gallery: { eyebrow: "Impressions", title: "Inside our trattoria", images: ["dining", "plate", "bistro", "food", "handshake", "office"] },
    portfolio: { eyebrow: "Events", title: "Celebrate with us", lead: "From weddings to Christmas parties.", items: [{ title: "Wedding dinner", category: "Private party", image: "dining" }, { title: "Wine evening", category: "Event", image: "bistro" }, { title: "Business lunch", category: "Business", image: "food" }, { title: "Cooking class", category: "Workshop", image: "plate" }] },
    blog: {
      eyebrow: "News", title: "From the kitchen", lead: "Seasonal dishes, wines and dates.",
      posts: [
        { title: "Truffle weeks in November", excerpt: "Fresh truffles from Piedmont – for a short time only.", category: "Season", date: "November 2026", image: "plate" },
        { title: "Wine evening with Rossi estate", excerpt: "Five wines, five courses and plenty of stories.", category: "Event", date: "October 2026", image: "bistro" },
        { title: "New lunch menu", excerpt: "Light dishes for your lunch break.", category: "Menu", date: "September 2026", image: "food" },
      ],
    },
    logos: { title: "Our suppliers", names: ["Kaiser Farm", "Caseificio Rossi", "Valle Estate", "Stein Bakery", "Olio Sano"] },
    timeline: { eyebrow: "History", title: "Our story", items: [{ year: "2009", title: "Opening", text: "Marco and Giulia open the trattoria." }, { year: "2014", title: "Stone oven", text: "A wood-fired oven for real Neapolitan pizza." }, { year: "2019", title: "Terrace", text: "A new terrace overlooking the river." }, { year: "2025", title: "Wine bar", text: "More than 60 wines from small estates." }] },
  },

  agentur: {
    brand: { name: "Studio Kante", city: "Berlin", phone: "+49 30 123 456 70", address: "Torstraße 140, 10119 Berlin", tagline: "Websites and brands that work.", hours: ["Mon–Fri 9 am–6 pm"] },
    navCta: { label: "Start a project", href: "#contact" },
    hero: {
      eyebrow: "Web & brand studio", title: "Websites that win customers.",
      lead: "We design and build fast, accessible websites with WordPress and Bricks – from strategy to launch.",
      primary: { label: "Start a project", href: "#contact" }, secondary: { label: "See our work", href: "#work" },
      points: ["Launch in 6 to 10 weeks", "Easy to maintain in Bricks Builder", "Measurable results, not guesswork"],
      image: "team", panelTitle: "Currently available", panelLines: ["Projects starting in November", "Free intro call", "Reply within 24 hours"],
    },
    services: {
      eyebrow: "Services", title: "Everything a strong website needs", lead: "One team for strategy, design, development and growth.",
      items: [
        { icon: "color-palette", title: "Web design", text: "Clear design that strengthens your brand and guides visitors.", image: "workshop" },
        { icon: "code", title: "WordPress & Bricks", text: "Fast, easy-to-maintain websites on a clean design system.", image: "office" },
        { icon: "search", title: "SEO", text: "Technically sound and strong in content – for more visibility.", image: "meeting" },
        { icon: "brush", title: "Branding", text: "Logo, colours and typography that belong together.", image: "team" },
        { icon: "trending-up", title: "Performance marketing", text: "Campaigns with measurable results instead of wasted spend.", image: "handshake" },
        { icon: "lock", title: "Care & hosting", text: "Updates, backups and monitoring – so your site keeps running.", image: "workshop" },
      ],
    },
    features: {
      eyebrow: "How we work", title: "Why clients stay", lead: "We work transparently, quickly and as equals.",
      items: [
        { icon: "rocket", title: "Live fast", text: "Clear sprints and launch in weeks." },
        { icon: "analytics", title: "Measurable", text: "Goals, tracking and reporting from day one." },
        { icon: "people", title: "One team", text: "Design and development work hand in hand." },
        { icon: "shield", title: "Future-proof", text: "Accessible, privacy-compliant and easy to maintain." },
      ],
    },
    steps: {
      eyebrow: "Process", title: "From first call to launch", lead: "A clear process without surprises.",
      items: [
        { title: "Discovery", text: "We understand your goals, audience and competitors." },
        { title: "Concept & design", text: "Structure, content and design – agreed in two rounds." },
        { title: "Development", text: "Built in Bricks on a clean design system." },
        { title: "Launch & growth", text: "Go-live, training and ongoing optimisation." },
      ],
    },
    stats: { eyebrow: "Results", title: "What our work achieves", items: [{ value: "140+", label: "Websites live" }, { value: "+62%", label: "More enquiries on average" }, { value: "98", label: "Average PageSpeed score" }, { value: "12", label: "Years of experience" }] },
    pricing: {
      eyebrow: "Packages", title: "Clear packages, clear prices", lead: "Fixed prices for websites – or tailored quotes for larger projects.", note: "All prices plus VAT.",
      plans: [
        { name: "Start", price: "€4,900", unit: "one-off", description: "One-pager for a professional presence", features: ["Up to 6 sections", "Responsive design", "Basic SEO"], cta: { label: "Enquire", href: "#contact" } },
        { name: "Business", price: "€9,800", unit: "one-off", description: "Website with up to 12 pages", features: ["Custom design system", "Blog and forms", "SEO and tracking"], featured: true, cta: { label: "Enquire", href: "#contact" } },
        { name: "Care", price: "€149", unit: "per month", description: "Maintenance and improvements", features: ["Updates and backups", "Monitoring", "2 hours of changes"], cta: { label: "Enquire", href: "#contact" } },
      ],
      list: [
        { name: "Strategy workshop", detail: "half day", price: "€890" },
        { name: "Landing page", detail: "Design and build", price: "from €2,400" },
        { name: "Logo & basic branding", detail: "incl. style guide", price: "from €2,900" },
        { name: "SEO audit", detail: "technical and content", price: "€690" },
        { name: "Bricks training", detail: "3 hours, remote", price: "€390" },
        { name: "Care", detail: "per month", price: "from €149" },
      ],
    },
    testimonials: {
      eyebrow: "Testimonials", title: "What clients say", rating: { score: "5.0", count: "48 reviews", source: "Google" },
      items: [
        { quote: "Studio Kante rebuilt our website in eight weeks. We’ve had twice as many enquiries since.", name: "Nina Hoffmann", role: "CEO, Hoffmann Real Estate", photo: "portraitA" },
        { quote: "Finally a website we can maintain ourselves. The design system in Bricks is worth its weight in gold.", name: "Felix Braun", role: "Marketing, Braun Logistics", photo: "portraitB" },
        { quote: "Strategically strong, quick to deliver and always available.", name: "Sarah Lindner", role: "Founder, Lindner Coaching", photo: "portraitE" },
      ],
    },
    team: {
      eyebrow: "Team", title: "The people behind Studio Kante", lead: "Small enough for personal service, big enough for ambitious projects.",
      members: [{ name: "Jakob Kante", role: "Founder, strategy", photo: "portraitD" }, { name: "Mira Schulz", role: "Art direction", photo: "portraitC" }, { name: "Can Yilmaz", role: "Development", photo: "portraitF" }, { name: "Lea Vogt", role: "SEO & content", photo: "portraitE" }],
    },
    about: {
      eyebrow: "About us", title: "Design with a point of view, built with care",
      paragraphs: ["{name} is an owner-run studio in {city}. We combine strategy, design and development into websites that achieve measurably more.", "We build in WordPress with Bricks – on a design system our clients can maintain themselves."],
      points: ["More than 140 websites delivered", "Bricks specialists since 2021", "Accessible builds following WCAG"],
      image: "team", secondImage: "meeting",
    },
    faq: {
      eyebrow: "Questions & answers", title: "Frequently asked questions", lead: "More questions? Book a free intro call.",
      items: [
        { q: "How long does a website project take?", a: "One-pagers usually go live in four to six weeks, larger websites in eight to twelve." },
        { q: "Can I maintain the website myself?", a: "Yes. We build on Bricks with a clear design system and train your team." },
        { q: "Do you handle copy and photos?", a: "Yes, with our network of copywriters and photographers." },
        { q: "What does a website cost?", a: "Our packages start at €4,900. For larger projects we prepare a tailored quote." },
        { q: "Do you take care of hosting and maintenance?", a: "Yes, with our Care package including updates, backups and monitoring." },
        { q: "Do you only work in {city}?", a: "No, we work remotely with clients everywhere." },
      ],
    },
    cta: { eyebrow: "Intro call", title: "Ready for a website that works?", lead: "Tell us about your project – we’ll get back to you within 24 hours.", primary: { label: "Start a project", href: "#contact" }, secondary: { label: "Call us", href: "tel:" } },
    gallery: { eyebrow: "Studio", title: "Inside the studio", images: ["team", "office", "workshop", "meeting", "handshake", "interior"] },
    portfolio: { eyebrow: "Work", title: "Selected work", lead: "A selection of recent projects.", items: [{ title: "Hoffmann Real Estate", category: "Website & branding", image: "office" }, { title: "Braun Logistics", category: "Relaunch", image: "meeting" }, { title: "Lindner Coaching", category: "One-pager", image: "workshop" }, { title: "Café Nord", category: "Branding", image: "handshake" }] },
    blog: {
      eyebrow: "Journal", title: "Lessons from our projects", lead: "On design, Bricks and digital growth.",
      posts: [
        { title: "Building design systems in Bricks", excerpt: "Combining variables, classes and components sensibly.", category: "Bricks", date: "March 2026", image: "workshop" },
        { title: "Accessibility requirements explained", excerpt: "What the new accessibility rules mean for your website.", category: "Accessibility", date: "February 2026", image: "office" },
        { title: "Five levers for more enquiries", excerpt: "Small changes with a big effect on conversion.", category: "Marketing", date: "January 2026", image: "meeting" },
      ],
    },
    logos: { title: "Clients who trust us", names: ["Hoffmann Real Estate", "Braun Logistics", "Lindner Coaching", "Café Nord", "South Utilities"] },
    timeline: { eyebrow: "History", title: "Our journey", items: [{ year: "2014", title: "Founded", text: "Started as a freelance duo in {city}." }, { year: "2018", title: "Studio", text: "Our own studio and first permanent team." }, { year: "2021", title: "Bricks", text: "Switched to Bricks and design systems." }, { year: "2026", title: "140 websites", text: "More than 140 projects successfully live." }] },
  },

  business: {
    brand: { name: "Northern Light Consulting", city: "Hamburg", phone: "+49 40 123 456 78", address: "Große Elbstraße 45, 22767 Hamburg", tagline: "Clarity for your business.", hours: ["Mon–Fri 9 am–6 pm"] },
    navCta: { label: "Get in touch", href: "#contact" },
    hero: {
      eyebrow: "Business consulting in {city}", title: "More clarity. Better decisions.",
      lead: "We help mid-sized companies with strategy, organisation and digitalisation – pragmatic and measurable.",
      primary: { label: "Book an intro call", href: "#contact" }, secondary: { label: "See services", href: "#services" },
      points: ["More than 200 projects delivered", "Implementation, not slide decks", "One dedicated contact"],
      image: "meeting", panelTitle: "Free intro call", panelLines: ["30 minutes, video or in person", "No obligation", "Appointments within a week"],
    },
    services: {
      eyebrow: "Services", title: "How we support you", lead: "From analysis to everyday implementation.",
      items: [
        { icon: "bulb", title: "Strategy", text: "Clear goals and a plan your team understands.", image: "meeting" },
        { icon: "people", title: "Organisation", text: "Structures and processes that grow with you.", image: "team" },
        { icon: "analytics", title: "Digitalisation", text: "Digital processes with tools people actually use.", image: "workshop" },
        { icon: "trending-up", title: "Growth", text: "New markets, new products, better sales processes.", image: "handshake" },
        { icon: "school", title: "Leadership", text: "Workshops and coaching for managers.", image: "office" },
        { icon: "shield", title: "Funding", text: "Well prepared for grants, banks and investors.", image: "paperwork" },
      ],
    },
    features: {
      eyebrow: "Our approach", title: "Consulting that lands", lead: "We work with your team, not around it.",
      items: [
        { icon: "checkmark-circle", title: "Pragmatic", text: "Solutions that work in everyday life." },
        { icon: "analytics", title: "Measurable", text: "Clear metrics for every step." },
        { icon: "people", title: "Collaborative", text: "We work closely with your team." },
        { icon: "time", title: "Fast", text: "First results within weeks." },
      ],
    },
    steps: {
      eyebrow: "Approach", title: "How we work", lead: "Structured, transparent and close to your daily business.",
      items: [
        { title: "Analysis", text: "We understand your situation and goals." },
        { title: "Plan", text: "Together we develop a realistic roadmap." },
        { title: "Implementation", text: "We support implementation until results are there." },
      ],
    },
    stats: { eyebrow: "Results", title: "Impact you can measure", items: [{ value: "200+", label: "Projects" }, { value: "15", label: "Years of experience" }, { value: "92%", label: "Would recommend us" }, { value: "40", label: "Industries" }] },
    pricing: {
      eyebrow: "Formats", title: "How we work together", lead: "From a single workshop to long-term support.", note: "All prices plus VAT.",
      plans: [
        { name: "Workshop", price: "€1,900", unit: "per day", description: "A focused start on one topic", features: ["Preparation and facilitation", "Written results", "Action plan"], cta: { label: "Enquire", href: "#contact" } },
        { name: "Project", price: "from €12,000", unit: "fixed price", description: "A clearly defined initiative", features: ["Analysis and concept", "Implementation support", "Weekly check-ins"], featured: true, cta: { label: "Enquire", href: "#contact" } },
        { name: "Sparring", price: "€990", unit: "per month", description: "Regular exchange", features: ["Two sessions a month", "Phone access", "Cancel monthly"], cta: { label: "Enquire", href: "#contact" } },
      ],
      list: [
        { name: "Intro call", detail: "30 minutes", price: "free" },
        { name: "Strategy workshop", detail: "one day", price: "€1,900" },
        { name: "Leadership coaching", detail: "per session", price: "€290" },
        { name: "Process analysis", detail: "per area", price: "from €3,500" },
        { name: "Funding advice", detail: "application included", price: "from €1,200" },
        { name: "Interim management", detail: "per day", price: "on request" },
      ],
    },
    testimonials: {
      eyebrow: "References", title: "What clients say", rating: { score: "4.9", count: "64 reviews", source: "ProvenExpert" },
      items: [
        { quote: "After six months we have clear processes and a team pulling in the same direction.", name: "Ralf Petersen", role: "CEO, Petersen Metalworks", photo: "portraitD" },
        { quote: "Finally consultants who roll up their sleeves. The results speak for themselves.", name: "Julia Krämer", role: "COO, Krämer & Sons", photo: "portraitA" },
        { quote: "Pragmatic, honest and always focused on solutions.", name: "Oliver Stein", role: "Owner, Stein Logistics", photo: "portraitB" },
      ],
    },
    team: {
      eyebrow: "Team", title: "Your consultants", lead: "Experience from mid-sized firms, corporates and start-ups.",
      members: [{ name: "Dr. Henrik Voss", role: "Managing director", photo: "portraitD" }, { name: "Laura Becker", role: "Strategy", photo: "portraitA" }, { name: "Tobias Engel", role: "Digitalisation", photo: "portraitF" }, { name: "Nadia Haddad", role: "Organisation", photo: "portraitE" }],
    },
    about: {
      eyebrow: "About us", title: "Consulting from {city} for mid-sized companies",
      paragraphs: ["{name} has supported mid-sized companies for 15 years. We come from practice and know that good ideas only count once they work day to day.", "That’s why we work closely with your team, measure progress and stay until the results are there."],
      points: ["More than 200 successful projects", "Certified funding advisers", "A network of specialists"],
      image: "meeting", secondImage: "team",
    },
    faq: {
      eyebrow: "Questions & answers", title: "Frequently asked questions", lead: "We’re happy to discuss other questions in an intro call.",
      items: [
        { q: "Which companies do you work with?", a: "Mainly mid-sized companies with 20 to 500 employees." },
        { q: "How does the intro call work?", a: "30 minutes by video or in person – free and without obligation." },
        { q: "How long does a project take?", a: "Depending on scope, between six weeks and a year." },
        { q: "Is funding available for consulting?", a: "Yes, many consulting services qualify for grants. We check this for you." },
        { q: "Do you work remotely?", a: "Yes, we combine on-site meetings with remote work." },
        { q: "How do you charge?", a: "By day rate or fixed price – agreed transparently upfront." },
      ],
    },
    cta: { eyebrow: "Intro call", title: "Let’s talk", lead: "30 minutes, free and without obligation – together we’ll find the next step.", primary: { label: "Book a call", href: "#contact" }, secondary: { label: "Call us", href: "tel:" } },
    gallery: { eyebrow: "Impressions", title: "Our everyday work", images: ["meeting", "team", "office", "workshop", "handshake", "paperwork"] },
    portfolio: { eyebrow: "Projects", title: "Selected projects", lead: "A selection of our work.", items: [{ title: "Sales realignment", category: "Strategy", image: "meeting" }, { title: "Digital order processing", category: "Digitalisation", image: "workshop" }, { title: "New leadership structure", category: "Organisation", image: "team" }, { title: "Innovation project funding", category: "Funding", image: "paperwork" }] },
    blog: {
      eyebrow: "Insights", title: "Ideas for your business", lead: "Practical knowledge from our projects.",
      posts: [
        { title: "Strategy in 90 days", excerpt: "How a clear rhythm delivers results.", category: "Strategy", date: "March 2026", image: "meeting" },
        { title: "Digitalisation without frustration", excerpt: "Why tools alone don’t improve processes.", category: "Digitalisation", date: "February 2026", image: "workshop" },
        { title: "Funding in 2026", excerpt: "The most important programmes for mid-sized companies.", category: "Funding", date: "January 2026", image: "paperwork" },
      ],
    },
    logos: { title: "Companies that trust us", names: ["Petersen Metalworks", "Krämer & Sons", "Stein Logistics", "Hanse Textiles", "Elbe Foods"] },
    timeline: { eyebrow: "History", title: "Our journey", items: [{ year: "2011", title: "Founded", text: "Started in {city} with three consultants." }, { year: "2016", title: "Digitalisation", text: "A dedicated practice for digital processes." }, { year: "2021", title: "Funding advice", text: "Certified as funding advisers." }, { year: "2026", title: "200 projects", text: "More than 200 successful projects." }] },
  },
};
