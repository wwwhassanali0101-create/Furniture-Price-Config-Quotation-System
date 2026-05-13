import React, { useEffect, useMemo, useState } from "react";

const currency = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

const starterProducts = [
  {
    id: "bed-001",
    name: "Handmade Single Bed",
    category: "Bedroom Furniture",
    basePrice: 45000,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
    attributes: {
      material: [
        { label: "Pine Wood", price: 0 },
        { label: "Sheesham Wood", price: 22000 },
        { label: "Oak Wood", price: 35000 },
        { label: "Walnut Wood", price: 48000 },
      ],
      color: [
        { label: "Natural", price: 0 },
        { label: "Dark Brown", price: 3500 },
        { label: "Golden Polish", price: 7000 },
        { label: "Matte Black", price: 9000 },
      ],
      design: [
        { label: "Simple Panel", price: 0 },
        { label: "Medium CNC Carving", price: 18000 },
        { label: "Premium Floral Carving", price: 38000 },
        { label: "Heavy Royal Carving", price: 62000 },
      ],
      finish: [
        { label: "Standard Finish", price: 0 },
        { label: "Premium Polish", price: 9500 },
        { label: "Gloss Protective Coat", price: 12500 },
      ],
    },
  },
  {
    id: "bed-002",
    name: "Royal Double Bed Headboard",
    category: "Custom Woodwork",
    basePrice: 65000,
    image:
      "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=1200&auto=format&fit=crop",
    attributes: {
      material: [
        { label: "Engineered Wood", price: 0 },
        { label: "Sheesham Wood", price: 30000 },
        { label: "Oak Wood", price: 42000 },
      ],
      color: [
        { label: "Natural", price: 0 },
        { label: "Classic Brown", price: 5000 },
        { label: "Walnut Shade", price: 8500 },
      ],
      design: [
        { label: "Plain Crown", price: 0 },
        { label: "CNC Pattern", price: 24000 },
        { label: "Hand Carved Royal Pattern", price: 70000 },
      ],
      finish: [
        { label: "Standard Finish", price: 0 },
        { label: "Luxury Gloss", price: 14000 },
      ],
    },
  },
];

const emptyProductForm = {
  name: "",
  category: "Custom Furniture",
  basePrice: "",
  image: "",
};

const defaultAttributes = {
  material: [
    { label: "Standard Material", price: 0 },
    { label: "Premium Material", price: 15000 },
  ],
  color: [
    { label: "Natural", price: 0 },
    { label: "Custom Color", price: 5000 },
  ],
  design: [
    { label: "Simple Design", price: 0 },
    { label: "Premium Design", price: 25000 },
  ],
  finish: [
    { label: "Standard Finish", price: 0 },
    { label: "Premium Finish", price: 10000 },
  ],
};

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function safeProduct(product) {
  return {
    id: product?.id || "unknown-product",
    name: product?.name || "Untitled Product",
    category: product?.category || "Uncategorised",
    basePrice: Number(product?.basePrice) || 0,
    image: product?.image || "",
    attributes:
      product?.attributes && typeof product.attributes === "object"
        ? product.attributes
        : {},
  };
}

function getDefaultSelections(productInput) {
  const product = safeProduct(productInput);
  const output = {};

  Object.entries(product.attributes).forEach(([key, options]) => {
    output[key] = Array.isArray(options) && options[0]?.label ? options[0].label : "";
  });

  return output;
}

function priceBreakdown(productInput, selectionsInput, quantityInput, discountInput) {
  const product = safeProduct(productInput);
  const selections = selectionsInput && typeof selectionsInput === "object" ? selectionsInput : {};
  const quantity = clampNumber(quantityInput, 1, 9999, 1);
  const discount = clampNumber(discountInput, 0, 100, 0);
  const rows = [{ name: "Base price", value: product.basePrice }];

  Object.entries(selections).forEach(([key, selectedLabel]) => {
    const options = Array.isArray(product.attributes[key]) ? product.attributes[key] : [];
    const option = options.find((item) => item.label === selectedLabel);

    if (option) {
      rows.push({
        name: `${key.charAt(0).toUpperCase() + key.slice(1)}: ${option.label}`,
        value: Number(option.price) || 0,
      });
    }
  });

  const subtotal = rows.reduce((sum, row) => sum + row.value, 0);
  const totalBeforeDiscount = subtotal * quantity;
  const discountAmount = Math.round((totalBeforeDiscount * discount) / 100);
  const total = totalBeforeDiscount - discountAmount;

  return { rows, quantity, discount, subtotal, totalBeforeDiscount, discountAmount, total };
}

