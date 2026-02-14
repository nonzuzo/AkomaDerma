import React from "react";
import heroImage from "../assets/hero-image.png";
import { useNavigate } from "react-router-dom"; // THIS LINE

// Main landing page component
export default function LandingPage() {
  const navigate = useNavigate(); 
  // Centralized inline styles object
  const styles = {
    // Top navigation bar styling
    navbar: {
      backgroundColor: "#ffffff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      padding: "1rem 0",
      position: "sticky",
      top: 0,
      zIndex: 1000,
    },
    // Shared container for consistent page width
    container: {
      maxWidth: "1140px",
      margin: "0 auto",
      padding: "0 15px",
    },
    // Navigation link styling
    navLink: {
      padding: "0.5rem 1rem",
      textDecoration: "none",
      color: "#000",
      fontWeight: "600",
      transition: "color 0.3s",
    },
    // Primary call-to-action button
    btnPrimary: {
      backgroundColor: "#3db5e6",
      color: "white",
      padding: "1rem 3rem",
      fontSize: "1.1rem",
      borderRadius: "8px",
      cursor: "pointer",
      border: "none",
      fontWeight: "600",
      transition: "all 0.3s",
    },
    // Hero section background and spacing
    heroSection: {
      padding: "4rem 0",
      backgroundColor: "#e8eef5",
    },
    // Generic section spacing
    section: {
      padding: "4rem 0",
    },
    // Flex row used across layout (Bootstrap-style)
    row: {
      display: "flex",
      flexWrap: "wrap",
      margin: "0 -15px",
      alignItems: "center",
    },
    // 50% width column
    col6: {
      flex: "0 0 50%",
      maxWidth: "50%",
      padding: "0 15px",
    },
    // 33% width column
    col4: {
      flex: "0 0 33.333%",
      maxWidth: "33.333%",
      padding: "0 15px",
    },

    // Card styling used in Products section
    card: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "2rem",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      height: "100%", // Enables equal-height cards with flexbox
      transition: "transform 0.3s, box-shadow 0.3s",
    },
    // Responsive image styling
    imgFluid: {
      maxWidth: "100%",
      height: "auto",
      borderRadius: "1rem",
      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    },
  };

  // Sample hero image placeholder
  const heroImageStyle = {
    ...styles.imgFluid,
    height: "450px",
    width: "100%",
    objectFit: "cover",
    backgroundColor: "#d4e4f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    // Page wrapper
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      {/* Navigation Bar */}
      <nav style={styles.navbar}>
        <div style={styles.container}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Logo / Brand */}
            <a
              style={{
                textDecoration: "none",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
              href="#home"
            >
              <span style={{ color: "#3db5e6" }}>Akoma</span>
              <span style={{ color: "#000" }}>Derma</span>
            </a>

            {/* Navigation links */}
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <a style={styles.navLink} href="#home">
                Home
              </a>
              <a style={styles.navLink} href="#products">
                Products
              </a>
              <a style={styles.navLink} href="#about">
                About Us
              </a>
              <a style={styles.navLink} href="#benefits">
                Benefits
              </a>
              <a
                href="#signup"
                style={{
                  ...styles.navLink,
                  color: "#3db5e6",
                  fontSize: "1.1rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => navigate("/signup")} //////////////////////////////////////////////
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" style={styles.heroSection}>
        <div style={styles.container}>
          <div style={styles.row}>
            <div style={styles.col6}>
              <p
                style={{
                  color: "#6c757d",
                  fontStyle: "italic",
                  marginBottom: "1rem",
                }}
              >
                Welcome to the future of skin health in Ghana!
              </p>

              <h1
                style={{
                  fontSize: "3rem",
                  fontWeight: "bold",
                  marginBottom: "1rem",
                }}
              >
                Connecting <span style={{ color: "#3db5e6" }}>Ghana</span> to
              </h1>
              <h1
                style={{
                  fontSize: "3rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                }}
              >
                Expert <span style={{ color: "#3db5e6" }}>Dermatology</span>{" "}
                Care!
              </h1>

              <p
                style={{
                  fontSize: "1.25rem",
                  marginBottom: "1.5rem",
                  maxWidth: "500px",
                }}
                //const navigate = useNavigate();
              >
               
                <span style={{ fontWeight: "600" }}>AkomaDerma</span> is a
                secure AI teledermatology platform connecting Ghanaian{" "}
                <span style={{ color: "#3db5e6" }}>dermatologists</span> for
                fast and accurate skin health management.
              </p>
              

              {/* Primary CTA button with hover effects */}
              <button
                style={styles.btnPrimary}
                onClick={() => navigate("/signup")}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#2c9bc9";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#3db5e6";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Register Now
              </button>
            </div>
            {/* Hero image column */}

            <div style={styles.col6}>
              <div style={{ maxWidth: "550px", marginLeft: "auto" }}>
                <img
                  src={heroImage}
                  alt="Teledermatology consultation"
                  style={{
                    width: "100%",
                    height: "auto",
                    borderRadius: "12px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section
        id="products"
        style={{ ...styles.section, backgroundColor: "#f8f9fa" }}
      >
        <div style={styles.container}>
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "3rem",
            }}
          >
            Our <span style={{ color: "#3db5e6" }}>Products</span>
          </h2>
          <div style={styles.row}>
            <div style={{ ...styles.col4, marginBottom: "2rem" }}>
              <div
                style={styles.card}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(0,0,0,0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#3db5e6",
                    borderRadius: "12px",
                    marginBottom: "1.5rem",
                  }}
                ></div>
                <h3 style={{ fontWeight: "bold", marginBottom: "1rem" }}>
                  Case Capture
                </h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6" }}>
                  Easily record patient details and high-quality skin images,
                  ensuring every case is complete and ready for specialist
                  review.
                </p>
              </div>
            </div>

            <div style={{ ...styles.col4, marginBottom: "2rem" }}>
              <div
                style={styles.card}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(0,0,0,0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#3db5e6",
                    borderRadius: "12px",
                    marginBottom: "1.5rem",
                  }}
                ></div>
                <h3 style={{ fontWeight: "bold", marginBottom: "1rem" }}>
                  AI Triage
                </h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6" }}>
                  Advanced AI algorithms classify and prioritize skin cases
                  instantly, helping dermatologists focus on urgent or complex
                  cases first.
                </p>
              </div>
            </div>

            <div style={{ ...styles.col4, marginBottom: "2rem" }}>
              <div
                style={styles.card}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 16px rgba(0,0,0,0.15)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
                }}
              >
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    backgroundColor: "#3db5e6",
                    borderRadius: "12px",
                    marginBottom: "1.5rem",
                  }}
                ></div>
                <h3 style={{ fontWeight: "bold", marginBottom: "1rem" }}>
                  Teleconsultation
                </h3>
                <p style={{ color: "#6c757d", lineHeight: "1.6" }}>
                  Securely connect with certified dermatologists remotely,
                  enabling expert guidance while reducing unnecessary referrals.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" style={styles.section}>
        <div style={styles.container}>
          <div style={styles.row}>
            <div style={styles.col6}>
              <div
                style={{
                  ...heroImageStyle,
                  height: "400px",
                  marginRight: "2rem",
                }}
              >
                <span style={{ color: "#6c757d", fontSize: "1.2rem" }}>
                  About Image
                </span>
              </div>
            </div>
            <div style={styles.col6}>
              <h2
                style={{
                  fontSize: "2.5rem",
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                }}
              >
                About <span style={{ color: "#3db5e6" }}>AkomaDerma</span>
              </h2>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "#6c757d",
                  lineHeight: "1.8",
                  marginBottom: "1.5rem",
                }}
              >
                AkomaDerma is transforming dermatological care in Ghana by using
                innovative technology to connect local clinics with certified
                dermatologists. Our mission is to make quality skin health
                services accessible to all Ghanaians, reducing misdiagnosis and
                improving patient outcomes, no matter where they live.
              </p>
              <p
                style={{
                  fontSize: "1.1rem",
                  color: "#6c757d",
                  lineHeight: "1.8",
                  marginBottom: "1.5rem",
                }}
              >
                Founded with a vision to address the shortage of dermatologists
                in Ghana, we combine artificial intelligence with expert medical
                knowledge to provide fast, accurate, and affordable skin health
                solutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section
        id="benefits"
        style={{ ...styles.section, backgroundColor: "#e8eef5" }}
      >
        <div style={styles.container}>
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: "1rem",
            }}
          >
            Why Choose <span style={{ color: "#3db5e6" }}>AkomaDerma?</span>
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#6c757d",
              fontSize: "1.1rem",
              marginBottom: "3rem",
              maxWidth: "700px",
              margin: "0 auto 3rem auto",
            }}
          >
            Experience the future of dermatology in Ghana with a platform
            designed to connect clinics, AI support, and certified
            dermatologists.
          </p>

          <div style={styles.row}>
            <div style={{ ...styles.col6, marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "#3db5e6",
                    borderRadius: "8px",
                    marginRight: "1.5rem",
                    flexShrink: 0,
                  }}
                ></div>
                <div>
                  <h4
                    style={{
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      fontSize: "1.3rem",
                    }}
                  >
                    Accessible Clinics
                  </h4>
                  <p style={{ color: "#6c757d", lineHeight: "1.6" }}>
                    Enable low-resource clinics to submit cases and access
                    specialist guidance without patients traveling long
                    distances.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ ...styles.col6, marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "#3db5e6",
                    borderRadius: "8px",
                    marginRight: "1.5rem",
                    flexShrink: 0,
                  }}
                ></div>
                <div>
                  <h4
                    style={{
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      fontSize: "1.3rem",
                    }}
                  >
                    AI-Assisted Triage
                  </h4>
                  <p style={{ color: "#6c757d", lineHeight: "1.6" }}>
                    Prioritize and classify cases automatically, helping
                    dermatologists review urgent or complex cases efficiently.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ ...styles.col6, marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "#3db5e6",
                    borderRadius: "8px",
                    marginRight: "1.5rem",
                    flexShrink: 0,
                  }}
                ></div>
                <div>
                  <h4
                    style={{
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      fontSize: "1.3rem",
                    }}
                  >
                    Affordable Care
                  </h4>
                  <p style={{ color: "#6c757d", lineHeight: "1.6" }}>
                    Reduce unnecessary referrals and associated costs, making
                    quality dermatology care more accessible for all.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ ...styles.col6, marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    backgroundColor: "#3db5e6",
                    borderRadius: "8px",
                    marginRight: "1.5rem",
                    flexShrink: 0,
                  }}
                ></div>
                <div>
                  <h4
                    style={{
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      fontSize: "1.3rem",
                    }}
                  >
                    Expert Network
                  </h4>
                  <p style={{ color: "#6c757d", lineHeight: "1.6" }}>
                    Connect with a network of certified dermatologists who
                    provide accurate, timely guidance for diverse skin
                    conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer style={{ backgroundColor: "white", padding: "3rem 0" }}>
        <div style={styles.container}>
          <div style={styles.row}>
            <div style={{ ...styles.col4, marginBottom: "2rem" }}>
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "2rem",
                  textAlign: "center",
                  minHeight: "150px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <h4
                  style={{ color: "#6c757d", fontStyle: "italic", margin: 0 }}
                >
                  Logo here
                </h4>
              </div>
            </div>

            <div style={{ ...styles.col4, marginBottom: "2rem" }}>
              <h4
                style={{
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                  color: "#3db5e6",
                }}
              >
                Contacts
              </h4>
              <p
                style={{
                  marginBottom: "0.25rem",
                  color: "#6c757d",
                  fontStyle: "italic",
                }}
              >
                AkomaDerma Health
              </p>
              <p
                style={{
                  marginBottom: "0.25rem",
                  color: "#6c757d",
                  fontStyle: "italic",
                }}
              >
                Ashesi University
              </p>
              <p
                style={{
                  marginBottom: "0.25rem",
                  color: "#6c757d",
                  fontStyle: "italic",
                }}
              >
                Berekuso Ghana
              </p>
              <p
                style={{
                  marginBottom: 0,
                  color: "#6c757d",
                  fontStyle: "italic",
                }}
              >
                +2330000000
              </p>
            </div>

            <div style={{ ...styles.col4, marginBottom: "2rem" }}>
              <h4
                style={{
                  fontWeight: "bold",
                  marginBottom: "1.5rem",
                  color: "#3db5e6",
                }}
              >
                Quick Links
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <a
                  href="#about"
                  style={{
                    color: "#6c757d",
                    textDecoration: "none",
                    fontStyle: "italic",
                  }}
                >
                  About Us
                </a>
                <a
                  href="#products"
                  style={{
                    color: "#6c757d",
                    textDecoration: "none",
                    fontStyle: "italic",
                  }}
                >
                  Products
                </a>
                <a
                  href="#benefits"
                  style={{
                    color: "#6c757d",
                    textDecoration: "none",
                    fontStyle: "italic",
                  }}
                >
                  Benefits
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
