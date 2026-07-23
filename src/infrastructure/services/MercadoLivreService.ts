const ML_AUTH_URL = 'https://auth.mercadolivre.com.br';
const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
const ML_API_URL = 'https://api.mercadolibre.com';

import { prisma } from '../../lib/prisma';

interface MLTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

interface MLUserInfo {
  id: number;
  nickname: string;
  registration_date: string;
  first_name: string;
  last_name: string;
  email: string;
  identification: {
    type: string;
    number: string;
  };
  address: {
    city: string;
    state: string;
  };
  phone: {
    area_code: string;
    number: string;
  };
  seller_reputation: {
    transactions: {
      completed: number;
      canceled: number;
      ratings: {
        positive: number;
        negative: number;
        neutral: number;
      };
    };
    power_seller_status: string | null;
  };
}

interface MLItem {
  id: string;
  title: string;
  category_id: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  status: string;
  listing_type_id: string;
  permalink: string;
  thumbnail: string;
  seller_id: number;
  created_at: string;
  date_created: string;
  updated_at: string;
}

interface MLClaim {
  id: number;
  type: string;
  stage: string;
  status: string;
  parent_id: number | null;
  client_id: number | null;
  resource_id: number;
  resource: string;
  reason_id: string;
  quantity_type: string;
  players: Array<{
    role: string;
    type: string;
    user_id: number;
    available_actions?: Array<{
      action: string;
      due_date: string;
    }>;
  }>;
  date_created: string;
  last_updated: string;
}

interface MLOrder {
  id: number;
  status: string;
  status_detail: string;
  date_created: string;
  date_closed: string;
  last_updated: string;
  total_amount: number;
  paid_amount: number;
  currency_id: string;
  buyer: {
    id: number;
    nickname: string;
  };
  seller: {
    id: number;
  };
  order_items: Array<{
    item: {
      id: string;
      title: string;
    };
    quantity: number;
    unit_price: number;
    sale_fee: number;
    listing_type_id: string;
  }>;
  payments: Array<{
    id: number;
    status: string;
    status_detail: string;
    payment_type: string;
    transaction_amount: number;
    shipping_cost: number;
    coupon_amount?: number;
    benefit_amount?: number;
    fee_details?: Array<{
      id: string;
      description: string;
      amount: number;
    }>;
  }>;
  shipping: {
    id: number;
    cost: number;
    receiver_address?: {
      city: string;
      state: string;
    };
  };
}

