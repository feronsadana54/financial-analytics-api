CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "price" DECIMAL(14,2) NOT NULL,
  "cost" DECIMAL(14,2) NOT NULL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_transactions" (
  "id" TEXT NOT NULL,
  "transactionDate" TIMESTAMP(3) NOT NULL,
  "customerName" TEXT NOT NULL,
  "totalAmount" DECIMAL(14,2) NOT NULL,
  "totalCost" DECIMAL(14,2) NOT NULL,
  "grossProfit" DECIMAL(14,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sales_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_transaction_items" (
  "id" TEXT NOT NULL,
  "salesTransactionId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DECIMAL(14,2) NOT NULL,
  "unitCost" DECIMAL(14,2) NOT NULL,
  "subtotal" DECIMAL(14,2) NOT NULL,
  "profit" DECIMAL(14,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sales_transaction_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expense_categories" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "expenses" (
  "id" TEXT NOT NULL,
  "expenseCategoryId" TEXT NOT NULL,
  "expenseDate" TIMESTAMP(3) NOT NULL,
  "title" TEXT NOT NULL,
  "amount" DECIMAL(14,2) NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "sales_transactions_transactionDate_idx" ON "sales_transactions"("transactionDate");
CREATE INDEX "sales_transaction_items_salesTransactionId_idx" ON "sales_transaction_items"("salesTransactionId");
CREATE INDEX "sales_transaction_items_productId_idx" ON "sales_transaction_items"("productId");
CREATE UNIQUE INDEX "expense_categories_name_key" ON "expense_categories"("name");
CREATE INDEX "expenses_expenseCategoryId_idx" ON "expenses"("expenseCategoryId");
CREATE INDEX "expenses_expenseDate_idx" ON "expenses"("expenseDate");

ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "sales_transaction_items" ADD CONSTRAINT "sales_transaction_items_salesTransactionId_fkey" FOREIGN KEY ("salesTransactionId") REFERENCES "sales_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sales_transaction_items" ADD CONSTRAINT "sales_transaction_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
