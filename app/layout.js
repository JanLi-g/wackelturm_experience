import './globals.css';

export const metadata = {
  title: 'Wackelturm AR',
  description: 'Besucher-Landingpage und AR-Prototyp für den Wackelturm in Leipzig.',
};


export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

