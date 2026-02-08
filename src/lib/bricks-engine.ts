// Bricks Builder JSON Template Engine
// Generates valid Bricks Builder element JSON for copy-paste

export interface BricksElement {
  id: string;
  name: string;
  parent: string | 0;
  children: string[];
  settings: Record<string, unknown>;
  label?: string;
}

export interface BricksTemplate {
  content: BricksElement[];
  source: string;
  sourceUrl: string;
  version: string;
  globalClasses: BricksGlobalClass[];
  globalElements: unknown[];
}

export interface BricksGlobalClass {
  id: string;
  name: string;
  settings: Record<string, unknown>;
}

// Generate a random 6-character hex ID (Bricks format)
export function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to create a Bricks element
export function createElement(
  name: string,
  parent: string | 0,
  settings: Record<string, unknown> = {},
  label?: string
): BricksElement {
  return {
    id: generateId(),
    name,
    parent,
    children: [],
    settings,
    ...(label ? { label } : {}),
  };
}

// Link parent and child elements
function linkElements(parent: BricksElement, child: BricksElement): void {
  parent.children.push(child.id);
  child.parent = parent.id;
}

// Wrap content in a template export format
export function wrapTemplate(
  elements: BricksElement[],
  globalClasses: BricksGlobalClass[] = []
): BricksTemplate {
  return {
    content: elements,
    source: "bricksCopiedElements",
    sourceUrl: "",
    version: "1.12.2",
    globalClasses,
    globalElements: [],
  };
}

// ----- TEMPLATE GENERATORS -----

export function generateHeroSection(
  headline: string = "Build Something Amazing",
  subtext: string = "Create stunning websites with our powerful tools and intuitive design system.",
  buttonText: string = "Get Started",
  buttonLink: string = "#",
  style: "centered" | "split" | "gradient" = "centered"
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: {
      top: "100",
      bottom: "100",
      left: "40",
      right: "40",
    },
    ...(style === "gradient"
      ? {
          _background: {
            color: {
              hex: "#0f172a",
            },
            image: {
              url: "",
            },
          },
        }
      : style === "centered"
      ? {
          _background: {
            color: {
              hex: "#ffffff",
            },
          },
        }
      : {
          _background: {
            color: {
              hex: "#f8fafc",
            },
          },
        }),
  }, "Hero Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: style === "split" ? "row" : "column",
    _justifyContent: "center",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
    ...(style === "split"
      ? { _gap: "60px" }
      : {}),
  });
  linkElements(section, container);
  elements.push(container);

  const contentBlock = createElement("block", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: style === "split" ? "flex-start" : "center",
    _gap: "24px",
    ...(style === "split" ? { _width: "50%" } : { _width: "100%", _textAlign: "center" }),
  });
  linkElements(container, contentBlock);
  elements.push(contentBlock);

  const heading = createElement("heading", contentBlock.id, {
    text: headline,
    tag: "h1",
    _typography: {
      "font-size": style === "gradient" ? "56px" : "48px",
      "font-weight": "800",
      "line-height": "1.1",
      "letter-spacing": "-0.02em",
      color: {
        hex: style === "gradient" ? "#ffffff" : "#0f172a",
      },
    },
    _margin: { bottom: "16" },
  });
  linkElements(contentBlock, heading);
  elements.push(heading);

  const text = createElement("text-basic", contentBlock.id, {
    text: `<p>${subtext}</p>`,
    _typography: {
      "font-size": "20px",
      "line-height": "1.6",
      color: {
        hex: style === "gradient" ? "#94a3b8" : "#64748b",
      },
    },
    _width: style === "split" ? "100%" : "600px",
    _margin: { bottom: "16" },
  });
  linkElements(contentBlock, text);
  elements.push(text);

  const buttonWrapper = createElement("block", contentBlock.id, {
    _display: "flex",
    _direction: "row",
    _gap: "16px",
    _justifyContent: style === "split" ? "flex-start" : "center",
  });
  linkElements(contentBlock, buttonWrapper);
  elements.push(buttonWrapper);

  const primaryBtn = createElement("text-basic", buttonWrapper.id, {
    text: `<p>${buttonText}</p>`,
    tag: "a",
    link: { type: "external", url: buttonLink },
    _padding: { top: "16", bottom: "16", left: "32", right: "32" },
    _background: {
      color: { hex: "#3b82f6" },
    },
    _border: {
      radius: { top: "8", right: "8", bottom: "8", left: "8" },
    },
    _typography: {
      "font-size": "16px",
      "font-weight": "600",
      color: { hex: "#ffffff" },
      "text-decoration": "none",
    },
    _attributes: [{ name: "role", value: "button" }],
  });
  linkElements(buttonWrapper, primaryBtn);
  elements.push(primaryBtn);

  const secondaryBtn = createElement("text-basic", buttonWrapper.id, {
    text: "<p>Learn More</p>",
    tag: "a",
    link: { type: "external", url: "#" },
    _padding: { top: "16", bottom: "16", left: "32", right: "32" },
    _background: {
      color: { hex: "transparent" },
    },
    _border: {
      radius: { top: "8", right: "8", bottom: "8", left: "8" },
      width: { top: "2", right: "2", bottom: "2", left: "2" },
      style: "solid",
      color: { hex: style === "gradient" ? "#475569" : "#e2e8f0" },
    },
    _typography: {
      "font-size": "16px",
      "font-weight": "600",
      color: { hex: style === "gradient" ? "#e2e8f0" : "#334155" },
      "text-decoration": "none",
    },
  });
  linkElements(buttonWrapper, secondaryBtn);
  elements.push(secondaryBtn);

  if (style === "split") {
    const imageBlock = createElement("block", container.id, {
      _width: "50%",
    });
    linkElements(container, imageBlock);
    elements.push(imageBlock);

    const image = createElement("image", imageBlock.id, {
      image: {
        url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
        filename: "hero-image.jpg",
      },
      _border: {
        radius: { top: "16", right: "16", bottom: "16", left: "16" },
      },
      _width: "100%",
      _objectFit: "cover",
    });
    linkElements(imageBlock, image);
    elements.push(image);
  }

  return elements;
}

