import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://hollow.studio'),
  title: "Hollow Studio | Digital Design and Development",
  description: "Hollow Studio is a digital design and development studio that builds bold, unforgettable web experiences. We partner with brands that want to stand out, not blend in. From first idea to final build, our process is simple, intentional, and focused on performance.",
  keywords: ["web design", "web development", "digital agency", "Hollow Studio", "design studio", "development studio"],
  openGraph: {
    title: "Hollow Studio | Digital Design and Development",
    description: "Hollow Studio is a digital design and development studio that builds bold, unforgettable web experiences. We partner with brands that want to stand out, not blend in. From first idea to final build, our process is simple, intentional, and focused on performance.",
    url: "https://hollow.studio",
    siteName: "Hollow Studio",
    images: [
      {
        url: "https://hollow.studio/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hollow Studio Open Graph Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Hollow Studio',
    url: 'https://hollow.studio',
    logo: 'https://hollow.studio/logo.png',
    description: 'Digital design and development studio.',
    sameAs: [
      'https://www.instagram.com/hollowstudioco',
      'https://www.linkedin.com/company/hollowstudio',
    ],
    image: 'https://hollow.studio/og-image.jpg',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
    },
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
