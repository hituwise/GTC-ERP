import React, { useState, useEffect } from "react";
import { Sparkles, Check, ShoppingCart, Truck, Mail, Phone, User, MapPin, CreditCard, RefreshCw, AlertCircle, Landmark } from "lucide-react";

export default function PublicMaterialOrderForm() {
  const [products, setProducts] = useState<any[]>([]);
  const [shippingRule, setShippingRule] = useState<any>(null);
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  
  // Buyer Details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [placedOrderId, setPlacedOrderId] = useState("");

  const [saasHolder, setSaasHolder] = useState("Abacus Academy Head Office");
  const [saasBank, setSaasBank] = useState("ICICI Bank");
  const [saasAccount, setSaasAccount] = useState("001205009876");
  const [saasIfsc, setSaasIfsc] = useState("ICIC0000012");
  const [saasUpi, setSaasUpi] = useState("abacus@icici");

  // Fetch products, shipping settings, and superadmin bank details on mount
  useEffect(() => {
    fetch("/api/erp/data")
      .then(res => res.json())
      .then(resJson => {
        if (resJson.success && resJson.data) {
          setProducts(resJson.data.materialProducts || []);
          setShippingRule(resJson.data.shippingSettings || {
            baseWeightLimit: 500,
            baseShippingCharge: 60,
            additionalWeightStep: 500,
            additionalShippingCharge: 40
          });
        }
      })
      .catch(err => console.error("Error loading public catalog:", err));

    fetch("/api/erp/superadmin-payment-details")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.details) {
          setSaasHolder(data.details.holderName || "Abacus Academy Head Office");
          setSaasBank(data.details.bankName || "ICICI Bank");
          setSaasAccount(data.details.accountNumber || "001205009876");
          setSaasIfsc(data.details.ifscCode || "ICIC0000012");
          setSaasUpi(data.details.upiId || "abacus@icici");
        }
      })
      .catch(err => console.error("Error loading bank details:", err));
  }, []);

  // Cart operations
  const updateQty = (id: string, delta: number) => {
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[id];
      } else {
        updated[id] = next;
      }
      return updated;
    });
  };

  // Calculations
  const cartItems = Object.keys(cart).map(id => {
    const p = products.find(prod => prod.id === id);
    return {
      product: p,
      quantity: cart[id]
    };
  }).filter(item => item.product !== undefined);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const totalWeight = cartItems.reduce((acc, item) => acc + ((item.product.weight || 0) * item.quantity), 0);

  // Dynamic shipping fee based on weight rules
  let shippingCharge = 0;
  if (totalWeight > 0 && shippingRule) {
    const baseLimit = Number(shippingRule.baseWeightLimit) || 500;
    const baseCharge = Number(shippingRule.baseShippingCharge) || 60;
    const stepWeight = Number(shippingRule.additionalWeightStep) || 500;
    const stepCharge = Number(shippingRule.additionalShippingCharge) || 40;

    if (totalWeight <= baseLimit) {
      shippingCharge = baseCharge;
    } else {
      const extra = totalWeight - baseLimit;
      const steps = Math.ceil(extra / stepWeight);
      shippingCharge = baseCharge + (steps * stepCharge);
    }
  }

  const grandTotal = subtotal + shippingCharge;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setErrorMsg("Your order cart is empty. Please select at least one material tool or workbook.");
      return;
    }
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim() || !paymentRef.trim()) {
      setErrorMsg("Please fill in all buyer details and the payment Reference ID.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const payload = {
      buyerType: "External",
      buyerName: name,
      buyerEmail: email,
      buyerPhone: phone,
      centerId: "EXTERNAL",
      address,
      paymentMethod: "UPI Transfer",
      paymentRef,
      paymentStatus: "Pending", // to be verified by superadmin
      items: cartItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }))
    };

    try {
      const res = await fetch("/api/erp/inventory/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.order) {
        setPlacedOrderId(data.order.id);
        setIsSuccess(true);
        setCart({});
      } else {
        setErrorMsg(data.error || "Failed to process your order. Please verify details.");
      }
    } catch (err) {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans selection:bg-indigo-600 selection:text-white" id="public-material-ordering-desk">
      <header className="relative z-10 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 py-4 px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20 text-lg uppercase">
              GP
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight font-display text-slate-900">GENIPLUS ACADEMY</h1>
              <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Independent Teacher Ordering Desk</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1"><Truck className="w-4 h-4 text-emerald-600" /> Pan-India Rapid Dispatch</span>
            <span className="h-4 w-px bg-slate-200"></span>
            <span className="flex items-center gap-1"><Check className="w-4 h-4 text-indigo-600" /> Authorized Curriculum Tools</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {isSuccess ? (
          <div className="lg:col-span-12 bg-white border border-slate-200 rounded-3xl p-8 lg:p-12 text-center space-y-6 max-w-2xl mx-auto shadow-xl animate-fade-in my-8">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-black shadow-inner">
              ✓
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black tracking-tight text-slate-900 font-display">Order Placed Successfully!</h2>
              <p className="text-emerald-600 font-bold text-sm uppercase tracking-wide">Order reference: #{placedOrderId}</p>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed">
              We have received your order request and your transaction reference ID (<span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{paymentRef}</span>). Our admin will verify the deposit shortly. Once approved, your materials package will be packed and dispatched.
            </p>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left text-xs space-y-2 text-slate-500">
              <p className="font-bold text-slate-700 flex items-center gap-1">📌 Next steps for your order:</p>
              <p>• A confirmation mail containing the delivery invoice will be sent to <span className="text-indigo-600 font-semibold">{email}</span>.</p>
              <p>• Once shipped, your courier tracking ID will be shared with you via email and WhatsApp (<span className="text-indigo-600 font-semibold">{phone}</span>).</p>
            </div>
            <button
              onClick={() => {
                setIsSuccess(false);
                setName("");
                setEmail("");
                setPhone("");
                setAddress("");
                setPaymentRef("");
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md"
            >
              Order Additional Materials
            </button>
          </div>
        ) : (
          <>
            {/* LEFT COLUMN: PRODUCT CATALOG */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  Select Material & Level Kits
                </h2>
                <p className="text-xs text-slate-500">Choose authorized abacus equipment and curriculum worksheets to add to your shipment.</p>
              </div>

              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 text-slate-400 space-y-3 shadow-xs">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-xs font-bold font-display">Fetching inventory from academy database...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map(p => {
                    const qty = cart[p.id] || 0;
                    return (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all shadow-xs">
                        <div className="space-y-1.5">
                          {p.image && (
                            <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 mb-3 flex items-center justify-center shrink-0">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                          )}
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-black text-sm text-slate-900 font-display line-clamp-2 leading-snug">{p.name}</h3>
                            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                              ₹{p.price}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{p.description}</p>
                          <div className="flex gap-4 pt-1 text-[10px] font-mono text-slate-400">
                            <span>Weight: {p.weight}g</span>
                            <span>•</span>
                            <span>Stock: {p.stock > 0 ? `${p.stock} units` : "Out of Stock"}</span>
                          </div>
                        </div>

                        {p.stock > 0 ? (
                          <div className="flex justify-between items-center gap-4 pt-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Qty</span>
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shrink-0">
                              <button
                                type="button"
                                onClick={() => updateQty(p.id, -1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-sm font-bold"
                              >
                                -
                              </button>
                              <span className="w-8 text-center text-xs font-mono font-bold text-slate-800">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(p.id, 1)}
                                className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer text-sm font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-200 p-2 text-center rounded-xl text-[10px] font-bold text-rose-500">
                            Temporarily Out Of Stock
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: CALCULATOR & DETAILS FORM */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 sticky top-24">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-black text-slate-900 font-display">Shipment & Cost Summary</h3>
                </div>

                {cartItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                    <p className="font-bold text-slate-600">No products selected yet.</p>
                    <p>Adjust the quantities on the left to instantly calculate total weight and shipping charges.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Selected items */}
                    <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {cartItems.map(item => (
                        <div key={item.product!.id} className="flex justify-between items-center text-xs font-medium">
                          <div className="space-y-0.5">
                            <span className="text-slate-700 font-semibold">{item.product!.name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">
                              ₹{item.product!.price} × {item.quantity} ({(item.product!.weight || 0) * item.quantity}g)
                            </span>
                          </div>
                          <span className="font-mono text-slate-900 font-bold shrink-0">₹{item.product!.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    {/* Cost Metrics */}
                    <div className="border-t border-slate-150 pt-3 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Items Subtotal</span>
                        <span className="font-mono text-slate-900 font-bold">₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Total Package Weight</span>
                        <span className="font-mono text-indigo-600 font-bold">
                          {totalWeight >= 1000 ? `${(totalWeight / 1000).toFixed(2)} kg` : `${totalWeight} grams`}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Weight-Based Shipping</span>
                        <span className="font-mono text-slate-900 font-bold">₹{shippingCharge}</span>
                      </div>
                      <div className="flex justify-between border-t border-dashed border-slate-200 pt-3 text-sm font-black">
                        <span className="text-indigo-600">GRAND TOTAL</span>
                        <span className="font-mono text-slate-900 text-base">₹{grandTotal}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* FORM PANEL */}
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Buyer & Delivery Particulars
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Teacher / School name"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Contact Mobile</label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="WhatsApp number"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Complete Courier Address</label>
                      <textarea
                        required
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House / Office No, Street Name, City, State, PIN Code"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* AOS BANK DETAILS PANEL */}
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold uppercase text-indigo-950 tracking-wider flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-indigo-600" /> Official AOS Banking Details
                    </h4>
                    
                    <div className="bg-white border border-indigo-100 rounded-xl p-3 text-xs space-y-2">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-400 font-medium">Bank Name</span>
                        <span className="font-extrabold text-slate-800">{saasBank}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-400 font-medium">Account Holder</span>
                        <span className="font-extrabold text-slate-800">{saasHolder}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-400 font-medium">Account Number</span>
                        <span className="font-mono font-black text-slate-800 select-all">{saasAccount}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-400 font-medium">IFSC Routing Code</span>
                        <span className="font-mono font-black text-slate-800 select-all">{saasIfsc}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-medium">UPI Gateway ID</span>
                        <span className="font-mono font-black text-indigo-600 select-all">{saasUpi}</span>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-normal">
                      Kindly pay the pending amount <span className="font-black text-slate-800">₹{grandTotal}</span> using Bank IMPS/NEFT transfer or any UPI App to the credentials above.
                    </p>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-indigo-950 uppercase">UPI / Txn Reference ID (12 Digits)</label>
                      <input
                        type="text"
                        required
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="E.g. Bank IMPS Ref or UPI UTR ID"
                        className="w-full bg-white border border-indigo-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-950 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-xs font-semibold flex items-start gap-1.5 leading-snug">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || cartItems.length === 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Transmitting Order Details...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>Place Order & Submit Reference ID (₹{grandTotal})</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400 mt-12">
        <p>© {new Date().getFullYear()} Geniplus Academy Learning System. All Rights Reserved.</p>
        <p className="mt-1 text-[10px] text-slate-300">Secure 256-bit encrypted payload communication with central server.</p>
      </footer>
    </div>
  );
}
