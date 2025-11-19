import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import TaxInvoice from '../../components/invoice/TaxInvoice';
import DeliveryNote from '../../components/invoice/DeliveryNote';
import { orderService } from '../../services';

const InvoicePreview = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const invoiceRef = useRef();
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch order data
  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);
        const response = await orderService.getOrderById(orderId);

        if (response && response.success) {
          const order = response.data;

          // Transform order data to invoice format
          const invoiceData = {
            saleNo: order.orderNumber || orderId.slice(-4),
            invoiceNo: `INV/${order.orderNumber}`,
            date: new Date(order.createdAt).toLocaleDateString('en-GB'),
            dateOfSupply: new Date(order.createdAt).toLocaleDateString('en-GB'),
            transportMode: order.shippingMethod || 'Road',
            placeOfSupply: order.shippingAddress?.state || 'India',
            vehicleNo: '',
            buyer: {
              name: order.user?.name || 'Customer',
              address: order.shippingAddress?.street || '',
              city: order.shippingAddress?.city || '',
              state: order.shippingAddress?.state || '',
              stateCode: order.shippingAddress?.stateCode || '24',
              pincode: order.shippingAddress?.zipCode || '',
              phone: order.user?.phone || '',
              email: order.user?.email || '',
              gstin: order.user?.gstin || '',
              buyerNo: order.user?._id?.slice(-6).toUpperCase() || 'CUST'
            },
            shipping: {
              name: order.user?.name || 'Customer',
              address: order.shippingAddress?.street || '',
              city: order.shippingAddress?.city || '',
              state: order.shippingAddress?.state || '',
              stateCode: order.shippingAddress?.stateCode || '24',
              pincode: order.shippingAddress?.zipCode || ''
            },
            items: order.orderItems?.map((item, index) => ({
              lotNo: (index + 1).toString(),
              description: item.name || 'Product',
              detailedDescription: item.description || item.name || 'Product',
              hsnCode: item.hsnCode || '97050090',
              gst: item.gst || 5,
              price: item.price || 0,
              quantity: item.quantity || 1
            })) || [],
            packingCharges: order.shippingPrice ? {
              amount: order.shippingPrice,
              gst: 18,
              hsnCode: '99854'
            } : null,
            insuranceCharges: null
          };

          setOrderData(invoiceData);
        } else {
          setError('Failed to fetch order data');
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  // Sample company info - Replace with actual from database/settings
  const companyInfo = {
    name: 'Chronicle Vaults',
    address: '16/189, Netajinagar, Meghaninagar',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380016',
    gstin: '24BCZPD7594Q1ZE',
    bankAccounts: [
      {
        bankName: 'Kotak Bank',
        branch: 'Kalbadevi Branch, Mumbai-400002',
        accountNo: '4711207468',
        ifsc: 'KKBK0000961'
      },
      {
        bankName: 'Bank of India',
        branch: 'Walkeshwar Branch, Mumbai-06',
        accountNo: '004720110000171',
        ifsc: 'BKID0000047'
      }
    ],
    deliveryNote: 'All items purchased by you, will be delivered at Chronicle Vaults registered office. If the buyer insists to have delivery within state/interstate, by post or private courier and insurance if any with prior intimation before the payment. It will be sent as per your request on your (buyer) risk.',
    exportNote: 'The items over 100 years old cannot be taken out of India without the permission of the Director General, Archaeological Survey of India, New Delhi-110011',
    gstDeclaration: '"I / We hereby certify that my / our registration certificate under the Goods and Services Tax Act, 2017 is in force on the date on which the sale of the goods specified in this tax invoice is made by me / us and that the transaction of sales of goods specified in this tax invoice has been effected by me / us and it shall be accounted for in the turnover of sales while filing of return and the due tax, if any payable on the sale has been paid or shall be paid".',
    jurisdiction: 'Mumbai'
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download functionality
    alert('PDF download functionality will be implemented');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !orderData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load invoice'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action Bar - Hide on print */}
      <div className="bg-white shadow-md p-4 sticky top-0 z-10 print:hidden">
        <div className="max-w-[210mm] mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Content */}
      <div ref={invoiceRef} className="py-8 print:py-0">
        <TaxInvoice orderData={orderData} companyInfo={companyInfo} />

        {/* Page Break */}
        <div className="page-break"></div>

        <DeliveryNote orderData={orderData} companyInfo={companyInfo} />
      </div>

      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .page-break {
            page-break-before: always;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoicePreview;
