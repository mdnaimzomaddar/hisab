import { create } from "zustand";
import { LOAN_CATEGORY } from "./defaults";
import { loanRemaining } from "./selectors";
import { clearData, createInitialData, loadData, saveData } from "./storage";
import { AppData, Category, Loan, LoanDirection, Transaction } from "./types";
import { generateId } from "./utils/id";
import { roundMoney } from "./utils/money";

export type NewTransaction = Omit<
  Transaction,
  "id" | "createdAt" | "loanId" | "paymentId"
>;
export type NewCategory = Pick<Category, "name" | "type" | "icon" | "color">;
export type NewLoan = {
  direction: LoanDirection;
  person: string;
  principal: number;
  date: string;
  dueDate?: string;
  note: string;
};
export type LoanPatch = Partial<
  Pick<Loan, "person" | "principal" | "date" | "dueDate" | "note">
>;

// ধারের লেনদেনের ধরন ও ক্যাটেগরি ঠিক করে
function loanTxInfo(direction: LoanDirection, kind: "principal" | "payment") {
  if (direction === "lent") {
    return kind === "principal"
      ? { type: "expense" as const, categoryId: LOAN_CATEGORY.given }
      : {
          type: "income" as const,
          categoryId: LOAN_CATEGORY.repaymentReceived,
        };
  }
  return kind === "principal"
    ? { type: "income" as const, categoryId: LOAN_CATEGORY.taken }
    : { type: "expense" as const, categoryId: LOAN_CATEGORY.repaymentPaid };
}

function loanNote(
  direction: LoanDirection,
  person: string,
  kind: "principal" | "payment",
) {
  if (kind === "principal")
    return direction === "lent" ? `Loan to ${person}` : `Loan from ${person}`;
  return direction === "lent"
    ? `Repayment from ${person}`
    : `Repayment to ${person}`;
}

interface State {
  data: AppData;
  loaded: boolean;
  init: () => Promise<void>;

  addTransaction: (input: NewTransaction) => string;
  updateTransaction: (id: string, patch: Partial<NewTransaction>) => boolean;
  deleteTransaction: (id: string) => boolean;

  addCategory: (input: NewCategory) => string;
  updateCategory: (id: string, patch: Partial<NewCategory>) => void;
  setCategoryArchived: (id: string, archived: boolean) => void;

  addLoan: (input: NewLoan) => string;
  updateLoan: (id: string, patch: LoanPatch) => void;
  deleteLoan: (id: string) => void;
  setLoanReminder: (id: string, reminderId?: string) => void;
  addPayment: (
    loanId: string,
    input: { amount: number; date: string; note: string },
  ) => void;
  deletePayment: (loanId: string, paymentId: string) => void;

  replaceData: (incoming: AppData) => Promise<void>;
  setCurrency: (currency: string) => void;
  resetAll: () => Promise<void>;
}