export function generateNavbar(
  brandName: string = "BrandName",
  links: Array<{ text: string; url: string }> = [
    { text: "Home", url: "/" },
    { text: "Features", url: "#features" },
    { text: "Pricing", url: "#pricing" },
    { text: "Contact", url: "#contact" },
  ],
  ctaText: string = "Sign Up"
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "0", bottom: "0", left: "0", right: "0" },
    _background: { color: { hex: "#ffffff" } },
    _border: {
      width: { bottom: "1" },
      style: "solid",
      color: { hex: "#e2e8f0" },
    },
    _position: "sticky",
    _top: "0",
    _zIndex: "50",
  }, "Navbar");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "row",
    _justifyContent: "space-between",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
    _padding: { top: "16", bottom: "16", left: "24", right: "24" },
  });
  linkElements(section, container);
  elements.push(container);

  const brand = createElement("heading", container.id, {
    text: brandName,
    tag: "h3",
    _typography: {
      "font-size": "24px",
      "font-weight": "700",
      color: { hex: "#0f172a" },
    },
  });
  linkElements(container, brand);
  elements.push(brand);

  const navBlock = createElement("block", container.id, {
    _display: "flex",
    _direction: "row",
    _gap: "32px",
    _alignItems: "center",
  });
  linkElements(container, navBlock);
  elements.push(navBlock);

  for (const link of links) {
    const navLink = createElement("text-basic", navBlock.id, {
      text: `<p>${link.text}</p>`,
      tag: "a",
      link: { type: "external", url: link.url },
      _typography: {
        "font-size": "15px",
        "font-weight": "500",
        color: { hex: "#475569" },
        "text-decoration": "none",
      },
    });
    linkElements(navBlock, navLink);
    elements.push(navLink);
  }

  const ctaBtn = createElement("text-basic", navBlock.id, {
    text: `<p>${ctaText}</p>`,
    tag: "a",
    link: { type: "external", url: "#" },
    _padding: { top: "10", bottom: "10", left: "24", right: "24" },
    _background: { color: { hex: "#3b82f6" } },
    _border: {
      radius: { top: "8", right: "8", bottom: "8", left: "8" },
    },
    _typography: {
      "font-size": "15px",
      "font-weight": "600",
      color: { hex: "#ffffff" },
      "text-decoration": "none",
    },
  });
  linkElements(navBlock, ctaBtn);
  elements.push(ctaBtn);

  return elements;
}

