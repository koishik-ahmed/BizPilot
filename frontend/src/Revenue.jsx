import {
    useEffect,
    useState
} from "react";

import "./Revenue.css";


// =====================================================
// API
// =====================================================

const API_BASE_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const REVENUE_API_URL =
    `${API_BASE_URL}/orders/revenue`;


// =====================================================
// PRODUCT IMAGE MAPPING
// =====================================================

const productImages = {

    "Black Hoodie Premium":
        "/images/hoodie.png",

    "Black Sneakers":
        "/images/sneakers.png",

    "Black Cap":
        "/images/cap.png",

    "Leather Bag":
        "/images/bag.png",

    "pink hoodie":
        "/images/pink-hoodie.png",

    "Blue hoodie":
        "/images/blue-hoodie.png",

    "Basic T-Shirt":
        "/images/tshirt.png",

    "Pants":
        "/images/pants.png"

};


// =====================================================
// PRODUCT ICON
// =====================================================

const getProductEmoji = (
    name = ""
) => {

    const value =
        String(name).toLowerCase();


    if (
        value.includes("hoodie") ||
        value.includes("shirt") ||
        value.includes("t-shirt") ||
        value.includes("pant")
    ) {
        return "👕";
    }


    if (
        value.includes("shoe") ||
        value.includes("sneaker")
    ) {
        return "👟";
    }


    if (
        value.includes("bag")
    ) {
        return "👜";
    }


    if (
        value.includes("cap") ||
        value.includes("hat")
    ) {
        return "🧢";
    }


    if (
        value.includes("watch")
    ) {
        return "⌚";
    }


    if (
        value.includes("cosmetic") ||
        value.includes("lipstick") ||
        value.includes("makeup")
    ) {
        return "💄";
    }


    return "📦";
};


// =====================================================
// MONEY
// =====================================================

const money = (
    value
) => {

    return `৳${Number(
        value || 0
    ).toLocaleString(
        "en-BD",
        {
            maximumFractionDigits: 0
        }
    )}`;
};


// =====================================================
// DATE
// =====================================================

const formatChartDate = (
    dateValue
) => {

    if (!dateValue) {
        return "";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(
            dateValue
        );
    }


    return date.toLocaleDateString(
        "en-BD",
        {
            month: "short",
            day: "numeric"
        }
    );
};


// =====================================================
// CHART NORMALIZER
// =====================================================

const normalizeChartData = (
    chart = []
) => {

    if (
        !Array.isArray(chart)
    ) {
        return [];
    }


    return chart.map(
        (
            item,
            index
        ) => {

            const value =
                Number(
                    item?.value ??
                    item?.revenue ??
                    0
                );


            let label =
                item?.label;


            if (!label) {

                label =
                    formatChartDate(
                        item?.date
                    );

            }


            if (!label) {

                label =
                    `Day ${index + 1}`;

            }


            return {

                label,

                value

            };

        }
    );
};


// =====================================================
// CSV VALUE
// =====================================================

const csvValue = (
    value
) => {

    const text =
        String(
            value ?? ""
        );


    return `"${text.replace(
        /"/g,
        '""'
    )}"`;
};


// =====================================================
// MAIN COMPONENT
// =====================================================

