/**
 * In-memory demo store when Turso is not configured.
 * Transfers update balances so the recipient receives funds in the same runtime.
 */

export type DemoUser = {
  id: string;
  email: string;
  name: string;
  balance: number;
  is_verified: boolean;
  password: string;
};

export type DemoTx = {
  id: string;
  user_id: string;
  type: "transfer_in" | "transfer_out" | "topup";
  amount: number;
  counterpart: string;
  note: string;
  status: string;
  created_at: string;
};

const globalStore = globalThis as unknown as {
  __balapayUsers?: Map<string, DemoUser>;
  __balapayTx?: DemoTx[];
  __balapayEmailIndex?: Map<string, string>;
};

function users() {
  if (!globalStore.__balapayUsers) {
    globalStore.__balapayUsers = new Map();
    globalStore.__balapayEmailIndex = new Map();
    globalStore.__balapayTx = [];
    const demo: DemoUser = {
      id: "demo-user-id",
      email: "demo@balapay.com",
      name: "Demo User",
      balance: 12850.5,
      is_verified: true,
      password: "demo1234",
    };
    globalStore.__balapayUsers.set(demo.id, demo);
    globalStore.__balapayEmailIndex!.set(demo.email, demo.id);
  }
  return globalStore.__balapayUsers;
}

function emailIndex() {
  users();
  return globalStore.__balapayEmailIndex!;
}

function txs() {
  users();
  return globalStore.__balapayTx!;
}

export function demoGetUserById(id: string) {
  return users().get(id) || null;
}

export function demoGetUserByEmail(email: string) {
  const id = emailIndex().get(email.toLowerCase());
  if (!id) return null;
  return users().get(id) || null;
}

export function demoCreateUser(data: {
  email: string;
  name: string;
  password: string;
  is_verified?: boolean;
}) {
  if (emailIndex().has(data.email.toLowerCase())) {
    throw new Error("此電子郵件已被註冊");
  }
  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const user: DemoUser = {
    id,
    email: data.email.toLowerCase(),
    name: data.name,
    balance: 38,
    is_verified: data.is_verified ?? false,
    password: data.password,
  };
  users().set(id, user);
  emailIndex().set(user.email, id);
  return user;
}

export function demoUpdateBalance(userId: string, delta: number) {
  const u = users().get(userId);
  if (!u) return null;
  u.balance = Math.round((u.balance + delta) * 100) / 100;
  users().set(userId, u);
  return u;
}

export function demoAddTx(tx: Omit<DemoTx, "id" | "created_at" | "status">) {
  const full: DemoTx = {
    ...tx,
    id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "completed",
    created_at: new Date().toISOString(),
  };
  txs().unshift(full);
  return full;
}

export function demoGetTxs(userId: string) {
  return txs().filter((t) => t.user_id === userId);
}

export function demoTransfer(opts: {
  fromUserId: string;
  toEmail: string;
  amount: number;
  note?: string;
}) {
  const from = users().get(opts.fromUserId);
  if (!from) throw new Error("找不到付款帳戶");
  if (opts.amount <= 0) throw new Error("金額必須大於 0");
  if (from.balance < opts.amount) throw new Error("餘額不足");

  let to = demoGetUserByEmail(opts.toEmail);
  if (!to) {
    to = demoCreateUser({
      email: opts.toEmail,
      name: opts.toEmail.split("@")[0],
      password: "pending",
      is_verified: false,
    });
    to.balance = 0;
    users().set(to.id, to);
  }

  if (to.id === from.id) throw new Error("無法轉帳給自己");

  from.balance = Math.round((from.balance - opts.amount) * 100) / 100;
  to.balance = Math.round((to.balance + opts.amount) * 100) / 100;
  users().set(from.id, from);
  users().set(to.id, to);

  const note = opts.note || "";
  demoAddTx({
    user_id: from.id,
    type: "transfer_out",
    amount: -opts.amount,
    counterpart: to.email,
    note,
  });
  demoAddTx({
    user_id: to.id,
    type: "transfer_in",
    amount: opts.amount,
    counterpart: from.email,
    note,
  });

  return {
    fromBalance: from.balance,
    toEmail: to.email,
    toBalance: to.balance,
    amount: opts.amount,
  };
}
