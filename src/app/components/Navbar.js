"use client";
import Link from "next/link";

export default function Navbar({ cartCount = 0 }) {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1.5rem 3rem",
        background: "linear-gradient(to bottom, rgba(8,8,8,0.9), transparent)",
      }}
    >
      <Link href="/">
        <img
          src="/weforeverdriplogo-removebg-preview.png"
          alt="WOOD"
          style={{
            height: "50px",
            filter: "brightness(2) invert(1)",
            display: "block",
          }}
        />
      </Link>
      <div
        style={{
          display: "flex",
          gap: "2.5rem",
          fontFamily: "var(--font-barlow-condensed)",
          fontSize: "0.85rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        <Link
          href="/products"
          style={{ color: "var(--cream)", textDecoration: "none" }}
        >
          Shop
        </Link>
        <Link
          href="/drops"
          style={{ color: "var(--cream)", textDecoration: "none" }}
        >
          Drops
        </Link>
        <Link
          href="/cart"
          style={{
            position: "relative",
            color: "var(--cream)",
            textDecoration: "none",
          }}
        >
          Cart
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-12px",
                background: "var(--red)",
                color: "var(--cream)",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: "bold",
              }}
            >
              {cartCount}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
