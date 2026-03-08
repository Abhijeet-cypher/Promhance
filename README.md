# ✨ Promhance

> A sleek, AI-powered tool that transforms raw ideas into masterfully engineered LLM prompts.

**Promhance** uses the power of Google's Gemini API to take your rough sentences and automatically structure, refine, and optimize them into highly effective prompts. Whether you're prompting an LLM for code, generating images, or writing a story, Promhance ensures you get the most out of your AI tools.

---

## ⚡ Features

- **🎯 Specialized Modes**: Choose between specialized structures for general LLM instructions, Image Generation, Creative Writing, or Technical/Coding tasks.
- **🎛️ Intensity Slider**: Control the depth of the enhancement. Choose between:
  - **Low**: Light grammar cleanup and minimal clarity (1-2 sentences).
  - **Medium**: Standard detail adding role, format, audience, and scope.
  - **High**: Full specification including edge cases, explicit constraints, schemas, and examples.
- **📱 Fully Responsive Design**: A stunning, glassmorphic UI optimized for both desktop web browsers and mobile devices.
- **📋 Smart Copy**: One-click copy with modern clipboard support and robust fallbacks for all environments.
- **🌈 Beautiful Aesthetics**: Features a neon dark theme with dynamic gradients and shimmering hover states.

## 🛠️ Tech Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Engine**: [Google Gemini API (`@google/genai`)](https://ai.google.dev/)
- **Markdown**: `react-markdown`

---

## 🚀 Getting Started

Follow these steps to get Promhance running on your local machine:

### 1. Clone the repository

```bash
git clone https://github.com/your-username/promhance.git
cd promhance
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Setup Environment Variables

To use the AI enhancer, you need an API key from Google AI Studio.

1. Go to [Google AI Studio](https://aistudio.google.com/) and grab a Gemini API key.
2. In the root directory of this project, create a file named `.env.local`
3. Add your key to the file:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app in action!

---

## 💡 How it Works

Under the hood, Promhance intercepts your raw text and injects it into a carefully crafted meta-prompt depending on the **Mode** and **Intensity** you selected. It then tasks the `gemini-2.5-flash` model via a streaming serverless API route (`app/api/enhance/route.ts`) to reconstruct your text into its final, optimized form.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/promhance/issues) if you want to contribute.

## 📝 License

This project is licensed under the MIT License.
