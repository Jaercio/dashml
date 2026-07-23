import { PrismaMLIntegrationRepository } from '../../infrastructure/database/PrismaMLIntegrationRepository';
import { MercadoLivreService } from '../../infrastructure/services/MercadoLivreService';
import { prisma } from '../../lib/prisma';

const ML_API_URL = 'https://api.mercadolibre.com';

interface SyncResult {
  success: boolean;
  syncedAt: Date;
  summary: {
    products: number;
    sales: number;
    customers: number;
    complaints: number;
  };
  error?: string;
}

export class SyncMLData {
  private mlIntegrationRepository: PrismaMLIntegrationRepository;
  private mlService: MercadoLivreService;

  constructor() {
    this.mlIntegrationRepository = new PrismaMLIntegrationRepository();
    this.mlService = new MercadoLivreService();
  }

  async execute(userId: string): Promise<SyncResult> {
    const integration = await this.mlIntegrationRepository.findByUserId(userId);

    if (!integration) {
      return {
        success: false,
        syncedAt: new Date(),
        summary: { products: 0, sales: 0, customers: 0, complaints: 0 },
        error: 'Integração não encontrada',
      };
    }

    let accessToken = integration.accessToken;

    if (new Date() > integration.expiresAt) {
      try {
        const tokenData = await this.mlService.refreshAccessToken(integration.refreshToken);
        accessToken = tokenData.access_token;

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

        await this.mlIntegrationRepository.update(integration.id, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt,
        });
      } catch (error: any) {
        return {
          success: false,
          syncedAt: new Date(),
        summary: { products: 0, sales: 0, customers: 0, complaints: 0 },
        error: 'Token expirado e não foi possível renovar. Reconecte o ML.',
        };
      }
    }