const Revenue = () => {

    const [
        period,
        setPeriod
    ] = useState("month");


    const [
        report,
        setReport
    ] = useState(null);


    const [
        loading,
        setLoading
    ] = useState(true);


    const [
        error,
        setError
    ] = useState("");


    const [
        exporting,
        setExporting
    ] = useState(false);


    // =================================================
    // LOAD REVENUE
    // =================================================

    const loadRevenue =
        async () => {

            try {

                setLoading(true);
                setError("");


                const response =
                    await fetch(
                        `${REVENUE_API_URL}?period=${period}`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("bizpilot_token") || ""}`
                            }
                        }
                    );


                let result = null;


                try {

                    result =
                        await response.json();

                } catch {

                    result = null;

                }


                if (
                    !response.ok
                ) {

                    throw new Error(
                        result?.message ||
                        "Unable to load revenue data."
                    );

                }


                setReport(
                    result?.data || {}
                );


            } catch (
                err
            ) {

                console.error(
                    "Revenue report error:",
                    err
                );


                setError(
                    err.message ||
                    "Unable to load revenue data."
                );


                setReport(null);


            } finally {

                setLoading(false);

            }

        };


    // =================================================
    // LOAD WHEN PERIOD CHANGES
    // =================================================

    useEffect(
        () => {

            // eslint-disable-next-line react-hooks/set-state-in-effect
            loadRevenue();

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [period]
    );


    // =================================================
    // REPORT DATA
    // =================================================

    const revenue =
        Number(
            report?.revenue || 0
        );


    const pendingRevenue =
        Number(
            report?.pendingRevenue || 0
        );


    const orders =
        Number(
            report?.orders || 0
        );


    const pendingOrders =
        Number(
            report?.pendingOrders || 0
        );


    const averageOrderValue =
        Number(
            report?.averageOrderValue || 0
        );


    const revenueGrowth =
        Number(
            report?.revenueGrowth || 0
        );


    const orderGrowth =
        Number(
            report?.orderGrowth || 0
        );


    const chart =
        normalizeChartData(
            report?.chart || []
        );


    const topProducts =
        Array.isArray(
            report?.topProducts
        )
            ? report.topProducts
            : [];


    const categories =
        Array.isArray(
            report?.categories
        )
            ? report.categories
            : [];


    const paymentMethods =
        Array.isArray(
            report?.paymentMethods
        )
            ? report.paymentMethods
            : [];


    // =================================================
    // CHART
    // =================================================

    const chartValues =
        chart.map(
            item =>
                Number(
                    item.value || 0
                )
        );


    const maxChartValue =
        Math.max(
            ...chartValues,
            1
        );


    // =================================================
    // TOTAL PAYMENT VALUE
    // =================================================

    const paymentTotal =
        paymentMethods.reduce(
            (
                total,
                payment
            ) =>
                total +
                Number(
                    payment.revenue || 0
                ),
            0
        );

    const paymentPieSegments = paymentMethods.map(
        (payment, index) => ({
            percentage:
                paymentTotal > 0
                    ? Number(payment.revenue || 0) / paymentTotal * 100
                    : 0,
            color: ["#4f46e5", "#f59e0b", "#10b981", "#ef4444"][index % 4]
        })
    );

    let paymentPieOffset = 0;
    const paymentPieGradient = paymentPieSegments.length
        ? `conic-gradient(${paymentPieSegments.map((segment) => {
            const start = paymentPieOffset;
            paymentPieOffset += segment.percentage;
            return `${segment.color} ${start}% ${paymentPieOffset}%`;
        }).join(", ")})`
        : "#e5e7eb";


    // =================================================
    // CATEGORY TOTAL
    // =================================================

    const categoryTotal =
        categories.reduce(
            (
                total,
                category
            ) =>
                total +
                Number(
                    category.revenue || 0
                ),
            0
        );


    // =================================================
    // PERIOD TEXT
    // =================================================

    const periodText = {

        today:
            "today",

        week:
            "this week",

        month:
            "this month",

        lastMonth:
            "last month",

        year:
            "this year"

    };


    // =================================================
    // EXPORT REPORT
    // =================================================

    const exportRevenueReport =
        () => {

            if (!report) {

                alert(
                    "Revenue report is not available yet."
                );

                return;

            }


            try {

                setExporting(true);


                const rows = [];


                rows.push([
                    "Revenue Report"
                ]);


                rows.push([
                    "Period",
                    period
                ]);


                rows.push([
                    "Generated",
                    new Date().toLocaleString(
                        "en-BD"
                    )
                ]);


                rows.push([]);


                // SUMMARY

                rows.push([
                    "Summary"
                ]);


                rows.push([
                    "Paid Revenue",
                    revenue
                ]);


                rows.push([
                    "Pending Revenue",
                    pendingRevenue
                ]);


                rows.push([
                    "Paid Orders",
                    orders
                ]);


                rows.push([
                    "Pending Orders",
                    pendingOrders
                ]);


                rows.push([
                    "Average Order Value",
                    averageOrderValue
                ]);


                rows.push([
                    "Revenue Growth %",
                    revenueGrowth
                ]);


                rows.push([
                    "Order Growth %",
                    orderGrowth
                ]);


                // TOP PRODUCTS

                rows.push([]);


                rows.push([
                    "Top Products"
                ]);


                rows.push([
                    "Product",
                    "Units Sold",
                    "Revenue",
                    "Change %"
                ]);


                topProducts.forEach(
                    product => {

                        rows.push([

                            product.name ||
                            "Unknown",

                            Number(
                                product.units || 0
                            ),

                            Number(
                                product.revenue || 0
                            ),

                            Number(
                                product.change || 0
                            )

                        ]);

                    }
                );


                // CATEGORIES

                rows.push([]);


                rows.push([
                    "Sales by Category"
                ]);


                rows.push([
                    "Category",
                    "Revenue",
                    "Percentage"
                ]);


                categories.forEach(
                    category => {

                        const name =
                            category.name ||
                            category.category ||
                            "Others";


                        const categoryRevenue =
                            Number(
                                category.revenue || 0
                            );


                        const percentage =
                            Number(
                                category.percentage ??
                                (
                                    categoryTotal > 0
                                        ? (
                                            categoryRevenue /
                                            categoryTotal *
                                            100
                                        )
                                        : 0
                                )
                            );


                        rows.push([

                            name,

                            categoryRevenue,

                            Number(
                                percentage.toFixed(
                                    1
                                )
                            )

                        ]);

                    }
                );


                // PAYMENT STATUS

                rows.push([]);


                rows.push([
                    "Payment Status"
                ]);


                rows.push([
                    "Status",
                    "Revenue",
                    "Percentage"
                ]);


                paymentMethods.forEach(
                    payment => {

                        const paymentRevenue =
                            Number(
                                payment.revenue || 0
                            );


                        const percentage =
                            Number(
                                payment.percentage ??
                                (
                                    paymentTotal > 0
                                        ? (
                                            paymentRevenue /
                                            paymentTotal *
                                            100
                                        )
                                        : 0
                                )
                            );


                        rows.push([

                            payment.name ||
                            "Unknown",

                            paymentRevenue,

                            Number(
                                percentage.toFixed(
                                    1
                                )
                            )

                        ]);

                    }
                );


                // REVENUE CHART

                rows.push([]);


                rows.push([
                    "Revenue Chart"
                ]);


                rows.push([
                    "Date",
                    "Revenue"
                ]);


                chart.forEach(
                    item => {

                        rows.push([

                            item.label ||
                            formatChartDate(
                                item.date
                            ),

                            Number(
                                item.value ??
                                item.revenue ??
                                0
                            )

                        ]);

                    }
                );


                // CSV

                const csv =
                    rows
                        .map(
                            row =>
                                row
                                    .map(
                                        csvValue
                                    )
                                    .join(",")
                        )
                        .join("\n");


                const blob =
                    new Blob(
                        [
                            "\uFEFF",
                            csv
                        ],
                        {
                            type:
                                "text/csv;charset=utf-8;"
                        }
                    );


                const url =
                    URL.createObjectURL(
                        blob
                    );


                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    url;


                link.download =
                    `bizpilot-revenue-${period}.csv`;


                document.body.appendChild(
                    link
                );


                link.click();


                document.body.removeChild(
                    link
                );


                URL.revokeObjectURL(
                    url
                );


            } catch (
                err
            ) {

                console.error(
                    "Revenue export error:",
                    err
                );


                alert(
                    "Unable to export revenue report."
                );


            } finally {

                setExporting(false);

            }

        };

    const exportRevenuePdf = () => {
        if (!report) {
            alert("Revenue report is not available yet.");
            return;
        }

        const escapeHtml = (value) =>
            String(value ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const chartRows = chart
            .map((item) => `<tr><td>${escapeHtml(item.label)}</td><td>${money(item.value)}</td></tr>`)
            .join("");
        const paymentRows = paymentMethods
            .map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${money(item.revenue)}</td><td>${Number(item.percentage || 0).toFixed(1)}%</td></tr>`)
            .join("");

        const printFrame = document.createElement("iframe");
        printFrame.style.position = "fixed";
        printFrame.style.right = "0";
        printFrame.style.bottom = "0";
        printFrame.style.width = "0";
        printFrame.style.height = "0";
        printFrame.style.border = "0";
        document.body.appendChild(printFrame);

        const printDocument = printFrame.contentDocument;
        if (!printDocument) {
            printFrame.remove();
            alert("Unable to prepare the PDF report.");
            return;
        }

        printDocument.open();
        printDocument.write(`<!doctype html><html><head><title>BizPilot Revenue Report - ${escapeHtml(periodText[period])}</title><style>
            body{font-family:Arial,sans-serif;color:#17233b;padding:32px;line-height:1.4}
            h1{margin:0 0 4px}h2{margin:24px 0 8px;font-size:18px}
            .muted{color:#64748b}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0}
            .card{border:1px solid #dbe3ef;border-radius:8px;padding:12px}.label{font-size:12px;color:#64748b}.value{font-size:20px;font-weight:700}
            table{width:100%;border-collapse:collapse;margin-top:8px}th,td{border:1px solid #dbe3ef;padding:8px;text-align:left}th{background:#f1f5f9}
            @media print{body{padding:0}.no-print{display:none}}
        </style></head><body>
            <h1>BizPilot Revenue Report</h1>
            <div class="muted">${escapeHtml(periodText[period])} &middot; Generated ${escapeHtml(new Date().toLocaleString("en-BD"))}</div>
            <div class="summary">
                <div class="card"><div class="label">Paid revenue</div><div class="value">${money(revenue)}</div></div>
                <div class="card"><div class="label">Paid orders</div><div class="value">${orders}</div></div>
                <div class="card"><div class="label">Pending revenue</div><div class="value">${money(pendingRevenue)}</div></div>
            </div>
            <h2>Revenue over time</h2><table><thead><tr><th>Period</th><th>Revenue</th></tr></thead><tbody>${chartRows || "<tr><td colspan='2'>No revenue data</td></tr>"}</tbody></table>
            <h2>Payment status</h2><table><thead><tr><th>Status</th><th>Revenue</th><th>Percentage</th></tr></thead><tbody>${paymentRows || "<tr><td colspan='3'>No payment data</td></tr>"}</tbody></table>
            <p class="no-print muted">Use your browser print dialog and choose “Save as PDF”.</p>
        </body></html>`);
        printDocument.close();

        printFrame.onload = () => {
            printFrame.contentWindow?.focus();
            printFrame.contentWindow?.print();
            window.setTimeout(() => printFrame.remove(), 1000);
        };
    };


    // =================================================
    // LOADING
    // =================================================

    if (loading) {

        return (

            <div className="revenue-page">

                <div className="revenue-loading">

                    Loading revenue report...

                </div>

            </div>

        );

    }


    // =================================================
    // ERROR
    // =================================================

    if (!report) {

        return (

            <div className="revenue-page">

                <div
                    className="revenue-error"
                    style={{
                        padding:
                            "24px",
                        display:
                            "flex",
                        flexDirection:
                            "column",
                        gap:
                            "8px"
                    }}
                >

                    <strong>
                        Revenue report could not be loaded.
                    </strong>


                    <span>
                        {
                            error ||
                            "Unable to load revenue data."
                        }
                    </span>


                    <button
                        type="button"
                        onClick={
                            loadRevenue
                        }
                        style={{
                            marginTop:
                                "10px",
                            width:
                                "fit-content",
                            padding:
                                "9px 16px",
                            border:
                                "none",
                            borderRadius:
                                "7px",
                            background:
                                "#6366f1",
                            color:
                                "#fff",
                            cursor:
                                "pointer",
                            fontWeight:
                                "600"
                        }}
                    >

                        Try Again

                    </button>

                </div>

            </div>

        );

    }


    // =================================================
    // RENDER
    // =================================================

    return (

        <div className="revenue-page">

            <div
                className="revenue-page-header"
                style={{
                    display:
                        "flex",
                    alignItems:
                        "center",
                    justifyContent:
                        "space-between",
                    gap:
                        "20px",
                    flexWrap:
                        "wrap"
                }}
            >

                <div>

                    <h1>
                        Revenue Report
                    </h1>


                    <p>
                        Track your sales performance
                        and business revenue.
                    </p>

                </div>


                <div
                    style={{
                        display:
                            "flex",
                        alignItems:
                            "center",
                        gap:
                            "10px",
                        flexWrap:
                            "wrap"
                    }}
                >

                    <div
                        className="period-selector"
                    >

                        {[
                            ["today", "Today"],
                            ["week", "This Week"],
                            ["month", "This Month"],
                            ["lastMonth", "Last Month"],
                            ["year", "This Year"]
                        ].map(
                            ([value, label]) => (

                                <button
                                    key={value}
                                    type="button"
                                    className={
                                        period === value
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        setPeriod(value)
                                    }
                                >

                                    {label}

                                </button>

                            )
                        )}

                    </div>


                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            type="button"
                            onClick={exportRevenueReport}
                            disabled={exporting || !report}
                            style={{
                                padding: "10px 16px",
                                border: "none",
                                borderRadius: "7px",
                                background: "#111827",
                                color: "#fff",
                                cursor: exporting || !report ? "not-allowed" : "pointer",
                                opacity: exporting ? 0.65 : 1,
                                fontWeight: "600",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {exporting ? "Exporting..." : "Download CSV"}
                        </button>
                        <button
                            type="button"
                            onClick={exportRevenuePdf}
                            disabled={!report}
                            style={{
                                padding: "10px 16px",
                                border: "1px solid #dbe3ef",
                                borderRadius: "7px",
                                background: "#fff",
                                color: "#17233b",
                                cursor: !report ? "not-allowed" : "pointer",
                                fontWeight: "600",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Download PDF
                        </button>
                    </div>

                </div>

            </div>


            <div
                style={{
                    marginBottom:
                        "18px",
                    fontSize:
                        "12px",
                    color:
                        "#8b929d"
                }}
            >

                Showing revenue data for{" "}

                <strong>
                    {
                        periodText[period]
                    }
                </strong>

            </div>


            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="revenue-summary-grid">

                <div className="revenue-stat-card">

                    <div className="stat-label">
                        Total Revenue
                    </div>

                    <div className="stat-value">
                        {money(revenue)}
                    </div>

                    <div
                        className="stat-meta"
                        style={{
                            color:
                                revenueGrowth >= 0
                                    ? "#16a34a"
                                    : "#dc2626"
                        }}
                    >

                        {revenueGrowth >= 0
                            ? "↑"
                            : "↓"}

                        {" "}

                        {Math.abs(
                            revenueGrowth
                        ).toFixed(1)}

                        %

                        {" "}vs previous period

                    </div>

                </div>


                <div className="revenue-stat-card">

                    <div className="stat-label">
                        Paid Orders
                    </div>

                    <div className="stat-value">
                        {orders}
                    </div>

                    <div
                        className="stat-meta"
                        style={{
                            color:
                                orderGrowth >= 0
                                    ? "#16a34a"
                                    : "#dc2626"
                        }}
                    >

                        {orderGrowth >= 0
                            ? "↑"
                            : "↓"}

                        {" "}

                        {Math.abs(
                            orderGrowth
                        ).toFixed(1)}

                        %

                        {" "}vs previous period

                    </div>

                </div>


                <div className="revenue-stat-card">

                    <div className="stat-label">
                        Average Order Value
                    </div>

                    <div className="stat-value">
                        {money(
                            averageOrderValue
                        )}
                    </div>

                </div>


                <div className="revenue-stat-card">

                    <div className="stat-label">
                        Pending Revenue
                    </div>

                    <div className="stat-value">
                        {money(
                            pendingRevenue
                        )}
                    </div>

                    <div className="stat-meta">
                        {pendingOrders} pending orders
                    </div>

                </div>

            </div>


            {/* =================================================
                REVENUE OVERVIEW
            ================================================= */}

            <div
                className="revenue-panel"
                style={{
                    marginTop:
                        "24px"
                }}
            >

                <div className="panel-header">

                    <div>

                        <h2>
                            Revenue Overview
                        </h2>

                        <p>
                            Paid revenue over time.
                        </p>

                    </div>

                </div>


                {chart.length === 0 ? (

                    <div className="empty-state">

                        No revenue data available.

                    </div>

                ) : (

                    <div
                        style={{
                            overflowX:
                                "auto",
                            borderBottom:
                                "1px solid #e5e7eb",
                            padding:
                                "20px 10px 30px"
                        }}
                    >

                        <div
                            style={{
                                display:
                                    "flex",
                                alignItems:
                                    "flex-end",
                                gap:
                                    chart.length > 20
                                        ? "4px"
                                        : "8px",
                                minWidth:
                                    chart.length > 20
                                        ? `${chart.length * 28}px`
                                        : "100%"
                            }}
                        >

                            {chart.map(
                                (
                                    item,
                                    index
                                ) => {

                                    const height =
                                        Math.max(
                                            (
                                                Number(
                                                    item.value ||
                                                    0
                                                ) /
                                                maxChartValue
                                            ) *
                                            200,
                                            item.value > 0
                                                ? 8
                                                : 2
                                        );


                                    return (

                                        <div
                                            key={`${item.label}-${index}`}
                                            style={{
                                                minWidth:
                                                    chart.length > 20
                                                        ? "28px"
                                                        : "42px",
                                                flex:
                                                    chart.length <= 20
                                                        ? 1
                                                        : "0 0 auto",
                                                height:
                                                    "230px",
                                                display:
                                                    "flex",
                                                flexDirection:
                                                    "column",
                                                justifyContent:
                                                    "flex-end",
                                                alignItems:
                                                    "center",
                                                gap:
                                                    "7px"
                                            }}
                                        >

                                            <span
                                                style={{
                                                    fontSize:
                                                        "9px",
                                                    color:
                                                        "#737b87",
                                                    whiteSpace:
                                                        "nowrap"
                                                }}
                                            >

                                                {money(
                                                    item.value
                                                )}

                                            </span>


                                            <div
                                                title={`${item.label}: ${money(item.value)}`}
                                                style={{
                                                    width:
                                                        "100%",
                                                    maxWidth:
                                                        "32px",
                                                    height:
                                                        `${height}px`,
                                                    minHeight:
                                                        "2px",
                                                    background:
                                                        "#4f46e5",
                                                    borderRadius:
                                                        "5px 5px 0 0"
                                                }}
                                            />


                                            <span
                                                style={{
                                                    fontSize:
                                                        "9px",
                                                    color:
                                                        "#8a9099",
                                                    whiteSpace:
                                                        "nowrap"
                                                }}
                                            >

                                                {
                                                    item.label
                                                }

                                            </span>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    </div>

                )}

            </div>


            {/* =================================================
                TWO COLUMN
            ================================================= */}

            <div
                style={{
                    display:
                        "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(320px, 1fr))",
                    gap:
                        "24px",
                    marginTop:
                        "24px"
                }}
            >


                {/* TOP PRODUCTS */}

                <div className="revenue-panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Top Products
                            </h2>

                            <p>
                                Best performing products.
                            </p>

                        </div>

                    </div>


                    {topProducts.length === 0 ? (

                        <div className="empty-state">

                            No product data available.

                        </div>

                    ) : (

                        <div className="report-list">

                            {topProducts.map(
                                (
                                    product,
                                    index
                                ) => {

                                    const name =
                                        product.name ||
                                        "Unknown Product";


                                    const units =
                                        Number(
                                            product.units ||
                                            0
                                        );


                                    const productRevenue =
                                        Number(
                                            product.revenue ||
                                            0
                                        );


                                    const change =
                                        Number(
                                            product.change ||
                                            0
                                        );


                                    const image =
                                        productImages[
                                            name
                                        ];


                                    return (

                                        <div
                                            className="report-row"
                                            key={`${name}-${index}`}
                                        >

                                            <div className="report-rank">
                                                #{index + 1}
                                            </div>


                                            <div
                                                className="report-icon"
                                                style={{
                                                    width:
                                                        "42px",
                                                    height:
                                                        "42px",
                                                    borderRadius:
                                                        "9px",
                                                    display:
                                                        "flex",
                                                    alignItems:
                                                        "center",
                                                    justifyContent:
                                                        "center",
                                                    background:
                                                        "#f4f5f7",
                                                    overflow:
                                                        "hidden",
                                                    fontSize:
                                                        "20px"
                                                }}
                                            >

                                                {image ? (

                                                    <img
                                                        src={
                                                            image
                                                        }
                                                        alt={
                                                            name
                                                        }
                                                        style={{
                                                            width:
                                                                "100%",
                                                            height:
                                                                "100%",
                                                            objectFit:
                                                                "cover"
                                                        }}
                                                        onError={(
                                                            event
                                                        ) => {

                                                            event.currentTarget.style.display =
                                                                "none";

                                                        }}
                                                    />

                                                ) : (

                                                    getProductEmoji(
                                                        name
                                                    )

                                                )}

                                            </div>


                                            <div
                                                style={{
                                                    flex:
                                                        1,
                                                    minWidth:
                                                        0
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        fontWeight:
                                                            "600",
                                                        fontSize:
                                                            "13px"
                                                    }}
                                                >

                                                    {name}

                                                </div>


                                                <div
                                                    style={{
                                                        fontSize:
                                                            "11px",
                                                        color:
                                                            "#8a9099",
                                                        marginTop:
                                                            "3px"
                                                    }}
                                                >

                                                    {units} units sold

                                                </div>

                                            </div>


                                            <div
                                                style={{
                                                    textAlign:
                                                        "right"
                                                }}
                                            >

                                                <strong>
                                                    {money(
                                                        productRevenue
                                                    )}
                                                </strong>


                                                <div
                                                    style={{
                                                        color:
                                                            change >= 0
                                                                ? "#16a34a"
                                                                : "#dc2626",
                                                        fontSize:
                                                            "11px"
                                                    }}
                                                >

                                                    {change >= 0
                                                        ? "↑"
                                                        : "↓"}

                                                    {" "}

                                                    {Math.abs(
                                                        change
                                                    ).toFixed(
                                                        1
                                                    )}

                                                    %

                                                </div>

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>


                {/* SALES BY CATEGORY */}

                <div className="revenue-panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Sales by Category
                            </h2>

                            <p>
                                Where your revenue is
                                coming from.
                            </p>

                        </div>

                    </div>


                    {categories.length === 0 ? (

                        <div
                            className="empty-state"
                            style={{
                                padding:
                                    "35px 20px"
                            }}
                        >

                            <div
                                style={{
                                    fontSize:
                                        "30px",
                                    marginBottom:
                                        "10px"
                                }}
                            >
                                📊
                            </div>


                            <strong>
                                No category data available
                            </strong>


                            <p
                                style={{
                                    marginTop:
                                        "6px",
                                    fontSize:
                                        "13px",
                                    color:
                                        "#94a3b8"
                                }}
                            >

                                Category information is
                                not available in the
                                current database.

                            </p>

                        </div>

                    ) : (

                        <div
                            style={{
                                padding:
                                    "20px"
                            }}
                        >

                            {categories.map(
                                (
                                    category,
                                    index
                                ) => {

                                    const categoryName =
                                        category.name ||
                                        category.category ||
                                        "Others";


                                    const categoryRevenue =
                                        Number(
                                            category.revenue ||
                                            0
                                        );


                                    const percentage =
                                        Number(
                                            category.percentage ??
                                            (
                                                categoryTotal >
                                                0
                                                    ? (
                                                        categoryRevenue /
                                                        categoryTotal *
                                                        100
                                                    )
                                                    : 0
                                            )
                                        );


                                    return (

                                        <div
                                            key={`${categoryName}-${index}`}
                                            style={{
                                                marginBottom:
                                                    "18px"
                                            }}
                                        >

                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems:
                                                        "center",
                                                    gap:
                                                        "10px",
                                                    marginBottom:
                                                        "7px"
                                                }}
                                            >

                                                <span
                                                    style={{
                                                        fontSize:
                                                            "13px",
                                                        fontWeight:
                                                            "600"
                                                    }}
                                                >

                                                    {
                                                        categoryName
                                                    }

                                                </span>


                                                <span
                                                    style={{
                                                        fontSize:
                                                            "12px",
                                                        fontWeight:
                                                            "600",
                                                        whiteSpace:
                                                            "nowrap"
                                                    }}
                                                >

                                                    {money(
                                                        categoryRevenue
                                                    )}

                                                    {" "}

                                                    (
                                                    {
                                                        percentage.toFixed(
                                                            1
                                                        )
                                                    }%
                                                    )

                                                </span>

                                            </div>


                                            <div
                                                style={{
                                                    width:
                                                        "100%",
                                                    height:
                                                        "8px",
                                                    background:
                                                        "#e5e7eb",
                                                    borderRadius:
                                                        "999px",
                                                    overflow:
                                                        "hidden"
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        width:
                                                            `${Math.min(
                                                                Math.max(
                                                                    percentage,
                                                                    0
                                                                ),
                                                                100
                                                            )}%`,
                                                        height:
                                                            "100%",
                                                        background:
                                                            "#4f46e5",
                                                        borderRadius:
                                                            "999px"
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </div>

            </div>


            {/* =================================================
                PAYMENT STATUS
            ================================================= */}

            <div
                className="revenue-panel"
                style={{
                    marginTop:
                        "24px"
                }}
            >

                <div className="panel-header">

                    <div>

                        <h2>
                            Payment Status
                        </h2>

                        <p>
                            Paid and pending order
                            breakdown.
                        </p>

                    </div>

                </div>

                {paymentMethods.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "28px", padding: "0 20px 20px", flexWrap: "wrap" }}>
                        <div
                            aria-label="Payment status pie chart"
                            role="img"
                            style={{ width: "150px", height: "150px", borderRadius: "50%", background: paymentPieGradient, flex: "0 0 auto" }}
                        />
                        <div style={{ display: "grid", gap: "8px" }}>
                            {paymentMethods.map((payment, index) => (
                                <div key={`${payment.name}-${index}`} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: paymentPieSegments[index].color }} />
                                    <span>{String(payment.name || "Unknown").toUpperCase()}</span>
                                    <strong>{Number(payment.percentage || 0).toFixed(1)}%</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="report-list">

                    {paymentMethods.length === 0 ? (

                        <div className="empty-state">

                            No payment data available.

                        </div>

                    ) : (

                        paymentMethods.map(
                            (
                                payment,
                                index
                            ) => {

                                const name =
                                    String(
                                        payment.name ||
                                        "Unknown"
                                    ).toUpperCase();


                                const paymentRevenue =
                                    Number(
                                        payment.revenue ||
                                        0
                                    );


                                const percentage =
                                    Number(
                                        payment.percentage ??
                                        (
                                            paymentTotal > 0
                                                ? (
                                                    paymentRevenue /
                                                    paymentTotal *
                                                    100
                                                )
                                                : 0
                                        )
                                    );


                                return (

                                    <div
                                        className="report-row"
                                        key={`${name}-${index}`}
                                    >

                                        <div
                                            style={{
                                                flex:
                                                    1,
                                                fontWeight:
                                                    "600",
                                                fontSize:
                                                    "13px"
                                            }}
                                        >

                                            {name}

                                        </div>


                                        <div
                                            style={{
                                                textAlign:
                                                    "right"
                                            }}
                                        >

                                            <strong>
                                                {money(
                                                    paymentRevenue
                                                )}
                                            </strong>


                                            <div
                                                style={{
                                                    fontSize:
                                                        "11px",
                                                    color:
                                                        "#8a9099"
                                                }}
                                            >

                                                {percentage.toFixed(
                                                    1
                                                )}

                                                %

                                            </div>

                                        </div>

                                    </div>

                                );

                            }
                        )

                    )}

                </div>

            </div>


            {/* =================================================
                REVENUE NOTE
            ================================================= */}

            <div
                style={{
                    marginTop:
                        "16px",
                    fontSize:
                        "11px",
                    color:
                        "#8a9099"
                }}
            >

                Revenue is calculated from
                confirmed paid orders only.
                Pending payments are shown
                separately for reference.

            </div>

        </div>

    );

};


export default Revenue;