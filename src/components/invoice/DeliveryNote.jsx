import React from 'react';

const DeliveryNote = ({ orderData, companyInfo }) => {
  return (
    <div className="bg-white p-8 max-w-[210mm] mx-auto mt-8" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="text-center mb-4 border-b-2 border-black pb-2">
        <h1 className="text-2xl font-bold">Delivery Note</h1>
      </div>

      {/* Buyer Details */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-100 p-2 border-b border-black">
          <h3 className="font-bold text-sm">Details of Buyer</h3>
        </div>

        <div className="grid grid-cols-2 p-4">
          <div>
            <p className="text-xs mb-1"><strong>Name:</strong> {orderData.buyer.name}</p>
            <p className="text-xs mb-1"><strong>Address:</strong> {orderData.buyer.address}</p>
            <p className="text-xs mb-1">{orderData.buyer.city}</p>
            <p className="text-xs mb-1">{orderData.buyer.state}-{orderData.buyer.pincode}</p>
            <p className="text-xs mb-1"><strong>State:</strong> {orderData.buyer.state} <strong>State Code:</strong> {orderData.buyer.stateCode}</p>
            <p className="text-xs mb-1"><strong>Phone:</strong> {orderData.buyer.phone}</p>
            <p className="text-xs mb-1"><strong>Email:</strong> {orderData.buyer.email}</p>
            <p className="text-xs mb-1"><strong>GSTN No. / PAN No.:</strong> {orderData.buyer.gstin || 'N/A'}</p>
            <p className="text-xs mb-1"><strong>Buyer No.:</strong> {orderData.buyer.buyerNo}</p>
          </div>

          <div className="text-right">
            <p className="text-xs mb-1"><strong>Sale No.:</strong> {orderData.saleNo}</p>
            <p className="text-xs mb-1"><strong>Date:</strong> {orderData.date}</p>
            <p className="text-xs mb-1"><strong>Invoice No.:</strong> {orderData.invoiceNo}</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="border-2 border-black">
        <table className="w-full text-xs">
          <thead className="bg-gray-100">
            <tr className="border-b-2 border-black">
              <th className="p-3 text-left border-r border-black w-16">Lot#</th>
              <th className="p-3 text-left border-r border-black">Description (As Per Delivery Note)</th>
              <th className="p-3 text-center w-24">Quantity</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="p-3 border-r border-gray-300 align-top">{item.lotNo}</td>
                <td className="p-3 border-r border-gray-300">
                  <p className="leading-relaxed">{item.detailedDescription || item.description}</p>
                </td>
                <td className="p-3 text-center align-top">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Note */}
      <div className="mt-8 text-xs p-4 border border-black bg-gray-50">
        <p className="mb-2"><strong>Note:</strong></p>
        <p className="mb-2">{companyInfo.deliveryNote}</p>
        <p>{companyInfo.exportNote}</p>
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-8 mt-8">
        <div className="text-xs">
          <p className="mb-12">Received by:</p>
          <div className="border-t border-black pt-2">
            <p>Signature</p>
          </div>
        </div>
        <div className="text-xs text-right">
          <p className="mb-12">For, {companyInfo.name.toUpperCase()}</p>
          <div className="border-t border-black pt-2">
            <p className="font-bold">Authorised Signatory</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs mt-8 font-bold">Subject To {companyInfo.jurisdiction} Jurisdiction</p>
    </div>
  );
};

export default DeliveryNote;