export function generateFeaturesSection(
  sectionTitle: string = "Why Choose Us",
  sectionSubtitle: string = "Everything you need to build modern websites",
  features: Array<{ title: string; description: string; icon?: string }> = [
    {
      title: "Lightning Fast",
      description: "Optimized for speed with instant load times and smooth interactions.",
    },
    {
      title: "Fully Responsive",
      description: "Looks perfect on every device, from mobile to desktop.",
    },
    {
      title: "Easy to Customize",
      description: "Modify colors, fonts, and layouts with a few clicks.",
    },
    {
      title: "SEO Optimized",
      description: "Built with best practices for search engine visibility.",
    },
    {
      title: "Secure by Default",
      description: "Enterprise-grade security built into every component.",
    },
    {
      title: "24/7 Support",
      description: "Our team is always here to help you succeed.",
    },
  ]
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: "#f8fafc" } },
  }, "Features Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("block", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
    _width: "100%",
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: sectionTitle,
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: "#0f172a" },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: `<p>${sectionSubtitle}</p>`,
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: "#64748b" },
    },
    _width: "600px",
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  const grid = createElement("block", container.id, {
    _display: "grid",
    _gridTemplateColumns: "repeat(3, 1fr)",
    _gap: "32px",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  const iconColors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const card = createElement("block", grid.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "32", bottom: "32", left: "32", right: "32" },
      _background: { color: { hex: "#ffffff" } },
      _border: {
        radius: { top: "12", right: "12", bottom: "12", left: "12" },
        width: { top: "1", right: "1", bottom: "1", left: "1" },
        style: "solid",
        color: { hex: "#e2e8f0" },
      },
      _gap: "16px",
    });
    linkElements(grid, card);
    elements.push(card);

    const iconWrapper = createElement("block", card.id, {
      _width: "48px",
      _height: "48px",
      _background: {
        color: { hex: iconColors[i % iconColors.length] + "15" },
      },
      _border: {
        radius: { top: "10", right: "10", bottom: "10", left: "10" },
      },
      _justifyContent: "center",
      _alignItems: "center",
      _display: "flex",
    });
    linkElements(card, iconWrapper);
    elements.push(iconWrapper);

    const iconText = createElement("text-basic", iconWrapper.id, {
      text: `<p style="font-size:24px">&#9733;</p>`,
      _typography: {
        "font-size": "24px",
        color: { hex: iconColors[i % iconColors.length] },
      },
    });
    linkElements(iconWrapper, iconText);
    elements.push(iconText);

    const featureTitle = createElement("heading", card.id, {
      text: feature.title,
      tag: "h3",
      _typography: {
        "font-size": "20px",
        "font-weight": "600",
        "line-height": "1.4",
        color: { hex: "#0f172a" },
      },
    });
    linkElements(card, featureTitle);
    elements.push(featureTitle);

    const featureDesc = createElement("text-basic", card.id, {
      text: `<p>${feature.description}</p>`,
      _typography: {
        "font-size": "15px",
        "line-height": "1.6",
        color: { hex: "#64748b" },
      },
    });
    linkElements(card, featureDesc);
    elements.push(featureDesc);
  }

  return elements;
}

