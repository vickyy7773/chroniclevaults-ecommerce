import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Clock, Gavel, Users, TrendingUp, Eye, User, Package, X, FileText, ChevronUp, ChevronDown, BookOpen, Upload, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../utils/api';
import RichEditor from '../../components/common/RichEditor';
import LotAuctionManagement from './LotAuctionManagement';
import lotAuctionService from '../../services/lotAuctionService';

// ── Quick Create Modal for Lot+Live auctions from BulkLotUpload ──────────────
const QuickCreateLotLiveModal = ({ lots, onClose, onCreated }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', posterDisplayUntil: '', startTime: '', endTime: '' });
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title zaroori hai'); return; }
    if (!form.startTime) { toast.error('Live Bidding Start Time zaroori hai'); return; }
    setSaving(true);
    try {
      const processedLots = lots.map((lot, i) => ({
        lotNumber: lot.lotNumber || i + 1, title: lot.title || '',
        description: lot.description || '', image: lot.image || '',
        images: lot.images || (lot.image ? [lot.image] : []),
        startingPrice: Number(lot.startingPrice) || 0, reservePrice: Number(lot.reservePrice) || 0,
        estimatedPrice: lot.estimatedPrice ? Number(lot.estimatedPrice) : null,
        category: lot.category || 'Miscellaneous', material: lot.material || null, vendorId: lot.vendorId || null,
      }));
      await api.post('/auctions', {
        title: form.title, description: form.description || 'Lot+Live Auction',
        startingPrice: processedLots[0]?.startingPrice || 0,
        startTime: new Date(form.startTime).toISOString(),
        endTime: form.endTime ? new Date(form.endTime).toISOString() : null,
        posterDisplayUntil: form.posterDisplayUntil ? new Date(form.posterDisplayUntil).toISOString() : null,
        isLotBidding: true, catalogBiddingEnabled: true,
        lots: processedLots, totalLots: processedLots.length, lotNumber: 1,
      });
      toast.success(`Auction "${form.title}" created with ${processedLots.length} lots!`);
      onCreated(); onClose();
    } catch (err) { toast.error(err?.response?.data?.message || 'Failed to create auction'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Create Lot+Live Auction</h2>
            <p className="text-sm text-green-600 font-medium mt-0.5 flex items-center gap-1"><CheckCircle size={14} /> {lots.length} lots ready</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auction Title <span className="text-red-500">*</span></label>
            <input className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. E-Auction VI" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea rows={2} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poster Display Until</label>
            <input type="datetime-local" className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.posterDisplayUntil} onChange={e => set('posterDisplayUntil', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Live Bidding Start Time <span className="text-red-500">*</span></label>
              <input type="datetime-local" className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.startTime} onChange={e => set('startTime', e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
              <input type="datetime-local" className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.endTime} onChange={e => set('endTime', e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Creating...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Quick Create Modal for Lot Bidding auctions from BulkLotUpload ───────────
const QuickCreateLotBiddingModal = ({ lots, onClose, onCreated }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', externalPlatformName: '', externalPlatformLink: '', lotBiddingEndTime: '', posterDisplayUntil: '', image: ''
  });
  const [imageInputType, setImageInputType] = useState('file');
  const [imagePreview, setImagePreview] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsReadingFile(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      set('image', reader.result);
      setIsReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title zaroori hai'); return; }
    setSaving(true);
    try {
      let imageUrl = form.image;
      if (imageUrl && imageUrl.startsWith('data:image/')) {
        try {
          const res = await api.post('/upload/base64', { image: imageUrl });
          imageUrl = res.imageUrl;
        } catch { toast.error('Failed to upload image'); setSaving(false); return; }
      }
      const lotBiddingEndTime = form.lotBiddingEndTime
        ? new Date(form.lotBiddingEndTime).toISOString()
        : null;
      const posterDisplayUntil = form.posterDisplayUntil
        ? new Date(form.posterDisplayUntil).toISOString()
        : null;
      const created = await lotAuctionService.create({
        title: form.title,
        description: form.description,
        externalPlatformName: form.externalPlatformName,
        externalPlatformLink: form.externalPlatformLink,
        lotBiddingEndTime,
        posterDisplayUntil,
        image: imageUrl || undefined,
      });
      const newId = created?.data?._id || created?._id;
      if (newId) {
        let added = 0;
        for (const lot of lots) {
          try {
            await lotAuctionService.addLot(newId, {
              lotNumber: lot.lotNumber || (added + 1),
              title: lot.title || '',
              description: lot.description || '',
              images: lot.images && lot.images.length > 0 ? lot.images : (lot.image ? [lot.image] : []),
              startingPrice: lot.startingPrice ? Number(lot.startingPrice) : undefined,
              reservePrice: lot.reservePrice ? Number(lot.reservePrice) : undefined,
              estimatedPrice: lot.estimatedPrice ? Number(lot.estimatedPrice) : undefined,
              hsn: lot.hsn || '',
            });
            added++;
          } catch {}
        }
        toast.success(`Auction "${form.title}" created with ${added} lots!`);
      }
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create auction');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Create Lot Bidding Auction</h2>
            <p className="text-sm text-green-600 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle size={14} /> {lots.length} lots loaded from CSV
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title <span className="text-red-500">*</span></label>
            <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. E-Auction VI" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <RichEditor value={form.description} onChange={val => set('description', val)} placeholder="Optional" minHeight={80} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Auction Image (Optional)</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input type="radio" name="qcImgType" checked={imageInputType === 'file'} onChange={() => setImageInputType('file')} className="mr-2" />
                File Upload
              </label>
              <label className="flex items-center cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                <input type="radio" name="qcImgType" checked={imageInputType === 'url'} onChange={() => setImageInputType('url')} className="mr-2" />
                Image URL
              </label>
            </div>
            {imageInputType === 'file' ? (
              <>
                <input type="file" accept="image/*" onChange={handleImageChange} className={inputCls} />
                <p className="text-xs text-gray-500 mt-1">Upload an image file directly</p>
              </>
            ) : (
              <>
                <input type="text" className={inputCls} value={form.image} onChange={e => { set('image', e.target.value); setImagePreview(''); }} placeholder="https://..." />
                <p className="text-xs text-blue-600 mt-1">💡 Use Image Upload Manager to upload and paste URL here</p>
              </>
            )}
            {(imagePreview || (imageInputType === 'url' && form.image)) && (
              <div className="mt-2">
                <img src={imageInputType === 'file' ? imagePreview : form.image} alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border border-gray-300"
                  onError={e => { e.target.style.display = 'none'; }} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">External Platform Name</label>
              <input className={inputCls} value={form.externalPlatformName} onChange={e => set('externalPlatformName', e.target.value)} placeholder="e.g. AstaGuru" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">External Platform Link</label>
              <input type="text" className={inputCls} value={form.externalPlatformLink} onChange={e => set('externalPlatformLink', e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poster Display Until (optional)</label>
            <input type="datetime-local" className={inputCls} value={form.posterDisplayUntil} onChange={e => set('posterDisplayUntil', e.target.value)} />
            <p className="text-xs text-gray-500 mt-1">Until this time, users see only the poster — bidding is not accessible</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lot Bidding End Time</label>
            <input type="datetime-local" className={inputCls} value={form.lotBiddingEndTime} onChange={e => set('lotBiddingEndTime', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving || isReadingFile} className="px-5 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60">
              {saving ? 'Creating...' : isReadingFile ? 'Loading image...' : 'Create Auction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AuctionManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [quickCreateLots, setQuickCreateLots] = useState(null); // Lot+Live lots from BulkLotUpload
  const [quickCreateLotBiddingLots, setQuickCreateLotBiddingLots] = useState(null); // Lot Bidding lots from BulkLotUpload
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [mainTab, setMainTab] = useState(
    searchParams.get('tab') === 'lotBidding' ? 'lotBidding' : 'liveAuctions'
  );
  const [viewMode, setViewMode] = useState('all'); // all, active, upcoming, ended
  const [formData, setFormData] = useState({
    productId: '',
    title: '',
    description: '',
    image: '',
    highlightImage: '',
    startingPrice: '',
    reservePrice: '',
    posterDisplayUntil: '',
    startTime: '',
    endTime: '',
    isLotBidding: false,
    catalogBiddingEnabled: false,
    totalLots: 1,
    lotDuration: 10,
    lots: [],
    catalogPdf: '',
    shortCode: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState('');
  const [imageInputType, setImageInputType] = useState('file'); // 'file' or 'url'
  const [highlightImageFile, setHighlightImageFile] = useState(null);
  const [highlightImagePreview, setHighlightImagePreview] = useState('');
  const [highlightImageInputType, setHighlightImageInputType] = useState('url'); // 'file' or 'url'
  const [customers, setCustomers] = useState([]);
  const [lotMoveInputs, setLotMoveInputs] = useState({});
  const lastLotRef = useRef(null);


  useEffect(() => {
    fetchAuctions();
  }, [viewMode]);

  // Check for pre-filled lots from Bulk Upload (only for Lot+Live type, not Lot Bidding Only)
  useEffect(() => {
    const savedLots = localStorage.getItem('newAuctionLots');
    if (savedLots) {
      try {
        const { lots, timestamp } = JSON.parse(savedLots);
        const age = Date.now() - new Date(timestamp).getTime();
        if (age < 10 * 60 * 1000 && Array.isArray(lots) && lots.length > 0) {
          if (mainTab === 'lotBidding') {
            // Lot Bidding → simple quick create modal
            setQuickCreateLotBiddingLots(lots);
          } else {
            // Lot+Live → simple quick create modal
            setQuickCreateLots(lots);
          }
        }
        localStorage.removeItem('newAuctionLots');
      } catch {
        localStorage.removeItem('newAuctionLots');
      }
    }
  }, [mainTab]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data || []);
    } catch (error) {
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/users');
      setCustomers(response.data || []);
    } catch (error) {
    }
  };

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const queryParam = viewMode !== 'all' ? `?status=${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}` : '';
      const response = await api.get(`/auctions${queryParam}`);
      setAuctions(response.data || []);
    } catch (error) {
      toast.error('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Auto-enable Going Going Gone timer when lot bidding is enabled
    if (name === 'isLotBidding' && checked) {
      setFormData(prev => ({
        ...prev,
        [name]: checked,
        isGoingGoingGoneEnabled: true // Automatically enable timer for lot bidding
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleLotChange = (index, field, value) => {
    setFormData(prev => {
      const updatedLots = [...prev.lots];
      updatedLots[index] = { ...updatedLots[index], [field]: value };
      return { ...prev, lots: updatedLots };
    });
  };

  // Update multiple lot fields atomically (avoids race condition with consecutive handleLotChange calls)
  const handleLotChangeMulti = (index, updates) => {
    setFormData(prev => {
      const updatedLots = [...prev.lots];
      updatedLots[index] = { ...updatedLots[index], ...updates };
      return { ...prev, lots: updatedLots };
    });
  };

  const addLot = () => {
    setFormData(prev => ({
      ...prev,
      lots: [
        ...prev.lots,
        {
          lotNumber: prev.lots.length + 1,
          title: '',
          description: '',
          category: 'Miscellaneous',
          material: '',
          productId: '',
          image: '',
          images: [],
          vendorId: '',
          startingPrice: '',
          estimatedPriceMin: '',
          estimatedPrice: '',
          reservePrice: '',
          status: 'Upcoming',
          _uid: Math.random().toString(36).slice(2)
        }
      ]
    }));
    setTimeout(() => {
      lastLotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    toast.success('New lot added at the bottom!', { autoClose: 2000 });
  };

  const moveLotUp = (index) => {
    if (index === 0) return;
    setFormData(prev => {
      const lots = [...prev.lots];
      [lots[index - 1], lots[index]] = [lots[index], lots[index - 1]];
      return { ...prev, lots: lots.map((l, i) => ({ ...l, lotNumber: i + 1 })) };
    });
  };

  const moveLotDown = (index) => {
    setFormData(prev => {
      if (index === prev.lots.length - 1) return prev;
      const lots = [...prev.lots];
      [lots[index], lots[index + 1]] = [lots[index + 1], lots[index]];
      return { ...prev, lots: lots.map((l, i) => ({ ...l, lotNumber: i + 1 })) };
    });
  };

  const moveLotToPosition = (fromIndex, toPosition) => {
    const to = parseInt(toPosition, 10) - 1; // convert to 0-based
    setFormData(prev => {
      const total = prev.lots.length;
      if (isNaN(to) || to < 0 || to >= total || to === fromIndex) return prev;
      const lots = [...prev.lots];
      const [moved] = lots.splice(fromIndex, 1);
      lots.splice(to, 0, moved);
      return { ...prev, lots: lots.map((l, i) => ({ ...l, lotNumber: i + 1 })) };
    });
  };

  const removeLot = (index) => {
    const updatedLots = formData.lots.filter((_, i) => i !== index);
    // Renumber lots
    const renumberedLots = updatedLots.map((lot, i) => ({
      ...lot,
      lotNumber: i + 1
    }));
    setFormData(prev => ({
      ...prev,
      lots: renumberedLots
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          image: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHighlightImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHighlightImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setHighlightImagePreview(reader.result);
        setFormData(prev => ({
          ...prev,
          highlightImage: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { toast.error('Please select a PDF file'); return; }
    setUploadingPdf(true);
    setPdfUploadProgress(0);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('pdf', file);
      const res = await api.post('/upload/pdf', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setPdfUploadProgress(pct);
          }
        }
      });
      setFormData(prev => ({ ...prev, catalogPdf: res.pdfUrl }));
      toast.success('Catalog PDF uploaded successfully');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to upload PDF';
      toast.error(msg);
    } finally {
      setUploadingPdf(false);
      setPdfUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let submitData = { ...formData };
      if (!submitData.shortCode) submitData.shortCode = null;
      if (submitData.shortCode) submitData.shortCode = submitData.shortCode.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Convert datetime-local values to ISO strings
      if (submitData.posterDisplayUntil) {
        submitData.posterDisplayUntil = new Date(submitData.posterDisplayUntil).toISOString();
      }
      if (submitData.startTime) {
        submitData.startTime = new Date(submitData.startTime).toISOString();
      }
      if (submitData.endTime) {
        submitData.endTime = new Date(submitData.endTime).toISOString();
      }

      // If image is base64, upload it first
      if (formData.image && formData.image.startsWith('data:image/')) {
        try {
          const uploadResponse = await api.post('/upload/base64', { image: formData.image });
          submitData.image = uploadResponse.imageUrl;
        } catch (uploadError) {
          toast.error('Failed to upload image');
          return;
        }
      }

      // If highlight image is base64, upload it first
      if (formData.highlightImage && formData.highlightImage.startsWith('data:image/')) {
        try {
          const uploadResponse = await api.post('/upload/base64', { image: formData.highlightImage });
          submitData.highlightImage = uploadResponse.imageUrl;
        } catch (uploadError) {
          toast.error('Failed to upload highlight image');
          return;
        }
      }

      // If lot bidding, process lots data
      if (submitData.isLotBidding) {
        submitData.totalLots = submitData.lots.length;
        submitData.lotNumber = 1; // Start with first lot

        // Process each lot
        const processedLots = await Promise.all(submitData.lots.map(async (lot) => {
          let lotData = { ...lot };

          // If lot has product, get product details
          if (lot.productId) {
            const product = products.find(p => p._id === lot.productId);
            if (product) {
              lotData.image = lotData.image || product.images[0];
              lotData.description = lotData.description || product.description;
            }
          }

          // Upload lot images (images array) if any are base64
          if (lotData.images && lotData.images.length > 0) {
            const uploadedImages = await Promise.all(lotData.images.map(async (img) => {
              if (img && img.startsWith('data:image/')) {
                try {
                  const uploadResponse = await api.post('/upload/base64', { image: img });
                  return uploadResponse.imageUrl;
                } catch (err) {
                  return img;
                }
              }
              return img;
            }));
            lotData.images = uploadedImages;
            // Keep lot.image in sync with first image
            lotData.image = uploadedImages[0] || lotData.image;
          } else if (lotData.image && lotData.image.startsWith('data:image/')) {
            // Fallback: upload single image if images array is empty
            try {
              const uploadResponse = await api.post('/upload/base64', { image: lotData.image });
              lotData.image = uploadResponse.imageUrl;
              lotData.images = [lotData.image];
            } catch (error) {
            }
          }

          // When editing, preserve existing bids and currentBid; when creating, start fresh
          const isEditing = Boolean(selectedAuction);
          const sanitizeBids = (bids) => (bids || []).map(bid => ({
            ...bid,
            user: bid.user && typeof bid.user === 'object' ? (bid.user._id || bid.user) : bid.user
          }));

          return {
            ...lotData,
            currentBid: isEditing
              ? (lotData.currentBid ?? lotData.startingPrice)
              : lotData.startingPrice,
            bids: isEditing ? sanitizeBids(lotData.bids) : []
          };
        }));

        submitData.lots = processedLots;
        // Set main auction fields from first lot (only when creating, not editing)
        if (!selectedAuction && processedLots.length > 0) {
          submitData.startingPrice = processedLots[0].startingPrice;
          submitData.currentBid = processedLots[0].startingPrice;
        }
      }

      if (selectedAuction) {
        await api.put(`/auctions/${selectedAuction._id}`, submitData);
        toast.success('Auction updated successfully');
      } else {
        await api.post('/auctions', submitData);
        toast.success('Auction created successfully');
      }

      setShowModal(false);
      resetForm();
      fetchAuctions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save auction');
    }
  };

  const handleEdit = (auction) => {
    if (!customers.length) fetchCustomers();
    if (!products.length) fetchProducts();
    setSelectedAuction(auction);

    const startTimeIST = new Date(auction.startTime);
    const endTimeIST = auction.endTime ? new Date(auction.endTime) : null;

    const formatDateTimeLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Ensure all lots have a category field and stable _uid for React key
    const lotsWithCategory = (auction.lots || []).map(lot => ({
      ...lot,
      category: lot.category || 'Miscellaneous',
      _uid: lot._uid || lot._id?.toString() || Math.random().toString(36).slice(2)
    }));

    const posterDisplayUntilIST = auction.posterDisplayUntil ? new Date(auction.posterDisplayUntil) : null;

    setFormData({
      productId: auction.product?._id || '',
      title: auction.title,
      description: auction.description,
      image: auction.image,
      highlightImage: auction.highlightImage || '',
      startingPrice: auction.startingPrice,
      reservePrice: auction.reservePrice || '',
      posterDisplayUntil: posterDisplayUntilIST ? formatDateTimeLocal(posterDisplayUntilIST) : '',
      startTime: formatDateTimeLocal(startTimeIST),
      endTime: endTimeIST ? formatDateTimeLocal(endTimeIST) : '',
      isLotBidding: auction.isLotBidding || false,
      totalLots: auction.totalLots || 1,
      lotDuration: auction.lotDuration || 10,
      lots: lotsWithCategory,
      catalogPdf: auction.catalogPdf || '',
      shortCode: auction.shortCode || ''
    });
    setImagePreview(auction.image);
    setHighlightImagePreview(auction.highlightImage || '');
    setShowModal(true);
  };

  const handleDelete = async (auctionId) => {
    if (!window.confirm('Are you sure you want to delete this auction?')) {
      return;
    }

    try {
      await api.delete(`/auctions/${auctionId}`);
      toast.success('Auction deleted successfully');
      fetchAuctions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete auction');
    }
  };

  const resetForm = () => {
    setFormData({
      productId: '',
      title: '',
      description: '',
      image: '',
      highlightImage: '',
      startingPrice: '',
      reservePrice: '',
      reserveBidder: '',
      posterDisplayUntil: '',
      startTime: '',
      endTime: '',
      isLotBidding: false,
      totalLots: 1,
      lotDuration: 10,
      lots: [],
      catalogPdf: '',
      shortCode: ''
    });
    setImageFile(null);
    setImagePreview('');
    setHighlightImageFile(null);
    setHighlightImagePreview('');
    setHighlightImageInputType('file');
    setSelectedAuction(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Ended':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Auction Management</h1>
          <p className="text-gray-600 mt-1">Manage live auctions and lot bidding</p>
        </div>
        {mainTab === 'liveAuctions' && (
          <button
            onClick={() => {
              resetForm();
              if (!customers.length) fetchCustomers();
              if (!products.length) fetchProducts();
              setShowModal(true);
            }}
            className="flex items-center space-x-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Auction</span>
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex space-x-1 mb-6 border-b border-gray-200">
        <button
          onClick={() => setMainTab('liveAuctions')}
          className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
            mainTab === 'liveAuctions'
              ? 'border-accent-600 text-accent-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Gavel className="w-4 h-4" />
            Live Auctions
          </span>
        </button>
        <button
          onClick={() => setMainTab('lotBidding')}
          className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
            mainTab === 'lotBidding'
              ? 'border-orange-500 text-orange-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Lot Bidding
          </span>
        </button>
      </div>

      {/* Lot Bidding Tab */}
      {mainTab === 'lotBidding' && <LotAuctionManagement embedded />}

      {/* Quick Create — Lot+Live from BulkLotUpload */}
      {quickCreateLots && (
        <QuickCreateLotLiveModal
          lots={quickCreateLots}
          onClose={() => setQuickCreateLots(null)}
          onCreated={() => { setQuickCreateLots(null); fetchAuctions(); }}
        />
      )}

      {/* Quick Create — Lot Bidding from BulkLotUpload */}
      {quickCreateLotBiddingLots && (
        <QuickCreateLotBiddingModal
          lots={quickCreateLotBiddingLots}
          onClose={() => setQuickCreateLotBiddingLots(null)}
          onCreated={() => setQuickCreateLotBiddingLots(null)}
        />
      )}

      {/* Live Auctions Tab — View Filters */}
      {mainTab === 'liveAuctions' && (
      <div className="flex space-x-2 mb-6">
        {['all', 'active', 'upcoming', 'ended'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === mode
                ? 'bg-accent-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>
      )}

      {/* Auctions Grid — only in Live Auctions tab */}
      {mainTab === 'liveAuctions' && (loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-600"></div>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Gavel className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No auctions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map((auction) => (
            <div key={auction._id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Auction Images */}
              {auction.highlightImage ? (
                <div className="flex flex-col">
                  {/* Catalog Banner - top */}
                  <div className="relative w-full overflow-hidden" style={{ height: '260px' }}>
                    <img
                      src={auction.highlightImage}
                      alt="Catalog Banner"
                      className="w-full h-full object-contain bg-white"
                    />
                    <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(auction.status)}`}>
                      {auction.status}
                    </div>
                    {auction.isLotBidding && (
                      <div className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold border bg-purple-100 text-purple-800 border-purple-300">
                        {auction.totalLots} Lots
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2 py-1">
                      <span className="text-white text-xs font-medium">📌 Catalog Banner</span>
                    </div>
                  </div>
                  {/* Auction Poster - bottom strip */}
                  <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-t border-gray-200" style={{ height: '72px' }}>
                    {auction.image ? (
                      <img
                        src={auction.image}
                        alt={auction.title}
                        className="h-12 w-16 object-cover rounded shadow-sm border border-gray-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-16 flex items-center justify-center bg-gray-200 rounded flex-shrink-0">
                        <Gavel className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="text-xs text-gray-500 leading-snug">
                      <p className="font-semibold text-gray-700">Auction Poster</p>
                      <p className="text-gray-400">Used inside auction page</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-48 bg-gray-200">
                  {auction.image ? (
                    <img
                      src={auction.image}
                      alt={auction.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gavel className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(auction.status)}`}>
                    {auction.status}
                  </div>
                  {auction.isLotBidding && (
                    <div className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold border bg-purple-100 text-purple-800 border-purple-300">
                      {auction.totalLots} Lots
                    </div>
                  )}
                </div>
              )}

              {/* Auction Details */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{auction.title}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{auction.description}</p>

                <div className="space-y-2 mb-4">
                  {auction.reservePrice && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Reserve Price:</span>
                      <span className="font-semibold text-orange-600">₹{auction.reservePrice?.toLocaleString()}</span>
                    </div>
                  )}
                  {auction.isLotBidding && auction.lots && auction.lots.length > 0 && (
                    <div className="flex items-start justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Vendors:</span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[60%]">
                        {Array.from(new Set(auction.lots.map(lot => lot.vendorId).filter(Boolean))).length > 0 ? (
                          Array.from(new Set(auction.lots.map(lot => lot.vendorId).filter(Boolean))).map((vendorId, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 rounded-md text-xs font-semibold">
                              {vendorId}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500 italic">No vendors</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-3 mb-3">
                  <div className="flex items-center text-xs text-gray-600 mb-1">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>Start: {formatDate(auction.startTime)}</span>
                  </div>
                  {auction.endTime && (
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>End: {formatDate(auction.endTime)}</span>
                    </div>
                  )}
                  {!auction.endTime && auction.isLotBidding && (
                    <div className="flex items-center text-xs text-green-600">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>Ends via Going Gone timer</span>
                    </div>
                  )}
                </div>

                {auction.winner && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                    <p className="text-xs text-green-800 font-semibold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Winner: {auction.winner.name}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(auction)}
                      className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(auction._id)}
                      className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Migrate to Lot Auction */}
                  <button
                    onClick={async () => {
                      if (!window.confirm(`"${auction.title}" ko Lot Bidding system mein migrate karein?`)) return;
                      try {
                        const res = await api.post(`/lot-auction/migrate/${auction._id}`);
                        if (res?.success) {
                          const newId = res.data?._id;
                          toast.success(res.alreadyMigrated ? 'Already migrated!' : `Migration complete! ${res.data?.lotsCount} lots migrated.`);
                          if (newId) navigate(`/admin/lot-auctions/${newId}`);
                        }
                      } catch (err) { toast.error(err?.response?.data?.message || 'Migration failed'); }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-semibold"
                  >
                    <Package className="w-4 h-4" /> Migrate → Lot Bidding
                  </button>

                  {/* Buttons for ended lot bidding auctions */}
                  {auction.isLotBidding && auction.status === 'Ended' && (
                    <div className="flex flex-col gap-2">
                      {/* Publish / Unpublish toggle */}
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.patch(`/auctions/${auction._id}/toggle-ended-public`);
                            if (res?.success) {
                              setAuctions(prev => prev.map(a =>
                                a._id === auction._id ? { ...a, isEndedPublic: res.isEndedPublic } : a
                              ));
                              toast.success(res.isEndedPublic ? 'Auction published on public page!' : 'Auction hidden from public page!');
                            }
                          } catch { toast.error('Failed to update visibility'); }
                        }}
                        className={`w-full flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                          auction.isEndedPublic
                            ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-800 text-white'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>{auction.isEndedPublic ? 'Public: Visible — Click to Hide' : 'Public: Hidden — Click to Publish'}</span>
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/auction-lots/${auction._id}`)}
                          className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>View Catalog</span>
                        </button>
                        <button
                          onClick={() => navigate(`/admin/auction-invoices?auction=${auction._id}`)}
                          className="flex-1 flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View Invoices</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {selectedAuction ? 'Edit Auction' : 'Create New Auction'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Lot Bidding Toggle */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isLotBidding"
                        checked={formData.isLotBidding}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <div>
                        <span className="text-sm font-bold text-purple-900">Enable Lot Bidding</span>
                        <p className="text-xs text-purple-700">Create multiple lots that auction sequentially</p>
                      </div>
                    </label>
                  </div>

                  {/* Regular Auction Fields */}
                  {!formData.isLotBidding && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product (Optional)
                        </label>
                        <select
                          name="productId"
                          value={formData.productId}
                          onChange={handleInputChange}
                          className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        >
                          <option value="">No Product (Standalone Auction)</option>
                          {products.map(product => (
                            <option key={product._id} value={product._id}>
                              {product.name} - ₹{product.price.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text" 
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          placeholder="Auction title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <RichEditor
                          value={formData.description}
                          onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                          placeholder="Auction description"
                          minHeight={90}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auction Image
                        </label>

                        {/* Image Input Type Selector */}
                        <div className="flex gap-4 mb-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="imageInputType"
                              checked={imageInputType === 'file'}
                              onChange={() => setImageInputType('file')}
                              className="mr-2"
                            />
                            <span className="text-sm">File Upload</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="imageInputType"
                              checked={imageInputType === 'url'}
                              onChange={() => setImageInputType('url')}
                              className="mr-2"
                            />
                            <span className="text-sm">Image URL</span>
                          </label>
                        </div>

                        {/* Conditional Input Based on Selection */}
                        {imageInputType === 'file' ? (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload an image file directly</p>
                          </>
                        ) : (
                          <>
                            <input
                              type="text" 
                              name="image"
                              value={formData.image || ''}
                              onChange={handleInputChange}
                              className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                              placeholder="https://chroniclevaults.com/api/uploads/img-123456.jpg"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              💡 Use Image Upload Manager to upload images and paste URL here
                            </p>
                          </>
                        )}

                        {/* Image Preview */}
                        {(imagePreview || (imageInputType === 'url' && formData.image)) && (
                          <div className="mt-2">
                            <img
                              src={imageInputType === 'file' ? imagePreview : formData.image}
                              alt="Preview"
                              className="w-full h-48 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Highlight Image (for Live Auction) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auction Highlight Image (Live Auction Banner)
                        </label>

                        {/* Image Input Type Selector */}
                        <div className="flex gap-4 mb-2">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="highlightImageInputType"
                              checked={highlightImageInputType === 'file'}
                              onChange={() => setHighlightImageInputType('file')}
                              className="mr-2"
                            />
                            <span className="text-sm">File Upload</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="highlightImageInputType"
                              checked={highlightImageInputType === 'url'}
                              onChange={() => setHighlightImageInputType('url')}
                              className="mr-2"
                            />
                            <span className="text-sm">Image URL</span>
                          </label>
                        </div>

                        {/* Conditional Input Based on Selection */}
                        {highlightImageInputType === 'file' ? (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleHighlightImageChange}
                              className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Upload a banner image for live auction highlights section</p>
                          </>
                        ) : (
                          <>
                            <input
                              type="text"
                              name="highlightImage"
                              value={formData.highlightImage || ''}
                              onChange={handleInputChange}
                              className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                              placeholder="https://chroniclevaults.com/api/uploads/highlight-img-123456.jpg"
                            />
                            <p className="text-xs text-blue-600 mt-1">
                              💡 Use Image Upload Manager to upload images and paste URL here
                            </p>
                          </>
                        )}

                        {/* Image Preview */}
                        {(highlightImagePreview || (highlightImageInputType === 'url' && formData.highlightImage)) && (
                          <div className="mt-2">
                            <img
                              src={highlightImageInputType === 'file' ? highlightImagePreview : formData.highlightImage}
                              alt="Highlight Preview"
                              className="w-full h-48 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Starting Price (₹)
                          </label>
                          <input
                            type="number" 
                            name="startingPrice"
                            value={formData.startingPrice}
                            onChange={handleInputChange}
                            required
                            min="0"
                            step="50"
                            className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reserve Price (₹)
                          </label>
                          <input
                            type="number" 
                            name="reservePrice"
                            value={formData.reservePrice}
                            onChange={handleInputChange}
                            min="0"
                            step="50"
                            className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Lot Bidding Fields */}
                  {formData.isLotBidding && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auction Title
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          required
                          className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          placeholder="Overall auction title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Auction Description
                        </label>
                        <RichEditor
                          value={formData.description}
                          onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                          placeholder="Overall auction description"
                          minHeight={70}
                        />
                      </div>

                      {/* Highlight Image (for Catalog Page Banner) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Auction Highlight Image (Catalog Page Banner)
                        </label>

                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHighlightImageChange}
                          className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Upload a banner image for catalog page highlights section</p>

                        {/* Image Preview */}
                        {highlightImagePreview && (
                          <div className="mt-2">
                            <img
                              src={highlightImagePreview}
                              alt="Highlight Preview"
                              className="w-full h-48 object-cover rounded-lg border border-gray-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EInvalid Image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Lots Management */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <Package className="w-5 h-5 mr-2 text-purple-600" />
                            Lots ({formData.lots.length})
                          </h3>
                          <button
                            type="button"
                            onClick={addLot}
                            className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Lot</span>
                          </button>
                        </div>

                        {formData.lots.length === 0 && (
                          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <Package className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-600 dark:text-gray-400">No lots added yet</p>
                            <button
                              type="button"
                              onClick={addLot}
                              className="mt-2 text-purple-600 hover:text-purple-700 font-medium"
                            >
                              Add your first lot
                            </button>
                          </div>
                        )}

                        <div className="space-y-4">
                          {formData.lots.map((lot, index) => (
                            <div key={lot._uid || index} ref={index === formData.lots.length - 1 ? lastLotRef : null} className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-purple-900">Lot {index + 1}</h4>
                                <div className="flex items-center gap-2">
                                  {/* Up / Down */}
                                  <button
                                    type="button"
                                    onClick={() => moveLotUp(index)}
                                    disabled={index === 0}
                                    title="Move up"
                                    className="p-1 rounded bg-purple-100 hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <ChevronUp className="w-4 h-4 text-purple-700" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveLotDown(index)}
                                    disabled={index === formData.lots.length - 1}
                                    title="Move down"
                                    className="p-1 rounded bg-purple-100 hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <ChevronDown className="w-4 h-4 text-purple-700" />
                                  </button>
                                  {/* Jump to position */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-purple-600 font-semibold">→</span>
                                    <input
                                      type="number"
                                      min="1"
                                      max={formData.lots.length}
                                      value={lotMoveInputs[index] ?? ''}
                                      placeholder={index + 1}
                                      onChange={(e) => setLotMoveInputs(prev => ({ ...prev, [index]: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && lotMoveInputs[index]) {
                                          moveLotToPosition(index, lotMoveInputs[index]);
                                          setLotMoveInputs(prev => ({ ...prev, [index]: '' }));
                                        }
                                      }}
                                      className="w-14 px-2 py-1 text-xs border border-purple-300 rounded text-center font-bold focus:outline-none focus:border-purple-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (lotMoveInputs[index]) {
                                          moveLotToPosition(index, lotMoveInputs[index]);
                                          setLotMoveInputs(prev => ({ ...prev, [index]: '' }));
                                        }
                                      }}
                                      className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 font-bold"
                                    >
                                      Go
                                    </button>
                                  </div>
                                  {formData.lots.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeLot(index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Product
                                  </label>
                                  <select
                                    value={lot.productId || ''}
                                    onChange={(e) => {
                                      const product = products.find(p => p._id === e.target.value);
                                      handleLotChangeMulti(index, product ? {
                                        productId: e.target.value,
                                        title: `Lot ${index + 1}: ${product.name}`,
                                        description: product.description,
                                        image: product.images[0],
                                        images: product.images || [product.images[0]],
                                        startingPrice: Math.floor(product.price * 0.7)
                                      } : { productId: e.target.value });
                                    }}
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                  >
                                    <option value="">No Product (Manual Entry)</option>
                                    {products.map(product => (
                                      <option key={product._id} value={product._id}>
                                        {product.name} - ₹{product.price.toLocaleString()}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lot Title
                                  </label>
                                  <input
                                    type="text" 
                                    value={lot.title || ''}
                                    onChange={(e) => handleLotChange(index, 'title', e.target.value)}
                                    required
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                    placeholder={`Lot ${index + 1} title`}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Lot Description
                                  </label>
                                  <RichEditor
                                    value={lot.description || ''}
                                    onChange={(value) => handleLotChange(index, 'description', value)}
                                    placeholder={`Description for lot ${index + 1}`}
                                    minHeight={60}
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                  </label>
                                  <input
                                    type="text"
                                    value={lot.category || 'Miscellaneous'}
                                    onChange={(e) => handleLotChange(index, 'category', e.target.value)}
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                    placeholder="e.g., Ancient India, Mughals, British India"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Enter category for grouping lots in catalog (e.g., Ancient India, Princely States)</p>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Material (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={lot.material || ''}
                                    onChange={(e) => handleLotChange(index, 'material', e.target.value)}
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                    placeholder="e.g., Gold, Silver, Bronze, Copper, Paper"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Specify the material of the item (e.g., Gold, Silver, Bronze, Copper)</p>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Starting Price (₹)
                                    </label>
                                    <input
                                      type="number"
                                      value={lot.startingPrice || ''}
                                      onChange={(e) => handleLotChange(index, 'startingPrice', e.target.value)}
                                      required
                                      min="0"
                                      className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="0"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-blue-600 mb-1">
                                      Min Estimate (₹)
                                    </label>
                                    <input
                                      type="number"
                                      value={lot.estimatedPriceMin || ''}
                                      onChange={(e) => handleLotChange(index, 'estimatedPriceMin', e.target.value)}
                                      min="0"
                                      className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="0 (optional)"
                                    />
                                    <p className="text-xs text-blue-500 mt-1">Min expected value</p>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-blue-600 mb-1">
                                      Max Estimate (₹)
                                    </label>
                                    <input
                                      type="number"
                                      value={lot.estimatedPrice || ''}
                                      onChange={(e) => handleLotChange(index, 'estimatedPrice', e.target.value)}
                                      min="0"
                                      className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="0 (optional)"
                                    />
                                    <p className="text-xs text-blue-500 mt-1">Max expected value</p>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                      Reserve Price (₹)
                                    </label>
                                    <input
                                      type="number"
                                      value={lot.reservePrice || ''}
                                      onChange={(e) => handleLotChange(index, 'reservePrice', e.target.value)}
                                      min="0"
                                      className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      placeholder="0 (optional)"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Min bid to sell</p>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vendor ID
                                  </label>
                                  <input
                                    type="text" 
                                    value={lot.vendorId || ''}
                                    onChange={(e) => handleLotChange(index, 'vendorId', e.target.value)}
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                    placeholder="e.g., VEN001 (optional)"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">Vendor identifier for tracking (admin only)</p>
                                </div>

                                {/* Multiple Images Section */}
                                <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-3">
                                  <label className="block text-sm font-medium text-gray-900 mb-2">
                                    📸 Lot Images (Multiple)
                                  </label>

                                  {/* Image Input Type Selector */}
                                  <div className="flex gap-4 mb-2">
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`imageType-${index}`}
                                        checked={lot.imageInputType === 'file' || !lot.imageInputType}
                                        onChange={() => handleLotChange(index, 'imageInputType', 'file')}
                                        className="mr-2"
                                      />
                                      <span className="text-sm font-medium">File Upload</span>
                                    </label>
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`imageType-${index}`}
                                        checked={lot.imageInputType === 'url'}
                                        onChange={() => handleLotChange(index, 'imageInputType', 'url')}
                                        className="mr-2"
                                      />
                                      <span className="text-sm font-medium">Image URL</span>
                                    </label>
                                  </div>

                                  {/* Add Image Input */}
                                  {(lot.imageInputType === 'file' || !lot.imageInputType) ? (
                                    <>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              const currentImages = lot.images || (lot.image ? [lot.image] : []);
                                              const newImages = [...currentImages, reader.result];
                                              handleLotChangeMulti(index, {
                                                images: newImages,
                                                image: currentImages[0] || reader.result
                                              });
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                        className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                      />
                                      <p className="text-xs text-gray-600 mt-1">Upload images one by one</p>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="https://chroniclevaults.com/api/uploads/img-123456.jpg"
                                          id={`imageUrlInput-${index}`}
                                          className="flex-1 dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const input = document.getElementById(`imageUrlInput-${index}`);
                                            if (input && input.value) {
                                              const currentImages = lot.images || (lot.image ? [lot.image] : []);
                                              const newImages = [...currentImages, input.value];
                                              handleLotChangeMulti(index, {
                                                images: newImages,
                                                image: currentImages[0] || input.value
                                              });
                                              input.value = '';
                                            }
                                          }}
                                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                        >
                                          Add
                                        </button>
                                      </div>
                                      <p className="text-xs text-blue-600 mt-1">
                                        💡 Use Image Upload Manager to upload images and paste URL here
                                      </p>
                                    </>
                                  )}

                                  {/* Display Images */}
                                  {(lot.images && lot.images.length > 0) && (
                                    <div className="mt-3 space-y-2">
                                      <p className="text-sm font-medium text-gray-700">Images ({lot.images.length}) — hover to reorder or delete:</p>
                                      <div className="grid grid-cols-3 gap-2">
                                        {lot.images.map((img, imgIndex) => (
                                          <div key={imgIndex} className="relative group rounded overflow-hidden border border-gray-300">
                                            <img
                                              src={img}
                                              alt={`Lot ${index + 1} - Image ${imgIndex + 1}`}
                                              className="w-full h-24 object-cover"
                                              onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="10"%3EInvalid%3C/text%3E%3C/svg%3E';
                                              }}
                                            />
                                            {/* Hover controls: move up / delete / move down */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                              <button
                                                type="button"
                                                title="Move left"
                                                disabled={imgIndex === 0}
                                                onClick={() => {
                                                  const imgs = [...lot.images];
                                                  [imgs[imgIndex - 1], imgs[imgIndex]] = [imgs[imgIndex], imgs[imgIndex - 1]];
                                                  handleLotChangeMulti(index, { images: imgs, image: imgs[0] || '' });
                                                }}
                                                className="bg-white/90 hover:bg-white p-1 rounded disabled:opacity-30"
                                              >
                                                <ChevronUp className="w-3 h-3 text-gray-800" />
                                              </button>
                                              <button
                                                type="button"
                                                title="Delete"
                                                onClick={() => {
                                                  const newImages = lot.images.filter((_, i) => i !== imgIndex);
                                                  handleLotChangeMulti(index, { images: newImages, image: newImages[0] || '' });
                                                }}
                                                className="bg-red-600 hover:bg-red-700 p-1 rounded text-white"
                                              >
                                                <X className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                title="Move right"
                                                disabled={imgIndex === lot.images.length - 1}
                                                onClick={() => {
                                                  const imgs = [...lot.images];
                                                  [imgs[imgIndex], imgs[imgIndex + 1]] = [imgs[imgIndex + 1], imgs[imgIndex]];
                                                  handleLotChangeMulti(index, { images: imgs, image: imgs[0] || '' });
                                                }}
                                                className="bg-white/90 hover:bg-white p-1 rounded disabled:opacity-30"
                                              >
                                                <ChevronDown className="w-3 h-3 text-gray-800" />
                                              </button>
                                            </div>
                                            {imgIndex === 0 && (
                                              <span className="absolute bottom-1 left-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                                                Main
                                              </span>
                                            )}
                                            <div className="text-center text-xs text-gray-400 bg-gray-50 py-0.5">#{imgIndex + 1}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Video Section */}
                                <div className="border-2 border-purple-200 bg-purple-50 rounded-lg p-3">
                                  <label className="block text-sm font-medium text-gray-900 mb-2">
                                    🎥 Lot Video (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={lot.video || ''}
                                    onChange={(e) => handleLotChange(index, 'video', e.target.value)}
                                    className="w-full dark:bg-gray-800 dark:text-white dark:border-gray-600 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                                    placeholder="https://youtube.com/embed/... or video file URL"
                                  />
                                  <p className="text-xs text-purple-600 mt-1 font-medium">
                                    💡 Use <a href="/admin/video-upload" target="_blank" rel="noopener noreferrer" className="underline hover:text-purple-800">Video Upload Manager</a> to upload videos and get URLs
                                  </p>

                                  {/* Video Preview */}
                                  {lot.video && (
                                    <div className="mt-2">
                                      <p className="text-sm font-medium text-gray-700 mb-1">Video Preview:</p>
                                      {lot.video.includes('youtube.com') || lot.video.includes('youtu.be') ? (
                                        <iframe
                                          src={lot.video.replace('watch?v=', 'embed/')}
                                          className="w-full h-40 rounded border border-gray-300"
                                          allowFullScreen
                                          title={`Lot ${index + 1} video preview`}
                                        />
                                      ) : (
                                        <video
                                          src={lot.video}
                                          controls
                                          className="w-full h-40 rounded border border-gray-300"
                                        >
                                          Your browser does not support the video tag.
                                        </video>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Short Link */}
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2">
                      Short Link Code
                    </label>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-3 py-2 text-sm border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 dark:bg-gray-800 dark:text-white dark:border-orange-600"
                        value={formData.shortCode || ''}
                        onChange={e => setFormData(prev => ({ ...prev, shortCode: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') }))}
                        placeholder="e.g. pa1, ea6, e5"
                        maxLength={20}
                      />
                      {formData.shortCode && (
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(`https://chroniclevaults.com/${formData.shortCode}`); toast.success('Short link copied!'); }}
                          className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-orange-100 border border-orange-300 text-orange-700 hover:bg-orange-200"
                        >
                          Copy
                        </button>
                      )}
                    </div>
                    {formData.shortCode && (
                      <p className="text-xs text-orange-600 mt-1">chroniclevaults.com/{formData.shortCode}</p>
                    )}
                  </div>

                  {/* Catalog PDF Upload */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Auction Catalog PDF
                    </label>
                    {formData.catalogPdf ? (
                      <div className="flex items-center gap-3 mb-3">
                        <a href={formData.catalogPdf} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 font-medium underline truncate max-w-xs">
                          <FileText className="w-4 h-4 flex-shrink-0" />
                          View Current PDF
                        </a>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, catalogPdf: '' }))}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-0.5 border border-red-300 rounded">
                          Remove
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mb-2">No PDF uploaded yet — "View Catalog" button will be disabled on catalog page.</p>
                    )}
                    <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors w-fit text-sm font-medium ${
                      uploadingPdf ? 'border-gray-300 text-gray-400 cursor-not-allowed' : 'border-blue-400 text-blue-700 hover:bg-blue-100'
                    }`}>
                      <Upload className="w-4 h-4" />
                      {uploadingPdf ? 'Uploading...' : formData.catalogPdf ? 'Replace PDF' : 'Upload PDF'}
                      <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={uploadingPdf} className="hidden" />
                    </label>
                    {uploadingPdf && (
                      <div className="mt-2 w-full max-w-xs">
                        <div className="flex justify-between text-xs text-blue-600 mb-1">
                          <span>Uploading PDF...</span>
                          <span>{pdfUploadProgress}%</span>
                        </div>
                        <div className="w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                            style={{ width: `${pdfUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Poster Display Until (Upcoming Period) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Poster Display Until <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="posterDisplayUntil"
                      value={formData.posterDisplayUntil}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Show as "Upcoming" with poster only until this time
                    </p>
                  </div>

                  {/* Live Bidding Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Live Bidding Start Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lot bidding available between poster end and this time. Live bidding starts at this time.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg transition-colors"
                  >
                    {selectedAuction ? 'Update' : 'Create'} Auction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionManagement;
