# React Example

A modern React web app built with **Vite**, **React 19**, **Tailwind CSS 4** and the **Google Gen AI SDK** (`@google/genai`).

## Features

- Fast development with Vite hot module reloading
- React 19 with TypeScript
- Tailwind CSS 4 styling via the official Vite plugin
- Gemini AI integration through `@google/genai`
- Smooth animations with `motion`
- Icon set from `lucide-react`
- Confetti effects with `canvas-confetti`
- Express server support for backend logic

## Tech Stack

| Area      | Technology                  |
|-----------|-----------------------------|
| Frontend  | React 19, TypeScript        |
| Build     | Vite 6                      |
| Styling   | Tailwind CSS 4              |
| AI        | Google Gen AI SDK           |
| Backend   | Express 4, dotenv           |
| Animation | Motion, canvas-confetti     |
| Icons     | Lucide React                |

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- npm (comes with Node.js)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the project root:

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

   The app runs at [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command           | Description                                  |
|-------------------|----------------------------------------------|
| `npm run dev`     | Start the dev server on port 3000            |
| `npm run build`   | Create a production build in `dist/`         |
| `npm run preview` | Preview the production build locally         |
| `npm run lint`    | Type-check the project with TypeScript       |
| `npm run clean`   | Remove `dist/` and `server.js`               |

## Project Structure

```
.
├── src/             # React components and app code
├── public/          # Static assets
├── index.html       # App entry HTML
├── vite.config.ts   # Vite configuration
├── tsconfig.json    # TypeScript configuration
└── package.json
```

## Deployment

1. Run `npm run build`
2. Deploy the generated `dist/` folder to any static host (Vercel, Netlify, GitHub Pages, etc.)

> Never commit your `.env` file. Make sure it is listed in `.gitignore`.

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "Add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.<img width="1254" height="1254" alt="Candy Crush 3D Candyland Logo" src="https://github.com/user-attachments/assets/d3a6cc2d-bc8e-4350-a7e6-8fee020d168e" />
