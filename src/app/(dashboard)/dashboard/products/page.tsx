'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Package, Plus, Search, Loader2, AlertTriangle, RotateCcw,
  Edit2, Trash2, X, Filter, ArrowUpDown, Eye, EyeOff,
  Tag, DollarSign, Box, MapPin, Barcode, Weight, Ruler
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  internalCode: string | null;
  mlCode: string | null;
  category: string | null;
  supplierId: string | null;
  brand: string | null;
  purchasePrice: number;
  sellingPrice: number;
  minPrice: number;
  idealPrice: number;
  weight: number;
  dimensions: string | null;
  stock: number;
  physicalLocation: string | null;
  imageUrl: string | null;
  barcode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: string;
  name: string;
  cnpj: string | null;
}

const CATEGORIES = [
  'Eletrônicos', 'Acessórios', 'Casa', 'Esporte', 'Moda',
  'Beleza', 'Infantil', 'Pet', 'Automotivo', 'Outros'
];

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('pt-BR');
}

const initialFormData: Partial<Product> = {
  name: '',
  sku: '',
  internalCode: '',
  mlCode: '',
  category: '',
  supplierId: '',
  brand: '',
  purchasePrice: 0,
  sellingPrice: 0,
  minPrice: 0,
  idealPrice: 0,
  weight: 0,
  dimensions: '',
  stock: 0,
  physicalLocation: '',
  imageUrl: '',
  barcode: '',
  isActive: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'outOfStock'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'sellingPrice' | 'stock' | 'createdAt'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (categoryFilter) params.set('category', categoryFilter);
      if (stockFilter === 'inStock') params.set('inStock', 'true');

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setProducts(data.data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar produtos.');
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, stockFilter]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (data.success) setSuppliers(data.data);
    } catch {}
  };

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
  }, [fetchProducts]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'name') return a.name.localeCompare(b.name) * dir;
    if (sortField === 'sellingPrice') return (a.sellingPrice - b.sellingPrice) * dir;
    if (sortField === 'stock') return (a.stock - b.stock) * dir;
    return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
  });

  const filteredByStock = sortedProducts.filter((p) => {
    if (stockFilter === 'inStock') return p.stock > 0;
    if (stockFilter === 'outOfStock') return p.stock === 0;
    return true;
  });

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({ ...initialFormData });
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.sku) {
      alert('Nome e SKU são obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchasePrice: Number(formData.purchasePrice) || 0,
          sellingPrice: Number(formData.sellingPrice) || 0,
          minPrice: Number(formData.minPrice) || 0,
          idealPrice: Number(formData.idealPrice) || 0,
          weight: Number(formData.weight) || 0,
          stock: Number(formData.stock) || 0,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar produto.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover produto.');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => (
    <ArrowUpDown className={`h-3 w-3 inline ml-1 ${sortField === field ? 'text-indigo-400' : 'text-zinc-600'}`} />
  );

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-zinc-400">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={fetchProducts} className="text-xs text-zinc-400 hover:text-white flex items-center mx-auto gap-1.5 cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5" /> Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Cadastro de Produtos</h2>
          <p className="text-sm text-zinc-400 mt-1">{products.length} produto{products.length !== 1 ? 's' : ''} cadastrado{products.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Novo Produto
        </button>
      </div>

      {/* Filters */}
      <Card className="glassmorphism border-zinc-800">
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por nome, SKU, marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
            >
              <option value="">Todas categorias</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="flex rounded-lg border border-zinc-800 overflow-hidden">
              {(['all', 'inStock', 'outOfStock'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setStockFilter(opt)}
                  className={`px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    stockFilter === opt
                      ? 'bg-indigo-600 text-white'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white'
                  }`}
                >
                  {opt === 'all' ? 'Todos' : opt === 'inStock' ? 'Em estoque' : 'Sem estoque'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="glassmorphism border-zinc-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="text-left py-3 px-4 font-medium cursor-pointer hover:text-zinc-300" onClick={() => handleSort('name')}>
                    Produto <SortIcon field="name" />
                  </th>
                  <th className="text-left py-3 px-4 font-medium">SKU</th>
                  <th className="text-left py-3 px-4 font-medium">Categoria</th>
                  <th className="text-right py-3 px-4 font-medium cursor-pointer hover:text-zinc-300" onClick={() => handleSort('sellingPrice')}>
                    Preço Venda <SortIcon field="sellingPrice" />
                  </th>
                  <th className="text-right py-3 px-4 font-medium">Custo</th>
                  <th className="text-right py-3 px-4 font-medium cursor-pointer hover:text-zinc-300" onClick={() => handleSort('stock')}>
                    Estoque <SortIcon field="stock" />
                  </th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                  <th className="text-center py-3 px-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredByStock.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-zinc-500">
                      <Package className="h-8 w-8 mx-auto mb-2 text-zinc-600" />
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredByStock.map((product) => (
                    <tr key={product.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt="" className="h-full w-full object-cover rounded-lg" />
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="text-zinc-200 font-medium truncate max-w-[180px]">{product.name}</p>
                            {product.brand && <p className="text-zinc-500 text-[10px]">{product.brand}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">{product.sku}</td>
                      <td className="py-3 px-4">
                        {product.category ? (
                          <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[10px] font-medium">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{formatBRL(product.sellingPrice)}</td>
                      <td className="py-3 px-4 text-right text-zinc-400">{formatBRL(product.purchasePrice)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold ${product.stock === 0 ? 'text-red-400' : product.stock <= 5 ? 'text-amber-400' : 'text-zinc-300'}`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {product.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-[10px] font-bold">
                            <Eye className="h-3 w-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-500 text-[10px] font-bold">
                            <EyeOff className="h-3 w-3" /> Inativo
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(product.id)}
                            className="p-1.5 rounded-md hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-white">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome do Produto *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                    placeholder="Ex: Cabo HDMI 2.1 Premium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku || ''}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-600 transition-colors"
                    placeholder="EX: CABO-HDMI-21"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Código Interno</label>
                  <input
                    type="text"
                    value={formData.internalCode || ''}
                    onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-600 transition-colors"
                    placeholder="Código interno"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Código ML</label>
                  <input
                    type="text"
                    value={formData.mlCode || ''}
                    onChange={(e) => setFormData({ ...formData, mlCode: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-600 transition-colors"
                    placeholder="MLB12345678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Marca</label>
                  <input
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                    placeholder="Ex: IntelBras"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Categoria</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Fornecedor</label>
                  <select
                    value={formData.supplierId || ''}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors cursor-pointer"
                  >
                    <option value="">Selecione...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Código de Barras</label>
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-indigo-600 transition-colors"
                    placeholder="7891234567890"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-400" /> Preços
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Custo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.purchasePrice || ''}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.sellingPrice || ''}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Mínimo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minPrice || ''}
                      onChange={(e) => setFormData({ ...formData, minPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Ideal (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.idealPrice || ''}
                      onChange={(e) => setFormData({ ...formData, idealPrice: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Info */}
              <div className="border-t border-zinc-800 pt-4">
                <p className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5 text-cyan-400" /> Estoque & Físico
                </p>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Estoque</label>
                    <input
                      type="number"
                      value={formData.stock || ''}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight || ''}
                      onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Dimensões</label>
                    <input
                      type="text"
                      value={formData.dimensions || ''}
                      onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                      placeholder="10x20x30 cm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-zinc-500 mb-1">Localização</label>
                    <input
                      type="text"
                      value={formData.physicalLocation || ''}
                      onChange={(e) => setFormData({ ...formData, physicalLocation: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                      placeholder="Prateleira A3"
                    />
                  </div>
                </div>
              </div>

              {/* Image & Status */}
              <div className="border-t border-zinc-800 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">URL da Imagem</label>
                    <input
                      type="url"
                      value={formData.imageUrl || ''}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-600 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-zinc-800 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.isActive !== false}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-sm text-zinc-300">Produto ativo</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-zinc-800">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-950/60 border border-red-800/50 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Produto</h3>
                <p className="text-xs text-zinc-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-300 mb-5">
              Tem certeza que deseja excluir este produto? Todas as movimentações de estoque associadas serão mantidas.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
