import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates and downloads an executive, professional PDF business report.
 * Uses html2canvas + jsPDF with a visible generation overlay to guarantee
 * that all elements, styles, and currency symbols render without blank pages.
 * 
 * @param {Object} options
 * @param {string} options.title - Report Title (e.g. "Sales Performance Report")
 * @param {string} options.subtitle - Short description or scope
 * @param {string} options.businessName - Name of the merchant business
 * @param {string} options.ownerName - Name of the merchant owner
 * @param {string} options.period - Active filter period (e.g. "Last 30 Days" or "This Month")
 * @param {Array<{label: string, value: string, subtext?: string}>} options.kpis - Key summary metrics
 * @param {Array<{title: string, subtitle?: string, headers: string[], rows: (string|number)[][], totals?: (string|number)[]}>} options.tables - Tables with rows & totals
 * @param {string} [options.fileName] - Target PDF file name
 */
export async function downloadReportPDF({
  title = 'Business Performance Report',
  subtitle = 'Official operational and financial statement',
  businessName = 'BizPilot Merchant Store',
  ownerName = 'Store Owner',
  period = 'Last 30 Days',
  kpis = [],
  tables = [],
  fileName = 'bizpilot-report.pdf'
}) {
  const generatedAt = new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  const refCode = `BP-${Math.floor(100000 + Math.random() * 900000)}`;

  // Create overlay container so elements have active layout and 100% opacity during capture
  const overlay = document.createElement('div');
  overlay.id = 'bizpilot-pdf-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
  overlay.style.backdropFilter = 'blur(4px)';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'flex-start';
  overlay.style.overflowY = 'auto';
  overlay.style.padding = '30px 16px';
  overlay.style.boxSizing = 'border-box';

  // Informative generation badge
  const badge = document.createElement('div');
  badge.style.display = 'inline-flex';
  badge.style.alignItems = 'center';
  badge.style.gap = '8px';
  badge.style.padding = '8px 18px';
  badge.style.backgroundColor = '#1b6b55';
  badge.style.color = '#ffffff';
  badge.style.borderRadius = '999px';
  badge.style.fontSize = '12px';
  badge.style.fontWeight = '700';
  badge.style.marginBottom = '20px';
  badge.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
  badge.innerHTML = `
    <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#6ee7b7;animation:pulse 1.5s infinite;"></span>
    Generating High-Resolution Report PDF...
  `;
  overlay.appendChild(badge);

  // The actual document card (A4 ratio width ~794px)
  const container = document.createElement('div');
  container.id = 'bizpilot-report-node';
  container.style.width = '794px';
  container.style.maxWidth = '100%';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#0f172a';
  container.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  container.style.padding = '36px 40px';
  container.style.boxSizing = 'border-box';
  container.style.borderRadius = '16px';
  container.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4)';
  container.style.position = 'relative';

  // Build KPI Cards HTML
  const kpiCardsHtml = kpis.length > 0 ? `
    <div style="display: grid; grid-template-columns: repeat(${Math.min(kpis.length, 4)}, 1fr); gap: 14px; margin-bottom: 26px;">
      ${kpis.map(k => `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: 3px solid #1b6b55; border-radius: 12px; padding: 14px 16px;">
          <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 6px;">
            ${k.label}
          </div>
          <div style="font-size: 20px; font-weight: 900; color: #0f172a; line-height: 1.2;">
            ${k.value}
          </div>
          ${k.subtext ? `
            <div style="font-size: 10px; color: #1b6b55; font-weight: 600; margin-top: 4px;">
              ${k.subtext}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  ` : '';

  // Build Tables HTML
  const tablesHtml = tables.map((tbl) => `
    <div style="margin-bottom: 24px;">
      ${tbl.title ? `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
          <h3 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.3px;">
            ${tbl.title}
          </h3>
          ${tbl.subtitle ? `<span style="font-size: 11px; color: #64748b;">${tbl.subtitle}</span>` : ''}
        </div>
      ` : ''}
      <table style="width: 100%; border-collapse: collapse; font-size: 11px; text-align: left; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
            ${tbl.headers.map((h, idx) => `
              <th style="padding: 10px 12px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #334155; ${idx > 0 && (tbl.rows[0]?.[idx] !== undefined && (typeof tbl.rows[0]?.[idx] === 'number' || String(tbl.rows[0]?.[idx]).includes('৳'))) ? 'text-align: right;' : 'text-align: left;'}">
                ${h}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${tbl.rows.length === 0 ? `
            <tr>
              <td colspan="${tbl.headers.length}" style="padding: 16px; text-align: center; color: #94a3b8; font-style: italic;">
                No records recorded for this filter period.
              </td>
            </tr>
          ` : tbl.rows.map((row, rIdx) => `
            <tr style="border-bottom: 1px solid #f1f5f9; background-color: ${rIdx % 2 === 0 ? '#ffffff' : '#f8fafc'};">
              ${row.map((cell, cIdx) => `
                <td style="padding: 9px 12px; color: ${cIdx === 0 ? '#0f172a; font-weight: 700;' : '#334155;'} ${cIdx > 0 && (typeof cell === 'number' || String(cell).includes('৳')) ? 'text-align: right;' : 'text-align: left;'}">
                  ${cell ?? '-'}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
        ${tbl.totals ? `
          <tfoot>
            <tr style="background-color: #f1f5f9; border-top: 2px solid #cbd5e1; font-weight: 800; color: #0f172a;">
              ${tbl.totals.map((t, tIdx) => `
                <td style="padding: 10px 12px; ${tIdx > 0 && (typeof t === 'number' || String(t).includes('৳')) ? 'text-align: right;' : 'text-align: left;'}">
                  ${t}
                </td>
              `).join('')}
            </tr>
          </tfoot>
        ` : ''}
      </table>
    </div>
  `).join('');

  // Assemble full report document
  container.innerHTML = `
    <!-- Top Accent Bar -->
    <div style="height: 5px; background: linear-gradient(90deg, #1b6b55 0%, #104838 50%, #0a3328 100%); margin: -36px -40px 24px -40px; border-top-left-radius: 16px; border-top-right-radius: 16px;"></div>

    <!-- Header Section -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 2px solid #e2e8f0; margin-bottom: 22px;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <div style="width: 26px; height: 26px; border-radius: 6px; background-color: #1b6b55; display: inline-flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 900; font-size: 14px;">
            B
          </div>
          <span style="font-size: 16px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a;">BIZPILOT</span>
          <span style="font-size: 10px; font-weight: 700; color: #1b6b55; background-color: #e6f4ea; padding: 2px 7px; border-radius: 999px; text-transform: uppercase;">Commerce OS</span>
        </div>
        <div style="font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px;">
          ${businessName}
        </div>
        <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
          Merchant Account Owner: <span style="color: #334155; font-weight: 600;">${ownerName}</span>
        </div>
      </div>

      <div style="text-align: right;">
        <div style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 9px; font-weight: 800; letter-spacing: 0.8px; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; margin-bottom: 6px;">
          Official Executive Report
        </div>
        <div style="font-size: 11px; color: #475569; font-weight: 600;">
          Ref: <span style="font-family: monospace; color: #0f172a;">${refCode}</span>
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 3px;">
          Generated: ${generatedAt}
        </div>
      </div>
    </div>

    <!-- Report Title Banner -->
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px 20px; margin-bottom: 22px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h1 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 0; letter-spacing: -0.4px;">
            ${title}
          </h1>
          <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">
            ${subtitle}
          </p>
        </div>
        <div style="text-align: right; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 14px;">
          <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; color: #64748b;">Applied Filter</div>
          <div style="font-size: 12px; font-weight: 800; color: #1b6b55;">${period}</div>
        </div>
      </div>
    </div>

    <!-- KPI Summary Grid -->
    ${kpiCardsHtml}

    <!-- Detailed Report Tables -->
    ${tablesHtml}

    <!-- Verification & Footer Section -->
    <div style="margin-top: 28px; padding-top: 14px; border-top: 1px dashed #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #94a3b8;">
      <div>
        <span style="font-weight: 700; color: #475569;">BizPilot Business Intelligence Engine</span> • All financial and inventory amounts in BDT (৳)
      </div>
      <div>
        Authorized Merchant Report • Page 1 of 1
      </div>
    </div>
  `;

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  try {
    // Wait for DOM layout to settle
    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollY: 0,
      scrollX: 0
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Render first page
    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    // Render subsequent pages if content overflows
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(fileName);
    return true;
  } catch (err) {
    console.error('Failed to generate PDF report:', err);
    throw err;
  } finally {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }
}
