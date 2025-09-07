# Omniverse

Omniverse is a 2D multiplayer virtual world where users can interact with each other in real-time. This project is built with a modern web stack, featuring a React-based client and a Node.js WebSocket server, all managed within a Turborepo monorepo.

## Features

- **Real-time Multiplayer:** Interact with other users in a shared virtual space.
- **Character Customization:** Choose from a variety of characters.
- **In-Game Chat:** Communicate with other players in the same room.

## Tech Stack

- **Monorepo:** [Turborepo](https://turbo.build/repo)
- **Package Manager:** [pnpm](https://pnpm.io/)
- **Frontend:**
  - [React](https://react.dev/)
  - [Vite](https://vitejs.dev/)
  - [Phaser](https://phaser.io/) for the game engine
  - [Recoil](https://recoiljs.org/) for state management
  - [Tailwind CSS](https://tailwindcss.com/) for styling
- **Backend:**
  - [Node.js](https://nodejs.org/)
  - [WebSocket (`ws`)](https://github.com/websockets/ws) for real-time communication
- **Tooling:**
  - [TypeScript](https://www.typescriptlang.org/)
  - [ESLint](https://eslint.org/) for linting
  - [Prettier](https://prettier.io/) for code formatting
  - [esbuild](https://esbuild.github.io/) for bundling the server

## Project Structure

This Turborepo includes the following packages and applications:

- `apps/web`: The main web client for the game, built with React and Phaser.
- `apps/ws-server`: The WebSocket server that handles real-time communication between clients.
- `packages/ui`: A shared React component library.
- `packages/eslint-config`: Shared ESLint configurations.
- `packages/typescript-config`: Shared TypeScript configurations.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (v18 or higher)
- [pnpm](https://pnpm.io/installation)

### Installation

1.  Clone the repository:
    ```sh
    git clone https://github.com/Agnish1611/Omniverse.git
    ```
2.  Navigate to the project directory:
    ```sh
    cd Omniverse
    ```
3.  Install the dependencies:
    ```sh
    pnpm install
    ```

### Running in Development

To start the development servers for both the web client and the WebSocket server, run the following command from the root of the project:

```sh
pnpm dev
```

This will start:
- The web client on `http://localhost:5173`
- The WebSocket server on `ws://localhost:8080`

## Available Scripts

- `pnpm build`: Build all applications for production.
- `pnpm dev`: Run all applications in development mode.
- `pnpm lint`: Lint the codebase.
- `pnpm format`: Format the code with Prettier.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature`).
6.  Open a pull request.

## License

This project is licensed under the MIT License.
