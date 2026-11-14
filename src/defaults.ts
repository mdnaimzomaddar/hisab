import { Category } from "./types";

// ধারের লেনদেনের জন্য সিস্টেম ক্যাটেগরি।
// এগুলো ক্যাটেগরি বাছার তালিকায় দেখানো হবে না, ধারের লেনদেন নিজে থেকে এগুলো ব্যবহার করবে।
export const LOAN_CATEGORY = {
  given: "cat_loan_given", // আমি ধার দিলাম (expense)
  repaymentPaid: "cat_loan_repay_paid", // আমি আমার দেনা শোধ করলাম (expense)
  taken: "cat_loan_taken", // আমি ধার নিলাম (income)
  repaymentReceived: "cat_loan_repay_recv", // আমার পাওনা কেউ ফেরত দিল (income)
} as const;

export const SYSTEM_CATEGORY_IDS: string[] = Object.values(LOAN_CATEGORY);

const c = (
  id: string,
  name: string,
  type: Category["type"],
  icon: string,
  color: string,
): Category => ({
  id,
  name,
  type,
  icon,
  color,
  isDefault: true,
  archived: false,
});

export const DEFAULT_CATEGORIES: Category[] = [
  // খরচ
  c("cat_food", "Food", "expense", "fast-food", "#FF9F43"),
  c("cat_transport", "Transport", "expense", "bus", "#54A0FF"),
  c("cat_shopping", "Shopping", "expense", "bag-handle", "#FF78C4"),
  c("cat_bills", "Bills", "expense", "bulb", "#FECA57"),
  c("cat_rent", "Rent", "expense", "home", "#A55EEA"),
  c("cat_health", "Health", "expense", "medkit", "#FF6B6B"),
  c("cat_education", "Education", "expense", "school", "#48DBFB"),
  c("cat_fun", "Entertainment", "expense", "game-controller", "#5F27CD"),
  c("cat_other_exp", "Other", "expense", "ellipsis-horizontal", "#8395A7"),

  // আয়
  c("cat_salary", "Salary", "income", "cash", "#3DDC97"),
  c("cat_business", "Business", "income", "briefcase", "#1DD1A1"),
  c("cat_gift", "Gift", "income", "gift", "#FF78C4"),
  c("cat_other_inc", "Other", "income", "ellipsis-horizontal", "#C8D6E5"),

  // সিস্টেম (ধার)
  c(LOAN_CATEGORY.given, "Loan Given", "expense", "arrow-up-circle", "#FF9F43"),
  c(
    LOAN_CATEGORY.repaymentPaid,
    "Loan Repayment Paid",
    "expense",
    "return-up-back",
    "#FF6B6B",
  ),
  c(
    LOAN_CATEGORY.taken,
    "Loan Taken",
    "income",
    "arrow-down-circle",
    "#54A0FF",
  ),
  c(
    LOAN_CATEGORY.repaymentReceived,
    "Loan Repayment Received",
    "income",
    "return-down-back",
    "#3DDC97",
  ),
];
