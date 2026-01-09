import React from 'react';

const TaxInvoice = ({ orderData, companyInfo }) => {
  // Calculate totals with REVERSE GST calculation
  // GST is already included in the price
  const calculateTotals = () => {
    let totalIncludingGst = 0;
    let totalBaseAmount = 0;
    const gstSummary = {};

    // Calculate items total with reverse GST
    orderData.items.forEach(item => {
      const priceIncludingGst = item.price * item.quantity;
      totalIncludingGst += priceIncludingGst;

      // Reverse GST calculation: Base = Price / (1 + GST%/100)
      const gstRate = item.gst || 0;
      const baseAmount = priceIncludingGst / (1 + gstRate / 100);
      const gstAmount = priceIncludingGst - baseAmount;

      totalBaseAmount += baseAmount;

      // Group by GST rate
      if (!gstSummary[gstRate]) {
        gstSummary[gstRate] = { value: 0, amount: 0 };
      }
      gstSummary[gstRate].value += baseAmount;
      gstSummary[gstRate].amount += gstAmount;
    });

    // Add packing charges with reverse GST
    if (orderData.packingCharges) {
      const chargeIncludingGst = orderData.packingCharges.amount;
      totalIncludingGst += chargeIncludingGst;

      const gstRate = orderData.packingCharges.gst || 18;
      const baseAmount = chargeIncludingGst / (1 + gstRate / 100);
      const gstAmount = chargeIncludingGst - baseAmount;

      totalBaseAmount += baseAmount;

      if (!gstSummary[gstRate]) {
        gstSummary[gstRate] = { value: 0, amount: 0 };
      }
      gstSummary[gstRate].value += baseAmount;
      gstSummary[gstRate].amount += gstAmount;
    }

    // Add insurance charges with reverse GST
    if (orderData.insuranceCharges) {
      const chargeIncludingGst = orderData.insuranceCharges.amount;
      totalIncludingGst += chargeIncludingGst;

      const gstRate = orderData.insuranceCharges.gst || 18;
      const baseAmount = chargeIncludingGst / (1 + gstRate / 100);
      const gstAmount = chargeIncludingGst - baseAmount;

      totalBaseAmount += baseAmount;

      if (!gstSummary[gstRate]) {
        gstSummary[gstRate] = { value: 0, amount: 0 };
      }
      gstSummary[gstRate].value += baseAmount;
      gstSummary[gstRate].amount += gstAmount;
    }

    // Calculate total GST
    let totalGst = 0;
    Object.keys(gstSummary).forEach(rate => {
      totalGst += gstSummary[rate].amount;
    });

    const grossAmount = totalBaseAmount; // Base amount without GST
    const total = grossAmount + totalGst; // Should equal totalIncludingGst
    const roundOff = Math.round(total) - total;
    const totalPayable = Math.round(total);

    return {
      subtotal: totalBaseAmount,
      gstSummary,
      totalGst,
      grossAmount,
      roundOff,
      totalPayable
    };
  };

  const totals = calculateTotals();

  // Convert number to words
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    };

    if (num < 1000) return convertLessThanThousand(num);
    if (num < 100000) return convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convertLessThanThousand(num % 1000) : '');
    if (num < 10000000) return convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
    return convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
  };

  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold mb-2">{companyInfo.name}</h1>
        <p className="text-sm">{companyInfo.address}</p>
        <p className="text-sm">{companyInfo.city}-{companyInfo.pincode}, {companyInfo.state}</p>
        <h2 className="text-xl font-bold mt-2">Tax Invoice</h2>
      </div>

      {/* Company Details */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-100 p-2 border-b border-black">
          <div className="flex justify-between text-xs">
            <span><strong>GSTIN NO.:</strong> {companyInfo.gstin}</span>
            <span className="font-bold">Original Copy</span>
          </div>
        </div>

        {/* Buyer and Shipping Details */}
        <div className="grid grid-cols-3 border-b border-black">
          <div className="p-3 border-r border-black">
            <h3 className="font-bold text-sm mb-2">Details of Buyer</h3>
            <p className="text-xs"><strong>Name:</strong> {orderData.buyer.name}</p>
            <p className="text-xs"><strong>Address:</strong> {orderData.buyer.address}</p>
            <p className="text-xs">{orderData.buyer.city}</p>
            <p className="text-xs">{orderData.buyer.state}-{orderData.buyer.pincode}</p>
            <p className="text-xs mt-2"><strong>State:</strong> {orderData.buyer.state} <strong>State Code:</strong> {orderData.buyer.stateCode}</p>
            <p className="text-xs"><strong>Phone:</strong> {orderData.buyer.phone}</p>
            <p className="text-xs"><strong>Email:</strong> {orderData.buyer.email}</p>
            <p className="text-xs"><strong>GSTN No. / PAN No.:</strong> {orderData.buyer.gstin || 'N/A'}</p>
            <p className="text-xs"><strong>Buyer No.:</strong> {orderData.buyer.buyerNo}</p>
          </div>

          <div className="p-3 border-r border-black">
            <h3 className="font-bold text-sm mb-2">Details of Shipping</h3>
            <p className="text-xs">{orderData.shipping.name}</p>
            <p className="text-xs">{orderData.shipping.address}</p>
            <p className="text-xs">{orderData.shipping.city}</p>
            <p className="text-xs">{orderData.shipping.state}-{orderData.shipping.pincode}</p>
            <p className="text-xs mt-2"><strong>State:</strong> {orderData.shipping.state} <strong>State Code:</strong> {orderData.shipping.stateCode}</p>
          </div>

          <div className="p-3">
            <p className="text-xs mb-1"><strong>Sale No.:</strong> {orderData.saleNo}</p>
            <p className="text-xs mb-1"><strong>Date:</strong> {orderData.date}</p>
            <p className="text-xs mb-1"><strong>Transport Mode:</strong> {orderData.transportMode || 'N/A'}</p>
            <p className="text-xs mb-1"><strong>Date of Supply:</strong> {orderData.dateOfSupply || orderData.date}</p>
            <p className="text-xs mb-1"><strong>Place of Supply:</strong> {orderData.placeOfSupply}</p>
            <p className="text-xs mb-1"><strong>Vehicle No.:</strong> {orderData.vehicleNo || 'N/A'}</p>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-xs">
          <thead className="bg-gray-100">
            <tr className="border-b border-black">
              <th className="p-2 text-left border-r border-black">Lot#</th>
              <th className="p-2 text-left border-r border-black">Description (As Per Delivery Note)</th>
              <th className="p-2 text-left border-r border-black">HSN Code</th>
              <th className="p-2 text-right border-r border-black">IGST %</th>
              <th className="p-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items.map((item, index) => {
              const priceIncludingGst = item.price * item.quantity;
              const gstRate = item.gst || 0;
              const baseAmount = priceIncludingGst / (1 + gstRate / 100);
              return (
                <tr key={index} className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300">{item.lotNo}</td>
                  <td className="p-2 border-r border-gray-300">{item.description}</td>
                  <td className="p-2 border-r border-gray-300">{item.hsnCode}</td>
                  <td className="p-2 text-right border-r border-gray-300">{gstRate}.00</td>
                  <td className="p-2 text-right">{baseAmount.toFixed(2)}</td>
                </tr>
              );
            })}
            {orderData.packingCharges && (() => {
              const chargeIncludingGst = orderData.packingCharges.amount;
              const gstRate = orderData.packingCharges.gst || 18;
              const baseAmount = chargeIncludingGst / (1 + gstRate / 100);
              return (
                <tr className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300"></td>
                  <td className="p-2 border-r border-gray-300">Packing & Forwarding Charges</td>
                  <td className="p-2 border-r border-gray-300">{orderData.packingCharges.hsnCode || '99854'}</td>
                  <td className="p-2 text-right border-r border-gray-300">{gstRate}.00</td>
                  <td className="p-2 text-right">{baseAmount.toFixed(2)}</td>
                </tr>
              );
            })()}
            {orderData.insuranceCharges && (() => {
              const chargeIncludingGst = orderData.insuranceCharges.amount;
              const gstRate = orderData.insuranceCharges.gst || 18;
              const baseAmount = chargeIncludingGst / (1 + gstRate / 100);
              return (
                <tr className="border-b border-gray-300">
                  <td className="p-2 border-r border-gray-300"></td>
                  <td className="p-2 border-r border-gray-300">Specific Insurance Coverage Charges</td>
                  <td className="p-2 border-r border-gray-300">{orderData.insuranceCharges.hsnCode || '99681'}</td>
                  <td className="p-2 text-right border-r border-gray-300">{gstRate}.00</td>
                  <td className="p-2 text-right">{baseAmount.toFixed(2)}</td>
                </tr>
              );
            })()}
          </tbody>
        </table>

        {/* GST Summary and Totals */}
        <div className="grid grid-cols-2 border-t-2 border-black">
          <div className="p-3 border-r border-black">
            <h3 className="font-bold text-sm mb-2">Goods and Service Tax Summary</h3>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-300">
                  <th className="text-left py-1">IGST %</th>
                  <th className="text-right py-1">Value</th>
                  <th className="text-right py-1">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(totals.gstSummary).map(rate => (
                  <tr key={rate} className="border-b border-gray-200">
                    <td className="py-1">{rate}.00</td>
                    <td className="text-right py-1">{totals.gstSummary[rate].value.toFixed(2)}</td>
                    <td className="text-right py-1">{totals.gstSummary[rate].amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold border-t border-black">
                  <td className="py-1">Total</td>
                  <td className="text-right py-1">{totals.grossAmount.toFixed(2)}</td>
                  <td className="text-right py-1">{totals.totalGst.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-3">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="py-1">Gross Amount</td>
                  <td className="text-right py-1">{totals.grossAmount.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1">IGST</td>
                  <td className="text-right py-1">{totals.totalGst.toFixed(2)}</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="py-1">Round off</td>
                  <td className="text-right py-1">{totals.roundOff.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="p-3 border-t border-black">
          <p className="text-xs"><strong>Amount In Words</strong></p>
          <p className="text-sm font-bold">Rs. {numberToWords(totals.totalPayable)} Only</p>
        </div>

        {/* Total Payable */}
        <div className="p-3 bg-gray-100 border-t-2 border-black">
          <p className="text-lg font-bold text-center">Total Payable (₹): {totals.totalPayable.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="mb-4 text-xs p-3 border border-black">
        <p className="font-bold mb-2">Bank Transfer To: {companyInfo.name}</p>
        {companyInfo.bankAccounts.map((bank, index) => (
          <p key={index} className="mb-1">
            <strong>{bank.bankName}</strong>, {bank.branch} <strong>A/C NO:</strong> {bank.accountNo} <strong>RTGS/NEFT CODE:</strong> {bank.ifsc}
          </p>
        ))}
        <p className="mt-2"><strong>GST NO:</strong> {companyInfo.gstin}</p>
      </div>

      {/* Notes */}
      <div className="mb-4 text-xs p-3 border border-black">
        <p className="mb-2"><strong>Note:</strong> {companyInfo.deliveryNote}</p>
        <p className="mb-2">{companyInfo.exportNote}</p>
      </div>

      {/* GST Declaration and Signature */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-xs p-3 border border-black">
          <p className="italic">{companyInfo.gstDeclaration}</p>
        </div>
        <div className="text-xs p-3 border border-black">
          <p className="text-right mb-8">For, {companyInfo.name.toUpperCase()}</p>
          <p className="text-right font-bold">Authorised Signatory</p>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs mt-4 font-bold">Subject To {companyInfo.jurisdiction} Jurisdiction</p>
    </div>
  );
};

export default TaxInvoice;
