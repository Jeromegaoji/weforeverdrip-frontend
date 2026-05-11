"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";

const BASE_URL = "https://weforeverdrip-backend-1.onrender.com";
const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

const IMAGE_FALLBACKS = {
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

export default function ProductsPage() {
  const cursorRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  // FIX: Added AbortController with 10s timeout + cleanup on unmount
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const fetchCategories = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/api/v1/products/categories/`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error fetching categories:", err);
        }
      } finally {
        clearTimeout(timer);
      }
    };

    fetchCategories();
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  // FIX: Added AbortController with 10s timeout + cleanup on unmount/re-run
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        let url = `${BASE_URL}/api/v1/products/`;
        if (selectedCategory) {
          url += `?category=${selectedCategory}`;
        }
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Server error — please try again");
        const data = await response.json();
        setProducts(data.results || data);
      } catch (err) {
        if (err.name === "AbortError") {
          setError("Request timed out. The server may be waking up — try again in a moment.");
        } else {
          setError(err.message);
        }
        setProducts([]);
      } finally {
        setLoading(false);
        clearTimeout(timer);
      }
    };

    fetchProducts();
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [selectedCategory]);

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primary = product.images.find((img) => img.is_primary);
      const imageUrl = primary ? primary.image : product.images[0].image;
      if (imageUrl) {
        return imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`;
      }
    }
    return IMAGE_FALLBACKS[product.slug] || "/whiteshirt.JPEG";
  };

  const isProductAvailable = (product) => {
    if (!product.variants || product.variants.length === 0) return false;
    return product.variants.some((v) => v.in_stock);
  };

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
        {/* PAGE HEADING */}
        <h1
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(4rem, 10vw, 8rem)",
            color: "var(--cream)",
            letterSpacing: "0.05em",
            marginBottom: "4rem",
            textAlign: "center",
          }}
        >
          THE COLLECTION
        </h1>

        {/* CATEGORY FILTERS */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "4rem",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "0.85rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              border: "1px solid var(--cream)",
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
              background:
                selectedCategory === null ? "var(--red)" : "transparent",
              color: "var(--cream)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              if (selectedCategory !== null)
                e.currentTarget.style.background = "#222";
            }}
            onMouseLeave={(e) => {
              if (selectedCategory !== null)
                e.currentTarget.style.background = "transparent";
            }}
          >
            All
          </button>

          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              style={{
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.85rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: "1px solid var(--cream)",
                padding: "0.75rem 1.5rem",
                cursor: "pointer",
                background:
                  selectedCategory === cat.slug ? "var(--red)" : "transparent",
                color: "var(--cream)",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== cat.slug)
                  e.currentTarget.style.background = "#222";
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== cat.slug)
                  e.currentTarget.style.background = "transparent";
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* LOADING STATE */}
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <p style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: "1rem" }}>
              Loading...
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--red)" }}>
            <p style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: "1rem" }}>
              {error}
            </p>
            <button
              onClick={() => setSelectedCategory(selectedCategory)}
              style={{
                marginTop: "1.5rem",
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.85rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                border: "1px solid var(--cream)",
                background: "transparent",
                color: "var(--cream)",
                padding: "0.75rem 2rem",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* PRODUCTS GRID */}
        {!loading && !error && (
          <div
            className="products-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2rem",
            }}
          >
            {products.map((product) => {
              const available = isProductAvailable(product);

              return (
                <div
                  key={product.id}
                  style={{
                    background: "#111",
                    border: "1px solid #1a1a1a",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "transform 0.3s, box-shadow 0.3s",
                    opacity: available ? 1 : 0.6,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-8px)";
                    e.currentTarget.style.boxShadow =
                      "0 20px 40px rgba(217,26,10,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* IMAGE CONTAINER */}
                  <div
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      height: "350px",
                      background: "#000",
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
                    {!available && (
                      <div
                        style={{
                          position: "absolute",
                          top: "1rem",
                          right: "1rem",
                          background: "#000",
                          color: "var(--cream)",
                          fontFamily: "var(--font-barlow-condensed)",
                          fontSize: "0.7rem",
                          letterSpacing: "0.2em",
                          textTransform: "uppercase",
                          padding: "0.35rem 0.75rem",
                          border: "1px solid #333",
                        }}
                      >
                        Sold Out
                      </div>
                    )}
                  </div>

                  {/* PRODUCT INFO */}
                  <div style={{ padding: "1.5rem" }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-barlow-condensed)",
                        fontSize: "1rem",
                        color: "var(--cream)",
                        marginBottom: "0.5rem",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {product.name}
                    </h3>
                    <p
                      style={{
                        fontFamily: "var(--font-barlow-condensed)",
                        fontSize: "1.2rem",
                        color: "var(--red)",
                        marginBottom: "1rem",
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

                    {/* FIX: <Link> instead of <a> — no full page reload */}
                    <Link
                      href={`/products/${product.slug}`}
                      style={{
                        display: "block",
                        background: available ? "var(--red)" : "#333",
                        color: "var(--cream)",
                        fontFamily: "var(--font-barlow-condensed)",
                        fontSize: "0.85rem",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        border: "none",
                        padding: "1rem",
                        textAlign: "center",
                        cursor: "pointer",
                        textDecoration: "none",
                        transition: "background 0.3s",
                      }}
                      onMouseEnter={(e) => {
                        if (available)
                          e.currentTarget.style.background = "#c71609";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = available
                          ? "var(--red)"
                          : "#333";
                      }}
                    >
                      {available ? "SHOP NOW" : "SOLD OUT"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem" }}>
            <p style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: "1rem" }}>
              No products found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}