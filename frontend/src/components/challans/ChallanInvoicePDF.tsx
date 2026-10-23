import { forwardRef } from 'react';
import type { ChallanDetail } from '../../types/api';
import { formatCurrency, formatDate, formatNumber } from '../../lib/format';

interface ChallanInvoicePDFProps {
  data: ChallanDetail;
}

export const ChallanInvoicePDF = forwardRef<HTMLDivElement, ChallanInvoicePDFProps>(
  ({ data }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: '794px',
          minHeight: '1123px',
          backgroundColor: '#ffffff',
          color: '#1f2937',
          fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          padding: '44px 48px 60px 48px',
          boxSizing: 'border-box',
          position: 'relative',
          fontSize: '12px',
          lineHeight: '1.5',
          margin: '0 auto',
        }}
      >
        {/* TOP LEFT ACCENT BLOCK */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '75px',
            height: '95px',
            backgroundColor: '#e6ded5',
            borderBottomRightRadius: '24px',
            zIndex: 1,
          }}
        />

        {/* TOP RIGHT CURVED ARCS DECORATION */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '240px',
            height: '240px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
          viewBox="0 0 240 240"
          fill="none"
        >
          <path
            d="M 240,0 C 130,0 40,90 40,200 C 40,215 42,228 45,240"
            stroke="#9fa6b2"
            strokeWidth="3.5"
            fill="none"
          />
          <path
            d="M 240,40 C 150,40 75,115 75,205"
            stroke="#c8ced6"
            strokeWidth="2"
            fill="none"
          />
        </svg>

        {/* HEADER CONTAINER */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingTop: '8px',
            marginBottom: '32px',
          }}
        >
          {/* COMPANY LOGO & NAME */}
          <div style={{ marginLeft: '50px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              {/* Hexagon Logo Icon */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
                  stroke="#1f2937"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 8L23 12V20L16 24L9 20V12L16 8Z"
                  stroke="#c08770"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                style={{
                  fontSize: '21px',
                  fontWeight: 800,
                  letterSpacing: '0.8px',
                  color: '#1f2937',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                MINI ERP + CRM
              </span>
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#6b7280',
                letterSpacing: '2px',
                paddingLeft: '42px',
                marginTop: '-2px',
              }}
            >
              OPERATIONS PORTAL
            </div>
          </div>

          {/* DOCUMENT TITLE */}
          <div style={{ textAlign: 'right', paddingRight: '20px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '24px',
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '0.5px',
                lineHeight: '1.1',
              }}
            >
              COMMERCIAL INVOICE
            </h1>
            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '11px',
                color: '#9ca3af',
                letterSpacing: '0.5px',
              }}
            >
              Sales Operations · Official Record
            </p>
          </div>
        </div>

        {/* METADATA GRID */}
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            marginBottom: '16px',
            fontSize: '11px',
          }}
        >
          {/* Left Metadata Column */}
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ color: '#4b5563', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                CREATED BY
              </div>
              <div style={{ color: '#111827', fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>
                {data.createdBy.name}
              </div>
            </div>
            <div>
              <div style={{ color: '#4b5563', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                STATUS
              </div>
              <div style={{ color: data.status === 'CONFIRMED' ? '#059669' : data.status === 'CANCELLED' ? '#dc2626' : '#d97706', fontWeight: 700, fontSize: '12px', marginTop: '2px' }}>
                {data.status}
              </div>
            </div>
          </div>

          {/* Right Metadata Column */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <div style={{ color: '#4b5563', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                DATE
              </div>
              <div style={{ color: '#111827', fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>
                {formatDate(data.createdAt)}
              </div>
            </div>
            <div>
              <div style={{ color: '#4b5563', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                INVOICE / CHALLAN NO
              </div>
              <div style={{ color: '#111827', fontWeight: 700, fontSize: '12px', marginTop: '2px' }}>
                {data.challanNumber}
              </div>
            </div>
            <div>
              <div style={{ color: '#4b5563', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                CONFIRMED DATE
              </div>
              <div style={{ color: '#111827', fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>
                {data.confirmedAt ? formatDate(data.confirmedAt) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* TERRACOTTA SEPARATOR LINE */}
        <div
          style={{
            height: '2px',
            backgroundColor: '#c08770',
            width: '100%',
            marginBottom: '20px',
          }}
        />

        {/* SOLD BY & BILL TO SECTION */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px',
            marginBottom: '28px',
          }}
        >
          {/* SOLD BY */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#374151',
                letterSpacing: '1px',
                marginBottom: '6px',
              }}
            >
              SOLD BY
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#c08770',
                marginBottom: '4px',
              }}
            >
              MINI ERP + CRM OPERATIONS PORTAL
            </div>
            <div style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.6' }}>
              Bhiwandi Central Warehouse<br />
              Mumbai, Maharashtra 400002<br />
              Phone: +91 98200 11223<br />
              Email: support@minierp.com<br />
              GSTIN: 27AAECS1234F1Z5
            </div>
          </div>

          {/* BILL TO */}
          <div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#374151',
                letterSpacing: '1px',
                marginBottom: '6px',
              }}
            >
              BILL TO
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#c08770',
                marginBottom: '4px',
              }}
            >
              {data.customer.businessName}
            </div>
            <div style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.6' }}>
              Contact: {data.customer.name}<br />
              {data.customer.address}<br />
              Phone: {data.customer.mobile}<br />
              Email: {data.customer.email}<br />
              {data.customer.gstNumber ? `GSTIN: ${data.customer.gstNumber}` : 'GSTIN: N/A'}
            </div>
          </div>
        </div>

        {/* PRODUCTS TABLE */}
        <div style={{ marginBottom: '24px' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#c08770',
                  color: '#ffffff',
                }}
              >
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'left',
                    fontWeight: 700,
                    fontSize: '10px',
                    letterSpacing: '0.8px',
                    width: '38%',
                  }}
                >
                  PRODUCT
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '10px',
                    letterSpacing: '0.8px',
                    width: '20%',
                  }}
                >
                  SKU / CATEGORY
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontSize: '10px',
                    letterSpacing: '0.8px',
                    width: '12%',
                  }}
                >
                  UNITS
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: '10px',
                    letterSpacing: '0.8px',
                    width: '15%',
                  }}
                >
                  UNIT PRICE
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    textAlign: 'right',
                    fontWeight: 700,
                    fontSize: '10px',
                    letterSpacing: '0.8px',
                    width: '15%',
                  }}
                >
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr
                  key={item.id || index}
                  style={{
                    borderBottom: '1px solid #c08770',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <td style={{ padding: '12px', color: '#111827', fontWeight: 600 }}>
                    <div>{item.productName}</div>
                    {item.productLocation ? (
                      <div style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 400, marginTop: '2px' }}>
                        Loc: {item.productLocation}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#4b5563' }}>
                    {item.productSku}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#111827', fontWeight: 600 }}>
                    {formatNumber(item.quantity)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#111827', fontWeight: 700 }}>
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SUMMARY & TOTALS SECTION */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '24px',
            marginBottom: '40px',
            pageBreakInside: 'avoid',
          }}
        >
          {/* Left Notes & Signature Block */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '11px', color: '#4b5563', lineHeight: '1.6' }}>
              {data.notes ? (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 700, color: '#111827' }}>Notes: </span>
                  {data.notes}
                </div>
              ) : null}
              <div>Total Line Items: {data.items.length}</div>
              <div>Total Units Dispatched: {formatNumber(data.totalQuantity)}</div>
            </div>

            {/* Signature Area */}
            <div style={{ marginTop: '40px' }}>
              <div style={{ width: '180px', borderBottom: '1px solid #9ca3af', marginBottom: '6px' }} />
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
                Authorised Signatory
              </div>
            </div>
          </div>

          {/* Right Breakdown */}
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', color: '#4b5563', fontWeight: 600 }}>Sub Total</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: '#111827', fontWeight: 700 }}>
                    {formatCurrency(data.totalAmount)}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '6px 0', color: '#4b5563' }}>Taxes / Fees</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: '#6b7280' }}>
                    Included
                  </td>
                </tr>
                <tr style={{ borderTop: '1.5px solid #111827' }}>
                  <td style={{ padding: '10px 0 4px 0', color: '#111827', fontWeight: 800, fontSize: '14px' }}>
                    Total
                  </td>
                  <td style={{ padding: '10px 0 4px 0', textAlign: 'right', color: '#111827', fontWeight: 800, fontSize: '16px' }}>
                    {formatCurrency(data.totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM DECORATIVE ACCENTS */}
        {/* Bottom Left Square Accent */}
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            width: '28px',
            height: '28px',
            backgroundColor: '#88939e',
            zIndex: 1,
          }}
        />

        {/* Bottom Right Circle Arc Accent */}
        <svg
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: '180px',
            height: '180px',
            pointerEvents: 'none',
            zIndex: 1,
          }}
          viewBox="0 0 180 180"
          fill="none"
        >
          <path
            d="M 180 40 C 100 40 40 100 40 180 L 180 180 Z"
            fill="#c08770"
            opacity="0.85"
          />
        </svg>
      </div>
    );
  },
);

ChallanInvoicePDF.displayName = 'ChallanInvoicePDF';
