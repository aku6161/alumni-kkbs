import React, { useState, useMemo } from 'react';
import {
  AlumniMember,
  HomecomingRegistration as HomecomingRegistrationType,
  Program,
  ProgramReceipt,
  SystemConfig,
  Transaction
} from '../types';
import { OfficialReceiptDocument } from './ProgramReceiptsManager';
import { AlumniAuthCard } from './AlumniAuthCard';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  HardDrive,
  Link2,
  ListChecks,
  LogOut,
  MapPin,
  Minus,
  Plus,
  Printer,
  Receipt,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  UserCheck,
  Users,
  X,
  AlertCircle
} from 'lucide-react';

export const HOMECOMING_DRIVE_FOLDER_ID = '1FeJfBi6hMg_8doCOaN3m7MCHc09cSiAa';
export const HOMECOMING_DRIVE_FOLDER_URL = `https://drive.google.com/drive/folders/${HOMECOMING_DRIVE_FOLDER_ID}?usp=sharing`;

const BANK_DETAILS = {
  bank: 'Bank Rakyat',
  accountName: 'Persatuan Alumni KKBS',
  accountNo: '1102619700'
};

const PRICE_12_PLUS = 90;
const PRICE_5_TO_11 = 45;
const PRICE_4_BELOW = 0;