function buildQuote({ product, customerName, selections, breakdown }) {
  return {
    id: `Q-${Date.now()}`,
    date: new Date().toLocaleString(),
    customerName: customerName?.trim() || "Walk-in Customer",
    productName: product.name,
    category: product.category,
    selections: selections || {},
    rows: breakdown.rows,
    quantity: breakdown.quantity,
    discount: breakdown.discount,
    subtotal: breakdown.subtotal,
    totalBeforeDiscount: breakdown.totalBeforeDiscount,
    discountAmount: breakdown.discountAmount,
    total: breakdown.total,
    status: "Draft",
  };
}

function quoteToText(quote) {
  const lines = [
    `Quotation ID: ${quote.id}`,
    `Date: ${quote.date}`,
    `Customer: ${quote.customerName}`,
    `Product: ${quote.productName}`,
    `Category: ${quote.category}`,
    "",
    "Selected Options:",
    ...Object.entries(quote.selections || {}).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "Price Breakdown:",
    ...(quote.rows || []).map((row) => `- ${row.name}: ${currency.format(row.value)}`),
    "",
    `Quantity: ${quote.quantity}`,
    `Discount: ${quote.discount}%`,
    `Discount Amount: ${currency.format(quote.discountAmount)}`,
    `Final Total: ${currency.format(quote.total)}`,
  ];

  return lines.join("\n");
}

function downloadFile(filename, content, type = "text/plain") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function runPriceEngineTests() {
  const product = starterProducts[0];
  const selected = {
    material: "Sheesham Wood",
    color: "Golden Polish",
    design: "Heavy Royal Carving",
    finish: "Premium Polish",
  };

  const result = priceBreakdown(product, selected, 2, 10);
  console.assert(result.subtotal === 145500, "Test failed: subtotal should be 145,500");
  console.assert(result.totalBeforeDiscount === 291000, "Test failed: total before discount should be 291,000");
  console.assert(result.discountAmount === 29100, "Test failed: discount amount should be 29,100");
  console.assert(result.total === 261900, "Test failed: final total should be 261,900");

  const guarded = priceBreakdown(product, selected, -5, 500);
  console.assert(guarded.quantity === 1, "Test failed: invalid quantity should be clamped to 1");
  console.assert(guarded.discount === 100, "Test failed: discount should be clamped to 100");
  console.assert(guarded.total === 0, "Test failed: 100% discount should make total 0");

  const missingOption = priceBreakdown(product, { material: "Unknown Material" }, 1, 0);
  console.assert(missingOption.rows.length === 1, "Test failed: unknown options should not be priced");

  const nullSafe = priceBreakdown(null, null, "abc", "abc");
  console.assert(nullSafe.total === 0, "Test failed: null product should not crash and should return 0 total");
  console.assert(nullSafe.quantity === 1, "Test failed: invalid quantity string should default to 1");
  console.assert(nullSafe.discount === 0, "Test failed: invalid discount string should default to 0");

  const defaults = getDefaultSelections(product);
  console.assert(defaults.material === "Pine Wood", "Test failed: default material should be first option");
  console.assert(defaults.color === "Natural", "Test failed: default color should be first option");

  const quote = buildQuote({ product, customerName: "Ali", selections: selected, breakdown: result });
  console.assert(quote.customerName === "Ali", "Test failed: quote should keep customer name");
  console.assert(quote.total === 261900, "Test failed: quote should keep final total");
  console.assert(quoteToText(quote).includes("Final Total"), "Test failed: export text should contain final total");
  console.assert(quoteToText(quote).includes("Selected Options"), "Test failed: export text should contain selected options");
}

runPriceEngineTests();

