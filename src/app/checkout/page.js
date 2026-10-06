"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../components/Navbar";
import { authFetch } from "@/lib/apiClient";
import { useCart } from "@/context/CartContext";

// Flat shipping fee shown in the order summary, in naira.
// IMPORTANT: this must match SHIPPING_FEE_KOBO in the backend settings.py
// (300000 kobo = N3,000). The backend is the source of truth: it works out
// the real total when the order is placed, and the confirmation page shows
// that real amount. This number only drives the preview on this page.
const SHIPPING_FEE_NAIRA = 3000;

const formatNaira = (amount) =>
  Number(amount || 0).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  });

// The backend reports errors in a few shapes:
//   { detail: "Cart is empty." }
//   { non_field_errors: ["..."] }
//   { street: ["This field may not be blank."] }
// This turns any of them into one plain sentence.
const FIELD_LABELS = {
  shipping_address_id: "Address",
  street: "Street",
  city: "City",
  state: "State",
  country: "Country",
  notes: "Notes",
};

function extractError(data, fallback) {
  if (!data || typeof data !== "object") return fallback;
  if (typeof data.detail === "string") return data.detail;
  const [key, value] = Object.entries(data)[0] || [];
  const message = Array.isArray(value) ? value[0] : value;
  if (typeof message !== "string") return fallback;
  if (key === "non_field_errors") return message;
  return `${FIELD_LABELS[key] || key}: ${message}`;
}

// ---- shared inline styles (same look as the auth and cart pages) ----
const labelStyle = {
  display: "block",
  fontFamily: "var(--font-barlow-condensed)",
  fontSize: "0.85rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "0.5rem",
  opacity: 0.8,
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  background: "#111",
  border: "1px solid #222",
  color: "var(--cream)",
  fontSize: "1rem",
  fontFamily: "var(--font-barlow)",
  boxSizing: "border-box",
  transition: "border 0.3s",
};

const sectionHeadingStyle = {
  fontFamily: "var(--font-barlow-condensed)",
  fontSize: "0.85rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--red)",
  marginBottom: "1.25rem",
};

const redButtonStyle = {
  width: "100%",
  background: "var(--red)",
  color: "var(--cream)",
  fontFamily: "var(--font-barlow-condensed)",
  fontSize: "0.85rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  border: "none",
  padding: "1.25rem",
  transition: "background 0.3s",
};

const errorBoxStyle = {
  background: "#1a0000",
  border: "1px solid var(--red)",
  padding: "1rem",
  marginBottom: "1.5rem",
  fontFamily: "var(--font-barlow-condensed)",
  fontSize: "0.9rem",
  color: "var(--red)",
};

const focusRed = (e) => {
  e.target.style.borderColor = "var(--red)";
};
const blurGrey = (e) => {
  e.target.style.borderColor = "#222";
};

// Page frame: background, custom cursor dot and Navbar.
// (The body hides the normal mouse cursor, so every page must render the dot.)
function PageShell({ cursorRef, children }) {
  return (
    <div
      style={{
        background: "var(--black)",
        minHeight: "100vh",
        color: "var(--cream)",
      }}
    >
      <div ref={cursorRef} className="cursor" />
      <Navbar />
      {children}
    </div>
  );
}

