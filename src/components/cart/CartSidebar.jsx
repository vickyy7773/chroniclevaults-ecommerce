import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, Minus, Plus, Shield, Truck, Award, CreditCard, Gift } from 'lucide-react';

const CartSidebar = ({
  cart,
  cartItemCount,
  cartTotal,
  totalSavings,
  setShowCart,
  updateQuantity,
  removeFromCart
}) => {
  const navigate = useNavigate();

  const handleCheckout = () => {
    console.log('🛒 Checkout button clicked');
    console.log('📦 Cart data being passed:', cart);
    console.log('📦 Cart length:', cart.length);

    if (!cart || cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      // User not logged in - redirect to authentication page
      console.log('🚫 User not logged in, redirecting to authentication...');
      setShowCart(false);
      navigate('/authentication', {
        state: {
          from: '/checkout',
          cartItems: cart
        }
      });
      return;
    }

    // User is logged in - proceed to checkout
    console.log('✅ User logged in, proceeding to checkout');
    setShowCart(false);
    navigate('/checkout', {
      state: {
        cartItems: cart
      }
    });
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={() => setShowCart(false)}
      />
      
      {/* Cart Sidebar */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-gradient-to-b from-primary-50 to-white shadow-strong z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b-2 border-accent-400 bg-gradient-accent text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black flex items-center space-x-2">
              <ShoppingCart className="w-6 h-6" />
              <span>Shopping Cart</span>
            </h3>
            <button
              onClick={() => setShowCart(false)}
              className="text-white/90 hover:text-white hover:scale-110 transition-all p-2 hover:bg-white/20 rounded-xl"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {cartItemCount > 0 && (
            <div className="mt-2 text-white/95 text-sm font-semibold">
              {cartItemCount} items • ₹{cartTotal.toFixed(2)}
            </div>
          )}
        </div>
        
        {/* Cart Items - Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 animate-bounce-soft">🛒</div>
              <p className="text-neutral-600 mb-4 font-semibold text-lg">Your cart is empty</p>
              <p className="text-sm text-neutral-500">Add some rare coins to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={item._id || item.id || index} className="card-modern p-3 animate-fade-in hover-lift">
                  <div className="flex items-start space-x-3">
                    <img
                      src={item.images ? item.images[0] : item.image}
                      alt={item.name}
                      className="w-20 h-20 sm:w-16 sm:h-16 object-cover rounded-xl shadow-soft flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm mb-1 line-clamp-2 text-neutral-900">{item.name}</h4>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-gradient font-black text-base sm:text-lg">₹{item.price}</span>
                        {item.onSale && item.originalPrice > item.price && (
                          <span className="text-xs text-neutral-500 line-through">₹{item.originalPrice}</span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-600 mb-2 font-medium">
                        Stock: {item.inStock} • {item.condition}
                      </div>

                      {/* Quantity Controls - Mobile */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 border-2 border-primary-300 rounded-xl bg-white">
                          <button
                            onClick={() => updateQuantity(item._id || item.id, item.quantity - 1)}
                            className="p-2 hover:bg-primary-100 rounded-l-xl transition-all hover:scale-110"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-neutral-900">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id || item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.inStock}
                            className="p-2 hover:bg-primary-100 rounded-r-xl disabled:opacity-50 transition-all hover:scale-110"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item._id || item.id)}
                          className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-xl transition-all hover:scale-110"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Summary & Checkout */}
        {cart.length > 0 && (
          <div className="border-t-2 border-primary-300 p-4 bg-gradient-to-b from-primary-50 to-primary-100 flex-shrink-0">
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-700 font-semibold">Subtotal:</span>
                <span className="font-bold text-neutral-900">₹{cartTotal.toFixed(2)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="font-semibold">You save:</span>
                  <span className="font-black">-₹{totalSavings.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-neutral-700 font-semibold">Shipping:</span>
                <span className="font-bold">
                  {cartTotal >= 100 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    <span className="text-neutral-900">₹9.99</span>
                  )}
                </span>
              </div>
              <div className="border-t-2 border-primary-400 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-black text-neutral-900">Total:</span>
                  <span className="text-2xl font-black text-gradient">
                    ₹{(cartTotal + (cartTotal >= 100 ? 0 : 9.99)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {cartTotal < 100 && (
              <div className="mb-4 p-3 bg-gradient-to-r from-accent-50 to-accent-100 border-2 border-accent-300 rounded-xl shadow-soft">
                <div className="flex items-center space-x-2 text-accent-800 text-sm font-semibold">
                  <Gift className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Add ₹{(100 - cartTotal).toFixed(2)} more for FREE shipping!
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleCheckout}
                className="btn-primary w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center space-x-2 shadow-medium"
              >
                <CreditCard className="w-5 h-5" />
                <span>Proceed to Checkout</span>
              </button>
              <button
                onClick={() => setShowCart(false)}
                className="btn-secondary w-full py-3 rounded-xl font-bold text-base"
              >
                Continue Shopping
              </button>
            </div>

            <div className="mt-4 pt-4 border-t-2 border-primary-300">
              <div className="grid grid-cols-3 gap-2 text-xs text-neutral-700">
                <div className="flex flex-col items-center space-y-1.5">
                  <Shield className="w-5 h-5 text-accent-600" />
                  <span className="text-center font-semibold">Secure Payment</span>
                </div>
                <div className="flex flex-col items-center space-y-1.5">
                  <Truck className="w-5 h-5 text-accent-600" />
                  <span className="text-center font-semibold">Fast Shipping</span>
                </div>
                <div className="flex flex-col items-center space-y-1.5">
                  <Award className="w-5 h-5 text-accent-600" />
                  <span className="text-center font-semibold">Certified</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;