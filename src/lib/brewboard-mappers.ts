import type { LoveMessage, MenuItem, Order, OrderStatus, TableSession } from "@/types/brewboard";

type MenuRow = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  category: string;
  image_url: string | null;
  accent: MenuItem["accent"];
};

type TableRow = {
  id: string;
  table_number: string;
  code: string;
  guest_count: number;
  is_closed: boolean;
  last_active_at: string;
};

type OrderRow = {
  id: string;
  table_session_id: string;
  customer_name: string;
  customer_avatar_url: string | null;
  items: unknown;
  status: OrderStatus;
  created_at: string;
};

type MessageRow = {
  id: string;
  table_session_id: string;
  body: string;
  created_at: string;
};

type OrderItem = Order["items"][number];

function isOrderItem(value: unknown): value is OrderItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.name === "string" && typeof item.quantity === "number" && typeof item.price === "number";
}

export function mapMenuItem(row: MenuRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    imageUrl: row.image_url ?? undefined,
    accent: row.accent
  };
}

export function mapTableSession(row: TableRow): TableSession {
  return {
    id: row.id,
    tableNumber: row.table_number,
    code: row.code,
    guestCount: row.guest_count,
    isClosed: row.is_closed,
    lastActiveAt: row.last_active_at
  };
}

export function mapOrder(row: OrderRow): Order {
  const items = Array.isArray(row.items) ? row.items.filter(isOrderItem) : [];

  return {
    id: row.id,
    tableSessionId: row.table_session_id,
    customer: {
      id: row.customer_name.toLowerCase().replace(/\s+/g, "-"),
      name: row.customer_name,
      avatarUrl: row.customer_avatar_url ?? undefined
    },
    items,
    status: row.status,
    createdAt: row.created_at
  };
}

export function mapLoveMessage(row: MessageRow): LoveMessage {
  return {
    id: row.id,
    tableSessionId: row.table_session_id,
    body: row.body,
    createdAt: row.created_at
  };
}
