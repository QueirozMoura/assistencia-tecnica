import { X, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/formatPrice";
import { getItemPrice } from "../../hooks/useCart";

export default function CartDrawer({
  open,
  onClose,
  items,
  onRemove,
  onUpdateQty,
  total,
}) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e8ee]">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#003366]" />
            <h2 className="font-semibold text-[#003366] text-lg">Carrinho</h2>
            {items.length > 0 && (
              <span className="bg-[#0070ea] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-[#43474f]"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-16 h-16 bg-[#f1f4f9] rounded-full flex items-center justify-center">
                <ShoppingCart size={28} className="text-[#c3c6d1]" />
              </div>
              <div>
                <p className="font-medium text-[#181c20]">Carrinho vazio</p>
                <p className="text-sm text-[#737780] mt-1">
                  Adicione produtos para continuar
                </p>
              </div>
              <Link
                to="/catalogo"
                onClick={onClose}
                className="bg-[#0070ea] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#0059bb] transition-colors"
              >
                Ver Produtos
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-3 p-3 bg-[#f7f9ff] rounded-xl"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#181c20] line-clamp-2 leading-tight">
                    {item.name}
                  </p>
                  <p className="text-xs text-[#737780] mt-0.5">{item.brand}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 rounded-full bg-white border border-[#c3c6d1] flex items-center justify-center hover:border-[#0070ea] transition-colors"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                        className="w-6 h-6 rounded-full bg-white border border-[#c3c6d1] flex items-center justify-center hover:border-[#0070ea] transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#003366]">
                      {formatPrice(getItemPrice(item) * Number(item.quantity || 0))}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 text-[#737780] hover:text-[#ba1a1a] transition-colors self-start"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-5 py-4 border-t border-[#e5e8ee] space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#43474f] font-medium">Total</span>
              <span className="text-xl font-bold text-[#003366]">
                {formatPrice(total)}
              </span>
            </div>
            <p className="text-xs text-[#737780]">
              Em até 12x de {formatPrice(total / 12)} sem juros
            </p>
            <button className="w-full bg-[#0070ea] text-white py-3 rounded-xl font-semibold hover:bg-[#0059bb] transition-colors">
              Finalizar Compra
            </button>
            <button
              onClick={onClose}
              className="w-full border border-[#c3c6d1] text-[#43474f] py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