export function generatePricingSection(
  plans: Array<{
    name: string;
    price: string;
    period: string;
    features: string[];
    highlighted?: boolean;
    buttonText?: string;
  }> = [
    {
      name: "Starter",
      price: "$9",
      period: "/month",
      features: ["5 Projects", "Basic Analytics", "Email Support", "1GB Storage"],
      buttonText: "Start Free",
    },
    {
      name: "Professional",
      price: "$29",
      period: "/month",
      features: ["Unlimited Projects", "Advanced Analytics", "Priority Support", "50GB Storage", "Custom Domain", "API Access"],
      highlighted: true,
      buttonText: "Get Started",
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      features: ["Everything in Pro", "Dedicated Support", "Unlimited Storage", "SSO & SAML", "SLA Guarantee", "Custom Integrations"],
      buttonText: "Contact Sales",
    },
  ]
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: "#0f172a" } },
  }, "Pricing Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("block", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const badge = createElement("text-basic", headerBlock.id, {
    text: "<p>Pricing</p>",
    _padding: { top: "6", bottom: "6", left: "16", right: "16" },
    _background: { color: { hex: "#1e3a5f" } },
    _border: {
      radius: { top: "100", right: "100", bottom: "100", left: "100" },
    },
    _typography: {
      "font-size": "13px",
      "font-weight": "600",
      color: { hex: "#60a5fa" },
      "text-transform": "uppercase",
      "letter-spacing": "0.05em",
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, badge);
  elements.push(badge);

  const title = createElement("heading", headerBlock.id, {
    text: "Simple, transparent pricing",
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: "#ffffff" },
    },
    _margin: { bottom: "16" },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const subtitle = createElement("text-basic", headerBlock.id, {
    text: "<p>Choose the plan that fits your needs. Upgrade or downgrade anytime.</p>",
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: "#94a3b8" },
    },
  });
  linkElements(headerBlock, subtitle);
  elements.push(subtitle);

  const grid = createElement("block", container.id, {
    _display: "flex",
    _direction: "row",
    _gap: "24px",
    _justifyContent: "center",
    _alignItems: "stretch",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  for (const plan of plans) {
    const card = createElement("block", grid.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "40", bottom: "40", left: "32", right: "32" },
      _background: {
        color: { hex: plan.highlighted ? "#1e293b" : "#111827" },
      },
      _border: {
        radius: { top: "16", right: "16", bottom: "16", left: "16" },
        width: { top: "1", right: "1", bottom: "1", left: "1" },
        style: "solid",
        color: { hex: plan.highlighted ? "#3b82f6" : "#1e293b" },
      },
      _width: "33.333%",
      _gap: "24px",
      ...(plan.highlighted
        ? {
            _boxShadow: {
              values: { offsetY: "8", blur: "40", spread: "-12" },
              color: { hex: "#3b82f680" },
            },
            _transform: "scale(1.05)",
          }
        : {}),
    });
    linkElements(grid, card);
    elements.push(card);

    if (plan.highlighted) {
      const popularBadge = createElement("text-basic", card.id, {
        text: "<p>Most Popular</p>",
        _padding: { top: "4", bottom: "4", left: "12", right: "12" },
        _background: { color: { hex: "#3b82f6" } },
        _border: {
          radius: { top: "6", right: "6", bottom: "6", left: "6" },
        },
        _typography: {
          "font-size": "12px",
          "font-weight": "600",
          color: { hex: "#ffffff" },
        },
        _alignSelf: "flex-start",
      });
      linkElements(card, popularBadge);
      elements.push(popularBadge);
    }

    const planName = createElement("heading", card.id, {
      text: plan.name,
      tag: "h3",
      _typography: {
        "font-size": "20px",
        "font-weight": "600",
        color: { hex: "#e2e8f0" },
      },
    });
    linkElements(card, planName);
    elements.push(planName);

    const priceBlock = createElement("block", card.id, {
      _display: "flex",
      _direction: "row",
      _alignItems: "baseline",
      _gap: "4px",
    });
    linkElements(card, priceBlock);
    elements.push(priceBlock);

    const price = createElement("heading", priceBlock.id, {
      text: plan.price,
      tag: "custom",
      customTag: "span",
      _typography: {
        "font-size": "48px",
        "font-weight": "800",
        color: { hex: "#ffffff" },
      },
    });
    linkElements(priceBlock, price);
    elements.push(price);

    const period = createElement("text-basic", priceBlock.id, {
      text: `<p>${plan.period}</p>`,
      _typography: {
        "font-size": "16px",
        color: { hex: "#94a3b8" },
      },
    });
    linkElements(priceBlock, period);
    elements.push(period);

    const featureList = createElement("block", card.id, {
      _display: "flex",
      _direction: "column",
      _gap: "12px",
      _margin: { top: "8", bottom: "8" },
    });
    linkElements(card, featureList);
    elements.push(featureList);

    for (const feature of plan.features) {
      const featureItem = createElement("text-basic", featureList.id, {
        text: `<p>&#10003;  ${feature}</p>`,
        _typography: {
          "font-size": "15px",
          "line-height": "1.6",
          color: { hex: "#cbd5e1" },
        },
      });
      linkElements(featureList, featureItem);
      elements.push(featureItem);
    }

    const button = createElement("text-basic", card.id, {
      text: `<p>${plan.buttonText || "Get Started"}</p>`,
      tag: "a",
      link: { type: "external", url: "#" },
      _padding: { top: "14", bottom: "14", left: "24", right: "24" },
      _background: {
        color: { hex: plan.highlighted ? "#3b82f6" : "transparent" },
      },
      _border: {
        radius: { top: "10", right: "10", bottom: "10", left: "10" },
        ...(plan.highlighted
          ? {}
          : {
              width: { top: "1", right: "1", bottom: "1", left: "1" },
              style: "solid",
              color: { hex: "#334155" },
            }),
      },
      _typography: {
        "font-size": "16px",
        "font-weight": "600",
        color: { hex: "#ffffff" },
        "text-align": "center",
        "text-decoration": "none",
      },
      _margin: { top: "auto" },
    });
    linkElements(card, button);
    elements.push(button);
  }

  return elements;
}

