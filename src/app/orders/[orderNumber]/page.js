"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import { authFetch } from "@/lib/apiClient";

const formatNaira = (amount) =>
  Number(amount || 0).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  });

// WhatsApp links need the number in international format with digits only
// (2348012345678). If the stored number is in local format (08012345678),
// swap the leading 0 for Nigeria's country code 234.
function whatsappDigits(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = "234" + digits.slice(1);
  }
  return digits;
}

const sectionHeadingStyle = {
  fontFamily: "var(--font-barlow-condensed)",
  fontSize: "0.85rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "var(--red)",
  marginBottom: "1.25rem",
};

const cardStyle = {
  background: "#111",
  border: "1px solid #1a1a1a",
  padding: "2rem",
  marginBottom: "2rem",
};

const bodyTextStyle = {
  fontFamily: "var(--font-barlow)",
  fontSize: "0.95rem",
  lineHeight: 1.7,
};

const notificationBoxStyle = {
  background: "#1a0000",
  border: "1px solid var(--red)",
  padding: "1rem",
  marginBottom: "1.5rem",
  fontFamily: "var(--font-barlow-condensed)",
  fontSize: "0.9rem",
  color: "var(--red)",
};

// Page frame: background, custom cursor dot and Navbar.
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

// A centred message with an optional button, used for loading / error states.
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
              ...bodyTextStyle,
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

// Small button that copies a value to the clipboard and briefly says so.
function CopyButton({ value }) {
  const [state, setState] = useState("idle"); // idle | copied | failed
  const timerRef = useRef(null);

  // Stop the timer if the page is left before it fires.
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setState("copied");
    } catch {
      setState("failed");
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setState("idle"), 2000);
  };

  const label =
    state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy";

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        background: state === "copied" ? "var(--red)" : "transparent",
        color: "var(--cream)",
        border: "1px solid var(--cream)",
        fontFamily: "var(--font-barlow-condensed)",
        fontSize: "0.75rem",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        padding: "0.5rem 1rem",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.3s",
      }}
    >
      {label}
    </button>
  );
}

