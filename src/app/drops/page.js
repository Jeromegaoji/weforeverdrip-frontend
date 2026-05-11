"use client";
import Navbar from "../components/Navbar";

export default function DropsPage() {
  return (
    <div
      style={{
        background: "var(--black)",
        minHeight: "100vh",
        color: "var(--cream)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Navbar cartCount={0} />
      <div style={{ textAlign: "center", paddingTop: "100px" }}>
        <p
          style={{
            fontFamily: "var(--font-barlow-condensed)",
            fontSize: "0.8rem",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "var(--red)",
            marginBottom: "1rem",
          }}
        >
          Coming Soon
        </p>
        <h1
          style={{
            fontFamily: "var(--font-bebas)",
            fontSize: "clamp(4rem, 10vw, 9rem)",
            color: "var(--cream)",
            lineHeight: 0.85,
          }}
        >
          THE DROPS
        </h1>
        <p
          style={{
            fontFamily: "var(--font-barlow)",
            fontSize: "1rem",
            color: "var(--cream)",
            opacity: 0.6,
            marginTop: "1.5rem",
          }}
        >
          Limited releases. Be ready.
        </p>
      </div>
    </div>
  );
}