const APPS_SCRIPT_SNIPPET = `var HOMECOMING_FOLDER_ID = "${HOMECOMING_DRIVE_FOLDER_ID}";

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, service: "Alumni Homecoming Night Drive Uploader" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents || "{}");
    var folderId = postData.folderId || HOMECOMING_FOLDER_ID;
    var folder = DriveApp.getFolderById(folderId);
    var fileName = postData.fileName || ("Bukti_Bayaran_" + new Date().getTime() + ".png");
    var mimeType = postData.mimeType || "application/octet-stream";
    var base64Data = String(postData.fileBase64 || "").replace(/^data:[^;]+;base64,/, "");
    var bytes = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(bytes, mimeType, fileName);
    var file = folder.createFile(blob);
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) {}
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        fileId: file.getId(),
        fileName: file.getName(),
        fileUrl: file.getUrl()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

interface HomecomingRegistrationProps {
  program: Program;
  members: AlumniMember[];
  config: SystemConfig;
  receipts: ProgramReceipt[];
  registrations: HomecomingRegistrationType[];
  isPublicMode?: boolean;
  initialLoggedInAlumni?: AlumniMember | null;
  onBack?: () => void;
  onActivateMemberAccount: (memberId: string, updateData: Partial<AlumniMember>) => Promise<boolean>;
  onAlumniAuthenticated?: (member: AlumniMember) => void;
  onAddRegistration: (reg: HomecomingRegistrationType) => Promise<boolean>;
  onDeleteRegistration: (id: string) => Promise<boolean>;
  onAddReceipt: (receipt: Omit<ProgramReceipt, 'id' | 'createdAt'>) => Promise<boolean>;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<boolean>;
  onUpdateConfig: (cfg: SystemConfig) => Promise<boolean>;
}

const createCompressedImagePreview = (file: File): Promise<string | undefined> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 480;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(undefined);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.65));
        } catch {
          resolve(undefined);
        }
      };
      img.onerror = () => resolve(undefined);
      img.src = String(reader.result || '');
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
};

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Gagal membaca fail bukti bayaran.'));
    reader.readAsDataURL(file);
  });
};

export const HomecomingRegistration: React.FC<HomecomingRegistrationProps> = ({
  program,
  members,
  config,
  receipts,
  registrations,
  isPublicMode = false,
  initialLoggedInAlumni = null,
  onBack,
  onActivateMemberAccount,
  onAlumniAuthenticated,
  onAddRegistration,
  onDeleteRegistration,
  onAddReceipt,
  onAddTransaction,
  onUpdateConfig
}) => {
  const [pageTab, setPageTab] = useState<'register' | 'list' | 'drive_setup'>('register');
  const [participantType, setParticipantType] = useState<'Alumni' | 'Pensyarah'>('Alumni');

  // Alumni Auth inside Homecoming form
  const [loggedInAlumni, setLoggedInAlumni] = useState<AlumniMember | null>(initialLoggedInAlumni);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  const publicRegistrationUrl = useMemo(() => {
    try {
      return `${window.location.origin}/?daftar=homecoming`;
    } catch {
      return '/?daftar=homecoming';
    }
  }, []);

  React.useEffect(() => {
    if (initialLoggedInAlumni) {
      setLoggedInAlumni(initialLoggedInAlumni);
      setPhoneInput(
        initialLoggedInAlumni.noTelefon && initialLoggedInAlumni.noTelefon !== '-'
          ? initialLoggedInAlumni.noTelefon
          : ''
      );
      setEmailInput(initialLoggedInAlumni.emel || '');
    }
  }, [initialLoggedInAlumni]);

  // Registration Form Fields
  const [lecturerName, setLecturerName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

  // Pax Counts
  const [pax12Plus, setPax12Plus] = useState<number>(1);
  const [pax5To11, setPax5To11] = useState<number>(0);
  const [pax4Below, setPax4Below] = useState<number>(0);

  // Proof Upload State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string>('');
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Submission & Receipt State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [latestRegistration, setLatestRegistration] = useState<HomecomingRegistrationType | null>(null);
  const [receiptForPreview, setReceiptForPreview] = useState<ProgramReceipt | null>(null);

  // Drive Apps Script Setup State
  const [driveScriptUrlInput, setDriveScriptUrlInput] = useState(config.homecomingDriveScriptUrl || '');
  const [driveSaveMsg, setDriveSaveMsg] = useState('');
  const [copiedScriptCode, setCopiedScriptCode] = useState(false);

  // Auto-calculate totals
  const subtotal12Plus = pax12Plus * PRICE_12_PLUS;
  const subtotal5To11 = pax5To11 * PRICE_5_TO_11;
  const subtotal4Below = pax4Below * PRICE_4_BELOW;
  const totalPax = pax12Plus + pax5To11 + pax4Below;
  const totalAmount = subtotal12Plus + subtotal5To11 + subtotal4Below;

  // Sequential receipt number (INV-YYYY.NNN)
  const nextReceiptNumber = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearPrefix = `INV-${currentYear}.`;
    let maxNum = 0;
    receipts.forEach(r => {
      if (r.receiptNo) {
        if (r.receiptNo.startsWith(yearPrefix)) {
          const numPart = parseInt(r.receiptNo.slice(yearPrefix.length), 10);
          if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
        } else if (r.receiptNo.includes(String(currentYear))) {
          const match = r.receiptNo.match(/(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
          }
        }
      }
    });
    return `${yearPrefix}${String(maxNum + 1).padStart(3, '0')}`;
  }, [receipts]);

  // Alumni Login Handler (from shared main AlumniAuthCard)
  const handleAlumniAuthSuccess = (member: AlumniMember) => {
    setLoggedInAlumni(member);
    setPhoneInput(member.noTelefon && member.noTelefon !== '-' ? member.noTelefon : '');
    setEmailInput(member.emel || '');
    if (onAlumniAuthenticated) {
      onAlumniAuthenticated(member);
    }
  };

  const handleAlumniLogout = () => {
    setLoggedInAlumni(null);
    setPhoneInput('');
    setEmailInput('');
  };

  const handleCopyPublicLink = async () => {
    try {
      await navigator.clipboard.writeText(publicRegistrationUrl);
      setCopiedPublicLink(true);
      setTimeout(() => setCopiedPublicLink(false), 2500);
    } catch {}
  };

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BANK_DETAILS.accountNo);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {}
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmitError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('Saiz fail terlalu besar. Sila muat naik fail di bawah 10MB.');
      return;
    }

    setProofFile(file);
    if (file.type.startsWith('image/')) {
      const objUrl = URL.createObjectURL(file);
      setProofPreviewUrl(objUrl);
    } else {
      setProofPreviewUrl('');
    }
  };

  const updatePax = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number) => {
    setter(prev => Math.max(0, Math.min(50, prev + delta)));
  };

  // Trigger Print Receipt
  const handlePrintReceipt = (receipt: ProgramReceipt) => {
    const originalTitle = document.title;
    document.title = receipt.receiptNo;
    setReceiptForPreview(receipt);

    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.error('Error printing receipt:', err);
      }
    }, 300);

    const restore = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    setTimeout(() => {
      document.title = originalTitle;
    }, 5000);
  };

  // Download HTML Receipt
  const handleDownloadReceiptHtml = (receipt: ProgramReceipt) => {
    const el = document.getElementById('homecoming-receipt-preview-box');
    const content = el ? el.innerHTML : '';
    const fullHtml = `<!DOCTYPE html>