export class MercadoLivreService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = '';
    this.clientSecret = '';
    this.redirectUri = process.env.ML_REDIRECT_URI || '';
  }

  async loadCredentials(): Promise<boolean> {
    try {
      const clientIdSetting = await prisma.systemSetting.findUnique({
        where: { key: 'ML_CLIENT_ID' },
      });
      const clientSecretSetting = await prisma.systemSetting.findUnique({
        where: { key: 'ML_CLIENT_SECRET' },
      });

      if (clientIdSetting && clientSecretSetting) {
        this.clientId = clientIdSetting.value;
        this.clientSecret = clientSecretSetting.value;
        return true;
      }

      this.clientId = process.env.ML_CLIENT_ID || '';
      this.clientSecret = process.env.ML_CLIENT_SECRET || '';
      return !!(this.clientId && this.clientSecret);
    } catch {
      this.clientId = process.env.ML_CLIENT_ID || '';
      this.clientSecret = process.env.ML_CLIENT_SECRET || '';
      return !!(this.clientId && this.clientSecret);
    }
  }

  async isConfigured(): Promise<boolean> {
    await this.loadCredentials();
    return !!(this.clientId && this.clientSecret);
  }

  async getAuthorizationUrl(state?: string): Promise<string> {
    await this.loadCredentials();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
    });
    if (state) {
      params.set('state', state);
    }
    return `${ML_AUTH_URL}/authorization?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<MLTokenResponse> {
    await this.loadCredentials();
    const response = await fetch(ML_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: this.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro ao trocar código por token: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async refreshAccessToken(refreshToken: string): Promise<MLTokenResponse> {
    await this.loadCredentials();
    const response = await fetch(ML_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro ao renovar token: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async getUserInfo(accessToken: string): Promise<MLUserInfo> {
    const response = await fetch(`${ML_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar informações do usuário');
    }

    return response.json();
  }

  async getItems(accessToken: string, userId: number): Promise<MLItem[]> {
    const items: MLItem[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${ML_API_URL}/users/${userId}/items/search?offset=${offset}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar itens');
      }

      const data = await response.json();
      if (data.results && data.results.length > 0) {
        for (const itemId of data.results) {
          try {
            const itemDetail = await this.getItemDetails(accessToken, itemId);
            items.push(itemDetail);
          } catch {
            console.error(`Erro ao buscar detalhes do item ${itemId}`);
          }
        }
      }

      offset += limit;
      hasMore = offset < data.paging.total;
    }

    return items;
  }

  async getItemDetails(accessToken: string, itemId: string): Promise<MLItem> {
    const response = await fetch(`${ML_API_URL}/items/${itemId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar detalhes do item ${itemId}`);
    }

    return response.json();
  }

  async getOrders(accessToken: string, sellerId: number): Promise<MLOrder[]> {
    const orders: MLOrder[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await fetch(
        `${ML_API_URL}/orders/search?seller=${sellerId}&offset=${offset}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao buscar pedidos');
      }

      const data = await response.json();
      if (data.results) {
        orders.push(...data.results);
      }

      offset += limit;
      hasMore = offset < data.paging.total;
    }

    return orders;
  }

  async getItemVisits(accessToken: string, itemIds: string[]): Promise<Record<string, number>> {
    const idsParam = itemIds.join(',');
    const response = await fetch(
      `${ML_API_URL}/items/${idsParam}/visits?date_from=2020-01-01&date_to=${new Date().toISOString().split('T')[0]}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    const visits: Record<string, number> = {};

    if (data.visits) {
      for (const visit of data.visits) {
        visits[visit.item_id] = visit.total;
      }
    }

    return visits;
  }

  async getClaims(accessToken: string): Promise<MLClaim[]> {
    const claims: MLClaim[] = [];
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const url = `${ML_API_URL}/post-purchase/v1/claims/search?offset=${offset}&limit=${limit}`;
      console.log(`[ML Claims] Buscando: ${url}`);

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[ML Claims] Erro HTTP ${response.status}:`, errorBody);
        break;
      }

      const data = await response.json();
      const count = data.data?.length || 0;
      const total = data.paging?.total || 0;
      console.log(`[ML Claims] Resposta: ${count} items nesta página, total: ${total}`);

      if (count === 0 && offset === 0) {
        console.log('[ML Claims] Nenhuma reclamação encontrada na conta ML.');
      }

      if (data.data) {
        claims.push(...data.data);
      }

      offset += limit;
      hasMore = offset < total;
    }

    console.log(`[ML Claims] Total de reclamações coletadas: ${claims.length}`);
    return claims;
  }

  async getShipmentCost(accessToken: string, shipmentId: number): Promise<number> {
    try {
      const response = await fetch(`${ML_API_URL}/shipments/${shipmentId}/costs`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) return 0;
      const data = await response.json();
      return data.senders?.[0]?.cost || 0;
    } catch {
      return 0;
    }
  }

  calculateOrderMetrics(order: MLOrder) {
    const salePrice = order.total_amount;
    const shippingReceived = order.payments?.[0]?.shipping_cost || 0;
    const mlSaleFee = order.order_items?.[0]?.sale_fee || 0;
    const listingType = order.order_items?.[0]?.listing_type_id || '';
    const paymentType = order.payments?.[0]?.payment_type || '';
    const couponDiscount = paymentType === 'credit_card' ? (order.payments?.[0]?.coupon_amount || 0) : 0;

    return {
      salePrice,
      shippingReceived,
      shippingPaid: 0,
      mlCommission: mlSaleFee,
      fixedFee: 0,
      couponDiscount,
      status: order.status,
      statusDetail: order.status_detail,
      listingType,
    };
  }
}