export function generateTestimonialsSection(
  testimonials: Array<{
    quote: string;
    author: string;
    role: string;
    rating?: number;
  }> = [
    {
      quote: "This product completely transformed how we build websites. The speed and quality are unmatched.",
      author: "Sarah Johnson",
      role: "CEO, TechStart",
      rating: 5,
    },
    {
      quote: "I've tried dozens of tools, but nothing comes close to the flexibility and power offered here.",
      author: "Michael Chen",
      role: "Lead Developer, Acme Corp",
      rating: 5,
    },
    {
      quote: "The templates saved us weeks of development time. Our clients are thrilled with the results.",
      author: "Emily Rodriguez",
      role: "Design Director, Creative Labs",
      rating: 5,
    },
  ]
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: "#ffffff" } },
  }, "Testimonials");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
  });
  linkElements(section, container);
  elements.push(container);

  const headerBlock = createElement("block", container.id, {
    _display: "flex",
    _direction: "column",
    _alignItems: "center",
    _textAlign: "center",
    _margin: { bottom: "60" },
  });
  linkElements(container, headerBlock);
  elements.push(headerBlock);

  const title = createElement("heading", headerBlock.id, {
    text: "What Our Customers Say",
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: "#0f172a" },
    },
  });
  linkElements(headerBlock, title);
  elements.push(title);

  const grid = createElement("block", container.id, {
    _display: "flex",
    _direction: "row",
    _gap: "24px",
    _width: "100%",
  });
  linkElements(container, grid);
  elements.push(grid);

  for (const testimonial of testimonials) {
    const card = createElement("block", grid.id, {
      _display: "flex",
      _direction: "column",
      _padding: { top: "32", bottom: "32", left: "32", right: "32" },
      _background: { color: { hex: "#f8fafc" } },
      _border: {
        radius: { top: "16", right: "16", bottom: "16", left: "16" },
      },
      _width: "33.333%",
      _gap: "20px",
    });
    linkElements(grid, card);
    elements.push(card);

    if (testimonial.rating) {
      const stars = createElement("text-basic", card.id, {
        text: `<p>${"&#9733;".repeat(testimonial.rating)}</p>`,
        _typography: {
          "font-size": "20px",
          color: { hex: "#f59e0b" },
        },
      });
      linkElements(card, stars);
      elements.push(stars);
    }

    const quote = createElement("text-basic", card.id, {
      text: `<p>"${testimonial.quote}"</p>`,
      _typography: {
        "font-size": "16px",
        "line-height": "1.7",
        color: { hex: "#334155" },
        "font-style": "italic",
      },
    });
    linkElements(card, quote);
    elements.push(quote);

    const authorBlock = createElement("block", card.id, {
      _display: "flex",
      _direction: "column",
      _gap: "4px",
      _margin: { top: "auto" },
    });
    linkElements(card, authorBlock);
    elements.push(authorBlock);

    const authorName = createElement("heading", authorBlock.id, {
      text: testimonial.author,
      tag: "h4",
      _typography: {
        "font-size": "16px",
        "font-weight": "600",
        color: { hex: "#0f172a" },
      },
    });
    linkElements(authorBlock, authorName);
    elements.push(authorName);

    const authorRole = createElement("text-basic", authorBlock.id, {
      text: `<p>${testimonial.role}</p>`,
      _typography: {
        "font-size": "14px",
        color: { hex: "#64748b" },
      },
    });
    linkElements(authorBlock, authorRole);
    elements.push(authorRole);
  }

  return elements;
}

