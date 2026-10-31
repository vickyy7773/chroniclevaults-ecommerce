import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, Upload, ExternalLink, X, ChevronDown, ChevronUp, Search, Copy, Link, Clock, Package, FileDown, UserPlus, Mail, Phone, Lock, CheckCircle, Users } from 'lucide-react';
import { toast } from 'react-toastify';
import lotAuctionService from '../../services/lotAuctionService';
import api from '../../utils/api';
import RichEditor from '../../components/common/RichEditor';

// ── Status helpers ──────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['Draft', 'LotBidding', 'Paused', 'ResultsPending', 'Completed', 'Cancelled'];

const statusBadge = (status) => {
  const map = {
    Draft: 'bg-gray-100 text-gray-700',
    LotBidding: 'bg-green-100 text-green-700',
    Paused: 'bg-yellow-100 text-yellow-700',
    ResultsPending: 'bg-orange-100 text-orange-700',
    Completed: 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

// ── Modal wrapper ──────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-4xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}>
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
    </div>
  </div>
);

// ── Form field helper ──────────────────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

const getStatusColor = (status) => {
  switch (status) {
    case 'LotBidding': return 'bg-green-100 text-green-800 border-green-300';
    case 'Upcoming': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'Paused': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'ResultsPending': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Completed': return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'Cancelled': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getDisplayStatus = (auction) => {
  if (auction.posterDisplayUntil && new Date() < new Date(auction.posterDisplayUntil)) {
    return 'Upcoming';
  }
  return auction.status;
};

const stripHtml = (html) => html?.replace(/<[^>]*>/g, '') || '';

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400';

const toLocalInput = (utcStr) => {
  if (!utcStr) return '';
  const d = new Date(utcStr);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

// ── Create/Edit Auction Modal ──────────────────────────────────────────────
const AuctionFormModal = ({ auction, onClose, onSaved, pendingLots = [] }) => {
  const isEdit = !!auction?._id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: auction?.title || '',
    description: auction?.description || '',
    externalPlatformName: auction?.externalPlatformName || '',
    externalPlatformLink: auction?.externalPlatformLink || '',
    lotBiddingEndTime: toLocalInput(auction?.lotBiddingEndTime),
    status: auction?.status || 'LotBidding',
    catalogPdf: auction?.catalogPdf || '',
    posterDisplayUntil: toLocalInput(auction?.posterDisplayUntil),
    shortCode: auction?.shortCode || '',
    image: auction?.image || '',
  });
  const [imageInputType, setImageInputType] = useState('file');
  const [imagePreview, setImagePreview] = useState(auction?.image || '');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState(0);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

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
      set('catalogPdf', res.pdfUrl);
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
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      let submitData = { ...form };
      // Convert datetime-local strings to ISO for unambiguous timezone handling
      if (submitData.posterDisplayUntil) {
        submitData.posterDisplayUntil = new Date(submitData.posterDisplayUntil).toISOString();
      }
      if (submitData.lotBiddingEndTime) {
        submitData.lotBiddingEndTime = new Date(submitData.lotBiddingEndTime).toISOString();
      }
      // Upload base64 image if present
      if (submitData.image && submitData.image.startsWith('data:image/')) {
        try {
          const uploadResponse = await api.post('/upload/base64', { image: submitData.image });
          submitData.image = uploadResponse.imageUrl;
        } catch {
          toast.error('Failed to upload image');
          setSaving(false);
          return;
        }
      }
      if (isEdit) {
        await lotAuctionService.update(auction._id, submitData);
        toast.success('Auction updated successfully');
      } else {
        const created = await lotAuctionService.create(submitData);
        const newAuctionId = created?.data?._id || created?._id;
        // Auto-add pending lots from BulkLotUpload
        if (newAuctionId && pendingLots.length > 0) {
          let added = 0;
          for (const lot of pendingLots) {
            try {
              await lotAuctionService.addLot(newAuctionId, {
                lotNumber: lot.lotNumber || (added + 1),
                title: lot.title || '',
                description: lot.description || '',
                startingPrice: lot.startingPrice ? Number(lot.startingPrice) : undefined,
                reservePrice: lot.reservePrice ? Number(lot.reservePrice) : undefined,
                estimatedPrice: lot.estimatedPrice ? Number(lot.estimatedPrice) : undefined,
                hsn: lot.hsn || '',
              });
              added++;
            } catch {}
          }
          toast.success(`Auction created with ${added} lots from bulk upload!`);
        } else {
          toast.success('Auction created successfully');
        }
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save auction');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit Lot Auction' : 'Create Lot Auction'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title" required>
          <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Auction title" />
        </Field>
        <Field label="Description">
          <RichEditor value={form.description} onChange={val => set('description', val)} placeholder="Auction description" minHeight={90} />
        </Field>
        <Field label="Auction Image (Optional)">
          <div className="flex gap-4 mb-2">
            <label className="flex items-center cursor-pointer text-sm">
              <input type="radio" name="lotAuctionImgType" checked={imageInputType === 'file'} onChange={() => setImageInputType('file')} className="mr-2" />
              File Upload
            </label>
            <label className="flex items-center cursor-pointer text-sm">
              <input type="radio" name="lotAuctionImgType" checked={imageInputType === 'url'} onChange={() => setImageInputType('url')} className="mr-2" />
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
              <img
                src={imageInputType === 'file' ? imagePreview : form.image}
                alt="Preview"
                className="w-full h-40 object-cover rounded-lg border border-gray-300"
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="External Platform Name">
            <input className={inputCls} value={form.externalPlatformName} onChange={e => set('externalPlatformName', e.target.value)} placeholder="e.g. Invaluable" />
          </Field>
          <Field label="External Platform Link">
            <input className={inputCls} type="text" value={form.externalPlatformLink} onChange={e => set('externalPlatformLink', e.target.value)} placeholder="https://..." />
          </Field>
        </div>
        <Field label="Poster Display Until (optional)">
          <input className={inputCls} type="datetime-local" value={form.posterDisplayUntil} onChange={e => set('posterDisplayUntil', e.target.value)} />
          <p className="text-xs text-gray-500 mt-1">Until this time, users will only see the poster — lots and bidding will not be accessible</p>
        </Field>
        <Field label="Lot Bidding End Time">
          <input className={inputCls} type="datetime-local" value={form.lotBiddingEndTime} onChange={e => set('lotBiddingEndTime', e.target.value)} />
        </Field>

        <Field label="Auction Catalog PDF (optional)">
          {form.catalogPdf ? (
            <div className="flex items-center gap-2 mb-2">
              <a href={form.catalogPdf} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                📄 View Current PDF
              </a>
              <button type="button" onClick={() => set('catalogPdf', '')} className="text-xs text-red-500 hover:text-red-700">Remove</button>
            </div>
          ) : (
            <p className="text-xs text-gray-500 mb-2">No PDF uploaded yet — "View Catalog" button will be disabled on catalog page.</p>
          )}
          <label className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-sm ${uploadingPdf ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed' : 'border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700'}`}>
            {uploadingPdf ? 'Uploading...' : form.catalogPdf ? 'Replace PDF' : 'Upload PDF'}
            <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={uploadingPdf} className="hidden" />
          </label>
          {uploadingPdf && (
            <div className="mt-2">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uploading PDF...</span>
                <span>{pdfUploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full transition-all duration-200" style={{ width: `${pdfUploadProgress}%` }} />
              </div>
            </div>
          )}
        </Field>
        <Field label="Short Link Code (optional)">
          <div className="flex gap-2">
            <input
              className={inputCls}
              value={form.shortCode}
              onChange={e => set('shortCode', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
              placeholder="e.g. pa1, ea6"
              maxLength={20}
            />
            {form.shortCode && (
              <button
                type="button"
                title="Copy short link"
                onClick={() => {
                  navigator.clipboard.writeText(`https://chroniclevaults.com/${form.shortCode}`);
                  toast.success('Short link copied!');
                }}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 whitespace-nowrap"
              >
                <Copy size={14} /> Copy
              </button>
            )}
          </div>
          {form.shortCode && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <Link size={11} /> chroniclevaults.com/{form.shortCode}
            </p>
          )}
        </Field>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button type="submit" disabled={saving || isReadingFile} className="px-5 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors disabled:opacity-60">
            {saving ? 'Saving...' : isReadingFile ? 'Loading image...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ── Lots Panel Modal ───────────────────────────────────────────────────────
const AddLotForm = ({ auctionId, onAdded }) => {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    lotNumber: '', title: '', description: '',
    startingPrice: '', reservePrice: '', estimatedPrice: '', hsn: '', images: [], newImageUrl: ''
  });
  const [addImgType, setAddImgType] = useState('file');
  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.lotNumber || !form.title) { toast.error('Lot number and title are required'); return; }
    setSaving(true);
    try {
      await lotAuctionService.addLot(auctionId, {
        lotNumber: Number(form.lotNumber),
        title: form.title,
        description: form.description,
        images: form.images,
        startingPrice: form.startingPrice ? Number(form.startingPrice) : undefined,
        reservePrice: form.reservePrice ? Number(form.reservePrice) : undefined,
        estimatedPrice: form.estimatedPrice ? Number(form.estimatedPrice) : undefined,
      });
      toast.success('Lot added');
      setForm({ lotNumber: '', title: '', description: '', startingPrice: '', reservePrice: '', estimatedPrice: '', hsn: '', images: [], newImageUrl: '' });
      onAdded();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add lot');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-4 space-y-3 mt-4 border">
      <h4 className="text-sm font-semibold text-gray-700">Add New Lot</h4>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Lot Number" required>
          <input className={inputCls} type="number" value={form.lotNumber} onChange={e => set('lotNumber', e.target.value)} placeholder="1" />
        </Field>
        <Field label="HSN Code">
          <input className={inputCls} value={form.hsn} onChange={e => set('hsn', e.target.value)} placeholder="e.g. 9705" />
        </Field>
      </div>
      <Field label="Title" required>
        <input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Lot title" />
      </Field>
      <Field label="Description">
        <RichEditor value={form.description} onChange={val => set('description', val)} placeholder="Lot description" minHeight={60} />
      </Field>

      {/* Multiple Images Section — same as Live Auction */}
      <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-3">
        <label className="block text-sm font-medium text-gray-900 mb-2">📸 Lot Images (Multiple)</label>
        <div className="flex gap-4 mb-2">
          <label className="flex items-center cursor-pointer">
            <input type="radio" name="addLotImgType" checked={addImgType === 'file'} onChange={() => setAddImgType('file')} className="mr-2" />
            <span className="text-sm font-medium">File Upload</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input type="radio" name="addLotImgType" checked={addImgType === 'url'} onChange={() => setAddImgType('url')} className="mr-2" />
            <span className="text-sm font-medium">Image URL</span>
          </label>
        </div>
        {addImgType === 'file' ? (
          <>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  setForm(prev => ({ ...prev, images: [...prev.images, reader.result] }));
                  e.target.value = '';
                };
                reader.readAsDataURL(file);
              }
            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <p className="text-xs text-gray-600 mt-1">Upload images one by one</p>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <input type="text" placeholder="https://chroniclevaults.com/api/uploads/img-123456.jpg"
                value={form.newImageUrl} onChange={e => set('newImageUrl', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              <button type="button" onClick={() => {
                if (form.newImageUrl.trim()) setForm(prev => ({ ...prev, images: [...prev.images, prev.newImageUrl.trim()], newImageUrl: '' }));
              }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Add</button>
            </div>
            <p className="text-xs text-blue-600 mt-1">💡 Use Image Upload Manager to upload images and paste URL here</p>
          </>
        )}
        {form.images.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-gray-700">Images ({form.images.length}) — hover to reorder or delete:</p>
            <div className="grid grid-cols-3 gap-2">
              {form.images.map((img, imgIndex) => (
                <div key={imgIndex} className="relative group rounded overflow-hidden border border-gray-300">
                  <img src={img} alt="" className="w-full h-24 object-cover"
                    onError={e => { e.target.onerror=null; e.target.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="10"%3EInvalid%3C/text%3E%3C/svg%3E'; }} />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    <button type="button" title="Move left" disabled={imgIndex === 0}
                      onClick={() => { const imgs=[...form.images]; [imgs[imgIndex-1],imgs[imgIndex]]=[imgs[imgIndex],imgs[imgIndex-1]]; setForm(p=>({...p,images:imgs})); }}
                      className="bg-white/90 hover:bg-white p-1 rounded disabled:opacity-30"><ChevronUp className="w-3 h-3 text-gray-800" /></button>
                    <button type="button" title="Delete"
                      onClick={() => setForm(p=>({...p,images:p.images.filter((_,i)=>i!==imgIndex)}))}
                      className="bg-red-600 hover:bg-red-700 p-1 rounded text-white"><X className="w-3 h-3" /></button>
                    <button type="button" title="Move right" disabled={imgIndex === form.images.length - 1}
                      onClick={() => { const imgs=[...form.images]; [imgs[imgIndex],imgs[imgIndex+1]]=[imgs[imgIndex+1],imgs[imgIndex]]; setForm(p=>({...p,images:imgs})); }}
                      className="bg-white/90 hover:bg-white p-1 rounded disabled:opacity-30"><ChevronDown className="w-3 h-3 text-gray-800" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Starting Price (₹)">
          <input className={inputCls} type="number" value={form.startingPrice} onChange={e => set('startingPrice', e.target.value)} placeholder="0" />
        </Field>
        <Field label="Reserve Price (₹)">
          <input className={inputCls} type="number" value={form.reservePrice} onChange={e => set('reservePrice', e.target.value)} placeholder="0" />
        </Field>
        <Field label="Est. Price (₹)">
          <input className={inputCls} type="number" value={form.estimatedPrice} onChange={e => set('estimatedPrice', e.target.value)} placeholder="0" />
        </Field>
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 transition-colors">
          {saving ? 'Adding...' : 'Add Lot'}
        </button>
      </div>
    </form>
  );
};

const ViewLotsModal = ({ auction, onClose }) => {
  const [lots, setLots] = useState(auction?.lots || []);
  const [loading, setLoading] = useState(false);
  const [editingLot, setEditingLot] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editImageInputType, setEditImageInputType] = useState('file');
  const [savingEdit, setSavingEdit] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await lotAuctionService.getById(auction._id);
      setLots(data?.data?.lots || data?.lots || []);
    } catch {
      toast.error('Failed to refresh lots');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (lotNum) => {
    if (!window.confirm(`Delete lot #${lotNum}?`)) return;
    try {
      await lotAuctionService.deleteLot(auction._id, lotNum);
      toast.success('Lot deleted');
      setEditingLot(null);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete lot');
    }
  };

  const openEdit = (lot) => {
    setEditingLot(lot.lotNumber);
    setEditForm({
      title: lot.title || '',
      description: lot.description || '',
      startingPrice: lot.startingPrice || '',
      reservePrice: lot.reservePrice || '',
      estimatedPrice: lot.estimatedPrice || '',
      hsn: lot.hsn || '',
      images: lot.images || [],
      newImageUrl: '',
    });
    setEditImagePreview('');
    setEditImageInputType('url');
  };


  const saveEdit = async () => {
    if (!editForm.title.trim()) { toast.error('Title required'); return; }
    setSavingEdit(true);
    try {
      await lotAuctionService.updateLot(auction._id, editingLot, {
        title: editForm.title,
        description: editForm.description,
        startingPrice: editForm.startingPrice ? Number(editForm.startingPrice) : undefined,
        reservePrice: editForm.reservePrice ? Number(editForm.reservePrice) : undefined,
        estimatedPrice: editForm.estimatedPrice ? Number(editForm.estimatedPrice) : undefined,
        hsn: editForm.hsn,
        images: editForm.images,
      });
      toast.success('Lot updated');
      setEditingLot(null);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update lot');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <Modal title={`Lots — ${auction.title}`} onClose={onClose} wide>
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : lots.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">No lots added yet.</p>
        ) : lots.map(lot => (
          editingLot === lot.lotNumber ? (
            /* ── Edit card ── */
            <div key={lot.lotNumber} className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-purple-900">Editing Lot #{lot.lotNumber}</h4>
                <button type="button" onClick={() => setEditingLot(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
              </div>

              {/* Multiple Images Section — same as Live Auction */}
              <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-3 mb-3">
                <label className="block text-sm font-medium text-gray-900 mb-2">📸 Lot Images (Multiple)</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" name="editImgType" checked={editImageInputType === 'file'} onChange={() => setEditImageInputType('file')} className="mr-2" />
                    <span className="text-sm font-medium">File Upload</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input type="radio" name="editImgType" checked={editImageInputType === 'url'} onChange={() => setEditImageInputType('url')} className="mr-2" />
                    <span className="text-sm font-medium">Image URL</span>
                  </label>
                </div>
                {editImageInputType === 'file' ? (
                  <>
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditForm(prev => ({ ...prev, images: [...prev.images, reader.result] }));
                          e.target.value = '';
                        };
                        reader.readAsDataURL(file);
                      }
                    }} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    <p className="text-xs text-gray-600 mt-1">Upload images one by one</p>
                  </>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input type="text" placeholder="https://chroniclevaults.com/api/uploads/img-123456.jpg"
                        value={editForm.newImageUrl || ''} onChange={e => setEditForm(p => ({ ...p, newImageUrl: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <button type="button" onClick={() => {
                        if (editForm.newImageUrl?.trim()) setEditForm(p => ({ ...p, images: [...p.images, p.newImageUrl.trim()], newImageUrl: '' }));
                      }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">Add</button>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">💡 Use Image Upload Manager to upload images and paste URL here</p>
                  </>
                )}
                {editForm.images?.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">Images ({editForm.images.length}) — hover to reorder or delete:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {editForm.images.map((img, imgIndex) => (
                        <div key={imgIndex} className="relative group rounded overflow-hidden border border-gray-300">
                          <img src={img} alt="" className="w-full h-24 object-cover"
                            onError={e => { e.target.onerror=null; e.target.src='data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="10"%3EInvalid%3C/text%3E%3C/svg%3E'; }} />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button type="button" title="Move left" disabled={imgIndex === 0}
                              onClick={() => { const imgs=[...editForm.images]; [imgs[imgIndex-1],imgs[imgIndex]]=[imgs[imgIndex],imgs[imgIndex-1]]; setEditForm(p=>({...p,images:imgs})); }}
                              className="bg-white/90 hover:bg-white p-1 rounded disabled:opacity-30"><ChevronUp className="w-3 h-3 text-gray-800" /></button>
                            <button type="button" title="Delete"
                              onClick={() => setEditForm(p=>({...p,images:p.images.filter((_,i)=>i!==imgIndex)}))}
                              className="bg-red-600 hover:bg-red-700 p-1 rounded text-white"><X className="w-3 h-3" /></button>
                            <button type="button" title="Move right" disabled={imgIndex === editForm.images.length - 1}
                              onClick={() => { const imgs=[...editForm.images]; [imgs[imgIndex],imgs[imgIndex+1]]=[imgs[imgIndex+1],imgs[imgIndex]]; setEditForm(p=>({...p,images:imgs})); }}
                              className="bg-white/90 hover:bg-white p-1 rounded disabled:opacity-30"><ChevronDown className="w-3 h-3 text-gray-800" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Field label="Title" required>
                  <input className={inputCls} value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                </Field>
                <Field label="Description">
                  <RichEditor value={editForm.description} onChange={val => setEditForm(p => ({ ...p, description: val }))} placeholder="Lot description" minHeight={70} />
                </Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Starting (₹)">
                    <input className={inputCls} type="number" value={editForm.startingPrice} onChange={e => setEditForm(p => ({ ...p, startingPrice: e.target.value }))} />
                  </Field>
                  <Field label="Reserve (₹)">
                    <input className={inputCls} type="number" value={editForm.reservePrice} onChange={e => setEditForm(p => ({ ...p, reservePrice: e.target.value }))} />
                  </Field>
                  <Field label="Est. (₹)">
                    <input className={inputCls} type="number" value={editForm.estimatedPrice} onChange={e => setEditForm(p => ({ ...p, estimatedPrice: e.target.value }))} />
                  </Field>
                </div>
                <Field label="HSN Code">
                  <input className={inputCls} value={editForm.hsn} onChange={e => setEditForm(p => ({ ...p, hsn: e.target.value }))} />
                </Field>
              </div>
              <div className="flex gap-2 justify-end mt-3">
                <button type="button" onClick={() => handleDelete(lot.lotNumber)} className="px-3 py-1.5 text-xs rounded-lg border border-red-300 text-red-500 hover:bg-red-50">Delete Lot</button>
                <button type="button" onClick={() => setEditingLot(null)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="button" onClick={saveEdit} disabled={savingEdit} className="px-4 py-1.5 text-xs rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60">
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            /* ── Display card ── */
            <div key={lot.lotNumber} className="border border-gray-200 rounded-lg overflow-hidden flex hover:border-gray-300 transition-colors">
              <div className="w-24 h-24 flex-shrink-0 bg-gray-100">
                {lot.images?.[0] ? (
                  <img src={lot.images[0]} alt={lot.title} className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={28} /></div>
                )}
              </div>
              <div className="flex-1 px-3 py-2 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-gray-400">Lot #{lot.lotNumber}</span>
                  {statusBadge(lot.status || 'Upcoming')}
                  {lot.images?.length > 1 && <span className="text-xs text-blue-500">{lot.images.length} images</span>}
                </div>
                <div className="font-semibold text-gray-800 text-sm line-clamp-1">{lot.title}</div>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  <span>Start: <span className="font-medium text-gray-700">₹{lot.startingPrice?.toLocaleString() || '—'}</span></span>
                  {lot.reservePrice ? <span>Reserve: <span className="font-medium text-gray-700">₹{lot.reservePrice?.toLocaleString()}</span></span> : null}
                  {lot.estimatedPrice ? <span>Est: <span className="font-medium text-gray-700">₹{Number(lot.estimatedPrice)?.toLocaleString()}</span></span> : null}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center gap-1.5 px-3 border-l border-gray-100">
                <button onClick={() => openEdit(lot)} title="Edit" className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"><Edit2 size={15} /></button>
                <button onClick={() => handleDelete(lot.lotNumber)} title="Delete" className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"><Trash2 size={15} /></button>
              </div>
            </div>
          )
        ))}
        <AddLotForm auctionId={auction._id} onAdded={refresh} />
      </div>
    </Modal>
  );
};

// ── Upload Results Modal ──────────────────────────────────────────────────
const UploadResultsModal = ({ auction, onClose, onSaved }) => {
  const [lots] = useState(auction?.lots || []);
  const STORAGE_KEY = `lot-results-draft-${auction?._id}`;

  const [results, setResults] = useState(() => {
    // Load saved draft from localStorage if exists
    try {
      const saved = localStorage.getItem(`lot-results-draft-${auction?._id}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return (auction?.lots || []).map(lot => {
      const activeBids = (lot.bids || []).filter(b => b.amount > 0);
      const topBid = activeBids.length > 0
        ? [...activeBids].sort((a, b) => b.amount - a.amount || new Date(b.timestamp) - new Date(a.timestamp))[0]
        : null;
      const bidUser = topBid?.user;
      const isOurCustomer = bidUser && bidUser._id;
      return {
        lotNumber: lot.lotNumber,
        hammerPrice: topBid?.amount ? String(topBid.amount) : '',
        winnerType: isOurCustomer ? 'OurCustomer' : 'External',
        winnerSearch: isOurCustomer ? `${bidUser.name || ''} (${bidUser.email || ''})` : '',
        customerId: isOurCustomer ? bidUser._id : undefined,
        externalWinnerName: '',
        externalWinnerPhone: '',
      };
    });
  });
  const [saving, setSaving] = useState(false);
  const [customerResults, setCustomerResults] = useState({});
  const [confirmUpload, setConfirmUpload] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regTargetIdx, setRegTargetIdx] = useState(null);
  const [regStep, setRegStep] = useState(1);
  const [regForm, setRegForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [regLoading, setRegLoading] = useState(false);
  const [regNewCustomer, setRegNewCustomer] = useState(null);

  const openRegModal = (idx) => {
    setRegTargetIdx(idx);
    setRegStep(1);
    setRegForm({ name: '', email: '', phone: '', password: '' });
    setRegNewCustomer(null);
    setShowRegModal(true);
  };

  const handleRegCustomer = async () => {
    if (!regForm.name || !regForm.email || !regForm.password) {
      toast.error('Name, email and password are required'); return;
    }
    setRegLoading(true);
    try {
      const res = await api.post('/auth/register', { name: regForm.name, email: regForm.email, phone: regForm.phone, password: regForm.password });
      const user = res?.data?.user || res?.user || res?.data;
      if (user?._id) {
        setRegNewCustomer(user);
        setRegStep(2);
        if (regTargetIdx !== null) {
          setResults(prev => prev.map((item, i) => i !== regTargetIdx ? item : {
            ...item,
            winnerType: 'OurCustomer',
            customerId: user._id,
            winnerSearch: `${user.name} (${user.email})`,
          }));
        }
        toast.success('Customer account created!');
      } else {
        toast.error(res?.message || 'Failed to create customer');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create customer');
    } finally {
      setRegLoading(false);
    }
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
      toast.success('Progress saved! You can close and continue later.');
    } catch {
      toast.error('Failed to save progress');
    }
  };

  const clearDraft = () => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const updateResult = (idx, key, val) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  };

  const searchCustomers = async (idx, query, showAll = false) => {
    if (query !== undefined) updateResult(idx, 'winnerSearch', query);
    const q = query ?? '';
    try {
      const params = q.length >= 1 ? { search: q, limit: 20 } : { limit: 50 };
      const res = await api.get('/users/customers', { params });
      const list = res?.customers || res?.data?.customers || [];
      setCustomerResults(prev => ({ ...prev, [idx]: list }));
    } catch {
      setCustomerResults(prev => ({ ...prev, [idx]: [] }));
    }
  };

  const handleSubmit = async () => {
    const payload = results.map(r => {
      const entry = {
        lotNumber: r.lotNumber,
        hammerPrice: r.hammerPrice ? Number(r.hammerPrice) : 0,
        isExternalWinner: r.winnerType === 'External',
      };
      if (r.winnerType === 'OurCustomer') {
        entry.winnerUserId = r.customerId || null;
      } else {
        entry.winnerName  = r.externalWinnerName || null;
        entry.winnerPhone = r.externalWinnerPhone || null;
      }
      return entry;
    });
    setSaving(true);
    setConfirmUpload(false);
    try {
      await lotAuctionService.uploadResults(auction._id, payload);
      clearDraft();
      toast.success('Results uploaded! Auction moved to Completed.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload results');
    } finally {
      setSaving(false);
    }
  };

  if (lots.length === 0) {
    return (
      <Modal title="Upload Results" onClose={onClose}>
        <p className="text-gray-500 text-sm text-center py-6">No lots found for this auction.</p>
      </Modal>
    );
  }

  return (
    <Modal title={`Upload Results — ${auction.title}`} onClose={onClose} wide>
      <form onSubmit={e => e.preventDefault()}>
        <div className="space-y-5">
          {results.map((r, idx) => {
            const lot = lots[idx];
            const activeBids = (lot?.bids || []).filter(b => b.amount > 0);
            const topBid = activeBids.length > 0
              ? [...activeBids].sort((a, b) => b.amount - a.amount || new Date(b.timestamp) - new Date(a.timestamp))[0]
              : null;
            const lastBid = topBid?.amount || null;
            const lastBidder = topBid?.user?.name || topBid?.user?.email || null;
            const startingPrice = lot?.startingPrice;
            return (
            <div key={r.lotNumber} className="bg-gray-50 rounded-xl p-4 border">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-orange-600">Lot #{r.lotNumber}</span>
                  <span className="text-gray-700 text-sm font-medium">{lot?.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                    Start: ₹{startingPrice?.toLocaleString('en-IN') ?? '—'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full font-semibold ${lastBid ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                    Last Bid: {lastBid ? `₹${lastBid.toLocaleString('en-IN')}${lastBidder ? ` (${lastBidder})` : ''}` : 'No bids'}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Hammer Price (₹)">
                  <input
                    className={inputCls}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={r.hammerPrice}
                    onChange={e => updateResult(idx, 'hammerPrice', e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                  />
                </Field>
                <Field label="Winner Type">
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`wtype-${idx}`}
                        value="OurCustomer"
                        checked={r.winnerType === 'OurCustomer'}
                        onChange={() => updateResult(idx, 'winnerType', 'OurCustomer')}
                        className="accent-orange-500"
                      />
                      Our Customer
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name={`wtype-${idx}`}
                        value="External"
                        checked={r.winnerType === 'External'}
                        onChange={() => updateResult(idx, 'winnerType', 'External')}
                        className="accent-orange-500"
                      />
                      External
                    </label>
                  </div>
                </Field>
              </div>
              {r.winnerType === 'OurCustomer' && (
                <div className="mt-3 relative">
                  <Field label="Search Customer">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <input
                        className={`${inputCls} pl-8`}
                        value={r.winnerSearch}
                        onChange={e => searchCustomers(idx, e.target.value)}
                        onFocus={() => searchCustomers(idx, r.winnerSearch)}
                        placeholder="Name, email or phone..."
                      />
                    </div>
                  </Field>
                  {(customerResults[idx] || []).length > 0 && (
                    <div className="absolute z-10 bg-white border rounded-lg shadow-lg mt-1 w-full max-h-40 overflow-y-auto">
                      {customerResults[idx].map(c => (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => {
                            updateResult(idx, 'winnerSearch', `${c.name} (${c.email})`);
                            updateResult(idx, 'customerId', c._id);
                            setCustomerResults(prev => ({ ...prev, [idx]: [] }));
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 transition-colors"
                        >
                          <div className="font-medium">{c.name}</div>
                          <div className="text-gray-400 text-xs">{c.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {r.winnerType === 'External' && (
                <div className="mt-3 space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-amber-700">Platform se winner hai? Register karke "Our Customer" mein link karo.</p>
                    <button
                      type="button"
                      onClick={() => openRegModal(idx)}
                      className="shrink-0 flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-colors"
                    >
                      <UserPlus size={13} /> Register Customer
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="External Winner Name">
                      <input className={inputCls} value={r.externalWinnerName} onChange={e => updateResult(idx, 'externalWinnerName', e.target.value)} placeholder="Winner name" />
                    </Field>
                    <Field label="Winner Phone">
                      <input className={inputCls} value={r.externalWinnerPhone} onChange={e => updateResult(idx, 'externalWinnerPhone', e.target.value)} placeholder="Phone number" />
                    </Field>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
        {/* Confirm Upload Dialog */}
        {confirmUpload && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Upload?</h3>
              <p className="text-gray-500 text-sm mb-1">
                Results will be permanently submitted for <span className="font-semibold text-gray-800">{auction.title}</span>.
              </p>
              <p className="text-red-500 text-sm font-medium mb-6">
                Auction status will change to <strong>Completed</strong>. This cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmUpload(false)}
                  className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Uploading...' : 'Yes, Upload Now'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-3 pt-4 border-t mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors">Close</button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-5 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              💾 Save Progress
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => setConfirmUpload(true)}
              className="px-5 py-2 text-sm rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60 font-semibold transition-colors"
            >
              {saving ? 'Uploading...' : '⬆ Upload Results'}
            </button>
          </div>
        </div>
      </form>

      {/* Register Customer Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border-2 border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6" />
                <h2 className="text-lg font-bold">
                  {regStep === 1 ? 'Step 1: Create Customer Account' : 'Step 2: Auction Registration'}
                </h2>
              </div>
              <button type="button" onClick={() => setShowRegModal(false)} className="text-white/80 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {regStep === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input type="text" value={regForm.name} onChange={e => setRegForm(p => ({ ...p, name: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="Customer full name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input type="text" value={regForm.email} onChange={e => setRegForm(p => ({ ...p, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="customer@email.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input type="tel" value={regForm.phone} onChange={e => setRegForm(p => ({ ...p, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="Mobile number" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input type="text" value={regForm.password} onChange={e => setRegForm(p => ({ ...p, password: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="Set a password" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowRegModal(false)}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                      Cancel
                    </button>
                    <button type="button" onClick={handleRegCustomer} disabled={regLoading}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                      {regLoading ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> Creating...</> : <><UserPlus className="w-5 h-5" /> Create Account</>}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-center">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900 mb-1">Account Created!</p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-bold text-blue-600">{regNewCustomer?.name}</span> winner ke roop mein link ho gaye hain.<br />
                      Ab auction registration bhi bharo (optional).
                    </p>
                  </div>
                  <a
                    href={`/auction-registration?adminMode=true&customerId=${regNewCustomer?._id}&name=${encodeURIComponent(regNewCustomer?.name || '')}&email=${encodeURIComponent(regNewCustomer?.email || '')}&phone=${encodeURIComponent(regNewCustomer?.phone || regForm.phone || '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Fill Auction Registration Form
                  </a>
                  <button type="button" onClick={() => setShowRegModal(false)}
                    className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const LotAuctionManagement = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showLotsModal, setShowLotsModal] = useState(false);
  const [lotsAuction, setLotsAuction] = useState(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [resultsAuction, setResultsAuction] = useState(null);
  const [pendingLots, setPendingLots] = useState([]);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const res = await lotAuctionService.getAll();
      setAuctions(res?.data || res || []);
    } catch (err) {
      toast.error('Failed to load auctions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAuctions(); }, []);


  const handleDelete = async (auction) => {
    if (!window.confirm(`Delete "${auction.title}"? This cannot be undone.`)) return;
    try {
      await lotAuctionService.delete(auction._id);
      toast.success('Auction deleted');
      fetchAuctions();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete auction');
    }
  };

  const openEdit = (auction) => { setSelectedAuction(auction); setShowFormModal(true); };
  const openCreate = () => { setSelectedAuction(null); setShowFormModal(true); };

  const openLots = async (auction) => {
    try {
      const res = await lotAuctionService.getById(auction._id);
      setLotsAuction(res?.data || res);
    } catch {
      setLotsAuction(auction);
    }
    setShowLotsModal(true);
  };

  const openResults = async (auction) => {
    try {
      const res = await lotAuctionService.getById(auction._id);
      setResultsAuction(res?.data || res);
    } catch {
      setResultsAuction(auction);
    }
    setShowResultsModal(true);
  };

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50 p-6'}>
      {/* Header */}
      {!embedded ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Lot Auction Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage external platform lot auctions</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus size={16} />
            Create New Lot Auction
          </button>
        </div>
      ) : (
        <div className="flex justify-end mb-4">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            <Plus size={15} />
            Create Lot Auction
          </button>
        </div>
      )}

      {/* Card Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No lot auctions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map(auction => (
            <div key={auction._id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative h-48 bg-gray-200">
                {auction.image ? (
                  <img src={auction.image} alt={auction.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(getDisplayStatus(auction))}`}>
                  {getDisplayStatus(auction)}
                </div>
                <div className="absolute top-2 left-2 px-3 py-1 rounded-full text-xs font-bold border bg-purple-100 text-purple-800 border-purple-300">
                  {auction.lots?.length || 0} Lots
                </div>
              </div>

              {/* Details */}
              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{auction.title}</h3>
                {auction.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{stripHtml(auction.description)}</p>
                )}

                {auction.shortCode && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(`https://chroniclevaults.com/${auction.shortCode}`); toast.success('Short link copied!'); }}
                    className="mb-2 flex items-center gap-1 text-xs text-orange-500 hover:text-orange-700"
                  >
                    <Link size={10} /> /{auction.shortCode} <Copy size={10} />
                  </button>
                )}

                <div className="border-t pt-3 mb-3 space-y-1">
                  {auction.lotBiddingEndTime && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>End: {new Date(auction.lotBiddingEndTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  )}
                  {auction.externalPlatformName && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <ExternalLink className="w-3 h-3" />
                      <span>{auction.externalPlatformName}</span>
                      {auction.externalPlatformLink && (
                        <a href={auction.externalPlatformLink} target="_blank" rel="noreferrer" className="text-orange-500 hover:text-orange-700 ml-1">↗</a>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openEdit(auction)}
                      className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => openLots(auction)}
                      className="flex-1 flex items-center justify-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Lots</span>
                    </button>
                    <button
                      onClick={() => handleDelete(auction)}
                      className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => openResults(auction)}
                    className="w-full flex items-center justify-center space-x-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Results</span>
                  </button>
                  <button
                    onClick={() => navigate(`/admin/lot-auctions/${auction._id}`)}
                    className="w-full flex items-center justify-center space-x-1 bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Detail &amp; Export Excel</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showFormModal && (
        <AuctionFormModal
          auction={selectedAuction}
          onClose={() => { setShowFormModal(false); setPendingLots([]); }}
          onSaved={fetchAuctions}
          pendingLots={selectedAuction ? [] : pendingLots}
        />
      )}
      {showLotsModal && lotsAuction && (
        <ViewLotsModal
          auction={lotsAuction}
          onClose={() => { setShowLotsModal(false); setLotsAuction(null); }}
        />
      )}
      {showResultsModal && resultsAuction && (
        <UploadResultsModal
          auction={resultsAuction}
          onClose={() => { setShowResultsModal(false); setResultsAuction(null); }}
          onSaved={fetchAuctions}
        />
      )}
    </div>
  );
};

export default LotAuctionManagement;
