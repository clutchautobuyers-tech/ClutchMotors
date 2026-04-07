require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies (25mb limit to support photo uploads)
app.use(express.json({ limit: '25mb' }));

// Serve static files from public/
app.use(express.static(path.join(__dirname, 'public')));

// Rate limit: max 5 form submissions per IP per 15 minutes
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /submit-quote — receives form data and sends email to owner
app.post('/submit-quote', submitLimiter, async (req, res) => {
  const { vin, year, make, model, mileage, condition, ownership, bank, name, email, phone, photos } = req.body;

  // Validate required fields
  if (!year || !make || !model || !mileage || !condition || !ownership || !name || !email || !phone) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  // Sanitize inputs
  const safe = (val) => String(val || '').trim().slice(0, 200);

  const needsBank = ownership === 'Financed' || ownership === 'Leased';
  if (needsBank && !bank) {
    return res.status(400).json({ success: false, error: 'Bank name is required for financed or leased vehicles.' });
  }

  const ownershipLine = needsBank
    ? `Ownership: ${safe(ownership)} — ${safe(bank)}`
    : `Ownership: ${safe(ownership)}`;

  const emailBody = [
    '🚗 New Quote Request — Clutch Auto Buyers',
    '',
    `Name: ${safe(name)}`,
    `Phone: ${safe(phone)}`,
    `Email: ${safe(email)}`,
    '',
    `Vehicle: ${safe(year)} ${safe(make)} ${safe(model)}`,
    `VIN: ${vin ? safe(vin).toUpperCase() : 'Not provided'}`,
    `Mileage: ${safe(mileage)}`,
    `Condition: ${safe(condition)}`,
    ownershipLine,
    '',
    'Reply or call to provide a quote.',
  ].join('\n');

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Build photo attachments from base64 data URLs
    const attachments = Array.isArray(photos)
      ? photos.slice(0, 5).map((p, i) => {
          const match = (p.dataUrl || '').match(/^data:(image\/\w+);base64,(.+)$/);
          if (!match) return null;
          return {
            filename: p.name || `photo-${i + 1}.jpg`,
            content: match[2],
            encoding: 'base64',
            contentType: match[1],
          };
        }).filter(Boolean)
      : [];

    await transporter.sendMail({
      from: `"Clutch Auto Buyers Form" <${process.env.GMAIL_USER}>`,
      to: process.env.ALERT_EMAIL,
      subject: `New Quote Request — ${safe(year)} ${safe(make)} ${safe(model)}`,
      text: emailBody,
      attachments,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Email error:', err.message);
    return res.status(500).json({ success: false, error: 'Failed to send notification. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`Clutch Auto Buy server running at http://localhost:${PORT}`);
});
