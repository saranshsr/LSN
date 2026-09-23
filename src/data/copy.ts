/**
 * Every string in the prototype, mirrored from the Figma `flow` section
 * (JovVwactrtpNkNSPfu4tsm → 278:110006) rather than from the copy decisions.
 *
 * The frames are English-only in the nudge and the sheet. That is a known gap
 * against the 21 Sep review (bilingual is mandatory) — see DIVERGENCES.md. It
 * is left as drawn on purpose so this prototype shows the design as it stands.
 *
 * Arabic carries an English gloss in a comment wherever it appears.
 */

export type Locale = "en" | "ar";

export const dirFor: Record<Locale, "ltr" | "rtl"> = { en: "ltr", ar: "rtl" };

/** The query the simulated user types — Arabic, on an English app. */
export const QUERY = "عبايات"; // "abayas"

export const SUGGESTIONS = [
  { text: "عبايات سوداء", gloss: "black abayas" },
  { text: "عبايات مطرزة", gloss: "embroidered abayas" },
  { text: "عبايات رسمية", gloss: "formal abayas" },
  { text: "عبايات كاجوال", gloss: "casual abayas" },
];

/** Shown while the app is still English — the offer to switch. */
export const nudge = {
  label: "Switch app to Arabic?",
  dismiss: "Not now",
  action: "Switch",
};

export const sheet = {
  title: "Switch the app to Arabic?",
  // Reads as truncated in the frame; mirrored verbatim, not repaired.
  body: "This will change the app’s language & layout. You can always switch back from the Account",
  bodyEmphasis: "Account",
  cancel: "Cancel",
  action: "Switch",
};

/** The splash that covers the reload. Latin letters in the frame, not هلا. */
export const splash = { greeting: "Hala" };

type Chrome = {
  searchPlaceholder: string;
  addressLabel: string;
  address: string;
  chips: string[];
  /** M-Bottomnav on the PLP. */
  nav: string[];
  /** Home runs the legacy "Main bottom Nav", whose fourth item reads Account. */
  homeNav: string[];
  card: {
    bestSeller: string;
    megaDeal: string;
    lowestPrice: string;
    extraOff: string;
    plusThree: string;
    express: string;
    getBy: string;
    ad: string;
    /** `mark` draws the dirham glyph; `text` prints د.إ, the way the RTL frame does. */
    currency: { kind: "mark" } | { kind: "text"; value: string };
  };
  home: {
    promoTitle: string;
    promoSub: string;
    pager: string;
    shopByCategory: string;
    /** Two rows of five, the way the frame's scroller is built. */
    categories: string[][];
    promo: { eyebrow: string; amount: string; title: string; sub: string; code: string; ad: string; terms: string };
  };
};

export const chrome: Record<Locale, Chrome> = {
  en: {
    searchPlaceholder: "Search for “Maybelline”",
    addressLabel: "Home",
    address: "BDA Complex, 100 Feet Rd, 3rd Block, Kora…",
    chips: ["Filter", "Sort", "Deals", "Brand", "Formal Abayas", "Ramadan", "Sports"],
    nav: ["Home", "Categories", "Deals", "Profile", "Cart"],
    homeNav: ["Home", "Categories", "Deals", "Account", "Cart"],
    card: {
      bestSeller: "Best Seller",
      megaDeal: "Mega Deal",
      lowestPrice: "Lowest price in 30 days",
      extraOff: "Extra 10% Off",
      plusThree: "+3",
      express: "express",
      getBy: "Get by 27 Sep",
      ad: "Ad",
      currency: { kind: "mark" },
    },
    home: {
      promoTitle: "10% cashback",
      promoSub: "on every E-Commerce spends",
      pager: "1/5",
      shopByCategory: "Shop by category",
      categories: [
        ["Beauty & Skin Care", "Grocery  & Kitchen", "Home Appliances", "Beauty & Skin Care", "Grocery  & Kitchen"],
        ["Toys  & Games", "Electronics & Tools", "Hair Care", "Shoes & Clothes", "Toys  & Games"],
      ],
      promo: {
        eyebrow: "Welcome! Earn",
        amount: "AED 50",
        title: "Cashback",
        sub: "on your first order",
        code: "Use Code: FREE50",
        ad: "Ad",
        terms: "*T&C Apply",
      },
    },
  },
  ar: {
    searchPlaceholder: "ابحث عن “ميبلين”", // Search for "Maybelline"
    addressLabel: "المنزل", // Home
    address: "مجمع BDA، شارع 100 قدم، البلوك الثالث",
    // Filter / Sort / Deals / Brand / Formal Abayas / Ramadan / Sports
    chips: ["فلتر", "ترتيب", "عروض", "الماركة", "عبايات رسمية", "رمضان", "رياضة"],
    // Home / Categories / Deals / Account / Cart
    nav: ["الرئيسية", "الفئات", "عروض", "الحساب", "العربة"],
    homeNav: ["الرئيسية", "الفئات", "عروض", "الحساب", "العربة"],
    card: {
      bestSeller: "الأكثر مبيعاً", // Best seller
      megaDeal: "عرض ضخم", // Mega deal
      lowestPrice: "أقل سعر خلال 30 يوماً", // Lowest price in 30 days — Western digits, as noon does
      // U+2066/2069 isolates keep "10%" and "+3" left-to-right inside the Arabic run.
      extraOff: "خصم إضافي \u2066" + "10%" + "\u2069", // Extra 10% off
      plusThree: "\u2066+3\u2069",
      express: "express", // stays Latin in the app
      getBy: "بحلول 27 سبتمبر", // by 27 Sep
      ad: "إعلان", // Ad
      currency: { kind: "text", value: "د.إ" },
    },
    home: {
      promoTitle: "10% كاش باك",
      promoSub: "على كل عمليات الشراء الإلكترونية",
      pager: "1/5",
      shopByCategory: "تسوق حسب الفئة",
      categories: [
        // Beauty & Skin Care / Grocery & Kitchen / Home Appliances / …
        ["الجمال والعناية بالبشرة", "البقالة والمطبخ", "الأجهزة المنزلية", "الجمال والعناية بالبشرة", "البقالة والمطبخ"],
        // Toys & Games / Electronics & Tools / Hair Care / Shoes & Clothes
        ["الألعاب", "الإلكترونيات والأدوات", "العناية بالشعر", "الأحذية والملابس", "الألعاب"],
      ],
      promo: {
        eyebrow: "مرحباً! اكسب",
        amount: "50 د.إ",
        title: "كاش باك",
        sub: "على أول طلب لك",
        code: "استخدم الكود: FREE50",
        ad: "إعلان",
        terms: "*تطبق الشروط والأحكام",
      },
    },
  },
};