// A centred message with an optional button, used for loading / empty / error.
function CenteredMessage({ title, text, href, linkLabel }) {
  return (
    <div
      className="checkout-pad"
      style={{
        paddingTop: "8rem",
        paddingLeft: "3rem",
        paddingRight: "3rem",
        paddingBottom: "6rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 8rem)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "3rem",
            color: "var(--cream)",
            marginBottom: "1.5rem",
          }}
        >
          {title}
        </h1>
        {text && (
          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "1rem",
              color: "rgba(240,235,224,0.7)",
              marginBottom: "2rem",
            }}
          >
            {text}
          </p>
        )}
        {href && (
          <Link
            href={href}
            style={{
              display: "inline-block",
              background: "var(--red)",
              color: "var(--cream)",
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "0.85rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "1rem 2rem",
              textDecoration: "none",
            }}
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { setCartCount } = useCart();
  const cursorRef = useRef(null);
  // A ref changes instantly; state does not. This blocks a fast double-click
  // on "Place Order" from sending two requests before the button disables.
  const placingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [cart, setCart] = useState(null);

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: "",
    city: "",
    state: "",
    country: "Nigeria",
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState(null);

  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState(null);

  // Custom cursor dot follows the mouse.
  useEffect(() => {
    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top = e.clientY + "px";
      }
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  // Load the cart and saved addresses at the same time.
  useEffect(() => {
    if (!localStorage.getItem("wfd_access")) {
      router.replace("/auth");
      return;
    }

    const load = async () => {
      try {
        // Promise.all starts both requests together and waits for both,
        // so the page loads in the time of the slower one, not the sum.
        const [cartRes, addressRes] = await Promise.all([
          authFetch("/api/v1/orders/cart/", { method: "GET" }),
          authFetch("/api/v1/auth/addresses/", { method: "GET" }),
        ]);
        if (!cartRes.ok || !addressRes.ok) {
          throw new Error(
            "Could not load your checkout details. Please try again.",
          );
        }
        const cartData = await cartRes.json();
        const addressData = await addressRes.json();
        const list = Array.isArray(addressData)
          ? addressData
          : addressData.results || [];

        setCart(cartData);
        setAddresses(list);
        const preferred = list.find((a) => a.is_default) || list[0];
        setSelectedAddressId(preferred ? preferred.id : null);
        setShowAddressForm(list.length === 0);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router]);

  const updateNewAddress = (field) => (e) =>
    setNewAddress((prev) => ({ ...prev, [field]: e.target.value }));

  const handleAddAddress = async (e) => {
    e.preventDefault();
    setAddressError(null);

    const street = newAddress.street.trim();
    const city = newAddress.city.trim();
    const state = newAddress.state.trim();
    const country = newAddress.country.trim() || "Nigeria";

    if (!street || !city || !state) {
      setAddressError("Please fill in street, city and state.");
      return;
    }

    try {
      setSavingAddress(true);
      const res = await authFetch("/api/v1/auth/addresses/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          street,
          city,
          state,
          country,
          // The first address a customer saves becomes their default.
          is_default: addresses.length === 0,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(extractError(data, "Could not save the address."));
      }
      setAddresses((prev) => [...prev, data]);
      setSelectedAddressId(data.id);
      setNewAddress({ street: "", city: "", state: "", country: "Nigeria" });
      setShowAddressForm(false);
    } catch (err) {
      setAddressError(err.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (placingRef.current) return;
    if (!selectedAddressId) {
      setOrderError("Please choose or add a delivery address.");
      return;
    }

    placingRef.current = true;
    setPlacing(true);
    setOrderError(null);

    try {
      const res = await authFetch("/api/v1/orders/place/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping_address_id: selectedAddressId,
          notes: notes.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          extractError(data, "Could not place your order. Please try again."),
        );
      }
      if (!data || !data.order_number) {
        throw new Error(
          "Your order may have been placed but we could not open it. Please message us on WhatsApp before trying again.",
        );
      }

      // The backend emptied the cart, so clear the navbar badge too.
      setCartCount(0);
      // On success we leave the button disabled while the page changes.
      router.push(`/orders/${data.order_number}`);
    } catch (err) {
      setOrderError(err.message);
      placingRef.current = false;
      setPlacing(false);
    }
  };

  // ---------- states other than the main page ----------
  if (loading) {
    return (
      <PageShell cursorRef={cursorRef}>
        <CenteredMessage title="LOADING CHECKOUT..." />
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell cursorRef={cursorRef}>
        <CenteredMessage
          title="SOMETHING WENT WRONG"
          text={loadError}
          href="/cart"
          linkLabel="Back to Cart"
        />
      </PageShell>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <PageShell cursorRef={cursorRef}>
        <CenteredMessage
          title="NOTHING TO CHECK OUT"
          text="Your cart is empty."
          href="/products"
          linkLabel="Continue Shopping"
        />
      </PageShell>
    );
  }

  // ---------- main page ----------
  const subtotal = Number(cart.total_naira || 0);
  const total = subtotal + SHIPPING_FEE_NAIRA;

  return (
    <PageShell cursorRef={cursorRef}>
      <div
        className="checkout-pad"
        style={{
          paddingTop: "8rem",
          paddingLeft: "3rem",
          paddingRight: "3rem",
          paddingBottom: "6rem",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(2.5rem, 8vw, 5rem)",
            color: "var(--cream)",
            marginBottom: "3rem",
            letterSpacing: "0.05em",
          }}
        >
          CHECKOUT
        </h1>

        <div
          className="checkout-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* LEFT: address + notes */}
          <div>
            <h2 style={sectionHeadingStyle}>1. Delivery address</h2>

            {addresses.map((addr) => {
              const selected = addr.id === selectedAddressId;
              return (
                <label
                  key={addr.id}
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "flex-start",
                    padding: "1rem 1.25rem",
                    marginBottom: "0.75rem",
                    background: "#111",
                    border: selected
                      ? "1px solid var(--red)"
                      : "1px solid #1a1a1a",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selected}
                    onChange={() => setSelectedAddressId(addr.id)}
                    style={{ accentColor: "var(--red)", marginTop: "0.3rem" }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--font-barlow)",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {addr.street}
                    <br />
                    {addr.city}, {addr.state}, {addr.country}
                    {addr.is_default && (
                      <span
                        style={{
                          marginLeft: "0.75rem",
                          fontFamily: "var(--font-barlow-condensed)",
                          fontSize: "0.7rem",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          opacity: 0.6,
                        }}
                      >
                        Default
                      </span>
                    )}
                  </span>
                </label>
              );
            })}

            {!showAddressForm && (
              <button
                type="button"
                onClick={() => setShowAddressForm(true)}
                style={{
                  background: "transparent",
                  color: "var(--cream)",
                  border: "1px solid var(--cream)",
                  fontFamily: "var(--font-barlow-condensed)",
                  fontSize: "0.85rem",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  padding: "0.75rem 1.5rem",
                  cursor: "pointer",
                  marginTop: "0.5rem",
                }}
              >
                + Add a new address
              </button>
            )}

            {showAddressForm && (
              <form
                onSubmit={handleAddAddress}
                style={{
                  background: "#111",
                  border: "1px solid #1a1a1a",
                  padding: "1.5rem",
                  marginTop: "0.5rem",
                }}
              >
                {addressError && <div style={errorBoxStyle}>{addressError}</div>}

                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={labelStyle}>Street address</label>
                  <input
                    type="text"
                    value={newAddress.street}
                    onChange={updateNewAddress("street")}
                    style={{ ...inputStyle, background: "#080808" }}
                    onFocus={focusRed}
                    onBlur={blurGrey}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div>
                    <label style={labelStyle}>City</label>
                    <input
                      type="text"
                      value={newAddress.city}
                      onChange={updateNewAddress("city")}
                      style={{ ...inputStyle, background: "#080808" }}
                      onFocus={focusRed}
                      onBlur={blurGrey}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>State</label>
                    <input
                      type="text"
                      value={newAddress.state}
                      onChange={updateNewAddress("state")}
                      style={{ ...inputStyle, background: "#080808" }}
                      onFocus={focusRed}
                      onBlur={blurGrey}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={labelStyle}>Country</label>
                  <input
                    type="text"
                    value={newAddress.country}
                    onChange={updateNewAddress("country")}
                    style={{ ...inputStyle, background: "#080808" }}
                    onFocus={focusRed}
                    onBlur={blurGrey}
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    style={{
                      ...redButtonStyle,
                      width: "auto",
                      padding: "0.9rem 2rem",
                      cursor: savingAddress ? "not-allowed" : "pointer",
                      opacity: savingAddress ? 0.6 : 1,
                    }}
                  >
                    {savingAddress ? "SAVING..." : "SAVE ADDRESS"}
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setAddressError(null);
                      }}
                      style={{
                        background: "transparent",
                        color: "rgba(240,235,224,0.6)",
                        border: "none",
                        fontFamily: "var(--font-barlow-condensed)",
                        fontSize: "0.85rem",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            <h2 style={{ ...sectionHeadingStyle, marginTop: "3rem" }}>
              2. Order notes (optional)
            </h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Anything we should know about your delivery?"
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={focusRed}
              onBlur={blurGrey}
            />
          </div>

          {/* RIGHT: order summary */}
          <div
            style={{
              background: "#111",
              border: "1px solid #1a1a1a",
              padding: "2rem",
            }}
          >
            <h2 style={{ ...sectionHeadingStyle, color: "var(--cream)", opacity: 0.8 }}>
              Order summary
            </h2>

            {cart.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  marginBottom: "1rem",
                  fontFamily: "var(--font-barlow)",
                  fontSize: "0.9rem",
                }}
              >
                <div>
                  <div>{item.variant.product_name}</div>
                  <div style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                    {[item.variant.size, item.variant.colour]
                      .filter(Boolean)
                      .join(" / ")}{" "}
                    · Qty {item.quantity}
                  </div>
                </div>
                <div>{formatNaira(item.subtotal_naira)}</div>
              </div>
            ))}

            <div
              style={{
                borderTop: "1px solid #222",
                paddingTop: "1.25rem",
                marginTop: "1.25rem",
                fontFamily: "var(--font-barlow)",
                fontSize: "0.95rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                }}
              >
                <span>Subtotal</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                }}
              >
                <span>Shipping</span>
                <span>{formatNaira(SHIPPING_FEE_NAIRA)}</span>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid #222",
                paddingTop: "1.25rem",
                marginTop: "0.5rem",
                marginBottom: "2rem",
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-bebas)",
                fontSize: "1.5rem",
                color: "var(--red)",
              }}
            >
              <span>Total</span>
              <span>{formatNaira(total)}</span>
            </div>

            {orderError && <div style={errorBoxStyle}>{orderError}</div>}

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
              style={{
                ...redButtonStyle,
                cursor: placing ? "not-allowed" : "pointer",
                opacity: placing ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!placing) e.currentTarget.style.background = "#c71609";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--red)";
              }}
            >
              {placing ? "PLACING ORDER..." : "PLACE ORDER"}
            </button>

            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "0.8rem",
                lineHeight: 1.6,
                opacity: 0.6,
                marginTop: "1rem",
              }}
            >
              You pay by bank transfer. We show our account details on the next
              page, and your order is confirmed once we receive your payment.
            </p>

            <Link
              href="/cart"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "1rem",
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.85rem",
                color: "rgba(240,235,224,0.6)",
                textDecoration: "none",
                letterSpacing: "0.1em",
              }}
            >
              Back to cart
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}