/**
 * VeVit Edu — Certificate Generator (Canvas-based)
 * Generates downloadable PNG certificates using the Canvas API.
 */

/**
 * Generate a certificate canvas element.
 * @param {Object} data
 * @param {string} data.userName  — Full name, e.g. "Vít Vedral"
 * @param {string} data.userNick  — Nickname, e.g. "vitekeee"
 * @param {string} data.courseName — Course title, e.g. "Python"
 * @param {string} data.courseSlug — Course slug, e.g. "python"
 * @param {string} data.uuid      — Certificate UUID
 * @param {string} data.issuedAt  — ISO date string
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function generateCertificate(data) {
    // Load Sora font
    const font = new FontFace('Sora', "url(https://fonts.gstatic.com/s/sora/v12/xMQOuFFYT72X5wkB_18qmnndmSdSn3-KIwNhBti0.woff2)");
    await font.load();
    document.fonts.add(font);

    const W = 1200, H = 848;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    // ─── BACKGROUND ───
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Top stripe
    const topGrad = ctx.createLinearGradient(0, 0, W, 0);
    topGrad.addColorStop(0, '#10b981');
    topGrad.addColorStop(1, '#059669');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, 6);

    // Bottom stripe
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, H - 6, W, 6);

    // ─── BORDER ───
    ctx.strokeStyle = 'rgba(16,185,129,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, W - 40, H - 40);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.strokeRect(32, 32, W - 64, H - 64);

    // ─── LOGO ───
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "VeVit" + "Edu" on same line
    ctx.font = 'bold 26px Sora';
    const veVitWidth = ctx.measureText('VeVit').width;
    const eduWidth = ctx.measureText('Edu').width;
    const logoTotalWidth = veVitWidth + eduWidth;
    const logoStartX = 600 - logoTotalWidth / 2;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#10b981';
    ctx.fillText('VeVit', logoStartX, 80);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillText('Edu', logoStartX + veVitWidth, 80);

    // "edu.vevit.fun" below
    ctx.textAlign = 'center';
    ctx.font = '13px Sora';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('edu.vevit.fun', 600, 105);

    // ─── DIVIDER at y=140 ───
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(100, 140); ctx.lineTo(1100, 140); ctx.stroke();

    // ─── CERTIFICATE LABEL ───
    ctx.textAlign = 'center';
    const labelText = 'CERTIFIKÁT O DOKONČENÍ';
    ctx.font = '11px Sora';
    ctx.fillStyle = '#6b7280';
    // Manual letter spacing
    let lx = 600 - (labelText.length * 9) / 2;
    for (const ch of labelText) {
        ctx.fillText(ch, lx, 175);
        lx += ctx.measureText(ch).width + 4;
    }

    // ─── STUDENT NAME ───
    ctx.textAlign = 'center';
    let nameSize = 58;
    ctx.font = `bold ${nameSize}px Sora`;
    while (ctx.measureText(data.userName).width > 900 && nameSize > 34) {
        nameSize -= 4;
        ctx.font = `bold ${nameSize}px Sora`;
    }
    ctx.fillStyle = '#f0f0f0';
    ctx.fillText(data.userName, 600, 270);

    // ─── "úspěšně dokončil/a kurz" ───
    ctx.font = '18px Sora';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('úspěšně dokončil/a kurz', 600, 330);

    // ─── COURSE NAME ───
    let courseSize = 40;
    ctx.font = `bold ${courseSize}px Sora`;
    while (ctx.measureText(data.courseName).width > 900 && courseSize > 30) {
        courseSize -= 4;
        ctx.font = `bold ${courseSize}px Sora`;
    }
    ctx.fillStyle = '#10b981';
    ctx.fillText(data.courseName, 600, 400);

    // ─── DIVIDER at y=450 ───
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(100, 450); ctx.lineTo(1100, 450); ctx.stroke();

    // ─── BOTTOM INFO ROW ───

    // Left block: DATE
    ctx.textAlign = 'center';
    ctx.font = '10px Sora';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('DATUM VYDÁNÍ', 200, 520);

    const dateStr = new Intl.DateTimeFormat('cs-CZ', {
        day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(data.issuedAt));
    ctx.font = 'bold 14px Sora';
    ctx.fillStyle = '#f0f0f0';
    ctx.fillText(dateStr, 200, 545);

    // Center block: V logo + "Vít Vedral"
    ctx.textAlign = 'center';
    // Draw small V chevron
    const cx = 600, cy = 510;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 8);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx + 10, cy - 8);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.font = '11px Sora';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText('Vít Vedral', 600, 540);

    // Right block: ID
    ctx.font = '10px Sora';
    ctx.fillStyle = '#6b7280';
    ctx.fillText('ID CERTIFIKÁTU', 1000, 520);

    ctx.font = '12px Sora';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(data.uuid.substring(0, 8).toUpperCase(), 1000, 545);

    // ─── SEAL (bottom-right) ───
    const sealX = 1070, sealY = 700;
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(16,185,129,0.12)';
    ctx.beginPath(); ctx.arc(sealX, sealY, 48, 0, Math.PI * 2); ctx.stroke();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(16,185,129,0.2)';
    ctx.beginPath(); ctx.arc(sealX, sealY, 38, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = 'rgba(16,185,129,0.08)';
    ctx.beginPath(); ctx.arc(sealX, sealY, 28, 0, Math.PI * 2); ctx.fill();

    ctx.font = 'bold 28px Sora';
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', sealX, sealY);

    return canvas;
}

/**
 * Download the certificate as a PNG file.
 * @param {Object} data — same shape as generateCertificate
 */
export async function downloadCertificate(data) {
    const canvas = await generateCertificate(data);
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vevit-certifikat-${data.courseSlug}-${data.userNick}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }, 'image/png');
}

/**
 * Copy the certificate verification URL to clipboard.
 * @param {string} uuid — certificate UUID
 */
export async function shareCertificate(uuid) {
    const url = `https://edu.vevit.fun/pages/certifikat.html?uuid=${uuid}`;
    await navigator.clipboard.writeText(url);
}