function Icon({ name }) {
  const icons = {
    search: "⌕",
    plus: "+",
    export: "⇩",
    save: "✓",
    preview: "◉",
    calculator: "∑",
    package: "▣",
    settings: "⚙",
    history: "↺",
    trend: "↗",
    close: "×",
    reset: "↻",
    trash: "⌫",
  };

  return <span className="icon">{icons[name] || "•"}</span>;
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function Button({ children, onClick, variant = "solid", className = "", type = "button", disabled = false }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn btn-${variant} ${className}`}>
      {children}
    </button>
  );
}

function Badge({ children, variant = "green" }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

function TextInput({ value, onChange, type = "text", min, max, placeholder, className = "" }) {
  return (
    <input
      type={type}
      min={min}
      max={max}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      className={`input ${className}`}
    />
  );
}

function SelectInput({ value, onChange, children }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="input select">
      {children}
    </select>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <Card>
      <div className="stat-card">
        <div>
          <p className="muted small">{label}</p>
          <p className="stat-value">{value}</p>
        </div>
        <div className="stat-icon">
          <Icon name={icon} />
        </div>
      </div>
    </Card>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={`tab-button ${active ? "active" : ""}`}>
      {children}
    </button>
  );
}

function PreviewModal({ quote, onClose, onExport }) {
  if (!quote) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div>
            <p className="muted small">Quotation Preview</p>
            <h2>{quote.id}</h2>
          </div>
          <div className="button-row">
            <Button variant="outline" onClick={() => onExport(quote)}>
              <Icon name="export" /> Export
            </Button>
            <Button variant="danger" onClick={onClose}>
              <Icon name="close" /> Close
            </Button>
          </div>
        </div>

        <div className="modal-body">
          <div className="quote-paper">
            <div className="quote-top">
              <div>
                <h3>Product Quotation</h3>
                <p>{quote.date}</p>
              </div>
              <div className="quote-right">
                <strong>{quote.customerName}</strong>
                <p>{quote.id}</p>
              </div>
            </div>

            <div className="quote-grid">
              <div>
                <p className="label-dark">Product</p>
                <h4>{quote.productName}</h4>
                <p>{quote.category}</p>
              </div>
              <div>
                <p className="label-dark">Final Total</p>
                <h4 className="quote-total">{currency.format(quote.total)}</h4>
              </div>
            </div>

            <div className="quote-box">
              <h4>Selected Options</h4>
              <div className="quote-options">
                {Object.entries(quote.selections || {}).map(([key, value]) => (
                  <div key={key} className="quote-option">
                    <span>{key}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="quote-table">
              {(quote.rows || []).map((row) => (
                <div key={row.name} className="quote-row">
                  <span>{row.name}</span>
                  <strong>{currency.format(row.value)}</strong>
                </div>
              ))}
              <div className="quote-row light">
                <span>Quantity</span>
                <strong>{quote.quantity}</strong>
              </div>
              <div className="quote-row light">
                <span>Discount</span>
                <strong>{quote.discount}%</strong>
              </div>
              <div className="quote-row total">
                <span>Total</span>
                <strong>{currency.format(quote.total)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const savedProducts = localStorage.getItem("ppc_products");
  const savedQuotes = localStorage.getItem("ppc_quotes");

  const [products, setProducts] = useState(() => {
    try {
      return savedProducts ? JSON.parse(savedProducts) : starterProducts;
    } catch {
      return starterProducts;
    }
  });

  const [quotes, setQuotes] = useState(() => {
    try {
      return savedQuotes ? JSON.parse(savedQuotes) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState("calculator");
  const [activeProductId, setActiveProductId] = useState(products[0]?.id || "");
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [selectionsByProduct, setSelectionsByProduct] = useState({});
  const [message, setMessage] = useState("");
  const [previewQuote, setPreviewQuote] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productForm, setProductForm] = useState(emptyProductForm);

  useEffect(() => {
    localStorage.setItem("ppc_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("ppc_quotes", JSON.stringify(quotes));
  }, [quotes]);

  const product = safeProduct(products.find((item) => item.id === activeProductId) || products[0]);
  const defaultSelections = useMemo(() => getDefaultSelections(product), [product]);
  const selections = selectionsByProduct[product.id] || defaultSelections;

  const breakdown = useMemo(
    () => priceBreakdown(product, selections, quantity, discount),
    [product, selections, quantity, discount]
  );

  const filteredProducts = products.filter((item) =>
    `${item.name} ${item.category}`.toLowerCase().includes(query.toLowerCase())
  );

  const approvedQuotes = quotes.filter((quote) => quote.status === "Approved").length;
  const approvalRate = quotes.length ? Math.round((approvedQuotes / quotes.length) * 100) : 0;
  const quoteValue = quotes.reduce((sum, quote) => sum + quote.total, 0);

  function notify(text) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2500);
  }

  function updateSelection(attribute, value) {
    setSelectionsByProduct((prev) => ({
      ...prev,
      [product.id]: {
        ...(prev[product.id] || defaultSelections),
        [attribute]: value,
      },
    }));
  }

  function createCurrentQuote() {
    return buildQuote({ product, customerName, selections, breakdown });
  }

  function saveQuotation() {
    const quote = createCurrentQuote();
    setQuotes((prev) => [quote, ...prev]);
    setPreviewQuote(quote);
    notify("Quotation saved successfully.");
  }

  function exportQuote(quote = createCurrentQuote()) {
    const safeName = quote.productName.replace(/\s+/g, "-").toLowerCase();
    downloadFile(`${quote.id}-${safeName}.txt`, quoteToText(quote));
    notify("Quotation exported as text file.");
  }

  function resetCalculator() {
    setQuantity(1);
    setDiscount(0);
    setCustomerName("Walk-in Customer");
    setSelectionsByProduct((prev) => ({ ...prev, [product.id]: defaultSelections }));
    notify("Calculator reset.");
  }

  function addProduct() {
    const name = productForm.name.trim();
    const basePrice = Number(productForm.basePrice);

    if (!name || !Number.isFinite(basePrice) || basePrice < 0) {
      notify("Please enter product name and valid base price.");
      return;
    }

    const newProduct = {
      id: `product-${Date.now()}`,
      name,
      category: productForm.category.trim() || "Custom Furniture",
      basePrice,
      image:
        productForm.image.trim() ||
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop",
      attributes: defaultAttributes,
    };

    setProducts((prev) => [newProduct, ...prev]);
    setActiveProductId(newProduct.id);
    setProductForm(emptyProductForm);
    setShowProductForm(false);
    setActiveTab("calculator");
    notify("New product added with default pricing rules.");
  }

  function approveQuote(quoteId) {
    setQuotes((prev) =>
      prev.map((quote) => (quote.id === quoteId ? { ...quote, status: "Approved" } : quote))
    );
    notify("Quotation marked as approved.");
  }

  function deleteQuote(quoteId) {
    setQuotes((prev) => prev.filter((quote) => quote.id !== quoteId));
    notify("Quotation deleted.");
  }

  function resetAllData() {
    const ok = window.confirm("This will clear saved products and quotations. Continue?");
    if (!ok) return;

    localStorage.removeItem("ppc_products");
    localStorage.removeItem("ppc_quotes");
    setProducts(starterProducts);
    setQuotes([]);
    setActiveProductId(starterProducts[0].id);
    notify("Demo data has been reset.");
  }

  return (
    <div className="app">
      <PreviewModal quote={previewQuote} onClose={() => setPreviewQuote(null)} onExport={exportQuote} />

      {message && <div className="toast">{message}</div>}

      <main className="container">
        <header className="header">
          <div>
            <h1>Furniture Price Config & Quotation System</h1>
            <p className="hero-text">
              Configure attributes, calculate prices instantly, save quotations, preview customer quotes,
              and export quote files.
            </p>
          </div>

          <div className="button-row">
            <Button
              onClick={() => {
                setActiveTab("products");
                setShowProductForm(true);
              }}
            >
              <Icon name="plus" /> Add Product
            </Button>
            <Button variant="outline" onClick={() => exportQuote()}>
              <Icon name="export" /> Export Quote
            </Button>
            <Button variant="outline" onClick={resetAllData}>
              <Icon name="reset" /> Reset Demo
            </Button>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard label="Products" value={products.length} icon="package" />
          <StatCard label="Current Price" value={currency.format(breakdown.total)} icon="calculator" />
          <StatCard label="Saved Quotes" value={quotes.length} icon="history" />
          <StatCard label="Quote Value" value={currency.format(quoteValue)} icon="trend" />
        </section>

        <nav className="tabs">
          <TabButton active={activeTab === "calculator"} onClick={() => setActiveTab("calculator")}>
            Calculator
          </TabButton>
          <TabButton active={activeTab === "products"} onClick={() => setActiveTab("products")}>
            Products
          </TabButton>
          <TabButton active={activeTab === "rules"} onClick={() => setActiveTab("rules")}>
            Price Rules
          </TabButton>
          <TabButton active={activeTab === "reports"} onClick={() => setActiveTab("reports")}>
            Reports
          </TabButton>
        </nav>

        {activeTab === "calculator" && (
          <section className="calculator-layout">
            <div className="left-column">
              <Card className="product-config-card">
                <div className="product-image-area">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <div className="image-overlay" />
                  <div className="image-caption">
                    <Badge>{product.category}</Badge>
                    <h2>{product.name}</h2>
                  </div>
                </div>

                <div className="config-panel">
                  <div className="section-heading">
                    <div>
                      <p className="muted small">Configure product</p>
                      <h3>Attribute Selection</h3>
                    </div>
                    <Badge variant="green">Real-time update</Badge>
                  </div>

                  <div className="form-grid">
                    {Object.entries(product.attributes).map(([attribute, options]) => (
                      <div key={attribute} className="field">
                        <label>{attribute}</label>
                        <SelectInput
                          value={selections[attribute] || ""}
                          onChange={(value) => updateSelection(attribute, value)}
                        >
                          {(Array.isArray(options) ? options : []).map((option) => (
                            <option key={option.label} value={option.label}>
                              {option.label} - {currency.format(Number(option.price) || 0)}
                            </option>
                          ))}
                        </SelectInput>
                      </div>
                    ))}
                  </div>

                  <div className="form-grid three">
                    <div className="field">
                      <label>Customer</label>
                      <TextInput value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Quantity</label>
                      <TextInput
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label>Discount %</label>
                      <TextInput
                        type="number"
                        min="0"
                        max="100"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="button-row top-space">
                    <Button variant="outline" onClick={resetCalculator}>
                      <Icon name="reset" /> Reset Calculator
                    </Button>
                    <Button variant="outline" onClick={() => setPreviewQuote(createCurrentQuote())}>
                      <Icon name="preview" /> Preview Current Quote
                    </Button>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="card-inner">
                  <div className="section-heading">
                    <h3>Products</h3>
                    <div className="search-box">
                      <Icon name="search" />
                      <TextInput
                        placeholder="Search products..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="product-grid">
                    {filteredProducts.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveProductId(item.id)}
                        className={`product-tile ${item.id === product.id ? "active" : ""}`}
                      >
                        <img src={item.image} alt={item.name} />
                        <div>
                          <strong>{item.name}</strong>
                          <p>{item.category}</p>
                          <span>Base: {currency.format(item.basePrice)}</span>
                        </div>
                      </button>
                    ))}

                    {filteredProducts.length === 0 && (
                      <div className="empty-box">No products found for this search.</div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <aside className="quote-sidebar">
              <Card className="quote-card">
                <div className="quote-card-header">
                  <div>
                    <p className="muted small">Quotation for</p>
                    <h3>{customerName || "Customer"}</h3>
                  </div>
                  <Badge>Draft</Badge>
                </div>

                <div className="price-box">
                  <p>Final Price</p>
                  <h2>{currency.format(breakdown.total)}</h2>
                  <span>
                    Quantity: {breakdown.quantity} - Discount: {breakdown.discount}%
                  </span>
                </div>

                <div className="breakdown">
                  {breakdown.rows.map((row) => (
                    <div key={row.name} className="breakdown-row">
                      <span>{row.name}</span>
                      <strong>{currency.format(row.value)}</strong>
                    </div>
                  ))}

                  <div className="breakdown-row">
                    <span>Subtotal per unit</span>
                    <strong>{currency.format(breakdown.subtotal)}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>Before discount</span>
                    <strong>{currency.format(breakdown.totalBeforeDiscount)}</strong>
                  </div>
                  <div className="breakdown-row">
                    <span>Discount</span>
                    <strong className="danger-text">- {currency.format(breakdown.discountAmount)}</strong>
                  </div>
                </div>

                <div className="sidebar-actions">
                  <Button className="success-button" onClick={saveQuotation}>
                    <Icon name="save" /> Save Quotation
                  </Button>
                  <Button variant="outline" onClick={() => setPreviewQuote(createCurrentQuote())}>
                    <Icon name="preview" /> Preview PDF
                  </Button>
                  <Button variant="outline" onClick={() => exportQuote()}>
                    <Icon name="export" /> Export Quote
                  </Button>
                </div>
              </Card>
            </aside>
          </section>
        )}

        {activeTab === "products" && (
          <section className="stack">
            <Card>
              <div className="card-inner">
                <div className="section-heading">
                  <h3>Product Management</h3>
                  <Button onClick={() => setShowProductForm((value) => !value)}>
                    <Icon name="plus" /> {showProductForm ? "Hide Form" : "Add Product"}
                  </Button>
                </div>

                {showProductForm && (
                  <div className="form-box">
                    <h4>Add New Product</h4>
                    <div className="form-grid">
                      <div className="field">
                        <label>Product Name</label>
                        <TextInput
                          value={productForm.name}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="Example: Custom King Bed"
                        />
                      </div>
                      <div className="field">
                        <label>Category</label>
                        <TextInput
                          value={productForm.category}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, category: e.target.value }))}
                        />
                      </div>
                      <div className="field">
                        <label>Base Price</label>
                        <TextInput
                          type="number"
                          min="0"
                          value={productForm.basePrice}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, basePrice: e.target.value }))}
                          placeholder="50000"
                        />
                      </div>
                      <div className="field">
                        <label>Image URL</label>
                        <TextInput
                          value={productForm.image}
                          onChange={(e) => setProductForm((prev) => ({ ...prev, image: e.target.value }))}
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="button-row top-space">
                      <Button className="success-button" onClick={addProduct}>
                        Save Product
                      </Button>
                      <Button variant="outline" onClick={() => setProductForm(emptyProductForm)}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                <div className="management-grid">
                  {products.map((item) => (
                    <div key={item.id} className="management-card">
                      <strong>{item.name}</strong>
                      <p>{item.category}</p>
                      <span>Base price: {currency.format(item.basePrice)}</span>

                      <div className="button-row top-space">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setActiveProductId(item.id);
                            setActiveTab("calculator");
                          }}
                        >
                          Configure
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() =>
                            exportQuote(
                              buildQuote({
                                product: item,
                                customerName,
                                selections: getDefaultSelections(item),
                                breakdown: priceBreakdown(item, getDefaultSelections(item), 1, 0),
                              })
                            )
                          }
                        >
                          Export Base Quote
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>
        )}

        {activeTab === "rules" && (
          <Card>
            <div className="card-inner">
              <div className="section-heading">
                <div className="heading-with-icon">
                  <Icon name="settings" />
                  <h3>Pricing Rules</h3>
                </div>
              </div>
              <p className="muted">
                Current MVP uses fixed pricing rules. The Add Product button creates default attributes
                automatically. In production, this tab should allow full edit controls for every attribute and price.
              </p>

              <div className="rules-grid">
                {Object.entries(product.attributes).map(([attribute, options]) => (
                  <div key={attribute} className="rule-card">
                    <h4>{attribute}</h4>
                    <div className="rule-list">
                      {(Array.isArray(options) ? options : []).map((option) => (
                        <div key={option.label} className="rule-row">
                          <span>{option.label}</span>
                          <strong>{currency.format(option.price)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {activeTab === "reports" && (
          <section className="stack">
            <Card>
              <div className="card-inner">
                <div className="heading-with-icon">
                  <Icon name="trend" />
                  <h3>Reports</h3>
                </div>

                <div className="report-grid">
                  <div className="report-box">
                    <p>Saved Quotes</p>
                    <h3>{quotes.length}</h3>
                  </div>
                  <div className="report-box">
                    <p>Quote Value</p>
                    <h3>{currency.format(quoteValue)}</h3>
                  </div>
                  <div className="report-box">
                    <p>Approval Rate</p>
                    <h3>{approvalRate}%</h3>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="card-inner">
                <h3>Saved Quotations</h3>

                {quotes.length === 0 ? (
                  <div className="empty-box">No saved quotations yet. Use Save Quotation from the calculator.</div>
                ) : (
                  <div className="quote-list">
                    {quotes.map((quote) => (
                      <div key={quote.id} className="saved-quote">
                        <div>
                          <div className="saved-quote-title">
                            <strong>{quote.productName}</strong>
                            <Badge variant={quote.status === "Approved" ? "green" : "yellow"}>
                              {quote.status}
                            </Badge>
                          </div>
                          <p>
                            {quote.customerName} - {quote.date}
                          </p>
                          <h4>{currency.format(quote.total)}</h4>
                        </div>

                        <div className="button-row">
                          <Button variant="outline" onClick={() => setPreviewQuote(quote)}>
                            Preview
                          </Button>
                          <Button variant="outline" onClick={() => exportQuote(quote)}>
                            Export
                          </Button>
                          <Button
                            variant="outline"
                            disabled={quote.status === "Approved"}
                            onClick={() => approveQuote(quote.id)}
                          >
                            Approve
                          </Button>
                          <Button variant="danger" onClick={() => deleteQuote(quote.id)}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </section>
        )}
        <section className="footer-section">
          <div className="footer-section-div">
            <span className="footer-section-span">Prepared by HASSAN ALI | © Copyright 2026</span>
          </div>
        </section>
      </main>
    </div>
  );
}