<html lang="ms">
<head>
  <meta charset="utf-8">
  <title>${receipt.receiptNo} - RESIT RASMI BAYARAN</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm 10mm 10mm; }
    body { font-family: Arial, Helvetica, sans-serif; background: #ffffff; color: #000000; margin: 0; padding: 20px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body onload="window.print()">
  <div style="max-width: 780px; margin: 0 auto;">
    ${content}
  </div>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Resit_${receipt.receiptNo.replace(/[^a-zA-Z0-9.-]/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Submit Registration, Upload to Google Drive, Save & Generate Receipt
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const resolvedName =
      participantType === 'Alumni' ? (loggedInAlumni?.nama || '').trim() : lecturerName.trim().toUpperCase();
    const resolvedNoAhli = participantType === 'Alumni' ? (loggedInAlumni?.noAhli || '').trim() : '';

    if (participantType === 'Alumni' && !loggedInAlumni) {
      setSubmitError('Sila log masuk akaun Alumni terlebih dahulu sebelum menghantar pendaftaran.');
      return;
    }

    if (participantType === 'Pensyarah' && !resolvedName) {
      setSubmitError('Sila masukkan Nama Penuh Pensyarah.');
      return;
    }

    if (totalPax < 1) {
      setSubmitError('Sila pilih sekurang-kurangnya 1 orang peserta (pax).');
      return;
    }

    if (!proofFile) {
      setSubmitError('Sila muat naik bukti bayaran terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const todayIso = new Date().toISOString().substring(0, 10);
      const generatedReceiptNo = nextReceiptNumber;
      const resolvedRefNo = referenceNo.trim() || `HCN-${Date.now().toString().slice(-6)}`;
      const safeNameSlug = resolvedName.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);
      const ext = proofFile.name.includes('.') ? proofFile.name.split('.').pop() : 'png';
      const driveTargetFileName = `${generatedReceiptNo}_${participantType.toUpperCase()}_${safeNameSlug}.${ext}`;

      // 1. Read file base64 and attempt automatic upload to Google Drive folder
      const fileBase64 = await readFileAsBase64(proofFile);
      const previewThumb = await createCompressedImagePreview(proofFile);

      let driveFileId: string | undefined;
      let driveFileUrl: string | undefined;
      let driveSyncStatus: 'synced' | 'pending_script' | 'error' = 'pending_script';
      let driveSyncMessage = 'Disimpan dalam sistem. Sila lengkapkan URL Google Apps Script di tab Tetapan Google Drive untuk auto-simpan ke folder Drive.';

      try {
        const uploadRes = await fetch('/api/upload-drive-proof', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: driveTargetFileName,
            mimeType: proofFile.type || 'application/octet-stream',
            fileBase64,
            folderId: HOMECOMING_DRIVE_FOLDER_ID,
            appsScriptUrl: config.homecomingDriveScriptUrl || '',
            registrationData: {
              participantType,
              nama: resolvedName,
              noAhli: resolvedNoAhli,
              receiptNo: generatedReceiptNo,
              totalAmount
            }
          })
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success && uploadData.fileId) {
          driveFileId = uploadData.fileId;
          driveFileUrl = uploadData.fileUrl || `https://drive.google.com/file/d/${uploadData.fileId}/view`;
          driveSyncStatus = 'synced';
          driveSyncMessage = 'Bukti bayaran berjaya disimpan secara automatik ke Google Drive.';
        } else if (uploadData.code === 'NOT_CONFIGURED') {
          driveSyncStatus = 'pending_script';
          driveSyncMessage = uploadData.error || driveSyncMessage;
        } else {
          driveSyncStatus = 'error';
          driveSyncMessage = uploadData.error || 'Gagal memuat naik ke Google Drive.';
        }
      } catch (uploadErr: any) {
        driveSyncStatus = 'error';
        driveSyncMessage = uploadErr?.message || 'Sambungan ke servis Google Drive gagal.';
      }

      // 2. Build pax breakdown description
      const paxParts: string[] = [];
      if (pax12Plus > 0) paxParts.push(`12 tahun ke atas: ${pax12Plus} pax (RM${(pax12Plus * PRICE_12_PLUS).toFixed(2)})`);
      if (pax5To11 > 0) paxParts.push(`5-11 tahun: ${pax5To11} pax (RM${(pax5To11 * PRICE_5_TO_11).toFixed(2)})`);
      if (pax4Below > 0) paxParts.push(`4 tahun ke bawah: ${pax4Below} pax (Percuma)`);

      const categoryLabel =
        participantType === 'Alumni'
          ? `Alumni (${resolvedNoAhli || 'Ahli'})`
          : 'Pensyarah';

      const receiptDescription = `Tempahan ${program.namaProgram} [${categoryLabel}] — ${paxParts.join(', ')}`;

      // 3. Create & save official ProgramReceipt
      const newReceiptPayload: Omit<ProgramReceipt, 'id' | 'createdAt'> = {
        receiptNo: generatedReceiptNo,
        date: todayIso,
        payerName: resolvedName,
        payerIcOrReg: participantType === 'Alumni' ? `No. Ahli: ${resolvedNoAhli}` : 'Kategori: Pensyarah',
        payerPhone: phoneInput.trim(),
        payerEmail: emailInput.trim(),
        programName: (program.namaProgram || 'ALUMNI HOMECOMING NIGHT').toUpperCase(),
        programId: program.id,
        paymentCategory: `Pendaftaran Homecoming (${participantType})`,
        paymentMethod: `Pindahan Bank (${BANK_DETAILS.bank} - ${BANK_DETAILS.accountNo})`,
        referenceNo: resolvedRefNo,
        amount: totalAmount,
        description: receiptDescription,
        receivedBy: config.bendahari || 'SITI NURHAWA NABILAH BINTI FEDELIS',
        status: 'Lunas',
        autoLedgerSync: totalAmount > 0
      };

      await onAddReceipt(newReceiptPayload);

      // 4. Auto-sync to Finance Ledger if amount > 0
      if (totalAmount > 0) {
        await onAddTransaction({
          date: new Date().toISOString(),
          category: 'Aktiviti Persatuan',
          amount: totalAmount,
          type: 'Income',
          description: `[${generatedReceiptNo}] ${resolvedName} - ${(program.namaProgram || 'ALUMNI HOMECOMING NIGHT').toUpperCase()}`,
          receiptUrl: driveFileUrl || `resit_${generatedReceiptNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        });
      }

      // 5. Save Homecoming Registration Record
      const newReg: HomecomingRegistrationType = {
        id: `HCN-${Date.now()}`,
        participantType,
        nama: resolvedName,
        noAhli: resolvedNoAhli || undefined,
        noTelefon: phoneInput.trim() || undefined,
        emel: emailInput.trim() || undefined,
        pax12Plus,
        pax5To11,
        pax4Below,
        totalPax,
        totalAmount,
        referenceNo: resolvedRefNo,
        receiptNo: generatedReceiptNo,
        proofFileName: driveTargetFileName,
        proofMimeType: proofFile.type,
        driveFileId,
        driveFileUrl,
        proofPreviewDataUrl: driveFileUrl ? undefined : previewThumb,
        driveSyncStatus,
        driveSyncMessage,
        programName: program.namaProgram || 'Alumni Homecoming Night',
        createdAt: new Date().toISOString()
      };

      await onAddRegistration(newReg);
      setLatestRegistration(newReg);

      const fullReceiptForPreview: ProgramReceipt = {
        ...newReceiptPayload,
        id: `REC-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setReceiptForPreview(fullReceiptForPreview);

      // Reset form inputs (keep loggedInAlumni until user logs out or changes)
      setProofFile(null);
      setProofPreviewUrl('');
      setReferenceNo('');
      if (participantType === 'Pensyarah') {
        setLecturerName('');
        setPhoneInput('');
        setEmailInput('');
      }
      setPax12Plus(1);
      setPax5To11(0);
      setPax4Below(0);
    } catch (err: any) {
      setSubmitError(err?.message || 'Ralat semasa memproses pendaftaran. Sila cuba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDriveScriptUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriveSaveMsg('');
    const ok = await onUpdateConfig({
      ...config,
      homecomingDriveScriptUrl: driveScriptUrlInput.trim()
    });
    if (ok) {
      setDriveSaveMsg('URL Google Apps Script berjaya disimpan ke Firestore! Semua muat naik bukti bayaran kini akan auto-simpan ke Google Drive.');
    } else {
      setDriveSaveMsg('Gagal menyimpan tetapan. Sila cuba semula.');
    }
  };

  const handleCopyScriptSnippet = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
      setCopiedScriptCode(true);
      setTimeout(() => setCopiedScriptCode(false), 2500);
    } catch {}
  };

  const openReceiptFromRecord = (reg: HomecomingRegistrationType) => {
    const existing = receipts.find(r => r.receiptNo === reg.receiptNo);
    if (existing) {
      setLatestRegistration(reg);
      setReceiptForPreview(existing);
      return;
    }

    const paxParts: string[] = [];
    if (reg.pax12Plus > 0) paxParts.push(`12 tahun ke atas: ${reg.pax12Plus} pax (RM${(reg.pax12Plus * PRICE_12_PLUS).toFixed(2)})`);
    if (reg.pax5To11 > 0) paxParts.push(`5-11 tahun: ${reg.pax5To11} pax (RM${(reg.pax5To11 * PRICE_5_TO_11).toFixed(2)})`);
    if (reg.pax4Below > 0) paxParts.push(`4 tahun ke bawah: ${reg.pax4Below} pax (Percuma)`);

    setLatestRegistration(reg);
    setReceiptForPreview({
      id: `REC-${reg.id}`,
      receiptNo: reg.receiptNo,
      date: reg.createdAt.substring(0, 10),
      payerName: reg.nama,
      payerIcOrReg: reg.participantType === 'Alumni' ? `No. Ahli: ${reg.noAhli || '-'}` : 'Kategori: Pensyarah',
      payerPhone: reg.noTelefon || '',
      payerEmail: reg.emel || '',
      programName: (reg.programName || 'ALUMNI HOMECOMING NIGHT').toUpperCase(),
      paymentCategory: `Pendaftaran Homecoming (${reg.participantType})`,
      paymentMethod: `Pindahan Bank (${BANK_DETAILS.bank} - ${BANK_DETAILS.accountNo})`,
      referenceNo: reg.referenceNo,
      amount: reg.totalAmount,
      description: `Tempahan ${reg.programName} [${reg.participantType}] — ${paxParts.join(', ')}`,
      receivedBy: config.bendahari || 'SITI NURHAWA NABILAH BINTI FEDELIS',
      status: 'Lunas',
      createdAt: reg.createdAt
    });
  };

  // Summary Stats for List Tab
  const stats = useMemo(() => {
    return registrations.reduce(
      (acc, r) => {
        acc.totalBookings += 1;
        acc.totalPax += Number(r.totalPax || 0);
        acc.totalAmount += Number(r.totalAmount || 0);
        if (r.participantType === 'Alumni') acc.alumniCount += 1;
        else acc.lecturerCount += 1;
        return acc;
      },
      { totalBookings: 0, totalPax: 0, totalAmount: 0, alumniCount: 0, lecturerCount: 0 }
    );
  }, [registrations]);

  return (
    <div className="space-y-6">
      {/* SCREEN UI (Hidden during print) */}
      <div className="space-y-6 print:hidden">
        {/* Top Back Button & Hero Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-cyan-500/30 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-56 h-56 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              {!isPublicMode && onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-300 hover:text-white bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Menu Program</span>
                </button>
              )}

              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Pendaftaran Rasmi Program
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">
                {program.namaProgram || 'Alumni Homecoming Night'}
              </h1>

              <div className="flex flex-wrap gap-3 text-xs text-blue-100/90 font-medium pt-1">
                {program.tarikhProgram && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    {program.tarikhProgram}
                  </span>
                )}
                {program.masaProgram && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    {program.masaProgram}
                  </span>
                )}
                {program.tempatProgram && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {program.tempatProgram}
                  </span>
                )}
              </div>
            </div>

            {/* Sub-navigation Tabs (Admin sees all 3 tabs; public link sees ONLY registration) */}
            {!isPublicMode && (
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPageTab('register')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                    pageTab === 'register'
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Borang Pendaftaran</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPageTab('list')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                    pageTab === 'list'
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <ListChecks className="w-4 h-4" />
                  <span>Senarai ({registrations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPageTab('drive_setup')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all ${
                    pageTab === 'drive_setup'
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Google Drive</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Admin Shareable Public Link Bar */}
        {!isPublicMode && (
          <div className="bg-white/95 rounded-2xl border border-cyan-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="p-2.5 bg-cyan-50 text-cyan-700 rounded-xl shrink-0">
                <Link2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black text-cyan-800 uppercase tracking-wider">
                  Pautan Pendaftaran Awam (Untuk Diwarwarkan Kepada Alumni &amp; Pensyarah)
                </p>
                <p className="text-xs font-mono font-bold text-slate-700 truncate">{publicRegistrationUrl}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyPublicLink}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-extrabold rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedPublicLink ? 'Pautan Disalin!' : 'Salin Pautan'}</span>
              </button>
              <a
                href={publicRegistrationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-colors"
              >
                <span>Buka</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 1: BORANG PENDAFTARAN                                    */}
        {/* ============================================================ */}
        {pageTab === 'register' && (
          <div className="space-y-6">
            {/* Step 0: Pilihan Kategori Pendaftaran (1. Alumni | 2. Pensyarah) */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  Pilih Kategori Pendaftaran
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sila pilih kategori peserta untuk meneruskan pendaftaran program Alumni Homecoming Night.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setParticipantType('Alumni');
                    setSubmitError('');
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                    participantType === 'Alumni'
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      participantType === 'Alumni' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Pilihan 1</span>
                    <h3 className="text-base font-black text-slate-900">Alumni KKBS</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Log masuk menggunakan akaun alumni. Nama & No. Ahli akan diisi secara automatik.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setParticipantType('Pensyarah');
                    setSubmitError('');
                  }}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                    participantType === 'Pensyarah'
                      ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl shrink-0 ${
                      participantType === 'Pensyarah' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Pilihan 2</span>
                    <h3 className="text-base font-black text-slate-900">Pensyarah</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tidak perlu log masuk. Terus masukkan nama penuh dan pilih bilangan pax.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* ALUMNI LOGIN GATE (Main Portal Rasmi Alumni Login Card) */}
            {participantType === 'Alumni' && !loggedInAlumni && (
              <div className="py-2">
                <AlumniAuthCard
                  members={members}
                  onAlumniLoginSuccess={handleAlumniAuthSuccess}
                  onActivateMemberAccount={onActivateMemberAccount}
                  showAdminOption={false}
                  subtitleNote="Log masuk Portal Rasmi Alumni untuk meneruskan pendaftaran Alumni Homecoming Night. Nama dan No. Ahli anda akan diisi secara automatik."
                  onCancel={() => setParticipantType('Pensyarah')}
                />
              </div>
            )}

            {/* REGISTRATION FORM (Visible when Pensyarah selected OR Alumni logged in) */}
            {(participantType === 'Pensyarah' || (participantType === 'Alumni' && loggedInAlumni)) && (
              <form onSubmit={handleSubmitRegistration} className="space-y-6 max-w-4xl mx-auto">
                {/* 1. Maklumat Peserta */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                        1
                      </span>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        {participantType === 'Alumni' ? 'Maklumat Alumni (Auto-Isi)' : 'Maklumat Pensyarah'}
                      </h3>
                    </div>

                    {participantType === 'Alumni' && loggedInAlumni && (
                      <button
                        type="button"
                        onClick={handleAlumniLogout}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Tukar Alumni</span>
                      </button>
                    )}
                  </div>

                  {participantType === 'Alumni' && loggedInAlumni ? (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-800 text-xs font-bold">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Log masuk berjaya! Nama penuh dan No. Ahli anda telah dimasukkan secara automatik.</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                            Nama Penuh Alumni
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={loggedInAlumni.nama}
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-black text-slate-800 uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                            No. Ahli Alumni
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={loggedInAlumni.noAhli || '-'}
                            className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-black text-blue-700"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        Nama Penuh Pensyarah <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: PN. NURUL HIDAYAH BINTI AHMAD"
                        value={lecturerName}
                        onChange={(e) => setLecturerName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 uppercase focus:outline-blue-600"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        No. Telefon (Untuk Rekod Resit)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 012-3456789"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                        E-mel (Opsyen)
                      </label>
                      <input
                        type="email"
                        placeholder="contoh@gmail.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:outline-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pilih Bilangan Pax */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                      2
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Pilih Bilangan Pax
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Pilih bilangan kehadiran mengikut kategori umur.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* 12 tahun ke atas */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">12 Tahun ke Atas</h4>
                        <p className="text-xs font-bold text-blue-700">RM {PRICE_12_PLUS}.00 / seorang</p>
                      </div>
                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updatePax(setPax12Plus, -1)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={pax12Plus}
                            onChange={(e) => setPax12Plus(Math.max(0, Number(e.target.value) || 0))}
                            className="w-14 text-center bg-white border border-slate-300 rounded-lg py-1.5 text-sm font-black text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => updatePax(setPax12Plus, 1)}
                            className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="w-24 text-right text-sm font-black text-slate-800">
                          RM {subtotal12Plus.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* 5 - 11 tahun */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/70">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">5 – 11 Tahun</h4>
                        <p className="text-xs font-bold text-indigo-700">RM {PRICE_5_TO_11}.00 / seorang</p>
                      </div>
                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updatePax(setPax5To11, -1)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={pax5To11}
                            onChange={(e) => setPax5To11(Math.max(0, Number(e.target.value) || 0))}
                            className="w-14 text-center bg-white border border-slate-300 rounded-lg py-1.5 text-sm font-black text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => updatePax(setPax5To11, 1)}
                            className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="w-24 text-right text-sm font-black text-slate-800">
                          RM {subtotal5To11.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* 4 tahun ke bawah */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">4 Tahun ke Bawah</h4>
                        <p className="text-xs font-extrabold text-emerald-700">Percuma (RM 0.00)</p>
                      </div>
                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updatePax(setPax4Below, -1)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={pax4Below}
                            onChange={(e) => setPax4Below(Math.max(0, Number(e.target.value) || 0))}
                            className="w-14 text-center bg-white border border-slate-300 rounded-lg py-1.5 text-sm font-black text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => updatePax(setPax4Below, 1)}
                            className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="w-24 text-right text-sm font-black text-emerald-700">
                          PERCUMA
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Auto Jumlah & Maklumat Akaun Persatuan Alumni */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                      3
                    </span>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Auto Jumlah &amp; Buat Bayaran
                    </h3>
                  </div>

                  {/* Ringkasan Pax */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Kategori Peserta</span>
                      <strong className="text-slate-900 uppercase">{participantType}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>12 Tahun ke Atas ({pax12Plus} pax × RM90)</span>
                      <strong className="text-slate-900">RM {subtotal12Plus.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>5–11 Tahun ({pax5To11} pax × RM45)</span>
                      <strong className="text-slate-900">RM {subtotal5To11.toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>4 Tahun ke Bawah ({pax4Below} pax)</span>
                      <strong className="text-emerald-700">Percuma</strong>
                    </div>

                    <div className="border-t border-slate-200 pt-3 mt-2 flex justify-between items-baseline">
                      <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase">Jumlah Keseluruhan</span>
                        <span className="text-[11px] font-bold text-slate-500">Jumlah Pax: {totalPax} orang</span>
                      </div>
                      <span className="text-2xl font-black text-blue-700">RM {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Maklumat Akaun Bank Persatuan Alumni */}
                  <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-5 space-y-3 shadow-md">
                    <div className="flex items-center gap-2 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                      <Building2 className="w-4 h-4" />
                      <span>Sila Buat Bayaran Melalui Akaun Persatuan Alumni</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-blue-200">Bank:</span>
                        <strong className="text-white text-sm">{BANK_DETAILS.bank}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-200">Nama:</span>
                        <strong className="text-white text-sm">{BANK_DETAILS.accountName}</strong>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2 border-t border-blue-800/80">
                        <span className="text-blue-200">No. Akaun:</span>
                        <div className="flex items-center gap-2">
                          <strong className="font-mono text-lg text-cyan-300 tracking-wider">
                            {BANK_DETAILS.accountNo}
                          </strong>
                          <button
                            type="button"
                            onClick={handleCopyAccount}
                            className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="Salin nombor akaun"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{copiedAccount ? 'Disalin!' : 'Salin'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Muat Naik Bukti Bayaran */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                        4
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          Muat Naik Bukti Bayaran
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Auto simpan ke dalam fail Google Drive persatuan.
                        </p>
                      </div>
                    </div>

                    <a
                      href={HOMECOMING_DRIVE_FOLDER_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline bg-indigo-50 px-2.5 py-1 rounded-lg"
                    >
                      <HardDrive className="w-3.5 h-3.5" />
                      <span>Folder Google Drive</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">
                      No. Rujukan Transaksi Bank (Opsyen)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: RPP20261125001234"
                      value={referenceNo}
                      onChange={(e) => setReferenceNo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-800 focus:outline-blue-600"
                    />
                  </div>

                  <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-50/70 transition-colors">
                    <input
                      type="file"
                      id="homecoming-proof-input"
                      accept="image/*,.pdf"
                      onChange={handleProofFileChange}
                      className="hidden"
                    />
                    <label htmlFor="homecoming-proof-input" className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-extrabold text-slate-800">
                        {proofFile ? proofFile.name : 'Klik untuk muat naik resit / slip bayaran'}
                      </span>
                      <span className="text-xs text-slate-400">
                        Format disokong: JPG, PNG, WEBP atau PDF (Maksimum 10MB)
                      </span>
                    </label>

                    {proofPreviewUrl && (
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <img
                          src={proofPreviewUrl}
                          alt="Pratonton Bukti Bayaran"
                          className="max-h-56 rounded-xl border border-slate-200 shadow-xs object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Jana Resit Sebagai Bukti Tempahan */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center">
                      5
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        Jana Resit Sebagai Bukti Tempahan
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Tekan butang di bawah untuk menghantar borang dan menjana resit rasmi secara automatik.
                      </p>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Receipt className="w-5 h-5" />
                    <span>
                      {isSubmitting ? 'Sedang Memproses & Simpan ke Drive...' : 'Hantar & Jana Resit Sebagai Bukti Tempahan'}
                    </span>
                  </button>

                  <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                    Resit rasmi bayaran akan dijana serta-merta selepas borang dihantar untuk disimpan atau dicetak.
                  </p>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: SENARAI PENDAFTARAN HOMECOMING                        */}
        {/* ============================================================ */}
        {!isPublicMode && pageTab === 'list' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Tempahan</p>
                  <h4 className="text-lg font-black text-slate-800">{stats.totalBookings} Rekod</h4>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Pax</p>
                  <h4 className="text-lg font-black text-slate-800">{stats.totalPax} Orang</h4>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Jumlah Kutipan</p>
                  <h4 className="text-lg font-black text-emerald-700">RM {stats.totalAmount.toFixed(2)}</h4>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Pecahan Peserta</p>
                  <h4 className="text-xs font-black text-slate-800">
                    {stats.alumniCount} Alumni • {stats.lecturerCount} Pensyarah
                  </h4>
                </div>
              </div>
            </div>

            {/* Registrations Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap justify-between items-center gap-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Rekod Pendaftaran Alumni Homecoming Night
                </h3>
                <a
                  href={HOMECOMING_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Buka Folder Bukti Bayaran Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {registrations.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm font-bold">
                  Belum ada pendaftaran direkodkan.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-black">
                      <tr>
                        <th className="py-3 px-4">No. Resit</th>
                        <th className="py-3 px-4">Kategori &amp; Nama</th>
                        <th className="py-3 px-4">Pax</th>
                        <th className="py-3 px-4">Jumlah</th>
                        <th className="py-3 px-4">Bukti Google Drive</th>
                        <th className="py-3 px-4 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {registrations.map(reg => (
                        <tr key={reg.id} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                            {reg.receiptNo}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-1 ${
                                reg.participantType === 'Alumni'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}
                            >
                              {reg.participantType} {reg.noAhli ? `• ${reg.noAhli}` : ''}
                            </span>
                            <div className="font-extrabold text-slate-900 uppercase">{reg.nama}</div>
                            {reg.noTelefon && <div className="text-[10px] text-slate-500">{reg.noTelefon}</div>}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-700">
                            <div><strong>{reg.totalPax}</strong> pax</div>
                            <div className="text-[10px] text-slate-400">
                              ≥12t: {reg.pax12Plus} | 5–11t: {reg.pax5To11} | ≤4t: {reg.pax4Below}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-black text-emerald-700 whitespace-nowrap">
                            RM {Number(reg.totalAmount || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            {reg.driveFileUrl ? (
                              <a
                                href={reg.driveFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg"
                              >
                                <FileCheck2 className="w-3.5 h-3.5" />
                                <span>Lihat di Drive</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg inline-block">
                                {reg.proofFileName}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openReceiptFromRecord(reg)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Resit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Padam rekod pendaftaran '${reg.nama}'?`)) {
                                    onDeleteRegistration(reg.id);
                                  }
                                }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Padam rekod"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: TETAPAN AUTO-SIMPAN GOOGLE DRIVE                      */}
        {/* ============================================================ */}
        {!isPublicMode && pageTab === 'drive_setup' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Tetapan Auto-Simpan Google Drive
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sambungkan folder Google Drive rasmi supaya setiap bukti bayaran disimpan automatik ke dalam Drive anda.
                  </p>
                </div>
              </div>

              <a
                href={HOMECOMING_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Buka Folder Google Drive Sasaran</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <form onSubmit={handleSaveDriveScriptUrl} className="space-y-3">
              <label className="block text-xs font-black text-slate-700 uppercase">
                URL Web App Google Apps Script (Untuk Muat Naik Automatik)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={driveScriptUrlInput}
                  onChange={(e) => setDriveScriptUrlInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 focus:outline-blue-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan URL</span>
                </button>
              </div>
              {driveSaveMsg && (
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                  {driveSaveMsg}
                </p>
              )}
            </form>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs font-black text-slate-800 uppercase">
                  Kod Google Apps Script (Folder ID: {HOMECOMING_DRIVE_FOLDER_ID})
                </h4>
                <button
                  type="button"
                  onClick={handleCopyScriptSnippet}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedScriptCode ? 'Kod Disalin!' : 'Salin Kod Apps Script'}</span>
                </button>
              </div>
              <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1">
                <li>Buka <a href="https://script.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">script.google.com</a> dan cipta projek baharu.</li>
                <li>Tampal kod di bawah, klik <strong>Deploy &rarr; New deployment &rarr; Web app</strong>.</li>
                <li>Tetapkan <em>Execute as: Me</em> dan <em>Who has access: Anyone</em>, kemudian klik Deploy.</li>
                <li>Salin URL Web App (<code className="bg-slate-200 px-1 rounded">.../exec</code>) dan simpan dalam kotak di atas.</li>
              </ol>
              <pre className="bg-slate-900 text-cyan-200 p-3 rounded-xl text-[11px] overflow-x-auto max-h-60 font-mono">
                {APPS_SCRIPT_SNIPPET}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: PAPARAN & CETAKAN RESIT BUKTI TEMPAHAN                */}
      {/* ============================================================ */}
      {receiptForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:hidden">
          <div className="bg-slate-100 rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-300 overflow-hidden my-auto flex flex-col max-h-[92vh]">
            {/* Top Bar */}
            <div className="bg-slate-900 px-6 py-3.5 text-white flex items-center justify-between shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">
                    Pendaftaran Berjaya &amp; Resit Dijana: {receiptForPreview.receiptNo}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Sila cetak atau simpan PDF resit ini sebagai bukti tempahan program.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadReceiptHtml(receiptForPreview)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Muat Turun</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintReceipt(receiptForPreview)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReceiptForPreview(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drive Sync Status Banner */}
            {latestRegistration && (
              <div
                className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between gap-2 flex-wrap border-b ${
                  latestRegistration.driveSyncStatus === 'synced'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 shrink-0" />
                  <span>{latestRegistration.driveSyncMessage}</span>
                </div>
                <a
                  href={latestRegistration.driveFileUrl || HOMECOMING_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline font-extrabold"
                >
                  <span>{latestRegistration.driveFileUrl ? 'Buka Fail di Drive' : 'Buka Folder Drive'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Official Receipt Paper */}
            <div className="p-4 sm:p-8 overflow-y-auto bg-slate-200/80 flex justify-center">
              <div
                id="homecoming-receipt-preview-box"
                className="bg-white rounded-xl shadow-xl border border-slate-300 w-full max-w-[760px] p-6 sm:p-8"
              >
                <OfficialReceiptDocument receipt={receiptForPreview} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRINT-ONLY RECEIPT DOCUMENT */}
      {receiptForPreview && (
        <div
          id="homecoming-receipt-print-area"
          className="hidden print:block"
          style={{
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            color: '#000000',
            margin: '0 auto',
            padding: '0'
          }}
        >
          <OfficialReceiptDocument receipt={receiptForPreview} />
        </div>
      )}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 10mm 10mm !important;
        }
        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #root, main, div, table, tr, td, th {
            overflow: visible !important;
          }
          .print\\:hidden, .no-print, header, footer, nav, aside {
            display: none !important;
          }
          #homecoming-receipt-print-area {
            display: block !important;
            position: relative !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `
        }}
      />
    </div>
  );
};
