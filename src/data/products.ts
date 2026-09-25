import type { Locale } from "./copy";

export type Product = {
  slug: string;
  photo: string;
  title: Record<Locale, string>;
  price: number;
  wasPrice: number;
  discountPct: number;
  rating: string;
  ratingCount: string;
  ad: boolean;
};

/**
 * The four cards in the PLP grid, in the order the Figma frames show them.
 * English titles are verbatim from the LTR frame; Arabic from the RTL frame.
 * Photos are the designer's own abaya shots, cropped 3:4 with heads intact.
 */
export const products: Product[] = [
  {
    slug: "kaftan-white",
    photo: "/img/products/kaftan-white.jpg",
    title: {
      en: "Jafran elegant White Kaftan Abaya for women",
      ar: "عباية كافتان بيضاء أنيقة", // Elegant white kaftan abaya
    },
    price: 123, wasPrice: 199, discountPct: 33, rating: "4.3", ratingCount: "128", ad: true,
  },
  {
    slug: "embellished-beige",
    photo: "/img/products/embellished-beige.jpg",
    title: {
      en: "Khizana Embelished Abaya",
      ar: "عباية خزانة مطرزة", // Khizana embellished abaya
    },
    price: 147, wasPrice: 199, discountPct: 26, rating: "4.3", ratingCount: "128", ad: true,
  },
  {
    slug: "ivory-layered",
    photo: "/img/products/ivory-layered.jpg",
    title: {
      en: "Elegant Ivory Kaatan Abaya with Layered Design",
      ar: "عباية عاجية بطبقات", // Ivory layered abaya
    },
    price: 165, wasPrice: 199, discountPct: 18, rating: "4.3", ratingCount: "128", ad: true,
  },
  {
    slug: "cream-shirt",
    photo: "/img/products/cream-shirt.jpg",
    title: {
      en: "Elegant Women’s Cream Abaya with Exquisite Detail",
      ar: "عباية قميص كريمي", // Cream shirt abaya
    },
    price: 139, wasPrice: 199, discountPct: 30, rating: "4.3", ratingCount: "128", ad: true,
  },
];
