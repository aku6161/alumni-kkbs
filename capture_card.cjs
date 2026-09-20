const puppeteer = require('puppeteer');

(async () => {
  console.log('Memulakan Puppeteer...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1000 });

    console.log('Membuka laman web...');
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2' });

    console.log('Mencari butang Log Masuk Pentadbir (Admin)...');
    const buttons = await page.$$('button');
    let adminLinkButton = null;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Pentadbir')) {
        adminLinkButton = btn;
        break;
      }
    }

    if (!adminLinkButton) {
      throw new Error('Butang log masuk admin tidak dijumpai!');
    }

    await adminLinkButton.click();
    console.log('Mengklik pautan pentadbir, menunggu borang kata laluan...');
    await page.waitForSelector('form input[type="password"]');

    console.log('Mengisi kata laluan admin...');
    await page.type('form input[type="password"]', 'Alumni@89807');
    await page.click('form button[type="submit"]');

    console.log('Menunggu paparan pentadbir (admin dashboard) dimuatkan...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Mencari dan mengklik tab "Tetapan"...');
    const tabs = await page.$$('button');
    let settingsTab = null;
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.includes('Tetapan')) {
        settingsTab = tab;
        break;
      }
    }

    if (!settingsTab) {
      throw new Error('Tab "Tetapan" tidak dijumpai!');
    }

    await settingsTab.click();
    console.log('Menunggu kandungan tab "Tetapan" dipaparkan...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Mencari dan mengklik butang "Kemaskini"...');
    const actionButtons = await page.$$('button');
    let updateBtn = null;
    for (const btn of actionButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Kemaskini')) {
        updateBtn = btn;
        break;
      }
    }

    if (!updateBtn) {
      throw new Error('Butang "Kemaskini" tidak dijumpai!');
    }

    await updateBtn.click();
    console.log('Butang Kemaskini diklik, menunggu...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Ambil status disabled pengerusi input
    const inputsInfo = await page.evaluate(() => {
      const list = Array.from(document.querySelectorAll('input'));
      return list.map(input => ({
        label: input.previousElementSibling ? input.previousElementSibling.textContent : 'No Label',
        placeholder: input.placeholder,
        value: input.value,
        disabled: input.disabled
      }));
    });

    console.log('Status Inputs di Halaman:');
    console.log(JSON.stringify(inputsInfo, null, 2));

    console.log('Mengambil tangkapan skrin tetapan...');
    const outputPath = '/Users/shamsuddinamin/.gemini/antigravity-ide/brain/e5552137-0cb1-4184-9eb7-730c26132acf/scratch/settings_edit_debug.png';
    await page.screenshot({ path: outputPath });
    console.log(`Tangkapan skrin disimpan ke: ${outputPath}`);

  } catch (error) {
    console.error('Ralat berlaku:', error);
  } finally {
    await browser.close();
    console.log('Selesai.');
  }
})();
