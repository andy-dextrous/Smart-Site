import React from "react";
import "./globals.css";

export const metadata = {
  description: "Wild Child Official App Starter",
  title: "Wild Child Official App Starter",
};

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props;

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