// One line of bank detail: small label, big value, copy button on the right.
function DetailRow({ label, value, copyValue }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        padding: "1rem 0",
        borderBottom: "1px solid #222",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "var(--font-barlow-condensed)",
            fontSize: "0.75rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            opacity: 0.6,
            marginBottom: "0.25rem",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-barlow-condensed)",
            fontSize: "1.25rem",
            letterSpacing: "0.05em",
            wordBreak: "break-all",
          }}
        >
          {value}
        </div>
      </div>
      <CopyButton value={copyValue ?? value} />
    </div>
  );
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.orderNumber;
  const cursorRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [order, setOrder] = useState(null);
  const [bank, setBank] = useState(null);
  const [bankError, setBankError] = useState(false);

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

  // Everything on this page comes from the API (nothing is passed along from
  // checkout), so refreshing the page or opening the link later still works.
  useEffect(() => {
    if (!localStorage.getItem("wfd_access")) {
      router.replace("/auth");
      return;
    }

    const load = async () => {
      try {
        const safeNumber = encodeURIComponent(orderNumber);
        const orderRes = await authFetch(`/api/v1/orders/${safeNumber}/`, {
          method: "GET",
        });
        // The backend only returns the logged-in user's own orders, so
        // someone else's order number also comes back as 404.
        if (orderRes.status === 404) {
          setNotFound(true);
          return;
        }
        if (!orderRes.ok) {
          throw new Error("Could not load your order. Please try again.");
        }
        const orderData = await orderRes.json();
        setOrder(orderData);

        // Only unpaid, non-cancelled orders need payment instructions.
        if (
          orderData.payment_status === "unpaid" &&
          orderData.status !== "cancelled"
        ) {
          const bankRes = await authFetch(
            `/api/v1/orders/${safeNumber}/bank-transfer/`,
            { method: "GET" },
          );
          if (bankRes.ok) {
            setBank(await bankRes.json());
          } else {
            setBankError(true);
          }
        }
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [orderNumber, router]);

  // ---------- states other than the main page ----------
  if (loading) {
    return (
      <PageShell cursorRef={cursorRef}>
        <CenteredMessage title="LOADING ORDER..." />
      </PageShell>
    );
  }

  if (notFound) {
    return (
      <PageShell cursorRef={cursorRef}>
        <CenteredMessage
          title="ORDER NOT FOUND"
          text="We couldn't find that order on your account."
          href="/products"
          linkLabel="Continue Shopping"
        />
      </PageShell>
    );
  }

  if (loadError || !order) {
    return (
      <PageShell cursorRef={cursorRef}>
        <CenteredMessage
          title="SOMETHING WENT WRONG"
          text={loadError || "Could not load your order."}
          href="/products"
          linkLabel="Continue Shopping"
        />
      </PageShell>
    );
  }

  // ---------- main page ----------
  const cancelled = order.status === "cancelled";
  const paid = order.payment_status === "paid";
  const refunded = order.payment_status === "refunded";
  const canPay = order.payment_status === "unpaid" && !cancelled;

  let heading = "ORDER PLACED";
  let subheading = "Complete your payment by bank transfer below.";
  if (cancelled) {
    heading = "ORDER CANCELLED";
    subheading = "This order was cancelled, so no payment is needed.";
  } else if (paid) {
    heading = "PAYMENT RECEIVED";
    subheading =
      "Thank you! Your order is confirmed and we'll be in touch about delivery.";
  } else if (refunded) {
    heading = "ORDER REFUNDED";
    subheading = "This order has been refunded.";
  }

  const address = order.shipping_address_snapshot || {};
  const whatsapp = bank ? whatsappDigits(bank.whatsapp_number) : "";
  const detailsMissing = bank && (!bank.bank_name || !bank.account_number);
  // If the bank details aren't set up yet, the customer hasn't paid and has
  // nowhere to pay, so the message asks for the details instead.
  const whatsappMessage = !bank
    ? ""
    : detailsMissing
      ? `Hello WEFOREVERDRIP, I'd like to pay for order ${bank.reference} (${formatNaira(bank.amount_naira)}). Please send me the payment details.`
      : `Hello WEFOREVERDRIP, I have paid ${formatNaira(bank.amount_naira)} for order ${bank.reference}. Here is my proof of payment.`;
  const placedOn = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

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
            marginBottom: "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          {heading}
        </h1>
        <p
          style={{
            ...bodyTextStyle,
            color: "rgba(240,235,224,0.7)",
            marginBottom: "3rem",
          }}
        >
          {subheading} Order{" "}
          <strong style={{ color: "var(--cream)" }}>{order.order_number}</strong>
          {placedOn ? ` · ${placedOn}` : ""}
        </p>

        <div
          className="checkout-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "4rem",
            alignItems: "start",
          }}
        >
          {/* LEFT: payment instructions + delivery details */}
          <div>
            {canPay && (
              <div style={cardStyle}>
                <h2 style={sectionHeadingStyle}>Pay by bank transfer</h2>

                {bankError && (
                  <div style={notificationBoxStyle}>
                    We couldn&apos;t load the payment details. Please refresh
                    the page.
                  </div>
                )}

                {bank && detailsMissing && (
                  <div style={notificationBoxStyle}>
                    Payment details are unavailable right now. Please contact us
                    on WhatsApp and quote your order number.
                  </div>
                )}

                {bank && !detailsMissing && (
                  <>
                    <DetailRow label="Bank" value={bank.bank_name} />
                    <DetailRow
                      label="Account name"
                      value={bank.account_name}
                    />
                    <DetailRow
                      label="Account number"
                      value={bank.account_number}
                    />
                    <DetailRow
                      label="Exact amount"
                      value={formatNaira(bank.amount_naira)}
                      copyValue={String(bank.amount_naira)}
                    />
                    <DetailRow
                      label="Payment reference"
                      value={bank.reference}
                    />

                    <p
                      style={{
                        ...bodyTextStyle,
                        fontSize: "0.85rem",
                        opacity: 0.7,
                        margin: "1.5rem 0",
                      }}
                    >
                      1. Transfer the exact amount above. 2. Use the payment
                      reference so we can match your payment. 3. Send us proof
                      of payment on WhatsApp. We confirm your order once your
                      payment arrives.
                    </p>
                  </>
                )}

                {bank && whatsapp && (
                  <a
                    href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "block",
                      boxSizing: "border-box",
                      textAlign: "center",
                      textDecoration: "none",
                      width: "100%",
                      background: "var(--red)",
                      color: "var(--cream)",
                      fontFamily: "var(--font-barlow-condensed)",
                      fontSize: "0.85rem",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      padding: "1.25rem",
                      marginTop: detailsMissing ? 0 : "0.5rem",
                    }}
                  >
                    {detailsMissing
                      ? "Contact us on WhatsApp"
                      : "Send proof on WhatsApp"}
                  </a>
                )}
              </div>
            )}

            <div style={cardStyle}>
              <h2 style={sectionHeadingStyle}>Delivery address</h2>
              <p style={bodyTextStyle}>
                {address.street}
                <br />
                {[address.city, address.state, address.country]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {order.notes && (
                <p
                  style={{
                    ...bodyTextStyle,
                    fontSize: "0.85rem",
                    opacity: 0.7,
                    marginTop: "1rem",
                  }}
                >
                  Your note: {order.notes}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: order summary */}
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            <h2
              style={{
                ...sectionHeadingStyle,
                color: "var(--cream)",
                opacity: 0.8,
              }}
            >
              Order summary
            </h2>

            {order.items.map((item) => (
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
                  <div>{item.product_name}</div>
                  <div style={{ opacity: 0.6, fontSize: "0.8rem" }}>
                    {item.variant_info} · Qty {item.quantity}
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
                <span>{formatNaira(order.subtotal_naira)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.75rem",
                }}
              >
                <span>Shipping</span>
                <span>{formatNaira(order.shipping_fee_naira)}</span>
              </div>
            </div>

            <div
              style={{
                borderTop: "1px solid #222",
                paddingTop: "1.25rem",
                marginTop: "0.5rem",
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--font-bebas)",
                fontSize: "1.5rem",
                color: "var(--red)",
              }}
            >
              <span>Total</span>
              <span>{formatNaira(order.total_naira)}</span>
            </div>

            <Link
              href="/products"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: "1.5rem",
                fontFamily: "var(--font-barlow-condensed)",
                fontSize: "0.85rem",
                color: "rgba(240,235,224,0.6)",
                textDecoration: "none",
                letterSpacing: "0.1em",
              }}
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}