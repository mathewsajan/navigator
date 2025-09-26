import React from "react";

export const Frame = (): JSX.Element => {
  const screenshots = [
    {
      src: "/screenshot-2025-09-20-235100.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235123.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235138.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235155.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235207.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235227.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235246.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235259.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235321.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235333.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235622.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235635.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-20-235645.png",
      alt: "Screenshot",
    },
    {
      src: "/screenshot-2025-09-21-162813.png",
      alt: "Screenshot",
    },
  ];

  return (
    <div className="bg-white w-full min-h-screen p-8">
      <div className="grid grid-cols-4 gap-8 max-w-7xl mx-auto">
        {screenshots.map((screenshot, index) => (
          <div key={index} className="flex justify-center">
            <img
              className="w-full max-w-[460px] h-auto object-cover rounded-lg shadow-lg"
              alt={screenshot.alt}
              src={screenshot.src}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
