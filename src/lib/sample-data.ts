import type { LoveMessage, MenuItem, Order, ParsedMenuItem, TableSession } from "@/types/brewboard";

export const menuItems: MenuItem[] = [
  {
    id: "flat-white",
    name: "Velvet Flat White",
    description: "Double ristretto, silky milk, cocoa-dusted finish.",
    price: 245,
    category: "Coffee",
    accent: "caramel"
  },
  {
    id: "cold-brew",
    name: "Orange Cold Brew",
    description: "Slow-steeped coffee with orange peel and tonic fizz.",
    price: 290,
    category: "Coffee",
    accent: "sky"
  },
  {
    id: "masala-chai",
    name: "House Masala Chai",
    description: "Assam tea, ginger, cardamom, and jaggery warmth.",
    price: 180,
    category: "Tea",
    accent: "mint"
  },
  {
    id: "croissant",
    name: "Almond Croissant",
    description: "Buttery layers, toasted almonds, vanilla frangipane.",
    price: 260,
    category: "Bakes",
    accent: "blush"
  },
  {
    id: "toastie",
    name: "Pesto Melt Toastie",
    description: "Sourdough, mozzarella, basil pesto, grilled tomatoes.",
    price: 360,
    category: "Food",
    accent: "mint"
  },
  {
    id: "tiramisu",
    name: "Cloud Tiramisu Cup",
    description: "Espresso-soaked sponge, mascarpone, dark cocoa.",
    price: 320,
    category: "Desserts",
    accent: "lavender"
  }
];

export const tableSessions: TableSession[] = [
  {
    id: "table-7",
    tableNumber: "7",
    code: "BREW42",
    guestCount: 3,
    isClosed: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  },
  {
    id: "table-3",
    tableNumber: "3",
    code: "LATTE9",
    guestCount: 2,
    isClosed: false,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 7).toISOString()
  },
  {
    id: "table-12",
    tableNumber: "12",
    code: "CHAI77",
    guestCount: 4,
    isClosed: true,
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  }
];

export const orders: Order[] = [
  {
    id: "order-101",
    tableSessionId: "table-7",
    customer: { id: "aya", name: "Aya" },
    items: [
      { name: "Velvet Flat White", quantity: 1, price: 245 },
      { name: "Almond Croissant", quantity: 2, price: 260 }
    ],
    status: "preparing",
    createdAt: new Date(Date.now() - 1000 * 60 * 9).toISOString()
  },
  {
    id: "order-102",
    tableSessionId: "table-7",
    customer: { id: "kabir", name: "Kabir" },
    items: [{ name: "Orange Cold Brew", quantity: 1, price: 290 }],
    status: "received",
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString()
  },
  {
    id: "order-103",
    tableSessionId: "table-3",
    customer: { id: "nora", name: "Nora" },
    items: [{ name: "Pesto Melt Toastie", quantity: 2, price: 360 }],
    status: "ready",
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: "order-099",
    tableSessionId: "table-12",
    customer: { id: "mira", name: "Mira" },
    items: [{ name: "Cloud Tiramisu Cup", quantity: 4, price: 320 }],
    status: "complete",
    createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString()
  }
];

export const loveMessages: LoveMessage[] = [
  {
    id: "msg-1",
    tableSessionId: "table-7",
    body: "Your order is being prepared!",
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString()
  }
];

export const messageTemplates = [
  "Your order is being prepared!",
  "Your order is arriving in 5 minutes!",
  "Your order is on its way to the table!",
  "Thank you for your patience - almost there!",
  "Is there anything else we can help you with?"
];

export const parsedMenuDraft: ParsedMenuItem[] = [
  ...menuItems.slice(0, 4).map((item) => ({ ...item, flagged: false })),
  {
    id: "flagged-mocha",
    name: "Midnight Mocha",
    description: "Detected in one AI pass only. Please verify price and description.",
    price: 285,
    category: "Coffee",
    accent: "lavender",
    flagged: true
  }
];
