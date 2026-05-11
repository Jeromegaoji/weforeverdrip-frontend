"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

export default function CartPage() {
  const router = useRouter();
  const cursorRef = useRef(null);

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});
  const [token, setToken] = useState(null);

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

  // Check for auth token
  useEffect(() => {
    const accessToken = localStorage.getItem("wfd_access");
    setToken(accessToken);

    if (!accessToken) {
      setLoading(false);
      return;
    }

    // Fetch cart
    const fetchCart = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://web-production-5fcc4.up.railway.app/api/v1/orders/cart/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch cart");
        }

        const data = await response.json();
        setCart(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setCart(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }

    try {
      setUpdating((prev) => ({ ...prev, [itemId]: true }));
      const response = await fetch(
        `https://web-production-5fcc4.up.railway.app/api/v1/orders/cart/item/${itemId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity: newQuantity }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      // Refresh cart
      const cartResponse = await fetch(
        "https://web-production-5fcc4.up.railway.app/api/v1/orders/cart/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const updatedCart = await cartResponse.json();
      setCart(updatedCart);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const removeItem = async (itemId) => {
    try {
      setUpdating((prev) => ({ ...prev, [itemId]: true }));
      const response = await fetch(
        `https://web-production-5fcc4.up.railway.app/api/v1/orders/cart/item/${itemId}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      // Refresh cart
      const cartResponse = await fetch(
        "https://web-production-5fcc4.up.railway.app/api/v1/orders/cart/",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const updatedCart = await cartResponse.json();
      setCart(updatedCart);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  if (!token) {
    return (
      <div
        style={{
          background: "var(--black)",
          minHeight: "100vh",
          color: "var(--cream)",
        }}
      >
        <div ref={cursorRef} className="cursor" />
        <Navbar cartCount={0} />

        <div
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
                marginBottom: "2rem",
              }}
            >
              LOGIN REQUIRED
            </h1>
            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "1rem",
                color: "rgba(240,235,224,0.7)",
                marginBottom: "2rem",
              }}
            >
              Please log in to view your cart
            </p>
            <a
              href="/auth"
              style={{
                display: "inline-block",
                background: "var(--red)",
                color: "var(--cream)",
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.85rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: "none",
                padding: "1rem 2rem",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          background: "var(--black)",
          minHeight: "100vh",
          color: "var(--cream)",
        }}
      >
        <div ref={cursorRef} className="cursor" />
        <Navbar cartCount={0} />

        <div
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
          <p
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "1rem",
            }}
          >
            Loading cart...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "var(--black)",
          minHeight: "100vh",
          color: "var(--cream)",
        }}
      >
        <div ref={cursorRef} className="cursor" />
        <Navbar cartCount={0} />

        <div
          style={{
            paddingTop: "8rem",
            paddingLeft: "3rem",
            paddingRight: "3rem",
            paddingBottom: "6rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "1rem",
              color: "var(--red)",
            }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div
        style={{
          background: "var(--black)",
          minHeight: "100vh",
          color: "var(--cream)",
        }}
      >
        <div ref={cursorRef} className="cursor" />
        <Navbar cartCount={0} />

        <div
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
                marginBottom: "2rem",
              }}
            >
              YOUR CART IS EMPTY
            </h1>
            <p
              style={{
                fontFamily: "var(--font-barlow)",
                fontSize: "1rem",
                color: "rgba(240,235,224,0.7)",
                marginBottom: "2rem",
              }}
            >
              Start shopping to add items to your cart
            </p>
            <a
              href="/products"
              style={{
                display: "inline-block",
                background: "var(--red)",
                color: "var(--cream)",
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.85rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: "none",
                padding: "1rem 2rem",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "var(--black)",
        minHeight: "100vh",
        color: "var(--cream)",
      }}
    >
      <div ref={cursorRef} className="cursor" />
      <Navbar cartCount={cart.item_count || 0} />

      <div
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
          YOUR CART
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "4rem",
          }}
        >
          {/* CART ITEMS */}
          <div>
            {cart.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "2rem",
                  paddingBottom: "2rem",
                  borderBottom: "1px solid #222",
                  marginBottom: "2rem",
                  alignItems: "center",
                }}
              >
                <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                  {item.variant.size && (
                    <p
                      style={{
                        fontFamily: "var(--font-barlow-condensed)",
                        fontSize: "0.85rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Size: <strong>{item.variant.size}</strong>
                    </p>
                  )}
                  {item.variant.colour && (
                    <p
                      style={{
                        fontFamily: "var(--font-barlow-condensed)",
                        fontSize: "0.85rem",
                      }}
                    >
                      Color: <strong>{item.variant.colour}</strong>
                    </p>
                  )}
                </div>

                <div>
                  <h3
                    style={{
                      fontFamily: "var(--font-barlow-condensed)",
                      fontSize: "1rem",
                      color: "var(--cream)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {item.variant.product.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-barlow-condensed)",
                      fontSize: "0.9rem",
                      color: "var(--red)",
                    }}
                  >
                    {item.subtotal_naira
                      ? Number(item.subtotal_naira).toLocaleString("en-NG", {
                          style: "currency",
                          currency: "NGN",
                          minimumFractionDigits: 0,
                        })
                      : "Price TBA"}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      border: "1px solid #222",
                      overflow: "hidden",
                    }}
                  >
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updating[item.id]}
                      style={{
                        background: "transparent",
                        color: "var(--cream)",
                        border: "none",
                        padding: "0.5rem 0.75rem",
                        cursor: updating[item.id] ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-barlow-condensed)",
                        fontSize: "0.9rem",
                        opacity: updating[item.id] ? 0.5 : 1,
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        padding: "0.5rem 1rem",
                        fontFamily: "var(--font-barlow-condensed)",
                        fontSize: "0.9rem",
                      }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating[item.id]}
                      style={{
                        background: "transparent",
                        color: "var(--cream)",
                        border: "none",
                        padding: "0.5rem 0.75rem",
                        cursor: updating[item.id] ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-barlow-condensed)",
                        fontSize: "0.9rem",
                        opacity: updating[item.id] ? 0.5 : 1,
                      }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    disabled={updating[item.id]}
                    style={{
                      background: "transparent",
                      color: "var(--red)",
                      border: "1px solid var(--red)",
                      padding: "0.5rem 0.75rem",
                      cursor: updating[item.id] ? "not-allowed" : "pointer",
                      fontFamily: "var(--font-barlow-condensed)",
                      fontSize: "0.75rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      opacity: updating[item.id] ? 0.5 : 1,
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ORDER SUMMARY */}
          <div
            style={{
              background: "#111",
              border: "1px solid #1a1a1a",
              padding: "2rem",
              height: "fit-content",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.85rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                opacity: 0.8,
                marginBottom: "1.5rem",
              }}
            >
              Order Summary
            </h3>

            <div style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-barlow)",
                  fontSize: "0.95rem",
                  marginBottom: "0.75rem",
                }}
              >
                <span>Subtotal</span>
                <span>
                  {cart.total_naira
                    ? Number(cart.total_naira).toLocaleString("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 0,
                      })
                    : "₦0"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-barlow)",
                  fontSize: "0.95rem",
                  marginBottom: "0.75rem",
                  opacity: 0.7,
                }}
              >
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid #222",
                paddingTop: "1.5rem",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-bebas)",
                  fontSize: "1.25rem",
                  color: "var(--red)",
                }}
              >
                <span>Total</span>
                <span>
                  {cart.total_naira
                    ? Number(cart.total_naira).toLocaleString("en-NG", {
                        style: "currency",
                        currency: "NGN",
                        minimumFractionDigits: 0,
                      })
                    : "₦0"}
                </span>
              </div>
            </div>

            <button
              style={{
                width: "100%",
                background: "var(--red)",
                color: "var(--cream)",
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.85rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: "none",
                padding: "1.25rem",
                cursor: "pointer",
                transition: "background 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#c71609";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--red)";
              }}
            >
              Proceed to Checkout
            </button>

            <a
              href="/products"
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
              Continue Shopping
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
