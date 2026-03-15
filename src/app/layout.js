import "./globals.css";

export const metadata = {
  title: "Albion Online Black Market v1",
  description: "Albion Online Black Market için en karlı flip fırsatlarını bulan profesyonel trading aracı. Gerçek zamanlı veri analizi, vergi hesaplama ve akıllı taşıma listesi.",
  keywords: ["Albion Online", "Black Market", "Flip Finder", "Albion Kar Hesaplayıcı", "Market Trading Tool", "Albion Online Veri"],
  authors: [{ name: "Dijitalayi" }],
  openGraph: {
    title: "Albion Online Black Market v1",
    description: "Kâr marjlarını saniyeler içinde analiz edin ve gümüş kazancınızı katlayın.",
    type: "website",
    locale: "tr_TR",
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