export function generateFooterSection(
  brandName: string = "BrandName",
  columns: Array<{
    title: string;
    links: Array<{ text: string; url: string }>;
  }> = [
    {
      title: "Product",
      links: [
        { text: "Features", url: "#" },
        { text: "Pricing", url: "#" },
        { text: "Templates", url: "#" },
        { text: "Integrations", url: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { text: "About", url: "#" },
        { text: "Blog", url: "#" },
        { text: "Careers", url: "#" },
        { text: "Contact", url: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { text: "Documentation", url: "#" },
        { text: "Help Center", url: "#" },
        { text: "Community", url: "#" },
        { text: "Status", url: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { text: "Privacy", url: "#" },
        { text: "Terms", url: "#" },
        { text: "Cookie Policy", url: "#" },
      ],
    },
  ]
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "80", bottom: "40", left: "40", right: "40" },
    _background: { color: { hex: "#0f172a" } },
  }, "Footer");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
    _gap: "60px",
  });
  linkElements(section, container);
  elements.push(container);

  const topRow = createElement("block", container.id, {
    _display: "flex",
    _direction: "row",
    _justifyContent: "space-between",
    _gap: "40px",
    _width: "100%",
  });
  linkElements(container, topRow);
  elements.push(topRow);

  const brandBlock = createElement("block", topRow.id, {
    _display: "flex",
    _direction: "column",
    _gap: "16px",
    _width: "280px",
  });
  linkElements(topRow, brandBlock);
  elements.push(brandBlock);

  const brand = createElement("heading", brandBlock.id, {
    text: brandName,
    tag: "h3",
    _typography: {
      "font-size": "24px",
      "font-weight": "700",
      color: { hex: "#ffffff" },
    },
  });
  linkElements(brandBlock, brand);
  elements.push(brand);

  const brandDesc = createElement("text-basic", brandBlock.id, {
    text: "<p>Building the future of web design, one template at a time.</p>",
    _typography: {
      "font-size": "15px",
      "line-height": "1.6",
      color: { hex: "#94a3b8" },
    },
  });
  linkElements(brandBlock, brandDesc);
  elements.push(brandDesc);

  for (const column of columns) {
    const colBlock = createElement("block", topRow.id, {
      _display: "flex",
      _direction: "column",
      _gap: "16px",
    });
    linkElements(topRow, colBlock);
    elements.push(colBlock);

    const colTitle = createElement("heading", colBlock.id, {
      text: column.title,
      tag: "h4",
      _typography: {
        "font-size": "14px",
        "font-weight": "600",
        color: { hex: "#e2e8f0" },
        "text-transform": "uppercase",
        "letter-spacing": "0.05em",
      },
      _margin: { bottom: "8" },
    });
    linkElements(colBlock, colTitle);
    elements.push(colTitle);

    for (const link of column.links) {
      const linkEl = createElement("text-basic", colBlock.id, {
        text: `<p>${link.text}</p>`,
        tag: "a",
        link: { type: "external", url: link.url },
        _typography: {
          "font-size": "15px",
          color: { hex: "#94a3b8" },
          "text-decoration": "none",
        },
      });
      linkElements(colBlock, linkEl);
      elements.push(linkEl);
    }
  }

  const divider = createElement("block", container.id, {
    _width: "100%",
    _height: "1px",
    _background: { color: { hex: "#1e293b" } },
  });
  linkElements(container, divider);
  elements.push(divider);

  const bottomRow = createElement("block", container.id, {
    _display: "flex",
    _direction: "row",
    _justifyContent: "space-between",
    _alignItems: "center",
    _width: "100%",
  });
  linkElements(container, bottomRow);
  elements.push(bottomRow);

  const copyright = createElement("text-basic", bottomRow.id, {
    text: `<p>&copy; 2026 ${brandName}. All rights reserved.</p>`,
    _typography: {
      "font-size": "14px",
      color: { hex: "#64748b" },
    },
  });
  linkElements(bottomRow, copyright);
  elements.push(copyright);

  return elements;
}

