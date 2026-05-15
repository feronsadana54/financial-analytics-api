import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { UpdateSaleDto } from "./dto/update-sale.dto";

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.salesTransaction.findMany({ include: { items: { include: { product: true } } }, orderBy: { transactionDate: "desc" } });
  }

  async findOne(id: string) {
    const sale = await this.prisma.salesTransaction.findUnique({ where: { id }, include: { items: { include: { product: true } } } });
    if (!sale) throw new NotFoundException("Sales transaction not found");
    return sale;
  }

  async create(dto: CreateSaleDto) {
    const products = await this.prisma.product.findMany({ where: { id: { in: dto.items.map((item) => item.productId) } } });
    const itemData = dto.items.map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);
      const unitPrice = Number(product.price);
      const unitCost = Number(product.cost);
      const subtotal = unitPrice * item.quantity;
      const profit = (unitPrice - unitCost) * item.quantity;
      return { productId: item.productId, quantity: item.quantity, unitPrice, unitCost, subtotal, profit };
    });
    const totalAmount = itemData.reduce((sum, item) => sum + item.subtotal, 0);
    const totalCost = itemData.reduce((sum, item) => sum + item.unitCost * item.quantity, 0);
    const grossProfit = itemData.reduce((sum, item) => sum + item.profit, 0);

    return this.prisma.salesTransaction.create({
      data: {
        transactionDate: new Date(dto.transactionDate),
        customerName: dto.customerName,
        totalAmount,
        totalCost,
        grossProfit,
        items: { create: itemData }
      },
      include: { items: { include: { product: true } } }
    });
  }

  async update(id: string, dto: UpdateSaleDto) {
    await this.findOne(id);
    if (!dto.items) {
      return this.prisma.salesTransaction.update({
        where: { id },
        data: { transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined, customerName: dto.customerName },
        include: { items: { include: { product: true } } }
      });
    }
    await this.prisma.salesTransactionItem.deleteMany({ where: { salesTransactionId: id } });
    await this.prisma.salesTransaction.delete({ where: { id } });
    return this.create({ transactionDate: dto.transactionDate ?? new Date().toISOString(), customerName: dto.customerName ?? "Customer", items: dto.items });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.salesTransaction.delete({ where: { id } });
    return { id };
  }
}
