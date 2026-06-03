export type OrderStatus = "received" | "preparing" | "ready" | "complete";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  accent: "caramel" | "mint" | "sky" | "blush" | "lavender";
};

export type CartLine = {
  item: MenuItem;
  quantity: number;
};

export type Customer = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export type Order = {
  id: string;
  tableSessionId: string;
  customer: Customer;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  status: OrderStatus;
  createdAt: string;
};

export type LoveMessage = {
  id: string;
  tableSessionId: string;
  body: string;
  createdAt: string;
};

export type TableSession = {
  id: string;
  tableNumber: string;
  code: string;
  guestCount: number;
  isClosed: boolean;
  lastActiveAt: string;
};

export type ParsedMenuItem = MenuItem & {
  flagged: boolean;
};