export const useStore = create<State>()((set, get) => {
  // স্টেট বদলায় আর সাথে সাথে ডিস্কে লেখে
  const commit = (next: AppData) => {
    set({ data: next });
    void saveData(next);
  };

  return {
    data: createInitialData(),
    loaded: false,

    init: async () => {
      const data = await loadData();
      set({ data, loaded: true });
    },

    // ---------- সাধারণ লেনদেন ----------
    addTransaction: (input) => {
      const id = generateId("tx");
      const tx: Transaction = {
        ...input,
        amount: roundMoney(input.amount),
        id,
        createdAt: Date.now(),
      };
      const d = get().data;
      commit({ ...d, transactions: [...d.transactions, tx] });
      return id;
    },

    // ধারের সাথে যুক্ত লেনদেন এখান থেকে বদলানো/মোছা যাবে না, ধারের স্ক্রিন থেকে করতে হবে
    updateTransaction: (id, patch) => {
      const d = get().data;
      const target = d.transactions.find((t) => t.id === id);
      if (!target || target.loanId) return false;
      commit({
        ...d,
        transactions: d.transactions.map((t) =>
          t.id === id
            ? {
                ...t,
                ...patch,
                amount:
                  patch.amount !== undefined
                    ? roundMoney(patch.amount)
                    : t.amount,
              }
            : t,
        ),
      });
      return true;
    },

    deleteTransaction: (id) => {
      const d = get().data;
      const target = d.transactions.find((t) => t.id === id);
      if (!target || target.loanId) return false;
      commit({ ...d, transactions: d.transactions.filter((t) => t.id !== id) });
      return true;
    },

    // ---------- ক্যাটেগরি ----------
    addCategory: (input) => {
      const id = generateId("cat");
      const cat: Category = { ...input, id, isDefault: false, archived: false };
      const d = get().data;
      commit({ ...d, categories: [...d.categories, cat] });
      return id;
    },

    updateCategory: (id, patch) => {
      const d = get().data;
      commit({
        ...d,
        categories: d.categories.map((c) =>
          c.id === id ? { ...c, ...patch } : c,
        ),
      });
    },

    // মুছে ফেলার বদলে লুকানো। শুধু নিজের বানানো ক্যাটেগরি লুকানো যায়
    setCategoryArchived: (id, archived) => {
      const d = get().data;
      commit({
        ...d,
        categories: d.categories.map((c) =>
          c.id === id && !c.isDefault ? { ...c, archived } : c,
        ),
      });
    },

    // ---------- ধার ----------
    addLoan: (input) => {
      const loanId = generateId("loan");
      const now = Date.now();
      const principal = roundMoney(input.principal);
      const loan: Loan = {
        ...input,
        principal,
        id: loanId,
        payments: [],
        createdAt: now,
      };
      const info = loanTxInfo(input.direction, "principal");
      const tx: Transaction = {
        id: generateId("tx"),
        ...info,
        amount: principal,
        note: loanNote(input.direction, input.person, "principal"),
        date: input.date,
        createdAt: now,
        loanId,
      };
      const d = get().data;
      commit({
        ...d,
        loans: [...d.loans, loan],
        transactions: [...d.transactions, tx],
      });
      return loanId;
    },

    updateLoan: (id, patch) => {
      const d = get().data;
      const old = d.loans.find((l) => l.id === id);
      if (!old) return;
      const next: Loan = {
        ...old,
        ...patch,
        principal:
          patch.principal !== undefined
            ? roundMoney(patch.principal)
            : old.principal,
      };
      commit({
        ...d,
        loans: d.loans.map((l) => (l.id === id ? next : l)),
        // মূল ধারের লেনদেনটাও সাথে সাথে মিলিয়ে দেয়
        transactions: d.transactions.map((t) =>
          t.loanId === id && !t.paymentId
            ? {
                ...t,
                amount: next.principal,
                date: next.date,
                note: loanNote(next.direction, next.person, "principal"),
              }
            : t,
        ),
      });
    },

    // ধার মুছলে তার সব লেনদেনও মোছে, ব্যালেন্স আগের অবস্থায় ফিরে যায়
    deleteLoan: (id) => {
      const d = get().data;
      commit({
        ...d,
        loans: d.loans.filter((l) => l.id !== id),
        transactions: d.transactions.filter((t) => t.loanId !== id),
      });
    },

    setLoanReminder: (id, reminderId) => {
      const d = get().data;
      commit({
        ...d,
        loans: d.loans.map((l) => (l.id === id ? { ...l, reminderId } : l)),
      });
    },

    addPayment: (loanId, input) => {
      const d = get().data;
      const loan = d.loans.find((l) => l.id === loanId);
      if (!loan) return;
      // বাকির চেয়ে বেশি ফেরত নেওয়া যাবে না
      const amount = Math.min(
        roundMoney(input.amount),
        Math.max(0, loanRemaining(loan)),
      );
      if (amount <= 0) return;

      const paymentId = generateId("pay");
      const info = loanTxInfo(loan.direction, "payment");
      const tx: Transaction = {
        id: generateId("tx"),
        ...info,
        amount,
        note: input.note || loanNote(loan.direction, loan.person, "payment"),
        date: input.date,
        createdAt: Date.now(),
        loanId,
        paymentId,
      };
      commit({
        ...d,
        loans: d.loans.map((l) =>
          l.id === loanId
            ? {
                ...l,
                payments: [
                  ...l.payments,
                  { id: paymentId, amount, date: input.date, note: input.note },
                ],
              }
            : l,
        ),
        transactions: [...d.transactions, tx],
      });
    },

    deletePayment: (loanId, paymentId) => {
      const d = get().data;
      commit({
        ...d,
        loans: d.loans.map((l) =>
          l.id === loanId
            ? { ...l, payments: l.payments.filter((p) => p.id !== paymentId) }
            : l,
        ),
        transactions: d.transactions.filter((t) => t.paymentId !== paymentId),
      });
    },

    // ---------- ব্যাকআপ রিস্টোর / রিসেট ----------
    // সংরক্ষণ করে আবার লোড করে, যাতে migrate আর ডিফল্ট ক্যাটেগরি মেলানো আপনাআপনি হয়
    replaceData: async (incoming) => {
      await saveData(incoming);
      set({ data: await loadData() });
    },

    setCurrency: (currency) => {
      commit({ ...get().data, currency });
    },

    resetAll: async () => {
      await clearData();
      set({ data: createInitialData() });
    },
  };
});
