import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uid } from '@/lib/data';
import type { ShoppingItem } from '@/types';
import {
  ShoppingBag, Plus, Check, Trash2, Download, FileText, X, ShoppingCart,
} from 'lucide-react';

export function ShoppingView() {
  const { state, setState } = useApp();
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Generale', quantity: '1 pz' });
  const [showExport, setShowExport] = useState(false);

  const items = state.shoppingList;
  const checkedCount = items.filter((i) => i.checked).length;

  function toggleChecked(id: string) {
    setState((prev) => ({
      ...prev,
      shoppingList: prev.shoppingList.map((i) => i.id === id ? { ...i, checked: !i.checked } : i),
    }));
  }

  function deleteItem(id: string) {
    setState((prev) => ({ ...prev, shoppingList: prev.shoppingList.filter((i) => i.id !== id) }));
  }

  function addItem() {
    if (!newItem.name.trim()) return;
    const item: ShoppingItem = {
      id: uid(),
      name: newItem.name.trim(),
      category: newItem.category,
      quantity: newItem.quantity,
      checked: false,
    };
    setState((prev) => ({ ...prev, shoppingList: [...prev.shoppingList, item] }));
    setNewItem({ name: '', category: 'Generale', quantity: '1 pz' });
    setAdding(false);
  }

  function clearChecked() {
    setState((prev) => ({ ...prev, shoppingList: prev.shoppingList.filter((i) => !i.checked) }));
  }

  function exportList() {
    const lines = [
      'NUTRIPLAN - LISTA DELLA SPESA',
      `Generata il ${new Date().toLocaleDateString('it-IT')}`,
      '',
      ...items.map((i) => `[${i.checked ? 'x' : ' '}] ${i.name} - ${i.quantity} (${i.category})`),
      '',
      `Totale: ${items.length} articoli`,
    ];
    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista-spesa-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  }

  function exportPDF() {
    const printWin = window.open('', '_blank');
    if (!printWin) return;
    const html = `
      <html><head><title>Lista della Spesa - NutriPlan</title>
      <style>
        body { font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
        h1 { color: #10b981; }
        .item { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 16px; }
        .cat { color: #888; font-size: 12px; }
      </style></head><body>
      <h1>Lista della Spesa</h1>
      <p>Generata il ${new Date().toLocaleDateString('it-IT')}</p>
      ${items.map((i) => `<div class="item">☐ ${i.name} - ${i.quantity} <span class="cat">(${i.category})</span></div>`).join('')}
      <p style="margin-top:20px;color:#888">Totale: ${items.length} articoli</p>
      </body></html>
    `;
    printWin.document.write(html);
    printWin.document.close();
    printWin.print();
    setShowExport(false);
  }

  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Articoli da acquistare</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{items.length - checkedCount} / {items.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        {items.length > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progresso</span>
              <span>{checkedCount}/{items.length} acquistati</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
              <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${(checkedCount / items.length) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-8 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500 mb-1">Lista della spesa vuota</p>
          <p className="text-sm text-gray-400">Genera la lista dalla pagina Dieta o aggiungi articoli manualmente</p>
        </div>
      ) : (
        categories.map((cat) => (
          <div key={cat} className="card p-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{cat}</h3>
            <div className="space-y-2">
              {items.filter((i) => i.category === cat).map((item) => (
                <div key={item.id} className={`flex items-center gap-3 p-2 rounded-lg ${item.checked ? 'bg-gray-50 dark:bg-gray-800/50' : ''}`}>
                  <button
                    onClick={() => toggleChecked(item.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                      item.checked ? 'bg-success-500 text-white' : 'border-2 border-gray-300 dark:border-gray-600 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${item.checked ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>{item.name}</p>
                    <p className="text-xs text-gray-500">{item.quantity}</p>
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="p-1.5 text-gray-400 hover:text-error-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="flex gap-2">
        <button onClick={() => setAdding(true)} className="btn-primary flex-1">
          <Plus className="w-4 h-4" /> Aggiungi
        </button>
        <button onClick={() => setShowExport(true)} className="btn-secondary flex-1" disabled={items.length === 0}>
          <Download className="w-4 h-4" /> Esporta
        </button>
        {checkedCount > 0 && (
          <button onClick={clearChecked} className="btn-ghost">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {adding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setAdding(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl p-4 animate-slide-up space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Nuovo Articolo</h2>
              <button onClick={() => setAdding(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <input className="input" placeholder="Nome articolo" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} autoFocus />
            <div className="grid grid-cols-2 gap-3">
              <input className="input" placeholder="Categoria" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
              <input className="input" placeholder="Quantità" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
            </div>
            <button onClick={addItem} className="btn-primary w-full">Aggiungi Articolo</button>
          </div>
        </div>
      )}

      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowExport(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-xl animate-scale-in max-w-xs w-full mx-4 space-y-3">
            <h2 className="text-lg font-semibold text-center">Esporta Lista</h2>
            <button onClick={exportPDF} className="btn-primary w-full">
              <FileText className="w-4 h-4" /> Esporta come PDF
            </button>
            <button onClick={exportList} className="btn-secondary w-full">
              <Download className="w-4 h-4" /> Esporta come Testo
            </button>
            <button onClick={() => setShowExport(false)} className="btn-ghost w-full">Annulla</button>
          </div>
        </div>
      )}
    </div>
  );
}
