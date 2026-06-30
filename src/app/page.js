"use client";
import Link from "next/link"
import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";

const BASE_URL = "https://weforeverdrip.fly.dev";
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

export default function Home() {
  const cursorRef = useRef(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [errorFeatured, setErrorFeatured] = useState(null);

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

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoadingFeatured(true);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        const res = await fetch(
          `${BASE_URL}/api/v1/products/`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setFeaturedProducts(Array.isArray(data) ? data : data.results || []);
        setErrorFeatured(null);
      } catch (err) {
        if (err.name === "AbortError") {
          setErrorFeatured("Server is waking up — please refresh in a moment");
        } else {
          setErrorFeatured(err.message);
        }
        setFeaturedProducts([]);
      } finally {
        setLoadingFeatured(false);
      }
    };
    fetchFeatured();
  }, []);

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) {
      const primary = product.images.find((img) => img.is_primary);
      const imageUrl = primary ? primary.image : product.images[0].image;
      if (imageUrl) {
        return imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`;
      }
    }
    return imageMap[product.slug] || "/whiteshirt.JPEG";
  };

  return (
    <>
      <div ref={cursorRef} className="cursor" />
      <Navbar cartCount={0} />

      {/* HERO */}
      <section
        style={{
          height: "100vh",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          padding: "4rem 3rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/wood_scrapershot.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            filter: "brightness(0.45)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <img
            src="/weforeverdriplogo-removebg-preview.png"
            alt="W∞D"
            style={{
             height: "clamp(8rem, 22vw, 18rem)",
              filter: "brightness(2) invert(1)",
             display: "block",
             marginBottom: "1rem",
          }}
        />
          <p
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "1rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--cream)",
              opacity: 0.7,
              marginTop: "0.5rem",
            }}
          >
            We Forever Drip — Enugu, Nigeria
          </p>
        </div>
      </section>

      {/* TICKER */}
      <div
        style={{
          background: "var(--red)",
          overflow: "hidden",
          padding: "0.75rem 0",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            animation: "ticker 20s linear infinite",
            fontFamily: "var(--font-barlow-condensed)",
            fontSize: "0.85rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--cream)",
          }}
        >
          {["a", "b"].map((key) => (
            <span key={key} style={{ display: "inline-block", paddingRight: "4rem", whiteSpace: "nowrap" }}>
              {`WE FOREVER DRIP · ENUGU · NIGERIA · W∞\uFE0ED · WE FOREVER DRIP · ENUGU · NIGERIA · W∞\uFE0ED · WE FOREVER DRIP · ENUGU · NIGERIA · W∞\uFE0ED ·`}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes ticker {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      </div>

      {/* IDENTITY SECTION */}
      <section
        style={{
          height: "90vh",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          padding: "4rem 3rem",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/cameo_x_unknown.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.3)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "600px" }}>
          <p
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "0.8rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--red)",
              marginBottom: "1.5rem",
            }}
          >
            The Brand
          </p>
          <h2
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(3rem, 7vw, 6rem)",
              lineHeight: 0.9,
              color: "var(--cream)",
              marginBottom: "2rem",
            }}
          >
            Built from the streets.
            <br />
            Made for the world.
          </h2>
          <p
            style={{
              fontFamily: "var(--font-barlow)",
              fontSize: "1rem",
              lineHeight: 1.8,
              color: "var(--cream)",
              opacity: 0.7,
            }}
          >
            We Forever Drip is not just clothing. It's a movement rooted in
            Enugu's raw energy, worn by those who move different.
          </p>
        </div>
      </section>

      {/* CREW SECTION */}
      <section
        style={{
          height: "90vh",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/wood_crew.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            filter: "brightness(0.35)",
          }}
        />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <h2
            style={{
              fontFamily: "var(--font-bebas)",
              fontSize: "clamp(4rem, 12vw, 12rem)",
              lineHeight: 0.85,
              color: "var(--cream)",
              letterSpacing: "0.05em",
            }}
          >
            The Culture
          </h2>
          <p
            style={{
              fontFamily: "var(--font-barlow-condensed)",
              fontSize: "0.85rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--red)",
              marginTop: "1rem",
            }}
          >
            Enugu · Nigeria · Global
          </p>
        </div>
      </section>

      {/* LOOKBOOK */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          height: "80vh",
        }}
      >
        <div
          style={{
            backgroundImage: "url(/cameo_black_and_white.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.7)",
          }}
        />
        <div
          style={{
            backgroundImage: "url(/tatiana_x_wood.jpeg)",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            filter: "brightness(0.7)",
          }}
        />
      </section>

      {/* FEATURED PRODUCTS */}
      <section
        style={{
          background: "var(--black)",
          padding: "6rem 3rem",
          color: "var(--cream)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(3rem, 8vw, 7rem)",
            color: "var(--cream)",
            letterSpacing: "0.05em",
            marginBottom: "4rem",
            textAlign: "center",
          }}
        >
          FEATURED DROPS
        </h2>

        {loadingFeatured && (
          <div style={{ textAlign: "center", padding: "4rem" }}>
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

        {errorFeatured && (
          <div
            style={{ textAlign: "center", padding: "4rem", color: "var(--red)" }}
          >
            <p
              style={{ fontFamily: "var(--font-barlow-condensed)", fontSize: "1rem" }}
            >
              {errorFeatured}
            </p>
          </div>
        )}

        {!loadingFeatured && !errorFeatured && featuredProducts.length === 0 && (
          <p
            style={{
              textAlign: "center",
              fontFamily: "var(--font-barlow-condensed)",
              color: "var(--cream)",
              opacity: 0.5,
            }}
          >
            No drops yet — check back soon.
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
          }}
        >
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              style={{
                background: "#111",
                border: "1px solid #1a1a1a",
                overflow: "hidden",
                cursor: "pointer",
                transition: "transform 0.3s, box-shadow 0.3s",
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
              </div>
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
                <Link
                  href={`/products/${product.slug}`}
                  style={{
                    display: "block",
                    background: "var(--red)",
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
                    e.currentTarget.style.background = "#c71609";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--red)";
                  }}
                >
                  SHOP NOW
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          background: "#0d0d0d",
          padding: "3rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "var(--font-barlow-condensed)",
          fontSize: "0.8rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "rgba(240, 235, 224, 0.6)",
        }}
      >
        <span>
          W<span style={{ color: "var(--red)" }}>{"∞\uFE0E"}</span>D © 2026
        </span>
        <span>Weforeverdrip Clothing · CAC Reg. No. 3503283</span>
        <span>Enugu, Nigeria</span>
      </footer>
    </>
  );
}