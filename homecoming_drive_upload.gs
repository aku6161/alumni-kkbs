/**
 * ============================================================================
 * SKRIP GOOGLE APPS SCRIPT - AUTO SIMPAN BUKTI BAYARAN KE GOOGLE DRIVE
 * PROGRAM: ALUMNI HOMECOMING NIGHT (PERSATUAN ALUMNI KKBS)
 * FOLDER ID: 1FeJfBi6hMg_8doCOaN3m7MCHc09cSiAa
 * ============================================================================
 * CARA PASANG (1 MINIT):
 * 1. Buka https://script.google.com/ dan klik "New Project".
 * 2. Tampal kod ini ke dalam Code.gs dan klik Save.
 * 3. Klik "Deploy" -> "New deployment" -> Pilih jenis "Web app".
 * 4. Execute as: "Me" | Who has access: "Anyone".
 * 5. Klik Deploy, benarkan akses Google Drive, dan salin Web App URL.
 * 6. Tampal URL tersebut dalam ruangan "Tetapan Google Drive" di halaman
 *    Pendaftaran Alumni Homecoming Night.
 * ============================================================================
 */

var HOMECOMING_FOLDER_ID = "1FeJfBi6hMg_8doCOaN3m7MCHc09cSiAa";

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      service: "Alumni Homecoming Night Drive Uploader",
      folderId: HOMECOMING_FOLDER_ID
    }))
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

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {}

    var reg = postData.registrationData || {};
    file.setDescription(
      "Bukti Bayaran Alumni Homecoming Night | Nama: " + (reg.nama || "-") +
      " | Kategori: " + (reg.participantType || "-") +
      " | No. Ahli: " + (reg.noAhli || "-") +
      " | No. Resit: " + (reg.receiptNo || "-") +
      " | Jumlah: RM " + (reg.totalAmount || 0)
    );

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
      .createTextOutput(JSON.stringify({
        success: false,
        error: err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
