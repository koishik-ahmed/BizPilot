const generateReceiptHTML = (receiptData) => {

    const {
        order,
        items,
        totalAmount
    } = receiptData;

    const esc = (value) => String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");


    // =====================================================
    // BUSINESS SOCIAL INFORMATION
    // These can be configured from .env
    // =====================================================

    const facebookPage =
        process.env.FACEBOOK_PAGE_NAME ||
        "FloraBeauty";

    const facebookUrl =
        process.env.FACEBOOK_PAGE_URL ||
        "#";

    const instagramHandle =
        process.env.INSTAGRAM_HANDLE ||
        "@florabeauty";

    const instagramUrl =
        process.env.INSTAGRAM_URL ||
        "#";


    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formattedDate = new Date(
        order.createdAt
    ).toLocaleString("en-BD", {
        dateStyle: "medium",
        timeStyle: "short"
    });


    // =====================================================
    // ORDER ITEMS
    // =====================================================

    const itemRows = items
        .map(
            (item) => `
                <tr>

                    <td class="product-cell">

                        <strong>
                            ${esc(item.productName)}
                        </strong>

                        <br>

                        <span class="sku">
                            SKU: ${esc(item.sku)}
                        </span>

                    </td>

                    <td class="number-cell">
                        ${item.quantity}
                    </td>

                    <td class="number-cell">
                        ৳${item.unitPrice.toFixed(2)}
                    </td>

                    <td class="number-cell">
                        ৳${item.subtotal.toFixed(2)}
                    </td>

                </tr>
            `
        )
        .join("");


    // =====================================================
    // RECEIPT HTML
    // =====================================================

    return `
<!DOCTYPE html>

<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        BizPilot Receipt #${order.id}
    </title>


    <style>

        * {
            box-sizing: border-box;
        }


        body {

            margin: 0;

            padding: 40px 20px;

            background: #f5f7fa;

            font-family:
                Arial,
                Helvetica,
                sans-serif;

            color: #172033;

        }


        .receipt {

            width: 100%;

            max-width: 800px;

            margin: 0 auto;

            background: #ffffff;

            padding: 44px;

            border-radius: 14px;

            box-shadow:
                0 6px 25px
                rgba(0, 0, 0, 0.08);

        }


        /* =================================================
           HEADER
           ================================================= */

        .header {

            display: flex;

            justify-content: space-between;

            align-items: flex-start;

            margin-bottom: 35px;

        }


        .brand {

            font-size: 32px;

            font-weight: 700;

            color: #2563eb;

            letter-spacing: -0.5px;

        }


        .brand-subtitle {

            margin-top: 5px;

            font-size: 13px;

            color: #6b7280;

        }


        .receipt-title {

            text-align: right;

        }


        .receipt-title h1 {

            margin: 0;

            font-size: 25px;

            font-weight: 700;

        }


        .receipt-title p {

            margin: 6px 0 0;

            font-size: 14px;

            color: #6b7280;

        }


        /* =================================================
           CUSTOMER SECTION
           ================================================= */

        .customer-section {

            display: grid;

            grid-template-columns:
                1fr 1fr;

            gap: 35px;

            padding: 22px 0;

            border-top:
                1px solid #e5e7eb;

            border-bottom:
                1px solid #e5e7eb;

        }


        .section-title {

            margin-bottom: 9px;

            font-size: 12px;

            font-weight: 700;

            text-transform: uppercase;

            letter-spacing: 0.6px;

            color: #64748b;

        }


        .customer-info p {

            margin: 5px 0;

            line-height: 1.5;

        }


        .customer-name {

            font-size: 17px;

            font-weight: 700;

        }


        /* =================================================
           ORDER TABLE
           ================================================= */

        table {

            width: 100%;

            border-collapse: collapse;

            margin-top: 30px;

        }


        th {

            padding:
                13px 10px;

            border-bottom:
                2px solid #e5e7eb;

            font-size: 12px;

            font-weight: 700;

            text-transform: uppercase;

            letter-spacing: 0.4px;

            color: #64748b;

            text-align: left;

        }


        td {

            padding:
                17px 10px;

            border-bottom:
                1px solid #e5e7eb;

            vertical-align: top;

        }


        .product-cell {

            width: 45%;

            line-height: 1.5;

        }


        .sku {

            font-size: 12px;

            color: #94a3b8;

        }


        .number-cell {

            text-align: right;

            white-space: nowrap;

        }


        /* =================================================
           TOTAL
           ================================================= */

        .total-section {

            display: flex;

            justify-content: flex-end;

            margin-top: 25px;

        }


        .total-box {

            width: 300px;

        }


        .total-row {

            display: flex;

            justify-content: space-between;

            padding: 8px 0;

            font-size: 15px;

        }


        .grand-total {

            margin-top: 8px;

            padding-top: 15px;

            border-top:
                2px solid #172033;

            font-size: 21px;

            font-weight: 700;

        }


        /* =================================================
           STATUS
           ================================================= */

        .status {

            margin-top: 30px;

            padding: 14px 18px;

            background: #f0fdf4;

            color: #15803d;

            border-radius: 9px;

            text-align: center;

            font-size: 14px;

            line-height: 1.7;

            font-weight: 600;

        }


        /* =================================================
           SOCIAL SECTION
           ================================================= */

        .social-section {

            margin-top: 32px;

            padding-top: 25px;

            border-top:
                1px solid #e5e7eb;

            text-align: center;

        }


        .social-title {

            margin-bottom: 12px;

            font-size: 14px;

            font-weight: 600;

            color: #374151;

        }


        .social-links {

            display: flex;

            justify-content: center;

            align-items: center;

            gap: 22px;

            flex-wrap: wrap;

        }


        .social-link {

            color: #2563eb;

            text-decoration: none;

            font-size: 14px;

            font-weight: 600;

        }


        .social-link:hover {

            text-decoration: underline;

        }


        /* =================================================
           FOOTER
           ================================================= */

        .footer {

            margin-top: 22px;

            padding-top: 18px;

            border-top:
                1px solid #e5e7eb;

            text-align: center;

            color: #6b7280;

            font-size: 12px;

            line-height: 1.7;

        }


        .powered {

            margin-top: 4px;

            color: #94a3b8;

        }


        /* =================================================
           PRINT
           ================================================= */

        @media print {

            body {

                padding: 0;

                background: #ffffff;

            }


            .receipt {

                max-width: none;

                padding: 30px;

                border-radius: 0;

                box-shadow: none;

            }


            .social-link {

                color: #2563eb;

            }

        }


        /* =================================================
           MOBILE
           ================================================= */

        @media (max-width: 600px) {

            body {

                padding: 15px 8px;

            }


            .receipt {

                padding: 25px 18px;

            }


            .header {

                flex-direction: column;

                gap: 20px;

            }


            .receipt-title {

                text-align: left;

            }


            .customer-section {

                grid-template-columns: 1fr;

                gap: 20px;

            }


            table {

                font-size: 13px;

            }


            th,
            td {

                padding:
                    12px 5px;

            }


            .product-cell {

                width: auto;

            }


            .total-box {

                width: 100%;

            }

        }

    </style>

</head>


<body>


    <div class="receipt">


        <!-- ============================================
             HEADER
             ============================================ -->

        <div class="header">

            <div>

                <div class="brand">
                    BizPilot
                </div>

                <div class="brand-subtitle">
                    Business Management
                </div>

            </div>


            <div class="receipt-title">

                <h1>
                    Order Receipt
                </h1>

                <p>
                    Order #${order.id}
                </p>

                <p>
                    ${formattedDate}
                </p>

            </div>

        </div>


        <!-- ============================================
             CUSTOMER
             ============================================ -->

        <div class="customer-section">


            <div class="customer-info">

                <div class="section-title">
                    Customer
                </div>

                <p class="customer-name">
                    ${esc(order.customerName)}
                </p>

                <p>
                    ${esc(order.customerPhone)}
                </p>

                ${
                    order.customerEmail
                        ? `
                            <p>
                                ${esc(order.customerEmail)}
                            </p>
                        `
                        : ""
                }

            </div>


            <div class="customer-info">

                <div class="section-title">
                    Shipping Address
                </div>

                <p>
                    ${esc(order.shippingAddress)}
                </p>

            </div>


        </div>


        <!-- ============================================
             PRODUCTS
             ============================================ -->

        <table>

            <thead>

                <tr>

                    <th>
                        Product
                    </th>

                    <th style="text-align: right;">
                        Qty
                    </th>

                    <th style="text-align: right;">
                        Unit Price
                    </th>

                    <th style="text-align: right;">
                        Subtotal
                    </th>

                </tr>

            </thead>


            <tbody>

                ${itemRows}

            </tbody>

        </table>


        <!-- ============================================
             TOTAL
             ============================================ -->

        <div class="total-section">

            <div class="total-box">

                <div class="total-row">

                    <span>
                        Subtotal
                    </span>

                    <span>
                        ৳${totalAmount.toFixed(2)}
                    </span>

                </div>


                <div class="total-row grand-total">

                    <span>
                        Total
                    </span>

                    <span>
                        ৳${totalAmount.toFixed(2)}
                    </span>

                </div>

            </div>

        </div>


        <!-- ============================================
             ORDER STATUS
             ============================================ -->

        <div class="status">

            Order Status:
            ${order.status}

            <br>

            Payment Status:
            ${order.paymentStatus}

        </div>


        <!-- ============================================
             SOCIAL MEDIA
             ============================================ -->

        <div class="social-section">

            <div class="social-title">

                Follow us & stay connected

            </div>


            <div class="social-links">


                <a
                    class="social-link"
                    href="${facebookUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Facebook: ${facebookPage}
                </a>


                <a
                    class="social-link"
                    href="${instagramUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Instagram: ${instagramHandle}
                </a>


            </div>

        </div>


        <!-- ============================================
             FOOTER
             ============================================ -->

        <div class="footer">

            <div>
                Thank you for your order!
            </div>

            <div class="powered">
                Powered by BizPilot
            </div>

        </div>


    </div>


</body>

</html>
    `;
};


module.exports = {
    generateReceiptHTML
};