export function generateCTASection(
  headline: string = "Ready to Get Started?",
  subtext: string = "Join thousands of creators who are already building amazing websites.",
  buttonText: string = "Start Building Now",
  style: "simple" | "gradient-card" = "gradient-card"
): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: {
      color: { hex: style === "gradient-card" ? "#f8fafc" : "#3b82f6" },
    },
  }, "CTA Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "column",
    _alignItems: "center",
    _width: "900px",
    _margin: { left: "auto", right: "auto" },
    ...(style === "gradient-card"
      ? {
          _padding: { top: "80", bottom: "80", left: "60", right: "60" },
          _background: {
            color: { hex: "#1e293b" },
          },
          _border: {
            radius: { top: "24", right: "24", bottom: "24", left: "24" },
          },
        }
      : {}),
    _textAlign: "center",
    _gap: "24px",
  });
  linkElements(section, container);
  elements.push(container);

  const title = createElement("heading", container.id, {
    text: headline,
    tag: "h2",
    _typography: {
      "font-size": "40px",
      "font-weight": "700",
      "line-height": "1.2",
      color: { hex: "#ffffff" },
    },
  });
  linkElements(container, title);
  elements.push(title);

  const text = createElement("text-basic", container.id, {
    text: `<p>${subtext}</p>`,
    _typography: {
      "font-size": "18px",
      "line-height": "1.6",
      color: { hex: "#94a3b8" },
    },
    _width: "600px",
  });
  linkElements(container, text);
  elements.push(text);

  const button = createElement("text-basic", container.id, {
    text: `<p>${buttonText}</p>`,
    tag: "a",
    link: { type: "external", url: "#" },
    _padding: { top: "16", bottom: "16", left: "40", right: "40" },
    _background: { color: { hex: "#3b82f6" } },
    _border: {
      radius: { top: "10", right: "10", bottom: "10", left: "10" },
    },
    _typography: {
      "font-size": "18px",
      "font-weight": "600",
      color: { hex: "#ffffff" },
      "text-decoration": "none",
    },
    _margin: { top: "8" },
  });
  linkElements(container, button);
  elements.push(button);

  return elements;
}

