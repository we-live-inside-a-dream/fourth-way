# Fourth Way Books

A professional website showcasing spiritual books and translations, focused on the Fourth Way and Gurdjieff teachings.

## 🌟 Features

- **Professional Design**: Elegant typography and deep, spiritual color palette.
- **Responsive Layout**: Fully responsive design that works on mobile, tablet, and desktop.
- **Modular SCSS**: Well-organized styles using SCSS variables, mixins, and components.
- **Fast Build System**: Powered by [Vite](https://vitejs.dev/) for instant dev server start and optimized builds.
- **Multi-page Architecture**: Separate HTML files for distinct sections (Home, Written, Translated, Contact).

## 🛠 Tech Stack

- **HTML5 & SCSS**: Semantic markup and advanced styling.
- **jQuery**: For simplified DOM manipulation and interactions.
- **Vite**: Next Generation Frontend Tooling.
- **Yarn**: Fast, reliable, and secure dependency management.

## 🚀 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository** (if applicable) or navigate to the project folder.
2. **Install dependencies**:

   ```bash
   yarn install
   ```

### Development

To start the local development server with hot module replacement:

```bash
yarn dev
```

The site will be available at `http://localhost:5173`.

### Build

To create a production-ready build:

```bash
yarn build
```

The compiled files will be in the `dist/` directory.

### Preview Production Build

To preview the built site locally:

```bash
yarn preview
```

## 📂 Project Structure

```
fourth-way/
├── public/              # Static assets (images, icons)
├── src/
│   ├── js/              # JavaScript files
│   │   └── main.js      # Main script entry point
│   ├── scss/            # SCSS Styles
│   │   ├── components/  # Reusable UI components (navbar, cards, etc.)
│   │   ├── pages/       # Page-specific styles
│   │   ├── _base.scss   # Reset and base styles
│   │   ├── _layout.scss # Global layout (header, footer)
│   │   ├── _mixins.scss # SCSS mixins
│   │   ├── _variables.scss # Design tokens (colors, fonts)
│   │   └── main.scss    # Main SCSS entry point
│   ├── index.html       # Home page
│   ├── books-written.html
│   ├── books-translated.html
│   └── contact.html
├── package.json         # Project dependencies and scripts
└── vite.config.js       # Vite configuration
```

## 🎨 Customization

- **Colors & Fonts**: Edit `src/scss/_variables.scss` to change the theme.
- **Content**: Edit the `.html` files in the `src/` directory.
- **Styles**: Add new components in `src/scss/components/` and import them in `main.scss`.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
