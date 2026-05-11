"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "../../components/Navbar";

// FIX (Bug 2): Updated BASE_URL from Railway → Render
const BASE_URL = "https://weforeverdrip-backend-1.onrender.com";

const imageMap = {
  "regular-white-tee": "/whiteshirt.JPEG",
  "black-oversized-tee": "/blackshirt.JPEG",
  "navy-active-shorts": "/blueshorts.JPEG",
  "camo-bucket-hats": "/bucket_hat.jpg",
  "wood-black-beanie": "/weforeverdripbeanie.JPEG",
  "wood-boxer-set": "/boxer_set.jpg",
  "wood-black-sweatshirt": "/blacksweatshirt.JPEG",
  "wood-white-sweatshirt": "/sweatshirt.JPEG",
  "wood-socks": "/socks.JPEG",
  "wood-trucker-caps": "/trucker_cap.jpg",
};

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;
  const cursorRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState(null);

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

  // FIX (Bug 2): Updated fetch URL from Railway → Render
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${BASE_URL}/api/v1/products/${slug}/`,
        );
        if (!response.ok) throw new Error("Product not found");
        const data = await response.json();
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          // Auto-select first variant that's in stock; fall back to first overall
          const firstAvailable = data.variants.find((v) => v.in_stock);
          setSelectedVariant(firstAvailable || data.variants[0]);
        }
        setError(null);
      } catch (err) {
        setError(err.message);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primary = product.images.find((img) => img.is_primary);
      const imageUrl = primary ? primary.image : product.images[0].image;
      if (imageUrl) {
        // FIX (Bug 2): Prepends correct Render BASE_URL for relative /media/ paths
        return imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`;
      }
    }
    return imageMap[product.slug] || "/whiteshirt.JPEG";
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem("wfd_access");
    if (!token) {
      router.push("/auth");
      return;
    }

    if (!selectedVariant) {
      setCartMessage({ type: "error", text: "Please select a size" });
      return;
    }

    try {
      setAddingToCart(true);
      // FIX (Bug 2): Updated fetch URL from Railway → Render
      const response = await fetch(
        `${BASE_URL}/api/v1/orders/cart/add/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            variant_id: selectedVariant.id,
            quantity: 1,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to add to cart");
      }

      setCartMessage({ type: "success", text: "Added to cart!" });
      setTimeout(() => setCartMessage(null), 2000);
    } catch (err) {
      setCartMessage({ type: "error", text: err.message });
    } finally {
      setAddingToCart(false);
    }
  };

  // FIX (Bug 4): Cursor div and Navbar now live in a single persistent wrapper
  // that's always rendered, regardless of loading/error/success state.
  // Previously, cursorRef was duplicated across three separate return branches,
  // which caused the cursor element to remount on every state transition.
  return (
    <div
      style={{
        background: "var(--black)",
        minHeight: "100vh",
        color: "var(--cream)",
      }}
    >
      {/* CURSOR — rendered once, stays mounted through all state changes */}
      <div ref={cursorRef} className="cursor" />
      <Navbar cartCount={0} />

      {/* LOADING STATE */}
      {loading && (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "1rem",
            }}
          >
            Loading...
          </p>
        </div>
      )}

      {/* ERROR STATE */}
      {!loading && (error || !product) && (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "1rem",
                color: "var(--red)",
              }}
            >
              {error || "Product not found"}
            </p>
            <a
              href="/products"
              style={{
                marginTop: "2rem",
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
              Back to Products
            </a>
          </div>
        </div>
      )}

      {/* PRODUCT DETAIL — only rendered when we have data */}
      {!loading && !error && product && (
        <div
          style={{
            paddingTop: "8rem",
            paddingLeft: "3rem",
            paddingRight: "3rem",
            paddingBottom: "6rem",
          }}
        >
          <div
            className="product-detail-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4rem",
            }}
          >
            {/* LEFT: PRODUCT IMAGE */}
            <div
              style={{
                position: "sticky",
                top: "150px",
                height: "fit-content",
              }}
            >
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  aspectRatio: "1/1",
                  background: "#111",
                  border: "1px solid #1a1a1a",
                }}
              >
                <img
                  src={getProductImage(product)}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
              </div>
            </div>

            {/* RIGHT: PRODUCT INFO */}
            <div>
              <span
                style={{
                  fontFamily: "var(--font-barlow-condensed)",
                  fontSize: "0.75rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--red)",
                  display: "block",
                  marginBottom: "1.5rem",
                }}
              >
                {product.category?.name || "APPAREL"}
              </span>

              <h1
                style={{
                  fontFamily: "var(--font-bebas)",
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  color: "var(--cream)",
                  lineHeight: 0.9,
                  marginBottom: "1.5rem",
                  letterSpacing: "0.05em",
                }}
              >
                {product.name}
              </h1>

              <p
                style={{
                  fontFamily: "var(--font-barlow-condensed)",
                  fontSize: "1.5rem",
                  color: "var(--red)",
                  marginBottom: "2rem",
                  letterSpacing: "0.05em",
                }}
              >
                {product.price_naira
                  ? Number(product.price_naira).toLocaleString("en-NG", {
                      style: "currency",
                      currency: "NGN",
                      minimumFractionDigits: 0,
                    })
                  : "Price TBA"}
              </p>

              {/* SIZE SELECTOR */}
              <div style={{ marginBottom: "2.5rem" }}>
                <p
                  style={{
                    fontFamily: "var(--font-barlow-condensed)",
                    fontSize: "0.9rem",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    marginBottom: "1rem",
                    opacity: 0.8,
                  }}
                >
                  Select Size
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "0.75rem",
                    flexWrap: "wrap",
                  }}
                >
                  {product.variants && product.variants.length > 0 ? (
                    product.variants.map((variant) => (
                      // FIX (Bug 5): Use variant.id as key instead of array index.
                      // Array-index keys break React's reconciliation when the
                      // variants list order changes — variant.id is stable.
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={!variant.in_stock}
                        style={{
                          fontFamily: "var(--font-barlow-condensed)",
                          fontSize: "0.85rem",
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          border: "1px solid",
                          padding: "0.75rem 1.25rem",
                          cursor: variant.in_stock ? "pointer" : "not-allowed",
                          background:
                            selectedVariant?.id === variant.id
                              ? "var(--red)"
                              : "transparent",
                          color: "var(--cream)",
                          borderColor:
                            selectedVariant?.id === variant.id
                              ? "var(--red)"
                              : "var(--cream)",
                          opacity: !variant.in_stock ? 0.5 : 1,
                          transition: "all 0.3s",
                        }}
                        onMouseEnter={(e) => {
                          if (
                            variant.in_stock &&
                            selectedVariant?.id !== variant.id
                          ) {
                            e.currentTarget.style.background = "#222";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (
                            variant.in_stock &&
                            selectedVariant?.id !== variant.id
                          ) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {variant.size}
                        {!variant.in_stock && (
                          <span style={{ fontSize: "0.7rem" }}> (OUT)</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <p style={{ color: "var(--red)" }}>No sizes available</p>
                  )}
                </div>
              </div>

              {/* ADD TO CART BUTTON */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedVariant}
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
                  cursor: addingToCart ? "not-allowed" : "pointer",
                  transition: "background 0.3s",
                  marginBottom: "2rem",
                  opacity: addingToCart || !selectedVariant ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!addingToCart && selectedVariant) {
                    e.currentTarget.style.background = "#c71609";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!addingToCart && selectedVariant) {
                    e.currentTarget.style.background = "var(--red)";
                  }
                }}
              >
                {addingToCart ? "ADDING..." : "ADD TO CART"}
              </button>

              {/* CART MESSAGE */}
              {cartMessage && (
                <p
                  style={{
                    fontFamily: "var(--font-barlow-condensed)",
                    fontSize: "0.9rem",
                    letterSpacing: "0.1em",
                    color:
                      cartMessage.type === "success"
                        ? "var(--cream)"
                        : "var(--red)",
                    marginBottom: "2rem",
                  }}
                >
                  {cartMessage.text}
                </p>
              )}

              {/* DESCRIPTION */}
              {product.description && (
                <div
                  style={{
                    marginTop: "3rem",
                    paddingTop: "2rem",
                    borderTop: "1px solid #222",
                  }}
                >
                  <h3
                    style={{
                      fontFamily: "var(--font-barlow-condensed)",
                      fontSize: "0.9rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      marginBottom: "1rem",
                      opacity: 0.8,
                    }}
                  >
                    About This Item
                  </h3>
                  <p
                    style={{
                      fontFamily: "var(--font-barlow)",
                      fontSize: "0.95rem",
                      lineHeight: 1.8,
                      opacity: 0.8,
                    }}
                  >
                    {product.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}