export function generateContactSection(): BricksElement[] {
  const elements: BricksElement[] = [];

  const section = createElement("section", 0, {
    _padding: { top: "100", bottom: "100", left: "40", right: "40" },
    _background: { color: { hex: "#ffffff" } },
  }, "Contact Section");
  elements.push(section);

  const container = createElement("container", section.id, {
    _direction: "row",
    _width: "1200px",
    _margin: { left: "auto", right: "auto" },
    _gap: "60px",
    _alignItems: "flex-start",
  });
  linkElements(section, container);
  elements.push(container);

  // Left info
  const infoBlock = createElement("block", container.id, {
    _display: "flex",
    _direction: "column",
    _width: "40%",
    _gap: "24px",
  });
  linkElements(container, infoBlock);
  elements.push(infoBlock);

  const title = createElement("heading", infoBlock.id, {
    text: "Get in Touch",
    tag: "h2",
    _typography: {
      "font-size": "36px",
      "font-weight": "700",
      color: { hex: "#0f172a" },
    },
  });
  linkElements(infoBlock, title);
  elements.push(title);

  const desc = createElement("text-basic", infoBlock.id, {
    text: "<p>Have a question or want to work together? We'd love to hear from you.</p>",
    _typography: {
      "font-size": "16px",
      "line-height": "1.7",
      color: { hex: "#64748b" },
    },
  });
  linkElements(infoBlock, desc);
  elements.push(desc);

  const contactItems = [
    { label: "Email", value: "hello@example.com" },
    { label: "Phone", value: "+1 (555) 123-4567" },
    { label: "Address", value: "123 Main Street, City, Country" },
  ];

  for (const item of contactItems) {
    const itemBlock = createElement("block", infoBlock.id, {
      _display: "flex",
      _direction: "column",
      _gap: "4px",
    });
    linkElements(infoBlock, itemBlock);
    elements.push(itemBlock);

    const label = createElement("text-basic", itemBlock.id, {
      text: `<p><strong>${item.label}</strong></p>`,
      _typography: {
        "font-size": "14px",
        "font-weight": "600",
        color: { hex: "#0f172a" },
      },
    });
    linkElements(itemBlock, label);
    elements.push(label);

    const value = createElement("text-basic", itemBlock.id, {
      text: `<p>${item.value}</p>`,
      _typography: {
        "font-size": "15px",
        color: { hex: "#64748b" },
      },
    });
    linkElements(itemBlock, value);
    elements.push(value);
  }

  // Right form
  const formBlock = createElement("block", container.id, {
    _display: "flex",
    _direction: "column",
    _width: "60%",
    _padding: { top: "40", bottom: "40", left: "40", right: "40" },
    _background: { color: { hex: "#f8fafc" } },
    _border: {
      radius: { top: "16", right: "16", bottom: "16", left: "16" },
    },
    _gap: "20px",
  });
  linkElements(container, formBlock);
  elements.push(formBlock);

  const form = createElement("form", formBlock.id, {
    fields: [
      { type: "text", label: "Full Name", placeholder: "John Doe", required: true, id: generateId() },
      { type: "email", label: "Email", placeholder: "john@example.com", required: true, id: generateId() },
      { type: "text", label: "Subject", placeholder: "How can we help?", required: false, id: generateId() },
      { type: "textarea", label: "Message", placeholder: "Tell us more...", required: true, id: generateId() },
    ],
    submitButtonText: "Send Message",
    submitButtonStyle: "primary",
    submitButtonBackgroundColor: { hex: "#3b82f6" },
    submitButtonTypography: {
      "font-size": "16px",
      "font-weight": "600",
      color: { hex: "#ffffff" },
    },
    submitButtonBorder: {
      radius: { top: "8", right: "8", bottom: "8", left: "8" },
    },
    fieldBackgroundColor: { hex: "#ffffff" },
    fieldBorder: {
      radius: { top: "8", right: "8", bottom: "8", left: "8" },
      width: { top: "1", right: "1", bottom: "1", left: "1" },
      style: "solid",
      color: { hex: "#e2e8f0" },
    },
    fieldTypography: {
      "font-size": "15px",
      color: { hex: "#334155" },
    },
    labelTypography: {
      "font-size": "14px",
      "font-weight": "500",
      color: { hex: "#334155" },
    },
    showLabels: true,
    actions: ["email"],
    emailTo: "admin_email",
    successMessage: "Thank you! Your message has been sent successfully.",
  });
  linkElements(formBlock, form);
  elements.push(form);

  return elements;
}

// Full page generator
export function generateFullPage(
  config: {
    brandName?: string;
    headline?: string;
    subtext?: string;
    includeNavbar?: boolean;
    includeHero?: boolean;
    includeFeatures?: boolean;
    includePricing?: boolean;
    includeTestimonials?: boolean;
    includeCTA?: boolean;
    includeContact?: boolean;
    includeFooter?: boolean;
  } = {}
): BricksElement[] {
  const {
    brandName = "BrandName",
    headline,
    subtext,
    includeNavbar = true,
    includeHero = true,
    includeFeatures = true,
    includePricing = true,
    includeTestimonials = true,
    includeCTA = true,
    includeContact = false,
    includeFooter = true,
  } = config;

  let elements: BricksElement[] = [];

  if (includeNavbar) elements = [...elements, ...generateNavbar(brandName)];
  if (includeHero) elements = [...elements, ...generateHeroSection(headline, subtext)];
  if (includeFeatures) elements = [...elements, ...generateFeaturesSection()];
  if (includeTestimonials) elements = [...elements, ...generateTestimonialsSection()];
  if (includePricing) elements = [...elements, ...generatePricingSection()];
  if (includeCTA) elements = [...elements, ...generateCTASection()];
  if (includeContact) elements = [...elements, ...generateContactSection()];
  if (includeFooter) elements = [...elements, ...generateFooterSection(brandName)];

  return elements;
}
