import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Mail,
  MapPin,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  User,
  X,
} from "lucide-react";

import "./PlaceOrder.css";

const API_URL =
  import.meta.env?.VITE_API_URL ||
  "http://localhost:5000/api";

function PlaceOrder({ onBack }) {

  // =====================================================
  // STEP
  // =====================================================

  const [step, setStep] = useState(1);


  // =====================================================
  // CUSTOMER
  // =====================================================

  const emptyCustomer = {
    id: null,
    name: "",
    phone: "",
    email: "",
    address: "",
  };

  const [customer, setCustomer] =
    useState(emptyCustomer);

  const [customers, setCustomers] =
    useState([]);

  const [customerSearch, setCustomerSearch] =
    useState("");

  const [loadingCustomers, setLoadingCustomers] =
    useState(false);

  const [customerError, setCustomerError] =
    useState("");

  const [selectedCustomer, setSelectedCustomer] =
    useState(false);


  // =====================================================
  // PRODUCTS
  // =====================================================

  const [products, setProducts] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [cart, setCart] =
    useState([]);

  const [loadingProducts, setLoadingProducts] =
    useState(true);

  const [productError, setProductError] =
    useState("");


  // =====================================================
  // ORDER
  // =====================================================

  const [orderError, setOrderError] =
    useState("");

  const [creatingOrder, setCreatingOrder] =
    useState(false);

  const [orderResult, setOrderResult] =
    useState(null);

  const [paymentStatus, setPaymentStatus] =
    useState("PENDING");


  // =====================================================
  // LOAD PRODUCTS
  // =====================================================

  useEffect(() => {

    let mounted = true;

    const loadProducts = async () => {

      try {

        setLoadingProducts(true);
        setProductError("");

        const response = await fetch(
          `${API_URL}/products`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("bizpilot_token") || ""}` } }
        );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {

          throw new Error(
            data?.message ||
            "Failed to load products."
          );

        }

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (mounted) {
          setProducts(list);
        }

      } catch (error) {

        console.error(
          "Product loading error:",
          error
        );

        if (mounted) {

          setProducts([]);

          setProductError(
            error.message ||
            "Unable to load products."
          );

        }

      } finally {

        if (mounted) {
          setLoadingProducts(false);
        }

      }

    };

    loadProducts();

    return () => {
      mounted = false;
    };

  }, []);


  // =====================================================
  // LOAD CUSTOMERS
  // =====================================================

  useEffect(() => {

    let mounted = true;

    const loadCustomers = async () => {

      try {

        setLoadingCustomers(true);
        setCustomerError("");

        const response = await fetch(
          `${API_URL}/customers`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("bizpilot_token") || ""}` } }
        );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {

          throw new Error(
            data?.message ||
            "Failed to load customers."
          );

        }

        const list =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];

        if (mounted) {
          setCustomers(list);
        }

      } catch (error) {

        console.error(
          "Customer loading error:",
          error
        );

        if (mounted) {

          setCustomers([]);

          setCustomerError(
            error.message ||
            "Unable to load customers."
          );

        }

      } finally {

        if (mounted) {
          setLoadingCustomers(false);
        }

      }

    };

    loadCustomers();

    return () => {
      mounted = false;
    };

  }, []);


  // =====================================================
  // CUSTOMER SEARCH
  // =====================================================

  const filteredCustomers = useMemo(() => {

    const query =
      customerSearch
        .trim()
        .toLowerCase();

    // IMPORTANT:
    // Do NOT show customers when search is empty.
    if (!query) {
      return [];
    }

    return customers
      .filter((item) => {

        const id =
          String(
            item.id ??
            item.customer_id ??
            ""
          ).toLowerCase();

        const name =
          String(
            item.name ??
            item.customer_name ??
            ""
          ).toLowerCase();

        const phone =
          String(
            item.phone ??
            item.customer_phone ??
            ""
          ).toLowerCase();

        const email =
          String(
            item.email ??
            item.customer_email ??
            ""
          ).toLowerCase();

        return (
          id.includes(query) ||
          name.includes(query) ||
          phone.includes(query) ||
          email.includes(query)
        );

      })
      .slice(0, 6);

  }, [
    customers,
    customerSearch,
  ]);


  // =====================================================
  // SELECT CUSTOMER
  // =====================================================

  const selectCustomer = (item) => {

    const selected = {

      id:
        item.id ??
        item.customer_id ??
        null,

      name:
        item.name ??
        item.customer_name ??
        "",

      phone:
        item.phone ??
        item.customer_phone ??
        "",

      email:
        item.email ??
        item.customer_email ??
        "",

      address:
        item.address ??
        item.shipping_address ??
        "",

    };

    setCustomer(selected);

    setSelectedCustomer(true);

    setCustomerSearch("");

    setOrderError("");

  };


  // =====================================================
  // CUSTOMER FIELD CHANGE
  // =====================================================

  const handleCustomerChange = (event) => {

    const {
      name,
      value,
    } = event.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));

    // If selected customer is manually edited,
    // treat it as a new/manual customer.
    if (selectedCustomer) {

      setSelectedCustomer(false);

      setCustomer((previous) => ({
        ...previous,
        id:
          name === "name"
            ? null
            : previous.id,
      }));

    }

    setOrderError("");

  };


  // =====================================================
  // CLEAR CUSTOMER
  // =====================================================

  const clearCustomer = () => {

    setCustomer({
      ...emptyCustomer,
    });

    setCustomerSearch("");

    setSelectedCustomer(false);

    setOrderError("");

  };


  // =====================================================
  // PRODUCT SEARCH
  // =====================================================

  const filteredProducts = useMemo(() => {

    const query =
      searchTerm
        .trim()
        .toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {

      const name =
        String(
          product.name || ""
        ).toLowerCase();

      const sku =
        String(
          product.sku || ""
        ).toLowerCase();

      return (
        name.includes(query) ||
        sku.includes(query)
      );

    });

  }, [
    products,
    searchTerm,
  ]);


  // =====================================================
  // ADD PRODUCT
  // =====================================================

  const addProduct = (product) => {

    const stock =
      Number(
        product.stock_quantity ??
        product.stock ??
        0
      );

    if (stock <= 0) {
      return;
    }

    setCart((previous) => {

      const existing =
        previous.find(
          (item) =>
            String(item.productId) ===
            String(product.id)
        );

      if (existing) {

        if (
          existing.quantity >=
          existing.stockQuantity
        ) {
          return previous;
        }

        return previous.map((item) => {

          if (
            String(item.productId) !==
            String(product.id)
          ) {
            return item;
          }

          return {
            ...item,
            quantity:
              item.quantity + 1,
          };

        });

      }

      return [
        ...previous,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice:
            Number(product.price || 0),
          stockQuantity: stock,
          quantity: 1,
        },
      ];

    });

    setOrderError("");

  };


  // =====================================================
  // CHANGE QUANTITY
  // =====================================================

  const changeQuantity = (
    productId,
    amount
  ) => {

    setCart((previous) => {

      return previous
        .map((item) => {

          if (
            String(item.productId) !==
            String(productId)
          ) {
            return item;
          }

          const quantity =
            Math.max(
              0,
              Math.min(
                item.quantity + amount,
                item.stockQuantity
              )
            );

          return {
            ...item,
            quantity,
          };

        })
        .filter(
          (item) =>
            item.quantity > 0
        );

    });

    setOrderError("");

  };


  // =====================================================
  // REMOVE PRODUCT
  // =====================================================

  const removeProduct = (productId) => {

    setCart((previous) =>
      previous.filter(
        (item) =>
          String(item.productId) !==
          String(productId)
      )
    );

    setOrderError("");

  };


  // =====================================================
  // TOTAL ITEMS
  // =====================================================

  const totalItems = useMemo(() => {

    return cart.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0),
      0
    );

  }, [cart]);


  // =====================================================
  // TOTAL AMOUNT
  // =====================================================

  const totalAmount = useMemo(() => {

    return cart.reduce(
      (total, item) =>
        total +
        Number(item.unitPrice || 0) *
        Number(item.quantity || 0),
      0
    );

  }, [cart]);


  // =====================================================
  // CURRENCY
  // =====================================================

  const formatCurrency = (amount) => {

    return `৳${Number(
      amount || 0
    ).toLocaleString("en-BD")}`;

  };


  // =====================================================
  // STEP 1 → STEP 2
  // =====================================================

  const goToProducts = () => {

    setOrderError("");

    if (!customer.name.trim()) {

      setOrderError(
        "Please enter the customer's name."
      );

      return;
    }

    if (!customer.phone.trim()) {

      setOrderError(
        "Please enter the customer's mobile number."
      );

      return;
    }

    if (!customer.address.trim()) {

      setOrderError(
        "Please enter the shipping address."
      );

      return;
    }

    setStep(2);

  };


  // =====================================================
  // STEP 2 → STEP 3
  // =====================================================

  const goToReview = () => {

    setOrderError("");

    if (cart.length === 0) {

      setOrderError(
        "Please select at least one product."
      );

      return;
    }

    const invalidItem =
      cart.find(
        (item) =>
          Number(item.quantity) <= 0 ||
          Number(item.quantity) >
          Number(item.stockQuantity)
      );

    if (invalidItem) {

      setOrderError(
        `${invalidItem.productName} has an invalid quantity.`
      );

      return;
    }

    setStep(3);

  };


  // =====================================================
  // CREATE ORDER
  // =====================================================

  const createOrder = async () => {

    if (creatingOrder) {
      return;
    }

    setOrderError("");

    if (
      !customer.name.trim() ||
      !customer.phone.trim() ||
      !customer.address.trim()
    ) {

      setOrderError(
        "Please fill out all required customer information."
      );

      setStep(1);

      return;
    }

    if (cart.length === 0) {

      setOrderError(
        "Please select at least one product."
      );

      setStep(2);

      return;
    }

    try {

      setCreatingOrder(true);

      const payload = {

        customerId:
          customer.id || null,

        customerName:
          customer.name.trim(),

        customerPhone:
          customer.phone.trim(),

        customerEmail:
          customer.email.trim() ||
          null,

        shippingAddress:
          customer.address.trim(),

        paymentStatus,

        items:
          cart.map((item) => ({
            productId:
              item.productId,

            quantity:
              Number(
                item.quantity
              ),
          })),

      };

      console.log(
        "Creating order:",
        payload
      );

      const response =
        await fetch(
          `${API_URL}/orders`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
              Authorization: `Bearer ${localStorage.getItem("bizpilot_token") || ""}`,
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {

        throw new Error(
          data?.message ||
          data?.error ||
          "Failed to create order."
        );

      }

      setOrderResult(
        data?.data ||
        data
      );

      setCart([]);

      setStep(4);

      setOrderError("");

    } catch (error) {

      console.error(
        "Create order error:",
        error
      );

      setOrderError(
        error.message ||
        "Failed to create order."
      );

    } finally {

      setCreatingOrder(false);

    }

  };


  // =====================================================
  // NEW ORDER
  // =====================================================

  const startNewOrder = () => {

    setStep(1);

    setOrderResult(null);

    setOrderError("");

    setCustomer({
      ...emptyCustomer,
    });

    setCustomerSearch("");

    setSelectedCustomer(false);

    setSearchTerm("");

    setCart([]);

    setPaymentStatus("PENDING");

  };


  // =====================================================
  // STEP BAR
  // =====================================================

  const renderSteps = () => {

    const steps = [
      "Customer",
      "Products",
      "Review",
      "Complete",
    ];

    return (

      <div className="order-steps">

        {steps.map(
          (label, index) => {

            const stepNumber =
              index + 1;

            const active =
              step >= stepNumber;

            return (

              <div
                key={label}
                className={`order-step ${
                  active
                    ? "active"
                    : ""
                }`}
              >

                <span>

                  {step > stepNumber ? (
                    <Check size={14} />
                  ) : (
                    stepNumber
                  )}

                </span>

                <label>
                  {label}
                </label>

              </div>

            );

          }
        )}

      </div>

    );

  };


  // =====================================================
  // STEP 1 — CUSTOMER
  // =====================================================

  if (step === 1) {

    return (

      <div className="place-order">

        {renderSteps()}

        <div className="place-order-card">

          {/* HEADER */}

          <div className="section-heading">

            <div className="section-icon">
              <User size={20} />
            </div>

            <div>

              <h2>
                Customer Information
              </h2>

              <p>
                Enter the customer's
                delivery information.
              </p>

            </div>

          </div>


          {/* ERROR */}

          {orderError && (

            <div className="order-error">
              {orderError}
            </div>

          )}


          {/* =================================================
              EXISTING CUSTOMER SEARCH
          ================================================= */}

          <div className="customer-directory">

            <label>
              Find Existing Customer
            </label>

            <div className="customer-search-box">

              <Search size={19} />

              <input
                type="text"
                value={
                  customerSearch
                }
                onChange={(event) =>
                  setCustomerSearch(
                    event.target.value
                  )
                }
                placeholder="Search by ID, name, phone or email"
                autoComplete="off"
              />

              {customerSearch && (

                <button
                  type="button"
                  className="customer-search-clear"
                  onClick={() =>
                    setCustomerSearch("")
                  }
                >

                  <X size={16} />

                </button>

              )}

            </div>

            <p className="search-help-text">

              Search for an existing customer
              to automatically fill their
              information.

            </p>

          </div>


          {/* =================================================
              SEARCH RESULTS
              NOT A DROPDOWN
          ================================================= */}

          {customerSearch.trim() && (

            <div className="customer-results-panel">

              {loadingCustomers ? (

                <div className="customer-result-message">
                  Loading customers...
                </div>

              ) : customerError ? (

                <div className="customer-result-message error">
                  {customerError}
                </div>

              ) : filteredCustomers.length === 0 ? (

                <div className="customer-result-message">
                  No customer found.
                </div>

              ) : (

                <>

                  <div className="customer-results-title">
                    Matching Customers
                  </div>

                  <div className="customer-results-list">

                    {filteredCustomers.map(
                      (item) => {

                        const id =
                          item.id ??
                          item.customer_id ??
                          "—";

                        const name =
                          item.name ??
                          item.customer_name ??
                          "Unnamed Customer";

                        const phone =
                          item.phone ??
                          item.customer_phone ??
                          "No phone";

                        const email =
                          item.email ??
                          item.customer_email ??
                          "";

                        return (

                          <button
                            key={id}
                            type="button"
                            className="customer-result-item"
                            onClick={() =>
                              selectCustomer(
                                item
                              )
                            }
                          >

                            <div className="customer-result-id">
                              #{id}
                            </div>

                            <div className="customer-result-info">

                              <strong>
                                {name}
                              </strong>

                              <span>
                                {phone}
                              </span>

                              {email && (
                                <small>
                                  {email}
                                </small>
                              )}

                            </div>

                          </button>

                        );

                      }
                    )}

                  </div>

                </>

              )}

            </div>

          )}


          {/* SELECTED CUSTOMER */}

          {selectedCustomer &&
            customer.id && (

            <div className="selected-customer-banner">

              <div>

                <span>
                  Selected Customer
                </span>

                <strong>
                  #{customer.id} — {customer.name}
                </strong>

              </div>

              <button
                type="button"
                onClick={clearCustomer}
              >
                Change
              </button>

            </div>

          )}


          {/* =================================================
              CUSTOMER FORM
          ================================================= */}

          <div className="form-grid">

            {/* NAME */}

            <div className="form-group">

              <label>
                Customer Name *
              </label>

              <div className="input-with-icon">

                <User size={18} />

                <input
                  type="text"
                  name="name"
                  value={
                    customer.name
                  }
                  onChange={
                    handleCustomerChange
                  }
                  placeholder="Enter customer name"
                />

              </div>

            </div>


            {/* PHONE */}

            <div className="form-group">

              <label>
                Mobile Number *
              </label>

              <div className="input-with-icon">

                <Phone size={18} />

                <input
                  type="text"
                  name="phone"
                  value={
                    customer.phone
                  }
                  onChange={
                    handleCustomerChange
                  }
                  placeholder="01XXXXXXXXX"
                />

              </div>

            </div>


            {/* EMAIL */}

            <div className="form-group">

              <label>
                Email
              </label>

              <div className="input-with-icon">

                <Mail size={18} />

                <input
                  type="email"
                  name="email"
                  value={
                    customer.email
                  }
                  onChange={
                    handleCustomerChange
                  }
                  placeholder="customer@example.com"
                />

              </div>

            </div>


            {/* ADDRESS */}

            <div className="form-group">

              <label>
                Shipping Address *
              </label>

              <div className="input-with-icon textarea-wrapper">

                <MapPin size={18} />

                <textarea
                  name="address"
                  value={
                    customer.address
                  }
                  onChange={
                    handleCustomerChange
                  }
                  placeholder="Enter complete shipping address"
                  rows={4}
                />

              </div>

            </div>

          </div>


          {/* ACTIONS */}

          <div className="place-order-actions">

            {onBack && (

              <button
                type="button"
                className="secondary-button"
                onClick={onBack}
              >

                <ArrowLeft size={18} />

                Back

              </button>

            )}

            <button
              type="button"
              className="primary-button"
              onClick={
                goToProducts
              }
            >

              Continue to Products

              <ArrowRight size={18} />

            </button>

          </div>

        </div>

      </div>

    );

  }


  // =====================================================
  // STEP 2 — PRODUCTS
  // =====================================================

  if (step === 2) {

    return (

      <div className="place-order">

        {renderSteps()}

        <div className="place-order-card">

          <div className="section-heading">

            <div className="section-icon">
              <ShoppingBag size={20} />
            </div>

            <div>

              <h2>
                Select Products
              </h2>

              <p>
                Add products to this order.
              </p>

            </div>

          </div>


          {orderError && (

            <div className="order-error">
              {orderError}
            </div>

          )}


          <div className="product-search">

            <Search size={18} />

            <input
              type="text"
              value={
                searchTerm
              }
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search products by name or SKU..."
            />

          </div>


          {loadingProducts ? (

            <div className="empty-state">
              Loading products...
            </div>

          ) : productError ? (

            <div className="order-error">
              {productError}
            </div>

          ) : filteredProducts.length === 0 ? (

            <div className="empty-state">
              No products found.
            </div>

          ) : (

            <div className="product-grid">

              {filteredProducts.map(
                (product) => {

                  const stock =
                    Number(
                      product.stock_quantity ??
                      product.stock ??
                      0
                    );

                  const selected =
                    cart.find(
                      (item) =>
                        String(
                          item.productId
                        ) ===
                        String(
                          product.id
                        )
                    );

                  return (

                    <div
                      key={
                        product.id
                      }
                      className="product-card"
                    >

                      <div className="product-card-info">

                        <div className="product-icon">
                          <ShoppingBag
                            size={20}
                          />
                        </div>

                        <div>

                          <strong>
                            {
                              product.name
                            }
                          </strong>

                          <span>
                            SKU:{" "}
                            {
                              product.sku
                            }
                          </span>

                          <small>
                            Stock:{" "}
                            {stock}
                          </small>

                        </div>

                      </div>


                      <div className="product-card-bottom">

                        <strong>
                          {formatCurrency(
                            product.price
                          )}
                        </strong>

                        <button
                          type="button"
                          className="add-product-button"
                          disabled={
                            stock <= 0
                          }
                          onClick={() =>
                            addProduct(
                              product
                            )
                          }
                        >

                          {selected ? (
                            <>
                              <Plus
                                size={15}
                              />
                              Add More
                            </>
                          ) : (
                            <>
                              <Plus
                                size={15}
                              />
                              Add
                            </>
                          )}

                        </button>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}


          {/* CART */}

          {cart.length > 0 && (

            <div className="cart-section">

              <div className="cart-header">

                <h3>
                  Selected Items
                </h3>

                <span>
                  {totalItems} item
                  {totalItems !== 1
                    ? "s"
                    : ""}
                </span>

              </div>


              <div className="cart-list">

                {cart.map(
                  (item) => (

                    <div
                      key={
                        item.productId
                      }
                      className="cart-item"
                    >

                      <div>

                        <strong>
                          {
                            item.productName
                          }
                        </strong>

                        <span>
                          {formatCurrency(
                            item.unitPrice
                          )}
                        </span>

                      </div>


                      <div className="cart-controls">

                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(
                              item.productId,
                              -1
                            )
                          }
                        >
                          <Minus
                            size={15}
                          />
                        </button>

                        <strong>
                          {
                            item.quantity
                          }
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(
                              item.productId,
                              1
                            )
                          }
                        >
                          <Plus
                            size={15}
                          />
                        </button>

                        <button
                          type="button"
                          className="delete-cart-button"
                          onClick={() =>
                            removeProduct(
                              item.productId
                            )
                          }
                        >
                          <Trash2
                            size={15}
                          />
                        </button>

                      </div>


                      <strong>
                        {formatCurrency(
                          item.unitPrice *
                          item.quantity
                        )}
                      </strong>

                    </div>

                  )
                )}

              </div>


              <div className="cart-total">

                <span>
                  Total
                </span>

                <strong>
                  {formatCurrency(
                    totalAmount
                  )}
                </strong>

              </div>

            </div>

          )}


          <div className="place-order-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setOrderError("");
                setStep(1);
              }}
            >

              <ArrowLeft size={18} />

              Back

            </button>


            <button
              type="button"
              className="primary-button"
              onClick={
                goToReview
              }
            >

              Review Order

              <ArrowRight size={18} />

            </button>

          </div>

        </div>

      </div>

    );

  }


  // =====================================================
  // STEP 3 — REVIEW
  // =====================================================

  if (step === 3) {

    return (

      <div className="place-order">

        {renderSteps()}

        <div className="place-order-card">

          <div className="section-heading">

            <div className="section-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>

              <h2>
                Review Order
              </h2>

              <p>
                Check everything before
                confirming the order.
              </p>

            </div>

          </div>


          {orderError && (

            <div className="order-error">
              {orderError}
            </div>

          )}


          {/* CUSTOMER */}

          <div className="review-section">

            <div className="review-section-header">

              <h3>
                Customer
              </h3>

              <button
                type="button"
                onClick={() => {
                  setOrderError("");
                  setStep(1);
                }}
              >
                Edit
              </button>

            </div>


            <div className="review-customer">

              {customer.id && (

                <div className="review-customer-id">

                  Customer ID #
                  {customer.id}

                </div>

              )}

              <strong>
                {customer.name}
              </strong>

              <span>

                <Phone size={14} />

                {customer.phone}

              </span>


              {customer.email && (

                <span>

                  <Mail size={14} />

                  {customer.email}

                </span>

              )}


              <span>

                <MapPin size={14} />

                {customer.address}

              </span>

            </div>

          </div>


          {/* ITEMS */}

          <div className="review-section">

            <div className="review-section-header">

              <h3>
                Items
              </h3>

              <button
                type="button"
                onClick={() => {
                  setOrderError("");
                  setStep(2);
                }}
              >
                Edit
              </button>

            </div>


            <div className="review-items">

              {cart.map(
                (item) => (

                  <div
                    key={
                      item.productId
                    }
                    className="review-item"
                  >

                    <div>

                      <strong>
                        {
                          item.productName
                        }
                      </strong>

                      <span>
                        {
                          item.quantity
                        }
                        {" × "}
                        {formatCurrency(
                          item.unitPrice
                        )}
                      </span>

                    </div>

                    <strong>
                      {formatCurrency(
                        item.unitPrice *
                        item.quantity
                      )}
                    </strong>

                  </div>

                )
              )}

            </div>


            <div className="review-total">

              <span>
                Total
              </span>

              <strong>
                {formatCurrency(
                  totalAmount
                )}
              </strong>

            </div>

          </div>

          <div className="review-section payment-section">
            <div className="review-section-header">
              <h3>Payment status</h3>
            </div>
            <label htmlFor="payment-status">
              Has the customer paid this bill?
            </label>
            <select
              id="payment-status"
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              disabled={creatingOrder}
            >
              <option value="PENDING">Not paid / payment pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>


          {/* ACTIONS */}

          <div className="place-order-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setOrderError("");
                setStep(2);
              }}
              disabled={
                creatingOrder
              }
            >

              <ArrowLeft size={18} />

              Back

            </button>


            <button
              type="button"
              className="primary-button"
              onClick={
                createOrder
              }
              disabled={
                creatingOrder
              }
            >

              {creatingOrder
                ? "Creating Order..."
                : "Confirm Order"}

              {!creatingOrder && (

                <CheckCircle2
                  size={18}
                />

              )}

            </button>

          </div>

        </div>

      </div>

    );

  }


  // =====================================================
  // STEP 4 — COMPLETE
  // =====================================================

  if (step === 4) {

    const createdOrderId =
      orderResult?.orderId ||
      orderResult?.id ||
      orderResult?.order_id ||
      "—";

    return (

      <div className="place-order">

        {renderSteps()}

        <div className="success-card">

          <div className="success-icon">

            <CheckCircle2
              size={40}
            />

          </div>


          <h2>
            Order Created Successfully
          </h2>


          <p>

            The order has been created with{" "}
            <strong>
              {orderResult?.paymentStatus || paymentStatus}
            </strong>{" "}
            payment status.

          </p>


          <div className="order-id-badge">

            <span>
              Order ID
            </span>

            <strong>
              #{createdOrderId}
            </strong>

          </div>


          <div className="place-order-actions success-actions">

            {onBack && (

              <button
                type="button"
                className="secondary-button"
                onClick={onBack}
              >
                Back
              </button>

            )}


            <button
              type="button"
              className="primary-button"
              onClick={
                startNewOrder
              }
            >

              <Plus size={18} />

              Create Another Order

            </button>

          </div>

        </div>

      </div>

    );

  }


  return null;

}

export default PlaceOrder;