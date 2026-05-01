const Groq = require("groq-sdk");
const Note = require("../models/Note");
const axios = require("axios");
const pdfParse = require("pdf-parse");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const cloudinary = require("cloudinary").v2;
// Cloudinary config

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
// ─── SUMMARIZE NOTE ─────────────────────────────────────────
//const cloudinary = require('cloudinary').v2

const summarizeNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      "uploadedBy",
      "name",
    );

    if (!note) return res.status(404).json({ message: "Note nahi mila" });

    console.log("Note fileUrl:", note.fileUrl);

    // PDF fetch

    const response = await axios.get(note.fileUrl, {
      responseType: "arraybuffer",
    });

    const buffer = Buffer.from(response.data);

    const pdfData = await pdfParse(buffer);

    let extractedText = pdfData.text;

    extractedText = extractedText.replace(/\s+/g, " ").trim();

    console.log("Length:", extractedText.length);

    if (!extractedText || extractedText.length < 20) {
      return res.status(400).json({
        message: "PDF text extract nahi ho pa raha",
      });
    }

    // AI call
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Tu ek helpful study assistant hai. Summary clear aur Hinglish mein de. Key points bullet points mein likh.",
        },
        {
          role: "user",
          content: `Summarize karo:

Subject: ${note.subject}
Title: ${note.title}

Content:
${extractedText.substring(0, 4000)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    res.json({
      message: "Summary ready hai!",
      note: {
        id: note._id,
        title: note.title,
        subject: note.subject,
      },
      summary: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("AI Summarize error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ─── ASK QUESTION ────────────────────────────────────────────
const askQuestion = async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question || !context)
      return res
        .status(400)
        .json({ message: "Question aur context dono chahiye" });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Tu ek expert teacher hai. Answers clear aur detailed hone chahiye. Hinglish mein answer de.`,
        },
        {
          role: "user",
          content: `Notes:\n${context.substring(0, 6000)}\n\nQuestion: ${question}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    res.json({ question, answer: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GENERAL CHAT ────────────────────────────────────────────
const generalChat = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: "Message daalo" });

    const messages = [
      {
        role: "system",
        content: `Tu CampusHive ka AI assistant hai — NIT Kurukshetra ke students ke liye.
        - Academic questions mein help kar
        - Campus life ke baare mein baat kar  
        - Friendly aur helpful reh
        - Hinglish mein baat kar
        - Koi bhi inappropriate content mat bolna`,
      },
    ];

    if (history && history.length > 0) messages.push(...history.slice(-10));
    messages.push({ role: "user", content: message });

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.8,
      max_tokens: 1024,
    });

    res.json({
      message: completion.choices[0].message.content,
      role: "assistant",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getQuote = async (req, res) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "Tu ek motivational assistant hai. Short, powerful  quote Hinglish mein de (1-2 lines max).",
        },
        {
          role: "user",
          content: "Mujhe ek naya motivational/shayari quote de",
        },
      ],
      temperature: 0.9,
      max_tokens: 60,
    });

    res.json({
      quote: completion.choices[0].message.content,
    });
  } catch (error) {
    res.status(500).json({ quote: "Consistency hi success hai 🚀" });
  }
};

module.exports = { summarizeNote, askQuestion, generalChat, getQuote };
