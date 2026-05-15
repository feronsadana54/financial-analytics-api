import { PrismaClient, Role, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const demoUsers = [
  { name: "Super Admin", email: "admin@financial.local", password: "Admin12345", role: Role.SUPER_ADMIN },
  { name: "Manager", email: "manager@financial.local", password: "Manager12345", role: Role.MANAGER },
  { name: "Standard User", email: "user@financial.local", password: "User12345", role: Role.USER }
];

const productCategories = [
  { name: "Software", description: "Subscription and digital products" },
  { name: "Hardware", description: "Devices and office equipment" },
  { name: "Services", description: "Implementation and support services" },
  { name: "Accessories", description: "Complementary product lines" }
];

const expenseCategories = [
  { name: "Marketing", description: "Campaign, ads, and brand expenses" },
  { name: "Operations", description: "Office, logistics, and daily operations" },
  { name: "Payroll", description: "Compensation and contractor cost" },
  { name: "Software Tools", description: "SaaS and engineering tools" }
];

async function main() {
  await prisma.salesTransactionItem.deleteMany();
  await prisma.salesTransaction.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.user.deleteMany();

  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: passwordHash,
        role: user.role,
        status: UserStatus.ACTIVE
      }
    });
  }

  const categories = new Map<string, string>();
  for (const category of productCategories) {
    const created = await prisma.category.create({ data: category });
    categories.set(created.name, created.id);
  }

  const expenseCategoryMap = new Map<string, string>();
  for (const category of expenseCategories) {
    const created = await prisma.expenseCategory.create({ data: category });
    expenseCategoryMap.set(created.name, created.id);
  }

  const products = await prisma.product.createManyAndReturn({
    data: [
      { categoryId: categories.get("Software")!, name: "Analytics Pro License", sku: "SW-ANL-PRO", price: 4200000, cost: 1350000, stock: 250 },
      { categoryId: categories.get("Software")!, name: "CRM Growth Suite", sku: "SW-CRM-GRO", price: 3600000, cost: 1100000, stock: 180 },
      { categoryId: categories.get("Hardware")!, name: "POS Terminal X2", sku: "HW-POS-X2", price: 5800000, cost: 3900000, stock: 75 },
      { categoryId: categories.get("Hardware")!, name: "Inventory Scanner", sku: "HW-SCN-INV", price: 2400000, cost: 1450000, stock: 120 },
      { categoryId: categories.get("Services")!, name: "Implementation Package", sku: "SV-IMP-PKG", price: 12500000, cost: 6200000, stock: 40 },
      { categoryId: categories.get("Services")!, name: "Priority Support", sku: "SV-SUP-PRI", price: 2100000, cost: 850000, stock: 300 },
      { categoryId: categories.get("Accessories")!, name: "Thermal Receipt Roll", sku: "AC-RCP-TRL", price: 180000, cost: 95000, stock: 900 },
      { categoryId: categories.get("Accessories")!, name: "Barcode Label Pack", sku: "AC-LBL-BAR", price: 220000, cost: 120000, stock: 700 }
    ]
  });

  const productBySku = new Map(products.map((product) => [product.sku, product]));
  const months = Array.from({ length: 12 }, (_, index) => index);
  const customers = ["Nusantara Retail", "Bright Market", "Atlas Commerce", "Prima Mart", "Urban Supply", "Sentra Digital"];

  for (const month of months) {
    for (let order = 0; order < 6; order += 1) {
      const selected = [
        productBySku.get(order % 2 === 0 ? "SW-ANL-PRO" : "SW-CRM-GRO")!,
        productBySku.get(order % 3 === 0 ? "HW-POS-X2" : "SV-SUP-PRI")!,
        productBySku.get(order % 2 === 0 ? "AC-RCP-TRL" : "AC-LBL-BAR")!
      ];
      const items = selected.map((product, itemIndex) => {
        const quantity = (month + 2 + order + itemIndex) % 5 + 1;
        const unitPrice = Number(product.price);
        const unitCost = Number(product.cost);
        return {
          productId: product.id,
          quantity,
          unitPrice,
          unitCost,
          subtotal: unitPrice * quantity,
          profit: (unitPrice - unitCost) * quantity
        };
      });
      if (order === 2 || order === 5) {
        const service = productBySku.get("SV-IMP-PKG")!;
        const unitPrice = Number(service.price);
        const unitCost = Number(service.cost);
        items.push({ productId: service.id, quantity: 1, unitPrice, unitCost, subtotal: unitPrice, profit: unitPrice - unitCost });
      }
      const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
      const totalCost = items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
      const grossProfit = items.reduce((sum, item) => sum + item.profit, 0);

      await prisma.salesTransaction.create({
        data: {
          transactionDate: new Date(Date.UTC(2025, month, 5 + order * 3)),
          customerName: customers[(month + order) % customers.length],
          totalAmount,
          totalCost,
          grossProfit,
          items: { create: items }
        }
      });
    }
  }

  for (const month of months) {
    await prisma.expense.createMany({
      data: [
        { expenseCategoryId: expenseCategoryMap.get("Marketing")!, expenseDate: new Date(Date.UTC(2025, month, 8)), title: "Digital acquisition campaign", amount: 8500000 + month * 250000, notes: "Monthly performance marketing budget" },
        { expenseCategoryId: expenseCategoryMap.get("Operations")!, expenseDate: new Date(Date.UTC(2025, month, 12)), title: "Warehouse and fulfillment", amount: 6200000 + month * 180000, notes: "Storage and outbound handling" },
        { expenseCategoryId: expenseCategoryMap.get("Payroll")!, expenseDate: new Date(Date.UTC(2025, month, 25)), title: "Commercial team payroll", amount: 18500000 + month * 400000, notes: "Sales and customer success payroll" },
        { expenseCategoryId: expenseCategoryMap.get("Software Tools")!, expenseDate: new Date(Date.UTC(2025, month, 18)), title: "Business software subscriptions", amount: 4200000 + month * 90000, notes: "Analytics, CRM, and collaboration tools" }
      ]
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
