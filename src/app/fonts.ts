import { Bitter, DM_Sans, Fraunces, Geist, Geist_Mono, Inter, Outfit, Playfair_Display, Plus_Jakarta_Sans, Source_Sans_3, Space_Grotesk } from "next/font/google";

// next/font self-hosts every family: visitors' browsers never contact Google.
export const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
export const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

// Template fonts for the kit preview. Not preloaded: a browser only downloads the ones a preview uses.
// Font loader options must be literals, so each call spells them out.
const inter = Inter({ subsets: ["latin"], preload: false, display: "swap", variable: "--kit-inter" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], preload: false, display: "swap", variable: "--kit-jakarta" });
const grotesk = Space_Grotesk({ subsets: ["latin"], preload: false, display: "swap", variable: "--kit-grotesk" });
const fraunces = Fraunces({ subsets: ["latin"], preload: false, display: "swap", style: ["normal", "italic"], variable: "--kit-fraunces" });
const bitter = Bitter({ subsets: ["latin"], preload: false, display: "swap", variable: "--kit-bitter" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], preload: false, display: "swap", variable: "--kit-source-sans" });
const dmSans = DM_Sans({ subsets: ["latin"], preload: false, display: "swap", variable: "--kit-dm-sans" });
const playfair = Playfair_Display({ subsets: ["latin"], preload: false, display: "swap", style: ["normal", "italic"], variable: "--kit-playfair" });
const outfit = Outfit({ subsets: ["latin"], preload: false, display: "swap", variable: "--kit-outfit" });

export const fontVariables = [geist, geistMono, inter, jakarta, grotesk, fraunces, bitter, sourceSans, dmSans, playfair, outfit].map(f => f.variable).join(" ");
