import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import nodemailer from 'nodemailer';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Create nodemailer transporter
  let email = process.env.SMTP_EMAIL?.trim();
  
  // Force use of the correct email if the old Yahoo one is still in settings
  if (!email || email === 'ahmed_abd_alrazek@yahoo.com') {
    email = 'tamrazek.aaa@gmail.com';
    console.log(`[SMTP] Using target email: ${email} (Yahoo address detected or missing in settings)`);
  }

  // Google App Passwords are 16 chars, often shown as 4 blocks of 4.
  // We remove ALL whitespace and non-alphanumeric characters just in case.
  const password = process.env.SMTP_PASSWORD?.replace(/[^a-zA-Z0-9]/g, '');

  console.log("[SMTP] Initializing...");
  if (!password) {
    console.error("[SMTP] ERROR: SMTP_PASSWORD is not set in the Settings menu (gear icon).");
  } else {
    console.log(`[SMTP] Login Email: ${email}`);
    console.log(`[SMTP] Password Length: ${password.length} characters`);
    
    if (password.length !== 16) {
      console.warn("****************************************************************");
      console.warn(`[SMTP] WARNING: Your password is ${password.length} characters long.`);
      console.warn("[SMTP] Google App Passwords MUST be exactly 16 characters.");
      console.warn("[SMTP] If this is your regular Gmail password, it will NOT work.");
      console.warn("****************************************************************");
    }
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: password,
    },
    logger: true, // Log the SMTP conversation
    debug: true   // Include debug info
  });

  // Verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.error("****************************************************************");
      console.error("[SMTP] CONNECTION FAILED!");
      console.error("[SMTP] Error:", error.message);
      
      if (error.message.includes('535-5.7.8')) {
        console.error("****************************************************************");
        console.error("[SMTP] ACTION REQUIRED: Google rejected your login.");
        console.error(`[SMTP] CURRENT EMAIL IN SETTINGS: ${email}`);
        
        if (email.toLowerCase().includes('yahoo.com')) {
          console.error("[SMTP] CRITICAL: You are using a Yahoo email with Gmail's service.");
          console.error("[SMTP] THIS WILL NEVER WORK.");
          console.error("[SMTP] Please change SMTP_EMAIL to: tamrazek.aaa@gmail.com");
        } else {
          console.error("[SMTP] 1. Open the Settings menu (gear icon in top right).");
          console.error("[SMTP] 2. Change SMTP_EMAIL to: tamrazek.aaa@gmail.com");
          console.error("[SMTP] 3. Ensure SMTP_PASSWORD is a 16-character 'App Password' from that account.");
          console.error("[SMTP] 4. Click Save.");
        }
        console.error("****************************************************************");
      }
      console.error("****************************************************************");
    } else {
      console.log("****************************************************************");
      console.log("[SMTP] SUCCESS: Server is ready to send emails!");
      console.log("****************************************************************");
    }
  });

  // Test endpoint to manually trigger a connection check
  app.get('/api/test-email', async (req, res) => {
    console.log("[SMTP] Manual test triggered...");
    try {
      await transporter.verify();
      res.json({ success: true, message: "SMTP Connection is working perfectly!" });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "SMTP Connection failed", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