    try {
      const sellerId = parseInt(integration.sellerId);

      const items = await this.mlService.getItems(accessToken, sellerId);
      let productsSynced = 0;

      for (const item of items) {
        try {
          const existingProduct = await prisma.product.findFirst({
            where: { mlCode: item.id },
          });

          if (existingProduct) {
            await prisma.product.update({
              where: { id: existingProduct.id },
              data: {
                name: item.title,
                sellingPrice: item.price,
                stock: item.available_quantity,
                isActive: item.status === 'active',
              },
            });
          } else {
            await prisma.product.create({
              data: {
                name: item.title,
                sku: item.id,
                mlCode: item.id,
                sellingPrice: item.price,
                stock: item.available_quantity,
                isActive: item.status === 'active',
                createdAt: new Date(item.date_created || item.created_at),
              },
            });
          }
          productsSynced++;
        } catch (err) {
          console.error(`Erro ao sincronizar item ${item.id}:`, err);
        }
      }

      const orders = await this.mlService.getOrders(accessToken, sellerId);
      let salesSynced = 0;
      const customerIds = new Set<number>();

      for (const order of orders) {
        try {
          const existingSale = await prisma.sale.findFirst({
            where: { mlOrderId: String(order.id) },
          });

          if (existingSale) {
            continue;
          }

          const buyerId = order.buyer?.id;
          if (buyerId) {
            customerIds.add(buyerId);
          }

          let customerId: string | null = null;
          if (buyerId) {
            const existingCustomer = await prisma.customer.findFirst({
              where: { mlCustomerId: String(buyerId) },
            });

            if (existingCustomer) {
              customerId = existingCustomer.id;
            } else {
              let buyerName = 'Cliente ML';
              let buyerEmail: string | null = null;

              try {
                const buyerInfo = await this.mlService.getUserInfo(accessToken);
                if (buyerInfo.id === buyerId) {
                  buyerName = `${buyerInfo.first_name || ''} ${buyerInfo.last_name || ''}`.trim() || buyerName;
                  buyerEmail = buyerInfo.email || null;
                }
              } catch {}

              const newCustomer = await prisma.customer.create({
                data: {
                  name: buyerName,
                  email: buyerEmail,
                  mlCustomerId: String(buyerId),
                },
              });
              customerId = newCustomer.id;
            }
          }

          if (!customerId) continue;

          const orderItem = order.order_items?.[0]?.item;
          if (!orderItem) continue;

          const orderQuantity = order.order_items?.[0]?.quantity || 1;

          const product = await prisma.product.findFirst({
            where: { mlCode: orderItem.id },
          });

          if (!product) continue;

          const metrics = this.mlService.calculateOrderMetrics(order);

          // Buscar custo real de frete do vendedor via shipment API
          let shippingPaid = 0;
          if (order.shipping?.id) {
            shippingPaid = await this.mlService.getShipmentCost(accessToken, order.shipping.id);
          }

          // Se sale_fee veio 0, buscar comissão detalhada do pedido
          let mlTotalFee = metrics.mlCommission;
          if (mlTotalFee === 0 && order.id) {
            try {
              const orderDetailResp = await fetch(
                `${ML_API_URL}/orders/${order.id}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              if (orderDetailResp.ok) {
                const orderDetail = await orderDetailResp.json();
                const detailFee = orderDetail.order_items?.[0]?.sale_fee;
                if (detailFee && detailFee > 0) {
                  mlTotalFee = detailFee;
                } else if (orderDetail.fee_details?.length) {
                  mlTotalFee = orderDetail.fee_details.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
                } else if (orderDetail.payments?.length) {
                  for (const payment of orderDetail.payments) {
                    if (payment.fee_details?.length) {
                      mlTotalFee += payment.fee_details.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
                    }
                    if (payment.benefit_amount !== undefined && payment.benefit_amount !== null) {
                      // benefit_amount pode representar desconto do cupom, não comissão
                    }
                  }
                }
              }
            } catch {}
          }

          const couponDiscount = metrics.couponDiscount;
          const totalProductCost = product.purchasePrice * orderQuantity;
          const grossProfit = metrics.salePrice - totalProductCost - mlTotalFee - shippingPaid - couponDiscount;
          const netProfit = grossProfit;
          const margin = metrics.salePrice > 0 ? (netProfit / metrics.salePrice) * 100 : 0;
          const roi = totalProductCost > 0 ? (netProfit / totalProductCost) * 100 : 0;

          await prisma.sale.create({
            data: {
              mlOrderId: String(order.id),
              productId: product.id,
              customerId,
              salePrice: metrics.salePrice,
              shippingReceived: metrics.shippingReceived,
              shippingPaid,
              mlCommission: mlTotalFee,
              fixedFee: 0,
              couponDiscount,
              quantity: orderQuantity,
              productCost: totalProductCost,
              grossProfit,
              netProfit,
              margin,
              roi,
              status: order.status === 'paid' ? 'PAID' : order.status === 'cancelled' ? 'CANCELLED' : 'PENDING',
              createdAt: new Date(order.date_created),
            },
          });

          salesSynced++;
        } catch (err) {
          console.error(`Erro ao sincronizar pedido ${order.id}:`, err);
        }
      }

      // Atualizar vendas existentes que estão com frete zerado
      const salesNeedingShipping = await prisma.sale.findMany({
        where: { shippingPaid: 0, status: 'PAID' },
        include: { product: true },
      });

      if (salesNeedingShipping.length > 0) {
        console.log(`[Sync] Atualizando frete de ${salesNeedingShipping.length} vendas existentes...`);
        for (const sale of salesNeedingShipping) {
          try {
            const orderResp = await fetch(
              `${ML_API_URL}/orders/${sale.mlOrderId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!orderResp.ok) {
              console.log(`[Sync] Pedido ${sale.mlOrderId} não encontrado na ML (${orderResp.status})`);
              continue;
            }
            const order = await orderResp.json();
            if (!order.shipping?.id) {
              console.log(`[Sync] Pedido ${sale.mlOrderId} sem shipment ID`);
              continue;
            }

            const shippingCost = await this.mlService.getShipmentCost(accessToken, order.shipping.id);
            if (shippingCost <= 0) {
              console.log(`[Sync] Pedido ${sale.mlOrderId}: frete returned 0`);
              continue;
            }

            const mlFeeFromOrder = order.order_items?.[0]?.sale_fee || 0;
            let mlFee = mlFeeFromOrder || sale.mlCommission;

            // Se comissão ainda é 0, buscar detalhes do pedido
            if (mlFee === 0) {
              try {
                const detailResp = await fetch(
                  `${ML_API_URL}/orders/${sale.mlOrderId}`,
                  { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (detailResp.ok) {
                  const detail = await detailResp.json();
                  const detailFee = detail.order_items?.[0]?.sale_fee;
                  if (detailFee && detailFee > 0) {
                    mlFee = detailFee;
                  } else if (detail.fee_details?.length) {
                    mlFee = detail.fee_details.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
                  }
                }
              } catch {}
            }
            const saleQuantity = order.order_items?.[0]?.quantity || sale.quantity || 1;
            const unitCost = sale.product?.purchasePrice || 0;
            const cost = unitCost * saleQuantity;
            const couponAmount = order.payments?.[0]?.coupon_amount || 0;
            const newGrossProfit = sale.salePrice - cost - mlFee - shippingCost - couponAmount;
            const newMargin = sale.salePrice > 0 ? (newGrossProfit / sale.salePrice) * 100 : 0;
            const newRoi = cost > 0 ? (newGrossProfit / cost) * 100 : 0;

            await prisma.sale.update({
              where: { id: sale.id },
              data: {
                shippingPaid: shippingCost,
                mlCommission: mlFee,
                couponDiscount: couponAmount,
                quantity: saleQuantity,
                productCost: cost,
                grossProfit: newGrossProfit,
                netProfit: newGrossProfit,
                margin: newMargin,
                roi: newRoi,
              },
            });
            console.log(`[Sync] Venda ${sale.mlOrderId}: frete R$${shippingCost}, comissão R$${mlFee}, lucro R$${newGrossProfit.toFixed(2)}`);
          } catch (err) {
            console.error(`[Sync] Erro ao atualizar frete da venda ${sale.mlOrderId}:`, err);
          }
        }
      }

      // Atualizar vendas existentes que estão com comissão zerada
      const salesNeedingCommission = await prisma.sale.findMany({
        where: { mlCommission: 0, status: 'PAID' },
        include: { product: true },
      });

      if (salesNeedingCommission.length > 0) {
        console.log(`[Sync] Atualizando comissão de ${salesNeedingCommission.length} vendas com ML fee zero...`);
        for (const sale of salesNeedingCommission) {
          try {
            const orderResp = await fetch(
              `${ML_API_URL}/orders/${sale.mlOrderId}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!orderResp.ok) continue;
            const order = await orderResp.json();

            let mlFee = order.order_items?.[0]?.sale_fee || 0;
            if (mlFee === 0 && order.fee_details?.length) {
              mlFee = order.fee_details.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
            }
            if (mlFee === 0 && order.payments?.length) {
              for (const payment of order.payments) {
                if (payment.fee_details?.length) {
                  mlFee += payment.fee_details.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
                }
              }
            }

            if (mlFee <= 0) continue;

            const saleQuantity = order.order_items?.[0]?.quantity || sale.quantity || 1;
            const unitCost = sale.product?.purchasePrice || 0;
            const cost = unitCost * saleQuantity;
            const couponAmount = order.payments?.[0]?.coupon_amount || 0;
            const newGrossProfit = sale.salePrice - cost - mlFee - sale.shippingPaid - couponAmount;
            const newMargin = sale.salePrice > 0 ? (newGrossProfit / sale.salePrice) * 100 : 0;
            const newRoi = cost > 0 ? (newGrossProfit / cost) * 100 : 0;

            await prisma.sale.update({
              where: { id: sale.id },
              data: {
                mlCommission: mlFee,
                couponDiscount: couponAmount,
                quantity: saleQuantity,
                productCost: cost,
                grossProfit: newGrossProfit,
                netProfit: newGrossProfit,
                margin: newMargin,
                roi: newRoi,
              },
            });
            console.log(`[Sync] Venda ${sale.mlOrderId}: comissão corrigida R$${mlFee}`);
          } catch (err) {
            console.error(`[Sync] Erro ao atualizar comissão da venda ${sale.mlOrderId}:`, err);
          }
        }
      }

      await this.mlIntegrationRepository.updateSyncTime(integration.id);

      // Sync complaints (claims)
      let complaintsSynced = 0;
      let complaintsSkipped = 0;
      try {
        const claims = await this.mlService.getClaims(accessToken);
        console.log(`[Sync] Processando ${claims.length} reclamações...`);

        for (const claim of claims) {
          try {
            const existingComplaint = await prisma.complaint.findFirst({
              where: { mlComplaintId: String(claim.id) },
            });

            if (existingComplaint) {
              const mlStatus = claim.status === 'closed' ? 'CLOSED' : 'OPEN';
              if (existingComplaint.status !== mlStatus) {
                await prisma.complaint.update({
                  where: { id: existingComplaint.id },
                  data: { status: mlStatus },
                });
              }
              continue;
            }

            const sale = await prisma.sale.findFirst({
              where: { mlOrderId: String(claim.resource_id) },
              include: { product: true, customer: true },
            });

            if (!sale) {
              console.log(`[Sync] Reclamação ${claim.id}: venda ${claim.resource_id} não encontrada no banco, pulando.`);
              complaintsSkipped++;
              continue;
            }

            const mlStatus = claim.status === 'closed' ? 'CLOSED' : 'OPEN';

            let deadline: Date | null = null;
            for (const player of claim.players || []) {
              if (player.available_actions?.length) {
                const dueDate = player.available_actions[0].due_date;
                if (dueDate) {
                  deadline = new Date(dueDate);
                  break;
                }
              }
            }

            const reasonPrefix = claim.reason_id?.substring(0, 3);
            const reasonTypeMap: Record<string, string> = {
              'PDD': 'Produto com defeito',
              'PNR': 'Produto não recebido',
              'PNA': 'Produto não corresponde ao anúncio',
              'CNL': 'Compra cancelada',
            };
            const typeLabel = reasonTypeMap[reasonPrefix || ''] || claim.type || 'Reclamação';

            await prisma.complaint.create({
              data: {
                mlComplaintId: String(claim.id),
                saleId: sale.id,
                productId: sale.productId,
                customerId: sale.customerId,
                type: typeLabel,
                status: mlStatus,
                deadline,
                reason: claim.reason_id || claim.type,
                createdAt: claim.date_created ? new Date(claim.date_created) : new Date(),
              },
            });

            complaintsSynced++;
            console.log(`[Sync] Reclamação ${claim.id} sincronizada (${typeLabel})`);
          } catch (err) {
            console.error(`[Sync] Erro ao sincronizar reclamação ${claim.id}:`, err);
          }
        }

        console.log(`[Sync] Reclamações: ${complaintsSynced} criadas, ${complaintsSkipped} puladas (venda não encontrada)`);
      } catch (err) {
        console.error('[Sync] Erro ao buscar reclamações do ML:', err);
      }

      return {
        success: true,
        syncedAt: new Date(),
        summary: {
          products: productsSynced,
          sales: salesSynced,
          customers: customerIds.size,
          complaints: complaintsSynced,
        },
      };
    } catch (error: any) {
      console.error('Erro na sincronização ML:', error);
      return {
        success: false,
        syncedAt: new Date(),
        summary: { products: 0, sales: 0, customers: 0, complaints: 0 },
        error: error.message || 'Erro ao sincronizar dados do ML',
      };
    }
  }
}
