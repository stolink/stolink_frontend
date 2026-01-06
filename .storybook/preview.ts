import type { Preview } from "@storybook/react";
import "../src/index.css"; // Enforce Tailwind global styles

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "cloud",
      values: [
        { name: "cloud", value: "#F1F0EC" },
        { name: "white", value: "#FFFFFF" },
        { name: "mocha", value: "#A47764" },
        { name: "espresso", value: "#3D302A" },
        { name: "dark", value: "#191815" },
      ],
    },
  },
};

export default preview;
